import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Calendar,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ============================================================
// Types
// ============================================================

type Category = "الكل" | "ضباط صف" | "جنود";

type ReportType =
  | "unit-force"
  | "all-outsiders"
  | "attached-outside-unit"
  | "unit-outsiders"
  | "attached-to-unit";

interface ReportCard {
  id: ReportType;
  title: string;
  desc: string;
}

interface Unit {
  id: string;
  name: string;
  code: string | null;
  unit_type: string | null;
}

interface Personnel {
  id: string;
  military_number: string;
  full_name: string;

  rank: {
    id: string;
    name: string;
    code: string;
    sort_order: number;
  } | null;

  category: {
    id: string;
    name: string;
    code: string;
  } | null;

  service_status: {
    id: string;
    name: string;
    code: string;
  } | null;

  primary_unit: {
    id: string;
    name: string;
    unit_type: string | null;
  } | null;

  attachment_unit: {
    id: string;
    name: string;
    unit_type: string | null;
  } | null;

  discharge_date: string | null;
  is_active: boolean | null;
}

interface ReportConfig {
  unitId: string;
  unitName: string;
  category: Category;
  excludeBatch: boolean;
  dischargeDate: string;
  reportType?: ReportType;
}

// ============================================================
// Constants
// ============================================================

const REPORT_TYPES: ReportCard[] = [
  {
    id: "unit-force",
    title: "يومية عددية بقوة الوحدة",
    desc: "إجمالي القوة والخوارج داخل الوحدة المحددة",
  },
  {
    id: "all-outsiders",
    title: "يومية عددية بخوارج الوحدات",
    desc: "بيان عددي بالخوارج على مستوى جميع الوحدات الأساسية",
  },
  {
    id: "attached-outside-unit",
    title: "كشف الأفراد الملحقين خارج وحدة",
    desc: "كشف تفصيلي للأفراد الملحقين خارج وحدتهم الأساسية",
  },
  {
    id: "unit-outsiders",
    title: "يومية عددية بخوارج وحدة",
    desc: "بيان بأماكن الخوارج من الوحدة المحددة",
  },
  {
    id: "attached-to-unit",
    title: "كشف الأفراد الملحقين على وحدة",
    desc: "كشف الأفراد الملحقين من خارج الوحدة المحددة",
  },
];

const CATEGORY_RANKS = {
  soldiers: ["SOLDIER"],
  nco: [
    "CORPORAL",
    "SERGANT",
    "STAFF_SERGANT",
    "ASSISTANT",
    "FIRST_ASSISTANT",
  ],
};

// ============================================================
// Helpers
// ============================================================

function isSoldier(person: Personnel) {
  return person.rank?.code === "SOLDIER";
}

function isNco(person: Personnel) {
  return CATEGORY_RANKS.nco.includes(
    person.rank?.code ?? ""
  );
}

function matchesCategory(
  person: Personnel,
  category: Category
) {
  if (category === "الكل") return true;

  if (category === "جنود") {
    return isSoldier(person);
  }

  return isNco(person);
}

function formatDate(date: string | null) {
  if (!date) return "-";

  const [year, month, day] = date.split("-");

  return `${day}-${month}-${year}`;
}

