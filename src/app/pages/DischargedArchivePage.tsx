import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Loader2,
  X,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Archive,
  History,
  AlertTriangle,
  ArrowLeftRight,
  Eye,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { logActivity } from "../../lib/logActivity";
import { createNotification } from "../../lib/createNotification";
import {
  CATEGORY_LABELS,
  DECISION_AUTHORITY_SUGGESTIONS,
  caseNumber,
  formatDate,
  pickOne,
  toAr,
  toEnglishDigits,
} from "./NcoDischargesPage";

// =====================================================
// إعدادات
// =====================================================

const PAGE_SIZE = 25;
const ATTACHMENT_STATUS_NAME = "ملحق";
const EDIT_PERMISSION = "discharged_archive:edit";
const TRANSFER_DOCS_BUCKET = "personnel-transfer-documents";

// =====================================================
// Types
// =====================================================

type Option = { id: string; name: string; code?: string | null };

type StatusRow = { id: string; name: string; code: string | null; is_active: boolean };

type CategoryRow = { id: string; name: string; code: string | null };

type Kind = "discharge" | "transfer";

type Tab = "discharged" | "transferred" | "history";

type LastCase = {
  id: string;
  seq: number;
  year: number;
  reason_name: string;
  completed_at: string | null;
  certificate_number: string | null;
  certificate_date: string | null;
};

type LastTransfer = {
  id: string;
  destination: string;
  transfer_date: string;
  decision_number: string;
  decision_date: string;
  decision_authority: string;
  notes: string | null;
  decision_file_path: string | null;
};

type OutRow = {
  id: string;
  kind: Kind;
  full_name: string;
  military_number: string;
  rank_name: string | null;
  category_name: string | null;
  category_code: string | null;
  primary_unit_name: string | null;
  discharge_date: string | null;
  last_case: LastCase | null;
  last_transfer: LastTransfer | null;
};

type HistoryRow = {
  id: string;
  type: Kind;
  created_at: string;
  decision_number: string;
  decision_date: string;
  decision_authority: string;
  reason: string;
  personnel_id: string;
  person_name: string;
  person_rank: string | null;
  military_number: string;
  new_status_name: string | null;
  creator_name: string | null;
  case_ref: { id: string; seq: number; year: number } | null;
  transfer_destination: string | null;
};


// =====================================================
// Helpers
// =====================================================

// بنشيل الرموز اللي بتكسر فلتر or() بتاع PostgREST
function cleanSearch(value: string): string {
  return toEnglishDigits(value).replace(/[,()%*\\]/g, " ").trim();
}

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);

  return debounced;
}


function formatBatchDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
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

  return {
    userId: user.id,
    userName: profile?.full_name ?? profile?.username ?? "غير معروف",
  };
}

// التسجيل والإشعار مش لازم يوقفوا العملية بعد ما تكون تمت
async function logAndNotify(p: {
  action: string;
  personnelId: string;
  personName: string;
  details: string[];
  notificationTitle: string;
  notificationBody: string;
}) {
  try {
    const { userId, userName } = await getCurrentUserInfo();

    await logActivity({
      userId,
      userName,
      actionType: "UPDATE",
      action: p.action,
      entity: `الفرد: ${p.personName}`,
      details: p.details.filter(Boolean).join("\n"),
    } as any);

    await createNotification({
      title: p.notificationTitle,
      body: p.notificationBody,
      type: "info",
      entityType: "personnel",
      entityId: p.personnelId,
      userName,
    });
  } catch {
    // تجاهل
  }
}

async function openTransferFile(path: string, onError: (msg: string) => void) {
  // بنفتح النافذة الأول علشان المتصفح ميعتبرهاش popup
  const win = window.open("", "_blank");

  const { data, error } = await supabase.storage
    .from(TRANSFER_DOCS_BUCKET)
    .createSignedUrl(path, 60 * 10);

  if (error || !data?.signedUrl) {
    win?.close();
    onError("تعذر فتح صورة القرار: " + (error?.message ?? ""));
    return;
  }

  if (win) win.location.href = data.signedUrl;
  else window.open(data.signedUrl, "_blank");
}

const inputClass =
  "w-full h-[42px] rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none focus:border-[#00B867] disabled:bg-[#f7f9fc]";

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#717d96",
  display: "block",
  marginBottom: 4,
};

// =====================================================
// غلاف النوافذ
// =====================================================

