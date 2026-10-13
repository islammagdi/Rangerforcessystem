import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Loader2,
  X,
  UserX,
  UserCheck,
  RotateCcw,
  Upload,
  Eye,
  Trash2,
  Undo2,
  UserPlus,
  Printer,
  BarChart3,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { logActivity } from "../../lib/logActivity";
import { createNotification } from "../../lib/createNotification";
import { formatDate, pickOne, toAr, toEnglishDigits } from "./NcoDischargesPage";
import imgEagle from "figma:asset/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";

const EDIT_PERMISSION = "absence_decisions:edit";
const DOCS_BUCKET = "absence-decision-documents";
const MAX_FILE_MB = 10;
  //added
type Mode = "absence" | "return";

type Candidate = {
  id: string;
  full_name: string;
  military_number: string;
  rank_name: string | null;
  unit_name: string | null;
  category_code: string | null;
  discharge_date: string | null;
  // للضم فقط
  absence_start_date?: string;
  absence_decision_number?: string;
};

type AbsenceRecord = {
  id: string;
  personnel_id: string;
  full_name: string;
  military_number: string;
  rank_name: string | null;
  absence_decision_number: string;
  absence_decision_date: string;
  absence_start_date: string;
  absence_notes: string | null;
  absence_file_path: string | null;
  return_decision_number: string | null;
  return_decision_date: string | null;
  return_notes: string | null;
  return_file_path: string | null;
  exempt_days: number;
  absence_days: number | null;
  previous_discharge_date: string | null;
  new_discharge_date: string | null;
  returned_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  unit_name: string | null;
  created_at: string;
};

type RecordState = "open" | "returned" | "cancelled";

const stateOf = (r: AbsenceRecord): RecordState =>
  r.cancelled_at ? "cancelled" : r.returned_at ? "returned" : "open";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  const a = new Date(fy, fm - 1, fd).getTime();
  const b = new Date(ty, tm - 1, td).getTime();
  return Math.round((b - a) / 86400000);
}

async function openSignedFile(path: string, onError: (msg: string) => void) {
  const win = window.open("", "_blank");

  const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(path, 60 * 10);

  if (error || !data?.signedUrl) {
    win?.close();
    onError("تعذر فتح صورة القرار: " + (error?.message ?? ""));
    return;
  }

  if (win) win.location.href = data.signedUrl;
  else window.open(data.signedUrl, "_blank");
}

async function getCurrentUserInfo(): Promise<{ userId: string | null; userName: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, userName: "غير معروف" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, userName: profile?.full_name ?? profile?.username ?? "غير معروف" };
}

const personLabel = (p: { rank_name: string | null; full_name: string }) =>
  `${p.rank_name ? p.rank_name + " / " : ""}${p.full_name}`;

