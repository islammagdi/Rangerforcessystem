import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Printer,
  Eye,
  ArrowDownUp,
  ArrowDown,
} from "lucide-react";
import svgPaths from "../../imports/بيانالوحداتالموقفالعامبيانوحده-1/svg-bswzreobyg";
import { supabase } from "../../lib/supabase";

// ─── Shared style ─────────────────────────────────────────────────────────────
const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};
const GRAD_ID = "statGrad";

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
  military_number: string;
  full_name: string;
  rank_id: string | null;
  personnel_category_id: string | null;
  service_status_id: string | null;
  primary_unit_id: string | null;
  attachment_unit_id: string | null;
  is_active: boolean;
}

interface DbRank {
  id: string;
  name: string;
  code: string | null;
}

interface DbPersonnelCategory {
  id: string;
  name: string;
  code: string | null;
}

interface DbServiceStatus {
  id: string;
  name: string;
  code: string | null;
}

// ─── Gradient green icon def ──────────────────────────────────────────────────
function GradDefs() {
  return (
    <defs>
      <linearGradient
        id={GRAD_ID}
        x1="0"
        y1="0"
        x2="0"
        y2="1"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#00B867" />
        <stop offset="1" stopColor="#00522E" />
      </linearGradient>
    </defs>
  );
}

// ─── Stat card icons ──────────────────────────────────────────────────────────
function IconKhawarij() {
  return (
    <svg width="24" height="24" viewBox="0 0 18.75 18.75" fill="none">
      <GradDefs />
      <path
        clipRule="evenodd"
        d={svgPaths.p8cec1f0}
        fill={`url(#${GRAD_ID})`}
        fillRule="evenodd"
      />
    </svg>
  );
}

function IconSoldiers() {
  return (
    <svg width="24" height="30" viewBox="0 0 25.9877 30" fill="none">
      <defs>
        <linearGradient
          id="soldierGrad1"
          x1="12.9938"
          x2="12.9938"
          y1="0"
          y2="24.9314"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
        <linearGradient
          id="soldierGrad2"
          x1="10.5369"
          x2="10.5369"
          y1="14.655"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
      </defs>
      <path
        clipRule="evenodd"
        d={svgPaths.p1528f680}
        fill="url(#soldierGrad1)"
        fillRule="evenodd"
      />
      <path
        clipRule="evenodd"
        d={svgPaths.p1681e00}
        fill="url(#soldierGrad2)"
        fillRule="evenodd"
      />
    </svg>
  );
}

function IconNCO() {
  return (
    <svg width="24" height="24" viewBox="0 0 19.62 23.1075" fill="none">
      <defs>
        <linearGradient
          id="ncoGrad1"
          x1="9.81"
          x2="9.81"
          y1="6.21"
          y2="16.0275"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
        <linearGradient
          id="ncoGrad2"
          x1="9.81"
          x2="9.81"
          y1="0"
          y2="23.1075"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
      </defs>
      <path d={svgPaths.p8118600} fill="url(#ncoGrad1)" />
      <path d={svgPaths.p14328e00} fill="url(#ncoGrad2)" />
    </svg>
  );
}