function ModalShell({
  title,
  icon,
  busy,
  onClose,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  busy: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  return (
    <div
      className="fixed inset-0 z-[9000] bg-black/40 flex items-center justify-center p-4"
      dir="rtl"
      style={{ fontFamily: "'Almarai', sans-serif" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[680px] max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="px-5 py-4 border-b border-[#eff0f6] flex items-center justify-between gap-3 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            {icon}
            <p style={{ fontSize: 16, fontWeight: 700, color: "#2d3648" }}>{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#f5f6fb]"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}

function DecisionFields({
  title,
  number,
  date,
  authority,
  onNumber,
  onDate,
  onAuthority,
  listId,
}: {
  title: string;
  number: string;
  date: string;
  authority: string;
  onNumber: (v: string) => void;
  onDate: (v: string) => void;
  onAuthority: (v: string) => void;
  listId: string;
}) {
  return (
    <div className="rounded-xl border border-[#eff0f6] p-4 flex flex-col gap-3">
      <p style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{title}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label style={labelStyle}>رقم القرار *</label>
          <input
            type="text"
            value={number}
            onChange={(e) => onNumber(e.target.value)}
            className={inputClass}
            style={{ fontSize: 14 }}
          />
        </div>
        <div>
          <label style={labelStyle}>تاريخ القرار *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDate(e.target.value)}
            className={inputClass}
            style={{ fontSize: 14 }}
          />
        </div>
        <div>
          <label style={labelStyle}>الجهة المصدرة *</label>
          <input
            type="text"
            list={listId}
            value={authority}
            onChange={(e) => onAuthority(e.target.value)}
            placeholder="مثال: السجلات العسكرية"
            className={inputClass}
            style={{ fontSize: 14 }}
          />
          <datalist id={listId}>
            {DECISION_AUTHORITY_SUGGESTIONS.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
}

function PersonSummary({ items }: { items: [string, string][] }) {
  return (
    <div className="rounded-xl border border-[#e2e7f0] bg-[#f8fafc] p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5 min-w-0">
          <span style={{ fontSize: 12, color: "#717d96" }}>{label}</span>
          <span className="truncate" style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p
      className="rounded-xl px-4 py-3 bg-[#fef2f2] border border-[#fecaca]"
      style={{ fontSize: 13, color: "#991b1b", fontWeight: 700 }}
    >
      {text}
    </p>
  );
}

// =====================================================
// نافذة العودة للقوة (إعادة للخدمة / عودة من النقل)
// =====================================================

function ReturnModal({
  person,
  statusOptions,
  unitOptions,
  batchOptions,
  onClose,
  onDone,
}: {
  person: OutRow;
  statusOptions: Option[];
  unitOptions: Option[];
  batchOptions: Option[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const isTransfer = person.kind === "transfer";
  const isConscript = person.category_code === "CONSCRIPT";
  const isVolunteer = person.category_code === "VOLUNTEER";

  const [statusId, setStatusId] = useState("");
  const [attachmentUnitId, setAttachmentUnitId] = useState("");
  // لو تاريخ التسريح القديم لسه دفعة متاحة نبدأ بيه
  const [dischargeDate, setDischargeDate] = useState(
    person.discharge_date && batchOptions.some((b) => b.id === person.discharge_date)
      ? person.discharge_date
      : ""
  );
  const [decisionNumber, setDecisionNumber] = useState("");
  const [decisionDate, setDecisionDate] = useState("");
  const [decisionAuthority, setDecisionAuthority] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isAttachment = statusOptions.find((s) => s.id === statusId)?.name === ATTACHMENT_STATUS_NAME;
  const personLabel = `${person.rank_name ? person.rank_name + " " : ""}${person.full_name}`;
  const actionLabel = isTransfer ? "عودة من النقل" : "إعادة للخدمة";

  async function submit() {
    if (!statusId) return setError("اختر الموقف الخدمي للفرد بعد عودته.");
    if (isAttachment && !attachmentUnitId) return setError("اختر جهة الإلحاق.");
    if (isConscript && !dischargeDate) return setError("اختر دفعة الرديف (تاريخ التسريح) للمجند.");
    if (!decisionNumber.trim() || !decisionDate || !decisionAuthority.trim())
      return setError("اكتب رقم القرار وتاريخه والجهة المصدرة.");
    if (!reason.trim()) return setError("اكتب السبب.");

    const extra = isTransfer
      ? "، وسجل النقل هيتقفل."
      : person.last_case
      ? '، وملف إنهاء خدمته هيتحول لحالة "أُعيد للخدمة".'
      : ".";

    if (!window.confirm(`${actionLabel}: ${personLabel}؟\n\nالفرد هيرجع نشط في المنظومة ويدخل أرقام القوة${extra}`)) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { error: rpcError } = await supabase.rpc("reinstate_personnel", {
        p_personnel_id: person.id,
        p_service_status_id: statusId,
        p_attachment_unit_id: isAttachment ? attachmentUnitId : null,
        p_discharge_date: isVolunteer ? null : dischargeDate || null,
        p_decision_number: decisionNumber.trim(),
        p_decision_date: decisionDate,
        p_decision_authority: decisionAuthority.trim(),
        p_reason: reason.trim(),
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      const statusName = statusOptions.find((s) => s.id === statusId)?.name ?? "-";

      await logAndNotify({
        action: isTransfer ? "عودة فرد من النقل خارج السلاح" : "إعادة فرد للخدمة",
        personnelId: person.id,
        personName: person.full_name,
        details: [
          `الرقم العسكري: ${person.military_number}`,
          `الموقف الخدمي الجديد: ${statusName}`,
          `القرار: ${decisionNumber.trim()} بتاريخ ${formatDate(decisionDate)} - ${decisionAuthority.trim()}`,
          `السبب: ${reason.trim()}`,
          isTransfer && person.last_transfer ? `كان منقول إلى: ${person.last_transfer.destination}` : "",
          !isTransfer && person.last_case
            ? `ملف إنهاء الخدمة: ${caseNumber(person.last_case.seq, person.last_case.year)} → أُعيد للخدمة`
            : "",
        ],
        notificationTitle: isTransfer ? "عودة فرد من النقل" : "إعادة فرد للخدمة",
        notificationBody: `${actionLabel}: ${personLabel}`,
      });

      onDone(isTransfer ? `تمت عودة ${personLabel} من النقل للقوة.` : `تمت إعادة ${personLabel} للخدمة.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={isTransfer ? "عودة فرد من النقل خارج السلاح" : "إعادة فرد للخدمة"}
      icon={<RotateCcw size={18} className="text-[#00522E]" />}
      busy={saving}
      onClose={onClose}
    >
      <PersonSummary
        items={[
          ["الرقم العسكري", person.military_number],
          ["الدرجة / الاسم", personLabel],
          ["الفئة", person.category_name ?? "-"],
          ["الوحدة الأساسية", person.primary_unit_name ?? "-"],
        ]}
      />

      {isTransfer && person.last_transfer && (
        <p style={{ fontSize: 13, color: "#475569" }}>
          منقول إلى {person.last_transfer.destination} بتاريخ {formatDate(person.last_transfer.transfer_date)} (قرار رقم{" "}
          {person.last_transfer.decision_number}). سجل النقل هيفضل محفوظ ويتعلّم إنه انتهى بالعودة.
        </p>
      )}

      {!isTransfer && person.last_case && (
        <p style={{ fontSize: 13, color: "#475569" }}>
          خدمته انتهت بملف رقم {caseNumber(person.last_case.seq, person.last_case.year)} (
          {person.last_case.reason_name}). الملف هيفضل محفوظ بمستنداته وشهادته، وحالته هتبقى "أُعيد للخدمة".
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>الموقف الخدمي بعد العودة *</label>
          <select
            value={statusId}
            onChange={(e) => {
              setStatusId(e.target.value);
              setAttachmentUnitId("");
              setError("");
            }}
            className={inputClass}
            style={{ fontSize: 14 }}
          >
            <option value="">اختر الموقف الخدمي</option>
            {statusOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>جهة الإلحاق {isAttachment ? "*" : ""}</label>
          <select
            value={attachmentUnitId}
            onChange={(e) => setAttachmentUnitId(e.target.value)}
            disabled={!isAttachment}
            className={inputClass}
            style={{ fontSize: 14 }}
          >
            <option value="">{isAttachment ? "اختر جهة الإلحاق" : "للموقف ملحق بس"}</option>
            {unitOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {!isVolunteer && (
          <div>
            <label style={labelStyle}>تاريخ التسريح (دفعة الرديف) {isConscript ? "*" : ""}</label>
            <select
              value={dischargeDate}
              onChange={(e) => setDischargeDate(e.target.value)}
              className={inputClass}
              style={{ fontSize: 14 }}
            >
              <option value="">اختر دفعة الرديف</option>
              {batchOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <DecisionFields
        title={isTransfer ? "قرار العودة من النقل" : "قرار الإعادة للخدمة"}
        number={decisionNumber}
        date={decisionDate}
        authority={decisionAuthority}
        onNumber={setDecisionNumber}
        onDate={setDecisionDate}
        onAuthority={setDecisionAuthority}
        listId="return-decision-authorities"
      />

      <div>
        <label style={labelStyle}>السبب *</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder={isTransfer ? "مثال: إلغاء قرار النقل / انتهاء مدة النقل" : "مثال: إلغاء قرار إنهاء الخدمة / تسجيل بالخطأ"}
          className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 outline-none focus:border-[#00B867] resize-none"
          style={{ fontSize: 14 }}
        />
      </div>

      <div className="flex items-start gap-2 rounded-xl px-4 py-3 bg-[#fff8e8] border border-[#fde68a]">
        <AlertTriangle size={16} className="text-[#b45309] shrink-0 mt-0.5" />
        <p style={{ fontSize: 12, color: "#8a6500", lineHeight: 1.7 }}>
          الفرد هيرجع نشط ويدخل أرقام القوة فورًا. باقي بياناته (الدرجة، الوحدة، الوظيفة) تقدر تراجعها بعد كده من صفحة
          تعديل البيانات.
        </p>
      </div>

      <ErrorBox text={error} />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="flex items-center gap-2 px-5 h-[42px] rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
          style={{ fontSize: 14, fontWeight: 700 }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
          {actionLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="h-[42px] px-4 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-gray-50"
          style={{ fontSize: 14 }}
        >
          إلغاء
        </button>
      </div>
    </ModalShell>
  );
}

// =====================================================
// الصفحة
// =====================================================

export function DischargedArchivePage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(EDIT_PERMISSION);
  const canOpenIndividual = hasPermission("individual_query:view");

  const [tab, setTab] = useState<Tab>("discharged");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(0);

  // القوائم المساعدة
  const [lookupsReady, setLookupsReady] = useState(false);
  const [dischargedStatusId, setDischargedStatusId] = useState<string | null>(null);
  const [outsideStatusId, setOutsideStatusId] = useState<string | null>(null);
  const [statusOptions, setStatusOptions] = useState<Option[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [unitOptions, setUnitOptions] = useState<Option[]>([]);
  const [batchOptions, setBatchOptions] = useState<Option[]>([]);

  // البيانات
  const [rows, setRows] = useState<OutRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [returnTarget, setReturnTarget] = useState<OutRow | null>(null);

  // ---------------------------------------------------
  // تحميل القوائم المساعدة مرة واحدة
  // ---------------------------------------------------

  useEffect(() => {
    void loadLookups();
  }, []);

  async function loadLookups() {
    const [statusesRes, categoriesRes, unitsRes, batchesRes] = await Promise.all([
      // كل المواقف (حتى غير المفعّلة) علشان نلاقي OUTSIDE_FORCE
      supabase.from("service_statuses").select("id, name, code, is_active").order("name"),
      supabase.from("personnel_categories").select("id, name, code").order("name"),
      supabase.from("units").select("id, name").eq("is_active", true).order("name"),
      supabase
        .from("reserve_batches")
        .select("batch_date, name")
        .eq("is_active", true)
        .order("batch_date", { ascending: true }),
    ]);

    const firstError = statusesRes.error ?? categoriesRes.error ?? unitsRes.error ?? batchesRes.error;

    if (firstError) {
      setError("تعذر تحميل القوائم: " + firstError.message);
      setLoading(false);
      return;
    }

    const statuses = (statusesRes.data ?? []) as StatusRow[];
    const byCode = (code: string) => statuses.find((s) => s.code?.trim().toUpperCase() === code);

    const discharged = byCode("DISCHARGED");
    const outside = byCode("OUTSIDE_FORCE");

    if (!discharged) {
      setError('مفيش موقف خدمي بكود "DISCHARGED" في جدول المواقف الخدمية.');
      setLoading(false);
      return;
    }

    setDischargedStatusId(discharged.id);
    setOutsideStatusId(outside?.id ?? null);
    setStatusOptions(
      statuses
        .filter((s) => s.is_active && s.id !== discharged.id && s.id !== outside?.id)
        .map((s) => ({ id: s.id, name: s.name, code: s.code }))
    );
    setCategories((categoriesRes.data ?? []) as CategoryRow[]);
    setUnitOptions((unitsRes.data ?? []) as Option[]);
    setBatchOptions(
      (batchesRes.data ?? []).map((b: any) => ({
        id: b.batch_date,
        name: b.name || `دفعة ${formatBatchDate(b.batch_date)}`,
      }))
    );
    setLookupsReady(true);
  }

  // أي تغيير في الفلاتر يرجعنا لأول صفحة
  useEffect(() => {
    setPage(0);
  }, [tab, debouncedSearch, categoryFilter]);

  useEffect(() => {
    if (!lookupsReady) return;
    if (tab === "history") void loadHistory();
    else void loadOutList(tab === "discharged" ? "discharge" : "transfer");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupsReady, tab, debouncedSearch, categoryFilter, page, reloadKey]);

  // ---------------------------------------------------
  // المنتهية خدمتهم / المنقولين
  // ---------------------------------------------------

  async function loadOutList(kind: Kind) {
    const statusId = kind === "discharge" ? dischargedStatusId : outsideStatusId;

    setLoading(true);
    setError("");

    if (!statusId) {
      setRows([]);
      setTotal(0);
      setError('مفيش موقف خدمي بكود "OUTSIDE_FORCE" في جدول المواقف الخدمية.');
      setLoading(false);
      return;
    }

    const q = cleanSearch(debouncedSearch);
    const from = page * PAGE_SIZE;

    let query = supabase
      .from("personnel")
      .select(
        `id, full_name, military_number, discharge_date,
         rank:rank_id(name),
         category:personnel_category_id(name, code),
         primary_unit:primary_unit_id(name),
         nco_cases:nco_discharge_cases!personnel_id(
           id, case_seq, case_year, status, completed_at,
           reason:reason_id(name),
           certificate:service_end_certificates!nco_case_id(certificate_number, certificate_date)
         ),
         transfers:personnel_transfers_out!personnel_id(
           id, destination, transfer_date, decision_number, decision_date,
           decision_authority, notes, returned_at, created_at,
           decision:decision_id(file_path)
         )`,
        { count: "exact" }
      )
      .eq("service_status_id", statusId);

    if (categoryFilter !== "all") query = query.eq("personnel_category_id", categoryFilter);
    if (q) query = query.or(`full_name.ilike.%${q}%,military_number.ilike.%${q}%`);

    const { data, error: loadError, count } = await query
      .order("full_name", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (loadError) {
      setError("تعذر تحميل البيانات: " + loadError.message);
      setLoading(false);
      return;
    }

    setRows(
      (data ?? []).map((row: any) => {
        const c = ((row.nco_cases ?? []) as any[])
          .filter((x) => x.status === "completed")
          .sort((a, b) => String(b.completed_at ?? "").localeCompare(String(a.completed_at ?? "")))[0];

        const t = ((row.transfers ?? []) as any[])
          .filter((x) => !x.returned_at)
          .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))[0];

        const cert = c ? pickOne<any>(c.certificate) : null;
        const category = pickOne<any>(row.category);

        return {
          id: row.id,
          kind,
          full_name: row.full_name ?? "-",
          military_number: row.military_number ?? "",
          rank_name: pickOne<any>(row.rank)?.name ?? null,
          category_name: category?.name ?? null,
          category_code: category?.code ?? null,
          primary_unit_name: pickOne<any>(row.primary_unit)?.name ?? null,
          discharge_date: row.discharge_date ?? null,
          last_case: c
            ? {
                id: c.id,
                seq: c.case_seq,
                year: c.case_year,
                reason_name: pickOne<any>(c.reason)?.name ?? "-",
                completed_at: c.completed_at ?? null,
                certificate_number: cert?.certificate_number ?? null,
                certificate_date: cert?.certificate_date ?? null,
              }
            : null,
          last_transfer: t
            ? {
                id: t.id,
                destination: t.destination,
                transfer_date: t.transfer_date,
                decision_number: t.decision_number,
                decision_date: t.decision_date,
                decision_authority: t.decision_authority,
                notes: t.notes ?? null,
                decision_file_path: pickOne<any>(t.decision)?.file_path ?? null,
              }
            : null,
        };
      })
    );
    setTotal(count ?? 0);
    setLoading(false);
  }

  // ---------------------------------------------------
  // سجل العودة للقوة
  // ---------------------------------------------------

  async function loadHistory() {
    setLoading(true);
    setError("");

    const q = cleanSearch(debouncedSearch);
    const from = page * PAGE_SIZE;

    let query = supabase
      .from("personnel_reinstatements")
      .select(
        `id, reinstatement_type, created_at, decision_number, decision_date, decision_authority, reason, personnel_id,
         personnel:personnel_id!inner(full_name, military_number, personnel_category_id, rank:rank_id(name)),
         new_status:service_statuses!new_service_status_id(name),
         creator:profiles!created_by(username, full_name),
         nco_case:nco_case_id(id, case_seq, case_year),
         transfer:transfer_id(destination)`,
        { count: "exact" }
      );

    if (categoryFilter !== "all") query = query.eq("personnel.personnel_category_id", categoryFilter);
    if (q)
      query = query.or(`full_name.ilike.%${q}%,military_number.ilike.%${q}%`, {
        referencedTable: "personnel",
      });

    const { data, error: loadError, count } = await query
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (loadError) {
      setError("تعذر تحميل السجل: " + loadError.message);
      setLoading(false);
      return;
    }

    setHistory(
      (data ?? []).map((row: any) => {
        const p = pickOne<any>(row.personnel);
        const creator = pickOne<any>(row.creator);
        const nco = pickOne<any>(row.nco_case);

        return {
          id: row.id,
          type: row.reinstatement_type === "transfer" ? "transfer" : "discharge",
          created_at: row.created_at,
          decision_number: row.decision_number,
          decision_date: row.decision_date,
          decision_authority: row.decision_authority,
          reason: row.reason,
          personnel_id: row.personnel_id,
          person_name: p?.full_name ?? "-",
          person_rank: pickOne<any>(p?.rank)?.name ?? null,
          military_number: p?.military_number ?? "",
          new_status_name: pickOne<any>(row.new_status)?.name ?? null,
          creator_name: creator?.full_name ?? creator?.username ?? null,
          case_ref: nco ? { id: nco.id, seq: nco.case_seq, year: nco.case_year } : null,
          transfer_destination: pickOne<any>(row.transfer)?.destination ?? null,
        };
      })
    );
    setTotal(count ?? 0);
    setLoading(false);
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ---------------------------------------------------
  // Render helpers
  // ---------------------------------------------------

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "discharged", label: "المنتهية خدمتهم", icon: <Archive size={15} /> },
    { id: "transferred", label: "المنقولين خارج السلاح", icon: <ArrowLeftRight size={15} /> },
    { id: "history", label: "سجل العودة للقوة", icon: <History size={15} /> },
  ];

  const categoryBadge = (code: string | null, name: string | null) => {
    if (!code && !name) return null;
    const conscript = code === "CONSCRIPT";
    return (
      <span
        className="px-2 py-0.5 rounded-full"
        style={{
          fontSize: 11,
          fontWeight: 700,
          background: conscript ? "#fef3c7" : "#e0f2fe",
          color: conscript ? "#92400e" : "#075985",
        }}
      >
        {(code && CATEGORY_LABELS[code]) || name}
      </span>
    );
  };

  const personCell = (r: { rank_name: string | null; full_name: string; military_number: string; category_code: string | null; category_name: string | null }) => (
    <div className="flex flex-col">
      <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
        {r.rank_name ? `${r.rank_name} / ` : ""}
        {r.full_name}
      </span>
      <span className="flex items-center gap-2" style={{ fontSize: 12, color: "#94a3b8" }}>
        {r.military_number}
        {categoryBadge(r.category_code, r.category_name)}
      </span>
    </div>
  );

  const rowActions = (r: OutRow) => (
    <div className="flex items-center gap-2 justify-end">
      {canOpenIndividual && (
        <button
          type="button"
          onClick={() => navigate(`/dashboard/individual-query/soldier/${r.id}`)}
          title="ملف الفرد"
          className="w-8 h-8 rounded-lg border border-[#cbd5e1] flex items-center justify-center text-[#2d3648] hover:bg-gray-50"
        >
          <ExternalLink size={14} />
        </button>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={() => {
            setSuccess("");
            setReturnTarget(r);
          }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#DCF4DF] text-[#00522E] hover:opacity-80 whitespace-nowrap"
          style={{ fontSize: 12, fontWeight: 700 }}
        >
          <RotateCcw size={13} />
          {r.kind === "transfer" ? "عودة من النقل" : "إعادة للخدمة"}
        </button>
      )}
    </div>
  );

  const emptyState = (icon: React.ReactNode, text: string) => (
    <div className="py-16 flex flex-col items-center gap-2 text-[#717d96]">
      {icon}
      <span style={{ fontSize: 14 }}>{text}</span>
    </div>
  );

  const filtersActive = Boolean(debouncedSearch) || categoryFilter !== "all";

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
            placeholder="بحث بالاسم أو الرقم العسكري"
            className="w-full h-[42px] rounded-lg border border-[#cbd5e1] pr-9 pl-3 outline-none focus:border-[#00B867]"
            style={{ fontSize: 14 }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-[42px] min-w-[150px] rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none focus:border-[#00B867]"
          style={{ fontSize: 14 }}
        >
          <option value="all">كل الفئات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

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
        <div className="rounded-xl px-5 py-3 bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-between gap-3">
          <span style={{ color: "#166534", fontSize: 14, fontWeight: 700 }}>{success}</span>
          <button type="button" onClick={() => setSuccess("")} className="text-[#166534]">
            <X size={16} />
          </button>
        </div>
      )}

      {/* التابات */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-1.5 flex gap-1 w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "flex items-center gap-2 px-5 h-10 rounded-xl transition-colors",
              tab === t.id ? "bg-[#DCF4DF] text-[#00522E]" : "text-[#717d96] hover:bg-[#f5f6fb]",
            ].join(" ")}
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            {t.icon}
            {t.label}
            {tab === t.id && !loading && (
              <span className="px-2 py-0.5 rounded-full bg-white" style={{ fontSize: 12, color: "#717d96" }}>
                {toAr(total)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* القائمة */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-[#00B867]" />
          </div>
        ) : tab === "discharged" ? (
          rows.length === 0 ? (
            emptyState(
              <Archive size={28} className="text-[#cbd5e1]" />,
              filtersActive ? "مفيش أفراد مطابقين للبحث." : "مفيش أفراد منتهية خدمتهم."
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                    <th className="text-right px-4 py-3">الفرد</th>
                    <th className="text-right px-4 py-3">آخر وحدة</th>
                    <th className="text-right px-4 py-3">سبب إنهاء الخدمة</th>
                    <th className="text-right px-4 py-3">تاريخ إنهاء الخدمة</th>
                    <th className="text-right px-4 py-3">الشهادة</th>
                    <th className="text-right px-4 py-3">ملف إنهاء الخدمة</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const c = r.last_case;
                    return (
                      <tr key={r.id} className="border-t border-[#eff0f6] hover:bg-[#fafbff]">
                        <td className="px-4 py-3">{personCell(r)}</td>
                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                          {r.primary_unit_name ?? "-"}
                        </td>
                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                          {c?.reason_name ?? "-"}
                        </td>
                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                          {formatDate(c?.certificate_date ?? c?.completed_at ?? null)}
                        </td>
                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                          {c?.certificate_number ? toAr(c.certificate_number) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {c ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/dashboard/nco-discharges/${c.id}`)}
                              className="text-[#1f3d97] hover:underline"
                              style={{ fontSize: 13, fontWeight: 700 }}
                            >
                              {caseNumber(c.seq, c.year)}
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>بدون ملف</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{rowActions(r)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : tab === "transferred" ? (
          rows.length === 0 ? (
            emptyState(
              <ArrowLeftRight size={28} className="text-[#cbd5e1]" />,
              filtersActive
                ? "مفيش أفراد مطابقين للبحث."
                : "مفيش أفراد منقولين خارج السلاح. النقل بيتعمل من صفحة النقل خارج السلاح."
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                    <th className="text-right px-4 py-3">الفرد</th>
                    <th className="text-right px-4 py-3">آخر وحدة</th>
                    <th className="text-right px-4 py-3">منقول إلى</th>
                    <th className="text-right px-4 py-3">تاريخ النقل</th>
                    <th className="text-right px-4 py-3">قرار النقل</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const t = r.last_transfer;
                    return (
                      <tr key={r.id} className="border-t border-[#eff0f6] hover:bg-[#fafbff] align-top">
                        <td className="px-4 py-3">{personCell(r)}</td>
                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                          {r.primary_unit_name ?? "-"}
                        </td>
                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155", fontWeight: 700 }}>
                          {t?.destination ?? "-"}
                        </td>
                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                          {formatDate(t?.transfer_date ?? null)}
                        </td>
                        <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                          {t ? (
                            <div className="flex flex-col">
                              <span style={{ fontWeight: 700 }}>رقم {t.decision_number}</span>
                              <span style={{ fontSize: 12, color: "#717d96" }}>
                                {formatDate(t.decision_date)} - {t.decision_authority}
                              </span>
                              {t.decision_file_path && (
                                <button
                                  type="button"
                                  onClick={() => void openTransferFile(t.decision_file_path!, setError)}
                                  className="flex items-center gap-1 mt-1 w-fit text-[#00522E] hover:underline"
                                  style={{ fontSize: 12, fontWeight: 700 }}
                                >
                                  <Eye size={13} />
                                  عرض صورة القرار
                                </button>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">{rowActions(r)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : history.length === 0 ? (
          emptyState(<History size={28} className="text-[#cbd5e1]" />, "مفيش عمليات عودة للقوة مسجلة.")
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                  <th className="text-right px-4 py-3">الفرد</th>
                  <th className="text-right px-4 py-3">النوع</th>
                  <th className="text-right px-4 py-3">القرار</th>
                  <th className="text-right px-4 py-3">السبب</th>
                  <th className="text-right px-4 py-3">الموقف بعد العودة</th>
                  <th className="text-right px-4 py-3">المرجع</th>
                  <th className="text-right px-4 py-3">بواسطة</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-[#eff0f6] align-top">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() =>
                            canOpenIndividual && navigate(`/dashboard/individual-query/soldier/${h.personnel_id}`)
                          }
                          className={`text-right ${canOpenIndividual ? "hover:underline" : "cursor-default"}`}
                          style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}
                        >
                          {h.person_rank ? `${h.person_rank} / ` : ""}
                          {h.person_name}
                        </button>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>{h.military_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          background: h.type === "transfer" ? "#e0f2fe" : "#f3e8ff",
                          color: h.type === "transfer" ? "#075985" : "#6b21a8",
                        }}
                      >
                        {h.type === "transfer" ? "عودة من النقل" : "إعادة للخدمة"}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                      <div className="flex flex-col">
                        <span style={{ fontWeight: 700 }}>رقم {h.decision_number}</span>
                        <span style={{ fontSize: 12, color: "#717d96" }}>
                          {formatDate(h.decision_date)} - {h.decision_authority}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[240px]" style={{ fontSize: 13, color: "#334155" }}>
                      {h.reason}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                      {h.new_status_name ?? "-"}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13 }}>
                      {h.type === "transfer" ? (
                        <span style={{ color: "#334155" }}>
                          {h.transfer_destination ? `كان منقول إلى ${h.transfer_destination}` : "-"}
                        </span>
                      ) : h.case_ref ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/nco-discharges/${h.case_ref!.id}`)}
                          className="text-[#1f3d97] hover:underline"
                          style={{ fontWeight: 700 }}
                        >
                          ملف {caseNumber(h.case_ref.seq, h.case_ref.year)}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>بدون ملف</span>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                      <div className="flex flex-col">
                        <span>{h.creator_name ?? "-"}</span>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatDate(h.created_at)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* الصفحات */}
        {!loading && total > PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-[#eff0f6] flex items-center justify-between gap-3">
            <span style={{ fontSize: 13, color: "#717d96" }}>
              صفحة {toAr(page + 1)} من {toAr(pageCount)}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 h-9 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50 disabled:opacity-40"
                style={{ fontSize: 13 }}
              >
                <ChevronRight size={14} />
                السابق
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                className="flex items-center gap-1 px-3 h-9 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50 disabled:opacity-40"
                style={{ fontSize: 13 }}
              >
                التالي
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {returnTarget && (
        <ReturnModal
          person={returnTarget}
          statusOptions={statusOptions}
          unitOptions={unitOptions}
          batchOptions={batchOptions}
          onClose={() => setReturnTarget(null)}
          onDone={(message) => {
            setReturnTarget(null);
            setSuccess(message);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

    </div>
  );
}