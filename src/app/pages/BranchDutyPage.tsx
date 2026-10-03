import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Save,
  CheckCircle2,
  Trash2,
  Link2,
  Scissors,
  CalendarOff,
  Pencil,
  X,
  Loader2,
  PenLine,
  Printer,
  Send,
} from "lucide-react";
import { useLocation } from "react-router";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { useUnsavedChanges } from "../../lib/unsavedChanges";
import { logActivity } from "../../lib/logActivity";
import imgEagle from "figma:asset/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";

// =====================================================
// Types
// =====================================================

type Roster = {
  id: string;
  year: number;
  month: number;
  status: "draft" | "approved" | "published";
  approved_at: string | null;
  published_at: string | null;
  head_signed_at: string | null;
  head_signed_name: string | null;
  head_signed_rank: string | null;
};

type Shift = {
  key: string; // مفتاح محلي للـ React
  id: string | null; // null = فترة جديدة لسه متحفظتش
  start_date: string; // YYYY-MM-DD
  end_date: string;
  note: string;
  assigned_user_id: string | null;
  assigned_name: string | null;
  assigned_rank: string | null;
  assigned_office: string | null;
  signed_at: string | null;
};

type Candidate = {
  user_id: string;
  name: string;
  rank: string | null;
  office: string;
};

// =====================================================
// Helpers
// =====================================================

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const WEEKDAYS = [
  "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت",
];

const HOLIDAY_NOTE = "إجازة رسمية";

const toAr = (value: string | number): string =>
  String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

const pad = (n: number) => String(n).padStart(2, "0");

const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

function parseISO(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return { y, m, d };
}

function weekdayOf(value: string): number {
  const { y, m, d } = parseISO(value);
  return new Date(y, m - 1, d).getDay();
}

