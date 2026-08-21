import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Calendar,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { fetchAllRows } from "../../lib/supabase";

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
const RANK_ORDER = [
  "مساعد اول",
  "مساعد",
  "رقيب اول",
  "رقيب",
  "عريف",
  "جندى",
];
const ALL_OUTSIDERS_UNIT_ORDER = [
  "قيادة المجموعة 127 صاعقة",
  "كتيبة 33 صاعقة",
  "كتيبة 43 صاعقة",
  "كتيبة 53 صاعقة",
  "كتيبة 103 صاعقة",

  "قيادة المجموعة 129 صاعقة",
  "كتيبة 13 صاعقة",
  "كتيبة 23 صاعقة",
  "كتيبة 83 صاعقة",
  "كتيبة 113 صاعقة",

  "قيادة المجموعة 145 صاعقة",
  "كتيبة 63 صاعقة",
  "كتيبة 93 صاعقة",
  "كتيبة 73 صاعقة",
  "كتيبة 143 صاعقة",

  "قيادة المجموعة 101 صاعقة",
  "كتيبة 11 صاعقة",
  "كتيبة 21 صاعقة",
  "كتيبة 31 صاعقة",
  "كتيبة 41 صاعقة",

  "قياده مجموعه العمليات الخاصه",
  "الوحدة 777 قتال",
  "الوحدة 999 قتال",
  "كتيبة 50 صاعقة",
  "سرية العائمات",
  "فصيلة شئون مظلات",
  "سريه القياده",
  "كتيبة القيادة",
  "سرية الإيجلا",
  "كتيبة التأمين الفني",
  "ميس 4",
  "سرية 279 نقل",
  "فصيلة 121 شرطة عسكرية",
  "سرية 680 إشارة",
  "مدرسة الصاعقة",
  "فرقة الموسيقى",
  "السرية الزراعية",
  "كتيبة 49 مدفعية",
];

// ============================================================
// Helpers
//
// ✅ مصدر الحقيقة الموحّد (نفس المطبّق بالظبط في الداشبورد وتقرير
// الوحدات):
//
//   "جنود"     = فئة الفرد "مجند"  (CONSCRIPT)
//   "ضباط صف"  = فئة الفرد "متطوع" (VOLUNTEER)
//
//   خارج = وحدة أساسية موجودة + service_status = ATTACHED (ملحق)
//          + is_active = true (مفلتر بالفعل من الاستعلام)
//
// ملحوظة: التصنيف بقى بفئة الفرد مش بالرتبة، لأن "قوة" الوحدة نفسها
// بقت بتُحسب بغض النظر عن حالة الخدمة (قوة الوحدة/ملحق) — الملحق برضه
// جزء من قوة وحدته الأصلية.
// ============================================================

function isSoldier(person: Personnel) {
  return person.category?.code === "CONSCRIPT";
}

