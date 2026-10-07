import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Plus, Loader2, X, Search, ChevronLeft, UserMinus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { logActivity } from "../../lib/logActivity";

// =====================================================
// Helpers مشتركة (بتستخدمها صفحة تفاصيل الملف كمان)
// =====================================================

export type CaseStatus =
  | "awaiting_notification"
  | "in_progress"
  | "submitted"
  | "completed"
  | "cancelled"
  | "reversed";

export const ACTIVE_STATUSES: CaseStatus[] = ["awaiting_notification", "in_progress", "submitted"];

// الملف الجاري اللي محدش حدّثه من المدة دي بيتعتبر متوقف
export const STALE_DAYS = 14;

export function daysSince(value: string | null | undefined): number {
  if (!value) return 0;
  return Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
}

export const isStaleCase = (status: CaseStatus, updatedAt: string | null) =>
  ACTIVE_STATUSES.includes(status) && daysSince(updatedAt) >= STALE_DAYS;
export const CASE_STATUS_META: Record<CaseStatus, { label: string; bg: string; color: string }> = {
  awaiting_notification: { label: "بانتظار إخطار الوحدة", bg: "#fff8e8", color: "#8a6500" },
  in_progress: { label: "جاري استيفاء الإجراءات", bg: "#e0f2fe", color: "#075985" },
  submitted: { label: "مرفوع للجهة الأعلى - بانتظار الشهادة", bg: "#e8f0fe", color: "#172e78" },
  completed: { label: "مكتمل", bg: "#DCF4DF", color: "#00522E" },
  cancelled: { label: "ملغى", bg: "#f1f5f9", color: "#64748b" },
  reversed: { label: "أُعيد للخدمة", bg: "#f3e8ff", color: "#6b21a8" },
};

export const DECISION_AUTHORITY_SUGGESTIONS = ["السجلات العسكرية", "هيئة التنظيم والإدارة"];

export const CATEGORY_LABELS: Record<string, string> = {
  VOLUNTEER: "ضابط صف",
  CONSCRIPT: "مجند",
};
export const toAr = (value: string | number): string =>
  String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

export const toEnglishDigits = (value: string) =>
  value
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

export const caseNumber = (seq: number, year: number) => `${toAr(seq)}/${toAr(year)}`;

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const pickOne = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

export async function logDischarge(actionType: string, action: string, details: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, full_name")
      .eq("id", user.id)
      .maybeSingle();

    await logActivity({
      userId: user.id,
      userName: profile?.full_name ?? profile?.username ?? "مستخدم غير معروف",
      actionType,
      action,
      entity: "ملفات إنهاء الخدمة",
      details,
    } as any);
  } catch {
    // التسجيل مش لازم يوقف الشغل
  }
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// =====================================================
// Types
// =====================================================

type CaseRow = {
  id: string;
  case_year: number;
  case_seq: number;
  status: CaseStatus;
  decision_number: string | null;
  reason_name: string;
  person_name: string;
  person_rank: string | null;
  military_number: string;
  docs_count: number;
  personnel_category: string | null;
  updated_at: string | null;
};

type Reason = { id: string; code: string; name: string; applies_to: string[] };

type PersonOption = {
  id: string;
  full_name: string;
  military_number: string;
  rank_name: string | null;
  primary_unit_name: string | null;
  category_code: string;
};
type FilterTab = "active" | "completed" | "cancelled" | "reversed";
type CategoryFilter = "all" | "VOLUNTEER" | "CONSCRIPT";

// =====================================================
// الصفحة
// =====================================================

