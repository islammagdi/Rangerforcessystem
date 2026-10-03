import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  X,
  Search,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { logActivity } from "../../lib/logActivity";

const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

// =====================================================
// Helpers
// =====================================================

const toAr = (value: string | number) =>
  String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

const toEnglishDigits = (value: string) =>
  value
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ar-EG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const pickOne = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

async function logMovement(action: string, details: string) {
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

    await logActivity({
      userId: user.id,
      userName: profile?.username ?? "غير معروف",
      actionType: "UPDATE",
      action,
      entity: "ترقي المجندين",
      details,
    } as any);
  } catch {
    // التسجيل مش لازم يوقف الشغل
  }
}

// =====================================================
// Types
// =====================================================

type PersonRow = {
  id: string;
  militaryNumber: string;
  fullName: string;
  rankName: string | null;
  rankCode: string | null;
  categoryCode: string | null;
  unitName: string | null;
  isActive: boolean | null;
};

type Movement = {
  id: string;
  personnel_id: string;
  military_number: string;
  full_name: string;
  unit_name: string | null;
  movement_type: "promotion" | "demotion";
  rank_name: string | null;
  movement_date: string;
  decision_number: string | null;
  notes: string | null;
  created_at: string;
  created_by_name: string | null;
};

type Tab = "promote" | "demote" | "history";

async function fetchPersonnelByNumbers(numbers: string[]): Promise<PersonRow[]> {
  if (numbers.length === 0) return [];

  const { data, error } = await supabase
    .from("personnel")
    .select(
      `id, military_number, full_name, is_active,
       rank:rank_id(name, code),
       category:personnel_category_id(code),
       primary_unit:primary_unit_id(name)`
    )
    .in("military_number", numbers);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    militaryNumber: row.military_number,
    fullName: row.full_name,
    rankName: pickOne<any>(row.rank)?.name ?? null,
    rankCode: pickOne<any>(row.rank)?.code ?? null,
    categoryCode: pickOne<any>(row.category)?.code ?? null,
    unitName: pickOne<any>(row.primary_unit)?.name ?? null,
    isActive: row.is_active,
  }));
}

// =====================================================
// الصفحة
// =====================================================