function IconGroup() {
  return (
    <svg width="30" height="22.5" viewBox="0 0 30 22.5" fill="none">
      <defs>
        <linearGradient
          id="grp0"
          x1="5"
          x2="5"
          y1="0"
          y2="7.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
        <linearGradient
          id="grp1"
          x1="4.55625"
          x2="4.55625"
          y1="8.75"
          y2="17.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
        <linearGradient
          id="grp2"
          x1="25"
          x2="25"
          y1="0"
          y2="7.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
        <linearGradient
          id="grp3"
          x1="25.4437"
          x2="25.4437"
          y1="8.75"
          y2="17.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
        <linearGradient
          id="grp4"
          x1="15"
          x2="15"
          y1="0"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
        <linearGradient
          id="grp5"
          x1="15"
          x2="15"
          y1="11.25"
          y2="22.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
      </defs>
      <path d={svgPaths.p24391d00} fill="url(#grp0)" />
      <path d={svgPaths.p2f932980} fill="url(#grp1)" />
      <path d={svgPaths.p3a06cf00} fill="url(#grp2)" />
      <path d={svgPaths.p23b55080} fill="url(#grp3)" />
      <path d={svgPaths.p4eff300} fill="url(#grp4)" />
      <path d={svgPaths.p32f2a500} fill="url(#grp5)" />
    </svg>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
// ألوان عامة حسب طبيعة الحالة (مش أسماء ثابتة) عشان تتماشى مع أي أسماء حالات فعلية في القاعدة
function getStatusBadgeStyle(status: DbServiceStatus | undefined) {
  const code = status?.code?.toUpperCase() ?? "";
  const name = status?.name ?? "";

  if (code === "ATTACHED" || name === "ملحق علي القوة") {
    return { bg: "#e9f9ff", dot: "#29BBD4", text: "#146d7c" };
  }

  if (code === "LEAVE" || name.includes("اجاز")) {
    return { bg: "#fff7f0", dot: "#e37032", text: "#9a4a10" };
  }

  // افتراضي: "على القوة" أو أي حالة أخرى
  return { bg: "#ebfaea", dot: "#35C128", text: "#26861d" };
}

function StatusBadge({ status }: { status: DbServiceStatus | undefined }) {
  const s = getStatusBadgeStyle(status);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[16px] pl-1.5 pr-2 py-0.5"
      style={{ background: s.bg }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: s.dot }}
      />
      <span
        style={{
          ...F,
          fontWeight: 700,
          fontSize: 12,
          color: s.text,
          whiteSpace: "nowrap",
        }}
      >
        {status?.name ?? "—"}
      </span>
    </span>
  );
}

