import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Search, UserCheck, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/logActivity";
import { usePermissions } from "../../lib/usePermissions";
import {
  RECRUIT_CATEGORIES,
  RECRUIT_LEVELS,
  cellKey,
  createPhase,
  fetchPhaseSummaries,
  phaseCategories,
  type PhaseSummary,
  type RecruitCategory,
} from "../../lib/recruitArrivals";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

function categoryLabel(key: RecruitCategory): string {
  return RECRUIT_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

// =====================================================
// تسجيل العملية في سجل العمليات
// =====================================================

async function logPhaseCreated(phaseName: string) {
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
      actionType: "CREATE",
      action: "إنشاء مرحلة تجنيدية",
      entity: "تسجيل وصول المجندين",
      details: `تم إنشاء المرحلة التجنيدية "${phaseName}" بواسطة ${userName}`,
    });
  } catch {
    // فشل التسجيل في السجل مايمنعش إنشاء المرحلة
  }
}

// =====================================================
// نافذة إنشاء مرحلة جديدة
// =====================================================

function CreatePhaseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (phaseId: string) => void;
}) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [categories, setCategories] = useState<RecruitCategory[]>([]);
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleCategory(key: RecruitCategory) {
    setCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
    setError("");
  }

  function setTarget(key: string, value: string) {
    // أرقام فقط
    const digits = value.replace(/[^0-9]/g, "");
    setTargets((prev) => ({ ...prev, [key]: digits }));
  }

  function categoryTotal(category: RecruitCategory): number {
    return RECRUIT_LEVELS.reduce(
      (sum, level) => sum + (Number(targets[cellKey(category, level.key)]) || 0),
      0
    );
  }

  const grandTotal = categories.reduce((sum, c) => sum + categoryTotal(c), 0);

  async function handleSubmit() {
    if (saving) return;

    if (!name.trim()) {
      setError("اكتب اسم المرحلة");
      return;
    }

    if (categories.length === 0) {
      setError("اختر فئة واحدة على الأقل");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const numericTargets: Record<string, number> = {};
      Object.entries(targets).forEach(([k, v]) => {
        numericTargets[k] = Number(v) || 0;
      });

      const phase = await createPhase({
        name,
        notes,
        categories,
        targets: numericTargets,
      });

      await logPhaseCreated(phase.name);
      onCreated(phase.id);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إنشاء المرحلة");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,.45)" }}
      dir="rtl"
    >
      <div
        className="bg-white rounded-[20px] w-full flex flex-col gap-4 overflow-y-auto"
        style={{ maxWidth: 640, maxHeight: "100%", padding: 24 }}
      >
        <div className="flex items-center justify-between">
          <h2 style={{ ...F, fontWeight: 700, fontSize: 20, color: "#2d3648" }}>
            مرحلة تجنيدية جديدة
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-[#717d96]"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>اسم المرحلة *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="مثال: دفعة أكتوبر 2026"
            className="h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 outline-none focus:border-[#00b867]"
            style={{ ...F, fontSize: 15, color: "#2d3648" }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>الفئات المتضمنة *</label>
          <div className="flex flex-wrap gap-3">
            {RECRUIT_CATEGORIES.map((c) => {
              const checked = categories.includes(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleCategory(c.key)}
                  className="h-[42px] px-4 rounded-[8px] border transition-colors flex items-center gap-2"
                  style={{
                    ...F,
                    fontSize: 14,
                    background: checked ? "#DCF4DF" : "#fff",
                    borderColor: checked ? "#00b867" : "#e2e7f0",
                    color: "#2d3648",
                    fontWeight: checked ? 700 : 400,
                  }}
                >
                  <span
                    className="w-4 h-4 rounded-[4px] border flex items-center justify-center"
                    style={{
                      borderColor: checked ? "#00b867" : "#a1aebe",
                      background: checked ? "#00b867" : "#fff",
                      color: "#fff",
                      fontSize: 11,
                      lineHeight: 1,
                    }}
                  >
                    {checked ? "✓" : ""}
                  </span>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-col gap-3">
            <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              إجمالي الدفعة (الهدف)
            </label>

            {categories.map((category) => (
              <div
                key={category}
                className="rounded-[12px] border border-[#eff0f6] p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span style={{ ...F, fontWeight: 700, fontSize: 14, color: "#2d3648" }}>
                    {categoryLabel(category)}
                  </span>
                  <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                    الإجمالي: {categoryTotal(category)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {RECRUIT_LEVELS.map((level) => (
                    <div key={level.key} className="flex flex-col gap-1">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>
                        {level.label}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={targets[cellKey(category, level.key)] ?? ""}
                        onChange={(e) => setTarget(cellKey(category, level.key), e.target.value)}
                        placeholder="0"
                        className="h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 outline-none focus:border-[#00b867] text-center"
                        style={{ ...F, fontSize: 15, color: "#2d3648" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
              إجمالي الدفعة: {grandTotal}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>ملاحظات</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="rounded-[8px] border border-[#e2e7f0] px-3 py-2 outline-none focus:border-[#00b867] resize-none"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />
        </div>

        {error && (
          <p style={{ ...F, fontSize: 13, color: "#e3282c" }}>{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 h-[46px] rounded-[8px] disabled:opacity-60"
            style={{ ...F, background: "#00b867", color: "#fff", fontWeight: 700, fontSize: 15 }}
          >
            {saving ? "جاري الإنشاء..." : "إنشاء المرحلة"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-[46px] px-6 rounded-[8px] border border-[#e2e7f0] bg-white"
            style={{ ...F, fontSize: 15, color: "#717d96" }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// الصفحة الرئيسية
// =====================================================

export function RecruitArrivalsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("recruit_arrivals:create");

  const [phases, setPhases] = useState<PhaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadPhases();
  }, []);

  async function loadPhases() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchPhaseSummaries();
      setPhases(data);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل المراحل");
    } finally {
      setLoading(false);
    }
  }

  const filteredPhases = useMemo(() => {
    const trimmed = searchText.trim();
    if (!trimmed) return phases;
    return phases.filter((p) => p.name.includes(trimmed));
  }, [phases, searchText]);

  const overall = useMemo(
    () =>
      phases
        .filter((p) => p.status !== "arrived")
        .reduce(
          (acc, p) => {
            acc.target += p.targetTotal;
            acc.arrived += p.arrivedTotal;
            return acc;
          },
          { target: 0, arrived: 0 }
        ),
    [phases]
  );

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1
          style={{
            ...F,
            fontWeight: 700,
            fontSize: "clamp(22px,4vw,32px)",
            color: "#2d3648",
          }}
        >
          تسجيل وصول المجندين
        </h1>

        {canCreate && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px]"
            style={{ background: "#00b867" }}
          >
            <Plus size={16} color="#fff" />
            <span style={{ ...F, fontSize: 13, color: "#fff", fontWeight: 700 }}>
              مرحلة جديدة
            </span>
          </button>
        )}
      </div>

      {!loading && phases.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex flex-col">
            <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#2d3648" }}>
              {phases.length}
            </span>
            <span style={{ ...F, fontSize: 12, color: "#717d96" }}>عدد المراحل</span>
          </div>
          <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex flex-col">
            <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#166534" }}>
              {overall.arrived}
            </span>
            <span style={{ ...F, fontSize: 12, color: "#717d96" }}>إجمالي الواصلين</span>
          </div>
          <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex flex-col">
            <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#92400e" }}>
              {Math.max(0, overall.target - overall.arrived)}
            </span>
            <span style={{ ...F, fontSize: 12, color: "#717d96" }}>إجمالي المتبقي</span>
          </div>
        </div>
      )}

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", ...F, fontSize: 14 }}
        >
          {error}
        </div>
      )}

      <div
        className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[42px] w-full sm:w-[260px]"
        dir="rtl"
      >
        <Search size={16} className="shrink-0 text-[#a1aebe]" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="ابحث باسم المرحلة"
          className="flex-1 bg-transparent outline-none text-right"
          style={{ ...F, fontSize: 14, color: "#2d3648" }}
          dir="rtl"
        />
      </div>

      {loading ? (
        <p style={{ ...F, fontSize: 14, color: "#717d96" }}>جاري تحميل المراحل...</p>
      ) : phases.length === 0 ? (
        <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
          لا توجد مراحل تجنيدية بعد
        </p>
      ) : filteredPhases.length === 0 ? (
        <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>لا توجد مرحلة مطابقة للبحث</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPhases.map((phase) => {
            const remaining = Math.max(0, phase.targetTotal - phase.arrivedTotal);
            const pct =
              phase.targetTotal > 0
                ? Math.min(100, Math.round((phase.arrivedTotal / phase.targetTotal) * 100))
                : 0;

            return (
              <button
                key={phase.id}
                type="button"
                onClick={() => navigate(`/dashboard/recruit-arrivals/${phase.id}`)}
                className="bg-white rounded-[16px] border border-[#eff0f6] p-5 flex flex-col gap-3 text-right hover:border-[#00b867] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#DCF4DF] flex items-center justify-center shrink-0">
                    <UserCheck size={18} color="#00522e" />
                  </div>

                  <div className="flex flex-col">
                    <span style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>
                      {phase.name}
                    </span>
                    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                      إجمالي الدفعة: {phase.targetTotal}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {phaseCategories(phase).map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: "#eef2ff", ...F, fontSize: 12, fontWeight: 700, color: "#3730a3" }}
                    >
                      {categoryLabel(c)}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-[#eff0f6]">
                  <div className="w-full h-2 rounded-full bg-[#eff0f6] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: "#00b867" }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: "#dcfce7", ...F, fontSize: 12, fontWeight: 700, color: "#166534" }}
                    >
                      {phase.arrivedTotal} وصل
                    </span>
                    {phase.status === "arrived" ? (
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ background: "#e0f2fe", ...F, fontSize: 12, fontWeight: 700, color: "#075985" }}
                      >
                        تم الوصول
                      </span>
                    ) : (
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ background: "#fef3c7", ...F, fontSize: 12, fontWeight: 700, color: "#92400e" }}
                      >
                        {remaining} متبقي
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreatePhaseModal
          onClose={() => setShowCreate(false)}
          onCreated={(phaseId) => {
            setShowCreate(false);
            navigate(`/dashboard/recruit-arrivals/${phaseId}`);
          }}
        />
      )}
    </div>
  );
}