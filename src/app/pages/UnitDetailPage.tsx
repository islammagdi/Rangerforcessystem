import { useNavigate, useParams } from "react-router";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Printer, Eye, ArrowDownUp, ArrowDown } from "lucide-react";
import svgPaths from "../../imports/بيانالوحداتالموقفالعامبيانوحده-1/svg-bswzreobyg";

// ─── Shared style ─────────────────────────────────────────────────────────────
const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };
const GRAD_ID = "statGrad";

// ─── Gradient green icon def ──────────────────────────────────────────────────
function GradDefs() {
  return (
    <defs>
      <linearGradient id={GRAD_ID} x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse">
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
      <path clipRule="evenodd" d={svgPaths.p8cec1f0} fill={`url(#${GRAD_ID})`} fillRule="evenodd" />
    </svg>
  );
}

function IconSoldiers() {
  return (
    <svg width="24" height="30" viewBox="0 0 25.9877 30" fill="none">
      <defs>
        <linearGradient id="soldierGrad1" x1="12.9938" x2="12.9938" y1="0" y2="24.9314" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B867" /><stop offset="1" stopColor="#00522E" />
        </linearGradient>
        <linearGradient id="soldierGrad2" x1="10.5369" x2="10.5369" y1="14.655" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B867" /><stop offset="1" stopColor="#00522E" />
        </linearGradient>
      </defs>
      <path clipRule="evenodd" d={svgPaths.p1528f680} fill="url(#soldierGrad1)" fillRule="evenodd" />
      <path clipRule="evenodd" d={svgPaths.p1681e00} fill="url(#soldierGrad2)" fillRule="evenodd" />
    </svg>
  );
}

