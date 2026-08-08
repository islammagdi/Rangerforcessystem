import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

// ─── Shared style ─────────────────────────────────────────────────────────────
const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ============================================================
// Database rows
// ============================================================

interface DbUnit {
  id: string;
  name: string;
  code: string | null;
  unit_type: string | null;
  parent_unit_id: string | null;
  is_active: boolean;
}

interface DbPersonnelRow {
  id: string;
  primary_unit_id: string | null;
  attachment_unit_id: string | null;
  rank_id: string | null;
  service_status_id: string | null;
  is_active: boolean;
}

interface DbRank {
  id: string;
  name: string;
  code: string | null;
}

interface DbServiceStatus {
  id: string;
  name: string;
  code: string | null;
}

// ============================================================
// View types
// ============================================================

type UnitType = "اساسي" | "اداري";
type BarColor = "red" | "orange" | "green";

interface UnitView {
  id: string;
  type: UnitType;
  name: string;
  soldiers: number;
  ncos: number;
  strengthCount: number;
  // الخوارج مفهوم خاص بالوحدات الأساسية فقط — الوحدة الإدارية ليس لها خوارج
  showKhawarij: boolean;
  khawarijPct: number;
  khawarijCount: number;
}

const SORT_OPTIONS = [
  "القوة الاكبر",
  "القوة الاصغر",
  "نسبة الخوارج الأعلى",
  "نسبة الخوارج الأدنى",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function barColor(pct: number): BarColor {
  if (pct >= 70) return "red";
  if (pct >= 40) return "orange";
  return "green";
}

function barBg(color: BarColor) {
  if (color === "red") return "#e3282c";
  if (color === "orange") return "#e37032";
  return "linear-gradient(to bottom, #00b867, #00522e)";
}

function unitBadgeStyle(type: UnitType) {
  if (type === "اساسي")
    return {
      bg: "#ebedfd",
      text: "#1f3d97",
      label: "وحدة اساسية",
    };
  return {
    bg: "#e9f9ff",
    text: "#1e93a7",
    label: "وحدة ادارية",
  };
}

function isMainUnitType(unitType: string | null): boolean {
  return unitType?.trim().toUpperCase() === "MAIN";
}

function isManageUnitType(unitType: string | null): boolean {
  return unitType?.trim().toUpperCase() === "MANAGE";
}

function isSoldierRankId(
  rankId: string | null,
  soldierRankIds: Set<string>
): boolean {
  return !!rankId && soldierRankIds.has(rankId);
}

function isAttachedStatusId(
  statusId: string | null,
  attachedStatusIds: Set<string>
): boolean {
  return !!statusId && attachedStatusIds.has(statusId);
}

// ─── Unit Card ────────────────────────────────────────────────────────────────
function UnitCard({ unit }: { unit: UnitView }) {
  const navigate = useNavigate();
  const badge = unitBadgeStyle(unit.type);
  const color = barColor(unit.khawarijPct);
  const bg = barBg(color);

  return (
    <article
      className="bg-white rounded-[12px] border border-[#e2e7f0] flex flex-col gap-4 p-4 cursor-pointer hover:shadow-md hover:border-[#294dbb] transition-all duration-200"
      dir="rtl"
      onClick={() => navigate(`/dashboard/units-report/${unit.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        e.key === "Enter" &&
        navigate(`/dashboard/units-report/${unit.id}`)
      }
    >
      {/* ── Header: badge + name ─────────────────────────── */}
      <div className="flex items-center gap-4 w-full">
        <span
          className="flex-1 min-w-0 text-right select-none"
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 18,
            color: "#2d3648",
            lineHeight: 1.5,
          }}
          dir="auto"
        >
          {unit.name}
        </span>
        <span
          className="shrink-0 rounded-[4px] px-1.5 py-0.5 h-6 flex items-center"
          style={{ background: badge.bg }}
        >
          <span
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 12,
              color: badge.text,
              whiteSpace: "nowrap",
            }}
          >
            {badge.label}
          </span>
        </span>
      </div>

      {/* ── Stats row ────────────────────────────────────── */}
      <div className="flex items-center justify-between w-full">
        {/* قوة الوحدة */}
        <div className="flex flex-col gap-1 items-start">
          <span
            style={{
              ...F,
              fontSize: 12,
              color: "#717d96",
              whiteSpace: "nowrap",
            }}
          >
            قوة الوحدة
          </span>
          <span
            style={{ ...F, fontWeight: 700, fontSize: 16, color: "#2d3648" }}
            dir="auto"
          >
            {unit.strengthCount} فرد
          </span>
        </div>
        <div className="flex-1 h-px mx-2 bg-[#bed0ff]" />
        {/* جنود */}
        <div className="flex flex-col gap-1 items-start">
          <span style={{ ...F, fontSize: 12, color: "#717d96" }}>جنود</span>
          <span
            style={{ ...F, fontWeight: 700, fontSize: 16, color: "#2d3648" }}
          >
            {unit.soldiers}
          </span>
        </div>

        <div className="flex-1 h-px mx-2 bg-[#bed0ff]" />

        {/* ضباط صف */}
        <div className="flex flex-col gap-1 items-start">
          <span
            style={{
              ...F,
              fontSize: 12,
              color: "#717d96",
              whiteSpace: "nowrap",
            }}
          >
            ضباط صف
          </span>
          <span
            style={{ ...F, fontWeight: 700, fontSize: 16, color: "#2d3648" }}
          >
            {unit.ncos}
          </span>
        </div>
      </div>

      {/* ── Progress bar section (الوحدات الأساسية فقط) ──────── */}
      {unit.showKhawarij && (
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between w-full">
            <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              {unit.khawarijPct}%
            </span>
            <div className="flex items-center gap-1">
              <span style={{ ...F, fontSize: 14, color: "#a0abc0" }}>
                نسبة الخوارج
              </span>
              <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                ({unit.khawarijCount})
              </span>
            </div>
          </div>

          <div className="w-full h-[6px] rounded-full bg-[#ebedfd] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${unit.khawarijPct}%`, background: bg }}
            />
          </div>
        </div>
      )}
    </article>
  );
}

