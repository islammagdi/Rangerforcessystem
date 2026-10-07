import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Printer,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Copy,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { useUnsavedChanges } from "../../lib/unsavedChanges";
import { logActivity } from "../../lib/logActivity";
import imgEagle from "figma:asset/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";

// =====================================================
// Types
// =====================================================

type AttendanceStatus = "present" | "absent" | "leave" | "mission" | "sick";

type Row = {
  key: string;
  personnel_id: string | null;
  category: "nco" | "soldier";
  rank_name: string;
  rank_order: number;
  full_name: string;
  military_number: string | null;
  office_id: string | null;
  office_name: string | null;
  status: AttendanceStatus | "";
  note: string;
};

type Office = { id: string; name: string };

type DutyOfficer = { personnel_id: string | null; name: string | null };
const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  bg: string;
  color: string;
}[] = [
  { value: "present", label: "حاضر", bg: "#DCF4DF", color: "#00522E" },
  { value: "absent", label: "غائب", bg: "#fef2f2", color: "#991b1b" },
  { value: "leave", label: "إجازة", bg: "#e8f0fe", color: "#172e78" },
  { value: "mission", label: "مأمورية", bg: "#fff8e8", color: "#8a6500" },
  { value: "sick", label: "مرضي", bg: "#f3e8ff", color: "#6b21a8" },
];

const STATUS_LABEL = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.value, s.label])
) as Record<AttendanceStatus, string>;

// =====================================================
// Helpers
// =====================================================

const WEEKDAYS = [
  "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت",
];

const toAr = (value: string | number): string =>
  String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

const pad = (n: number) => String(n).padStart(2, "0");

function isoOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseISO(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return { y, m, d };
}

function addDaysIso(value: string, amount: number): string {
  const { y, m, d } = parseISO(value);
  return isoOf(new Date(y, m - 1, d + amount));
}

function weekdayName(value: string): string {
  const { y, m, d } = parseISO(value);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

function longDate(value: string): string {
  const { y, m, d } = parseISO(value);
  return `${weekdayName(value)} ${toAr(pad(d))}/${toAr(pad(m))}/${toAr(y)}`;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const snapshotOf = (list: Row[]) =>
  JSON.stringify(
    list.map((r) => [r.personnel_id, r.status, r.note, r.office_id, r.office_name])
  );
function mapEntry(row: any): Row {
  return {
    key: row.id,
    personnel_id: row.personnel_id ?? null,
    category: row.category,
    rank_name: row.rank_name,
    rank_order: row.rank_order,
    full_name: row.full_name,
    military_number: row.military_number ?? null,
    office_id: row.office_id ?? null,
    office_name: row.office_name ?? null,
    status: (row.status ?? "") as AttendanceStatus | "",
    note: row.note ?? "",
  };
}

async function fetchRoster(): Promise<Row[]> {
  const { data, error } = await supabase.rpc("daily_attendance_roster");

  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    key: p.personnel_id,
    personnel_id: p.personnel_id,
    category: p.category,
    rank_name: p.rank_name,
    rank_order: p.rank_order,
    full_name: p.full_name,
    military_number: p.military_number ?? null,
    office_id: p.office_id ?? null,
    office_name: p.office_name ?? null,
    status: "" as const,
    note: "",
  }));
}

// =====================================================
// ورقة الطباعة (نفس دباجة النوبتجية والإطار)
// =====================================================