function addDays(value: string, amount: number): string {
  const { y, m, d } = parseISO(value);
  const date = new Date(y, m - 1, d + amount);
  return iso(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function dayLabel(value: string): string {
  return `${WEEKDAYS[weekdayOf(value)]} ${toAr(parseISO(value).d)}`;
}

function rangeLabel(start: string, end: string): string {
  return start === end ? dayLabel(start) : `${dayLabel(start)} – ${dayLabel(end)}`;
}

function dayCount(start: string, end: string): number {
  return parseISO(end).d - parseISO(start).d + 1;
}

function newShift(start: string, end: string): Shift {
  return {
    key: crypto.randomUUID(),
    id: null,
    start_date: start,
    end_date: end,
    note: "",
    assigned_user_id: null,
    assigned_name: null,
    assigned_rank: null,
    assigned_office: null,
    signed_at: null,
  };
}

// الشهر كله أيام منفصلة، ما عدا الخميس + الجمعة فترة واحدة
function generateDefaultShifts(year: number, month: number): Shift[] {
  const total = new Date(year, month, 0).getDate();
  const result: Shift[] = [];
  let day = 1;

  while (day <= total) {
    const date = iso(year, month, day);

    if (weekdayOf(date) === 4 && day + 1 <= total) {
      result.push(newShift(date, iso(year, month, day + 1)));
      day += 2;
    } else {
      result.push(newShift(date, date));
      day += 1;
    }
  }

  return result;
}

function mapRow(row: any): Shift {
  return {
    key: row.id,
    id: row.id,
    start_date: row.start_date,
    end_date: row.end_date,
    note: row.note ?? "",
    assigned_user_id: row.assigned_user_id ?? null,
    assigned_name: row.assigned_name ?? null,
    assigned_rank: row.assigned_rank ?? null,
    assigned_office: row.assigned_office ?? null,
    signed_at: row.signed_at ?? null,
  };
}

function toPayload(list: Shift[]) {
  return list.map((s) => ({
    id: s.id,
    start_date: s.start_date,
    end_date: s.end_date,
    note: s.note.trim() || null,
    assigned_user_id: s.assigned_user_id,
    assigned_name: s.assigned_name,
    assigned_rank: s.assigned_rank,
    assigned_office: s.assigned_office,
  }));
}

const snapshotOf = (list: Shift[]) =>
  JSON.stringify(
    list.map((s) => [s.id, s.start_date, s.end_date, s.note, s.assigned_user_id])
  );

function joinNotes(a: string, b: string): string {
  return [a, b].map((x) => x.trim()).filter(Boolean).filter((x, i, arr) => arr.indexOf(x) === i).join(" - ");
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

// صيغة التاريخ في الطباعة: 01/10/2026 (أو 01-02/10/2026 للفترة المدمجة)
// كل جزء في عنصر منفصل داخل صف RTL: اليوم على اليمين والسنة على الشمال
function dateRangeHtml(start: string, end: string): string {
  const a = parseISO(start);
  const b = parseISO(end);

  const parts: string[] =
    start === end ? [pad(a.d)] : [pad(a.d), "-", pad(b.d)];

  parts.push("/", pad(a.m), "/", String(a.y));

  return (
    '<span style="display:inline-flex;direction:rtl;unicode-bidi:isolate;white-space:nowrap;">' +
    parts.map((part) => `<span>${toAr(part)}</span>`).join("") +
    "</span>"
  );
}

// ورقة الطباعة: نفس هيدر الخطابات + جدول النوبتجية + توقيع رئيس الفرع
function buildDutyPrintHtml({
  roster,
  shifts,
  isApproved,
  branchHeadName,
  branchHeadRank,
  logoSrc,
}: {
  roster: Roster;
  shifts: Shift[];
  isApproved: boolean;
  branchHeadName: string;
  branchHeadRank: string;
  logoSrc: string;
}): string {
  const monthLabel = MONTHS[roster.month - 1];
  const pageTitle = `نوبتجية ${monthLabel} ${toAr(roster.year)}`;


   const rows = shifts
    .map((s, index) => {
      const signature = s.signed_at
        ? `تم التوقيع إلكترونيًا<br/><span class="muted">${escapeHtml(
            formatDateTime(s.signed_at)
          )}</span>`
        : "";

      return `
        <tr${s.start_date !== s.end_date ? ' class="merged"' : ""}>
          <td>${toAr(index + 1)}</td>
          <td>${dateRangeHtml(s.start_date, s.end_date)}</td>
          <td>${escapeHtml(s.assigned_rank || "—")}</td>
          <td>${escapeHtml(s.assigned_name || "—")}</td>
          <td>${escapeHtml(s.assigned_office || "—")}</td>
          <td>${signature}</td>
        </tr>
      `;
    })
    .join("");
  // لو رئيس الفرع وقّع إلكترونيًا نكتب اسمه ورتبته اللي وقّع بيهم
  const headParts = roster.head_signed_at
    ? [roster.head_signed_rank ?? "", roster.head_signed_name ?? ""]
    : [branchHeadRank, branchHeadName];

  const headRankAndName =
    headParts.filter(Boolean).map(escapeHtml).join(" / ") || "...................";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(pageTitle)}</title>
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
      .sheet {
        border: 1.5px solid #333;
        padding: 6mm;
        min-height: 276mm;
      }
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
        margin: 0 0 14px;
      }
      .draft {
        display: inline-block;
        margin-right: 8px;
        font-size: 13px;
        color: #b45309;
        text-decoration: none;
      }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      thead { display: table-header-group; }
      th, td { border: 1px solid #999; padding: 4px 5px; text-align: center; }
      th { background: #f5f5f5; }
      .merged td { background: #f4f4f4; }
      tr { page-break-inside: avoid; break-inside: avoid; }
      .muted { font-size: 11px; color: #555; }
      .signature-block {
        margin-top: 18mm;
        width: fit-content;
        max-width: 100%;
        margin-left: 0;
        margin-right: auto;
        direction: rtl;
        text-align: justify;
        text-align-last: justify;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .signature-block p { margin: 0; font-weight: 700; }
      .signature-block p.name { margin-top: 6px; }
         .signature-block p.role { margin-top: 4px; }
      .signature-block p.esign {
        margin-top: 6px;
        font-size: 12px;
        font-weight: 400;
        color: #166534;
        text-align: center;
        text-align-last: center;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        <div class="header-text">
          <p class="line1">قيـــــادة قـــوات الصـاعقـــة</p>
          <p class="line2">فــــــرع التنظيــــــم والإدارة</p>
          <p>
            التاريــخ :
            <span style="display:inline-flex;align-items:baseline;direction:rtl;unicode-bidi:isolate;white-space:nowrap;">
              <span style="display:inline-block;width:25px;">&nbsp;</span>
              <span>/</span>
              <span>${toAr(pad(roster.month))}</span>
              <span>/</span>
              <span>${toAr(roster.year)}</span>
            </span>
          </p>
        </div>

        <div class="logo">
          <img src="${escapeHtml(logoSrc)}" alt="شعار الجمهورية" />
        </div>
      </div>

      <p class="title">
        ${escapeHtml(pageTitle)}
       لفرع التنظيم والاداره
      </p>

      <table>
        <thead>
          <tr>
            <th>م</th>
            <th>التاريخ</th>
            <th>الرتبة</th>
            <th>الاسم</th>
            <th>المكتب</th>
            <th>التوقيع</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="signature-block">
        <p>التوقيع (${"&nbsp;".repeat(29)})</p>
        <p class="name">${headRankAndName}</p>
             <p class="role">رئيــــس فــــرع التنظيــــم والاداره</p>
        ${
          roster.head_signed_at
            ? `<p class="esign">تم التوقيع إلكترونيًا بتاريخ ${escapeHtml(
                formatDateTime(roster.head_signed_at)
              )}</p>`
            : ""
        }
      </div>
    </div>
  </body>
</html>`;
}

// =====================================================
// الصفحة
// =====================================================

export function BranchDutyPage() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("branch_duty:edit");
  const canHeadSign = hasPermission("branch_duty:head_sign");
  const { setDirty } = useUnsavedChanges();
  const location = useLocation();
  const requestedRosterId = (location.state as { rosterId?: string } | null)?.rosterId ?? null;

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  const [rosters, setRosters] = useState<Roster[]>([]);
  const [selectedRosterId, setSelectedRosterId] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState("[]");
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // null = الافتراضي (المسودة تتعدل، المعتمدة تتعرض). true/false = اختيار المسؤول
  const [editOverride, setEditOverride] = useState<boolean | null>(null);

  const today = new Date();
  const [showCreate, setShowCreate] = useState(false);
  const [newYear, setNewYear] = useState(today.getFullYear());
  const [newMonth, setNewMonth] = useState(today.getMonth() + 1);

  const selectedRoster = rosters.find((r) => r.id === selectedRosterId) ?? null;
  // الرحلة: مسودة ← منشورة (يتصفحها الكل ويوقّع ضباط الصف) ← معتمدة (تروح لرئيس الفرع للتوقيع)
  const isPublished = selectedRoster?.status === "published";
  const isApproved = selectedRoster?.status === "approved";
  // خرجت من المسودة (منشورة أو معتمدة)
  const isLocked = selectedRoster !== null && selectedRoster.status !== "draft";
  const isEditing =
    canEdit && selectedRoster !== null && (editOverride ?? selectedRoster.status === "draft");

  const isDirty = isEditing && snapshotOf(shifts) !== savedSnapshot;

  // تحذير لو فيه تعديلات غير محفوظة عند مغادرة الصفحة
  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  useEffect(() => {
    return () => setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // تحميل البيانات
  // =====================================================

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!canEdit) return;

    void (async () => {
      const { data, error: candidatesError } = await supabase
        .from("user_offices")
        .select("user_id, username, full_name, rank_name, office_name")
        .not("office_id", "is", null)
        .order("full_name", { ascending: true });

      if (candidatesError) {
        setError("تعذر تحميل قائمة ضباط الصف: " + candidatesError.message);
        return;
      }

      const map = new Map<string, Candidate>();

      (data ?? []).forEach((row: any) => {
        const existing = map.get(row.user_id);

        if (!existing) {
          map.set(row.user_id, {
            user_id: row.user_id,
            name: row.full_name || row.username,
            rank: row.rank_name ?? null,
            office: row.office_name,
          });
        } else if (row.office_name && !existing.office.split("، ").includes(row.office_name)) {
          // الدور مربوط بأكثر من مكتب
          existing.office = `${existing.office}، ${row.office_name}`;
        }
      });

      setCandidates(Array.from(map.values()));
    })();
  }, [canEdit]);

  async function init() {
    setLoading(true);

    try {
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

      const list = await loadRosters();

      if (list.length > 0) {
        const requested = list.find((r) => r.id === requestedRosterId);
        await openRoster(requested ?? list[0]);
      }
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل النوبتجيات");
    } finally {
      setLoading(false);
    }
  }

  async function loadRosters(): Promise<Roster[]> {
    const { data, error: rostersError } = await supabase
      .from("duty_rosters")
      .select(
        "id, year, month, status, approved_at, published_at, head_signed_at, head_signed_name, head_signed_rank"
      )
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (rostersError) throw rostersError;

    const list = (data ?? []) as Roster[];
    setRosters(list);
    return list;
  }

  async function loadShifts(rosterId: string) {
    const { data, error: shiftsError } = await supabase
      .from("duty_roster_shifts")
      .select("*")
      .eq("roster_id", rosterId)
      .order("start_date", { ascending: true });

    if (shiftsError) {
      setError("تعذر تحميل فترات النوبتجية: " + shiftsError.message);
      return;
    }

    const mapped = (data ?? []).map(mapRow);
    setShifts(mapped);
    setSavedSnapshot(snapshotOf(mapped));
  }

  async function openRoster(roster: Roster) {
    setError("");
    setSuccess("");
    setSelectedRosterId(roster.id);
    setEditOverride(null);
    await loadShifts(roster.id);
  }

  async function handleSelectRoster(rosterId: string) {
    if (isDirty && !window.confirm("لديك تعديلات غير محفوظة. هل تريد تجاهلها؟")) {
      return;
    }

    const roster = rosters.find((r) => r.id === rosterId);
    if (roster) await openRoster(roster);
  }

  async function log(actionType: string, action: string, details: string) {
    if (!currentUser) return;

    try {
      await logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        actionType,
        action,
        entity: "نوبتجية الفرع",
        details,
      } as any);
    } catch {
      // تسجيل العملية مش لازم يوقف الشغل
    }
  }

  // =====================================================
  // إنشاء نوبتجية شهر جديد
  // =====================================================

  async function handleCreate() {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const { data, error: insertError } = await supabase
        .from("duty_rosters")
        .insert({
          year: newYear,
          month: newMonth,
          status: "draft",
          created_by: currentUser?.id ?? null,
        })
        .select(
          "id, year, month, status, approved_at, published_at, head_signed_at, head_signed_name, head_signed_rank"
        )
        .single();

      if (insertError) {
        setError(
          insertError.code === "23505"
            ? "يوجد نوبتجية بالفعل لهذا الشهر."
            : "تعذر إنشاء النوبتجية: " + insertError.message
        );
        return;
      }

      const { error: saveError } = await supabase.rpc("save_duty_roster_shifts", {
        p_roster_id: data.id,
        p_shifts: toPayload(generateDefaultShifts(newYear, newMonth)),
      });

      if (saveError) {
        await supabase.from("duty_rosters").delete().eq("id", data.id);
        setError("تعذر إنشاء أيام الشهر: " + saveError.message);
        return;
      }

      const list = await loadRosters();
      const created = list.find((r) => r.id === data.id) ?? (data as Roster);

      await openRoster(created);
      setShowCreate(false);
      setSuccess(`تم إنشاء مسودة نوبتجية ${MONTHS[newMonth - 1]} ${toAr(newYear)}.`);

      await log("CREATE", "إنشاء نوبتجية", `${MONTHS[newMonth - 1]} ${newYear}`);
    } finally {
      setBusy(false);
    }
  }

  // =====================================================
  // تعديل الفترات (دمج / فصل / إجازة / تعيين)
  // =====================================================

  function updateShift(index: number, patch: Partial<Shift>) {
    setShifts((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function assignShift(index: number, userId: string) {
    const candidate = candidates.find((c) => c.user_id === userId);

    updateShift(
      index,
      candidate
        ? {
            assigned_user_id: candidate.user_id,
            assigned_name: candidate.name,
            assigned_rank: candidate.rank,
            assigned_office: candidate.office,
          }
        : {
            assigned_user_id: null,
            assigned_name: null,
            assigned_rank: null,
            assigned_office: null,
          }
    );
  }

  // دمج الفترة اللي في target مع اللي قبلها
  function mergeAt(target: number, extraNote = "") {
    setShifts((prev) => {
      if (target <= 0 || target >= prev.length) return prev;

      const a = prev[target - 1];
      const b = prev[target];

      const merged: Shift = {
        ...a,
        end_date: b.end_date,
        note: joinNotes(joinNotes(a.note, b.note), extraNote),
        signed_at: null,
        ...(a.assigned_user_id
          ? {}
          : {
              assigned_user_id: b.assigned_user_id,
              assigned_name: b.assigned_name,
              assigned_rank: b.assigned_rank,
              assigned_office: b.assigned_office,
            }),
      };

      return [...prev.slice(0, target - 1), merged, ...prev.slice(target + 1)];
    });
  }

  // إجازة رسمية: تتدمج مع اليوم اللي قبلها (أو اللي بعدها لو هي أول يوم)
  function markHoliday(index: number) {
    const target = index > 0 ? index : 1;
    mergeAt(target, HOLIDAY_NOTE);
  }

  // فصل الفترة لأيام منفصلة (أول يوم يفضل مع الفرد المعيّن، والباقي بدون تعيين)
  function splitShift(index: number) {
    setShifts((prev) => {
      const shift = prev[index];
      const days = dayCount(shift.start_date, shift.end_date);

      if (days <= 1) return prev;

      const parts: Shift[] = [];

      for (let i = 0; i < days; i += 1) {
        const date = addDays(shift.start_date, i);

        parts.push(
          i === 0
            ? { ...shift, start_date: date, end_date: date, signed_at: null }
            : newShift(date, date)
        );
      }

      return [...prev.slice(0, index), ...parts, ...prev.slice(index + 1)];
    });
  }

  // =====================================================
  // حفظ / اعتماد / حذف
  // =====================================================

  async function persistShifts(): Promise<boolean> {
    if (!selectedRoster) return false;

    const { error: saveError } = await supabase.rpc("save_duty_roster_shifts", {
      p_roster_id: selectedRoster.id,
      p_shifts: toPayload(shifts),
    });

    if (saveError) {
      setError("تعذر حفظ النوبتجية: " + saveError.message);
      return false;
    }

    await loadShifts(selectedRoster.id);
    await loadRosters(); // عشان لو توقيع رئيس الفرع اتلغى بسبب التعديل
    return true;
  }

  async function handleSave() {
    if (!selectedRoster) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const ok = await persistShifts();
      if (!ok) return;

      if (isLocked) {
        setEditOverride(null);
        setSuccess(
          isPublished
            ? "تم حفظ التعديلات. تم إلغاء توقيع الفترات التي تغيّرت فقط."
            : "تم حفظ التعديلات. تم إلغاء توقيع رئيس الفرع ويحتاج التوقيع من جديد."
        );
        await log(
          "UPDATE",
          isPublished ? "تعديل نوبتجية منشورة" : "تعديل نوبتجية معتمدة",
          `${MONTHS[selectedRoster.month - 1]} ${selectedRoster.year}`
        );
      } else {
        setSuccess("تم حفظ المسودة.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove() {
    if (!selectedRoster || selectedRoster.status !== "published") return;

    const unassigned = shifts.filter((s) => !s.assigned_user_id);

    if (unassigned.length > 0) {
      setError(
        `لا يمكن الاعتماد: يوجد ${toAr(unassigned.length)} فترة بدون ضابط صف معيّن.`
      );
      return;
    }

    const unsigned = shifts.filter((s) => !s.signed_at).length;

    const confirmMessage =
      unsigned > 0
        ? `يوجد ${toAr(unsigned)} فترة لم يوقّع عليها ضابط الصف بعد. هل تريد اعتماد النوبتجية وإرسالها لرئيس الفرع للتوقيع؟`
        : "هل تريد اعتماد النوبتجية وإرسالها لرئيس الفرع للتوقيع؟";

    if (!window.confirm(confirmMessage)) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const { error: approveError } = await supabase.rpc("approve_duty_roster", {
        p_roster_id: selectedRoster.id,
      });

      if (approveError) {
        setError("تعذر اعتماد النوبتجية: " + approveError.message);
        return;
      }

      const list = await loadRosters();
      const fresh = list.find((r) => r.id === selectedRoster.id);
      if (fresh) await openRoster(fresh);

      setSuccess("تم اعتماد النوبتجية وإرسالها لرئيس الفرع للتوقيع.");
      await log(
        "UPDATE",
        "اعتماد نوبتجية",
        `${MONTHS[selectedRoster.month - 1]} ${selectedRoster.year}`
      );
    } finally {
      setBusy(false);
    }
  }
  async function handleDeleteDraft() {
    if (!selectedRoster || isLocked) return;

    if (!window.confirm("هل تريد حذف هذه المسودة نهائيًا؟")) return;

    setBusy(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("duty_rosters")
        .delete()
        .eq("id", selectedRoster.id);

      if (deleteError) {
        setError("تعذر حذف المسودة: " + deleteError.message);
        return;
      }

      await log(
        "DELETE",
        "حذف مسودة نوبتجية",
        `${MONTHS[selectedRoster.month - 1]} ${selectedRoster.year}`
      );

      const list = await loadRosters();

      if (list.length > 0) {
        await openRoster(list[0]);
      } else {
        setSelectedRosterId(null);
        setShifts([]);
        setSavedSnapshot("[]");
      }

      setSuccess("تم حذف المسودة.");
    } finally {
      setBusy(false);
    }
  }

  function handleCancelEdit() {
    if (isDirty && !window.confirm("سيتم تجاهل التعديلات غير المحفوظة. هل أنت متأكد؟")) {
      return;
    }

    if (selectedRoster) void loadShifts(selectedRoster.id);
    setEditOverride(false);
  }

  // =====================================================
  // التوقيع
  // =====================================================

  async function handleSign(shiftId: string) {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const { error: signError } = await supabase.rpc("sign_duty_shift", {
        p_shift_id: shiftId,
      });

      if (signError) {
        setError(signError.message);
        return;
      }

      if (selectedRoster) await loadShifts(selectedRoster.id);
      setSuccess("تم التوقيع بنجاح.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignAll() {
    if (!selectedRoster) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const { error: signError } = await supabase.rpc("sign_my_duty_shifts", {
        p_roster_id: selectedRoster.id,
      });

      if (signError) {
        setError(signError.message);
        return;
      }

      await loadShifts(selectedRoster.id);
      setSuccess("تم التوقيع على كل أيامك بنجاح.");
    } finally {
      setBusy(false);
    }
  }

  // =====================================================
  // توقيع رئيس الفرع
  // =====================================================

  async function handleHeadSign() {
    if (!selectedRoster) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const { error: signError } = await supabase.rpc("sign_duty_roster_as_head", {
        p_roster_id: selectedRoster.id,
      });

      if (signError) {
        setError(signError.message);
        return;
      }

      await loadRosters();
      setSuccess("تم توقيعك على النوبتجية بنجاح.");
      await log(
        "UPDATE",
        "توقيع رئيس الفرع على نوبتجية",
        `${MONTHS[selectedRoster.month - 1]} ${selectedRoster.year}`
      );
    } finally {
      setBusy(false);
    }
  }

  // =====================================================
  // نشر النوبتجية (بيبعت التنبيهات لكل فرد من داخل قاعدة البيانات)
  // =====================================================

  async function handlePublish() {
    if (!selectedRoster || selectedRoster.status !== "draft") return;

    const unassigned = shifts.filter((s) => !s.assigned_user_id);

    if (unassigned.length > 0) {
      setError(
        `لا يمكن النشر: يوجد ${toAr(unassigned.length)} فترة بدون ضابط صف معيّن.`
      );
      return;
    }

    if (
      !window.confirm(
        "هل تريد نشر النوبتجية؟ ستظهر لكل المستخدمين ويصلهم تنبيه، ويبدأ توقيع ضباط الصف. بعدها يعتمدها المسؤول وترسل لرئيس الفرع."
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      // نحفظ آخر تعديلات المسودة قبل النشر
      const ok = await persistShifts();
      if (!ok) return;

      const { error: publishError } = await supabase.rpc("publish_duty_roster", {
        p_roster_id: selectedRoster.id,
      });

      if (publishError) {
        setError(publishError.message);
        return;
      }

      const list = await loadRosters();
      const fresh = list.find((r) => r.id === selectedRoster.id);
      if (fresh) await openRoster(fresh);

      setSuccess("تم نشر النوبتجية وإرسال التنبيهات لكل المستخدمين.");
      await log(
        "UPDATE",
        "نشر نوبتجية",
        `${MONTHS[selectedRoster.month - 1]} ${selectedRoster.year}`
      );
    } finally {
      setBusy(false);
    }
  }

  // =====================================================
  // الطباعة (متاحة دايمًا: مسودة أو معتمدة، وبالتعديلات الحالية)
  // =====================================================

  async function handlePrint() {
    if (!selectedRoster) return;

    // لازم نفتح النافذة فورًا قبل أي await، وإلا المتصفح ممكن يحجبها
    const printWindow = window.open("", "_blank", "width=900,height=1200");

    if (!printWindow) {
      setError("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    printWindow.document.write(
      '<p style="font-family:sans-serif;direction:rtl;padding:20px">جاري تجهيز الطباعة...</p>'
    );

    let branchHeadName = "";
    let branchHeadRank = "";

    try {
      const { data: branchHead } = await supabase
        .from("branch_heads")
        .select(
          `id, full_name, rank_id, rank:letter_officer_ranks!branch_heads_rank_id_fkey(name)`
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (branchHead) {
        const rawRank = (branchHead as any).rank;
        const rank = Array.isArray(rawRank) ? rawRank[0] : rawRank;

        branchHeadName = branchHead.full_name ?? "";
        branchHeadRank = rank?.name ?? "";
      }
    } catch {
      // لو تعذر تحميل رئيس الفرع نطبع بدون اسمه
    }

    const html = buildDutyPrintHtml({
      roster: selectedRoster,
      shifts,
      isApproved,
      branchHeadName,
      branchHeadRank,
      logoSrc: new URL(imgEagle, window.location.href).href,
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

  const myUnsignedCount = useMemo(
    () =>
      shifts.filter((s) => s.assigned_user_id === currentUser?.id && !s.signed_at).length,
    [shifts, currentUser]
  );

  const warnings = useMemo(() => {
    const out: string[] = [];

    for (let i = 1; i < shifts.length; i += 1) {
      const a = shifts[i - 1];
      const b = shifts[i];

      if (a.assigned_user_id && a.assigned_user_id === b.assigned_user_id) {
        out.push(
          `${a.assigned_name} معيّن في فترتين متتاليتين: ${rangeLabel(
            a.start_date,
            a.end_date
          )} و ${rangeLabel(b.start_date, b.end_date)}`
        );
      }
    }

    return out;
  }, [shifts]);

  const assignedCount = shifts.filter((s) => s.assigned_user_id).length;

  // =====================================================
  // Render
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[#00B867]" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 w-full"
      dir="rtl"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      {/* شريط اختيار الشهر */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-4 flex flex-wrap items-center gap-3">
        <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>النوبتجية</span>

        <select
          value={selectedRosterId ?? ""}
          onChange={(e) => void handleSelectRoster(e.target.value)}
          disabled={rosters.length === 0 || busy}
          className="h-[42px] min-w-[220px] rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none focus:border-[#00B867] disabled:opacity-60"
          style={{ fontSize: 14 }}
        >
          {rosters.length === 0 && <option value="">لا توجد نوبتجيات</option>}

          {rosters.map((r) => (
            <option key={r.id} value={r.id}>
              {MONTHS[r.month - 1]} {toAr(r.year)}
              {r.status === "draft"
                ? " (مسودة)"
                : r.status === "published"
                ? " (منشورة - بانتظار الاعتماد)"
                : " (معتمدة)"}
            </option>
          ))}
        </select>

        {canEdit && (
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            disabled={busy}
            className="mr-auto flex items-center gap-1 px-4 h-[42px] rounded-lg bg-[#DCF4DF] text-[#00522E] hover:opacity-80 transition-opacity disabled:opacity-50"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            <Plus size={16} />
            نوبتجية شهر جديد
          </button>
        )}
      </div>

      {/* إنشاء شهر جديد */}
      {showCreate && canEdit && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] p-4 flex flex-wrap items-end gap-3">
          <div>
            <label style={{ fontSize: 13, color: "#717d96", display: "block", marginBottom: 4 }}>
              الشهر
            </label>
            <select
              value={newMonth}
              onChange={(e) => setNewMonth(Number(e.target.value))}
              className="h-[42px] min-w-[160px] rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none focus:border-[#00B867]"
            >
              {MONTHS.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, color: "#717d96", display: "block", marginBottom: 4 }}>
              السنة
            </label>
            <select
              value={newYear}
              onChange={(e) => setNewYear(Number(e.target.value))}
              className="h-[42px] min-w-[120px] rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none focus:border-[#00B867]"
            >
              {[today.getFullYear(), today.getFullYear() + 1, today.getFullYear() + 2].map(
                (year) => (
                  <option key={year} value={year}>
                    {toAr(year)}
                  </option>
                )
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={busy}
            className="flex items-center gap-2 px-5 h-[42px] rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            إنشاء المسودة
          </button>

          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className="h-[42px] px-4 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-gray-50"
            style={{ fontSize: 14 }}
          >
            إلغاء
          </button>

          <p style={{ fontSize: 12, color: "#94a3b8", width: "100%" }}>
            الخميس والجمعة بيتدمجوا تلقائيًا في فترة واحدة، وباقي الأيام كل يوم لوحده.
          </p>
        </div>
      )}

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

      {/* لا توجد نوبتجية */}
      {!selectedRoster && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] py-16 text-center text-[#717d96]">
          {canEdit
            ? "لا توجد نوبتجيات بعد. اضغط «نوبتجية شهر جديد» للبدء."
                  : "لا توجد نوبتجية منشورة حتى الآن."}
        </div>
      )}

      {/* بطاقة النوبتجية */}
      {selectedRoster && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
          {/* الرأس */}
          <div className="px-5 py-4 border-b border-[#eff0f6] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p style={{ fontSize: 18, fontWeight: 700, color: "#2d3648" }}>
                نوبتجية {MONTHS[selectedRoster.month - 1]} {toAr(selectedRoster.year)}
              </p>

              <span
                className="px-3 py-1 rounded-full"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  background: isApproved ? "#DCF4DF" : isPublished ? "#e8f0fe" : "#fff8e8",
                  color: isApproved ? "#00522E" : isPublished ? "#172e78" : "#8a6500",
                }}
              >
                {isApproved ? "معتمدة" : isPublished ? "منشورة (بانتظار الاعتماد)" : "مسودة"}
              </span>
              {isEditing && (
                <span style={{ fontSize: 12, color: "#717d96" }}>
                  تم تعيين {toAr(assignedCount)} من {toAr(shifts.length)} فترة
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* الطباعة: متاحة دايمًا */}
              <button
                type="button"
                onClick={() => void handlePrint()}
                disabled={busy || shifts.length === 0}
                className="flex items-center gap-2 px-4 h-10 rounded-lg border border-[#2d3648] bg-white text-[#2d3648] hover:bg-gray-50 disabled:opacity-50"
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                <Printer size={16} />
                طباعة
              </button>

              {/* توقيع رئيس الفرع: يظهر بس بعد اعتماد المسؤول */}
              {canHeadSign &&
                isApproved &&
                !isEditing &&
                !selectedRoster.head_signed_at && (
                  <button
                    type="button"
                    onClick={() => void handleHeadSign()}
                    disabled={busy}
                    className="flex items-center gap-2 px-4 h-10 rounded-lg bg-[#172e78] text-white hover:opacity-90 disabled:opacity-50"
                    style={{ fontSize: 14, fontWeight: 700 }}
                  >
                    <PenLine size={16} />
                    توقيع رئيس الفرع
                  </button>
                )}

              {/* الاعتماد: بعد النشر، وبيبعتها لرئيس الفرع */}
              {canEdit && isPublished && !isEditing && (
                <button
                  type="button"
                  onClick={() => void handleApprove()}
                  disabled={busy}
                  className="flex items-center gap-2 px-4 h-10 rounded-lg bg-[#172e78] text-white hover:opacity-90 disabled:opacity-50"
                  style={{ fontSize: 14, fontWeight: 700 }}
                >
                  <CheckCircle2 size={16} />
                  اعتماد وإرسال لرئيس الفرع
                </button>
              )}

              {/* توقيع ضابط الصف (بعد النشر) */}
              {isLocked && !isEditing && myUnsignedCount > 0 && (
                <button
                  type="button"
                  onClick={() => void handleSignAll()}
                  disabled={busy}
                  className="flex items-center gap-2 px-4 h-10 rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
                  style={{ fontSize: 14, fontWeight: 700 }}
                >
                  <PenLine size={16} />
                  توقيع كل أيامي ({toAr(myUnsignedCount)})
                </button>
              )}

              {/* المسؤول: بدء التعديل على نوبتجية منشورة أو معتمدة */}
              {canEdit && isLocked && !isEditing && (
                <button
                  type="button"
                  onClick={() => setEditOverride(true)}
                  className="flex items-center gap-2 px-4 h-10 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50"
                  style={{ fontSize: 14, fontWeight: 700 }}
                >
                  <Pencil size={16} />
                  تعديل النوبتجية
                </button>
              )}

              {isEditing && (
                <>
                  {isLocked && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={busy}
                      className="px-4 h-10 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-gray-50 disabled:opacity-50"
                      style={{ fontSize: 14 }}
                    >
                      إلغاء التعديل
                    </button>
                  )}

                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteDraft()}
                      disabled={busy}
                      className="flex items-center gap-1 px-4 h-10 rounded-lg bg-[#fef2f2] text-[#991b1b] hover:opacity-80 disabled:opacity-50"
                      style={{ fontSize: 14, fontWeight: 700 }}
                    >
                      <Trash2 size={15} />
                      حذف المسودة
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={busy || !isDirty}
                    className="flex items-center gap-2 px-4 h-10 rounded-lg border border-[#00B867] text-[#00522E] hover:bg-[#f0fdf4] disabled:opacity-50"
                    style={{ fontSize: 14, fontWeight: 700 }}
                  >
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {isLocked ? "حفظ التعديلات" : "حفظ المسودة"}
                  </button>

                  {/* النشر: من المسودة مباشرة */}
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => void handlePublish()}
                      disabled={busy}
                      className="flex items-center gap-2 px-4 h-10 rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
                      style={{ fontSize: 14, fontWeight: 700 }}
                    >
                      <Send size={16} />
                      نشر النوبتجية
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* تنبيهات */}
                  {isEditing && isLocked && (
            <div className="px-5 py-3 bg-[#fff8e8] border-b border-[#f4d58d]" style={{ fontSize: 13, color: "#8a6500" }}>
                        {isPublished
                ? "هذه نوبتجية منشورة: أي تغيير في فرد أو تواريخ فترة بيلغي توقيع هذه الفترة فقط."
                : "هذه نوبتجية معتمدة: أي تعديل عليها بيلغي توقيع رئيس الفرع ويحتاج يوقّع من جديد."}
            </div>
          )}

          {isEditing && warnings.length > 0 && (
            <div className="px-5 py-3 bg-[#fff8e8] border-b border-[#f4d58d] flex flex-col gap-1">
              {warnings.map((warning) => (
                <span key={warning} style={{ fontSize: 13, color: "#8a6500" }}>
                  تنبيه: {warning}
                </span>
              ))}
            </div>
          )}

          {/* توقيع رئيس الفرع */}
          {isApproved && (
            <div
              className="px-5 py-3 border-b border-[#eff0f6] flex flex-wrap items-center gap-2"
              style={{ background: selectedRoster.head_signed_at ? "#f6fcf8" : "#f8fafc" }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#2d3648" }}>
                توقيع رئيس الفرع:
              </span>

              {selectedRoster.head_signed_at ? (
                <span style={{ fontSize: 13, color: "#166534" }}>
                  تم التوقيع ✓{" "}
                  {[selectedRoster.head_signed_rank, selectedRoster.head_signed_name]
                    .filter(Boolean)
                    .join(" ")}{" "}
                  — {formatDateTime(selectedRoster.head_signed_at)}
                </span>
              ) : (
                <span style={{ fontSize: 13, color: "#94a3b8" }}>بانتظار التوقيع</span>
              )}

                  {!selectedRoster.head_signed_at && (
                <span style={{ fontSize: 12, color: "#94a3b8", marginRight: "auto" }}>
                  تم اعتماد النوبتجية وإرسالها لرئيس الفرع للتوقيع
                </span>
              )}
            </div>
          )}

          {/* الجدول */}
          <div className="overflow-x-auto">
            {isEditing ? (
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                    <th className="text-right px-4 py-3">الفترة</th>
                    <th className="text-right px-4 py-3">الأيام</th>
                    <th className="text-right px-4 py-3">ضابط الصف</th>
                    <th className="text-right px-4 py-3">المكتب</th>
                    <th className="text-right px-4 py-3">ملاحظة</th>
                    <th className="text-right px-4 py-3">إجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {shifts.map((shift, index) => {
                    const days = dayCount(shift.start_date, shift.end_date);
                    const hasCurrentInList = candidates.some(
                      (c) => c.user_id === shift.assigned_user_id
                    );

                    return (
                      <tr key={shift.key} className="border-t border-[#eff0f6]">
                        <td className="px-4 py-3" style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                          {rangeLabel(shift.start_date, shift.end_date)}
                        </td>

                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#717d96" }}>
                          {toAr(days)}
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={shift.assigned_user_id ?? ""}
                            onChange={(e) => assignShift(index, e.target.value)}
                            disabled={busy}
                            className="w-full min-w-[240px] h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none focus:border-[#00B867]"
                            style={{ fontSize: 13 }}
                          >
                            <option value="">اختر ضابط الصف</option>

                            {shift.assigned_user_id && !hasCurrentInList && (
                              <option value={shift.assigned_user_id}>
                                {shift.assigned_name} (غير متاح حاليًا)
                              </option>
                            )}

                            {candidates.map((c) => (
                              <option key={c.user_id} value={c.user_id}>
                                {c.rank ? `${c.rank} ` : ""}
                                {c.name} — {c.office}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                          {shift.assigned_office || "—"}
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={shift.note}
                            onChange={(e) => updateShift(index, { note: e.target.value })}
                            placeholder="مثال: إجازة رسمية"
                            className="w-full min-w-[150px] h-10 rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]"
                            style={{ fontSize: 13 }}
                          />
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              title="دمج مع الفترة السابقة"
                              onClick={() => mergeAt(index)}
                              disabled={index === 0}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <Link2 size={16} />
                            </button>

                            <button
                              type="button"
                              title="فصل لأيام منفصلة"
                              onClick={() => splitShift(index)}
                              disabled={days <= 1}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <Scissors size={16} />
                            </button>

                            <button
                              type="button"
                              title="إجازة رسمية (تتدمج مع اليوم السابق)"
                              onClick={() => markHoliday(index)}
                              disabled={shifts.length < 2}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-purple-50 hover:text-purple-600 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <CalendarOff size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                    <th className="text-right px-4 py-3">الفترة</th>
                    <th className="text-right px-4 py-3">الأيام</th>
                    <th className="text-right px-4 py-3">الرتبة والاسم</th>
                    <th className="text-right px-4 py-3">المكتب</th>
                    <th className="text-right px-4 py-3">ملاحظة</th>
                    <th className="text-right px-4 py-3">التوقيع</th>
                  </tr>
                </thead>

                <tbody>
                  {shifts.map((shift) => {
                    const isMine = shift.assigned_user_id === currentUser?.id;

                    return (
                      <tr
                        key={shift.key}
                        className="border-t border-[#eff0f6]"
                        style={{ background: isMine ? "#f6fcf8" : undefined }}
                      >
                        <td className="px-4 py-3" style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                          {rangeLabel(shift.start_date, shift.end_date)}
                        </td>

                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#717d96" }}>
                          {toAr(dayCount(shift.start_date, shift.end_date))}
                        </td>

                        <td className="px-4 py-3" style={{ fontSize: 14, color: "#2d3648" }}>
                          {shift.assigned_name
                            ? `${shift.assigned_rank ? shift.assigned_rank + " " : ""}${shift.assigned_name}`
                            : "—"}
                        </td>

                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                          {shift.assigned_office || "—"}
                        </td>

                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#717d96" }}>
                          {shift.note || "—"}
                        </td>

                        <td className="px-4 py-3">
                          {shift.signed_at ? (
                            <div className="flex flex-col">
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>
                                تم التوقيع ✓
                              </span>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                {formatDateTime(shift.signed_at)}
                              </span>
                            </div>
                                                              ) : isLocked && isMine && shift.id ? (
                            <button
                              type="button"
                              onClick={() => void handleSign(shift.id as string)}
                              disabled={busy}
                              className="flex items-center gap-1 px-3 h-9 rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
                              style={{ fontSize: 13, fontWeight: 700 }}
                            >
                              <PenLine size={14} />
                              توقيع
                            </button>
                          ) : (
                            <span style={{ fontSize: 13, color: "#94a3b8" }}>
                              {isLocked ? "لم يوقّع بعد" : "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}