export function NcoDischargesPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("nco_discharge:edit");

  const [cases, setCases] = useState<CaseRow[]>([]);
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [categoryCodeById, setCategoryCodeById] = useState<Record<string, string>>({});
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<FilterTab>("active");
  const [search, setSearch] = useState("");

  // ✅ الجاي من كارت "ملفات متوقفة" في الموقف العام بيفتح على المتأخرة بس
  const location = useLocation();
  const [staleOnly, setStaleOnly] = useState<boolean>(
    Boolean((location.state as any)?.staleOnly)
  );

  // فتح ملف جديد
  const [showCreate, setShowCreate] = useState(false);
  const [militaryNumber, setMilitaryNumber] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<PersonOption | null>(null);
  const [reasonId, setReasonId] = useState("");
  const [eventDate, setEventDate] = useState(todayIso());
  const [decisionNumber, setDecisionNumber] = useState("");
  const [decisionDate, setDecisionDate] = useState("");
  const [decisionAuthority, setDecisionAuthority] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");

    const [casesRes, reasonsRes, categoryRes] = await Promise.all([
      supabase
        .from("nco_discharge_cases")
        .select(
          `id, case_year, case_seq,status, decision_number, created_at, updated_at, personnel_category,
           reason:reason_id(name),
           personnel:personnel_id(full_name, military_number, rank:ranks(name)),
           docs:nco_discharge_case_documents(id)`
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("nco_discharge_reasons")
              .select("id, code, name, applies_to")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("personnel_categories").select("id, code").in("code", ["VOLUNTEER", "CONSCRIPT"]),
    ]);

    const firstError = casesRes.error ?? reasonsRes.error ?? categoryRes.error;

    if (firstError) {
      setError("تعذر تحميل البيانات: " + firstError.message);
      setLoading(false);
      return;
    }

    setCases(
      (casesRes.data ?? []).map((row: any) => {
        const person = pickOne<any>(row.personnel);
        return {
          id: row.id,
          case_year: row.case_year,
          case_seq: row.case_seq,
          status: row.status,
          decision_number: row.decision_number,
          reason_name: pickOne<any>(row.reason)?.name ?? "-",
          person_name: person?.full_name ?? "-",
          person_rank: pickOne<any>(person?.rank)?.name ?? null,
          military_number: person?.military_number ?? "",
                docs_count: (row.docs ?? []).length,
          personnel_category: row.personnel_category ?? null,
          updated_at: row.updated_at ?? null,
        };
      })
    );

    setReasons((reasonsRes.data ?? []) as Reason[]);
        const categoryMap: Record<string, string> = {};
    (categoryRes.data ?? []).forEach((c: any) => (categoryMap[c.id] = c.code));
    setCategoryCodeById(categoryMap);
    setLoading(false);
  }

  async function handleLookup() {
    const number = toEnglishDigits(militaryNumber).trim();

    setLookupError("");
    setSelectedPerson(null);

    if (!number) {
      setLookupError("اكتب الرقم العسكري.");
      return;
    }

    setLookingUp(true);

    try {
      const { data, error: lookupErr } = await supabase
        .from("personnel")
        .select(
          `id, full_name, military_number, is_active, personnel_category_id,
           rank:rank_id(name),
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

      if (row.is_active === false) {
        setLookupError("هذا الفرد غير نشط بالفعل (خدمته منتهية أو منقول).");
        return;
      }

      const categoryCode = categoryCodeById[row.personnel_category_id];

      if (!categoryCode) {
        setLookupError("ملفات إنهاء الخدمة خاصة بضباط الصف والمجندين فقط.");
        return;
      }

      const openCase = cases.find(
        (c) => c.military_number === row.military_number && ACTIVE_STATUSES.includes(c.status)
      );

      if (openCase) {
        setLookupError(
          `يوجد ملف إنهاء خدمة مفتوح لهذا الفرد بالفعل (ملف رقم ${caseNumber(
            openCase.case_seq,
            openCase.case_year
          )}).`
        );
        return;
      }

      setSelectedPerson({
        id: row.id,
        full_name: row.full_name,
        military_number: row.military_number,
        rank_name: pickOne<any>(row.rank)?.name ?? null,
        primary_unit_name: pickOne<any>(row.primary_unit)?.name ?? null,
        category_code: categoryCode,
      });
      setReasonId("");
    } finally {
      setLookingUp(false);
    }
  }

  function resetCreate() {
    setShowCreate(false);
    setMilitaryNumber("");
    setLookupError("");
    setSelectedPerson(null);
    setReasonId("");
    setEventDate(todayIso());
    setDecisionNumber("");
    setDecisionDate("");
    setDecisionAuthority("");
    setNewNotes("");
  }

  async function handleCreate() {
       if (!selectedPerson) return setError("ابحث عن الفرد بالرقم العسكري الأول.");
    if (!reasonId) return setError("اختر سبب إنهاء الخدمة.");
    if (!eventDate) return setError("اختر تاريخ الواقعة.");
    if (!decisionNumber.trim() || !decisionDate) return setError("اكتب رقم وتاريخ قرار إنهاء الخدمة.");
    if (!decisionAuthority.trim()) return setError("اكتب الجهة المصدرة للقرار.");

    setCreating(true);
    setError("");

    try {
      const { data, error: createError } = await supabase.rpc("create_nco_discharge_case", {
        p_personnel_id: selectedPerson.id,
        p_reason_id: reasonId,
        p_event_date: eventDate,
        p_decision_number: decisionNumber.trim(),
        p_decision_date: decisionDate,
        p_decision_authority: decisionAuthority.trim(),
        p_notes: newNotes.trim() || null,
      });

      if (createError) {
        setError(createError.message);
        return;
      }

      await logDischarge(
        "CREATE",
        "فتح ملف إنهاء خدمة",
        `${selectedPerson.rank_name ?? ""} ${selectedPerson.full_name} - قرار ${decisionNumber.trim()}`
      );

      navigate(`/dashboard/nco-discharges/${data}`);
    } finally {
      setCreating(false);
    }
  }

  // الأسباب اللي تنطبق على فئة الفرد المختار
  const availableReasons = useMemo(
    () =>
      selectedPerson
        ? reasons.filter((r) => (r.applies_to ?? []).includes(selectedPerson.category_code))
        : [],
    [reasons, selectedPerson]
  );

  const categoryCases = useMemo(
    () =>
      categoryFilter === "all"
        ? cases
        : cases.filter((c) => c.personnel_category === categoryFilter),
    [cases, categoryFilter]
  );

  const counts = useMemo(
    () => ({
      active: categoryCases.filter((c) => ACTIVE_STATUSES.includes(c.status)).length,
      completed: categoryCases.filter((c) => c.status === "completed").length,
      cancelled: categoryCases.filter((c) => c.status === "cancelled").length,
      reversed: categoryCases.filter((c) => c.status === "reversed").length,
    }),
    [categoryCases]
  );

  const filtered = useMemo(() => {
    const q = toEnglishDigits(search.trim());
    return categoryCases.filter((c) => {
      const inTab = tab === "active" ? ACTIVE_STATUSES.includes(c.status) : c.status === tab;
      if (!inTab) return false;
      if (staleOnly && !isStaleCase(c.status, c.updated_at)) return false;
      if (!q) return true;
      return c.person_name.includes(q) || c.military_number.includes(q);
    });
  }, [categoryCases, tab, search, staleOnly]);

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "active", label: "الملفات الجارية" },
    { id: "completed", label: "مكتملة" },
    { id: "cancelled", label: "ملغاة" },
    { id: "reversed", label: "أُعيد للخدمة" },
  ];

  const inputClass =
    "w-full h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]";

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#717d96",
    display: "block",
    marginBottom: 4,
  };

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
          onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
          className="h-[42px] min-w-[150px] rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none focus:border-[#00B867]"
          style={{ fontSize: 14 }}
        >
          <option value="all">كل الفئات</option>
          <option value="VOLUNTEER">ضباط الصف</option>
          <option value="CONSCRIPT">المجندين</option>
        </select>

        <label
          className={[
            "flex items-center gap-2 px-3 h-[42px] rounded-lg border cursor-pointer select-none",
            staleOnly ? "border-[#fecaca] bg-[#fef2f2]" : "border-[#cbd5e1] bg-white",
          ].join(" ")}
          style={{ fontSize: 14, color: staleOnly ? "#991b1b" : "#475569", fontWeight: 700 }}
        >
          <input
            type="checkbox"
            checked={staleOnly}
            onChange={(e) => {
              setStaleOnly(e.target.checked);
              if (e.target.checked) setTab("active");
            }}
            className="w-4 h-4 accent-[#991b1b]"
          />
          المتوقفة أكتر من {toAr(STALE_DAYS)} يوم
        </label>

        {canEdit && (
          <button
            type="button"
            onClick={() => (showCreate ? resetCreate() : setShowCreate(true))}
            className="flex items-center gap-1 px-4 h-[42px] rounded-lg bg-[#DCF4DF] text-[#00522E] hover:opacity-80 transition-opacity"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            <Plus size={16} />
            فتح ملف إنهاء خدمة
          </button>
        )}
      </div>

      {/* فتح ملف جديد */}
      {showCreate && canEdit && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-4">
          <p style={{ fontSize: 16, fontWeight: 700, color: "#2d3648" }}>فتح ملف إنهاء خدمة جديد</p>

          {/* الفرد */}
          <div className="flex flex-col gap-1.5">
                 <label style={{ fontSize: 13, color: "#717d96" }}>الرقم العسكري للفرد (ضابط صف أو مجند) *</label>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                inputMode="numeric"
                value={militaryNumber}
                onChange={(e) => {
                  setMilitaryNumber(e.target.value);
                  setLookupError("");
                  if (selectedPerson) setSelectedPerson(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && void handleLookup()}
                placeholder="اكتب الرقم العسكري بالكامل"
                dir="ltr"
                className="flex-1 min-w-[220px] h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867] text-left"
                style={{ fontSize: 15, letterSpacing: 1 }}
                autoFocus
              />

              <button
                type="button"
                onClick={() => void handleLookup()}
                disabled={lookingUp || !militaryNumber.trim()}
                className="flex items-center gap-2 px-5 h-[42px] rounded-lg bg-[#2d3648] text-white hover:opacity-90 disabled:opacity-50"
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                {lookingUp ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                بحث
              </button>
            </div>

            {lookupError && (
              <p style={{ fontSize: 13, color: "#991b1b", fontWeight: 700 }}>{lookupError}</p>
            )}

            {selectedPerson && (
              <div className="rounded-xl border border-[#00B867] bg-[#f6fcf8] p-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[
                  ["الفئة", CATEGORY_LABELS[selectedPerson.category_code] ?? "-"],
                  ["الرقم العسكري", selectedPerson.military_number],
                  ["الدرجة", selectedPerson.rank_name ?? "-"],
                  ["الاسم", selectedPerson.full_name],
                  ["الوحدة الأساسية", selectedPerson.primary_unit_name ?? "-"],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span style={{ fontSize: 12, color: "#717d96" }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* السبب والواقعة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>سبب إنهاء الخدمة *</label>
              <select
                value={reasonId}
                onChange={(e) => setReasonId(e.target.value)}
                disabled={!selectedPerson}
                className={`${inputClass} bg-white disabled:bg-[#f7f9fc]`}
                style={{ fontSize: 14 }}
              >
                <option value="">{selectedPerson ? "اختر السبب" : "ابحث عن الفرد الأول"}</option>
                {availableReasons.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>تاريخ الواقعة *</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={inputClass}
                style={{ fontSize: 14 }}
              />
            </div>
          </div>

          {/* القرار */}
          <div className="rounded-xl border border-[#eff0f6] p-4 flex flex-col gap-3">
            <p style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>قرار إنهاء الخدمة الوارد</p>

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
                  list="nco-decision-authorities"
                  value={decisionAuthority}
                  onChange={(e) => setDecisionAuthority(e.target.value)}
                  placeholder="مثال: السجلات العسكرية"
                  className={inputClass}
                  style={{ fontSize: 14 }}
                />
                <datalist id="nco-decision-authorities">
                  {DECISION_AUTHORITY_SUGGESTIONS.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>ملاحظات (اختياري)</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 outline-none focus:border-[#00B867] resize-none"
              style={{ fontSize: 14 }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating}
              className="flex items-center gap-2 px-5 h-[42px] rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              {creating && <Loader2 size={14} className="animate-spin" />}
              فتح الملف
            </button>

            <button
              type="button"
              onClick={resetCreate}
              className="h-[42px] px-4 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-gray-50"
              style={{ fontSize: 14 }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl px-5 py-3 bg-[#fef2f2] border border-[#fecaca] flex items-center justify-between">
          <span style={{ color: "#991b1b", fontSize: 14, fontWeight: 700 }}>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-[#991b1b]">
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
            {t.label}
            <span className="px-2 py-0.5 rounded-full bg-white" style={{ fontSize: 12, color: "#717d96" }}>
              {toAr(counts[t.id])}
            </span>
          </button>
        ))}
      </div>

      {/* القائمة */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-[#00B867]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-[#717d96]">
            <UserMinus size={28} className="text-[#cbd5e1]" />
            <span style={{ fontSize: 14 }}>لا توجد ملفات.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                  <th className="text-right px-4 py-3">رقم الملف</th>
                  <th className="text-right px-4 py-3">الفرد</th>
                  <th className="text-right px-4 py-3">السبب</th>
                  <th className="text-right px-4 py-3">رقم القرار</th>
                  <th className="text-right px-4 py-3">المستندات</th>
                  <th className="text-right px-4 py-3">الحالة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>

              <tbody>
                {filtered.map((c) => {
                  const meta = CASE_STATUS_META[c.status];

                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/dashboard/nco-discharges/${c.id}`)}
                      className="border-t border-[#eff0f6] cursor-pointer hover:bg-[#fafbff]"
                    >
                      <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: "#2d3648" }}>
                        {caseNumber(c.case_seq, c.case_year)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                            {c.person_rank ? `${c.person_rank} / ` : ""}
                            {c.person_name}
                          </span>
                                                <span className="flex items-center gap-2" style={{ fontSize: 12, color: "#94a3b8" }}>
                            {c.military_number}
                            {c.personnel_category && (
                              <span
                                className="px-2 py-0.5 rounded-full"
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: c.personnel_category === "CONSCRIPT" ? "#fef3c7" : "#e0f2fe",
                                  color: c.personnel_category === "CONSCRIPT" ? "#92400e" : "#075985",
                                }}
                              >
                                {CATEGORY_LABELS[c.personnel_category] ?? c.personnel_category}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                        {c.reason_name}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                        {c.decision_number ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-0.5 rounded-full"
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            background: c.docs_count > 0 ? "#e8f0fe" : "#f1f5f9",
                            color: c.docs_count > 0 ? "#172e78" : "#94a3b8",
                          }}
                        >
                          {c.docs_count > 0 ? `${toAr(c.docs_count)} مستند` : "لا يوجد"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ fontSize: 12, fontWeight: 700, background: meta.bg, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        {isStaleCase(c.status, c.updated_at) && (
                          <span
                            className="block mt-1 w-fit px-2 py-0.5 rounded-full"
                            style={{ fontSize: 11, fontWeight: 700, background: "#fef2f2", color: "#991b1b" }}
                          >
                            متوقف من {toAr(daysSince(c.updated_at))} يوم
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-left">
                        <ChevronLeft size={16} className="text-[#94a3b8] inline" />
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