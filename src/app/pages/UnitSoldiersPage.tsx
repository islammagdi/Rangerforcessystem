import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import svgPaths from "../../imports/بيانالوحداتالموقفالعامافرادالوحده/svg-gyw4yomx83";
import { supabase } from "../../lib/supabase";

// ─── Shared style ─────────────────────────────────────────────────────────────

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type LocationFilter = "all" | "inside" | "outside";
type RankFilter = "all" | "soldiers" | "nco";

interface SoldierRow {
  id: string;
  milId: string;
  rank: string;
  name: string;
  serviceType: string;
  status: "داخل الوحده" | "خارج الوحده";
  attachment: string;
  dischargeDate: string;
}

interface UnitMeta {
  id: string;
  name: string;
  total: number;
  soldiers: number;
  nco: number;
  khawarij: number;
  remaining: number;
  rows: SoldierRow[];
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
      <button
        type="button"
        className="bg-[#DCF4DF] rounded-[4px] p-[3px] hover:opacity-80 transition-opacity"
        title="تحديد"
      >
        <svg
          width="15"
          height="14"
          viewBox="0 0 15 13.868"
          fill="none"
        >
          <path d={svgPaths.p11466900} fill="#415844" />
        </svg>
      </button>

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
                : {
                    ...F,
                    fontSize: 16,
                  }
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
// ترتيب رتب المتطوعين (الأعلى أولاً)
const VOLUNTEER_RANK_ORDER = [
  "مساعد اول",
  "مساعد",
  "رقيب اول",
  "رقيب",
  "عريف",
];

function isVolunteerRow(row: SoldierRow): boolean {
  return (
    row.serviceType.includes("متطوع") &&
    !row.serviceType.includes("مجند")
  );
}

function getVolunteerRankIndex(rank: string): number {
  const idx = VOLUNTEER_RANK_ORDER.findIndex((r) => rank.includes(r));
  return idx === -1 ? VOLUNTEER_RANK_ORDER.length : idx;
}

function sortSoldierRows(rows: SoldierRow[]): SoldierRow[] {
  return [...rows].sort((a, b) => {
    const aIsVolunteer = isVolunteerRow(a);
    const bIsVolunteer = isVolunteerRow(b);

    // المتطوعين أولاً، ثم الجنود
    if (aIsVolunteer && !bIsVolunteer) return -1;
    if (!aIsVolunteer && bIsVolunteer) return 1;

    // لو الاتنين متطوعين: رتب حسب ترتيب الرتب
    if (aIsVolunteer && bIsVolunteer) {
      return getVolunteerRankIndex(a.rank) - getVolunteerRankIndex(b.rank);
    }

    // لو الاتنين جنود: رتب بالاسم أبجديًا
    return a.name.localeCompare(b.name, "ar");
  });
}

function formatDischargeDate(row: SoldierRow, rawDate: string | null): string {
  if (isVolunteerRow(row)) {
    return "لا يوجد";
  }

  if (!rawDate) {
    return "-";
  }

  const [year, month, day] = rawDate.split("-");
  return `${day}/${month}/${year}`;
}
const TABLE_COLS = [
  { key: "milId", label: "رقم عسكري" },
  { key: "rank", label: "درجة" },
  { key: "name", label: "اسم" },
  { key: "serviceType", label: "نوع الخدمه" },
  { key: "status", label: "حالة التوزيع" },
  { key: "attachment", label: "مكان الالحاق" },
  { key: "dischargeDate", label: "تاريخ التسريح" },
  { key: "actions", label: "الاجراء" },
];
function PrintStyles() {
  return (
    <style>
      {`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .soldiers-print-area,
          .soldiers-print-area * {
            visibility: visible !important;
          }

          .soldiers-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          .no-print {
            display: none !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          th, td {
            border: 1px solid #ccc;
            padding: 6px !important;
            font-size: 11px !important;
          }

          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
      `}
    </style>
  );
}
function UnitSoldiersPrintReport({
  unit,
  rows,
}: {
  unit: UnitMeta;
  rows: SoldierRow[];
}) {
  const today = new Date().toLocaleString("ar-EG");

  return (
    <div className="soldiers-print-area hidden print:block" dir="rtl">
      {/* نفس الهيدر الموجود في الصفحة */}
      <div className="mb-4">
        <p style={{ ...F, fontWeight: 700, fontSize: 22 }}>
          {unit.name}
        </p>

        <div className="flex items-center gap-6 flex-wrap mt-2">
          <span style={{ ...F, fontSize: 14 }}>
            القوة: {unit.total} فرد
          </span>
          <span style={{ ...F, fontSize: 14 }}>
            ضباط صف: {unit.nco} ضابط صف
          </span>
          <span style={{ ...F, fontSize: 14 }}>
            الجنود: {unit.soldiers} جندي
          </span>
          <span style={{ ...F, fontSize: 14 }}>
            خوارج: {unit.khawarij} فرد
          </span>
          <span style={{ ...F, fontSize: 14 }}>
            المتبقي: {unit.remaining} فرد
          </span>
        </div>
      </div>

      {/* جدول الأفراد بنفس ترتيب الأعمدة المعروض */}
      <table className="w-full" style={F}>
        <thead>
          <tr>
            {TABLE_COLS.filter((c) => c.key !== "actions").map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.milId}</td>
              <td>{row.rank}</td>
              <td>{row.name}</td>
              <td>{row.serviceType}</td>
              <td>{row.status}</td>
              <td>{row.attachment}</td>
              <td>{row.dischargeDate}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ ...F, fontSize: 12, marginTop: 12, textAlign: "left" }}>
        تاريخ الطباعة: {today} — عدد النتائج: {rows.length} فرد
      </p>
    </div>
  );
}
// ─── Page ─────────────────────────────────────────────────────────────────────