// ─── Action buttons ───────────────────────────────────────────────────────────
function ActionBtns({ onView }: { onView: () => void }) {
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <button
        type="button"
        className="bg-[#DCF4DF] rounded-[4px] p-[2px] hover:opacity-80 transition-opacity"
        title="تحديد"
      >
        <svg width="15" height="14" viewBox="0 0 15 13.868" fill="none">
          <path d={svgPaths.p11466900} fill="#415844" />
        </svg>
      </button>
      <button
        type="button"
        className="bg-[#f5f5f5] rounded-[4px] p-[2px] hover:opacity-80 transition-opacity"
        title="عرض"
        onClick={onView}
      >
        <svg width="13" height="9" viewBox="0 0 12.9339 8.74995" fill="none">
          <path
            clipRule="evenodd"
            d={svgPaths.p513580}
            fill="#2D3648"
            fillRule="evenodd"
          />
        </svg>
      </button>
      <button
        type="button"
        className="bg-[#f5f5f5] rounded-[4px] p-[2px] hover:opacity-80 transition-opacity"
        title="تحويل"
      >
        <ArrowDownUp size={11} className="text-[#2d3648]" />
      </button>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
interface BarChartRow {
  label: string;
  outside: number;
  remaining: number;
}

function UnitBarChart({ data }: { data: BarChartRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Legend */}
      <div className="flex items-center gap-4 justify-end">
        <div className="flex items-center gap-2">
          <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
            المتبقي
          </span>
          <span className="w-4 h-4 rounded-[2px] shrink-0 bg-[#abb5f5]" />
        </div>
        <div className="flex items-center gap-2">
          <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
            الخارج
          </span>
          <span className="w-4 h-4 rounded-[2px] shrink-0 bg-[#00B867]" />
        </div>
      </div>

      {/* Chart — explicit Cell keys to prevent Recharts null-key duplicate warning */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          barCategoryGap="30%"
          barGap={3}
          margin={{ top: 4, right: 0, bottom: 4, left: 0 }}
        >
          <XAxis
            dataKey="label"
            tick={{
              fontFamily: "'Almarai', sans-serif",
              fontSize: 12,
              fill: "#2d3648",
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{
              fontFamily: "'Almarai', sans-serif",
              fontSize: 11,
              fill: "#2d3648",
            }}
            axisLine={false}
            tickLine={false}
            width={45}
            orientation="right"
            allowDecimals={false}
          />
          <Bar
            dataKey="outside"
            name="الخارج"
            fill="#00B867"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell key={`outside-${i}`} fill="#00B867" />
            ))}
          </Bar>
          <Bar
            dataKey="remaining"
            name="المتبقي"
            fill="#abb5f5"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell key={`remaining-${i}`} fill="#abb5f5" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChartPanel({
  pct,
  inside,
  outside,
}: {
  pct: number;
  inside: number;
  outside: number;
}) {
  const donutData = [
    { value: pct, name: "khawarij" },
    { value: 100 - pct, name: "inside" },
  ];

  return (
    <div
      className="flex flex-col items-center justify-between h-full gap-2 py-2"
      dir="rtl"
    >
      {/* داخل الوحدة */}
      <div className="flex flex-col items-center">
        <span
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 20,
            color: "#2d3648",
            lineHeight: 1.5,
          }}
        >
          {inside}
        </span>
        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
          داخل الوحدة
        </span>
      </div>

      {/* Donut */}
      <div className="relative" style={{ width: 160, height: 160 }}>
        <PieChart width={160} height={160}>
          <Pie
            data={donutData}
            cx={75}
            cy={75}
            innerRadius={50}
            outerRadius={76}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            {/* Explicit keys on Cell to prevent Recharts null-key duplicate warning */}
            <Cell key="cell-khawarij" fill="#7D8FF0" />
            <Cell key="cell-inside" fill="#00B867" />
          </Pie>
        </PieChart>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span style={{ ...F, fontWeight: 700, fontSize: 20, color: "#2d3648" }}>
            {pct}%
          </span>
          <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>خوارج</span>
        </div>
      </div>

      {/* خارج الوحده */}
      <div className="flex flex-col items-center">
        <span
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 20,
            color: "#2d3648",
            lineHeight: 1.5,
          }}
        >
          {outside}
        </span>
        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
          خارج الوحده
        </span>
      </div>
    </div>
  );
}

// ─── Helpers للمطابقة مع قاعدة البيانات ────────────────────────────────────────

function isMainUnitType(unitType: string | null): boolean {
  return unitType?.trim().toUpperCase() === "MAIN";
}

function isConscriptCategory(cat: DbPersonnelCategory | undefined): boolean {
  if (!cat) return false;
  const code = cat.code?.toUpperCase() ?? "";
  return cat.name === "مجند" || code === "CONSCRIPT" || code === "SOLDIER";
}

function isVolunteerCategory(cat: DbPersonnelCategory | undefined): boolean {
  if (!cat) return false;
  const code = cat.code?.toUpperCase() ?? "";
  return cat.name === "متطوع" || code === "VOLUNTEER";
}