export function ConscriptPromotionsPage() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("conscript_promotion:edit");

  const [tab, setTab] = useState<Tab>(canEdit ? "promote" : "history");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const [corporalCount, setCorporalCount] = useState<number | null>(null);

  // الترقية
  const [numbersInput, setNumbersInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [promoteList, setPromoteList] = useState<PersonRow[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [promoteDate, setPromoteDate] = useState(todayIso());
  const [promoteDecision, setPromoteDecision] = useState("");
  const [promoteNotes, setPromoteNotes] = useState("");

  // العزل
  const [demoteNumber, setDemoteNumber] = useState("");
  const [demotePerson, setDemotePerson] = useState<PersonRow | null>(null);
  const [demoteLookupError, setDemoteLookupError] = useState("");
  const [demoteDate, setDemoteDate] = useState(todayIso());
  const [demoteDecision, setDemoteDecision] = useState("");
  const [demoteReason, setDemoteReason] = useState("");

  // السجل
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "promotion" | "demotion">("all");

  useEffect(() => {
    void loadStats();
    void loadHistory();
  }, []);

  async function loadStats() {
    const { data: rank } = await supabase
      .from("ranks")
      .select("id")
      .eq("code", "CONSCRIPT_CORPORAL")
      .maybeSingle();

    if (!rank) return;

    const { count } = await supabase
      .from("personnel")
      .select("id", { count: "exact", head: true })
      .eq("rank_id", rank.id)
      .eq("is_active", true);

    setCorporalCount(count ?? 0);
  }

  async function loadHistory() {
    setLoadingHistory(true);
    const { data, error: rpcError } = await supabase.rpc("get_conscript_rank_movements", { p_limit: 300 });
    setLoadingHistory(false);

    if (rpcError) {
      setError("تعذر تحميل سجل الحركات: " + rpcError.message);
      return;
    }

    setMovements((data ?? []) as Movement[]);
  }

  function flash(message: string) {
    setSuccess(message);
    window.setTimeout(() => setSuccess(""), 4000);
  }

  // ===================================================
  // الترقية: إضافة أرقام للقائمة
  // ===================================================

  async function addNumbers() {
    const numbers = Array.from(
      new Set(
        toEnglishDigits(numbersInput)
          .split(/[\s,،;]+/)
          .map((n) => n.trim())
          .filter(Boolean)
      )
    );

    if (numbers.length === 0) return;

    setChecking(true);
    setError("");

    try {
      const found = await fetchPersonnelByNumbers(numbers);
      const foundByNumber = new Map(found.map((p) => [p.militaryNumber, p]));

      const accepted: PersonRow[] = [];
      const problems: string[] = [];

      numbers.forEach((num) => {
        const p = foundByNumber.get(num);

        if (!p) return problems.push(`${num}: غير موجود`);
        if (p.categoryCode !== "CONSCRIPT") return problems.push(`${num}: ليس مجندًا`);
        if (p.isActive === false) return problems.push(`${num}: غير نشط`);
        if (p.rankCode === "CONSCRIPT_CORPORAL") return problems.push(`${num}: عريف مجند بالفعل`);
        if (p.rankCode !== "SOLDIER") return problems.push(`${num}: درجته ليست جندي`);
        if (promoteList.some((x) => x.id === p.id)) return;

        accepted.push(p);
      });

      setPromoteList((prev) => [...prev, ...accepted]);
      setRejected(problems);
      setNumbersInput("");
    } catch (err: any) {
      setError("تعذر البحث: " + (err?.message ?? ""));
    } finally {
      setChecking(false);
    }
  }

  async function handlePromote() {
    if (promoteList.length === 0) return setError("أضف الأفراد الأول.");
    if (!promoteDate || !promoteDecision.trim()) return setError("اكتب تاريخ الترقي ورقم القرار.");

    if (!window.confirm(`ترقية ${toAr(promoteList.length)} فرد لدرجة عريف مجند بالقرار رقم ${promoteDecision.trim()}؟`)) {
      return;
    }

    setBusy(true);
    setError("");

    const { data, error: rpcError } = await supabase.rpc("promote_conscripts", {
      p_personnel_ids: promoteList.map((p) => p.id),
      p_date: promoteDate,
      p_decision_number: promoteDecision.trim(),
      p_notes: promoteNotes.trim() || null,
    });

    setBusy(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    await logMovement(
      "ترقية مجندين لعريف مجند",
      `قرار ${promoteDecision.trim()} - ${promoteList.map((p) => p.militaryNumber).join("، ")}`
    );

    flash(`تم ترقية ${toAr(Number(data ?? promoteList.length))} فرد لدرجة عريف مجند.`);
    setPromoteList([]);
    setRejected([]);
    setPromoteDecision("");
    setPromoteNotes("");
    void loadStats();
    void loadHistory();
  }

  // ===================================================
  // العزل
  // ===================================================

  async function lookupDemote() {
    const number = toEnglishDigits(demoteNumber).trim();

    setDemotePerson(null);
    setDemoteLookupError("");

    if (!number) return;

    setChecking(true);

    try {
      const [p] = await fetchPersonnelByNumbers([number]);

      if (!p) return setDemoteLookupError("لا يوجد فرد بهذا الرقم العسكري.");
      if (p.categoryCode !== "CONSCRIPT") return setDemoteLookupError("الفرد ليس مجندًا.");
      if (p.isActive === false) return setDemoteLookupError("الفرد غير نشط.");
      if (p.rankCode !== "CONSCRIPT_CORPORAL") return setDemoteLookupError("الفرد درجته ليست عريف مجند.");

      setDemotePerson(p);
    } catch (err: any) {
      setDemoteLookupError("تعذر البحث: " + (err?.message ?? ""));
    } finally {
      setChecking(false);
    }
  }

  async function handleDemote() {
    if (!demotePerson) return;
    if (!demoteDate || !demoteDecision.trim()) return setError("اكتب تاريخ العزل ورقم القرار.");
    if (!demoteReason.trim()) return setError("اكتب سبب العزل.");

    if (!window.confirm(`عزل ${demotePerson.fullName} من عريف مجند لجندي؟`)) return;

    setBusy(true);
    setError("");

    const { error: rpcError } = await supabase.rpc("demote_conscript", {
      p_personnel_id: demotePerson.id,
      p_date: demoteDate,
      p_decision_number: demoteDecision.trim(),
      p_reason: demoteReason.trim(),
    });

    setBusy(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    await logMovement(
      "عزل عريف مجند لجندي",
      `${demotePerson.militaryNumber} - قرار ${demoteDecision.trim()} - السبب: ${demoteReason.trim()}`
    );

    flash(`تم عزل ${demotePerson.fullName} لدرجة جندي.`);
    setDemotePerson(null);
    setDemoteNumber("");
    setDemoteDecision("");
    setDemoteReason("");
    void loadStats();
    void loadHistory();
  }

  // ===================================================
  // السجل المفلتر
  // ===================================================

  const filteredMovements = useMemo(() => {
    const q = toEnglishDigits(historySearch.trim());

    return movements.filter((m) => {
      if (historyFilter !== "all" && m.movement_type !== historyFilter) return false;
      if (!q) return true;
      return m.military_number.includes(q) || m.full_name.includes(q) || (m.decision_number ?? "").includes(q);
    });
  }, [movements, historySearch, historyFilter]);

  // ===================================================
  // Render
  // ===================================================

  const inputClass = "h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]";
  const labelStyle: React.CSSProperties = { ...F, fontSize: 13, color: "#717d96", display: "block", marginBottom: 4 };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: "promote", label: "ترقية لعريف مجند", icon: <ArrowUpCircle size={16} />, show: canEdit },
    { id: "demote", label: "عزل لجندي", icon: <ArrowDownCircle size={16} />, show: canEdit },
    { id: "history", label: "سجل الحركات", icon: <History size={16} />, show: true },
  ];

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl" style={F}>
      {/* الرأس */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p style={{ fontSize: 18, fontWeight: 700, color: "#2d3648" }}>ترقي المجندين</p>
          <p style={{ fontSize: 13, color: "#717d96" }}>
            ترقية المجند لدرجة عريف مجند أو عزله لجندي. الفرد بيفضل مجند، وتاريخ تسريحه وكل حساباته مش بتتغير.
          </p>
        </div>

        {corporalCount !== null && (
          <div className="rounded-xl bg-[#f6fcf8] border border-[#bbf7d0] px-4 py-2 flex flex-col items-center">
            <span style={{ fontSize: 22, fontWeight: 700, color: "#00522E" }}>{toAr(corporalCount)}</span>
            <span style={{ fontSize: 12, color: "#717d96" }}>عريف مجند بالخدمة حاليًا</span>
          </div>
        )}
      </div>

      {/* التابات */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-1.5 flex gap-1 w-fit flex-wrap">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
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
            </button>
          ))}
      </div>

      {error && (
        <div className="rounded-xl px-5 py-3 bg-[#fef2f2] border border-[#fecaca] flex items-center justify-between">
          <span style={{ color: "#991b1b", fontSize: 14, fontWeight: 700 }}>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-[#991b1b]">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="rounded-xl px-5 py-3 bg-[#f0fdf4] border border-[#bbf7d0]">
          <span style={{ color: "#166534", fontSize: 14, fontWeight: 700 }}>{success}</span>
        </div>
      )}

      {/* ===================== الترقية ===================== */}
      {tab === "promote" && canEdit && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label style={labelStyle}>الأرقام العسكرية (رقم أو أكتر، كل رقم في سطر أو بينهم مسافة)</label>
            <div className="flex items-start gap-2 flex-wrap">
              <textarea
                value={numbersInput}
                onChange={(e) => setNumbersInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void addNumbers();
                  }
                }}
                rows={2}
                dir="ltr"
                placeholder="مثال: 20230011223344"
                className="flex-1 min-w-[260px] rounded-lg border border-[#cbd5e1] px-3 py-2 outline-none focus:border-[#00B867] resize-y text-left"
                style={{ fontSize: 14, letterSpacing: 1 }}
              />
              <button
                type="button"
                onClick={() => void addNumbers()}
                disabled={checking || !numbersInput.trim()}
                className="flex items-center gap-2 px-5 h-[42px] rounded-lg bg-[#2d3648] text-white hover:opacity-90 disabled:opacity-50"
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                {checking ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                إضافة للقائمة
              </button>
            </div>

            {rejected.length > 0 && (
              <div className="rounded-lg bg-[#fff8e8] px-3 py-2 flex flex-col gap-0.5">
                <span style={{ fontSize: 12, fontWeight: 700, color: "#8a6500" }}>أرقام لم تُضف:</span>
                {rejected.map((r) => (
                  <span key={r} style={{ fontSize: 12, color: "#8a6500" }}>
                    • {r}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* القائمة */}
          <div className="rounded-xl border border-[#eff0f6] overflow-hidden">
            <div className="px-4 py-3 bg-[#f8fafc] flex items-center justify-between">
              <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                الأفراد المراد ترقيتهم ({toAr(promoteList.length)})
              </span>
              {promoteList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPromoteList([])}
                  style={{ fontSize: 12, color: "#991b1b" }}
                >
                  مسح القائمة
                </button>
              )}
            </div>

            {promoteList.length === 0 ? (
              <p className="px-4 py-6 text-center" style={{ fontSize: 13, color: "#94a3b8" }}>
                لم تتم إضافة أفراد بعد.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="text-[#64748b] text-sm">
                      <th className="text-right px-4 py-2">الرقم العسكري</th>
                      <th className="text-right px-4 py-2">الدرجة الحالية</th>
                      <th className="text-right px-4 py-2">الاسم</th>
                      <th className="text-right px-4 py-2">الوحدة</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {promoteList.map((p) => (
                      <tr key={p.id} className="border-t border-[#eff0f6]">
                        <td className="px-4 py-2" style={{ fontSize: 13 }}>{p.militaryNumber}</td>
                        <td className="px-4 py-2" style={{ fontSize: 13 }}>{p.rankName ?? "-"}</td>
                        <td className="px-4 py-2" style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                          {p.fullName}
                        </td>
                        <td className="px-4 py-2" style={{ fontSize: 13 }}>{p.unitName ?? "-"}</td>
                        <td className="px-4 py-2 text-left">
                          <button
                            type="button"
                            onClick={() => setPromoteList((prev) => prev.filter((x) => x.id !== p.id))}
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#991b1b] hover:bg-[#fef2f2]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* القرار */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label style={labelStyle}>تاريخ الترقي *</label>
              <input
                type="date"
                value={promoteDate}
                onChange={(e) => setPromoteDate(e.target.value)}
                className={`${inputClass} w-full`}
                style={{ fontSize: 14 }}
              />
            </div>
            <div>
              <label style={labelStyle}>رقم القرار *</label>
              <input
                type="text"
                value={promoteDecision}
                onChange={(e) => setPromoteDecision(e.target.value)}
                className={`${inputClass} w-full`}
                style={{ fontSize: 14 }}
              />
            </div>
            <div>
              <label style={labelStyle}>ملاحظات (اختياري)</label>
              <input
                type="text"
                value={promoteNotes}
                onChange={(e) => setPromoteNotes(e.target.value)}
                className={`${inputClass} w-full`}
                style={{ fontSize: 14 }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handlePromote()}
            disabled={busy || promoteList.length === 0 || !promoteDecision.trim() || !promoteDate}
            className="flex items-center justify-center gap-2 px-6 h-[44px] rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50 w-fit"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpCircle size={16} />}
            ترقية {toAr(promoteList.length)} فرد لعريف مجند
          </button>
        </div>
      )}

      {/* ===================== العزل ===================== */}
      {tab === "demote" && canEdit && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label style={labelStyle}>الرقم العسكري للعريف المجند *</label>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                inputMode="numeric"
                value={demoteNumber}
                onChange={(e) => {
                  setDemoteNumber(e.target.value);
                  setDemotePerson(null);
                  setDemoteLookupError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && void lookupDemote()}
                dir="ltr"
                className={`${inputClass} flex-1 min-w-[220px] text-left`}
                style={{ fontSize: 15, letterSpacing: 1 }}
              />
              <button
                type="button"
                onClick={() => void lookupDemote()}
                disabled={checking || !demoteNumber.trim()}
                className="flex items-center gap-2 px-5 h-[42px] rounded-lg bg-[#2d3648] text-white hover:opacity-90 disabled:opacity-50"
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                {checking ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                بحث
              </button>
            </div>

            {demoteLookupError && (
              <p style={{ fontSize: 13, color: "#991b1b", fontWeight: 700 }}>{demoteLookupError}</p>
            )}
          </div>

          {demotePerson && (
            <>
              <div className="rounded-xl border border-[#fecaca] bg-[#fff5f5] p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  ["الرقم العسكري", demotePerson.militaryNumber],
                  ["الدرجة الحالية", demotePerson.rankName ?? "-"],
                  ["الاسم", demotePerson.fullName],
                  ["الوحدة", demotePerson.unitName ?? "-"],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span style={{ fontSize: 12, color: "#717d96" }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>تاريخ العزل *</label>
                  <input
                    type="date"
                    value={demoteDate}
                    onChange={(e) => setDemoteDate(e.target.value)}
                    className={`${inputClass} w-full`}
                    style={{ fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>رقم القرار *</label>
                  <input
                    type="text"
                    value={demoteDecision}
                    onChange={(e) => setDemoteDecision(e.target.value)}
                    className={`${inputClass} w-full`}
                    style={{ fontSize: 14 }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>سبب العزل *</label>
                <textarea
                  value={demoteReason}
                  onChange={(e) => setDemoteReason(e.target.value)}
                  rows={2}
                  placeholder="مثال: عقوبة ... بتاريخ ..."
                  className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 outline-none focus:border-[#00B867] resize-none"
                  style={{ fontSize: 14 }}
                />
              </div>

              <button
                type="button"
                onClick={() => void handleDemote()}
                disabled={busy || !demoteDecision.trim() || !demoteReason.trim() || !demoteDate}
                className="flex items-center justify-center gap-2 px-6 h-[44px] rounded-lg bg-[#e3282c] text-white hover:opacity-90 disabled:opacity-50 w-fit"
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <ArrowDownCircle size={16} />}
                عزل لدرجة جندي
              </button>
            </>
          )}
        </div>
      )}

      {/* ===================== السجل ===================== */}
      {tab === "history" && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
          <div className="p-4 flex flex-wrap items-center gap-3 border-b border-[#eff0f6]">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="بحث بالاسم أو الرقم العسكري أو رقم القرار"
                className="w-full h-[42px] rounded-lg border border-[#cbd5e1] pr-9 pl-3 outline-none focus:border-[#00B867]"
                style={{ fontSize: 14 }}
              />
            </div>

            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value as typeof historyFilter)}
              className="h-[42px] rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none"
              style={{ fontSize: 14 }}
            >
              <option value="all">كل الحركات</option>
              <option value="promotion">ترقي مجند</option>
              <option value="demotion">عزل مجند</option>
            </select>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={22} className="animate-spin text-[#00B867]" />
            </div>
          ) : filteredMovements.length === 0 ? (
            <p className="py-12 text-center" style={{ fontSize: 14, color: "#94a3b8" }}>
              لا توجد حركات.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                    <th className="text-right px-4 py-3">التاريخ</th>
                    <th className="text-right px-4 py-3">الحركة</th>
                    <th className="text-right px-4 py-3">الرقم العسكري</th>
                    <th className="text-right px-4 py-3">الاسم</th>
                    <th className="text-right px-4 py-3">الوحدة</th>
                    <th className="text-right px-4 py-3">الدرجة بعد الحركة</th>
                    <th className="text-right px-4 py-3">رقم القرار</th>
                    <th className="text-right px-4 py-3">ملاحظات / السبب</th>
                    <th className="text-right px-4 py-3">بواسطة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((m) => (
                    <tr key={m.id} className="border-t border-[#eff0f6] hover:bg-[#fafbff]">
                      <td className="px-4 py-3 whitespace-nowrap" style={{ fontSize: 13 }}>
                        {formatDate(m.movement_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2.5 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            background: m.movement_type === "promotion" ? "#DCF4DF" : "#fce9ea",
                            color: m.movement_type === "promotion" ? "#00522E" : "#9d2e15",
                          }}
                        >
                          {m.movement_type === "promotion" ? "ترقي مجند" : "عزل مجند"}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 13 }}>{m.military_number}</td>
                      <td className="px-4 py-3" style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                        {m.full_name}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 13 }}>{m.unit_name ?? "-"}</td>
                      <td className="px-4 py-3" style={{ fontSize: 13 }}>{m.rank_name ?? "-"}</td>
                      <td className="px-4 py-3" style={{ fontSize: 13 }}>{m.decision_number ?? "-"}</td>
                      <td className="px-4 py-3" style={{ fontSize: 13, color: "#717d96" }}>{m.notes ?? "-"}</td>
                      <td className="px-4 py-3" style={{ fontSize: 13 }}>{m.created_by_name ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}