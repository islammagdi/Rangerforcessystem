import { useState, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";

// ─── Shared style ─────────────────────────────────────────────────────────────
const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
type UnitType = "اساسي" | "اداري";
type BarColor = "red" | "orange" | "green";

interface Unit {
  id: number;
  type: UnitType;
  name: string;
  soldiers: number;
  ncos: number;
  strength: string;
  khawarijPct: number;
  khawarijCount: number;
}

const UNITS: Unit[] = [
  {
    id: 1,
    type: "اساسي",
    name: "سـ 145 اشارة",
    soldiers: 20,
    ncos: 15,
    strength: "35 فرد",
    khawarijPct: 88,
    khawarijCount: 12,
  },
  {
    id: 2,
    type: "اساسي",
    name: "كـ 113 صع",
    soldiers: 70,
    ncos: 70,
    strength: "140 فرد",
    khawarijPct: 50,
    khawarijCount: 12,
  },
  {
    id: 3,
    type: "اساسي",
    name: "قيا مج العمليات الخاصة",
    soldiers: 20,
    ncos: 10,
    strength: "35 فرد",
    khawarijPct: 10,
    khawarijCount: 12,
  },
  {
    id: 4,
    type: "اداري",
    name: "فرع التنظيم والادارة",
    soldiers: 20,
    ncos: 10,
    strength: "35 فرد",
    khawarijPct: 30,
    khawarijCount: 8,
  },
  {
    id: 5,
    type: "اداري",
    name: "فرع الاستخبارات",
    soldiers: 20,
    ncos: 10,
    strength: "35 فرد",
    khawarijPct: 22,
    khawarijCount: 6,
  },
  {
    id: 6,
    type: "اداري",
    name: "فرع العمليات والتدريب",
    soldiers: 20,
    ncos: 10,
    strength: "35 فرد",
    khawarijPct: 45,
    khawarijCount: 10,
  },
  {
    id: 7,
    type: "اساسي",
    name: "كـ 221 مشاة",
    soldiers: 50,
    ncos: 30,
    strength: "90 فرد",
    khawarijPct: 65,
    khawarijCount: 18,
  },
  {
    id: 8,
    type: "اساسي",
    name: "كـ 303 مدرعات",
    soldiers: 60,
    ncos: 25,
    strength: "95 فرد",
    khawarijPct: 40,
    khawarijCount: 14,
  },
  {
    id: 9,
    type: "اداري",
    name: "فرع الامداد والتموين",
    soldiers: 18,
    ncos: 8,
    strength: "30 فرد",
    khawarijPct: 18,
    khawarijCount: 5,
  },
];

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

// ─── Unit Card ────────────────────────────────────────────────────────────────
function UnitCard({ unit }: { unit: Unit }) {
  const navigate = useNavigate();
  const badge = unitBadgeStyle(unit.type);
  const color = barColor(unit.khawarijPct);
  const bg = barBg(color);

  return (
    <article
      className="bg-white rounded-[12px] border border-[#e2e7f0] flex flex-col gap-4 p-4 cursor-pointer hover:shadow-md hover:border-[#294dbb] transition-all duration-200"
      dir="rtl"
      onClick={() =>
        navigate(`/dashboard/units-report/${unit.id}`)
      }
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        e.key === "Enter" &&
        navigate(`/dashboard/units-report/${unit.id}`)
      }
    >
      {/* ── Header: badge + name ─────────────────────────── */}
      <div className="flex items-center gap-4 w-full">
        {/* Name — blurred for sensitivity */}
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
        {/* Badge */}
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
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 16,
              color: "#2d3648",
            }}
            dir="auto"
          >
            {unit.strength}
          </span>
        </div>
        <div className="flex-1 h-px mx-2 bg-[#bed0ff]" />
        {/* جنود */}
        <div className="flex flex-col gap-1 items-start">
          <span
            style={{ ...F, fontSize: 12, color: "#717d96" }}
          >
            جنود
          </span>
          <span
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 16,
              color: "#2d3648",
            }}
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
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 16,
              color: "#2d3648",
            }}
          >
            {unit.ncos}
          </span>
        </div>
      </div>

      {/* ── Progress bar section ──────────────────────────── */}
      <div className="flex flex-col gap-2 w-full">
        {/* label row */}
        <div className="flex items-center justify-between w-full">
          <span
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          >
            {unit.khawarijPct}%
          </span>
          <div className="flex items-center gap-1">
                        <span
              style={{ ...F, fontSize: 14, color: "#a0abc0" }}
            >
              نسبة الخوارج
            </span>
            <span
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              ({unit.khawarijCount})
            </span>

          </div>
        </div>

        {/* bar track */}
        <div className="w-full h-[6px] rounded-full bg-[#ebedfd] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${unit.khawarijPct}%`,
              background: bg,
            }}
          />
        </div>
      </div>
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
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
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