export function AbsenceDecisionsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(EDIT_PERMISSION);
  const canOpenIndividual = hasPermission("individual_query:view");

  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // فلاتر السجل
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<"all" | RecordState>("all");
  const [minDays, setMinDays] = useState(0);

  // النموذج
  const [mode, setMode] = useState<Mode>("absence");
  const [militaryInput, setMilitaryInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [decisionNumber, setDecisionNumber] = useState("");
  const [decisionDate, setDecisionDate] = useState(todayIso());
  const [startDate, setStartDate] = useState("");
  const [exemptDays, setExemptDays] = useState("0");
  // تاريخ التسريح الجديد لكل فرد (بمفتاح personnel_id)
  const [dischargeDates, setDischargeDates] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // معاينة الضم
  const [previews, setPreviews] = useState<Record<string, any>>({});

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");

    const { data, error: loadErr } = await supabase
      .from("absence_decisions")
      .select(
        `id, personnel_id, absence_decision_number, absence_decision_date, absence_start_date,
         absence_notes, absence_file_path, return_decision_number, return_decision_date,
         return_notes, return_file_path, exempt_days, absence_days, previous_discharge_date,
         new_discharge_date, returned_at, cancelled_at, cancel_reason, created_at,
personnel:personnel_id(full_name, military_number, rank:rank_id(name), primary_unit:primary_unit_id(name))`
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (loadErr) {
      setError("تعذر تحميل البيانات: " + loadErr.message);
      setLoading(false);
      return;
    }

    setRecords(
      (data ?? []).map((row: any) => {
        const p = pickOne<any>(row.personnel);
        return {
          id: row.id,
          personnel_id: row.personnel_id,
          full_name: p?.full_name ?? "-",
          military_number: p?.military_number ?? "",
          rank_name: pickOne<any>(p?.rank)?.name ?? null,
          unit_name: pickOne<any>(p?.primary_unit)?.name ?? null,
          absence_decision_number: row.absence_decision_number,
          absence_decision_date: row.absence_decision_date,
          absence_start_date: row.absence_start_date,
          absence_notes: row.absence_notes,
          absence_file_path: row.absence_file_path,
          return_decision_number: row.return_decision_number,
          return_decision_date: row.return_decision_date,
          return_notes: row.return_notes,
          return_file_path: row.return_file_path,
          exempt_days: row.exempt_days ?? 0,
          absence_days: row.absence_days,
          previous_discharge_date: row.previous_discharge_date,
          new_discharge_date: row.new_discharge_date,
          returned_at: row.returned_at,
          cancelled_at: row.cancelled_at,
          cancel_reason: row.cancel_reason,
          created_at: row.created_at,
        };
      })
    );
    setLoading(false);
  }

  // ---------------------------------------------------
  // معاينة الضم (أيام الغياب + التسريح الجديد + الدفعة)
  // ---------------------------------------------------

  useEffect(() => {
    if (mode !== "return" || candidates.length === 0 || !decisionDate) {
      setPreviews({});
      return;
    }

    let stale = false;
    const exempt = Number(exemptDays) || 0;
    void (async () => {
      const entries = await Promise.all(
        candidates.map(async (c) => {
          const { data, error: rpcError } = await supabase.rpc("absence_return_preview", {
            p_personnel_id: c.id,
            p_return_date: decisionDate,
            p_exempt_days: exempt,
            p_new_discharge_date: dischargeDates[c.id] || null,
          });
          return [c.id, rpcError ? { error: rpcError.message } : data] as const;
        })
      );

      if (!stale) setPreviews(Object.fromEntries(entries));
    })();

    return () => {
      stale = true;
    };
  }, [mode, candidates, decisionDate, exemptDays, dischargeDates]);

  // ---------------------------------------------------
  // النموذج
  // ---------------------------------------------------

  function resetForm() {
    setCandidates([]);
    setMilitaryInput("");
    setLookupError("");
    setDecisionNumber("");
    setDecisionDate(todayIso());
    setStartDate("");
    setExemptDays("0");
    setDischargeDates({});
    setNotes("");
    setFile(null);
    setPreviews({});
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    resetForm();
    setError("");
    setMode(next);
  }

  async function addPerson() {
    const number = toEnglishDigits(militaryInput).trim();

    setLookupError("");

    if (!number) {
      setLookupError("اكتب الرقم العسكري.");
      return;
    }

    if (candidates.some((c) => c.military_number === number)) {
      setLookupError("الفرد ده مضاف للقرار بالفعل.");
      return;
    }

    setLookingUp(true);

    try {
      const { data, error: lookupErr } = await supabase
        .from("personnel")
        .select(
          `id, full_name, military_number, is_active, discharge_date,
           rank:rank_id(name),
           category:personnel_category_id(code),
           status:service_status_id(code),
           primary_unit:primary_unit_id(name)`
        )
        .eq("military_number", number)
        .maybeSingle();

      if (lookupErr) {
        setLookupError("تعذر البحث: " + lookupErr.message);
        return;
      }

      if (!data) {
        setLookupError("لا يوجد فرد بهذا الرقم العسكري.");
        return;
      }

      const row: any = data;
      const statusCode: string | null = pickOne<any>(row.status)?.code ?? null;

      const base: Candidate = {
        id: row.id,
        full_name: row.full_name,
        military_number: row.military_number,
        rank_name: pickOne<any>(row.rank)?.name ?? null,
        unit_name: pickOne<any>(row.primary_unit)?.name ?? null,
        category_code: pickOne<any>(row.category)?.code ?? null,
        discharge_date: row.discharge_date ?? null,
      };

      if (mode === "return") {
        if (statusCode !== "ABSENT") {
          setLookupError("الفرد ده مش مسجل غائب.");
          return;
        }

        const { data: openRow, error: openErr } = await supabase
          .from("absence_decisions")
          .select("absence_start_date, absence_decision_number")
          .eq("personnel_id", row.id)
          .is("returned_at", null)
          .is("cancelled_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (openErr) {
          setLookupError("تعذر تحميل قرار الغياب: " + openErr.message);
          return;
        }

        if (!openRow) {
          setLookupError("الفرد غائب لكن مفيش قرار غياب مفتوح له. راجع البيانات.");
          return;
        }

        setCandidates((prev) => [
          ...prev,
          {
            ...base,
            absence_start_date: openRow.absence_start_date,
            absence_decision_number: openRow.absence_decision_number,
          },
        ]);
      } else {
        if (statusCode === "ABSENT") {
          setLookupError("الفرد ده غائب بالفعل. استخدم تبويب قرار الضم.");
          return;
        }

        if (
          row.is_active === false ||
          statusCode === "DISCHARGED" ||
          statusCode === "OUTSIDE_FORCE" ||
          statusCode === "TRANSFERRED_TO_OFFICERS"
        ) {
          setLookupError("الفرد ده خارج القوة بالفعل، ومينفعش يتسجل له قرار غياب.");
          return;
        }

        setCandidates((prev) => [...prev, base]);
      }

      setMilitaryInput("");
    } finally {
      setLookingUp(false);
    }
  }

  async function uploadFile(folder: string): Promise<string | null> {
    if (!file) return null;

    const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(DOCS_BUCKET)
      .upload(path, file, { contentType: file.type || undefined, upsert: false });

    if (uploadError) throw new Error("تعذر رفع صورة القرار: " + uploadError.message);

    return path;
  }

  function validate(): string | null {
    if (candidates.length === 0) return "ضيف فرد واحد على الأقل.";
    if (!decisionNumber.trim() || !decisionDate) return "اكتب رقم القرار وتاريخه.";
    if (decisionDate > todayIso()) return "تاريخ القرار لا يمكن أن يكون في المستقبل.";
    if (file && file.size > MAX_FILE_MB * 1024 * 1024) return `حجم الملف أكبر من ${toAr(MAX_FILE_MB)} ميجا.`;

    if (mode === "absence") {
      if (startDate && startDate > decisionDate) return "بداية الغياب لا يمكن أن تكون بعد تاريخ القرار.";
      return null;
    }

    const exempt = Number(exemptDays);
    if (!Number.isInteger(exempt) || exempt < 0) return "الأيام المعفاة لازم تكون رقم صحيح من صفر فأكبر.";

    for (const c of candidates) {
      if (c.absence_start_date && decisionDate < c.absence_start_date) {
        return `تاريخ الضم قبل بداية غياب ${personLabel(c)} (${formatDate(c.absence_start_date)}).`;
      }

      if (c.category_code === "CONSCRIPT" && !dischargeDates[c.id]) {
        return `اكتب تاريخ التسريح الجديد للمجند ${personLabel(c)}.`;
      }

      const p = previews[c.id];
      if (p?.error) return `${personLabel(c)}: ${p.error}`;
    }

    return null;
  }

  async function handleSubmit() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const isReturn = mode === "return";

    if (
      !window.confirm(
        isReturn
          ? `تسجيل قرار ضم رقم ${decisionNumber.trim()} لعدد ${toAr(candidates.length)} فرد؟\n\nهيرجعوا للقوة بحالتهم قبل الغياب.`
          : `تسجيل قرار غياب رقم ${decisionNumber.trim()} لعدد ${toAr(candidates.length)} فرد؟\n\nهيتحولوا لحالة "غائب" ويخرجوا من أرقام القوة.`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    let path: string | null = null;

    try {
      path = await uploadFile(isReturn ? "return" : "absence");

      const ids = candidates.map((c) => c.id);
      let message = "";

      if (isReturn) {
        const { data, error: rpcError } = await supabase.rpc("apply_return_decisions", {
          p_personnel_ids: ids,
          p_decision_number: decisionNumber.trim(),
          p_decision_date: decisionDate,
          p_exempt_days: Number(exemptDays) || 0,
          p_discharge_dates: dischargeDates,
          p_notes: notes.trim() || null,
          p_file_path: path,
          p_file_name: file?.name ?? null,
          p_file_size: file?.size ?? null,
          p_mime_type: file?.type || null,
        });

        if (rpcError) throw new Error(rpcError.message);

        const results = ((data as any)?.results ?? []) as {
          military_number: string;
          absence_days: number;
          new_discharge_date: string | null;
        }[];

        message =
          candidates.length === 1
            ? `تم ضم ${personLabel(candidates[0])}. أيام الغياب: ${toAr(results[0]?.absence_days ?? 0)}` +
              (results[0]?.new_discharge_date
                ? `، تاريخ التسريح الجديد: ${formatDate(results[0].new_discharge_date)}.`
                : ".")
            : `تم ضم ${toAr(candidates.length)} فرد بالقرار رقم ${decisionNumber.trim()}.`;
      } else {
        const { error: rpcError } = await supabase.rpc("apply_absence_decisions", {
          p_personnel_ids: ids,
          p_decision_number: decisionNumber.trim(),
          p_decision_date: decisionDate,
          p_start_date: startDate || null,
          p_notes: notes.trim() || null,
          p_file_path: path,
          p_file_name: file?.name ?? null,
          p_file_size: file?.size ?? null,
          p_mime_type: file?.type || null,
        });

        if (rpcError) throw new Error(rpcError.message);

        message = `تم تسجيل غياب ${toAr(candidates.length)} فرد بالقرار رقم ${decisionNumber.trim()} وتحويلهم لحالة "غائب".`;
      }

      try {
        const { userId, userName } = await getCurrentUserInfo();
        const actionLabel = isReturn ? "تسجيل قرار ضم بعد غياب" : "تسجيل قرار غياب";

        await logActivity({
          userId,
          userName,
          actionType: "UPDATE",
          action: actionLabel,
          entity: "قرارات الغياب والرجوع",
          details: [
            `القرار: ${decisionNumber.trim()} بتاريخ ${formatDate(decisionDate)}`,
            `الأفراد (${candidates.length}):`,
            ...candidates.map((c) => `- ${personLabel(c)} (${c.military_number})`),
          ].join("\n"),
        } as any);

        await createNotification({
          title: isReturn ? "قرار ضم بعد غياب" : "قرار غياب",
          body: isReturn
            ? `تم ضم ${candidates.length} فرد بالقرار رقم ${decisionNumber.trim()}`
            : `تم تسجيل غياب ${candidates.length} فرد بالقرار رقم ${decisionNumber.trim()}`,
          type: isReturn ? "info" : "warning",
          entityType: "personnel",
          entityId: candidates[0].id,
          userName,
        });
      } catch {
        // التسجيل والإشعار مش لازم يوقفوا العملية بعد ما تمت
      }

      setSuccess(message);
      resetForm();
      await loadAll();
    } catch (err: any) {
      // القرار متسجلش، فبنمسح الملف علشان ميفضلش يتيم
      if (path) await supabase.storage.from(DOCS_BUCKET).remove([path]);
      setError(err?.message || "حدث خطأ أثناء التسجيل");
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------
  // إلغاء قرار غياب
  // ---------------------------------------------------

  async function cancelRecord(r: AbsenceRecord) {
    const reason = window.prompt(
      `إلغاء قرار غياب ${personLabel(r)} رقم ${r.absence_decision_number}؟\n\nالفرد هيرجع لحالته قبل الغياب من غير قرار ضم.\n\nاكتب سبب الإلغاء:`
    );

    if (reason === null) return;

    if (!reason.trim()) {
      setError("لازم تكتب سبب الإلغاء.");
      return;
    }

    setCancelling(true);
    setError("");
    setSuccess("");

    try {
      const { error: rpcError } = await supabase.rpc("cancel_absence_decisions", {
        p_ids: [r.id],
        p_reason: reason.trim(),
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      try {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "UPDATE",
          action: "إلغاء قرار غياب",
          entity: "قرارات الغياب والرجوع",
          details: `${personLabel(r)} (${r.military_number}) - قرار رقم ${r.absence_decision_number} - السبب: ${reason.trim()}`,
        } as any);
      } catch {
        // التسجيل مش لازم يوقف العملية
      }

      setSuccess(`تم إلغاء قرار غياب ${personLabel(r)} ورجع لحالته قبل الغياب.`);
      await loadAll();
    } finally {
      setCancelling(false);
    }
  }

  // ---------------------------------------------------
  // السجل
  // ---------------------------------------------------

  // ---------------------------------------------------
  // الإحصائيات
  // ---------------------------------------------------

  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  async function toggleStats() {
    const next = !showStats;
    setShowStats(next);

    if (!next || stats) return;

    setStatsLoading(true);

    const { data, error: rpcError } = await supabase.rpc("absence_stats", { p_months: 12 });

    if (rpcError) {
      setError("تعذر تحميل الإحصائيات: " + rpcError.message);
    } else {
      setStats(data);
    }

    setStatsLoading(false);
  }

  // ---------------------------------------------------
  // طباعة كشف الغائبين حاليًا (حسب البحث والفلاتر الظاهرة)
  // ---------------------------------------------------

  function handlePrintAbsent() {
    const list = filtered.filter((r) => stateOf(r) === "open");

    if (list.length === 0) {
      setError("مفيش غائبين حاليًا في القائمة المعروضة علشان يتطبعوا.");
      return;
    }

    const esc = (v: string) =>
      v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const printWindow = window.open("", "_blank", "width=900,height=1200");

    if (!printWindow) {
      setError("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    const logoSrc = new URL(imgEagle, window.location.href).href;

    const rowsHtml = list
      .map(
        (r, i) => `
        <tr>
          <td>${toAr(i + 1)}</td>
          <td>${esc(r.rank_name ?? "-")}</td>
          <td>${esc(r.full_name)}</td>
          <td>${esc(toAr(r.military_number))}</td>
          <td>${esc(r.unit_name ?? "-")}</td>
          <td>${esc(toAr(r.absence_decision_number))}<br/>${esc(toAr(formatDate(r.absence_decision_date)))}</td>
          <td>${esc(toAr(formatDate(r.absence_start_date)))}</td>
          <td>${toAr(daysBetween(r.absence_start_date, todayIso()))}</td>
        </tr>`
      )
      .join("");

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>كشف الغائبين ${esc(toAr(formatDate(todayIso())))}</title>
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      html, body { margin: 0; padding: 0; background: #fff; }
      body { direction: rtl; font-family: 'Times New Roman', Times, serif; font-size: 14px; color: #000; }
      .sheet { border: 1.5px solid #333; padding: 6mm; }
      .header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid #ddd; }
      .header-text p { margin: 0; font-size: 14px; }
      .header-text p.line1 { font-weight: 700; }
      .header-text p.line2 { margin: 3px 0; }
      .logo img { width: 55px; height: 55px; object-fit: contain; display: block; }
      .title { font-size: 18px; font-weight: 700; text-align: center; text-decoration: underline; margin: 0 0 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      thead { display: table-header-group; }
      th, td { border: 1px solid #999; padding: 5px; text-align: center; }
      th { background: #f5f5f5; }
      tr { page-break-inside: avoid; break-inside: avoid; }
      .total { margin-top: 12px; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        <div class="header-text">
          <p class="line1">قيـــــادة قـــوات الصـاعقـــة</p>
          <p class="line2">فــــــرع التنظيــــــم والإدارة</p>
          <p>التاريــخ : ${esc(toAr(formatDate(todayIso())))}</p>
        </div>
        <div class="logo"><img src="${esc(logoSrc)}" alt="" /></div>
      </div>

      <p class="title">كشف بالأفراد الغائبين</p>

      <table>
        <thead>
          <tr>
            <th>م</th><th>الرتبة</th><th>الاسم</th><th>الرقم العسكري</th>
            <th>الوحدة</th><th>قرار الغياب</th><th>بداية الغياب</th><th>المدة (يوم)</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <p class="total">إجمالي الغائبين: ${toAr(list.length)}</p>
    </div>
  </body>
</html>`);
    printWindow.document.close();

    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      window.setTimeout(() => printWindow.close(), 500);
    }, 700);
  }

  const today = todayIso();

  const openCount = useMemo(() => records.filter((r) => stateOf(r) === "open").length, [records]);

  const filtered = useMemo(() => {
    const q = toEnglishDigits(search.trim());

    return records.filter((r) => {
      const state = stateOf(r);

      if (stateFilter !== "all" && state !== stateFilter) return false;

      if (minDays > 0 && (state !== "open" || daysBetween(r.absence_start_date, today) < minDays)) {
        return false;
      }

      if (!q) return true;

      return (
        r.full_name.includes(q) ||
        r.military_number.includes(q) ||
        r.absence_decision_number.includes(q) ||
        (r.return_decision_number ?? "").includes(q)
      );
    });
  }, [records, search, stateFilter, minDays, today]);

  const inputClass =
    "w-full h-[42px] rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none focus:border-[#00B867]";

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#717d96",
    display: "block",
    marginBottom: 4,
  };

  const isReturn = mode === "return";


  function FileButton({ path, label }: { path: string | null; label: string }) {
    if (!path) return null;

    return (
      <button
        type="button"
        onClick={() => void openSignedFile(path, setError)}
        className="flex items-center gap-1 w-fit px-2 h-6 rounded-md bg-[#DCF4DF] text-[#00522E] hover:opacity-80"
        style={{ fontSize: 11, fontWeight: 700 }}
      >
        <Eye size={12} />
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl" style={{ fontFamily: "'Almarai', sans-serif" }}>
      {/* تسجيل قرار */}
      {canEdit && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p style={{ fontSize: 16, fontWeight: 700, color: "#2d3648" }}>تسجيل قرار</p>

            <div className="flex rounded-lg border border-[#cbd5e1] overflow-hidden mr-auto">
              {(
                [
                  ["absence", "قرار غياب"],
                  ["return", "قرار ضم"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => switchMode(value)}
                  disabled={saving}
                  className="px-4 h-[36px]"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    background: mode === value ? "#2d3648" : "#fff",
                    color: mode === value ? "#fff" : "#475569",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* بيانات القرار */}
          <div className="rounded-xl border border-[#eff0f6] p-4 flex flex-col gap-3">
            <p style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
              {isReturn ? "بيانات قرار الضم" : "بيانات قرار الغياب"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label style={labelStyle}>{isReturn ? "رقم قرار الضم *" : "رقم قرار الغياب *"}</label>
                <input
                  type="text"
                  value={decisionNumber}
                  onChange={(e) => setDecisionNumber(e.target.value)}
                  className={inputClass}
                  style={{ fontSize: 14 }}
                />
              </div>
              <div>
                <label style={labelStyle}>{isReturn ? "تاريخ قرار الضم *" : "تاريخ قرار الغياب *"}</label>
                <input
                  type="date"
                  value={decisionDate}
                  max={todayIso()}
                  onChange={(e) => setDecisionDate(e.target.value)}
                  className={inputClass}
                  style={{ fontSize: 14 }}
                />
              </div>

              {!isReturn && (
                <div>
                  <label style={labelStyle}>تاريخ بداية الغياب (اختياري)</label>
                  <input
                    type="date"
                    value={startDate}
                    max={decisionDate || todayIso()}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                    style={{ fontSize: 14 }}
                  />
                </div>
              )}




            </div>

            {isReturn && (
              <p style={{ fontSize: 12, color: "#b45309" }}>
                تاريخ التسريح الجديد بيتكتب يدويًا لكل مجند، ولازم يطابق تاريخ دفعة رديف موجودة وبعد تاريخ الضم.
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label style={labelStyle}>صورة القرار (اختياري)</label>
              <div className="flex items-center gap-2 flex-wrap">
                <label
                  className="flex items-center gap-2 px-4 h-[42px] rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50 cursor-pointer"
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  <Upload size={14} />
                  <span className="truncate max-w-[320px]">{file ? file.name : "اختيار ملف (PDF أو صورة)"}</span>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] ?? null);
                      e.target.value = "";
                    }}
                  />
                </label>
                {file && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#f5f6fb]"
                    title="إزالة الملف"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8" }}>بحد أقصى {toAr(MAX_FILE_MB)} ميجا.</p>
            </div>

            <div>
              <label style={labelStyle}>ملاحظات (اختياري)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 outline-none focus:border-[#00B867] resize-none"
                style={{ fontSize: 14 }}
              />
            </div>
          </div>

          {/* الأفراد */}
          <div className="rounded-xl border border-[#eff0f6] p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <p style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>الأفراد المشمولين بالقرار</p>
              <span
                className="px-2.5 py-0.5 rounded-full"
                style={{ fontSize: 12, fontWeight: 700, background: "#e8f0fe", color: "#172e78" }}
              >
                {toAr(candidates.length)} فرد
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                inputMode="numeric"
                value={militaryInput}
                onChange={(e) => {
                  setMilitaryInput(e.target.value);
                  setLookupError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void addPerson();
                  }
                }}
                placeholder="اكتب الرقم العسكري واضغط إضافة"
                dir="ltr"
                className="flex-1 min-w-[220px] h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867] text-left"
                style={{ fontSize: 15, letterSpacing: 1 }}
              />
              <button
                type="button"
                onClick={() => void addPerson()}
                disabled={lookingUp || !militaryInput.trim()}
                className="flex items-center gap-2 px-5 h-[42px] rounded-lg bg-[#2d3648] text-white hover:opacity-90 disabled:opacity-50"
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                {lookingUp ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                إضافة
              </button>
            </div>

            {lookupError && <p style={{ fontSize: 13, color: "#991b1b", fontWeight: 700 }}>{lookupError}</p>}

            {candidates.length > 0 && (
              <div className="rounded-xl border border-[#e2e7f0] overflow-hidden">
                {candidates.map((c, i) => {
                  const p = previews[c.id];

                  return (
                    <div
                      key={c.id}
                      className="px-4 py-3 border-b border-[#eff0f6] last:border-b-0 flex items-start gap-3 flex-wrap"
                    >
                      <span style={{ fontSize: 12, color: "#94a3b8", width: 20 }}>{toAr(i + 1)}</span>
                      <div className="flex flex-col min-w-0 gap-0.5">
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{personLabel(c)}</span>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>
                          {c.military_number}
                          {c.unit_name ? ` • ${c.unit_name}` : ""}
                          {c.discharge_date ? ` • التسريح: ${formatDate(c.discharge_date)}` : ""}
                        </span>

                        {isReturn && c.absence_start_date && (
                          <span style={{ fontSize: 12, color: "#991b1b" }}>
                            غائب بقرار {c.absence_decision_number} منذ {formatDate(c.absence_start_date)}
                          </span>
                        )}

                        {isReturn && p?.error && (
                          <span style={{ fontSize: 12, color: "#991b1b", fontWeight: 700 }}>{p.error}</span>
                        )}

                        {isReturn && p && !p.error && (
                          <span style={{ fontSize: 12, color: "#334155" }}>
                            أيام الغياب: {toAr(p.absence_days)}
                            {p.exempt_days > 0 ? ` (بعد إعفاء ${toAr(p.exempt_days)})` : ""}
                            {p.is_conscript && p.previous_discharge_date
                              ? ` • التسريح الحالي: ${formatDate(p.previous_discharge_date)}`
                              : ""}
                          </span>
                        )}

                        {isReturn && c.category_code === "CONSCRIPT" && (
                          <div className="flex flex-col gap-1 mt-1">
                            <label style={{ fontSize: 12, color: "#717d96" }}>تاريخ التسريح الجديد *</label>
                            <input
                              type="date"
                              value={dischargeDates[c.id] ?? ""}
                              onChange={(e) =>
                                setDischargeDates((prev) => ({ ...prev, [c.id]: e.target.value }))
                              }
                              className="h-[36px] w-[180px] rounded-lg border border-[#cbd5e1] bg-white px-2 outline-none focus:border-[#00B867]"
                              style={{ fontSize: 13 }}
                            />
                            {dischargeDates[c.id] && p?.batch_exact && (
                              <span style={{ fontSize: 12, color: "#00522E", fontWeight: 700 }}>
                                يقع في دفعة {p.batch_name || formatDate(p.batch_date)}.
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCandidates((prev) => prev.filter((x) => x.id !== c.id))}
                        title="شيل الفرد من القرار"
                        className="mr-auto w-8 h-8 rounded-lg flex items-center justify-center text-[#991b1b] hover:bg-[#fef2f2]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving || candidates.length === 0}
              className="flex items-center gap-2 px-5 h-[42px] rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isReturn ? (
                <UserCheck size={14} />
              ) : (
                <UserX size={14} />
              )}
              تطبيق القرار
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="h-[42px] px-4 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-gray-50"
              style={{ fontSize: 14 }}
            >
              مسح
            </button>
          </div>

          {!isReturn && (
            <p style={{ fontSize: 12, color: "#b45309" }}>
              تطبيق القرار هيحوّل كل الأفراد لحالة "غائب"، ويخرجهم من القوة والتمام ودفعة الرديف لحد ما يتسجل لهم قرار ضم.
              لو فرد واحد فيه مشكلة، القرار كله مش هيتسجل والرسالة هتقولك مين.
            </p>
          )}
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

      {/* أدوات: طباعة وإحصائيات */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handlePrintAbsent}
          disabled={loading}
          className="flex items-center gap-2 px-4 h-[40px] rounded-lg border border-[#2d3648] bg-white text-[#2d3648] hover:bg-gray-50 disabled:opacity-50"
          style={{ fontSize: 14, fontWeight: 700 }}
        >
          <Printer size={16} />
          طباعة كشف الغائبين
        </button>

        <button
          type="button"
          onClick={() => void toggleStats()}
          className="flex items-center gap-2 px-4 h-[40px] rounded-lg border border-[#cbd5e1] bg-white text-[#2d3648] hover:bg-gray-50"
          style={{ fontSize: 14, fontWeight: 700 }}
        >
          <BarChart3 size={16} />
          {showStats ? "إخفاء الإحصائيات" : "الإحصائيات"}
        </button>
      </div>

      {showStats && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-4">
          {statsLoading || !stats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[#00B867]" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3">
                <span
                  className="px-3 py-1.5 rounded-full"
                  style={{ fontSize: 13, fontWeight: 700, background: "#fef2f2", color: "#991b1b" }}
                >
                  غائبون حاليًا: {toAr(stats.open_count ?? 0)}
                </span>
                <span
                  className="px-3 py-1.5 rounded-full"
                  style={{ fontSize: 13, fontWeight: 700, background: "#e8f0fe", color: "#172e78" }}
                >
                  متوسط مدة الغياب (للعائدين):{" "}
                  {stats.avg_days !== null ? `${toAr(stats.avg_days)} يوم` : "-"}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#eff0f6] overflow-hidden">
                  <p className="px-4 py-3 bg-[#f8fafc]" style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                    آخر ١٢ شهر
                  </p>
                  <table className="w-full">
                    <thead>
                      <tr className="text-[#64748b] text-sm">
                        <th className="text-right px-4 py-2">الشهر</th>
                        <th className="text-right px-4 py-2">غياب</th>
                        <th className="text-right px-4 py-2">عودة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats.months ?? []).map((m: any) => (
                        <tr key={m.month} className="border-t border-[#eff0f6]">
                          <td className="px-4 py-2" style={{ fontSize: 13 }}>{toAr(m.month)}</td>
                          <td className="px-4 py-2" style={{ fontSize: 13, color: "#991b1b", fontWeight: 700 }}>
                            {toAr(m.absences)}
                          </td>
                          <td className="px-4 py-2" style={{ fontSize: 13, color: "#00522E", fontWeight: 700 }}>
                            {toAr(m.returns)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-[#eff0f6] overflow-hidden">
                  <p className="px-4 py-3 bg-[#f8fafc]" style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                    أكتر الوحدات غيابًا
                  </p>
                  <table className="w-full">
                    <tbody>
                      {(stats.top_units ?? []).length === 0 ? (
                        <tr>
                          <td className="px-4 py-4" style={{ fontSize: 13, color: "#94a3b8" }}>لا توجد بيانات.</td>
                        </tr>
                      ) : (
                        (stats.top_units as any[]).map((u) => (
                          <tr key={u.unit_name} className="border-t border-[#eff0f6] first:border-t-0">
                            <td className="px-4 py-2" style={{ fontSize: 13 }}>{u.unit_name}</td>
                            <td className="px-4 py-2" style={{ fontSize: 13, fontWeight: 700 }}>{toAr(u.cnt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* السجل */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
        <div className="p-4 border-b border-[#eff0f6] flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الرقم العسكري أو رقم القرار"
              className="w-full h-[42px] rounded-lg border border-[#cbd5e1] pr-9 pl-3 outline-none focus:border-[#00B867]"
              style={{ fontSize: 14 }}
            />
          </div>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value as "all" | RecordState)}
            className="h-[42px] rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none focus:border-[#00B867]"
            style={{ fontSize: 14 }}
          >
            <option value="all">كل الحالات</option>
            <option value="open">غائبون حاليًا</option>
            <option value="returned">عادوا</option>
            <option value="cancelled">ملغاة</option>
          </select>

          <select
            value={minDays}
            onChange={(e) => setMinDays(Number(e.target.value))}
            className="h-[42px] rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none focus:border-[#00B867]"
            style={{ fontSize: 14 }}
          >
            <option value={0}>أي مدة غياب</option>
            <option value={30}>غائب أكتر من ٣٠ يوم</option>
            <option value={60}>غائب أكتر من ٦٠ يوم</option>
            <option value={90}>غائب أكتر من ٩٠ يوم</option>
          </select>

          <span
            className="px-3 py-1.5 rounded-full"
            style={{ fontSize: 13, fontWeight: 700, background: "#fef2f2", color: "#991b1b" }}
          >
            غائبون حاليًا: {toAr(openCount)}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-[#00B867]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-[#717d96]">
            <RotateCcw size={28} className="text-[#cbd5e1]" />
            <span style={{ fontSize: 14 }}>
              {records.length > 0 ? "مفيش نتائج مطابقة للبحث." : "لسه مفيش قرارات غياب مسجلة."}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                  <th className="text-right px-4 py-3">الفرد</th>
                  <th className="text-right px-4 py-3">قرار الغياب</th>
                  <th className="text-right px-4 py-3">بداية الغياب</th>
                  <th className="text-right px-4 py-3">مدة الغياب</th>
                  <th className="text-right px-4 py-3">قرار الضم</th>
                  <th className="text-right px-4 py-3">التسريح (قبل ← بعد)</th>
                  <th className="text-right px-4 py-3">الحالة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const state = stateOf(r);
                  const liveDays = state === "open" ? daysBetween(r.absence_start_date, today) : null;

                  return (
                    <tr key={r.id} className="border-t border-[#eff0f6] align-top">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() =>
                              canOpenIndividual && navigate(`/dashboard/individual-query/soldier/${r.personnel_id}`)
                            }
                            className={`text-right ${canOpenIndividual ? "hover:underline" : "cursor-default"}`}
                            style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}
                          >
                            {personLabel(r)}
                          </button>
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.military_number}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                        <div className="flex flex-col gap-1">
                          <span style={{ fontWeight: 700 }}>رقم {r.absence_decision_number}</span>
                          <span style={{ fontSize: 12, color: "#717d96" }}>{formatDate(r.absence_decision_date)}</span>
                          <FileButton path={r.absence_file_path} label="عرض القرار" />
                        </div>
                      </td>

                      <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                        {formatDate(r.absence_start_date)}
                      </td>

                      <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                        {liveDays !== null ? (
                          <div className="flex flex-col">
                            <span
                              style={{
                                fontWeight: 700,
                                color: liveDays >= 90 ? "#991b1b" : liveDays >= 30 ? "#b45309" : "#334155",
                              }}
                            >
                              {toAr(liveDays)} يوم
                            </span>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>حتى اليوم</span>
                          </div>
                        ) : r.absence_days !== null ? (
                          <div className="flex flex-col">
                            <span style={{ fontWeight: 700 }}>{toAr(r.absence_days)} يوم</span>
                            {r.exempt_days > 0 && (
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>بعد إعفاء {toAr(r.exempt_days)}</span>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                        {r.return_decision_number ? (
                          <div className="flex flex-col gap-1">
                            <span style={{ fontWeight: 700 }}>رقم {r.return_decision_number}</span>
                            <span style={{ fontSize: 12, color: "#717d96" }}>
                              {r.return_decision_date ? formatDate(r.return_decision_date) : ""}
                            </span>
                            <FileButton path={r.return_file_path} label="عرض القرار" />
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                        {r.previous_discharge_date
                          ? `${formatDate(r.previous_discharge_date)} ← ${
                              r.new_discharge_date ? formatDate(r.new_discharge_date) : "-"
                            }`
                          : "-"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className="px-2.5 py-0.5 rounded-full w-fit"
                            title={r.cancel_reason ? `سبب الإلغاء: ${r.cancel_reason}` : undefined}
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              background:
                                state === "cancelled" ? "#f1f5f9" : state === "returned" ? "#DCF4DF" : "#fef2f2",
                              color: state === "cancelled" ? "#64748b" : state === "returned" ? "#00522E" : "#991b1b",
                            }}
                          >
                            {state === "cancelled"
                              ? `أُلغي ${formatDate(r.cancelled_at!)}`
                              : state === "returned"
                              ? `عاد ${formatDate(r.returned_at!)}`
                              : "غائب"}
                          </span>
                          {state === "cancelled" && r.cancel_reason && (
                            <span style={{ fontSize: 11, color: "#64748b" }}>السبب: {r.cancel_reason}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {canEdit && state === "open" && (
                          <button
                            type="button"
                            onClick={() => void cancelRecord(r)}
                            disabled={cancelling}
                            className="flex items-center gap-1 px-2.5 h-7 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-[#f5f6fb] disabled:opacity-50"
                            style={{ fontSize: 12, fontWeight: 700 }}
                          >
                            <Undo2 size={12} />
                            إلغاء القرار
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}