export function UnitSoldiersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // مهم: id هنا UUID وليس رقم
  const unitId = id;

  const [unit, setUnit] = useState<UnitMeta | null>(null);

  const [locationFilter, setLocationFilter] =
    useState<LocationFilter>("all");

  const [rankFilter, setRankFilter] =
    useState<RankFilter>("all");

  const [search, setSearch] = useState("");

  const [allChecked, setAllChecked] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ───────────────────────────────────────────────────────────────────────────
  // Load unit + personnel from Supabase
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!unitId) {
      setError("لم يتم تحديد الوحدة");
      setLoading(false);
      return;
    }

    loadUnitData();
  }, [unitId]);

  async function loadUnitData() {
    if (!unitId) return;

    try {
      setLoading(true);
      setError("");

      // ───────────────────────────────────────────────────────────────────────
      // 1) Get unit
      // ───────────────────────────────────────────────────────────────────────

      const { data: unitData, error: unitError } = await supabase
        .from("units")
        .select(`
          id,
          name
        `)
        .eq("id", unitId)
        .single();

      if (unitError) {
        throw unitError;
      }

      // ───────────────────────────────────────────────────────────────────────
      // 2) Get all personnel belonging to this unit
      //
      // primary_unit_id = الوحدة الأساسية
      // attachment_unit_id = الوحدة الملحق بها
      // ───────────────────────────────────────────────────────────────────────

      const { data: personnelData, error: personnelError } =
  await supabase
    .from("personnel")
    .select(`
      id,
      military_number,
      full_name,
      rank_id,
      personnel_category_id,
      service_status_id,
      primary_unit_id,
      attachment_unit_id,
      is_active,
      discharge_date
    `)
    .eq("primary_unit_id", unitId)
    .order("full_name", { ascending: true });
      if (personnelError) {
        throw personnelError;
      }

      const personnel = personnelData ?? [];

      // ───────────────────────────────────────────────────────────────────────
      // 3) Get ranks
      // ───────────────────────────────────────────────────────────────────────

      const rankIds = [
        ...new Set(
          personnel
            .map((p) => p.rank_id)
            .filter(Boolean)
        ),
      ];

      let ranks: any[] = [];

      if (rankIds.length > 0) {
        const { data, error } = await supabase
          .from("ranks")
          .select("id, name")
          .in("id", rankIds);

        if (error) {
          throw error;
        }

        ranks = data ?? [];
      }

      // ───────────────────────────────────────────────────────────────────────
      // 4) Get personnel categories
      // ───────────────────────────────────────────────────────────────────────

      const categoryIds = [
        ...new Set(
          personnel
            .map((p) => p.personnel_category_id)
            .filter(Boolean)
        ),
      ];

      let categories: any[] = [];

      if (categoryIds.length > 0) {
        const { data, error } = await supabase
          .from("personnel_categories")
          .select("id, name")
          .in("id", categoryIds);

        if (error) {
          throw error;
        }

        categories = data ?? [];
      }

      // ───────────────────────────────────────────────────────────────────────
      // 5) Get attachment units
      // ───────────────────────────────────────────────────────────────────────

      const attachmentUnitIds = [
        ...new Set(
          personnel
            .map((p) => p.attachment_unit_id)
            .filter(Boolean)
        ),
      ];

      let attachmentUnits: any[] = [];

      if (attachmentUnitIds.length > 0) {
        const { data, error } = await supabase
          .from("units")
          .select("id, name")
          .in("id", attachmentUnitIds);

        if (error) {
          throw error;
        }

        attachmentUnits = data ?? [];
      }

      // ───────────────────────────────────────────────────────────────────────
      // Maps
      // ───────────────────────────────────────────────────────────────────────

      const rankMap = new Map(
        ranks.map((rank) => [rank.id, rank.name])
      );

      const categoryMap = new Map(
        categories.map((category) => [category.id, category.name])
      );

      const attachmentUnitMap = new Map(
        attachmentUnits.map((u) => [u.id, u.name])
      );

      // ───────────────────────────────────────────────────────────────────────
      // 6) Convert Supabase data -> table rows
      // ───────────────────────────────────────────────────────────────────────

      const rows: SoldierRow[] = personnel.map((person) => {
  const isInside =
    !person.attachment_unit_id ||
    person.attachment_unit_id === unitId;

  const attachment =
    person.attachment_unit_id &&
    person.attachment_unit_id !== unitId
      ? attachmentUnitMap.get(person.attachment_unit_id) ??
        "غير محدد"
      : "لا يوجد";

  const baseRow: SoldierRow = {
    id: person.id,

    milId: person.military_number ?? "",

    rank:
      rankMap.get(person.rank_id) ??
      "غير محدد",

    name:
      person.full_name ??
      "",

    serviceType:
      categoryMap.get(person.personnel_category_id) ??
      "غير محدد",

    status: isInside
      ? "داخل الوحده"
      : "خارج الوحده",

    attachment,

    dischargeDate: "",
  };

  return {
    ...baseRow,
    dischargeDate: formatDischargeDate(baseRow, person.discharge_date),
  };
});

      // ───────────────────────────────────────────────────────────────────────
      // 7) Calculate statistics
      // ───────────────────────────────────────────────────────────────────────

      const soldiers = rows.filter(
        (row) =>
          row.rank.includes("جندي") ||
          row.serviceType.includes("مجند")
      ).length;

      const khawarij = rows.filter(
        (row) => row.status === "خارج الوحده"
      ).length;

      const nco = rows.length - soldiers;

      const remaining = rows.filter(
        (row) => row.status === "داخل الوحده"
      ).length;

      setUnit({
  id: unitData.id,
  name: unitData.name,
  total: rows.length,
  soldiers,
  nco,
  khawarij,
  remaining,
  rows: sortSoldierRows(rows),
});
    } catch (err: any) {
      console.error("Error loading unit personnel:", err);

      setError(
        err?.message ||
          "حدث خطأ أثناء تحميل بيانات أفراد الوحدة"
      );
    } finally {
      setLoading(false);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Filters
  // ───────────────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!unit) return [];

    return unit.rows.filter((row) => {
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
            ? row.rank.includes("جندي") ||
              row.serviceType.includes("مجند")
            : !row.rank.includes("جندي") &&
              !row.serviceType.includes("مجند");

      const normalizedSearch = search.trim();

      const matchSearch =
        normalizedSearch === "" ||
        row.milId.includes(normalizedSearch) ||
        row.name.includes(normalizedSearch);

      return matchLoc && matchRank && matchSearch;
    });
  }, [
    unit,
    locationFilter,
    rankFilter,
    search,
  ]);

  const locationOptions: {
    value: LocationFilter;
    label: string;
  }[] = [
    { value: "all", label: "الكل" },
    { value: "inside", label: "داخل الوحده" },
    { value: "outside", label: "خارج الوحده" },
  ];

  const rankOptions: {
    value: RankFilter;
    label: string;
  }[] = [
    { value: "all", label: "الكل" },
    { value: "soldiers", label: "جنود" },
    { value: "nco", label: "ضباط صف" },
  ];