const FILTER_TABS: {
  key: FilterType;
  label: string;
  count: number;
}[] = [
  { key: "الكل", label: "الكل", count: 120 },
  { key: "اساسي", label: "اساسي", count: 32 },
  { key: "اداري", label: "اداري", count: 88 },
];

export function UnitsReportPage() {
  const [filter, setFilter] = useState<FilterType>("الكل");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("القوة الاكبر");

  const visible = useMemo(() => {
    let list = UNITS;

    // type filter
    if (filter !== "الكل") {
      list = list.filter((u) => u.type === filter);
    }

    // search
    if (search.trim()) {
      list = list.filter((u) => u.name.includes(search.trim()));
    }

    // sort
    if (sortBy === "القوة الاكبر")
      list = [...list].sort(
        (a, b) => parseInt(b.strength) - parseInt(a.strength),
      );
    if (sortBy === "القوة الاصغر")
      list = [...list].sort(
        (a, b) => parseInt(a.strength) - parseInt(b.strength),
      );
    if (sortBy === "نسبة الخوارج الأعلى")
      list = [...list].sort(
        (a, b) => b.khawarijPct - a.khawarijPct,
      );
    if (sortBy === "نسبة الخوارج الأدنى")
      list = [...list].sort(
        (a, b) => a.khawarijPct - b.khawarijPct,
      );

    return list;
  }, [filter, search, sortBy]);

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
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 24,
            color: "#2d3648",
          }}
        >
          إحصائيات الوحدات الرئيسية
        </h2>

        <div className="flex flex-wrap gap-4 w-full">
          {[
            { label: "عدد الوحدات الرئيسية", value: "32" },
            { label: "إجمالي القوة", value: "15,000" },
            {
              label: "إجمالي الخوارج من القوة",
              value: "7,000",
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
              style={{
                ...F,
                fontWeight: 700,
                fontSize: 16,
                color: "#2d3648",
              }}
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
              style={{
                ...F,
                fontWeight: 700,
                fontSize: 16,
                color: "#2d3648",
              }}
            >
              تصنيف وعرض الوحدات
            </label>
            <div className="flex items-center overflow-hidden rounded-[12px] border border-[#eff0f6]">
              {/* الكل — rightmost in RTL */}
              <button
                type="button"
                onClick={() => setFilter("الكل")}
                className={[
                  "px-4 py-3 w-[155px] text-center transition-colors",
                  filter === "الكل"
                    ? "text-white"
                    : "bg-white text-[#2d3648] hover:bg-[#f5f6fb]",
                ].join(" ")}
                style={{
                  ...F,
                  fontSize: 18,
                  background:
                    filter === "الكل"
                      ? "linear-gradient(to bottom, #00b867, #00522e)"
                      : undefined,
                }}
              >
                الكل (120)
              </button>
              {/* اداري — left (in RTL = leftmost visually on right) */}
              <button
                type="button"
                onClick={() => setFilter("اداري")}
                className={[
                  "px-4 py-3 w-[155px] text-center transition-colors border-l border-[#eff0f6]",
                  filter === "اداري"
                    ? "text-white"
                    : "bg-white text-[#2d3648] hover:bg-[#f5f6fb]",
                ].join(" ")}
                style={{
                  ...F,
                  fontSize: 18,
                  background:
                    filter === "اداري"
                      ? "linear-gradient(to bottom, #00b867, #00522e)"
                      : undefined,
                }}
              >
                اداري (88)
              </button>

              {/* اساسي */}
              <button
                type="button"
                onClick={() => setFilter("اساسي")}
                className={[
                  "px-4 py-3 w-[155px] text-center transition-colors border-l border-[#eff0f6]",
                  filter === "اساسي"
                    ? "text-white"
                    : "bg-white text-[#2d3648] hover:bg-[#f5f6fb]",
                ].join(" ")}
                style={{
                  ...F,
                  fontSize: 18,
                  background:
                    filter === "اساسي"
                      ? "linear-gradient(to bottom, #00b867, #00522e)"
                      : undefined,
                }}
              >
                اساسي (32)
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1.5 w-full">
          <label
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 16,
              color: "#2d3648",
            }}
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
          <div
            className="text-center py-16 text-[#717d96]"
            style={F}
          >
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