import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Plus } from "lucide-react";

const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

// ─── Types ────────────────────────────────────────────────────────────────────
interface UnitCard {
  id: string;
  name: string;
  active: boolean;
  saryaCount: number;
  kataibCount: number;
  unitType: string;
}

// ─── Mock data (from Figma) ───────────────────────────────────────────────────
const ALL_UNITS: UnitCard[] = [
  { id: "1", name: "قيادة قوات الصاعقة",    active: true,  saryaCount: 8, kataibCount: 4, unitType: "اساسية" },
  { id: "2", name: "مع العمليات الخاصة",      active: true,  saryaCount: 8, kataibCount: 4, unitType: "اساسية" },
  { id: "3", name: "المجموعة 43 صاعقة",      active: false, saryaCount: 8, kataibCount: 4, unitType: "اساسية" },
  { id: "4", name: "المجموعة 145 صاعقة",     active: true,  saryaCount: 8, kataibCount: 4, unitType: "اساسية" },
  { id: "5", name: "المجموعة 127 صاعقة",     active: true,  saryaCount: 8, kataibCount: 4, unitType: "اساسية" },
  { id: "6", name: "فرع التنظيم والادارة",   active: true,  saryaCount: 8, kataibCount: 4, unitType: "فرعية"  },
  { id: "7", name: "كتيبة 143 صاعقة",        active: true,  saryaCount: 6, kataibCount: 3, unitType: "اساسية" },
  { id: "8", name: "كتيبة 144 صاعقة",        active: false, saryaCount: 6, kataibCount: 3, unitType: "اساسية" },
  { id: "9", name: "سرية 145 اشارة",         active: true,  saryaCount: 4, kataibCount: 2, unitType: "اداري"  },
  { id: "10",name: "سرية 145 كيميا",         active: true,  saryaCount: 4, kataibCount: 2, unitType: "اداري"  },
];

// ─── Filter tab type ──────────────────────────────────────────────────────────
type FilterType = "الكل" | "اساسي" | "اداري" | "مفعلة" | "غير مفعلة";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: `الكل (${ALL_UNITS.length})`,          value: "الكل"        },
  { label: `اساسي (${ALL_UNITS.filter(u => u.unitType === "اساسية").length})`, value: "اساسي" },
  { label: `اداري (${ALL_UNITS.filter(u => u.unitType === "اداري").length})`,  value: "اداري"  },
  { label: "مفعلة",                                value: "مفعلة"       },
  { label: "غير مفعلة",                           value: "غير مفعلة"   },
];

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-[4px]"
      style={{
        background: active ? "#ebfaea" : "#fce9ea",
        ...F, fontSize: 12, fontWeight: 700,
        color: active ? "#2ea324" : "#c5481b",
      }}
    >
      {active ? "مفعلة" : "غير مفعلة"}
    </span>
  );
}