function handlePrintSoldiersList() {
   const originalTitle = document.title;

  document.title = `كشف اسماء ${unit.name}`;

  window.print();

  document.title = originalTitle;
}
  // ───────────────────────────────────────────────────────────────────────────
  // Loading
  // ───────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        className="flex items-center justify-center w-full min-h-[400px]"
        dir="rtl"
      >
        <span
          style={{
            ...F,
            fontSize: 18,
            color: "#4a5468",
          }}
        >
          جاري تحميل بيانات أفراد الوحدة...
        </span>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Error
  // ───────────────────────────────────────────────────────────────────────────

  if (error || !unit) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full min-h-[400px] gap-4"
        dir="rtl"
      >
        <span
          style={{
            ...F,
            fontSize: 18,
            color: "#e34040",
          }}
        >
          {error || "لم يتم العثور على الوحدة"}
        </span>

        <button
          type="button"
          onClick={loadUnitData}
          className="bg-[#DCF4DF] rounded-[8px] px-4 py-2"
          style={{
            ...F,
            fontSize: 14,
            color: "#2d3648",
          }}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UI
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col gap-5 w-full"
      dir="rtl"
    >
      <PrintStyles />
    <UnitSoldiersPrintReport unit={unit} rows={filtered} />
      {/* Page title */}

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

      {/* Unit info card */}

      <div className="bg-white w-full rounded-[12px] border border-[#eff0f6] p-4">
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

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-6 flex-wrap justify-start">
            {[
              {
                label: "القوة:",
                value: `${unit.total} فرد`,
              },
              {
                label: "ضباط صف:",
                value: `${unit.nco} ضابط صف`,
              },
              
              {
                label: "الجنود:",
                value: `${unit.soldiers} جندي`,
              },
              {
                label: "خوارج:",
                value: `${unit.khawarij} فرد`,
              },
              
              {
                label: "المتبقي:",
                value: `${unit.remaining} فرد`,
              },
              
              
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

          <button
            type="button"
            onClick={handlePrintSoldiersList}
            className="flex items-center gap-1.5 bg-[#DCF4DF] rounded-[8px] px-3 py-2 hover:opacity-80 transition-opacity shrink-0"
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

      {/* Soldiers section */}

      <div className="bg-white w-full rounded-[12px] border border-[#eff0f6] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eff0f6]">
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

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard/add-soldier")
            }
            className="flex items-center gap-1.5 bg-[#DCF4DF] rounded-[8px] px-3 py-2 hover:opacity-80 transition-opacity"
          >
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

            <span
              style={{
                ...F,
                fontSize: 14,
                color: "#2d3648",
              }}
            >
              اضافة فرد
            </span>
          </button>
        </div>

        {/* Filters */}

        <div className="flex items-end gap-4 flex-wrap px-5 py-4 border-b border-[#eff0f6]">
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
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                style={{
                  ...F,
                  fontSize: 16,
                  color: "#4a5468",
                }}
              />
            </div>
          </div>

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
        </div>

        {/* Table */}

        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[760px]"
            dir="rtl"
          >
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
                    <div className="flex items-center gap-1 justify-start">
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
                    className={`
                      border-b border-[#eaecf0]
                      ${
                        idx % 2 === 0
                          ? "bg-white"
                          : "bg-[#fafbff]"
                      }
                      hover:bg-[#f5f6fb]
                      transition-colors
                    `}
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
  <span
    style={{
      ...F,
      fontSize: 14,
      color: "#2d3648",
      whiteSpace: "nowrap",
    }}
  >
    {row.dischargeDate}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}

        <div className="flex items-center justify-between px-5 py-3 bg-[#fafbff] border-t border-[#eff0f6] flex-wrap gap-2">
         

          <div>
            <span
              style={{
                ...F,
                fontSize: 14,
                color: "#a0abc0",
              }}
            >
              التاريخ:{" "}
            </span>

            <span
              style={{
                ...F,
                fontSize: 14,
                color: "#4a5468",
              }}
            >
              {new Date().toLocaleString("ar-EG")}
            </span>
          </div>

          <div>
            <span
              style={{
                ...F,
                fontSize: 14,
                color: "#a0abc0",
              }}
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