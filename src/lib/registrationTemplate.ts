import { supabase } from "./supabase";
import { todayLocalIso } from "./dates";
// عدد الصفوف اللي عليها قوائم منسدلة وتحقق
const MAX_ROWS = 1000;

// لازم تفضل بنفس الأسماء اللي صفحة الإضافة بتدوّر عليها
const HEADERS = [
  "الرقم العسكري",
  "الدرجة",
  "الاسم",
  "فئة الفرد",
  "الوحدة الاساسية",
  "الموقف الخدمي",
  "تاريخ التسريح",
  "الوظيفة",
  "جهة الالحاق",
];

const COLUMN_WIDTHS = [20, 16, 36, 12, 30, 18, 16, 26, 30];

const colLetter = (index: number) => String.fromCharCode(65 + index);

function toUtcDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function downloadRegistrationTemplate(): Promise<void> {
  // =====================================================
  // ١) القوائم من المنظومة
  // =====================================================
  const [ranksRes, categoriesRes, unitsRes, statusesRes, batchesRes, jobsRes] =
    await Promise.all([
      supabase.from("ranks").select("name, code, sort_order").eq("is_active", true).order("sort_order"),
      supabase.from("personnel_categories").select("name").eq("is_active", true).order("name"),
      supabase.from("units").select("name, unit_type").eq("is_active", true).order("name"),
      supabase.from("service_statuses").select("name").eq("is_active", true).order("name"),
      supabase.from("reserve_batches").select("batch_date").eq("is_active", true).order("batch_date"),
      supabase.from("jobs").select("name").order("name"),
    ]);

  const firstError =
    ranksRes.error ?? categoriesRes.error ?? unitsRes.error ?? statusesRes.error ?? batchesRes.error ?? jobsRes.error;

  if (firstError) throw firstError;

  const clean = (v: unknown) => String(v ?? "").trim();

  // ملازم شرف رتبة خروج (نقل لشؤون الضباط) ومش بيتقيد بيها فرد جديد
  const ranks = (ranksRes.data ?? [])
    .filter((r: any) => r.code !== "HONORARY_LIEUTENANT")
    .map((r: any) => clean(r.name));

  const categories = (categoriesRes.data ?? []).map((c: any) => clean(c.name));
  const allUnits = (unitsRes.data ?? []).map((u: any) => clean(u.name));
  const mainUnits = (unitsRes.data ?? [])
    .filter((u: any) => String(u.unit_type ?? "").toUpperCase() === "MAIN")
    .map((u: any) => clean(u.name));
  const statuses = (statusesRes.data ?? []).map((s: any) => clean(s.name));
  const dates = (batchesRes.data ?? []).map((b: any) => toUtcDate(b.batch_date));
  const jobs = (jobsRes.data ?? []).map((j: any) => clean(j.name));

  // =====================================================
  // ٢) بناء الملف
  // =====================================================
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "المنظومة الإلكترونية لفرع التنظيم والإدارة";
  wb.created = new Date();

  // الترتيب مهم: الصفحة بتقرا أول شيت
  const data = wb.addWorksheet("Data", {
    views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
  });
  const guide = wb.addWorksheet("تعليمات", { views: [{ rightToLeft: true }] });
  const lists = wb.addWorksheet("Lists", { views: [{ rightToLeft: true }] });

  // ---------- شيت القوائم ----------
  const listDefs: { key: string; title: string; values: (string | Date)[] }[] = [
    { key: "ranks", title: "الدرجات", values: ranks },
    { key: "categories", title: "فئة الفرد", values: categories },
    { key: "mainUnits", title: "الوحدات الأساسية", values: mainUnits },
    { key: "statuses", title: "الموقف الخدمي", values: statuses },
    { key: "dates", title: "تواريخ التسريح (دفعات الرديف)", values: dates },
    { key: "jobs", title: "الوظائف", values: jobs },
    { key: "attachUnits", title: "جهات الإلحاق", values: allUnits },
  ];

  const ranges: Record<string, string> = {};

  listDefs.forEach((def, i) => {
    const col = colLetter(i);
    const head = lists.getCell(`${col}1`);
    head.value = def.title;
    head.font = { bold: true };

    def.values.forEach((value, j) => {
      const cell = lists.getCell(`${col}${j + 2}`);
      cell.value = value;
      if (value instanceof Date) cell.numFmt = "yyyy-mm-dd";
    });

    lists.getColumn(i + 1).width = 32;
    ranges[def.key] = `Lists!$${col}$2:$${col}$${Math.max(2, def.values.length + 1)}`;
  });

  lists.state = "hidden";

  // ---------- شيت البيانات ----------
  HEADERS.forEach((header, i) => {
    const cell = data.getCell(1, i + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00522E" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    data.getColumn(i + 1).width = COLUMN_WIDTHS[i];
  });

  data.getRow(1).height = 28;
  data.getColumn(1).numFmt = "@"; // الرقم العسكري نص علشان يفضل ١٣ رقم زي ما هو
  data.getColumn(7).numFmt = "yyyy-mm-dd";

  const lastRow = MAX_ROWS + 1;

  const listRule = (rangeKey: string, title: string) => ({
    type: "list" as const,
    allowBlank: true,
    formulae: [ranges[rangeKey]],
    showErrorMessage: true,
    errorStyle: "error" as const,
    errorTitle: "قيمة غير صحيحة",
    error: `اختر ${title} من القائمة`,
  });

  for (let r = 2; r <= lastRow; r += 1) {
    // الرقم العسكري: ١٣ رقم ومش متكرر
    data.getCell(`A${r}`).dataValidation = {
      type: "custom",
      allowBlank: true,
      formulae: [`AND(LEN(A${r})=13,ISNUMBER(--A${r}),COUNTIF($A$2:$A$${lastRow},A${r})=1)`],
      showErrorMessage: true,
      errorStyle: "error",
      errorTitle: "رقم عسكري غير صحيح",
      error: "الرقم العسكري لازم يكون ١٣ رقم ومش متكرر في الكشف",
    };

    // الاسم رباعي على الأقل
    data.getCell(`C${r}`).dataValidation = {
      type: "custom",
      allowBlank: true,
      formulae: [`LEN(TRIM(C${r}))-LEN(SUBSTITUTE(TRIM(C${r})," ",""))>=3`],
      showErrorMessage: true,
      errorStyle: "error",
      errorTitle: "الاسم غير مكتمل",
      error: "الاسم لازم يكون رباعي على الأقل",
    };

    data.getCell(`B${r}`).dataValidation = listRule("ranks", "الدرجة");
    data.getCell(`D${r}`).dataValidation = listRule("categories", "فئة الفرد");
    data.getCell(`E${r}`).dataValidation = listRule("mainUnits", "الوحدة الأساسية");
    data.getCell(`F${r}`).dataValidation = listRule("statuses", "الموقف الخدمي");
    data.getCell(`G${r}`).dataValidation = listRule("dates", "تاريخ التسريح");
    data.getCell(`H${r}`).dataValidation = listRule("jobs", "الوظيفة");
    data.getCell(`I${r}`).dataValidation = listRule("attachUnits", "جهة الإلحاق");
  }

  // ---------- شيت التعليمات ----------
  guide.getColumn(1).width = 110;

  const rules = [
    "تعليمات تعبئة كشف القيد الموحد",
    "",
    `• الكشف ده اتولّد من المنظومة بتاريخ ${new Date().toLocaleDateString("ar-EG")}، والقوائم فيه محدّثة لحظة التحميل.`,
    "• لو اتضافت دفعة رديف أو وحدة أو وظيفة جديدة بعد كده، حمّل نموذج جديد.",
    "• املأ شيت (Data) بس، ومتغيرش أسماء الأعمدة.",
    "",
    "• الرقم العسكري: ١٣ رقم، ومينفعش يتكرر في نفس الكشف.",
    "• الاسم: رباعي على الأقل.",
    "• المجند: الدرجة (جندي) أو (عريف مجند) بس، وتاريخ التسريح إجباري.",
    "• المتطوع: الدرجة من (عريف) لـ (مساعد أول)، وتاريخ التسريح يتساب فاضي.",
    "• تاريخ التسريح: لو الموقف (منتهي خدمته) لازم دفعة عدّى تاريخها، وغير كده لازم دفعة لسه جاية.",
    "• جهة الإلحاق: إجبارية لو الموقف (ملحق)، وتتساب فاضية لو الموقف (قوة الوحدة).",
    "• الوظيفة: اختيارية.",
    "",
    "• الرقم العسكري الموجود قبل كده في المنظومة هيتحدّث بياناته، والجديد هيتقيد كفرد جديد.",
  ];

  rules.forEach((text, i) => {
    const cell = guide.getCell(`A${i + 1}`);
    cell.value = text;
    cell.alignment = { horizontal: "right", wrapText: true };
    if (i === 0) cell.font = { bold: true, size: 14 };
  });

  // =====================================================
  // ٣) التحميل
  // =====================================================
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `نموذج القيد الموحد ${todayLocalIso()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}