function buildAttendancePrintHtml({
  date,
  rows,
  logoSrc,
  dutyPersonnelId,
}: {
  date: string;
  rows: Row[];
  logoSrc: string;
  dutyPersonnelId: string | null;
}): string {
  const { y, m, d } = parseISO(date);

  const groupCounts = (list: Row[]) => ({
    force: list.length,
    present: list.filter((r) => r.status === "present").length,
    absent: list.filter((r) => r.status === "absent").length,
    leave: list.filter((r) => r.status === "leave").length,
    mission: list.filter((r) => r.status === "mission").length,
    sick: list.filter((r) => r.status === "sick").length,
    pending: list.filter((r) => !r.status).length,
  });

  const ncoCounts = groupCounts(rows.filter((r) => r.category === "nco"));
  const soldierCounts = groupCounts(rows.filter((r) => r.category === "soldier"));
  const totalCounts = groupCounts(rows);
  const showPending = totalCounts.pending > 0;

  const summaryRow = (
    label: string,
    g: ReturnType<typeof groupCounts>,
    strong = false
  ) => `
        <tr class="${strong ? "total" : ""}">
          <td class="label">${label}</td>
          <td>${toAr(g.force)}</td>
          <td>${toAr(g.present)}</td>
          <td>${toAr(g.absent)}</td>
          <td>${toAr(g.leave)}</td>
          <td>${toAr(g.mission)}</td>
          <td>${toAr(g.sick)}</td>
          ${showPending ? `<td>${toAr(g.pending)}</td>` : ""}
        </tr>`;

  const summaryHtml = `
      <table class="summary">
        <thead>
          <tr>
            <th class="label">البيان</th>
            <th>القوة</th>
            <th>حاضر</th>
            <th>غائب</th>
            <th>إجازة</th>
            <th>مأمورية</th>
            <th>مرضي</th>
            ${showPending ? "<th>لم يؤخذ</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${summaryRow("ضباط الصف", ncoCounts)}
          ${summaryRow("الجنود", soldierCounts)}
          ${summaryRow("الإجمالي", totalCounts, true)}
        </tbody>
      </table>`;

  const section = (title: string, list: Row[]) =>
    list.length === 0
      ? ""
      : `<tr class="section"><td colspan="6">${title} (${toAr(list.length)})</td></tr>` +
        list
          .map(
            (r, i) => `
        <tr>
          <td>${toAr(i + 1)}</td>
          <td>${escapeHtml(r.rank_name)}</td>
          <td>${escapeHtml(r.full_name)}${
            r.personnel_id && r.personnel_id === dutyPersonnelId ? " <b>(نوبتجي)</b>" : ""
          }</td>
          <td>${escapeHtml(r.office_name || "—")}</td>
          <td>${r.status ? escapeHtml(STATUS_LABEL[r.status]) : ""}</td>
          <td>${escapeHtml(r.note)}</td>
        </tr>`
          )
          .join("");

  const body =
    section("ضباط الصف", rows.filter((r) => r.category === "nco")) +
    section("الجنود", rows.filter((r) => r.category === "soldier"));

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>تمام الحضور اليومي للفرع ${escapeHtml(longDate(date))}</title>
    <style>
      @page { size: A4; margin: 10mm; }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body { margin: 0; padding: 0; background: #fff; }
      body {
        direction: rtl;
        font-family: 'Times New Roman', Times, serif;
        font-size: 14px;
        color: #000;
      }
      .sheet { border: 1.5px solid #333; padding: 6mm; min-height: 276mm; }
      .header {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 16px;
        margin-bottom: 16px;
        border-bottom: 1px solid #ddd;
      }
      .header-text { display: flex; flex-direction: column; align-items: flex-start; }
      .header-text p { margin: 0; font-size: 14px; }
      .header-text p.line1 { font-weight: 700; }
      .header-text p.line2 { margin: 3px 0; }
      .logo {
        width: 55px; height: 55px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .logo img { width: 55px; height: 55px; object-fit: contain; display: block; }
      .title {
        font-size: 18px;
        font-weight: 700;
        text-align: center;
        text-decoration: underline;
        margin: 0 0 4px;
      }
      .subtitle { text-align: center; margin: 0 0 14px; font-size: 13px; color: #333; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      thead { display: table-header-group; }
      th, td { border: 1px solid #999; padding: 4px 5px; text-align: center; }
      th { background: #f5f5f5; }
      tr { page-break-inside: avoid; break-inside: avoid; }
      tr.section td { background: #e9e9e9; font-weight: 700; text-align: right; }
      .summary { margin: 0 0 14px; }
      .summary th.label,
      .summary td.label { text-align: right; width: 22%; }
      .summary tr.total td { font-weight: 700; background: #f0f0f0; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        <div class="header-text">
          <p class="line1">قيـــــادة قـــوات الصـاعقـــة</p>
          <p class="line2">فــــــرع التنظيــــــم والإدارة</p>
          <p>
            التاريـــــخ :
            <span style="display:inline-flex;align-items:baseline;direction:rtl;unicode-bidi:isolate;white-space:nowrap;">
              <span>${toAr(pad(d))}</span>
              <span>/</span>
              <span>${toAr(pad(m))}</span>
              <span>/</span>
              <span>${toAr(y)}</span>
            </span>
          </p>
        </div>

        <div class="logo">
          <img src="${escapeHtml(logoSrc)}" alt="شعار الجمهورية" />
        </div>
      </div>

      <p class="title">تمام الحضور اليومي للفرع</p>
      <p class="subtitle">يوم ${escapeHtml(weekdayName(date))}</p>

      ${summaryHtml}

      <table>
        <thead>
          <tr>
            <th>م</th>
            <th>الدرجة</th>
            <th>الاسم</th>
            <th>المكتب</th>
            <th>التمام</th>
            <th>ملاحظات</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>


    </div>
  </body>
</html>`;
}

// =====================================================
// الصفحة
// =====================================================

export function DailyAttendancePage() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("daily_attendance:edit");
  const { setDirty } = useUnsavedChanges();

  const todayStr = isoOf(new Date());

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [date, setDate] = useState(todayStr);
  const [rows, setRows] = useState<Row[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState("[]");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [dutyOfficer, setDutyOfficer] = useState<DutyOfficer | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isDirty = canEdit && snapshotOf(rows) !== savedSnapshot;

  // تحذير لو فيه تعديلات غير محفوظة عند مغادرة الصفحة
  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  useEffect(() => {
    return () => setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void init();
  }, []);

  useEffect(() => {
    void loadDay(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("id", user.id)
        .maybeSingle();

      setCurrentUser({
        id: user.id,
        name:
          profile?.full_name ??
          profile?.username ??
          sessionStorage.getItem("username") ??
          "مستخدم غير معروف",
      });
    }

    const { data: officesData, error: officesError } = await supabase
      .from("mail_offices")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (officesError) {
      console.error("تعذر تحميل المكاتب:", officesError);
      return;
    }

    setOffices((officesData ?? []) as Office[]);
  }

  async function loadDay(day: string) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data: sheet, error: sheetError } = await supabase
        .from("daily_attendance_sheets")
        .select("id, updated_at")
        .eq("sheet_date", day)
        .maybeSingle();

      if (sheetError) throw sheetError;

      let loaded: Row[];

      if (sheet) {
        const { data, error: entriesError } = await supabase
          .from("daily_attendance_entries")
          .select("*")
          .eq("sheet_id", sheet.id)
          .order("rank_order", { ascending: true })
          .order("full_name", { ascending: true });

        if (entriesError) throw entriesError;

        loaded = (data ?? []).map(mapEntry);
      } else {
        // يوم جديد: بنبني الكشف من القوة الحالية
        loaded = await fetchRoster();
      }

      setRows(loaded);
      setSavedSnapshot(snapshotOf(loaded));
      setSavedAt(sheet?.updated_at ?? null);

      // نوبتجي اليوم (من النوبتجية المنشورة أو المعتمدة)
      const { data: duty, error: dutyError } = await supabase.rpc(
        "daily_attendance_duty_officer",
        { p_date: day }
      );

      if (dutyError) {
        console.error("تعذر تحميل نوبتجي اليوم:", dutyError);
        setDutyOfficer(null);
      } else {
        const first = (duty ?? [])[0] as
          | { personnel_id: string | null; user_name: string | null }
          | undefined;

        setDutyOfficer(
          first
            ? { personnel_id: first.personnel_id ?? null, name: first.user_name ?? null }
            : null
        );
      }
    } catch (err: any) {
      setError(err?.message || "تعذر تحميل الكشف");
      setRows([]);
      setDutyOfficer(null);
      setSavedSnapshot("[]");
      setSavedAt(null);
    } finally {
      setLoading(false);
    }
  }

  function changeDate(next: string) {
    if (!next || next === date) return;

    if (isDirty && !window.confirm("لديك تعديلات غير محفوظة. هل تريد تجاهلها؟")) {
      return;
    }

    setDate(next);
  }

  // =====================================================
  // تعديل الصفوف
  // =====================================================

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function toggleStatus(index: number, value: AttendanceStatus) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, status: r.status === value ? "" : value } : r
      )
    );
  }

  function setSoldierOffice(index: number, officeId: string) {
    const office = offices.find((o) => o.id === officeId);

    updateRow(index, {
      office_id: office?.id ?? null,
      office_name: office?.name ?? null,
    });
  }

  function removeRow(index: number) {
    const row = rows[index];

    if (!window.confirm(`حذف ${row.rank_name} ${row.full_name} من كشف هذا اليوم؟`)) return;

    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function markAllPresent() {
    setRows((prev) => prev.map((r) => (r.status ? r : { ...r, status: "present" })));
  }

  // نسخ توزيع المكاتب للجنود من آخر كشف محفوظ قبل اليوم ده (للخانات الفاضية بس)
  async function handleCopyLastOffices() {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const { data: prev, error: prevError } = await supabase
        .from("daily_attendance_sheets")
        .select("id, sheet_date")
        .lt("sheet_date", date)
        .order("sheet_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prevError) throw prevError;

      if (!prev) {
        setError("لا يوجد كشف سابق لنسخ التوزيع منه.");
        return;
      }

      const { data: prevEntries, error: entriesError } = await supabase
        .from("daily_attendance_entries")
        .select("personnel_id, office_id, office_name")
        .eq("sheet_id", prev.id)
        .eq("category", "soldier");

      if (entriesError) throw entriesError;

      const byPerson = new Map<string, { office_id: string | null; office_name: string | null }>();

      (prevEntries ?? []).forEach((e: any) => {
        if (e.personnel_id && e.office_id) {
          byPerson.set(e.personnel_id, { office_id: e.office_id, office_name: e.office_name });
        }
      });

      let copied = 0;

      setRows((current) =>
        current.map((r) => {
          if (r.category !== "soldier" || r.office_id || !r.personnel_id) return r;

          const found = byPerson.get(r.personnel_id);
          if (!found) return r;

          copied += 1;
          return { ...r, office_id: found.office_id, office_name: found.office_name };
        })
      );

      setSuccess(
        `تم نسخ توزيع المكاتب من كشف ${longDate(prev.sheet_date)}. لا تنسَ الحفظ.`
      );
    } catch (err: any) {
      setError(err?.message || "تعذر نسخ التوزيع");
    } finally {
      setBusy(false);
    }
  }
  // إضافة الأفراد الجداد + تحديث مكاتب ضباط الصف من قاعدة البيانات
  async function handleRefreshRoster() {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const roster = await fetchRoster();
      const byId = new Map(roster.map((r) => [r.personnel_id, r]));
      const existing = new Set(rows.map((r) => r.personnel_id).filter(Boolean));
      const added = roster.filter((r) => !existing.has(r.personnel_id));

      let updatedOffices = 0;

      const refreshed = rows.map((r) => {
        if (r.category !== "nco" || !r.personnel_id) return r;

        const fresh = byId.get(r.personnel_id);

           if (!fresh) return r;
        if ((fresh.office_name ?? "") === (r.office_name ?? "")) return r;

        updatedOffices += 1;
        return { ...r, office_id: fresh.office_id, office_name: fresh.office_name };
      });

      if (added.length === 0 && updatedOffices === 0) {
        setSuccess("القائمة محدّثة، لا يوجد أفراد جدد ولا مكاتب تحتاج تحديث.");
        return;
      }

      setRows(
        [...refreshed, ...added].sort(
          (a, b) =>
            a.rank_order - b.rank_order || a.full_name.localeCompare(b.full_name, "ar")
        )
      );

      setSuccess(
        `تمت إضافة ${toAr(added.length)} فرد جديد وتحديث ${toAr(updatedOffices)} مكتب. لا تنسَ الحفظ.`
      );
    } catch (err: any) {
      setError(err?.message || "تعذر تحديث القائمة");
    } finally {
      setBusy(false);
    }
  }

  // =====================================================
  // الحفظ
  // =====================================================

  async function handleSave() {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const payload = rows.map((r) => ({
        personnel_id: r.personnel_id,
        category: r.category,
        rank_name: r.rank_name,
        rank_order: r.rank_order,
        full_name: r.full_name,
        military_number: r.military_number,
        office_id: r.office_id,
        office_name: r.office_name,
        status: r.status || null,
        note: r.note.trim() || null,
      }));

      const { error: saveError } = await supabase.rpc("save_daily_attendance", {
        p_date: date,
        p_entries: payload,
      });

      if (saveError) {
        setError(saveError.message);
        return;
      }

      await loadDay(date);
      setSuccess("تم حفظ الكشف.");

      if (currentUser) {
        try {
          await logActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            actionType: "UPDATE",
            action: "حفظ تمام الحضور اليومي",
            entity: "تمام الحضور اليومي",
            details: `${longDate(date)} — القوة ${rows.length}`,
          } as any);
        } catch {
          // تسجيل العملية مش لازم يوقف الشغل
        }
      }
    } finally {
      setBusy(false);
    }
  }

  // =====================================================
  // الطباعة
  // =====================================================

  function handlePrint() {
    const printWindow = window.open("", "_blank", "width=900,height=1200");

    if (!printWindow) {
      setError("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    const html = buildAttendancePrintHtml({
      date,
      rows,
      logoSrc: new URL(imgEagle, window.location.href).href,
      dutyPersonnelId: dutyOfficer?.personnel_id ?? null,
    });

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    const doPrint = () => {
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        window.setTimeout(() => printWindow.close(), 500);
      }, 700);
    };

    if (printWindow.document.readyState === "complete") {
      doPrint();
    } else {
      printWindow.onload = doPrint;
    }
  }

  // =====================================================
  // قيم مشتقة
  // =====================================================

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      present: 0,
      absent: 0,
      leave: 0,
      mission: 0,
      sick: 0,
      pending: 0,
    };

    rows.forEach((r) => {
      if (r.status) c[r.status] += 1;
      else c.pending += 1;
    });

    return c;
  }, [rows]);

  const indexed = rows.map((row, index) => ({ row, index }));

  const sections = [
    { key: "nco", title: "ضباط الصف", list: indexed.filter(({ row }) => row.category === "nco") },
    { key: "soldier", title: "الجنود", list: indexed.filter(({ row }) => row.category === "soldier") },
  ];

  const columnsCount = canEdit ? 7 : 6;

  // =====================================================
  // Render
  // =====================================================

  return (
    <div
      className="flex flex-col gap-4 w-full"
      dir="rtl"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      {/* التاريخ والإجراءات */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="اليوم السابق"
            onClick={() => changeDate(addDaysIso(date, -1))}
            disabled={busy}
            className="w-10 h-10 rounded-lg border border-[#cbd5e1] flex items-center justify-center text-[#475569] hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>

          <input
            type="date"
            value={date}
            onChange={(e) => changeDate(e.target.value)}
            disabled={busy}
            className="h-10 rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]"
            style={{ fontSize: 14 }}
          />

          <button
            type="button"
            title="اليوم التالي"
            onClick={() => changeDate(addDaysIso(date, 1))}
            disabled={busy}
            className="w-10 h-10 rounded-lg border border-[#cbd5e1] flex items-center justify-center text-[#475569] hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft size={18} />
          </button>

          {date !== todayStr && (
            <button
              type="button"
              onClick={() => changeDate(todayStr)}
              disabled={busy}
              className="h-10 px-3 rounded-lg bg-[#DCF4DF] text-[#00522E] hover:opacity-80 disabled:opacity-50"
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              اليوم
            </button>
          )}
        </div>

        <div className="flex flex-col">
          <span style={{ fontSize: 15, fontWeight: 700, color: "#2d3648" }}>
            {longDate(date)}
          </span>
          <span style={{ fontSize: 12, color: savedAt ? "#166534" : "#94a3b8" }}>
            {savedAt ? `تم الحفظ ${formatDateTime(savedAt)}` : "لم يُحفظ كشف هذا اليوم بعد"}
          </span>

          {dutyOfficer?.name && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#172e78" }}>
              نوبتجي اليوم: {dutyOfficer.name}
            </span>
          )}
        </div>

        <div className="mr-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={busy || loading || rows.length === 0}
            className="flex items-center gap-2 px-4 h-10 rounded-lg border border-[#2d3648] bg-white text-[#2d3648] hover:bg-gray-50 disabled:opacity-50"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            <Printer size={16} />
            طباعة
          </button>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={markAllPresent}
                disabled={busy || loading || rows.length === 0}
                className="flex items-center gap-2 px-4 h-10 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50 disabled:opacity-50"
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                <CheckCheck size={16} />
                الكل حاضر
              </button>

              <button
                type="button"
                onClick={() => void handleCopyLastOffices()}
                disabled={busy || loading}
                className="flex items-center gap-2 px-4 h-10 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50 disabled:opacity-50"
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                <Copy size={15} />
                نسخ توزيع آخر كشف
              </button>

              <button
                type="button"
                onClick={() => void handleRefreshRoster()}
                disabled={busy || loading}
                className="flex items-center gap-2 px-4 h-10 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50 disabled:opacity-50"
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                <RefreshCw size={15} />
                تحديث القائمة
              </button>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={busy || loading || !isDirty}
                className="flex items-center gap-2 px-5 h-10 rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                حفظ الكشف
              </button>
            </>
          )}
        </div>
      </div>

      {/* الرسائل */}
      {error && (
        <div className="rounded-xl px-5 py-3 bg-[#fef2f2] border border-[#fecaca] flex items-center justify-between">
          <span style={{ color: "#991b1b", fontSize: 14, fontWeight: 700 }}>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-[#991b1b]">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="rounded-xl px-5 py-3 bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-between">
          <span style={{ color: "#166534", fontSize: 14, fontWeight: 700 }}>{success}</span>
          <button type="button" onClick={() => setSuccess("")} className="text-[#166534]">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ملخص الأعداد */}
      <div className="flex flex-wrap gap-2">
        <span
          className="px-3 py-1.5 rounded-full bg-white border border-[#eff0f6]"
          style={{ fontSize: 13, fontWeight: 700, color: "#2d3648" }}
        >
          إجمالي القوة: {toAr(rows.length)}
        </span>

        {STATUS_OPTIONS.map((opt) => (
          <span
            key={opt.value}
            className="px-3 py-1.5 rounded-full"
            style={{ fontSize: 13, fontWeight: 700, background: opt.bg, color: opt.color }}
          >
            {opt.label}: {toAr(counts[opt.value])}
          </span>
        ))}

        <span
          className="px-3 py-1.5 rounded-full bg-[#f1f5f9]"
          style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}
        >
          لم يؤخذ: {toAr(counts.pending)}
        </span>
      </div>

      {/* الجدول */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-[#00B867]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[#717d96]" style={{ fontSize: 14 }}>
            لا يوجد أفراد ملحقين بالفرع في هذا الكشف.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                  <th className="text-right px-4 py-3">م</th>
                  <th className="text-right px-4 py-3">الدرجة</th>
                  <th className="text-right px-4 py-3">الاسم</th>
                  <th className="text-right px-4 py-3">المكتب</th>
                  <th className="text-right px-4 py-3">التمام</th>
                  <th className="text-right px-4 py-3">ملاحظات</th>
                  {canEdit && <th className="text-right px-4 py-3">حذف</th>}
                </tr>
              </thead>

              <tbody>
                {sections.map(
                  (section) =>
                    section.list.length > 0 && (
                      <Fragment key={section.key}>
                        <tr className="bg-[#f1f5f9]">
                          <td
                            colSpan={columnsCount}
                            className="px-4 py-2"
                            style={{ fontSize: 13, fontWeight: 700, color: "#2d3648" }}
                          >
                            {section.title} ({toAr(section.list.length)})
                          </td>
                        </tr>

                        {section.list.map(({ row, index }, position) => {
                          const activeOption = STATUS_OPTIONS.find((o) => o.value === row.status);

                          return (
                            <tr key={row.key} className="border-t border-[#eff0f6]">
                              <td className="px-4 py-3" style={{ fontSize: 13, color: "#717d96" }}>
                                {toAr(position + 1)}
                              </td>

                              <td className="px-4 py-3" style={{ fontSize: 14, color: "#2d3648" }}>
                                {row.rank_name}
                              </td>

                              <td
                                className="px-4 py-3"
                                style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}
                              >
                                {row.full_name}

                                {dutyOfficer?.personnel_id &&
                                  row.personnel_id === dutyOfficer.personnel_id && (
                                    <span
                                      className="mr-2 px-2 py-0.5 rounded-full"
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        background: "#e8f0fe",
                                        color: "#172e78",
                                      }}
                                    >
                                      نوبتجي
                                    </span>
                                  )}
                              </td>

                              <td className="px-4 py-3">
                                {row.category === "soldier" && canEdit ? (
                                  <select
                                    value={row.office_id ?? ""}
                                    onChange={(e) => setSoldierOffice(index, e.target.value)}
                                    disabled={busy}
                                    className="w-full min-w-[150px] h-9 rounded-lg border border-[#cbd5e1] bg-white px-2 outline-none focus:border-[#00B867]"
                                    style={{ fontSize: 13 }}
                                  >
                                    <option value="">اختر المكتب</option>
                                    {row.office_id &&
                                      !offices.some((o) => o.id === row.office_id) && (
                                        <option value={row.office_id}>
                                          {row.office_name ?? "مكتب غير معروف"}
                                        </option>
                                      )}
                                    {offices.map((office) => (
                                      <option key={office.id} value={office.id}>
                                        {office.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span style={{ fontSize: 13, color: "#334155" }}>
                                    {row.office_name || "—"}
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3">
                                {canEdit ? (
                                  <div className="flex flex-wrap gap-1">
                                    {STATUS_OPTIONS.map((opt) => {
                                      const active = row.status === opt.value;

                                      return (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          onClick={() => toggleStatus(index, opt.value)}
                                          disabled={busy}
                                          className="px-2.5 h-8 rounded-full border transition-colors disabled:opacity-50"
                                          style={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            background: active ? opt.bg : "#fff",
                                            color: active ? opt.color : "#94a3b8",
                                            borderColor: active ? opt.color : "#e2e8f0",
                                          }}
                                        >
                                          {opt.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : activeOption ? (
                                  <span
                                    className="px-2.5 py-1 rounded-full"
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      background: activeOption.bg,
                                      color: activeOption.color,
                                    }}
                                  >
                                    {activeOption.label}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 13, color: "#94a3b8" }}>—</span>
                                )}
                              </td>

                              <td className="px-4 py-3">
                                {canEdit ? (
                                  <input
                                    type="text"
                                    value={row.note}
                                    onChange={(e) => updateRow(index, { note: e.target.value })}
                                    disabled={busy}
                                    className="w-full min-w-[140px] h-9 rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]"
                                    style={{ fontSize: 13 }}
                                  />
                                ) : (
                                  <span style={{ fontSize: 13, color: "#717d96" }}>
                                    {row.note || "—"}
                                  </span>
                                )}
                              </td>

                              {canEdit && (
                                <td className="px-4 py-3">
                                  <button
                                    type="button"
                                    title="حذف من كشف اليوم"
                                    onClick={() => removeRow(index)}
                                    disabled={busy}
                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#94a3b8] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </Fragment>
                    )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}