// ─── Unit Card ────────────────────────────────────────────────────────────────
function UnitCard({ unit, onClick }: { unit: UnitCard; onClick: () => void }) {
  return (
    <div
      className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      dir="rtl"
    >
      {/* Header row */}
      <div className="flex items-center gap-2 justify-end">
        <div className="flex-1 text-right" style={{ ...F, fontSize: 17, fontWeight: 700, color: "#2d3648" }}>
          {unit.name}
        </div>
        <StatusBadge active={unit.active} />
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-[#eff0f6]" />

      {/* Stats row */}
      <div className="flex items-center gap-0 divide-x divide-x-reverse divide-[#eff0f6]">
        {/* عدد السريا */}
        <div className="flex flex-col items-end gap-1 px-4 flex-1 first:pr-0">
          <span style={{ ...F, fontSize: 12, color: "#717d96" }}>عدد السريا</span>
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>{unit.saryaCount}</span>
          <span style={{ ...F, fontSize: 12, color: "#717d96" }}>سرايا</span>
        </div>

        {/* عدد الكتائب */}
        <div className="flex flex-col items-end gap-1 px-4 flex-1">
          <span style={{ ...F, fontSize: 12, color: "#717d96" }}>عدد الكتائب</span>
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>{unit.kataibCount}</span>
        </div>

        {/* نوع الوحده */}
        <div className="flex flex-col items-end gap-1 px-4 flex-1 last:pl-0">
          <span style={{ ...F, fontSize: 12, color: "#717d96" }}>نوع الوحده</span>
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>{unit.unitType}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ManageUnitsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>("الكل");
  const [search, setSearch] = useState("");

  const filtered = ALL_UNITS.filter((u) => {
    const matchSearch = search === "" || u.name.includes(search);
    const matchFilter =
      activeFilter === "الكل"      ? true :
      activeFilter === "اساسي"     ? u.unitType === "اساسية" :
      activeFilter === "اداري"     ? u.unitType === "اداري" :
      activeFilter === "مفعلة"     ? u.active :
      activeFilter === "غير مفعلة" ? !u.active : true;
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex flex-col gap-5 w-full pb-10" dir="rtl">

      {/* Title */}
      <h1
        className="text-center"
        style={{ ...F, fontWeight: 700, fontSize: "clamp(22px,4vw,32px)", color: "#2d3648", lineHeight: 1.5 }}
      >
        ادارة الوحدات
      </h1>

      {/* Top action row */}
      <div className="flex flex-wrap items-end gap-3 justify-between w-full">
        {/* Filters block (right side in RTL) */}
        <div className="flex flex-col gap-2 items-end flex-1">
          <p style={{ ...F, fontSize: 18, fontWeight: 700, color: "#2d3648" }}>تصنيف وعرض الوحدات</p>

          {/* Filter groups */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status sub-group (مفعلة / غير مفعلة / الكل) */}
            <div className="flex items-center rounded-[8px] overflow-hidden border border-[#eff0f6]">
              {["غير مفعلة", "مفعلة", "الكل"].map((label, i, arr) => {
                const val = label as FilterType;
                const isActive = activeFilter === val;
                const isLast = i === arr.length - 1;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveFilter(val)}
                    className="h-[46px] px-4 flex items-center justify-center transition-all"
                    style={{
                      ...F, fontSize: 16,
                      color: isActive ? "#f5f5f5" : "#2d3648",
                      background: isActive
                        ? "linear-gradient(to bottom, #00b867, #00522e)"
                        : "#fff",
                      borderRight: !isLast ? "1px solid #eff0f6" : "none",
                      minWidth: 90,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Size sub-group (الكل (120) / اساسي (32) / اداري (88)) */}
            <div className="flex items-center rounded-[8px] overflow-hidden border border-[#eff0f6]">
              {(["اداري", "اساسي", "الكل"] as FilterType[]).map((val, i, arr) => {
                const labelMap: Record<FilterType, string> = {
                  "الكل": `الكل (${ALL_UNITS.length})`,
                  "اساسي": `اساسي (${ALL_UNITS.filter(u => u.unitType === "اساسية").length})`,
                  "اداري": `اداري (${ALL_UNITS.filter(u => u.unitType === "اداري").length})`,
                  "مفعلة": "مفعلة",
                  "غير مفعلة": "غير مفعلة",
                };
                const isActive = activeFilter === val;
                const isLast = i === arr.length - 1;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setActiveFilter(val)}
                    className="h-[46px] px-4 flex items-center justify-center transition-all"
                    style={{
                      ...F, fontSize: 16,
                      color: isActive ? "#f5f5f5" : "#2d3648",
                      background: isActive
                        ? "linear-gradient(to bottom, #00b867, #00522e)"
                        : "#fff",
                      borderRight: !isLast ? "1px solid #eff0f6" : "none",
                      minWidth: 110,
                    }}
                  >
                    {labelMap[val]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Add button */}
        <button
          type="button"
          className="h-[54px] px-5 rounded-[8px] flex items-center gap-2 transition-opacity hover:opacity-90 shrink-0"
          style={{ background: "linear-gradient(to bottom, #00b867, #00522e)", ...F, fontSize: 16, color: "#f5f5f5" }}
        >
          <Plus size={20} style={{ color: "#f5f5f5" }} />
          اضافة وحده جديدة
        </button>
      </div>

      {/* Search */}
      <div className="w-full">
        <label style={{ ...F, fontSize: 15, color: "#2d3648", fontWeight: 700, display: "block", marginBottom: 6 }}>
          ابحث عن وحدة
        </label>
        <div className="relative w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="اسم الوحده"
            className="w-full h-[54px] bg-white border border-[#e2e7f0] rounded-[8px] px-4 pr-4 pl-10 outline-none focus:border-[#00b867] transition-colors text-right"
            style={{ ...F, fontSize: 17, color: "#2d3648" }}
            dir="rtl"
          />
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2d3648] pointer-events-none" />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="w-full text-center py-12" style={{ ...F, fontSize: 16, color: "#a1aebe" }}>
          لا توجد وحدات مطابقة للبحث
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onClick={() => navigate(`/dashboard/manage-units/${unit.id}/tree`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
