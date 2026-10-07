import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Loader2,
  X,
  Search,
  Upload,
  Eye,
  Trash2,
  ChevronDown,
  LogOut,
  UserPlus,
  Undo2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { logActivity } from "../../lib/logActivity";
import { createNotification } from "../../lib/createNotification";
import {
  ACTIVE_STATUSES,
  DECISION_AUTHORITY_SUGGESTIONS,
  formatDate,
  pickOne,
  toAr,
  toEnglishDigits,
} from "./NcoDischargesPage";

// =====================================================
// إعدادات
// =====================================================

const DOCS_BUCKET = "personnel-transfer-documents";
const MAX_FILE_MB = 10;
const EDIT_PERMISSION = "transfer_out:edit";

// =====================================================
// Types
// =====================================================

type DecisionItem = {
  id: string;
  personnel_id: string;
  full_name: string;
  military_number: string;
  rank_name: string | null;
  returned_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
};

type Decision = {
  id: string;
  decision_number: string;
  decision_date: string;
  decision_authority: string;
  destination: string;
  transfer_date: string;
  notes: string | null;
  file_path: string;
  file_name: string | null;
  created_at: string;
  creator_name: string | null;
  items: DecisionItem[];
};

type Candidate = {
  id: string;
  full_name: string;
  military_number: string;
  rank_name: string | null;
  unit_name: string | null;
  category_name: string | null;
};

