import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowDownUp, Plus } from "lucide-react";
import svgPaths from "../../imports/بيانالوحداتالموقفالعامافرادالوحده/svg-gyw4yomx83";

// ─── Shared style ─────────────────────────────────────────────────────────────
const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type LocationFilter = "all" | "inside" | "outside";
type RankFilter = "all" | "soldiers" | "nco";

interface SoldierRow {
  id: number;
  milId: string;
  rank: string;
  name: string;
  serviceType: string;
  status: "داخل الوحده" | "خارج الوحده";
  attachment: string;
}

interface UnitMeta {
  name: string;
  total: number;
  soldiers: number;
  nco: number;
  khawarij: number;
  remaining: number;
  rows: SoldierRow[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const UNITS: Record<number, UnitMeta> = {
  1: {
    name: "سـ 145 اشارة",
    total: 120,
    soldiers: 100,
    nco: 20,
    khawarij: 30,
    remaining: 90,
    rows: [
      {
        id: 1,
        milId: "2024427700265",
        rank: "جندي",
        name: "اسلام مجدى عبدالستار",
        serviceType: "مجند",
        status: "داخل الوحده",
        attachment: "لا يوجد",
      },
      {
        id: 2,
        milId: "2024159308527",
        rank: "جندي",
        name: "احمد عادل عبدالستار",
        serviceType: "مجند",
        status: "خارج الوحده",
        attachment: "فرع العمليات",
      },
      {
        id: 3,
        milId: "2024964213580",
        rank: "مساعد أ",
        name: "محمود اسلام عبدالله",
        serviceType: "متطوع",
        status: "داخل الوحده",
        attachment: "لا يوجد",
      },
    ],
  },
  2: {
    name: "كـ 113 صع",
    total: 120,
    soldiers: 100,
    nco: 20,
    khawarij: 30,
    remaining: 90,
    rows: [
      {
        id: 1,
        milId: "2024427700265",
        rank: "جندي",
        name: "اسلام مجدى عبدالستار",
        serviceType: "مجند",
        status: "داخل الوحده",
        attachment: "لا يوجد",
      },
      {
        id: 2,
        milId: "2024159308527",
        rank: "جندي",
        name: "احمد عادل عبدالستار",
        serviceType: "مجند",
        status: "خارج الوحده",
        attachment: "فرع العمليات",
      },
      {
        id: 3,
        milId: "2024964213580",
        rank: "مساعد أ",
        name: "محمود اسلام عبدالله",
        serviceType: "متطوع",
        status: "داخل الوحده",
        attachment: "لا يوجد",
      },
    ],
  },
  3: {
    name: "قيا مج العمليات الخاصة",
    total: 120,
    soldiers: 100,
    nco: 20,
    khawarij: 30,
    remaining: 90,
    rows: [
      {
        id: 1,
        milId: "2024427700265",
        rank: "جندي",
        name: "اسلام مجدى عبدالستار",
        serviceType: "مجند",
        status: "داخل الوحده",
        attachment: "لا يوجد",
      },
      {
        id: 2,
        milId: "2024159308527",
        rank: "جندي",
        name: "احمد عادل عبدالستار",
        serviceType: "مجند",
        status: "خارج الوحده",
        attachment: "فرع العمليات",
      },
      {
        id: 3,
        milId: "2024964213580",
        rank: "مساعد أ",
        name: "محمود اسلام عبدالله",
        serviceType: "متطوع",
        status: "داخل الوحده",
        attachment: "لا يوجد",
      },
    ],
  },
};

function getUnit(id: number): UnitMeta {
  return UNITS[id] ?? { ...UNITS[3], name: `وحدة ${id}` };
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<
  string,
  { bg: string; dot: string; text: string }
> = {
  "داخل الوحده": {
    bg: "#ebfaea",
    dot: "#35C128",
    text: "#26861d",
  },
  "خارج الوحده": {
    bg: "#fff3f3",
    dot: "#e34040",
    text: "#9a1010",
  },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CFG[status] ?? STATUS_CFG["داخل الوحده"];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[16px] px-2 py-0.5"
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
        {status}
      </span>
    </span>
  );
}

// ─── Action buttons ───────────────────────────────────────────────────────────
function ActionBtns({ onView }: { onView: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Transfer arrow icon */}
      <button
        type="button"
        className="bg-[#ebedfd] rounded-[4px] p-[3px] hover:opacity-80 transition-opacity"
        title="تحديد"
      >
        <svg
          width="15"
          height="14"
          viewBox="0 0 15 13.868"
          fill="none"
        >
          <path d={svgPaths.p11466900} fill="#294DBB" />
        </svg>
      </button>
      {/* Eye icon */}
      <button
        type="button"
        className="bg-[#f5f5f5] rounded-[4px] p-[3px] hover:opacity-80 transition-opacity"
        title="عرض"
        onClick={onView}
      >
        <svg
          width="13"
          height="9"
          viewBox="0 0 12.9339 8.74995"
          fill="none"
        >
          <path
            clipRule="evenodd"
            d={svgPaths.p513580}
            fill="#2D3648"
            fillRule="evenodd"
          />
        </svg>
      </button>
      {/* Steps icon */}
      <button
        type="button"
        className="bg-[#f5f5f5] rounded-[4px] p-[3px] hover:opacity-80 transition-opacity"
        title="تحويل"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14.0625 14.0625"
          fill="none"
        >
          <path
            clipRule="evenodd"
            d={svgPaths.p25863700}
            fill="#2D3648"
            fillRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── Filter button group ──────────────────────────────────────────────────────
interface FilterBtnGroupProps<T extends string> {
  options: { value: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
}
function FilterBtnGroup<T extends string>({
  options,
  active,
  onChange,
}: FilterBtnGroupProps<T>) {
  return (
    <div className="flex items-stretch" dir="rtl">
      {options.map((opt, idx) => {
        const isActive = opt.value === active;
        const isFirst = idx === 0;
        const isLast = idx === options.length - 1;

        const borderRadius = isFirst
          ? "rounded-tr-[12px] rounded-br-[12px]"
          : isLast
            ? "rounded-tl-[12px] rounded-bl-[12px]"
            : "";

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              px-4 py-2 border border-[#eff0f6] border-solid
              transition-colors whitespace-nowrap min-w-[80px]
              ${borderRadius}
              ${
                isActive
                  ? "text-white"
                  : "bg-white text-[#2d3648] hover:bg-[#f5f6fb]"
              }
            `}
            style={
              isActive
                ? {
                    background:
                      "linear-gradient(to bottom, #00b867, #00522e)",
                    ...F,
                    fontSize: 16,
                  }
                : { ...F, fontSize: 16 }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Table columns ────────────────────────────────────────────────────────────
const TABLE_COLS = [
  { key: "milId", label: "رقم عسكري" },
  { key: "rank", label: "درجة" },
  { key: "name", label: "اسم" },
  { key: "serviceType", label: "نوع الخدمه" },
  { key: "status", label: "حالة التوزيع" },
  { key: "attachment", label: "مكان الالحاق" },
  { key: "actions", label: "الاجراء" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export function UnitSoldiersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const unit = getUnit(parseInt(id ?? "3", 10));

  const [locationFilter, setLocationFilter] =
    useState<LocationFilter>("all");
  const [rankFilter, setRankFilter] =
    useState<RankFilter>("all");
  const [search, setSearch] = useState("");
  const [allChecked, setAllChecked] = useState(false);

  // Filter rows
  const filtered = unit.rows.filter((row) => {
    const matchLoc =
      locationFilter === "all"
        ? true
        : locationFilter === "inside"
          ? row.status === "داخل الوحده"
          : row.status === "خارج الوحده";
    const matchRank =
      rankFilter === "all"
        ? true
        : rankFilter === "soldiers"
          ? row.rank === "جندي"
          : row.rank !== "جندي";
    const matchSearch =
      search === "" ||
      row.milId.includes(search) ||
      row.name.includes(search);
    return matchLoc && matchRank && matchSearch;
  });

  const locationOptions: {
    value: LocationFilter;
    label: string;
  }[] = [
    { value: "inside", label: "داخل الوحده" },
    { value: "outside", label: "خارج الوحده" },
    { value: "all", label: "الكل" },
  ];

  const rankOptions: { value: RankFilter; label: string }[] = [
    { value: "soldiers", label: "جنود" },
    { value: "nco", label: "ضباط صف" },
    { value: "all", label: "الكل" },
  ];

  return (
    <div className="flex flex-col gap-5 w-full" dir="rtl">
      {/* ── Page title ──────────────────────────── */}
      <h1
        className="text-center w-full"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(18px,3vw,28px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        عرض افراد {unit.name}
      </h1>

      {/* ── Unit info card ──────────────────────── */}
      <div className="bg-white w-full rounded-[12px] border border-[#eff0f6] p-4 ">
        {/* Unit name */}
        <span
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 24,
            color: "#2d3648",
            lineHeight: 1.5,
          }}
        >
          {unit.name}
        </span>

        {/* Stats row + print button */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Stats */}
          <div className="flex items-start gap-6 flex-wrap justify-start">
            {[
              {
                label: "المتبقي:",
                value: `${unit.remaining} فرد`,
              },
              {
                label: "خوارج:",
                value: `${unit.khawarij} فرد`,
              },
              {
                label: "ضباط صف:",
                value: `${unit.nco} ضابط صف`,
              },
              {
                label: "الجنود:",
                value: `${unit.soldiers} جندي`,
              },
              { label: "القوة:", value: `${unit.total} فرد` },
            ].map((s, i, arr) => (
              <div
                key={s.label}
                className="flex items-center gap-6"
              >
                <div className="flex flex-col items-start gap-1">
                  <span
                    style={{
                      ...F,
                      fontSize: 16,
                      color: "#a0abc0",
                    }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{
                      ...F,
                      fontWeight: 700,
                      fontSize: 18,
                      color: "#4a5468",
                    }}
                  >
                    {s.value}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-px h-9 bg-[#cbd2e0] shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Print button */}
          <button
            type="button"
            className="flex items-center gap-1.5 bg-[#ebedfd] rounded-[8px] px-3 py-2 hover:opacity-80 transition-opacity shrink-0"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 13.3333 13.3333"
              fill="none"
            >
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
              طباعة كشف الاسماء
            </span>
          </button>
        </div>
      </div>

      {/* ── Soldiers section ────────────────────── */}
      <div className="bg-white w-full rounded-[12px] border border-[#eff0f6] overflow-hidden">
        {/* ── Section header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eff0f6]">
          {/* Add soldier button */}
          <button
            type="button"
            onClick={() => navigate("/dashboard/add-soldier")}
            className="flex items-center gap-1.5 bg-[#ebedfd] rounded-[8px] px-3 py-2 hover:opacity-80 transition-opacity"
          >
            <span
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              اضافة فرد
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 9.33333 9.33333"
              fill="none"
            >
              <path
                clipRule="evenodd"
                d={svgPaths.p3a130d00}
                fill="#2D3648"
                fillRule="evenodd"
              />
            </svg>
          </button>
          <h2
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 24,
              color: "#2d3648",
            }}
          >
            افراد الوحده
          </h2>
        </div>

        {/* ── Filters + Search ── */}
        <div className="flex items-end gap-4 flex-wrap px-5 py-4 border-b border-[#eff0f6]">
          {/* Filter groups */}
          <div className="flex items-center gap-4 flex-wrap">
            <FilterBtnGroup
              options={locationOptions}
              active={locationFilter}
              onChange={setLocationFilter}
            />
            <FilterBtnGroup
              options={rankOptions}
              active={rankFilter}
              onChange={setRankFilter}
            />
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[220px]">
            <div className="relative bg-white rounded-[8px] border border-[#e2e7f0] flex items-center gap-3 px-3 py-2.5">
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 shrink-0"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  clipRule="evenodd"
                  d={svgPaths.p15acc00}
                  fill="#2D3648"
                  fillRule="evenodd"
                />
              </svg>
              <input
                type="text"
                dir="rtl"
                className="w-full bg-transparent outline-none pr-8"
                placeholder="ابحث برقم عسكري, الاسم"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...F, fontSize: 16, color: "#4a5468" }}
              />
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]" dir="rtl">
            <thead>
              <tr className="bg-white border-b border-[#d4d8fa]">
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded cursor-pointer"
                    checked={allChecked}
                    onChange={(e) =>
                      setAllChecked(e.target.checked)
                    }
                  />
                </th>
                {TABLE_COLS.map((c) => (
                  <th
                    key={c.key}
                    className="px-4 py-3 text-right whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1 justify-end">
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
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="shrink-0"
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
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={TABLE_COLS.length + 1}
                    className="text-center py-10"
                  >
                    <span
                      style={{
                        ...F,
                        fontSize: 16,
                        color: "#a0abc0",
                      }}
                    >
                      لا توجد نتائج
                    </span>
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-[#eaecf0] ${idx % 2 === 0 ? "bg-white" : "bg-[#fafbff]"} hover:bg-[#f5f6fb] transition-colors`}
                  >
                    <td className="w-10 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded cursor-pointer"
                        checked={allChecked}
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
                        {row.milId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        style={{
                          ...F,
                          fontSize: 14,
                          color: "#2d3648",
                        }}
                      >
                        {row.rank}
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
                        {row.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        style={{
                          ...F,
                          fontSize: 14,
                          color: "#2d3648",
                        }}
                      >
                        {row.serviceType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
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
                        {row.attachment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ActionBtns
                        onView={() =>
                          navigate(
                            `/dashboard/individual-query/soldier/${row.id}`,
                          )
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer bar ── */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#fafbff] border-t border-[#eff0f6] flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <span
              style={{ ...F, fontSize: 14, color: "#a0abc0" }}
            >
              المستخدم الحالي:
            </span>
            <span
              style={{
                ...F,
                fontSize: 14,
                color: "#4a5468",
                fontWeight: 700,
              }}
            >
              جندي / اسلام مجدي عبدالستار
            </span>
          </div>
          <div>
            <span
              style={{ ...F, fontSize: 14, color: "#a0abc0" }}
            >
              التاريخ:{" "}
            </span>
            <span
              style={{ ...F, fontSize: 14, color: "#4a5468" }}
            >
              13 فبراير 2026، 9:14 م
            </span>
          </div>
          <div>
            <span
              style={{ ...F, fontSize: 14, color: "#a0abc0" }}
            >
              عدد النتائج:{" "}
            </span>
            <span
              style={{
                ...F,
                fontWeight: 700,
                fontSize: 14,
                color: "#4a5468",
              }}
            >
              {filtered.length} فرد
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}