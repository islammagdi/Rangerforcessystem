import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowRight, CalendarPlus, Check, Printer, RotateCcw, Save, Trash2 } from "lucide-react";
import logoImg from "../../assets/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";
import { toArabicDigits } from "../../lib/normalizeDigits";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/logActivity";
import { usePermissions } from "../../lib/usePermissions";
import {
  PHASE_STATUS_LABELS,
  RECRUIT_CATEGORIES,
  RECRUIT_LEVELS,
  addDay,
  cellKey,
  deleteDay,
  deletePhase,
  fetchPhaseDetail,
  phaseCategories,
  saveArrivals,
  saveTargets,
  updatePhaseStatus,
  type RecruitPhaseStatus,
  type RecruitArrival,
  type RecruitCategory,
  type RecruitLevel,
  type RecruitPhase,
  type RecruitTarget,
} from "../../lib/recruitArrivals";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

const BORDER = "1px solid #e2e7f0";

// =====================================================
// Helpers
// =====================================================

function todayLocalISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${Number(d)}/${Number(m)}/${y}`;
}

function categoryLabel(key: RecruitCategory): string {
  return RECRUIT_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

async function logAction(
  actionType: string,
  action: string,
  details: string
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    const userName =
      profile?.username ?? sessionStorage.getItem("username") ?? "مستخدم غير معروف";

    await logActivity({
      userId: user.id,
      userName,
      actionType,
      action,
      entity: "تسجيل وصول المجندين",
      details: `${details} بواسطة ${userName}`,
    } as any);
  } catch {
    // فشل التسجيل في السجل مايمنعش العملية الأصلية
  }
}

// خلية رقم قابلة للتعديل
function NumCell({
  value,
  editable,
  onChange,
  bold = false,
  invalid = false,
}: {
  value: string;
  editable: boolean;
  onChange: (raw: string) => void;
  bold?: boolean;
  invalid?: boolean;
}) {
  if (!editable) {
    return (
      <span style={{ ...F, fontSize: 15, fontWeight: bold ? 700 : 400, color: "#2d3648" }}>
        {value === "" ? 0 : value}
      </span>
    );
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => e.target.select()}
      className={`w-full h-[36px] text-center rounded-[6px] border outline-none bg-transparent focus:bg-white ${
        invalid
          ? "border-[#e3282c]"
          : "border-transparent hover:border-[#e2e7f0] focus:border-[#00b867]"
      }`}
      style={{
        ...F,
        fontSize: 15,
        fontWeight: bold ? 700 : 400,
        color: invalid ? "#e3282c" : "#2d3648",
        minWidth: 56,
      }}
    />
  );
}

// =====================================================
// الصفحة
// =====================================================

export function RecruitArrivalDetailPage() {
  const { phaseId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission("recruit_arrivals:edit");
  const canDelete = hasPermission("recruit_arrivals:delete");

  const [phase, setPhase] = useState<RecruitPhase | null>(null);
  const [targets, setTargets] = useState<RecruitTarget[]>([]);
  const [arrivals, setArrivals] = useState<RecruitArrival[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // تعديلات لسه ما اتحفظتش
  const [arrivalDraft, setArrivalDraft] = useState<Record<string, string>>({});
  const [targetDraft, setTargetDraft] = useState<Record<string, string>>({});

  const [newDate, setNewDate] = useState(todayLocalISO());
  const [addingDay, setAddingDay] = useState(false);

  const [statusSaving, setStatusSaving] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printWithRemaining, setPrintWithRemaining] = useState(false);

  // -----------------------------------------------------
  // تحميل البيانات
  // -----------------------------------------------------

  async function load() {
    if (!phaseId) return;

    try {
      const data = await fetchPhaseDetail(phaseId);
      setPhase(data.phase);
      setTargets(data.targets);
      setArrivals(data.arrivals);
      setError("");
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل المرحلة");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseId]);

  const isDirty =
    Object.keys(arrivalDraft).length > 0 || Object.keys(targetDraft).length > 0;

  // تنبيه المتصفح لو فيه تعديلات غير محفوظة وقفل التبويب
  useEffect(() => {
    if (!isDirty) return;

    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // -----------------------------------------------------
  // بيانات مشتقة
  // -----------------------------------------------------

  const categories = useMemo(() => (phase ? phaseCategories(phase) : []), [phase]);

  const columns = useMemo(
    () =>
      categories.flatMap((category) =>
        RECRUIT_LEVELS.map((level) => ({
          category,
          level: level.key,
          levelLabel: level.label,
          key: cellKey(category, level.key),
        }))
      ),
    [categories]
  );

  const savedTargets = useMemo(() => {
    const map = new Map<string, number>();
    targets.forEach((t) => map.set(cellKey(t.category, t.level), t.total));
    return map;
  }, [targets]);

  const savedArrivals = useMemo(() => {
    const map = new Map<string, number>();
    arrivals.forEach((a) =>
      map.set(`${a.arrival_date}|${cellKey(a.category, a.level)}`, a.count)
    );
    return map;
  }, [arrivals]);

  const dates = useMemo(
    () => Array.from(new Set(arrivals.map((a) => a.arrival_date))).sort(),
    [arrivals]
  );

  // آخر يوم مسجل في الشيت (التواريخ مرتبة تصاعديًا)
  const lastDate = dates.length > 0 ? dates[dates.length - 1] : null;

  function targetStr(ck: string): string {
    if (ck in targetDraft) return targetDraft[ck];
    return String(savedTargets.get(ck) ?? 0);
  }

  function arrivalStr(date: string, ck: string): string {
    const k = `${date}|${ck}`;
    if (k in arrivalDraft) return arrivalDraft[k];
    return String(savedArrivals.get(k) ?? 0);
  }

  const targetNum = (ck: string) => Number(targetStr(ck)) || 0;
  const arrivalNum = (date: string, ck: string) => Number(arrivalStr(date, ck)) || 0;

  function columnArrived(ck: string): number {
    return dates.reduce((sum, d) => sum + arrivalNum(d, ck), 0);
  }

  const rowTotalOf = (fn: (ck: string) => number) =>
    columns.reduce((sum, c) => sum + fn(c.key), 0);

  const grandTarget = rowTotalOf(targetNum);
  const grandArrived = rowTotalOf(columnArrived);
  const grandRemaining = grandTarget - grandArrived;

  // مجموع أعمدة فئة معينة
  const sumCategory = (cat: RecruitCategory, fn: (ck: string) => number) =>
    columns
      .filter((c) => c.category === cat)
      .reduce((sum, c) => sum + fn(c.key), 0);

  // لو فيه فئة واحدة بس (صاعقة فقط أو مشاه شروط خاصة فقط) منعرضش عمود إجمالي الفئة
  const showCatTotal = categories.length > 1;
  const totalColsCount =
    columns.length + (showCatTotal ? categories.length : 0) + 2;

  // -----------------------------------------------------
  // التعديل
  // -----------------------------------------------------

  function handleTargetChange(ck: string, raw: string) {
    const digits = raw.replace(/[^0-9]/g, "");
    const saved = savedTargets.get(ck) ?? 0;

    setTargetDraft((prev) => {
      const next = { ...prev };
      if (Number(digits || 0) === saved) {
        delete next[ck];
      } else {
        next[ck] = digits;
      }
      return next;
    });
    setMessage("");
  }

  function handleArrivalChange(date: string, ck: string, raw: string) {
    let digits = raw.replace(/[^0-9]/g, "");
    const k = `${date}|${ck}`;
    const saved = savedArrivals.get(k) ?? 0;

    // الحد الأقصى = إجمالي الدفعة للعمود - وصول باقي الأيام
    const otherDays = columnArrived(ck) - arrivalNum(date, ck);
    const maxAllowed = Math.max(0, targetNum(ck) - otherDays);

    if (Number(digits || 0) > maxAllowed) {
      digits = String(maxAllowed);
      setError(
        `لا يمكن تجاوز إجمالي الدفعة لهذه الخانة (الحد الأقصى المتاح لهذا اليوم: ${maxAllowed})`
      );
    } else {
      setError("");
    }

    setArrivalDraft((prev) => {
      const next = { ...prev };
      if (Number(digits || 0) === saved) {
        delete next[k];
      } else {
        next[k] = digits;
      }
      return next;
    });
    setMessage("");
  }

  async function handleSave() {
    if (!phase || saving || !isDirty) return;

    const invalidColumn = columns.find(
      (c) => columnArrived(c.key) > targetNum(c.key)
    );

    if (invalidColumn) {
      setError(
        `لا يمكن الحفظ: وصول "${categoryLabel(invalidColumn.category)} - ${invalidColumn.levelLabel}" أكبر من إجمالي الدفعة`
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const arrivalRows = Object.entries(arrivalDraft).map(([k, v]) => {
        const [date, ck] = k.split("|");
        const [category, level] = ck.split(":");
        return {
          arrival_date: date,
          category: category as RecruitCategory,
          level: level as RecruitLevel,
          count: Number(v) || 0,
        };
      });

      const targetRows = Object.entries(targetDraft).map(([ck, v]) => {
        const [category, level] = ck.split(":");
        return {
          category: category as RecruitCategory,
          level: level as RecruitLevel,
          total: Number(v) || 0,
        };
      });

      if (arrivalRows.length > 0) await saveArrivals(phase.id, arrivalRows);
      if (targetRows.length > 0) await saveTargets(phase.id, targetRows);

      await load();
      setArrivalDraft({});
      setTargetDraft({});
      setMessage("تم حفظ التعديلات");

      const parts: string[] = [];
      if (arrivalRows.length > 0) parts.push(`${arrivalRows.length} خانة وصول`);
      if (targetRows.length > 0) parts.push(`${targetRows.length} خانة من إجمالي الدفعة`);

      await logAction(
        "UPDATE",
        "تعديل أرقام مرحلة تجنيدية",
        `تم تعديل ${parts.join(" و")} في المرحلة "${phase.name}"`
      );
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddDay() {
    if (!phase || addingDay) return;

    if (!newDate) {
      setError("اختر التاريخ");
      return;
    }

    if (dates.includes(newDate)) {
      setError("اليوم ده مسجل بالفعل في الشيت");
      return;
    }

    setAddingDay(true);
    setError("");
    setMessage("");

    try {
      await addDay(phase.id, newDate, categories);
      await load();

      await logAction(
        "CREATE",
        "إضافة يوم لمرحلة تجنيدية",
        `تمت إضافة يوم ${formatDate(newDate)} إلى المرحلة "${phase.name}"`
      );
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إضافة اليوم");
    } finally {
      setAddingDay(false);
    }
  }

  async function handleDeleteDay(date: string) {
    if (!phase) return;

    if (!window.confirm(`هل تريد حذف يوم ${formatDate(date)} بكل أرقامه؟`)) return;

    setError("");
    setMessage("");

    try {
      await deleteDay(phase.id, date);

      setArrivalDraft((prev) => {
        const next: Record<string, string> = {};
        Object.entries(prev).forEach(([k, v]) => {
          if (!k.startsWith(`${date}|`)) next[k] = v;
        });
        return next;
      });

      await load();

      await logAction(
        "DELETE",
        "حذف يوم من مرحلة تجنيدية",
        `تم حذف يوم ${formatDate(date)} من المرحلة "${phase.name}"`
      );
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حذف اليوم");
    }
  }

  async function handleDeletePhase() {
    if (!phase) return;

    if (
      !window.confirm(
        `هل تريد حذف المرحلة "${phase.name}" بكل أهدافها وأرقام وصولها؟ لا يمكن التراجع عن ذلك.`
      )
    )
      return;

    try {
      await deletePhase(phase.id);

      await logAction(
        "DELETE",
        "حذف مرحلة تجنيدية",
        `تم حذف المرحلة التجنيدية "${phase.name}"`
      );

      setArrivalDraft({});
      setTargetDraft({});
      navigate("/dashboard/recruit-arrivals");
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حذف المرحلة");
    }
  }

  async function handleChangeStatus(next: RecruitPhaseStatus) {
    if (!phase || statusSaving) return;

    if (isDirty) {
      setError("احفظ التعديلات أولًا قبل تغيير حالة المرحلة");
      return;
    }

    const confirmText =
      next === "arrived"
        ? `هل تريد تحديث المرحلة "${phase.name}" إلى "تم الوصول"؟ لن تُحسب أرقامها ضمن إجماليات صفحة المراحل.`
        : `هل تريد إعادة المرحلة "${phase.name}" إلى "جارية"؟`;

    if (!window.confirm(confirmText)) return;

    setStatusSaving(true);
    setError("");
    setMessage("");

    try {
      await updatePhaseStatus(phase.id, next);
      setPhase({ ...phase, status: next });
      setMessage(`تم تحديث الحالة إلى "${PHASE_STATUS_LABELS[next]}"`);

      await logAction(
        "UPDATE",
        "تغيير حالة مرحلة تجنيدية",
        `تم تغيير حالة المرحلة "${phase.name}" إلى "${PHASE_STATUS_LABELS[next]}"`
      );
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحديث الحالة");
    } finally {
      setStatusSaving(false);
    }
  }

  // -----------------------------------------------------
  // Render
  // -----------------------------------------------------

  // -----------------------------------------------------
  // الطباعة
  // -----------------------------------------------------
  async function handlePrint(showRemaining: boolean) {
    if (!phase) return;

    if (
      isDirty &&
      !window.confirm(
        "فيه تعديلات لم تُحفظ بعد. الطباعة هتشمل الأرقام الحالية الظاهرة على الشاشة. هل تريد المتابعة؟"
      )
    ) {
      return;
    }



    const printWindow = window.open("", "_blank", "width=1000,height=1200");

    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    const ar = (value: string | number): string => toArabicDigits(String(value));

    const esc = (value: string): string =>
      value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const catColumns = (cat: RecruitCategory) => columns.filter((c) => c.category === cat);

    // بيبني خلايا الفئة + خلية الإجمالي بعد عمود "عادة"
    const buildCatCells = (
      valueOf: (ck: string) => number,
      totalBg = "#f7f9fc"
    ): string =>
      categories
        .map(
          (cat) =>
            catColumns(cat)
              .map((c) => `<td>${ar(valueOf(c.key))}</td>`)
              .join("") +
            (showCatTotal
              ? `<td style="font-weight:700;background:${totalBg}">${ar(
                  sumCategory(cat, valueOf)
                )}</td>`
              : "")
        )
        .join("");

    const categoryHeadCells = categories
      .map(
        (c) =>
          `<th colspan="${RECRUIT_LEVELS.length + (showCatTotal ? 1 : 0)}">${categoryLabel(c)}</th>`
      )
      .join("");

    const levelHeadCells = categories
      .map(
        (cat) =>
          catColumns(cat)
            .map((c) => `<th class="level">${c.levelLabel}</th>`)
                      .join("") +
          (showCatTotal
            ? `<th class="level" style="font-weight:700;background:#eef2ff">الإجمالي</th>`
            : "")
      )
      .join("");

    const targetCells = buildCatCells(targetNum, "#eef2ff");
    const dayRowsHtml = dates.length
      ? dates
          .map((date) => {
            const cells = buildCatCells((ck) => arrivalNum(date, ck), "#eef2ff");
            const rowTotal = columns.reduce((sum, c) => sum + arrivalNum(date, c.key), 0);

            return `
              <tr class="${date === lastDate ? "last-day" : ""}">
                <td class="label">${ar(formatDate(date))}</td>
                ${cells}
                <td class="sum">${ar(rowTotal)}</td>
              </tr>`;
          })
          .join("")
          : `<tr><td colspan="${totalColsCount}" class="empty-row">لا يوجد أيام مسجلة</td></tr>`;
    const arrivedCells = buildCatCells(columnArrived, "#c6ebcb");

    const remainingRowHtml = showRemaining
      ? `
        <tr class="remaining-row">
          <td class="label">المتبقي</td>
          ${buildCatCells((ck) => targetNum(ck) - columnArrived(ck), "#fde68a")}
          <td class="sum">${ar(grandRemaining)}</td>
        </tr>`
      : "";
       printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
             <title>تسجيل وصول المرحلة التجنيدية - ${esc(ar(phase.name))}</title>

          <style>
              @page {
              size: A4;
              margin: 0;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: 'Almarai', Arial, sans-serif;
              direction: rtl;
              color: #2d3648;
            }
            .page {
              padding: 0 16mm;
            }

            .page-frame {
              position: fixed;
              top: 8mm;
              left: 8mm;
              right: 8mm;
              bottom: 8mm;
              border: 2px solid #cbd2e0;
              border-radius: 10px;
              pointer-events: none;
            }

            table.layout {
              width: 100%;
              border: none;
              border-collapse: collapse;
            }

            table.layout > thead > tr > td,
            table.layout > tfoot > tr > td,
            table.layout > tbody > tr > td {
              border: none;
              padding: 0;
              text-align: right;
            }

            .spacer {
              height: 14mm;
            }

            .header {
              position: relative;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid #cbd2e0;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }

            .header-text {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }

            .header-title {
              font-size: 18px;
              font-weight: 700;
            }

            .header-subtitle {
              font-size: 14px;
              font-weight: 700;
            }

            .header-system {
              font-size: 12px;
              color: #717d96;
            }

            .header-logo {
              width: 64px;
              height: 64px;
              object-fit: contain;
            }

            .header-title-box {
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              text-align: center;
              white-space: nowrap;
            }

            .header-title-main {
              font-size: 18px;
              font-weight: 700;
              text-decoration: underline;
            }

            .header-title-phase {
              font-size: 15px;
              font-weight: 700;
              margin-top: 4px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
              margin-top: 4px;
            }

            th, td {
              border: 1px solid #cbd2e0;
              padding: 7px 6px;
              text-align: center;
            }

            th {
              background: #f7f9fc;
              font-weight: 700;
            }

            th.level {
              font-weight: 400;
            }

            thead {
              display: table-header-group;
            }

            table:not(.layout) tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            td.label {
              font-weight: 700;
              white-space: nowrap;
            }

            td.sum {
              font-weight: 700;
            }

            .last-day td {
              background: #e0f2fe;
              font-weight: 700;
            }

            .target-row td {
              font-weight: 700;
              background: #f7f9fc;
            }

            .total-row td {
              font-weight: 700;
              background: #DCF4DF;
            }

            .remaining-row td {
              font-weight: 700;
              background: #fef3c7;
            }

            .empty-row {
              color: #a1aebe;
              padding: 12px;
            }
          </style>
        </head>

        <body>
          <div class="page-frame"></div>

          <table class="layout">
            <thead><tr><td><div class="spacer"></div></td></tr></thead>
            <tfoot><tr><td><div class="spacer"></div></td></tr></tfoot>
            <tbody>
              <tr>
                <td>
          <div class="page">
            <div class="header">
              <div class="header-text">
                <div class="header-title">قيادة قوات الصـاعقة</div>
                <div class="header-subtitle">فــــــرع التنظيــــم والإدارة</div>
                <div class="header-system"> المنظومـــة الالكترونيــــة للفرع</div>
              </div>

              <div class="header-title-box">
                <div class="header-title-main">تسجيل وصول المرحلة التجنيدية</div>
                <div class="header-title-phase">${esc(ar(phase.name))}</div>
              </div>

              <img src="${logoImg}" class="header-logo" />
            </div>

            <table>
              <thead>
                <tr>
                  <th rowspan="2">الفئة</th>
                  ${categoryHeadCells}
                  <th rowspan="2">الاجمالي</th>
                </tr>
                <tr>
                  ${levelHeadCells}
                </tr>
              </thead>

              <tbody>
                <tr class="target-row">
                  <td class="label">اجمالي الدفعة</td>
                  ${targetCells}
                  <td class="sum">${ar(grandTarget)}</td>
                </tr>

                ${dayRowsHtml}

                <tr class="total-row">
                  <td class="label">اجمالي الوصول</td>
                  ${arrivedCells}
                  <td class="sum">${ar(grandArrived)}</td>
                </tr>

                ${remainingRowHtml}
              </tbody>
            </table>
          </div>
                </td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();

    await Promise.all(
      Array.from(printWindow.document.images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
      )
    );

    await new Promise((resolve) => window.setTimeout(resolve, 300));

    if (printWindow.closed) return;

    printWindow.focus();
    printWindow.print();
  }

  if (loading) {
    return (
      <p dir="rtl" style={{ ...F, fontSize: 14, color: "#717d96" }}>
        جاري تحميل المرحلة...
      </p>
    );
  }

  if (!phase) {
    return (
      <div className="flex flex-col gap-3" dir="rtl">
        <p style={{ ...F, fontSize: 14, color: "#991b1b" }}>
          {error || "المرحلة غير موجودة"}
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard/recruit-arrivals")}
          className="self-start h-[38px] px-4 rounded-[8px] border border-[#e2e7f0] bg-white"
          style={{ ...F, fontSize: 13, color: "#2d3648" }}
        >
          الرجوع للمراحل
        </button>
      </div>
    );
  }

  const thStyle: React.CSSProperties = {
    ...F,
    border: BORDER,
    background: "#f7f9fc",
    padding: "8px 10px",
    fontSize: 14,
    fontWeight: 700,
    color: "#2d3648",
    textAlign: "center",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    ...F,
    border: BORDER,
    padding: "4px 6px",
    textAlign: "center",
    fontSize: 15,
    color: "#2d3648",
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      {/* العنوان */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/recruit-arrivals")}
            className="w-9 h-9 rounded-full border border-[#e2e7f0] bg-white flex items-center justify-center hover:bg-gray-50"
            aria-label="رجوع"
          >
            <ArrowRight size={16} color="#2d3648" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: "clamp(20px,3.5vw,28px)",
                  color: "#2d3648",
                }}
              >
                {phase.name}
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full"
                style={{
                  ...F,
                  fontSize: 12,
                  fontWeight: 700,
                  background: phase.status === "arrived" ? "#e0f2fe" : "#fef3c7",
                  color: phase.status === "arrived" ? "#075985" : "#92400e",
                }}
              >
                {PHASE_STATUS_LABELS[phase.status]}
              </span>
            </div>
            {phase.notes && (
              <span style={{ ...F, fontSize: 13, color: "#717d96" }}>{phase.notes}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPrintDialog(true)}
            className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px]"
            style={{ background: "#DCF4DF" }}
          >
            <Printer size={15} color="#2d3648" />
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>طباعة الشيت</span>
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() =>
                handleChangeStatus(phase.status === "arrived" ? "ongoing" : "arrived")
              }
              disabled={statusSaving}
              className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px] border border-[#e2e7f0] bg-white disabled:opacity-60"
            >
              {phase.status === "arrived" ? (
                <RotateCcw size={15} color="#2d3648" />
              ) : (
                <Check size={15} color="#166534" />
              )}
              <span style={{ ...F, fontSize: 13, color: "#2d3648", fontWeight: 700 }}>
                {statusSaving
                  ? "جاري التحديث..."
                  : phase.status === "arrived"
                  ? "إعادة فتح المرحلة"
                  : "تم الوصول"}
              </span>
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px] disabled:opacity-50"
              style={{ background: "#00b867" }}
            >
              <Save size={15} color="#fff" />
              <span style={{ ...F, fontSize: 13, color: "#fff", fontWeight: 700 }}>
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </span>
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={handleDeletePhase}
              className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px] border border-[#fecaca] bg-white"
            >
              <Trash2 size={15} color="#e3282c" />
              <span style={{ ...F, fontSize: 13, color: "#e3282c" }}>حذف المرحلة</span>
            </button>
          )}
        </div>
      </div>

      {/* نافذة خيارات الطباعة */}
      {showPrintDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,.45)" }}
          dir="rtl"
        >
          <div
            className="bg-white rounded-[20px] w-full flex flex-col gap-4"
            style={{ maxWidth: 420, padding: 24 }}
          >
            <h2 style={{ ...F, fontWeight: 700, fontSize: 18, color: "#2d3648" }}>
              طباعة الشيت
            </h2>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={printWithRemaining}
                onChange={(e) => setPrintWithRemaining(e.target.checked)}
                className="accent-[#00b867] w-4 h-4"
              />
              <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                طباعة صف المتبقي
              </span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPrintDialog(false);
                  handlePrint(printWithRemaining);
                }}
                className="flex-1 h-[44px] rounded-[8px]"
                style={{ ...F, background: "#00b867", color: "#fff", fontWeight: 700, fontSize: 14 }}
              >
                طباعة
              </button>
              <button
                type="button"
                onClick={() => setShowPrintDialog(false)}
                className="h-[44px] px-6 rounded-[8px] border border-[#e2e7f0] bg-white"
                style={{ ...F, fontSize: 14, color: "#717d96" }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* الملخص */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex flex-col">
          <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#2d3648" }}>
            {grandTarget}
          </span>
          <span style={{ ...F, fontSize: 12, color: "#717d96" }}>إجمالي الدفعة</span>
        </div>
        <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex flex-col">
          <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#166534" }}>
            {grandArrived}
          </span>
          <span style={{ ...F, fontSize: 12, color: "#717d96" }}>إجمالي الواصلين</span>
        </div>
        <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex flex-col">
          <span
            style={{
              ...F,
              fontSize: 20,
              fontWeight: 700,
              color: grandRemaining < 0 ? "#e3282c" : "#92400e",
            }}
          >
            {grandRemaining}
          </span>
          <span style={{ ...F, fontSize: 12, color: "#717d96" }}>المتبقي</span>
        </div>
      </div>

      {/* الرسائل */}
      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", ...F, fontSize: 14 }}
        >
          {error}
        </div>
      )}

      {message && !isDirty && (
        <div
          className="w-full rounded-[10px] px-5 py-3"
          style={{ background: "#dcfce7", border: "1px solid #bbf7d0", color: "#166534", ...F, fontSize: 14 }}
        >
          {message}
        </div>
      )}

      {isDirty && (
        <div
          className="w-full rounded-[10px] px-5 py-3"
          style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", ...F, fontSize: 14 }}
        >
          فيه تعديلات لم تُحفظ بعد
        </div>
      )}

      {/* إضافة يوم */}
      {canEdit && (
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={newDate}
            onChange={(e) => {
              setNewDate(e.target.value);
              setError("");
            }}
            className="h-[42px] rounded-[8px] border border-[#e2e7f0] bg-white px-3 outline-none focus:border-[#00b867]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />

          <button
            type="button"
            onClick={handleAddDay}
            disabled={addingDay}
            className="flex items-center gap-1.5 h-[42px] px-4 rounded-[8px] disabled:opacity-60"
            style={{ background: "#DCF4DF" }}
          >
            <CalendarPlus size={16} color="#2d3648" />
            <span style={{ ...F, fontSize: 13, color: "#2d3648", fontWeight: 700 }}>
              {addingDay ? "جاري الإضافة..." : "إضافة يوم"}
            </span>
          </button>
        </div>
      )}

      {/* الشيت */}
      <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 overflow-x-auto">
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th rowSpan={2} style={thStyle}>
                الفئة
              </th>

              {categories.map((category) => (
                            <th
                  key={category}
                  colSpan={RECRUIT_LEVELS.length + (showCatTotal ? 1 : 0)}
                  style={thStyle}
                >
                  {categoryLabel(category)}
                </th>
              ))}

              <th rowSpan={2} style={thStyle}>
                الاجمالي
              </th>
            </tr>

            <tr>
              {categories.map((cat) => (
                <Fragment key={cat}>
                  {columns
                    .filter((c) => c.category === cat)
                    .map((c) => (
                      <th key={c.key} style={{ ...thStyle, fontWeight: 400 }}>
                        {c.levelLabel}
                      </th>
                    ))}
                                 {showCatTotal && (
                    <th style={{ ...thStyle, background: "#eef2ff" }}>الإجمالي</th>
                  )}
                </Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* إجمالي الدفعة */}
            <tr>
              <td style={{ ...tdStyle, fontWeight: 700, background: "#f7f9fc", whiteSpace: "nowrap" }}>
                اجمالي الدفعة
              </td>
              {categories.map((cat) => (
                <Fragment key={cat}>
                  {columns
                    .filter((c) => c.category === cat)
                    .map((c) => (
                      <td key={c.key} style={{ ...tdStyle, background: "#f7f9fc" }}>
                        <NumCell
                          value={targetStr(c.key)}
                          editable={canEdit}
                          onChange={(raw) => handleTargetChange(c.key, raw)}
                          bold
                          invalid={targetNum(c.key) < columnArrived(c.key)}
                        />
                      </td>
                    ))}
                                 {showCatTotal && (
                    <td style={{ ...tdStyle, fontWeight: 700, background: "#eef2ff" }}>
                      {sumCategory(cat, targetNum)}
                    </td>
                  )}
                </Fragment>
              ))}
              <td style={{ ...tdStyle, fontWeight: 700, background: "#f7f9fc" }}>
                {grandTarget}
              </td>
            </tr>

            {/* الأيام */}
            {dates.length === 0 ? (
              <tr>
                <td
                  colSpan={totalColsCount}
                  style={{ ...tdStyle, color: "#a1aebe", padding: 16 }}
                >
                  لم يتم تسجيل أي يوم بعد
                </td>
              </tr>
            ) : (
              dates.map((date) => (
                <tr
                  key={date}
                  style={date === lastDate ? { background: "#e0f2fe" } : undefined}
                >
                  <td style={{ ...tdStyle, fontWeight: 700, whiteSpace: "nowrap" }}>
                    <div className="flex items-center justify-center gap-2">
                      <span>{formatDate(date)}</span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDay(date)}
                          title="حذف اليوم"
                          aria-label="حذف اليوم"
                        >
                          <Trash2 size={13} color="#e3282c" />
                        </button>
                      )}
                    </div>
                  </td>

                  {categories.map((cat) => (
                    <Fragment key={cat}>
                      {columns
                        .filter((c) => c.category === cat)
                        .map((c) => (
                          <td key={c.key} style={tdStyle}>
                            <NumCell
                              value={arrivalStr(date, c.key)}
                              editable={canEdit}
                              onChange={(raw) => handleArrivalChange(date, c.key, raw)}
                            />
                          </td>
                        ))}
                      {showCatTotal && (
                        <td style={{ ...tdStyle, fontWeight: 700, background: "#eef2ff" }}>
                          {sumCategory(cat, (ck) => arrivalNum(date, ck))}
                        </td>
                      )}
                    </Fragment>
                  ))}

                  <td style={{ ...tdStyle, fontWeight: 700 }}>
                    {columns.reduce((sum, c) => sum + arrivalNum(date, c.key), 0)}
                  </td>
                </tr>
              ))
            )}

            {/* الاجمالي */}
            <tr>
              <td style={{ ...tdStyle, fontWeight: 700, background: "#DCF4DF" }}>الاجمالي</td>
              {categories.map((cat) => (
                <Fragment key={cat}>
                  {columns
                    .filter((c) => c.category === cat)
                    .map((c) => (
                      <td key={c.key} style={{ ...tdStyle, fontWeight: 700, background: "#DCF4DF" }}>
                        {columnArrived(c.key)}
                      </td>
                    ))}
                               {showCatTotal && (
                    <td style={{ ...tdStyle, fontWeight: 700, background: "#c6ebcb" }}>
                      {sumCategory(cat, columnArrived)}
                    </td>
                  )}
                </Fragment>
              ))}
              <td style={{ ...tdStyle, fontWeight: 700, background: "#DCF4DF" }}>
                {grandArrived}
              </td>
            </tr>

            {/* المتبقي */}
            <tr>
              <td style={{ ...tdStyle, fontWeight: 700, background: "#fef3c7" }}>المتبقي</td>
              {categories.map((cat) => {
                const catRemaining =
                  sumCategory(cat, targetNum) - sumCategory(cat, columnArrived);
                return (
                  <Fragment key={cat}>
                    {columns
                      .filter((c) => c.category === cat)
                      .map((c) => {
                        const remaining = targetNum(c.key) - columnArrived(c.key);
                        return (
                          <td
                            key={c.key}
                            style={{
                              ...tdStyle,
                              fontWeight: 700,
                              background: "#fef3c7",
                              color: remaining < 0 ? "#e3282c" : "#2d3648",
                            }}
                          >
                            {remaining}
                          </td>
                        );
                      })}
                         {showCatTotal && (
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: 700,
                          background: "#fde68a",
                          color: catRemaining < 0 ? "#e3282c" : "#2d3648",
                        }}
                      >
                        {catRemaining}
                      </td>
                    )}
                  </Fragment>
                );
              })}
              <td
                style={{
                  ...tdStyle,
                  fontWeight: 700,
                  background: "#fef3c7",
                  color: grandRemaining < 0 ? "#e3282c" : "#2d3648",
                }}
              >
                {grandRemaining}
              </td>
            </tr>

             </tbody>
        </table>
      </div>
    </div>
  );
}