// ─── Sort Dropdown ────────────────────────────────────────────────────────────
function SortDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full" dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full bg-white border border-[#e2e7f0] rounded-[8px] px-3 py-3 flex items-center gap-3 hover:border-[#294dbb] transition-colors"
      >
        <ChevronDown
          size={20}
          className="shrink-0 text-[#2d3648] transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
        <span
          className="flex-1 text-right"
          style={{ ...F, fontSize: 18, color: "#4a5468" }}
        >
          {value}
        </span>
      </button>

      {open && (
        <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg z-20 overflow-hidden">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={[
                "w-full px-3 py-2.5 text-right hover:bg-[#f5f6fb] transition-colors",
                opt === value ? "bg-[#ebedfd]" : "",
              ].join(" ")}
              style={{
                ...F,
                fontSize: 16,
                color: opt === value ? "#1f3d97" : "#4a5468",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type FilterType = "الكل" | "اساسي" | "اداري";

export function UnitsReportPage() {
  const [filter, setFilter] = useState<FilterType>("الكل");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("القوة الاكبر");

  const [units, setUnits] = useState<DbUnit[]>([]);
  const [personnel, setPersonnel] = useState<DbPersonnelRow[]>([]);
  const [ranks, setRanks] = useState<DbRank[]>([]);
  const [serviceStatuses, setServiceStatuses] = useState<DbServiceStatus[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  async function loadReportData() {
    try {
      setLoading(true);

      const [unitsResult, personnelResult, ranksResult, statusesResult] =
        await Promise.all([
          supabase
            .from("units")
            .select("id,name,code,unit_type,parent_unit_id,is_active")
            .eq("is_active", true)
            .order("name", { ascending: true }),

          // ⚠️ نعتبر "القوة" هي الأفراد النشطين فقط (is_active = true)
          // لو المطلوب حساب كل الأفراد بدون استثناء، امسح شرط .eq("is_active", true) هنا
          supabase
            .from("personnel")
            .select(
              "id,primary_unit_id,attachment_unit_id,rank_id,service_status_id,is_active"
            )
            .eq("is_active", true),

          supabase.from("ranks").select("id,name,code"),

          supabase.from("service_statuses").select("id,name,code"),
        ]);

      if (unitsResult.error) throw unitsResult.error;
      if (personnelResult.error) throw personnelResult.error;
      if (ranksResult.error) throw ranksResult.error;
      if (statusesResult.error) throw statusesResult.error;

      setUnits(unitsResult.data ?? []);
      setPersonnel(personnelResult.data ?? []);
      setRanks(ranksResult.data ?? []);
      setServiceStatuses(statusesResult.data ?? []);
    } catch (error: any) {
      console.error("Error loading units report data:", error);

      alert(
        `حدث خطأ أثناء تحميل بيانات الوحدات من قاعدة البيانات${
          error?.message ? `\n\nتفاصيل الخطأ: ${error.message}` : ""
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  // ---- مجموعات مساعدة للمطابقة (رتبة "جندي" / موقف "ملحق علي القوة") ----

  const soldierRankIds = useMemo(() => {
    const set = new Set<string>();

    ranks.forEach((r) => {
      const name = r.name?.trim();
      const code = r.code?.trim().toUpperCase();

      if (name === "جندي" || code === "SOLDIER") {
        set.add(r.id);
      }
    });

    return set;
  }, [ranks]);

  const attachedStatusIds = useMemo(() => {
    const set = new Set<string>();

    serviceStatuses.forEach((s) => {
      const name = s.name?.trim();
      const code = s.code?.trim().toUpperCase();

      if (code === "ATTACHED" || name === "ملحق علي القوة") {
        set.add(s.id);
      }
    });

    return set;
  }, [serviceStatuses]);

  // ---- إحصائيات الوحدات الرئيسية (أعلى الصفحة) ----

  const mainUnitsCount = useMemo(
    () => units.filter((u) => isMainUnitType(u.unit_type)).length,
    [units]
  );

  const manageUnitsCount = useMemo(
    () => units.filter((u) => isManageUnitType(u.unit_type)).length,
    [units]
  );

  const totalStrength = personnel.length;

  const totalKhawarij = useMemo(
    () =>
      personnel.filter((p) =>
        isAttachedStatusId(p.service_status_id, attachedStatusIds)
      ).length,
    [personnel, attachedStatusIds]
  );

  // ---- بناء كارت كل وحدة ----

  const unitViews = useMemo<UnitView[]>(() => {
    return units
      .filter((u) => isMainUnitType(u.unit_type) || isManageUnitType(u.unit_type))
      .map((u) => {
        const isMain = isMainUnitType(u.unit_type);

        // قوة الوحدة الأساسية = الأفراد اللي وحدتهم الأساسية هي دي
        // قوة الوحدة الإدارية = الأفراد اللي مكان إلحاقهم هو دي
        const unitPersonnel = isMain
          ? personnel.filter((p) => p.primary_unit_id === u.id)
          : personnel.filter((p) => p.attachment_unit_id === u.id);

        const strengthCount = unitPersonnel.length;

        const soldiers = unitPersonnel.filter((p) =>
          isSoldierRankId(p.rank_id, soldierRankIds)
        ).length;

        const ncos = strengthCount - soldiers;

        // الخوارج مفهوم خاص بالوحدة الأساسية فقط: فرد له مكان إلحاق رغم
        // إن وحدته الأساسية هي دي. الوحدة الإدارية ليس لها خوارج.
       const khawarijCount = isMain
  ? unitPersonnel.filter(
      (p) =>
        isAttachedStatusId(p.service_status_id, attachedStatusIds) &&
        !!p.attachment_unit_id
    ).length
  : 0;

        const khawarijPct =
          isMain && strengthCount > 0
            ? Math.round((khawarijCount / strengthCount) * 100)
            : 0;

        return {
          id: u.id,
          type: isMain ? "اساسي" : "اداري",
          name: u.name,
          soldiers,
          ncos,
          strengthCount,
          showKhawarij: isMain,
          khawarijPct,
          khawarijCount,
        };
      });
  }, [units, personnel, soldierRankIds]);

  const visible = useMemo(() => {
    let list = unitViews;

    if (filter !== "الكل") {
      list = list.filter((u) => u.type === filter);
    }

    if (search.trim()) {
      list = list.filter((u) => u.name.includes(search.trim()));
    }

    if (sortBy === "القوة الاكبر") {
      list = [...list].sort((a, b) => b.strengthCount - a.strengthCount);
    }

    if (sortBy === "القوة الاصغر") {
      list = [...list].sort((a, b) => a.strengthCount - b.strengthCount);
    }

    if (sortBy === "نسبة الخوارج الأعلى") {
      list = [...list].sort((a, b) => b.khawarijPct - a.khawarijPct);
    }

    if (sortBy === "نسبة الخوارج الأدنى") {
      list = [...list].sort((a, b) => a.khawarijPct - b.khawarijPct);
    }

    return list;
  }, [unitViews, filter, search, sortBy]);

  const FILTER_TABS: { key: FilterType; label: string; count: number }[] = [
    { key: "الكل", label: "الكل", count: unitViews.length },
    { key: "اساسي", label: "اساسي", count: mainUnitsCount },
    { key: "اداري", label: "اداري", count: manageUnitsCount },
  ];

  if (loading) {
    return (
      <div dir="rtl" className="w-full flex items-center justify-center py-20">
        <p style={{ ...F, fontSize: 18, color: "#415844" }}>
          جاري تحميل البيانات...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      {/* ── Page title ────────────────────────────────────────── */}
      <h1
        className="text-center w-full"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(22px, 3.5vw, 32px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        الموقف العام للوحدات
      </h1>

      {/* ── Stats section ─────────────────────────────────────── */}
      <section className="flex flex-col gap-3 w-full">
        <h2
          className="text-right"
          style={{ ...F, fontWeight: 700, fontSize: 24, color: "#2d3648" }}
        >
          إحصائيات الوحدات الرئيسية
        </h2>

        <div className="flex flex-wrap gap-4 w-full">
          {[
            {
              label: "عدد الوحدات الرئيسية",
              value: mainUnitsCount.toLocaleString("ar-EG"),
            },
            {
              label: "إجمالي القوة",
              value: totalStrength.toLocaleString("ar-EG"),
            },
            {
              label: "إجمالي الخوارج من القوة",
              value: totalKhawarij.toLocaleString("ar-EG"),
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1 min-w-[140px] bg-white rounded-[20px] border border-[#eff0f6] px-6 py-3 flex flex-col items-start gap-2"
            >
              <span
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 24,
                  color: "#2d3648",
                  lineHeight: 1.5,
                }}
              >
                {s.value}
              </span>
              <span
                style={{
                  ...F,
                  fontSize: 14,
                  color: "#717d96",
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Controls ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-4 w-full">
        {/* Top row: category tabs + sort */}
        <div className="flex flex-wrap items-start gap-6 justify-start w-full">
          {/* Sort */}
          <div className="flex flex-col gap-1.5 w-[200px] min-w-[160px]">
            <label
              style={{ ...F, fontWeight: 700, fontSize: 16, color: "#2d3648" }}
            >
              ترتيب العرض حسب
            </label>
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>

          {/* Vertical divider */}
          <div className="hidden sm:block w-px self-stretch bg-[#cbd2e0]" />

          {/* Category tabs */}
          <div className="flex flex-col gap-1.5">
            <label
              style={{ ...F, fontWeight: 700, fontSize: 16, color: "#2d3648" }}
            >
              تصنيف وعرض الوحدات
            </label>
            <div className="flex items-center overflow-hidden rounded-[12px] border border-[#eff0f6]">
              {FILTER_TABS.filter((t) => t.key === "الكل").map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilter(t.key)}
                  className={[
                    "px-4 py-3 w-[155px] text-center transition-colors",
                    filter === t.key
                      ? "text-white"
                      : "bg-white text-[#2d3648] hover:bg-[#f5f6fb]",
                  ].join(" ")}
                  style={{
                    ...F,
                    fontSize: 18,
                    background:
                      filter === t.key
                        ? "linear-gradient(to bottom, #00b867, #00522e)"
                        : undefined,
                  }}
                >
                  {t.label} ({t.count})
                </button>
              ))}

              {FILTER_TABS.filter((t) => t.key === "اداري").map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilter(t.key)}
                  className={[
                    "px-4 py-3 w-[155px] text-center transition-colors border-l border-[#eff0f6]",
                    filter === t.key
                      ? "text-white"
                      : "bg-white text-[#2d3648] hover:bg-[#f5f6fb]",
                  ].join(" ")}
                  style={{
                    ...F,
                    fontSize: 18,
                    background:
                      filter === t.key
                        ? "linear-gradient(to bottom, #00b867, #00522e)"
                        : undefined,
                  }}
                >
                  {t.label} ({t.count})
                </button>
              ))}

              {FILTER_TABS.filter((t) => t.key === "اساسي").map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilter(t.key)}
                  className={[
                    "px-4 py-3 w-[155px] text-center transition-colors border-l border-[#eff0f6]",
                    filter === t.key
                      ? "text-white"
                      : "bg-white text-[#2d3648] hover:bg-[#f5f6fb]",
                  ].join(" ")}
                  style={{
                    ...F,
                    fontSize: 18,
                    background:
                      filter === t.key
                        ? "linear-gradient(to bottom, #00b867, #00522e)"
                        : undefined,
                  }}
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1.5 w-full">
          <label
            style={{ ...F, fontWeight: 700, fontSize: 16, color: "#2d3648" }}
          >
            ابحث عن وحدة
          </label>
          <div className="relative w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="اسم الوحده"
              dir="rtl"
              className="w-full bg-white border border-[#e2e7f0] rounded-[8px] px-4 py-3 pr-12 text-right focus:outline-none focus:border-[#294dbb] transition-colors placeholder:text-[#4a5468]"
              style={{ ...F, fontSize: 18, color: "#2d3648" }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2d3648] pointer-events-none">
              <Search size={22} />
            </span>
          </div>
        </div>
      </section>

      {/* ── Units grid ────────────────────────────────────────── */}
      <section className="w-full">
        {visible.length === 0 ? (
          <div className="text-center py-16 text-[#717d96]" style={F}>
            لا توجد وحدات مطابقة للبحث
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {visible.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