function isAttachedStatus(status: DbServiceStatus | undefined): boolean {
  if (!status) return false;
  const code = status.code?.toUpperCase() ?? "";
  return code === "ATTACHED" || status.name === "ملحق علي القوة";
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const TABLE_COLS = [
  { key: "milId", label: "رقم عسكري" },
  { key: "rank", label: "درجة" },
  { key: "name", label: "اسم" },
  { key: "serviceType", label: "نوع الخدمه" },
  { key: "status", label: "حالة التوزيع" },
  { key: "attachment", label: "مكان الالحاق" },
  { key: "actions", label: "الاجراء" },
];

export function UnitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [unit, setUnit] = useState<DbUnit | null>(null);
  const [unitPersonnel, setUnitPersonnel] = useState<DbPersonnelRow[]>([]);
  const [ranks, setRanks] = useState<DbRank[]>([]);
  const [categories, setCategories] = useState<DbPersonnelCategory[]>([]);
  const [statuses, setStatuses] = useState<DbServiceStatus[]>([]);
  const [unitNamesById, setUnitNamesById] = useState<Record<string, string>>(
    {}
  );

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) {
      loadUnitDetail(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadUnitDetail(unitId: string) {
    try {
      setLoading(true);
      setNotFound(false);

      const { data: unitRow, error: unitError } = await supabase
        .from("units")
        .select("id,name,code,unit_type,parent_unit_id,is_active")
        .eq("id", unitId)
        .maybeSingle();

      if (unitError) throw unitError;

      if (!unitRow) {
        setNotFound(true);
        setUnit(null);
        return;
      }

      const isMain = isMainUnitType(unitRow.unit_type);

      const [
        personnelResult,
        ranksResult,
        categoriesResult,
        statusesResult,
        unitsResult,
      ] = await Promise.all([
        // قوة الوحدة الرئيسية = الأفراد اللي وحدتهم الأساسية هي دي
        // قوة الوحدة الإدارية = الأفراد اللي مكان إلحاقهم هو دي
        isMain
          ? supabase
              .from("personnel")
              .select(
                "id,military_number,full_name,rank_id,personnel_category_id,service_status_id,primary_unit_id,attachment_unit_id,is_active"
              )
              .eq("primary_unit_id", unitId)
              .eq("is_active", true)
          : supabase
              .from("personnel")
              .select(
                "id,military_number,full_name,rank_id,personnel_category_id,service_status_id,primary_unit_id,attachment_unit_id,is_active"
              )
              .eq("attachment_unit_id", unitId)
              .eq("is_active", true),

        supabase.from("ranks").select("id,name,code"),
        supabase.from("personnel_categories").select("id,name,code"),
        supabase.from("service_statuses").select("id,name,code"),
        supabase.from("units").select("id,name"),
      ]);

      if (personnelResult.error) throw personnelResult.error;
      if (ranksResult.error) throw ranksResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (statusesResult.error) throw statusesResult.error;
      if (unitsResult.error) throw unitsResult.error;

      setUnit(unitRow);
      setUnitPersonnel(personnelResult.data ?? []);
      setRanks(ranksResult.data ?? []);
      setCategories(categoriesResult.data ?? []);
      setStatuses(statusesResult.data ?? []);

      const namesMap: Record<string, string> = {};
      (unitsResult.data ?? []).forEach((u: { id: string; name: string }) => {
        namesMap[u.id] = u.name;
      });
      setUnitNamesById(namesMap);
    } catch (error: any) {
      console.error("Error loading unit detail:", error);

      alert(
        `حدث خطأ أثناء تحميل بيانات الوحدة${
          error?.message ? `\n\nتفاصيل الخطأ: ${error.message}` : ""
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  const rankById = useMemo(() => {
    const map = new Map<string, DbRank>();
    ranks.forEach((r) => map.set(r.id, r));
    return map;
  }, [ranks]);

  const categoryById = useMemo(() => {
    const map = new Map<string, DbPersonnelCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const statusById = useMemo(() => {
    const map = new Map<string, DbServiceStatus>();
    statuses.forEach((s) => map.set(s.id, s));
    return map;
  }, [statuses]);

  const isMain = isMainUnitType(unit?.unit_type ?? null);

  // ---- الإحصائيات المحسوبة ----
  const computed = useMemo(() => {
    const strengthCount = unitPersonnel.length;

    const soldiers = unitPersonnel.filter((p) =>
      isConscriptCategory(categoryById.get(p.personnel_category_id ?? ""))
    );

    const ncos = unitPersonnel.filter((p) =>
      isVolunteerCategory(categoryById.get(p.personnel_category_id ?? ""))
    );

    // الخوارج مفهوم خاص بالوحدة الأساسية فقط: فرد حالته الخدمية "ملحق علي القوة"
    const khawarijList = isMain
      ? unitPersonnel.filter((p) =>
          isAttachedStatus(statusById.get(p.service_status_id ?? ""))
        )
      : [];

    const soldiersKhawarijCount = isMain
      ? soldiers.filter((p) =>
          isAttachedStatus(statusById.get(p.service_status_id ?? ""))
        ).length
      : 0;

    const ncosKhawarijCount = isMain
      ? ncos.filter((p) =>
          isAttachedStatus(statusById.get(p.service_status_id ?? ""))
        ).length
      : 0;

    const khawarijCount = khawarijList.length;

    const khawarijPct =
      isMain && strengthCount > 0
        ? Math.round((khawarijCount / strengthCount) * 100)
        : 0;

    const chartData: BarChartRow[] = [
      {
        label: "اجمالي ضباط الصف",
        outside: ncosKhawarijCount,
        remaining: ncos.length - ncosKhawarijCount,
      },
      {
        label: "اجمالي الجنود",
        outside: soldiersKhawarijCount,
        remaining: soldiers.length - soldiersKhawarijCount,
      },
      {
        label: "اجمالي القوة",
        outside: khawarijCount,
        remaining: strengthCount - khawarijCount,
      },
    ];

    return {
      strengthCount,
      soldiersCount: soldiers.length,
      ncosCount: ncos.length,
      khawarijCount,
      khawarijPct,
      chartData,
      inside: strengthCount - khawarijCount,
      outside: khawarijCount,
    };
  }, [unitPersonnel, categoryById, statusById, isMain]);

  if (loading) {
    return (
      <div dir="rtl" className="w-full flex items-center justify-center py-20">
        <p style={{ ...F, fontSize: 18, color: "#415844" }}>
          جاري تحميل البيانات...
        </p>
      </div>
    );
  }

  if (notFound || !unit) {
    return (
      <div
        dir="rtl"
        className="w-full flex flex-col items-center justify-center gap-4 py-20"
      >
        <p style={{ ...F, fontSize: 18, color: "#2d3648" }}>
          لم يتم العثور على هذه الوحدة
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard/units-report")}
          className="h-[40px] px-5 rounded-[8px] bg-[#DCF4DF]"
        >
          <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
            العودة لقائمة الوحدات
          </span>
        </button>
      </div>
    );
  }

  const STATS = [
    {
      label: "اجمالي الخوارج",
      value: computed.khawarijCount.toLocaleString("ar-EG"),
      icon: <IconKhawarij />,
    },
    {
      label: "اجمالي الجنود",
      value: computed.soldiersCount.toLocaleString("ar-EG"),
      icon: <IconSoldiers />,
    },
    {
      label: "اجمالي ضباط الصف",
      value: computed.ncosCount.toLocaleString("ar-EG"),
      icon: <IconNCO />,
    },
    {
      label: "اجمالي القوة",
      value: computed.strengthCount.toLocaleString("ar-EG"),
      icon: <IconGroup />,
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full" dir="rtl">
      {/* ── Page title ─────────────────────────────── */}
      <h1
        className="text-center w-full"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(20px,3.5vw,30px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        الموقف العام {unit.name}
      </h1>

      {/* ── Stats section ──────────────────────────── */}
      <section className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between w-full">
          <h2
            style={{ ...F, fontWeight: 700, fontSize: 24, color: "#2d3648" }}
          >
            إحصائيات الوحدة
          </h2>
          <button
            type="button"
            className="flex items-center gap-1.5 bg-[#DCF4DF] rounded-[8px] px-3 py-2 hover:opacity-80 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 13.3333 13.3333" fill="none">
              <path
                clipRule="evenodd"
                d={svgPaths.pfd2e80}
                fill="#2D3648"
                fillRule="evenodd"
              />
            </svg>
            <span
              style={{
                ...F,
                fontSize: 14,
                color: "#2d3648",
                whiteSpace: "nowrap",
              }}
            >
              طباعة احصائية الوحده
            </span>
          </button>
        </div>

        <div className="flex flex-wrap gap-4 w-full">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex-1 min-w-[120px] bg-white rounded-[16px] border border-[#eff0f6] px-6 py-4 flex items-center gap-3 justify-between"
            >
              <div className="flex flex-col items-start gap-2">
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
              <div className="flex items-center justify-center shrink-0">
                {s.icon}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Charts section ─────────────────────────── */}
      <section className="flex flex-wrap gap-4 w-full items-stretch">
        <div className="flex-1 min-w-[300px] bg-white rounded-[12px] border border-[#eff0f6] p-6">
          <UnitBarChart data={computed.chartData} />
        </div>
        <div className="bg-white rounded-[12px] border border-[#eff0f6] p-5 w-[220px] min-w-[200px] flex items-center justify-center">
          <DonutChartPanel
            pct={computed.khawarijPct}
            inside={computed.inside}
            outside={computed.outside}
          />
        </div>
      </section>

      {/* ── Soldiers table ─────────────────────────── */}
      <section className="bg-white rounded-[12px] border border-[#eff0f6] w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eff0f6]">
          <h3 style={{ ...F, fontWeight: 700, fontSize: 24, color: "#2d3648" }}>
            افراد الوحده
          </h3>
          <button
            type="button"
            className="hover:opacity-80 transition-opacity"
            onClick={() =>
              navigate(`/dashboard/units-report/${unit.id}/soldiers`)
            }
          >
            <span
              style={{
                ...F,
                fontWeight: 700,
                fontSize: 18,
                background: "linear-gradient(to bottom, #00b867, #00522e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              عرض الجميع
            </span>
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[720px]" dir="rtl">
            <thead>
              <tr className="bg-white border-b border-[#d4d8fa]">
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[#d4d8fa] cursor-pointer"
                    readOnly
                  />
                </th>
                {TABLE_COLS.map((c) => (
                  <th
                    key={c.key}
                    className="px-4 py-3 text-right whitespace-nowrap"
                  >
                    <div className="flex items-start gap-1 justify-start">
                      <span
                        style={{
                          ...F,
                          fontWeight: 700,
                          fontSize: 12,
                          color: "#717d96",
                        }}
                      >
                        {c.label}
                      </span>
                      <svg
                        className="shrink-0"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d={svgPaths.p14089660}
                          stroke="#A0ABC0"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.33"
                        />
                      </svg>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unitPersonnel.length === 0 ? (
                <tr>
                  <td
                    colSpan={TABLE_COLS.length + 1}
                    className="text-center py-10"
                    style={{ ...F, fontSize: 14, color: "#717d96" }}
                  >
                    لا يوجد أفراد بهذه الوحدة
                  </td>
                </tr>
              ) : (
                unitPersonnel.map((row, idx) => {
                  const rank = rankById.get(row.rank_id ?? "");
                  const category = categoryById.get(
                    row.personnel_category_id ?? ""
                  );
                  const status = statusById.get(row.service_status_id ?? "");
                  const attachmentName = row.attachment_unit_id
                    ? unitNamesById[row.attachment_unit_id] ?? "—"
                    : "لا يوجد";

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-[#eaecf0] ${
                        idx % 2 === 0 ? "bg-white" : "bg-[#fafbff]"
                      } hover:bg-[#f5f6fb] transition-colors`}
                    >
                      <td className="w-10 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-[#d4d8fa] cursor-pointer"
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          style={{
                            ...F,
                            fontSize: 14,
                            color: "#2d3648",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.military_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                          {rank?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          style={{
                            ...F,
                            fontSize: 14,
                            color: "#2d3648",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.full_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                          {category?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          style={{
                            ...F,
                            fontSize: 14,
                            color: "#2d3648",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {attachmentName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ActionBtns
                          onView={() =>
                            navigate(
                              `/dashboard/individual-query/soldier/${row.id}`
                            )
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