function isNco(person: Personnel) {
  return person.category?.code === "VOLUNTEER";
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

function isOutsider(person: Personnel) {
  return (
    !!person.primary_unit?.id &&
    person.service_status?.code === "ATTACHED"
  );
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
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return options;

    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query)
    );
  }, [options, search]);

  function handleSelect(value: string) {
    onChange(value);
    setSearch("");
    setOpen(false);
  }

  function handleOpen() {
    setOpen((o) => !o);
    setSearch("");
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={handleOpen}
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
            color: value ? "#2d3648" : "#4a5468",
          }}
        >
          {value || placeholder || "اختر"}
        </span>
      </button>

      {open && (
        <div
          className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden"
          dir="rtl"
        >
          <div className="p-2 border-b border-[#e2e7f0] bg-white">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearch("");
                  setOpen(false);
                }
              }}
              placeholder="اكتب جزء من اسم الوحدة..."
              className="w-full h-[44px] px-3 rounded-[7px] border border-[#e2e7f0] outline-none focus:border-[#00b867]"
              style={{
                ...F,
                fontSize: 14,
                color: "#2d3648",
              }}
            />
          </div>

          <ul className="max-h-[280px] overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.value)}
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
              ))
            ) : (
              <li
                className="px-4 py-5 text-center"
                style={{
                  ...F,
                  fontSize: 14,
                  color: "#717d96",
                }}
              >
                لا توجد وحدة مطابقة
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Step 2
// ============================================================

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
  // جميع الوحدات (بدون فلترة MAIN):
  // - كشف الأفراد الملحقين على وحدة
  //
  // باقي اليوميات (التي تعرض الدروب داون أصلًا):
  // MAIN فقط
  //
  // ملحوظة: "يومية عددية بقوة الوحدة" بقت تعرض MAIN فقط بدل كل
  // الوحدات، و"يومية عددية بخوارج الوحدات" بقت مش بتعرض دروب داون
  // خالص (شوف hideUnitDropdown تحت).
  // ==========================================================

  const shouldShowAllUnits =
    reportTitle === "كشف الأفراد الملحقين على وحدة";

  // ==========================================================
  // اليوميات التي لا تحتاج اختيار وحدة على الإطلاق
  // (يومية عددية بخوارج الوحدات: بتعرض كل الوحدات الرئيسية مرة واحدة)
  // ==========================================================

  const hideUnitDropdown =
    reportTitle === "يومية عددية بخوارج الوحدات";

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
    // لو الدروب داون مخفي (يومية عددية بخوارج الوحدات) نتخطى
    // التحقق من اختيار الوحدة تمامًا.
    if (!hideUnitDropdown) {
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
    }

    if (excludeBatch && !dischargeDate) {
      alert("برجاء اختيار تاريخ التسريح");
      return;
    }

    onNext({
      unitId: hideUnitDropdown
        ? ""
        : selectedUnit!.id,

      unitName: hideUnitDropdown
        ? "جميع الوحدات الرئيسية"
        : selectedUnit!.name,

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
          بيتخفي بالكامل لو hideUnitDropdown = true
         ====================================================== */}

      {!hideUnitDropdown && (
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
      )}

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
  "px-5 py-3 text-center border border-[#dde3ef] bg-[#f7f9fc]";

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
  // ✅ قوة الوحدة = كل الأفراد اللي وحدتهم الأساسية هي الوحدة المحددة،
  // بغض النظر عن حالتهم (قوة الوحدة أو ملحق) — الملحق برضه جزء من قوة
  // وحدته الأصلية.
  const unitPeople = people.filter(
    (p) => p.primary_unit?.id === config.unitId
  );

  const filtered = unitPeople.filter((p) =>
    matchesCategory(p, config.category)
  );

  const soldiers = filtered.filter(isSoldier);

  const nco = filtered.filter(isNco);

  const outsiders = filtered.filter(isOutsider);

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
  .filter((unit) => unit.unit_type === "MAIN")
 .sort((a, b) => {
  const indexA =
    ALL_OUTSIDERS_UNIT_ORDER.indexOf(a.name.trim());

  const indexB =
    ALL_OUTSIDERS_UNIT_ORDER.indexOf(b.name.trim());

  if (indexA === -1) return 1;
  if (indexB === -1) return -1;

  return indexA - indexB;
})
  .map((unit) => {
      // ✅ قوة كل وحدة = نفس مبدأ UnitForceReport بالظبط (كل الأفراد
      // اللي وحدتهم الأساسية هي دي، بغض النظر عن حالتهم)
      const unitPeople = people.filter(
        (person) => person.primary_unit?.id === unit.id
      );

      const soldierForce =
        unitPeople.filter(isSoldier);

      const ncoForce =
        unitPeople.filter(isNco);

      const outsiders = unitPeople.filter(isOutsider);

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
const rows = people
  .filter(
    (person) =>
      person.primary_unit?.id === config.unitId &&
      isOutsider(person) &&
      matchesCategory(person, config.category)
  )
 .sort((a, b) => {
  // المتطوعون أولًا
  const categoryA = isNco(a) ? 0 : 1;
  const categoryB = isNco(b) ? 0 : 1;

  if (categoryA !== categoryB) {
    return categoryA - categoryB;
  }

  // ثم ترتيب الدرجات
  const rankA = RANK_ORDER.indexOf(
    a.rank?.name?.trim() ?? ""
  );

  const rankB = RANK_ORDER.indexOf(
    b.rank?.name?.trim() ?? ""
  );

  if (rankA === -1) return 1;
  if (rankB === -1) return -1;

  return rankA - rankB;
})

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
            <th className={`${TH_CLASS} text-center`}>
  <TableText bold>
    تاريخ التسريح
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
              <td className={TD_CLASS}>
  <TableText>
    {isNco(person)
      ? "-"
      : formatDate(person.discharge_date)}
  </TableText>
</td>
            </tr>
          ))}

          {rows.length === 0 && (
            <EmptyRow colSpan={6} />
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
      isOutsider(person) &&
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

  const columns = Array.from(
    grouped.values()
  );

  const totalSoldiers = columns.reduce(
    (sum, col) => sum + col.soldiers,
    0
  );

  const totalNco = columns.reduce(
    (sum, col) => sum + col.nco,
    0
  );

  // ✅ القيم الفعلية لكل عمود، بعد تطبيق فلتر الفئة
  // (جنود / ضباط صف / الكل) بنفس منطق الجدول القديم
  const ncoValues = columns.map((col) =>
    config.category === "جنود" ? 0 : col.nco
  );

  const soldierValues = columns.map(
    (col) =>
      config.category === "ضباط صف"
        ? 0
        : col.soldiers
  );

  const ncoRowTotal =
    config.category === "جنود"
      ? 0
      : totalNco;

  const soldierRowTotal =
    config.category === "ضباط صف"
      ? 0
      : totalSoldiers;

  // ✅ كل وحدات الإلحاق دلوقتي في صف واحد (مفيش تقسيم لمجموعات)
  // مع تقليل عرض كل عمود لأقل ما يمكن، لأن أسماء الوحدات
  // ملفوفة عموديًا (writing-mode) فمحتاجة مساحة أفقية ضيقة جدًا بس.
  const tableColumns = columns.map((col, idx) => ({
    unit: col.unit,
    ncoValue: ncoValues[idx],
    soldierValue: soldierValues[idx],
  }));

  return (
    <ReportTableWrapper>
      <div className="overflow-x-auto">
        <div className="flex flex-col gap-4">
          {tableColumns.length === 0 ? (
            <table className="w-full min-w-[300px] border-collapse">
              <thead>
                <tr>
                  <th
                    className={`${TH_CLASS} text-center`}
                  >
                    <TableText bold>
                      اماكن الألحاق
                    </TableText>
                  </th>
                </tr>
              </thead>

              <tbody>
                <EmptyRow colSpan={1} />
              </tbody>
            </table>
          ) : (
            <table
              className="w-full border-collapse"
              style={{
                tableLayout: "fixed",
              }}
            >
              <thead>
                <tr>
                  <th
                    colSpan={
                      tableColumns.length + 2
                    }
                    className={`${TH_CLASS} text-center`}
                  >
                    <TableText bold>
                      اماكن الألحاق
                    </TableText>
                  </th>
                </tr>

                {/* ✅ رؤوس الأعمدة ملفوفة بزاوية 90 درجة
                    لتوفير مساحة أفقية كبيرة، مع عرض مضغوط لكل عمود */}
                <tr>
                  <th
                    className={`${TH_CLASS} text-center`}
                    style={{
                      width: 22,
                      height: 130,
                      padding: 2,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                      }}
                    >
                      <div
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <TableText bold>
                          البيان
                        </TableText>
                      </div>
                    </div>
                  </th>

                  {tableColumns.map(
                    (col) => (
                      <th
                        key={
                          col.unit.id
                        }
                        className={`${TH_CLASS} text-center`}
                        style={{
                          width: 22,
                          height: 130,
                          padding: 2,
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            height:
                              "100%",
                          }}
                        >
                          <div
                            style={{
                              writingMode:
                                "vertical-rl",
                              transform:
                                "rotate(180deg)",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            <TableText bold>
                              {
                                col
                                  .unit
                                  .name
                              }
                            </TableText>
                          </div>
                        </div>
                      </th>
                    )
                  )}

                  <th
                    className={`${TH_CLASS} text-center`}
                    style={{
                      width: 22,
                      height: 130,
                      padding: 2,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                      }}
                    >
                      <div
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <TableText bold>
                          الاجمالي
                        </TableText>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* صف ضباط صف */}
                <tr>
                  <td
                    className={
                      TH_CLASS
                    }
                    style={{
                      width: 22,
                      padding: 2,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <TableText bold>
                         ر.ع
                        </TableText>
                      </div>
                    </div>
                  </td>

                  {tableColumns.map(
                    (col) => (
                      <td
                        key={
                          col.unit.id
                        }
                        className={`${TD_CLASS} text-center`}
                      >
                        <TableText>
                          {
                            col.ncoValue
                          }
                        </TableText>
                      </td>
                    )
                  )}

                  <td
                    className={`${TD_CLASS} text-center`}
                  >
                    <TableText bold>
                      {
                        ncoRowTotal
                      }
                    </TableText>
                  </td>
                </tr>

                {/* صف مجند */}
                <tr>
                  <td
                    className={
                      TH_CLASS
                    }
                    style={{
                      width: 22,
                      padding: 2,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <TableText bold>
                          مجند
                        </TableText>
                      </div>
                    </div>
                  </td>

                  {tableColumns.map(
                    (col) => (
                      <td
                        key={
                          col.unit.id
                        }
                        className={`${TD_CLASS} text-center`}
                      >
                        <TableText>
                          {
                            col.soldierValue
                          }
                        </TableText>
                      </td>
                    )
                  )}

                  <td
                    className={`${TD_CLASS} text-center`}
                  >
                    <TableText bold>
                      {
                        soldierRowTotal
                      }
                    </TableText>
                  </td>
                </tr>

                {/* صف اجمالي */}
                <tr className="bg-[#f7f9fc]">
                  <td
                    className={
                      TH_CLASS
                    }
                    style={{
                      width: 22,
                      padding: 2,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <TableText bold>
                          اجمالي
                        </TableText>
                      </div>
                    </div>
                  </td>

                  {tableColumns.map(
                    (col) => (
                      <td
                        key={
                          col.unit.id
                        }
                        className={`${TD_CLASS} text-center`}
                      >
                        <TableText bold>
                          {col.ncoValue +
                            col.soldierValue}
                        </TableText>
                      </td>
                    )
                  )}

                  <td
                    className={`${TD_CLASS} text-center`}
                  >
                    <TableText bold>
                      {ncoRowTotal +
                        soldierRowTotal}
                    </TableText>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
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
const rows = people
  .filter(
    (person) =>
      person.attachment_unit?.id ===
        config.unitId &&
      person.primary_unit?.id !==
        config.unitId &&
      isOutsider(person) &&
      matchesCategory(
        person,
        config.category
      )
  )
  .sort((a, b) => {
    // المتطوعون أولًا
    const categoryA = isNco(a) ? 0 : 1;
    const categoryB = isNco(b) ? 0 : 1;

    if (categoryA !== categoryB) {
      return categoryA - categoryB;
    }

    // ثم ترتيب الدرجات
    const rankA = RANK_ORDER.indexOf(
      a.rank?.name?.trim() ?? ""
    );

    const rankB = RANK_ORDER.indexOf(
      b.rank?.name?.trim() ?? ""
    );

    // أي درجة غير موجودة في القائمة تذهب للنهاية
    if (rankA === -1 && rankB === -1) {
      return 0;
    }

    if (rankA === -1) {
      return 1;
    }

    if (rankB === -1) {
      return -1;
    }

    return rankA - rankB;
  });

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
            <th className={`${TH_CLASS} text-center`}>
  <TableText bold>
    تاريخ التسريح
  </TableText>
</th>

            <th className={`${TH_CLASS} text-center`}>
              <TableText bold>
                ملاحظات
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
              <td className={TD_CLASS}>
  <TableText>
    {isNco(person)
      ? "-"
      : formatDate(person.discharge_date)}
  </TableText>
</td>

              <td className={TD_CLASS}>
                <TableText></TableText>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <EmptyRow colSpan={7} />
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
      //
      // ✅ جلب كل صفوف الأفراد صفحة صفحة بدل استعلام واحد
      // محدود بـ1000 صف افتراضيًا من PostgREST — نفس دقة
      // الداشبورد بالظبط.
      // --------------------------------------------------------

      const personnelData = await fetchAllRows<Personnel>(
        (from, to) =>
          supabase
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
            .eq("is_active", true)
            .range(from, to)
      );

      setPeople(personnelData as unknown as Personnel[]);
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