// =====================================================
// Helpers
// =====================================================

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function openSignedFile(path: string, onError: (msg: string) => void) {
  // بنفتح النافذة الأول علشان المتصفح ميعتبرهاش popup
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

// =====================================================
// الصفحة
// =====================================================

export function TransfersOutPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(EDIT_PERMISSION);
  const canOpenIndividual = hasPermission("individual_query:view");

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [outStatusIds, setOutStatusIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // إصدار قرار جديد
  const [showCreate, setShowCreate] = useState(false);
  const [decisionNumber, setDecisionNumber] = useState("");
  const [decisionDate, setDecisionDate] = useState("");
  const [decisionAuthority, setDecisionAuthority] = useState("");
  const [destination, setDestination] = useState("");
  const [transferDate, setTransferDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [militaryInput, setMilitaryInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");

    const [decisionsRes, statusesRes] = await Promise.all([
      supabase
        .from("transfer_out_decisions")
        .select(
          `id, decision_number, decision_date, decision_authority, destination, transfer_date,
           notes, file_path, file_name, created_at,
           creator:profiles!created_by(username, full_name),
           items:personnel_transfers_out!decision_id(
             id, personnel_id, returned_at, cancelled_at, cancel_reason,
             personnel:personnel_id(full_name, military_number, rank:rank_id(name))
           )`
        )
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("service_statuses").select("id, code").in("code", ["DISCHARGED", "OUTSIDE_FORCE"]),
    ]);

    const firstError = decisionsRes.error ?? statusesRes.error;

    if (firstError) {
      setError("تعذر تحميل البيانات: " + firstError.message);
      setLoading(false);
      return;
    }

    setOutStatusIds((statusesRes.data ?? []).map((s: any) => s.id));

    setDecisions(
      (decisionsRes.data ?? []).map((row: any) => {
        const creator = pickOne<any>(row.creator);
        return {
          id: row.id,
          decision_number: row.decision_number,
          decision_date: row.decision_date,
          decision_authority: row.decision_authority,
          destination: row.destination,
          transfer_date: row.transfer_date,
          notes: row.notes,
          file_path: row.file_path,
          file_name: row.file_name,
          created_at: row.created_at,
          creator_name: creator?.full_name ?? creator?.username ?? null,
          items: ((row.items ?? []) as any[]).map((it) => {
            const p = pickOne<any>(it.personnel);
            return {
              id: it.id,
              personnel_id: it.personnel_id,
              full_name: p?.full_name ?? "-",
              military_number: p?.military_number ?? "",
              rank_name: pickOne<any>(p?.rank)?.name ?? null,
              returned_at: it.returned_at ?? null,
              cancelled_at: it.cancelled_at ?? null,
              cancel_reason: it.cancel_reason ?? null,
            };
          }),
        };
      })
    );
    setLoading(false);
  }

  // ---------------------------------------------------
  // إضافة فرد للقرار
  // ---------------------------------------------------

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
          `id, full_name, military_number, is_active, service_status_id,
           rank:rank_id(name),
           category:personnel_category_id(name),
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

      if (row.is_active === false || outStatusIds.includes(row.service_status_id)) {
        setLookupError("الفرد ده خارج القوة بالفعل.");
        return;
      }

      const { data: openCases } = await supabase
        .from("nco_discharge_cases")
        .select("id")
        .eq("personnel_id", row.id)
        .in("status", ACTIVE_STATUSES)
        .limit(1);

      if ((openCases ?? []).length > 0) {
        setLookupError("الفرد ده عنده ملف إنهاء خدمة مفتوح. اقفل الملف أو ألغيه الأول.");
        return;
      }

      setCandidates((prev) => [
        ...prev,
        {
          id: row.id,
          full_name: row.full_name,
          military_number: row.military_number,
          rank_name: pickOne<any>(row.rank)?.name ?? null,
          unit_name: pickOne<any>(row.primary_unit)?.name ?? null,
          category_name: pickOne<any>(row.category)?.name ?? null,
        },
      ]);
      setMilitaryInput("");
    } finally {
      setLookingUp(false);
    }
  }

  function resetCreate() {
    setShowCreate(false);
    setDecisionNumber("");
    setDecisionDate("");
    setDecisionAuthority("");
    setDestination("");
    setTransferDate(todayIso());
    setNotes("");
    setFile(null);
    setMilitaryInput("");
    setLookupError("");
    setCandidates([]);
  }

  // ---------------------------------------------------
  // إصدار القرار
  // ---------------------------------------------------

  async function handleCreate() {
    if (!decisionNumber.trim() || !decisionDate || !decisionAuthority.trim())
      return setError("اكتب رقم القرار وتاريخه والجهة المصدرة.");
    if (!destination.trim()) return setError("اكتب الجهة المنقول إليها.");
    if (!transferDate) return setError("اختر تاريخ النقل.");
    if (!file) return setError("ارفع صورة القرار.");
    if (file.size > MAX_FILE_MB * 1024 * 1024) return setError(`حجم الملف أكبر من ${toAr(MAX_FILE_MB)} ميجا.`);
    if (candidates.length === 0) return setError("ضيف فرد واحد على الأقل للقرار.");

    if (
      !window.confirm(
        `إصدار قرار نقل رقم ${decisionNumber.trim()} إلى ${destination.trim()}؟\n\n` +
          `${toAr(candidates.length)} فرد هيتلغى تفعيلهم ويخرجوا من أرقام القوة.`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // ١) رفع صورة القرار
      const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
      const path = `decisions/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(DOCS_BUCKET)
        .upload(path, file, { contentType: file.type || undefined, upsert: false });

      if (uploadError) {
        setError("تعذر رفع صورة القرار: " + uploadError.message);
        return;
      }

      // ٢) تسجيل القرار ونقل الأفراد
      const { error: rpcError } = await supabase.rpc("issue_transfer_out_decision", {
        p_decision_number: decisionNumber.trim(),
        p_decision_date: decisionDate,
        p_decision_authority: decisionAuthority.trim(),
        p_destination: destination.trim(),
        p_transfer_date: transferDate,
        p_notes: notes.trim() || null,
        p_file_path: path,
        p_file_name: file.name,
        p_file_size: file.size,
        p_mime_type: file.type || null,
        p_personnel_ids: candidates.map((c) => c.id),
      });

      if (rpcError) {
        // القرار متسجلش، فبنمسح الملف علشان ميفضلش يتيم
        await supabase.storage.from(DOCS_BUCKET).remove([path]);
        setError(rpcError.message);
        return;
      }

      try {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "CREATE",
          action: "إصدار قرار نقل خارج السلاح",
          entity: "قرارات النقل خارج السلاح",
          details: [
            `القرار: ${decisionNumber.trim()} بتاريخ ${formatDate(decisionDate)} - ${decisionAuthority.trim()}`,
            `منقول إلى: ${destination.trim()} بتاريخ ${formatDate(transferDate)}`,
            `الأفراد (${candidates.length}):`,
            ...candidates.map((c) => `- ${personLabel(c)} (${c.military_number})`),
          ].join("\n"),
        } as any);

        await createNotification({
          title: "قرار نقل خارج السلاح",
          body: `تم نقل ${candidates.length} فرد إلى ${destination.trim()} بالقرار رقم ${decisionNumber.trim()}`,
          type: "info",
          entityType: "personnel",
          entityId: candidates[0].id,
          userName,
        });
      } catch {
        // التسجيل والإشعار مش لازم يوقفوا العملية بعد ما تمت
      }

      setSuccess(`تم إصدار القرار رقم ${decisionNumber.trim()} ونقل ${toAr(candidates.length)} فرد خارج السلاح.`);
      resetCreate();
      await loadAll();
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------
  // إلغاء النقل (لفرد واحد أو لكل اللي لسه منقولين في القرار)
  // ---------------------------------------------------

  const [cancelling, setCancelling] = useState(false);

  async function cancelTransfers(decision: Decision, items: DecisionItem[]) {
    if (items.length === 0) return;

    const who =
      items.length === 1
        ? `نقل ${personLabel(items[0])}`
        : `نقل ${toAr(items.length)} فرد في القرار رقم ${decision.decision_number}`;

    const reason = window.prompt(
      `إلغاء ${who}؟\n\nكل فرد هيرجع لحالته قبل النقل بالظبط ويدخل أرقام القوة.\n\nاكتب سبب الإلغاء:`
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
      const { error: rpcError } = await supabase.rpc("cancel_transfers_out", {
        p_transfer_ids: items.map((it) => it.id),
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
          action: "إلغاء نقل خارج السلاح",
          entity: "قرارات النقل خارج السلاح",
          details: [
            `القرار: ${decision.decision_number} - منقول إلى ${decision.destination}`,
            `السبب: ${reason.trim()}`,
            `الأفراد (${items.length}):`,
            ...items.map((it) => `- ${personLabel(it)} (${it.military_number})`),
          ].join("\n"),
        } as any);
      } catch {
        // التسجيل مش لازم يوقف العملية
      }

      setSuccess(
        items.length === 1
          ? `تم إلغاء نقل ${personLabel(items[0])} ورجع لحالته قبل النقل.`
          : `تم إلغاء نقل ${toAr(items.length)} فرد ورجعوا لحالتهم قبل النقل.`
      );
      await loadAll();
    } finally {
      setCancelling(false);
    }
  }

  // ---------------------------------------------------
  // البحث
  // ---------------------------------------------------

  const filtered = useMemo(() => {
    const q = toEnglishDigits(search.trim());
    if (!q) return decisions;

    return decisions.filter(
      (d) =>
        d.decision_number.includes(q) ||
        d.destination.includes(q) ||
        d.items.some((it) => it.full_name.includes(q) || it.military_number.includes(q))
    );
  }, [decisions, search]);

  const inputClass =
    "w-full h-[42px] rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none focus:border-[#00B867]";

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#717d96",
    display: "block",
    marginBottom: 4,
  };

  // ---------------------------------------------------
  // Render
  // ---------------------------------------------------

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl" style={{ fontFamily: "'Almarai', sans-serif" }}>
      {/* الشريط العلوي */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم القرار أو الجهة أو اسم الفرد أو رقمه العسكري"
            className="w-full h-[42px] rounded-lg border border-[#cbd5e1] pr-9 pl-3 outline-none focus:border-[#00B867]"
            style={{ fontSize: 14 }}
          />
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => (showCreate ? resetCreate() : setShowCreate(true))}
            className="flex items-center gap-1 px-4 h-[42px] rounded-lg bg-[#DCF4DF] text-[#00522E] hover:opacity-80 transition-opacity"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            <Plus size={16} />
            إصدار قرار نقل
          </button>
        )}
      </div>

      {/* إصدار قرار جديد */}
      {showCreate && canEdit && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-4">
          <p style={{ fontSize: 16, fontWeight: 700, color: "#2d3648" }}>إصدار قرار نقل خارج السلاح</p>

          {/* بيانات القرار */}
          <div className="rounded-xl border border-[#eff0f6] p-4 flex flex-col gap-3">
            <p style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>بيانات القرار</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label style={labelStyle}>رقم القرار *</label>
                <input
                  type="text"
                  value={decisionNumber}
                  onChange={(e) => setDecisionNumber(e.target.value)}
                  className={inputClass}
                  style={{ fontSize: 14 }}
                />
              </div>
              <div>
                <label style={labelStyle}>تاريخ القرار *</label>
                <input
                  type="date"
                  value={decisionDate}
                  onChange={(e) => setDecisionDate(e.target.value)}
                  className={inputClass}
                  style={{ fontSize: 14 }}
                />
              </div>
              <div>
                <label style={labelStyle}>الجهة المصدرة *</label>
                <input
                  type="text"
                  list="transfer-decision-authorities"
                  value={decisionAuthority}
                  onChange={(e) => setDecisionAuthority(e.target.value)}
                  placeholder="مثال: السجلات العسكرية"
                  className={inputClass}
                  style={{ fontSize: 14 }}
                />
                <datalist id="transfer-decision-authorities">
                  {DECISION_AUTHORITY_SUGGESTIONS.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>
              <div className="sm:col-span-2">
                <label style={labelStyle}>الجهة المنقول إليها *</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="اسم الجهة المنقول إليها"
                  className={inputClass}
                  style={{ fontSize: 14 }}
                />
              </div>
              <div>
                <label style={labelStyle}>تاريخ النقل *</label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className={inputClass}
                  style={{ fontSize: 14 }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={labelStyle}>صورة القرار *</label>
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
              <p style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>الأفراد المنقولين بالقرار</p>
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
                {candidates.map((c, i) => (
                  <div
                    key={c.id}
                    className="px-4 py-3 border-b border-[#eff0f6] last:border-b-0 flex items-center gap-3 flex-wrap"
                  >
                    <span style={{ fontSize: 12, color: "#94a3b8", width: 20 }}>{toAr(i + 1)}</span>
                    <div className="flex flex-col min-w-0">
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{personLabel(c)}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        {c.military_number}
                        {c.category_name ? ` • ${c.category_name}` : ""}
                        {c.unit_name ? ` • ${c.unit_name}` : ""}
                      </span>
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
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={saving}
              className="flex items-center gap-2 px-5 h-[42px] rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
              إصدار القرار
            </button>
            <button
              type="button"
              onClick={resetCreate}
              disabled={saving}
              className="h-[42px] px-4 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-gray-50"
              style={{ fontSize: 14 }}
            >
              إلغاء
            </button>
          </div>

          <p style={{ fontSize: 12, color: "#b45309" }}>
            إصدار القرار هيلغي تفعيل كل الأفراد اللي فيه ويخرجهم من أرقام القوة. لو فرد واحد فيه مشكلة، القرار كله
            مش هيتسجل والرسالة هتقولك مين.
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

      {/* القرارات */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-[#00B867]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-[#717d96]">
            <LogOut size={28} className="text-[#cbd5e1]" />
            <span style={{ fontSize: 14 }}>
              {search.trim() ? "مفيش قرارات مطابقة للبحث." : "لسه مفيش قرارات نقل خارج السلاح."}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                  <th className="text-right px-4 py-3">القرار</th>
                  <th className="text-right px-4 py-3">منقول إلى</th>
                  <th className="text-right px-4 py-3">تاريخ النقل</th>
                  <th className="text-right px-4 py-3">الأفراد</th>
                  <th className="text-right px-4 py-3">صورة القرار</th>
                  <th className="text-right px-4 py-3">بواسطة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const open = Boolean(expanded[d.id]);
                  const returned = d.items.filter((it) => it.returned_at).length;
                  const cancelled = d.items.filter((it) => it.cancelled_at).length;
                  const stillOut = d.items.filter((it) => !it.returned_at && !it.cancelled_at);
                  const fullyCancelled = d.items.length > 0 && cancelled === d.items.length;

                  return (
                    <Fragment key={d.id}>
                      <tr
                        onClick={() => setExpanded((prev) => ({ ...prev, [d.id]: !prev[d.id] }))}
                        className="border-t border-[#eff0f6] cursor-pointer hover:bg-[#fafbff] align-top"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                              رقم {d.decision_number}
                            </span>
                            <span style={{ fontSize: 12, color: "#717d96" }}>
                              {formatDate(d.decision_date)} - {d.decision_authority}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                          {d.destination}
                        </td>
                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                          {formatDate(d.transfer_date)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span
                              className="px-2.5 py-0.5 rounded-full w-fit"
                              style={{ fontSize: 12, fontWeight: 700, background: "#e8f0fe", color: "#172e78" }}
                            >
                              {toAr(d.items.length)} فرد
                            </span>
                            {returned > 0 && (
                              <span style={{ fontSize: 11, color: "#00522E" }}>عاد منهم {toAr(returned)}</span>
                            )}
                            {fullyCancelled ? (
                              <span
                                className="px-2 py-0.5 rounded-full w-fit"
                                style={{ fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#64748b" }}
                              >
                                القرار ملغى
                              </span>
                            ) : (
                              cancelled > 0 && (
                                <span style={{ fontSize: 11, color: "#64748b" }}>أُلغي نقل {toAr(cancelled)}</span>
                              )
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void openSignedFile(d.file_path, setError);
                            }}
                            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#DCF4DF] text-[#00522E] hover:opacity-80"
                            style={{ fontSize: 12, fontWeight: 700 }}
                          >
                            <Eye size={14} />
                            عرض
                          </button>
                        </td>
                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                          <div className="flex flex-col">
                            <span>{d.creator_name ?? "-"}</span>
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatDate(d.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left">
                          <ChevronDown
                            size={16}
                            className={`text-[#94a3b8] inline transition-transform ${open ? "rotate-180" : ""}`}
                          />
                        </td>
                      </tr>

                      {open && (
                        <tr className="bg-[#fafbff]">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="flex flex-col gap-2">
                               {d.notes && (
                                <p style={{ fontSize: 13, color: "#475569" }}>ملاحظات: {d.notes}</p>
                              )}
                              {canEdit && stillOut.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => void cancelTransfers(d, stillOut)}
                                  disabled={cancelling}
                                  className="flex items-center gap-1.5 w-fit px-3 h-8 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-white disabled:opacity-50"
                                  style={{ fontSize: 12, fontWeight: 700 }}
                                >
                                  <Undo2 size={13} />
                                  إلغاء القرار لكل الأفراد ({toAr(stillOut.length)})
                                </button>
                              )}
                              {d.items.map((it, i) => (
                                <div
                                  key={it.id}
                                  className="flex items-center gap-3 flex-wrap rounded-lg bg-white border border-[#eff0f6] px-3 py-2"
                                >
                                  <span style={{ fontSize: 12, color: "#94a3b8", width: 20 }}>{toAr(i + 1)}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      canOpenIndividual &&
                                      navigate(`/dashboard/individual-query/soldier/${it.personnel_id}`)
                                    }
                                    className={`text-right ${canOpenIndividual ? "hover:underline" : "cursor-default"}`}
                                    style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}
                                  >
                                    {personLabel(it)}
                                  </button>
                                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{it.military_number}</span>
                                  <span
                                    className="mr-auto px-2.5 py-0.5 rounded-full"
                                    title={it.cancel_reason ? `سبب الإلغاء: ${it.cancel_reason}` : undefined}
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      background: it.cancelled_at ? "#f1f5f9" : it.returned_at ? "#DCF4DF" : "#fef2f2",
                                      color: it.cancelled_at ? "#64748b" : it.returned_at ? "#00522E" : "#991b1b",
                                    }}
                                  >
                                    {it.cancelled_at
                                      ? `أُلغي النقل ${formatDate(it.cancelled_at)}`
                                      : it.returned_at
                                      ? `عاد للقوة ${formatDate(it.returned_at)}`
                                      : "منقول"}
                                  </span>
                                  {it.cancelled_at && it.cancel_reason && (
                                    <span className="w-full" style={{ fontSize: 12, color: "#64748b" }}>
                                      سبب الإلغاء: {it.cancel_reason}
                                    </span>
                                  )}
                                  {canEdit && !it.cancelled_at && !it.returned_at && (
                                    <button
                                      type="button"
                                      onClick={() => void cancelTransfers(d, [it])}
                                      disabled={cancelling}
                                      className="flex items-center gap-1 px-2.5 h-7 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-[#f5f6fb] disabled:opacity-50"
                                      style={{ fontSize: 12, fontWeight: 700 }}
                                    >
                                      <Undo2 size={12} />
                                      إلغاء نقل الفرد
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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