function IconNCO() {
  return (
    <svg width="24" height="24" viewBox="0 0 19.62 23.1075" fill="none">
      <defs>
        <linearGradient id="ncoGrad1" x1="9.81" x2="9.81" y1="6.21" y2="16.0275" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B867" /><stop offset="1" stopColor="#00522E" />
        </linearGradient>
        <linearGradient id="ncoGrad2" x1="9.81" x2="9.81" y1="0" y2="23.1075" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B867" /><stop offset="1" stopColor="#00522E" />
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
        <linearGradient id="grp0" x1="5" x2="5" y1="0" y2="7.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B867"/><stop offset="1" stopColor="#00522E"/>
        </linearGradient>
        <linearGradient id="grp1" x1="4.55625" x2="4.55625" y1="8.75" y2="17.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B867"/><stop offset="1" stopColor="#00522E"/>
        </linearGradient>
        <linearGradient id="grp2" x1="25" x2="25" y1="0" y2="7.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B867"/><stop offset="1" stopColor="#00522E"/>
        </linearGradient>
        <linearGradient id="grp3" x1="25.4437" x2="25.4437" y1="8.75" y2="17.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B867"/><stop offset="1" stopColor="#00522E"/>
        </linearGradient>
        <linearGradient id="grp4" x1="15" x2="15" y1="0" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B867"/><stop offset="1" stopColor="#00522E"/>
        </linearGradient>
        <linearGradient id="grp5" x1="15" x2="15" y1="11.25" y2="22.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B867"/><stop offset="1" stopColor="#00522E"/>
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

// ─── Data ─────────────────────────────────────────────────────────────────────
interface SoldierRow {
  id: number;
  milId: string;
  rank: string;
  name: string;
  serviceType: string;
  status: "علي القوة" | "ملحق" | "إجازة";
  attachment: string;
}

interface UnitData {
  id: number;
  name: string;
  khawarijPct: number;
  inside: number;
  outside: number;
  totalStrength: number;
  totalSoldiers: number;
  totalNCOs: number;
  totalKhawarij: number;
  chartData: { label: string; outside: number; remaining: number }[];
  soldiers: SoldierRow[];
}

const BASE_SOLDIERS: SoldierRow[] = [
  { id: 1, milId: "2024427700265", rank: "جندي",    name: "اسلام مجدى عبدالستار", serviceType: "مجند", status: "علي القوة", attachment: "لا يوجد"      },
  { id: 2, milId: "2024159308527", rank: "جندي",    name: "احمد عادل عبدالستار",  serviceType: "مجند", status: "ملحق",      attachment: "فرع العمليات" },
  { id: 3, milId: "2024964213580", rank: "مساعد أ", name: "محمود اسلام عبدالله",  serviceType: "مجند", status: "علي القوة", attachment: "لا يوجد"      },
];

const UNITS_DB: Record<number, UnitData> = {
  1: {
    id: 1, name: "سـ 145 اشارة",
    khawarijPct: 23, inside: 210, outside: 120,
    totalStrength: 4500, totalSoldiers: 4000, totalNCOs: 500, totalKhawarij: 210,
    chartData: [
      { label: "اجمالي ضباط الصف", outside: 59, remaining: 113 },
      { label: "اجمالي الجنود",     outside: 39, remaining: 97  },
      { label: "اجمالي القوة",      outside: 49, remaining: 87  },
    ],
    soldiers: BASE_SOLDIERS,
  },
  2: {
    id: 2, name: "كـ 113 صع",
    khawarijPct: 23, inside: 210, outside: 120,
    totalStrength: 140, totalSoldiers: 70, totalNCOs: 70, totalKhawarij: 210,
    chartData: [
      { label: "اجمالي ضباط الصف", outside: 59, remaining: 113 },
      { label: "اجمالي الجنود",     outside: 39, remaining: 97  },
      { label: "اجمالي القوة",      outside: 49, remaining: 87  },
    ],
    soldiers: BASE_SOLDIERS,
  },
  3: {
    id: 3, name: "قيا مج العمليات الخاصة",
    khawarijPct: 23, inside: 210, outside: 120,
    totalStrength: 35, totalSoldiers: 20, totalNCOs: 10, totalKhawarij: 210,
    chartData: [
      { label: "اجمالي ضباط الصف", outside: 59, remaining: 113 },
      { label: "اجمالي الجنود",     outside: 39, remaining: 97  },
      { label: "اجمالي القوة",      outside: 49, remaining: 87  },
    ],
    soldiers: BASE_SOLDIERS,
  },
};

function getUnit(id: number): UnitData {
  return UNITS_DB[id] ?? { ...UNITS_DB[1], id, name: `وحدة ${id}` };
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { bg: string; dot: string; text: string }> = {
  "علي القوة": { bg: "#ebfaea", dot: "#35C128", text: "#26861d" },
  "ملحق":      { bg: "#e9f9ff", dot: "#29BBD4", text: "#146d7c" },
  "إجازة":     { bg: "#fff7f0", dot: "#e37032", text: "#9a4a10" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CFG[status] ?? STATUS_CFG["علي القوة"];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[16px] pl-1.5 pr-2 py-0.5" style={{ background: s.bg }}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.dot }} />
      <span style={{ ...F, fontWeight: 700, fontSize: 12, color: s.text, whiteSpace: "nowrap" }}>{status}</span>
    </span>
  );
}

// ─── Action buttons ───────────────────────────────────────────────────────────
function ActionBtns({ onView }: { onView: () => void }) {
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <button type="button"
        className="bg-[#ebedfd] rounded-[4px] p-[2px] hover:opacity-80 transition-opacity"
        title="تحديد">
        <svg width="15" height="14" viewBox="0 0 15 13.868" fill="none">
          <path d={svgPaths.p11466900} fill="#294DBB" />
        </svg>
      </button>
      <button type="button"
        className="bg-[#f5f5f5] rounded-[4px] p-[2px] hover:opacity-80 transition-opacity"
        title="عرض" onClick={onView}>
        <svg width="13" height="9" viewBox="0 0 12.9339 8.74995" fill="none">
          <path clipRule="evenodd" d={svgPaths.p513580} fill="#2D3648" fillRule="evenodd" />
        </svg>
      </button>
      <button type="button"
        className="bg-[#f5f5f5] rounded-[4px] p-[2px] hover:opacity-80 transition-opacity"
        title="تحويل">
        <ArrowDownUp size={11} className="text-[#2d3648]" />
      </button>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function UnitBarChart({ data }: { data: UnitData["chartData"] }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Legend */}
      <div className="flex items-center gap-4 justify-end">
        <div className="flex items-center gap-2">
          <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>المتبقي</span>
          <span className="w-4 h-4 rounded-[2px] shrink-0 bg-[#abb5f5]" />
        </div>
        <div className="flex items-center gap-2">
          <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>الخارج</span>
          <span className="w-4 h-4 rounded-[2px] shrink-0 bg-[#00B867]" />
        </div>
      </div>

      {/* Chart — no <Cell> inside <Bar> to avoid Recharts null-key duplicates */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="30%" barGap={3}
          margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontFamily: "'Almarai', sans-serif", fontSize: 12, fill: "#2d3648" }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            ticks={[0, 500, 1500, 2000]}
            tick={{ fontFamily: "'Almarai', sans-serif", fontSize: 11, fill: "#2d3648" }}
            axisLine={false} tickLine={false}
            width={45} orientation="right"
          />
          <Bar dataKey="outside"   name="الخارج"  fill="#00B867" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="remaining" name="المتبقي" fill="#abb5f5" radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChartPanel({ pct, inside, outside }: { pct: number; inside: number; outside: number }) {
  const donutData = [
    { value: pct,       name: "khawarij" },
    { value: 100 - pct, name: "inside"   },
  ];

  return (
    <div className="flex flex-col items-center justify-between h-full gap-2 py-2" dir="rtl">
      {/* داخل الوحدة */}
      <div className="flex flex-col items-center">
        <span style={{ ...F, fontWeight: 700, fontSize: 20, color: "#2d3648", lineHeight: 1.5 }}>{inside}</span>
        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>داخل الوحدة</span>
      </div>

      {/* Donut */}
      <div className="relative" style={{ width: 160, height: 160 }}>
        <PieChart width={160} height={160}>
          <Pie
            data={donutData}
            cx={75} cy={75}
            innerRadius={50} outerRadius={76}
            startAngle={90} endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            {/* Explicit keys on Cell to prevent Recharts null-key duplicate warning */}
            <Cell key="cell-khawarij" fill="#7D8FF0" />
            <Cell key="cell-inside"   fill="#00B867" />
          </Pie>
        </PieChart>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span style={{ ...F, fontWeight: 700, fontSize: 20, color: "#2d3648" }}>{pct}%</span>
          <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>خوارج</span>
        </div>
      </div>

      {/* خارج الوحده */}
      <div className="flex flex-col items-center">
        <span style={{ ...F, fontWeight: 700, fontSize: 20, color: "#2d3648", lineHeight: 1.5 }}>{outside}</span>
        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>خارج الوحده</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const TABLE_COLS = [
  { key: "milId",       label: "رقم عسكري"   },
  { key: "rank",        label: "درجة"         },
  { key: "name",        label: "اسم"          },
  { key: "serviceType", label: "نوع الخدمه"   },
  { key: "status",      label: "حالة التوزيع" },
  { key: "attachment",  label: "مكان الالحاق" },
  { key: "actions",     label: "الاجراء"      },
];

export function UnitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const unit = getUnit(parseInt(id ?? "1", 10));

  const STATS = [
    { label: "اجمالي الخوارج",    value: unit.totalKhawarij.toLocaleString(), icon: <IconKhawarij /> },
    { label: "اجمالي الجنود",     value: unit.totalSoldiers.toLocaleString(), icon: <IconSoldiers /> },
    { label: "اجمالي ضباط الصف", value: unit.totalNCOs.toLocaleString(),     icon: <IconNCO /> },
    { label: "اجمالي القوة",      value: unit.totalStrength.toLocaleString(), icon: <IconGroup /> },
  ];

  return (
    <div className="flex flex-col gap-5 w-full" dir="rtl">

      {/* ── Page title ─────────────────────────────── */}
      <h1 className="text-center w-full"
        style={{ ...F, fontWeight: 700, fontSize: "clamp(20px,3.5vw,30px)", color: "#2d3648", lineHeight: 1.5 }}>
        الموقف العام {unit.name}
      </h1>

      {/* ── Stats section ──────────────────────────── */}
      <section className="flex flex-col gap-3 w-full">
        {/* Row: title + print btn */}
        <div className="flex items-center justify-between w-full">
          {/* Print button — left side (in RTL = visual left = LTR right) */}
          <button type="button"
            className="flex items-center gap-1.5 bg-[#ebedfd] rounded-[8px] px-3 py-2 hover:opacity-80 transition-opacity">
            <svg width="16" height="16" viewBox="0 0 13.3333 13.3333" fill="none">
              <path clipRule="evenodd" d={svgPaths.pfd2e80} fill="#2D3648" fillRule="evenodd" />
            </svg>
            <span style={{ ...F, fontSize: 14, color: "#2d3648", whiteSpace: "nowrap" }}>
              طباعة احصائية الوحده
            </span>
          </button>
          {/* Section title */}
          <h2 style={{ ...F, fontWeight: 700, fontSize: 24, color: "#2d3648" }}>
            إحصائيات الوحدة
          </h2>
        </div>

        {/* 4 stat cards */}
        <div className="flex flex-wrap gap-4 w-full">
          {STATS.map((s) => (
            <div key={s.label}
              className="flex-1 min-w-[120px] bg-white rounded-[16px] border border-[#eff0f6] px-6 py-4 flex items-center gap-3 justify-end">
              {/* icon on left (RTL: visually right side) */}
              <div className="flex items-center justify-center rotate-180 shrink-0">
                {s.icon}
              </div>
              {/* text */}
              <div className="flex flex-col items-end gap-2">
                <span style={{ ...F, fontWeight: 700, fontSize: 24, color: "#2d3648", lineHeight: 1.5 }}>
                  {s.value}
                </span>
                <span style={{ ...F, fontSize: 14, color: "#717d96", whiteSpace: "nowrap" }}>
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Charts section ─────────────────────────── */}
      <section className="flex flex-wrap gap-4 w-full items-stretch">
        {/* Bar chart */}
        <div className="flex-1 min-w-[300px] bg-white rounded-[12px] border border-[#eff0f6] p-6">
          <UnitBarChart data={unit.chartData} />
        </div>
        {/* Donut chart */}
        <div className="bg-white rounded-[12px] border border-[#eff0f6] p-5 w-[220px] min-w-[200px] flex items-center justify-center">
          <DonutChartPanel
            pct={unit.khawarijPct}
            inside={unit.inside}
            outside={unit.outside}
          />
        </div>
      </section>

      {/* ── Soldiers table ─────────────────────────── */}
      <section className="bg-white rounded-[12px] border border-[#eff0f6] w-full overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eff0f6]">
          <button type="button"
            className="hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/dashboard/units-report/${unit.id}/soldiers`)}>
            <span style={{
              ...F, fontWeight: 700, fontSize: 18,
              background: "linear-gradient(to bottom, #00b867, #00522e)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              عرض الجميع
            </span>
          </button>
          <h3 style={{ ...F, fontWeight: 700, fontSize: 24, color: "#2d3648" }}>
            افراد الوحده
          </h3>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[720px]" dir="rtl">
            <thead>
              <tr className="bg-white border-b border-[#d4d8fa]">
                {/* Checkbox */}
                <th className="w-10 px-4 py-3 text-center">
                  <input type="checkbox" className="w-4 h-4 rounded border-[#d4d8fa] cursor-pointer" readOnly />
                </th>
                {TABLE_COLS.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center gap-1 justify-end">
                      <span style={{ ...F, fontWeight: 700, fontSize: 12, color: "#717d96" }}>{c.label}</span>
                      <svg className="shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d={svgPaths.p14089660} stroke="#A0ABC0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33" />
                      </svg>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unit.soldiers.map((row, idx) => (
                <tr key={row.id}
                  className={`border-b border-[#eaecf0] ${idx % 2 === 0 ? "bg-white" : "bg-[#fafbff]"} hover:bg-[#f5f6fb] transition-colors`}>
                  {/* Checkbox */}
                  <td className="w-10 px-4 py-3 text-center">
                    <input type="checkbox" className="w-4 h-4 rounded border-[#d4d8fa] cursor-pointer" readOnly />
                  </td>
                  {/* رقم عسكري */}
                  <td className="px-4 py-3">
                    <span style={{ ...F, fontSize: 14, color: "#2d3648", whiteSpace: "nowrap" }}>{row.milId}</span>
                  </td>
                  {/* درجة */}
                  <td className="px-4 py-3">
                    <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{row.rank}</span>
                  </td>
                  {/* اسم */}
                  <td className="px-4 py-3">
                    <span style={{ ...F, fontSize: 14, color: "#2d3648", whiteSpace: "nowrap" }}>{row.name}</span>
                  </td>
                  {/* نوع الخدمه */}
                  <td className="px-4 py-3">
                    <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{row.serviceType}</span>
                  </td>
                  {/* حالة التوزيع */}
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  {/* مكان الالحاق */}
                  <td className="px-4 py-3">
                    <span style={{ ...F, fontSize: 14, color: "#2d3648", whiteSpace: "nowrap" }}>{row.attachment}</span>
                  </td>
                  {/* الاجراء */}
                  <td className="px-4 py-3">
                    <ActionBtns
                      onView={() => navigate(`/dashboard/individual-query/soldier/${row.id}`)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}