function formatNow() {
  return new Date().toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// Stepper
// ============================================================

const STEPS = [
  "اختيار اليومية",
  "إعدادات اليومية",
  "العرض والطباعة",
];

function DailyStepper({
  step,
}: {
  step: 1 | 2 | 3;
}) {
  return (
    <div
      className="flex items-start justify-center gap-0 w-full"
      dir="rtl"
    >
      {[1, 2, 3].map((n, idx) => {
        const done = step > n;
        const active = step === n;

        return (
          <div
            key={n}
            className="flex items-start"
          >
            <div
              className="flex flex-col items-center"
              style={{ width: 90 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                style={{
                  borderColor: done
                    ? "#00b867"
                    : "#a1aebe",
                  background: done
                    ? "#00b867"
                    : "#fff",
                }}
              >
                {done ? (
                  <CheckCircle2
                    size={16}
                    color="#fff"
                  />
                ) : (
                  <span
                    style={{
                      ...F,
                      fontSize: 13,
                      color: "#a1aebe",
                    }}
                  >
                    0{n}
                  </span>
                )}
              </div>

              <p
                className="mt-2 text-center whitespace-nowrap"
                style={{
                  ...F,
                  fontSize: 13,
                  color: done
                    ? "#00b867"
                    : active
                    ? "#121212"
                    : "#a1aebe",
                }}
              >
                {STEPS[idx]}
              </p>
            </div>

            {idx < 2 && (
              <div
                className="flex items-center mt-4"
                style={{ width: 90 }}
              >
                <div className="flex items-center gap-1 w-full justify-center">
                  {Array.from({ length: 8 }).map(
                    (_, i) => (
                      <span
                        key={i}
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{
                          background:
                            step > n
                              ? "#00b867"
                              : "#a1aebe",
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Step 1
// ============================================================

function Step1({
  onSelect,
}: {
  onSelect: (card: ReportCard) => void;
}) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full"
      dir="rtl"
    >
      {REPORT_TYPES.map((card) => (
        <div
          key={card.id}
          className="bg-white rounded-[16px] border border-[#eff0f6] p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
        >
          <p
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 17,
              color: "#2d3648",
            }}
          >
            {card.title}
          </p>

          <p
            style={{
              ...F,
              fontSize: 13,
              color: "#717d96",
              lineHeight: 1.8,
            }}
          >
            {card.desc}
          </p>

          <button
            type="button"
            onClick={() => onSelect(card)}
            style={{
              ...F,
              fontSize: 13,
              color: "#00b867",
              fontWeight: 700,
              textAlign: "left",
            }}
            className="hover:underline"
          >
            إنشاء اليومية
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Dropdown
// ============================================================

function SimpleDropdown({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-[54px] bg-white border border-[#e2e7f0] rounded-[8px] flex items-center gap-2 px-3 hover:border-[#a0aec0] transition-colors"
        dir="rtl"
      >
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#2d3648] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />

        <span
          className="flex-1 text-right"
          style={{
            ...F,
            fontSize: 16,
            color: value
              ? "#2d3648"
              : "#4a5468",
          }}
        >
          {value || placeholder || "اختر"}
        </span>
      </button>

      {open && (
        <ul
          className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden max-h-[280px] overflow-y-auto"
          dir="rtl"
        >
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={[
                  "w-full text-right px-4 py-3 transition-colors",
                  opt.value === value
                    ? "bg-[#f0f2fd] text-[#1f3d97]"
                    : "hover:bg-[#f5f6fb] text-[#2d3648]",
                ].join(" ")}
                style={{
                  ...F,
                  fontSize: 15,
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// Step 2
// ============================================================

function Step2({
  reportTitle,
  units,
  onNext,
}: {
  reportTitle: string;
  units: Unit[];
  onNext: (cfg: ReportConfig) => void;
}) {
  const [unitId, setUnitId] = useState("");
  const [category, setCategory] =
    useState<Category>("الكل");

  const [excludeBatch, setExcludeBatch] =
    useState(false);

  const [dischargeDate, setDischargeDate] =
    useState("");

  const selectedUnit = units.find(
    (u) => u.id === unitId
  );

  // ==========================================================
  // تحديد الوحدات التي ستظهر في Dropdown
  //
  // جميع الوحدات في الحالات التالية:
  //
  // 1. يومية عددية بقوة الوحدة
  // 2. كشف الأفراد الملحقين على وحدة
  //
  // باقي اليوميات:
  // MAIN فقط
  // ==========================================================

  const shouldShowAllUnits =
    reportTitle ===
      "يومية عددية بقوة الوحدة" ||
    reportTitle ===
      "كشف الأفراد الملحقين على وحدة";

  const availableUnits = shouldShowAllUnits
    ? units
    : units.filter(
        (unit) => unit.unit_type === "MAIN"
      );

  const unitOptions = availableUnits.map(
    (u) => ({
      value: u.id,
      label: u.name,
    })
  );

  // ==========================================================
  // عند تغيير نوع اليومية
  // لو الوحدة الحالية لم تعد موجودة في القائمة
  // يتم إلغاء اختيارها
  // ==========================================================

  function handleUnitChange(id: string) {
    setUnitId(id);
  }

  // ==========================================================
  // Submit
  // ==========================================================

  function handleSubmit() {
    if (!selectedUnit) {
      alert("برجاء اختيار الوحدة");
      return;
    }

    // ========================================================
    // التأكد أن الوحدة المختارة مسموح بها لهذه اليومية
    // ========================================================

    if (
      !shouldShowAllUnits &&
      selectedUnit.unit_type !== "MAIN"
    ) {
      alert(
        "هذه اليومية متاحة للوحدات الرئيسية فقط"
      );
      return;
    }

    if (excludeBatch && !dischargeDate) {
      alert("برجاء اختيار تاريخ التسريح");
      return;
    }

    onNext({
      unitId: selectedUnit.id,
      unitName: selectedUnit.name,
      category,
      excludeBatch,
      dischargeDate,
    });
  }

  return (
    <div
      className="bg-white rounded-[20px] border border-[#eff0f6] w-full max-w-xl mx-auto p-6 flex flex-col gap-5"
      dir="rtl"
    >
      {/* ======================================================
          Report Title
         ====================================================== */}

      <p
        className="text-center"
        style={{
          ...F,
          fontSize: 15,
          color: "#717d96",
          fontWeight: 700,
        }}
      >
        {reportTitle}
      </p>

      {/* ======================================================
          Unit Dropdown
         ====================================================== */}

      <div className="flex flex-col gap-2">
        <label
          style={{
            ...F,
            fontSize: 15,
            color: "#2d3648",
            fontWeight: 700,
          }}
        >
          اختيار الوحدة
        </label>

        <SimpleDropdown
          value={selectedUnit?.name ?? ""}
          options={unitOptions}
          onChange={handleUnitChange}
          placeholder="اختر الوحدة"
        />
      </div>

      {/* ======================================================
          Category
         ====================================================== */}

      <div className="flex flex-col gap-2">
        <label
          style={{
            ...F,
            fontSize: 15,
            color: "#2d3648",
            fontWeight: 700,
          }}
        >
          اختيار الفئة
        </label>

        <div
          className="flex items-center rounded-[8px] border border-[#e2e7f0] overflow-hidden h-[48px]"
          dir="rtl"
        >
          {(
            [
              "الكل",
              "ضباط صف",
              "جنود",
            ] as Category[]
          ).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className="flex-1 h-full flex items-center justify-center transition-all"
              style={{
                ...F,
                fontSize: 15,
                color:
                  category === cat
                    ? "#fff"
                    : "#2d3648",

                background:
                  category === cat
                    ? "linear-gradient(to bottom, #00b867, #00522e)"
                    : "#fff",

                borderRight:
                  cat !== "جنود"
                    ? "1px solid #e2e7f0"
                    : "none",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================
          Exclude Batch
         ====================================================== */}

      <div className="flex items-center gap-2 justify-start">
        <input
          id="excludeBatch"
          type="checkbox"
          checked={excludeBatch}
          onChange={(e) => {
            const checked = e.target.checked;

            setExcludeBatch(checked);

            if (!checked) {
              setDischargeDate("");
            }
          }}
          className="w-4 h-4 accent-[#00b867]"
        />

        <label
          htmlFor="excludeBatch"
          style={{
            ...F,
            fontSize: 15,
            color: "#2d3648",
          }}
        >
          استثناء دفعة رديف
        </label>
      </div>

      {/* ======================================================
          Discharge Date
         ====================================================== */}

      <div className="relative w-full">
        <input
          type="date"
          value={dischargeDate}
          onChange={(e) =>
            setDischargeDate(e.target.value)
          }
          disabled={!excludeBatch}
          className={`w-full h-[54px] border rounded-[8px] px-3 text-right outline-none transition-colors ${
            excludeBatch
              ? "bg-white border-[#e2e7f0] focus:border-[#00b867]"
              : "bg-gray-100 border-gray-300 cursor-not-allowed"
          }`}
          style={{
            ...F,
            fontSize: 15,
            color: excludeBatch
              ? "#2d3648"
              : "#9ca3af",
            direction: "rtl",
          }}
        />

        <Calendar
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1aebe] pointer-events-none"
        />
      </div>

      {/* ======================================================
          Preview Button
         ====================================================== */}

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full h-[52px] rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90"
        style={{
          background:
            "linear-gradient(to bottom, #00b867, #00522e)",
        }}
      >
        <span
          style={{
            ...F,
            fontSize: 16,
            color: "#fff",
          }}
        >
          معاينة اليومية
        </span>
      </button>
    </div>
  );
}
// ============================================================
// Report Header
// ============================================================

function ReportHeader({
  title,
  config,
}: {
  title: string;
  config: ReportConfig;
}) {
  return (
    <div
      className="bg-white rounded-[20px] border border-[#eff0f6] w-full p-5 flex flex-col gap-3 report-print-header"
      dir="rtl"
    >
      <div className="flex items-center justify-start">
        <p
          style={{
            ...F,
            fontSize: 18,
            color: "#2d3648",
            fontWeight: 700,
          }}
        >
          {title}
        </p>
      </div>

      <div className="w-full h-px bg-[#eff0f6]" />

      <div className="flex flex-wrap gap-x-8 gap-y-2 items-center justify-start">
        <div className="flex items-center gap-1.5">
          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#717d96",
            }}
          >
            اسم الوحدة:
          </span>

          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#2d3648",
              fontWeight: 700,
            }}
          >
            {config.unitName}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#717d96",
            }}
          >
            فئة الأفراد:
          </span>

          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#2d3648",
            }}
          >
            {config.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#717d96",
            }}
          >
            استثناء دفعة رديف:
          </span>

          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#2d3648",
            }}
          >
            {config.excludeBatch
              ? `يوجد - ${formatDate(
                  config.dischargeDate
                )}`
              : "لا يوجد"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#717d96",
            }}
          >
            تاريخ الإصدار:
          </span>

          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#2d3648",
            }}
          >
            {formatNow()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Table Styles
// ============================================================

const TH_CLASS =
  "px-5 py-3 text-right border border-[#dde3ef] bg-[#f7f9fc]";

const TD_CLASS =
  "px-5 py-3 text-center border border-[#dde3ef]";

function TableText({
  children,
  bold = false,
}: {
  children: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <span
      style={{
        ...F,
        fontSize: 14,
        color: "#2d3648",
        fontWeight: bold ? 700 : 400,
      }}
    >
      {children}
    </span>
  );
}

// ============================================================
// Report 1
// يومية عددية بقوة الوحدة
// ============================================================

function UnitForceReport({
  people,
  config,
}: {
  people: Personnel[];
  config: ReportConfig;
}) {
  const unitPeople = people.filter(
    (p) =>
      p.primary_unit?.id === config.unitId
  );

  const filtered = unitPeople.filter((p) =>
    matchesCategory(p, config.category)
  );

  const soldiers = filtered.filter(isSoldier);

  const nco = filtered.filter(isNco);

  const outsiders = filtered.filter(
    (p) =>
      p.primary_unit?.id === config.unitId &&
      p.service_status?.code === "ATTACHED" &&
      !!p.attachment_unit?.id
  );

  const soldierOutsiders =
    outsiders.filter(isSoldier);

  const ncoOutsiders =
    outsiders.filter(isNco);

  const rows = [
    {
      label: "جنود",
      force: soldiers.length,
      outsiders: soldierOutsiders.length,
    },
    {
      label: "ضباط صف",
      force: nco.length,
      outsiders: ncoOutsiders.length,
    },
  ].filter((r) => {
    if (config.category === "جنود") {
      return r.label === "جنود";
    }

    if (config.category === "ضباط صف") {
      return r.label === "ضباط صف";
    }

    return true;
  });

  const totalForce = rows.reduce(
    (sum, row) => sum + row.force,
    0
  );

  const totalOutsiders = rows.reduce(
    (sum, row) => sum + row.outsiders,
    0
  );

  const totalRemaining =
    totalForce - totalOutsiders;

  return (
    <ReportTableWrapper>
      <table className="w-full min-w-[600px] border-collapse">
        <thead>
          <tr>
            {[
              "البيان",
              "قوة",
              "خوارج",
              "متبقي",
            ].map((h) => (
              <th
                key={h}
                className={TH_CLASS}
                style={{
                  ...F,
                  fontSize: 14,
                  color: "#717d96",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className={TH_CLASS}>
                <TableText>
                  {row.label}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {row.force}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {row.outsiders}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {row.force -
                    row.outsiders}
                </TableText>
              </td>
            </tr>
          ))}

          <tr className="bg-[#f7f9fc]">
            <td className={TH_CLASS}>
              <TableText bold>
                إجمالي
              </TableText>
            </td>

            <td className={TD_CLASS}>
              <TableText bold>
                {totalForce}
              </TableText>
            </td>

            <td className={TD_CLASS}>
              <TableText bold>
                {totalOutsiders}
              </TableText>
            </td>

            <td className={TD_CLASS}>
              <TableText bold>
                {totalRemaining}
              </TableText>
            </td>
          </tr>
        </tbody>
      </table>
    </ReportTableWrapper>
  );
}

// ============================================================
// Report 2
// يومية عددية بخوارج الوحدات
// ============================================================

function AllUnitsOutsidersReport({
  units,
  people,
  config,
}: {
  units: Unit[];
  people: Personnel[];
  config: ReportConfig;
}) {
  const rows = units
    .filter(
      (unit) => unit.unit_type === "MAIN"
    )
    .map((unit) => {
      const unitPeople = people.filter(
        (person) =>
          person.primary_unit?.id === unit.id
      );

      const soldierForce =
        unitPeople.filter(isSoldier);

      const ncoForce =
        unitPeople.filter(isNco);

      const outsiders = unitPeople.filter(
        (person) =>
          person.service_status?.code ===
            "ATTACHED" &&
          !!person.attachment_unit?.id
      );

      const soldierOutsiders =
        outsiders.filter(isSoldier);

      const ncoOutsiders =
        outsiders.filter(isNco);

      return {
        unit,

        soldierForce:
          soldierForce.length,

        ncoForce:
          ncoForce.length,

        soldierOutside:
          soldierOutsiders.length,

        ncoOutside:
          ncoOutsiders.length,

        soldierRemaining:
          soldierForce.length -
          soldierOutsiders.length,

        ncoRemaining:
          ncoForce.length -
          ncoOutsiders.length,
      };
    });

  const totals = rows.reduce(
    (acc, row) => ({
      soldierForce:
        acc.soldierForce +
        row.soldierForce,

      ncoForce:
        acc.ncoForce +
        row.ncoForce,

      soldierOutside:
        acc.soldierOutside +
        row.soldierOutside,

      ncoOutside:
        acc.ncoOutside +
        row.ncoOutside,

      soldierRemaining:
        acc.soldierRemaining +
        row.soldierRemaining,

      ncoRemaining:
        acc.ncoRemaining +
        row.ncoRemaining,
    }),
    {
      soldierForce: 0,
      ncoForce: 0,
      soldierOutside: 0,
      ncoOutside: 0,
      soldierRemaining: 0,
      ncoRemaining: 0,
    }
  );

  return (
    <ReportTableWrapper>
      <table className="w-full min-w-[1100px] border-collapse">
        <thead>
          <tr>
            <th
              rowSpan={2}
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                الوحدة
              </TableText>
            </th>

            <th
              colSpan={2}
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                القوة
              </TableText>
            </th>

            <th
              colSpan={2}
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                الخوارج
              </TableText>
            </th>

            <th
              colSpan={2}
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                المتبقي
              </TableText>
            </th>
          </tr>

          <tr>
            <th className={`${TH_CLASS} text-center`}>
              <TableText>
                جنود
              </TableText>
            </th>

            <th className={`${TH_CLASS} text-center`}>
              <TableText>
                ضباط صف
              </TableText>
            </th>

            <th className={`${TH_CLASS} text-center`}>
              <TableText>
                جنود
              </TableText>
            </th>

            <th className={`${TH_CLASS} text-center`}>
              <TableText>
                ضباط صف
              </TableText>
            </th>

            <th className={`${TH_CLASS} text-center`}>
              <TableText>
                جنود
              </TableText>
            </th>

            <th className={`${TH_CLASS} text-center`}>
              <TableText>
                ضباط صف
              </TableText>
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.unit.id}>
              <td className={TH_CLASS}>
                <TableText>
                  {row.unit.name}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {config.category ===
                  "ضباط صف"
                    ? 0
                    : row.soldierForce}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {config.category ===
                  "جنود"
                    ? 0
                    : row.ncoForce}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {config.category ===
                  "ضباط صف"
                    ? 0
                    : row.soldierOutside}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {config.category ===
                  "جنود"
                    ? 0
                    : row.ncoOutside}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {config.category ===
                  "ضباط صف"
                    ? 0
                    : row.soldierRemaining}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {config.category ===
                  "جنود"
                    ? 0
                    : row.ncoRemaining}
                </TableText>
              </td>
            </tr>
          ))}

          <tr className="bg-[#f7f9fc]">
            <td className={TH_CLASS}>
              <TableText bold>
                إجمالي
              </TableText>
            </td>

            <td className={TD_CLASS}>
              <TableText bold>
                {config.category === "ضباط صف"
                  ? 0
                  : totals.soldierForce}
              </TableText>
            </td>

            <td className={TD_CLASS}>
              <TableText bold>
                {config.category === "جنود"
                  ? 0
                  : totals.ncoForce}
              </TableText>
            </td>

            <td className={TD_CLASS}>
              <TableText bold>
                {config.category === "ضباط صف"
                  ? 0
                  : totals.soldierOutside}
              </TableText>
            </td>

            <td className={TD_CLASS}>
              <TableText bold>
                {config.category === "جنود"
                  ? 0
                  : totals.ncoOutside}
              </TableText>
            </td>

            <td className={TD_CLASS}>
              <TableText bold>
                {config.category === "ضباط صف"
                  ? 0
                  : totals.soldierRemaining}
              </TableText>
            </td>

            <td className={TD_CLASS}>
              <TableText bold>
                {config.category === "جنود"
                  ? 0
                  : totals.ncoRemaining}
              </TableText>
            </td>
          </tr>
        </tbody>
      </table>
    </ReportTableWrapper>
  );
}

// ============================================================
// Report 3
// كشف الأفراد الملحقين خارج وحدة
// ============================================================

function AttachedOutsideUnitReport({
  people,
  config,
}: {
  people: Personnel[];
  config: ReportConfig;
}) {
  const rows = people.filter(
    (person) =>
      person.primary_unit?.id ===
        config.unitId &&
      person.service_status?.code ===
        "ATTACHED" &&
      !!person.attachment_unit?.id &&
      matchesCategory(
        person,
        config.category
      )
  );

  return (
    <ReportTableWrapper>
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr>
            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                م
              </TableText>
            </th>

            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                الرقم العسكري
              </TableText>
            </th>

            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                الدرجة
              </TableText>
            </th>

            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                الاسم
              </TableText>
            </th>

            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                جهة الإلحاق
              </TableText>
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((person, index) => (
            <tr key={person.id}>
              <td className={TD_CLASS}>
                <TableText>
                  {index + 1}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {person.military_number}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {person.rank?.name ?? "-"}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {person.full_name}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {person.attachment_unit?.name ??
                    "-"}
                </TableText>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <EmptyRow colSpan={5} />
          )}
        </tbody>
      </table>
    </ReportTableWrapper>
  );
}

// ============================================================
// Report 4
// يومية عددية بخوارج وحدة
// ============================================================

function UnitOutsidersReport({
  people,
  config,
}: {
  people: Personnel[];
  config: ReportConfig;
}) {
  const attachedPeople = people.filter(
    (person) =>
      person.primary_unit?.id ===
        config.unitId &&
      person.service_status?.code ===
        "ATTACHED" &&
      !!person.attachment_unit?.id &&
      matchesCategory(
        person,
        config.category
      )
  );

  const grouped = new Map<
    string,
    {
      unit: Unit;
      soldiers: number;
      nco: number;
    }
  >();

  attachedPeople.forEach((person) => {
    const attachmentUnit =
      person.attachment_unit;

    if (!attachmentUnit?.id) {
      return;
    }

    const existing =
      grouped.get(attachmentUnit.id);

    if (existing) {
      if (isSoldier(person)) {
        existing.soldiers += 1;
      }

      if (isNco(person)) {
        existing.nco += 1;
      }

      return;
    }

    grouped.set(attachmentUnit.id, {
      unit: {
        id: attachmentUnit.id,
        name: attachmentUnit.name,
        code: null,
        unit_type:
          attachmentUnit.unit_type,
      },

      soldiers: isSoldier(person)
        ? 1
        : 0,

      nco: isNco(person)
        ? 1
        : 0,
    });
  });

  const rows = Array.from(
    grouped.values()
  );

  const totalSoldiers =
    rows.reduce(
      (sum, row) =>
        sum + row.soldiers,
      0
    );

  const totalNco =
    rows.reduce(
      (sum, row) =>
        sum + row.nco,
      0
    );

  const total =
    totalSoldiers + totalNco;

  return (
    <ReportTableWrapper>
      <table className="w-full min-w-[650px] border-collapse">
        <thead>
          <tr>
            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                مكان الإلحاق
              </TableText>
            </th>

            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                جنود
              </TableText>
            </th>

            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                ضباط صف
              </TableText>
            </th>

            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                الإجمالي
              </TableText>
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.unit.id}>
              <td className={TH_CLASS}>
                <TableText>
                  {row.unit.name}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {config.category ===
                  "ضباط صف"
                    ? 0
                    : row.soldiers}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {config.category ===
                  "جنود"
                    ? 0
                    : row.nco}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {row.soldiers +
                    row.nco}
                </TableText>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <EmptyRow colSpan={4} />
          )}

          <tr className="bg-[#f7f9fc]">
            <td className={TH_CLASS}>
              <TableText bold>
                إجمالي
              </TableText>
            </td>

            <td className={TD_CLASS}>
              <TableText bold>
                {config.category ===
                "ضباط صف"
                  ? 0
                  : totalSoldiers}
              </TableText>
            </td>

            <td className={TD_CLASS}>
              <TableText bold>
                {config.category ===
                "جنود"
                  ? 0
                  : totalNco}
              </TableText>
            </td>

            <td className={TD_CLASS}>
              <TableText bold>
                {total}
              </TableText>
            </td>
          </tr>
        </tbody>
      </table>
    </ReportTableWrapper>
  );
}

// ============================================================
// Report 5
// كشف الأفراد الملحقين على وحدة
// ============================================================

function AttachedToUnitReport({
  people,
  config,
}: {
  people: Personnel[];
  config: ReportConfig;
}) {
  const rows = people.filter(
    (person) =>
      person.attachment_unit?.id ===
        config.unitId &&
      person.primary_unit?.id !==
        config.unitId &&
      person.service_status?.code ===
        "ATTACHED" &&
      matchesCategory(
        person,
        config.category
      )
  );

  return (
    <ReportTableWrapper>
      <table className="w-full min-w-[800px] border-collapse">
        <thead>
          <tr>
            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                م
              </TableText>
            </th>

            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                الرقم العسكري
              </TableText>
            </th>

            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                الدرجة
              </TableText>
            </th>

            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                الاسم
              </TableText>
            </th>

            <th
              className={`${TH_CLASS} text-center`}
            >
              <TableText bold>
                الوحدة الأساسية
              </TableText>
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((person, index) => (
            <tr key={person.id}>
              <td className={TD_CLASS}>
                <TableText>
                  {index + 1}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {person.military_number}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {person.rank?.name ?? "-"}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {person.full_name}
                </TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText>
                  {person.primary_unit?.name ??
                    "-"}
                </TableText>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <EmptyRow colSpan={5} />
          )}
        </tbody>
      </table>
    </ReportTableWrapper>
  );
}

// ============================================================
// Table Wrapper
// ============================================================

function ReportTableWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden report-print-table">
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

function EmptyRow({
  colSpan,
}: {
  colSpan: number;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="text-center py-8 border border-[#dde3ef]"
      >
        <TableText>
          لا توجد بيانات
        </TableText>
      </td>
    </tr>
  );
}

// ============================================================
// Step 3
// ============================================================

function Step3({
  reportTitle,
  config,
  units,
  people,
}: {
  reportTitle: string;
  config: ReportConfig;
  units: Unit[];
  people: Personnel[];
}) {
  function renderReport() {
    switch (config.reportType) {
      case "unit-force":
        return (
          <UnitForceReport
            people={people}
            config={config}
          />
        );

      case "all-outsiders":
        return (
          <AllUnitsOutsidersReport
            units={units}
            people={people}
            config={config}
          />
        );

      case "attached-outside-unit":
        return (
          <AttachedOutsideUnitReport
            people={people}
            config={config}
          />
        );

      case "unit-outsiders":
        return (
          <UnitOutsidersReport
            people={people}
            config={config}
          />
        );

      case "attached-to-unit":
        return (
          <AttachedToUnitReport
            people={people}
            config={config}
          />
        );

      default:
        return null;
    }
  }

  return (
    <div
      id="daily-report-print-area"
      className="flex flex-col gap-5 w-full"
      dir="rtl"
    >
      <ReportHeader
        title={reportTitle}
        config={config}
      />

      {renderReport()}

      <button
        type="button"
        onClick={() => window.print()}
        className="w-full h-[52px] rounded-[8px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 no-print"
        style={{
          background:
            "linear-gradient(to bottom, #00b867, #00522e)",
        }}
      >
        <Printer
          size={18}
          style={{ color: "#fff" }}
        />

        <span
          style={{
            ...F,
            fontSize: 16,
            color: "#fff",
          }}
        >
          طباعة اليومية
        </span>
      </button>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export function DailyReportsPage() {
  const [step, setStep] =
    useState<1 | 2 | 3>(1);

  const [selectedCard, setSelectedCard] =
    useState<ReportCard | null>(null);

  const [reportConfig, setReportConfig] =
    useState<ReportConfig | null>(null);

  const [units, setUnits] =
    useState<Unit[]>([]);

  const [people, setPeople] =
    useState<Personnel[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================================
  // Load Data
  // ==========================================================

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      // --------------------------------------------------------
      // تحميل جميع الوحدات النشطة
      //
      // مهم:
      // لا نقوم بفلترة MAIN هنا.
      //
      // لأن كشف الأفراد الملحقين على وحدة
      // يحتاج إلى جميع أنواع الوحدات.
      //
      // الفلترة تتم فقط داخل Dropdown حسب اليومية.
      // --------------------------------------------------------

      const {
        data: unitData,
        error: unitError,
      } = await supabase
        .from("units")
        .select(
          "id, name, code, unit_type"
        )
        .eq("is_active", true)
        .order("name", {
          ascending: true,
        });

      if (unitError) {
        throw unitError;
      }

      const loadedUnits =
        (unitData ?? []) as Unit[];

      setUnits(loadedUnits);

      // --------------------------------------------------------
      // Personnel
      // --------------------------------------------------------

      const {
        data: personnelData,
        error: personnelError,
      } = await supabase
        .from("personnel")
        .select(`
          id,
          military_number,
          full_name,
          discharge_date,
          is_active,

          rank:ranks(
            id,
            name,
            code,
            sort_order
          ),

          category:personnel_categories(
            id,
            name,
            code
          ),

          service_status:service_statuses(
            id,
            name,
            code
          ),

          primary_unit:units!personnel_primary_unit_id_fkey(
            id,
            name,
            unit_type
          ),

          attachment_unit:units!personnel_attachment_unit_id_fkey(
            id,
            name,
            unit_type
          )
        `)
        .eq("is_active", true);

      if (personnelError) {
        throw personnelError;
      }

      setPeople(
        (personnelData ??
          []) as unknown as Personnel[]
      );
    } catch (err: any) {
      console.error(
        "Daily reports loading error:",
        err
      );

      setError(
        err?.message ||
          "حدث خطأ أثناء تحميل بيانات اليوميات"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // Apply General Report Filters
  // ==========================================================

  const filteredPeople = useMemo(() => {
    if (!reportConfig) {
      return people;
    }

    return people.filter((person) => {
      // Category
      if (
        !matchesCategory(
          person,
          reportConfig.category
        )
      ) {
        return false;
      }

      // Exclude discharge batch
      if (
        reportConfig.excludeBatch &&
        reportConfig.dischargeDate &&
        isSoldier(person) &&
        person.discharge_date ===
          reportConfig.dischargeDate
      ) {
        return false;
      }

      return true;
    });
  }, [people, reportConfig]);

  // ==========================================================
  // Select Report
  // ==========================================================

  function handleSelectCard(
    card: ReportCard
  ) {
    setSelectedCard(card);
    setReportConfig(null);
    setStep(2);
  }

  // ==========================================================
  // Settings
  // ==========================================================

  function handleSettings(
    cfg: ReportConfig
  ) {
    setReportConfig({
      ...cfg,
      reportType:
        selectedCard?.id ??
        "unit-force",
    });

    setStep(3);
  }

  // ==========================================================
  // Loading
  // ==========================================================

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
          جاري تحميل بيانات اليوميات...
        </span>
      </div>
    );
  }

  // ==========================================================
  // Error
  // ==========================================================

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full min-h-[400px] gap-4"
        dir="rtl"
      >
        <span
          style={{
            ...F,
            fontSize: 17,
            color: "#e34040",
            textAlign: "center",
          }}
        >
          {error}
        </span>

        <button
          type="button"
          onClick={loadData}
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

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      className="flex flex-col gap-6 w-full pb-10"
      dir="rtl"
    >
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }

            #daily-report-print-area,
            #daily-report-print-area * {
              visibility: visible !important;
            }

            #daily-report-print-area {
              position: absolute !important;
              right: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              padding: 20px !important;
            }

            .no-print {
              display: none !important;
            }

            .report-print-header,
            .report-print-table {
              border: 1px solid #eff0f6 !important;
              box-shadow: none !important;
            }

            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }

            th,
            td {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>

      {/* Title */}

      <h1
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize:
            "clamp(22px,4vw,32px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        اليوميات
      </h1>

      {/* Stepper */}

      <div className="flex justify-center">
        <DailyStepper step={step} />
      </div>

      {/* Step 1 */}

      {step === 1 && (
        <Step1
          onSelect={handleSelectCard}
        />
      )}

      {/* Step 2 */}

      {step === 2 &&
        selectedCard && (
          <Step2
            reportTitle={
              selectedCard.title
            }
            units={units}
            reportType={selectedCard.id}
            onNext={handleSettings}
          />
        )}

      {/* Step 3 */}

      {step === 3 &&
        selectedCard &&
        reportConfig && (
          <Step3
            reportTitle={
              selectedCard.title
            }
            config={reportConfig}
            units={units}
            people={filteredPeople}
          />
        )}
    </div>
  );
} 