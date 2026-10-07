import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Calendar,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { fetchAllRows } from "../../lib/supabase";
import { archiveDailyReport, buildDailyReportSnapshot } from "../../lib/dailyReportArchive";
import logoImg from "../../assets/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";
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
  | "attached-to-unit"
  | "unit-administrations"
  | "all-units-administrations"
    | "unit-administrations-names" // ✅ جديد
      | "all-units-jobs"   // ✅ جديد
  | "unit-jobs"        // ✅ جديد
  | "unit-jobs-names"; // ✅ جديد
  

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

  administration: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  // ✅ جديد
  job: {
    id: string;
    name: string;
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
  administrationIds: string[]; // فاضية = كل الإدارات
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
  {
    id: "unit-administrations",
    title: "يومية عددية لإدارات وحدة",
    desc: "بيان عددي بالإدارات داخل الوحدة المحددة",
  },
  {
    id: "all-units-administrations",
    title: "يومية عددية لإدارات جميع الوحدات",
    desc: "بيان عددي بالإدارات على مستوى جميع الوحدات",
  },
    // ✅ جديد
  {
    id: "unit-administrations-names",
    title: "كشف أسماء إدارات وحدة",
    desc: "كشف بأسماء أفراد كل إدارة داخل الوحدة المحددة",
  },
    {
    id: "all-units-jobs",
    title: "يومية عددية لوظائف جميع الوحدات",
    desc: "بيان عددي بالوظائف على مستوى جميع الوحدات",
  },
  {
    id: "unit-jobs",
    title: "يومية عددية لوظائف وحدة",
    desc: "بيان عددي بالوظائف داخل الوحدة المحددة",
  },
  {
    id: "unit-jobs-names",
    title: "كشف أسماء وظائف وحدة",
    desc: "كشف بأسماء أفراد كل وظيفة داخل الوحدة المحددة",
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
function compareByCategoryAndRank(a: Personnel, b: Personnel) {
  // المتطوعون (ضباط صف) أولًا
  const categoryA = isNco(a) ? 0 : 1;
  const categoryB = isNco(b) ? 0 : 1;

  if (categoryA !== categoryB) {
    return categoryA - categoryB;
  }

  const rankA = RANK_ORDER.indexOf(a.rank?.name?.trim() ?? "");
  const rankB = RANK_ORDER.indexOf(b.rank?.name?.trim() ?? "");

  // الدرجة غير الموجودة في القائمة تروح للآخر
  if (rankA !== rankB) {
    if (rankA === -1) return 1;
    if (rankB === -1) return -1;
    return rankA - rankB;
  }

  return a.full_name.localeCompare(b.full_name, "ar");
}
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
// الوظائف
//
// بنحوّل "الوظيفة" لمكان "الإدارة" في نسخة من الأفراد، عشان نعيد
// استخدام يوميات الإدارات (نفس التجميع والجداول). الفرد اللي مالوش
// وظيفة بيدخل مجموعة "بدون وظيفة" وبتيجي آخر حاجة، والباقي أبجديًا.
// ============================================================
const NO_JOB_ID = "__no_job__";
const NO_JOB_NAME = "بدون وظيفة";

function projectJobsAsGroups(people: Personnel[]): Personnel[] {
  const projected = people.map((person) => ({
    ...person,
    administration: {
      id: person.job?.id ?? NO_JOB_ID,
      name: person.job?.name ?? NO_JOB_NAME,
      code: null,
    },
  }));

  return projected.sort((a, b) => {
    if (a.administration.id === b.administration.id) return 0;
    if (a.administration.id === NO_JOB_ID) return 1;
    if (b.administration.id === NO_JOB_ID) return -1;

    return a.administration.name.localeCompare(
      b.administration.name,
      "ar"
    );
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
  onStepClick,
  canGoTo,
}: {
  step: 1 | 2 | 3;
  onStepClick?: (n: 1 | 2 | 3) => void;
  canGoTo?: (n: 1 | 2 | 3) => boolean;
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
              <button
              type="button"
              disabled={
                !onStepClick ||
                n === step ||
                (canGoTo ? !canGoTo(n as 1 | 2 | 3) : false)
              }
              onClick={() => onStepClick?.(n as 1 | 2 | 3)}
              title={
                onStepClick &&
                n !== step &&
                (!canGoTo || canGoTo(n as 1 | 2 | 3))
                  ? "الانتقال لهذه الخطوة"
                  : undefined
              }
              className="flex flex-col items-center bg-transparent p-0 enabled:cursor-pointer enabled:hover:opacity-80 transition-opacity"
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
            </button>

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
  disabled = false,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
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

  function handleToggleOpen() {
    if (disabled) return;
    handleOpen();
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={handleToggleOpen}
        disabled={disabled}
        className={`w-full h-[54px] border rounded-[8px] flex items-center gap-2 px-3 transition-colors ${
          disabled
            ? "bg-gray-100 border-gray-300 cursor-not-allowed"
            : "bg-white border-[#e2e7f0] hover:border-[#a0aec0]"
        }`}
        dir="rtl"
      >
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform ${
            disabled ? "text-gray-400" : "text-[#2d3648]"
          } ${open ? "rotate-180" : ""}`}
        />

        <span
          className="flex-1 text-right"
          style={{
            ...F,
            fontSize: 16,
            color: disabled
              ? "#9ca3af"
              : value
              ? "#2d3648"
              : "#4a5468",
          }}
        >
          {value || placeholder || "اختر"}
        </span>
      </button>

      {open && !disabled && (
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
              placeholder="اكتب جزء من السنة او الشهر..."
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

function Step2({
  reportTitle,
  units,
  onNext,
  initial,
  onDraftChange,
}: {
  reportTitle: string;
  units: Unit[];
  onNext: (cfg: ReportConfig) => void;
  initial?: ReportConfig | null;
  onDraftChange?: (cfg: ReportConfig) => void;
}) {
  const [unitId, setUnitId] = useState(initial?.unitId ?? "");
  const [category, setCategory] = useState<Category>(
    initial?.category ?? "الكل"
  );

  const [excludeBatch, setExcludeBatch] = useState(
    initial?.excludeBatch ?? false
  );

  const [dischargeDate, setDischargeDate] = useState(
    initial?.dischargeDate ?? ""
  );

  // ✅ دفعات الرديف — تُجلب من قاعدة البيانات بدل إدخال تاريخ حر
  const [batchOptions, setBatchOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [loadingBatches, setLoadingBatches] =
    useState(true);

  useEffect(() => {
    async function loadBatches() {
      try {
        setLoadingBatches(true);

        const { data, error } = await supabase
          .from("reserve_batches")
          .select("id, batch_date, name")
          .eq("is_active", true)
          .order("batch_date", { ascending: true });

        if (error) throw error;

        const options = (data ?? []).map((batch) => ({
          value: batch.batch_date,
          label:
            batch.name ||
            formatDate(batch.batch_date),
        }));

        setBatchOptions(options);
      } catch (err) {

      } finally {
        setLoadingBatches(false);
      }
    }

    void loadBatches();
  }, []);
  // ✅ الإدارات — لاختيار إدارات محددة في يومية "إدارات وحدة"
  const [administrationOptions, setAdministrationOptions] = useState<
    { id: string; name: string }[]
  >([]);

  const [loadingAdministrations, setLoadingAdministrations] =
    useState(true);

  const [administrationMode, setAdministrationMode] = useState<
    "all" | "specific"
  >(
    initial && initial.administrationIds.length > 0
      ? "specific"
      : "all"
  );

  const [selectedAdministrationIds, setSelectedAdministrationIds] =
    useState<string[]>(initial?.administrationIds ?? []);

  const [showAdminModal, setShowAdminModal] = useState(false);

  useEffect(() => {
    async function loadAdministrations() {
      try {
        setLoadingAdministrations(true);

        const { data, error } = await supabase
          .from("external_administrations")
          .select("id, name")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (error) throw error;

        setAdministrationOptions(data ?? []);
      } catch (err) {

      } finally {
        setLoadingAdministrations(false);
      }
    }

    void loadAdministrations();
  }, []);
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

  const isSingleUnitAdministrationsReport =
    reportTitle === "يومية عددية لإدارات وحدة";

  const isAllUnitsAdministrationsReport =
    reportTitle === "يومية عددية لإدارات جميع الوحدات";

  // ✅ جديد: السطرين دول
  const isUnitAdministrationsNamesReport =
    reportTitle === "كشف أسماء إدارات وحدة";

  const showAdministrationsSelector =
    isSingleUnitAdministrationsReport ||
    isAllUnitsAdministrationsReport ||
    isUnitAdministrationsNamesReport; // ✅ جديد: أضفت السطر ده

  // ==========================================================
  // اليوميات التي لا تحتاج اختيار وحدة على الإطلاق
  // (يومية عددية بخوارج الوحدات: بتعرض كل الوحدات الرئيسية مرة واحدة)
  // ==========================================================

  const isAllUnitsJobsReport =
    reportTitle === "يومية عددية لوظائف جميع الوحدات";

  const hideUnitDropdown =
    reportTitle === "يومية عددية بخوارج الوحدات" ||
    isAllUnitsAdministrationsReport ||
    isAllUnitsJobsReport;

  const availableUnits = (
    shouldShowAllUnits
      ? units
      : units.filter(
          (unit) => unit.unit_type === "MAIN"
        )
  ).slice().sort((a, b) => {
    const indexA = ALL_OUTSIDERS_UNIT_ORDER.indexOf(a.name.trim());
    const indexB = ALL_OUTSIDERS_UNIT_ORDER.indexOf(b.name.trim());

    // الوحدات غير الموجودة في القائمة تُرحّل لآخر الترتيب
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });

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
  // ✅ أول تنفيذ للـ effect بيحصل وقت الـ mount من غير أي تغيير فعلي من
  // المستخدم، فنتجاهله عشان ما نلغيش المعاينة الموجودة بالغلط
  const isFirstRender = useRef(true);

  // ✅ أي تغيير في الإعدادات بيتحفظ في الصفحة الأب، فالرجوع للخطوة
  // بعد الانتقال بين الخطوات ما يضيّعش حاجة
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    onDraftChange?.({
      unitId,
      unitName: selectedUnit?.name ?? "",
      category,
      excludeBatch,
      dischargeDate,
      administrationIds:
        administrationMode === "specific"
          ? selectedAdministrationIds
          : [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    unitId,
    category,
    excludeBatch,
    dischargeDate,
    administrationMode,
    selectedAdministrationIds,
  ]);

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

      administrationIds:
        showAdministrationsSelector &&
        administrationMode === "specific"
          ? selectedAdministrationIds
          : [],
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
          اختيار الإدارات — يظهر فقط في يومية إدارات الوحدة
         ====================================================== */}

      {showAdministrationsSelector && (
        <div className="flex flex-col gap-2">
          <label
            style={{
              ...F,
              fontSize: 15,
              color: "#2d3648",
              fontWeight: 700,
            }}
          >
            الإدارات المعروضة
          </label>

          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="w-full h-[54px] border border-[#e2e7f0] rounded-[8px] flex items-center justify-between px-3 bg-white hover:border-[#a0aec0]"
            dir="rtl"
          >
            <span
              style={{
                ...F,
                fontSize: 13,
                color: "#00b867",
                fontWeight: 700,
              }}
            >
              تعديل
            </span>

            <span
              style={{
                ...F,
                fontSize: 16,
                color: "#2d3648",
              }}
            >
              {administrationMode === "all"
                ? "كل الإدارات"
                : selectedAdministrationIds.length ===
                  0
                ? "لم يتم اختيار أي إدارة"
                : `${selectedAdministrationIds.length} إدارة مختارة`}
            </span>
          </button>
        </div>
      )}
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
          Discharge Date (دفعة الرديف)
          ✅ دروب داون بدل التاريخ الحر، مقفول إلا لو الشيك بوكس
          "استثناء دفعة رديف" متفعّل
         ====================================================== */}

      <div className="flex flex-col gap-2">
        <SimpleDropdown
          value={
            batchOptions.find(
              (opt) => opt.value === dischargeDate
            )?.label ?? ""
          }
          options={batchOptions}
          onChange={setDischargeDate}
          placeholder={
            loadingBatches
              ? "جاري تحميل الدفعات..."
              : "اختر دفعة الرديف"
          }
          disabled={!excludeBatch || loadingBatches}
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

      {/* ======================================================
          بوب اب اختيار الإدارات
         ====================================================== */}

      {showAdminModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4"
          dir="rtl"
          onClick={() => setShowAdminModal(false)}
        >
          <div
            className="bg-white rounded-[16px] w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#eff0f6] flex flex-col gap-4">
              <p
                style={{
                  ...F,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#2d3648",
                }}
              >
                اختيار الإدارات
              </p>

              <div
                className="flex items-center rounded-[8px] border border-[#e2e7f0] overflow-hidden h-[44px]"
                dir="rtl"
              >
                <button
                  type="button"
                  onClick={() =>
                    setAdministrationMode("all")
                  }
                  className="flex-1 h-full flex items-center justify-center transition-all"
                  style={{
                    ...F,
                    fontSize: 14,
                    color:
                      administrationMode === "all"
                        ? "#fff"
                        : "#2d3648",
                    background:
                      administrationMode === "all"
                        ? "linear-gradient(to bottom, #00b867, #00522e)"
                        : "#fff",
                    borderLeft:
                      "1px solid #e2e7f0",
                  }}
                >
                  كل الإدارات
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAdministrationMode(
                      "specific"
                    )
                  }
                  className="flex-1 h-full flex items-center justify-center transition-all"
                  style={{
                    ...F,
                    fontSize: 14,
                    color:
                      administrationMode ===
                      "specific"
                        ? "#fff"
                        : "#2d3648",
                    background:
                      administrationMode ===
                      "specific"
                        ? "linear-gradient(to bottom, #00b867, #00522e)"
                        : "#fff",
                  }}
                >
                  إدارات محددة
                </button>
              </div>
            </div>

            {administrationMode === "specific" && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                {loadingAdministrations ? (
                  <p
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#717d96",
                      textAlign: "center",
                    }}
                  >
                    جاري التحميل...
                  </p>
                ) : administrationOptions.length ===
                  0 ? (
                  <p
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#717d96",
                      textAlign: "center",
                    }}
                  >
                    لا توجد إدارات
                  </p>
                ) : (
                  administrationOptions.map(
                    (admin) => {
                      const checked =
                        selectedAdministrationIds.includes(
                          admin.id
                        );

                      return (
                        <label
                          key={admin.id}
                          className="flex items-center gap-2 px-2 py-2 rounded-[6px] hover:bg-[#f5f6fb] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (
                                e.target.checked
                              ) {
                                setSelectedAdministrationIds(
                                  (prev) => [
                                    ...prev,
                                    admin.id,
                                  ]
                                );
                              } else {
                                setSelectedAdministrationIds(
                                  (prev) =>
                                    prev.filter(
                                      (id) =>
                                        id !==
                                        admin.id
                                    )
                                );
                              }
                            }}
                            className="w-4 h-4 accent-[#00b867]"
                          />

                          <span
                            style={{
                              ...F,
                              fontSize: 14,
                              color: "#2d3648",
                            }}
                          >
                            {admin.name}
                          </span>
                        </label>
                      );
                    }
                  )
                )}
              </div>
            )}

            <div className="p-4 border-t border-[#eff0f6]">
              <button
                type="button"
                onClick={() =>
                  setShowAdminModal(false)
                }
                className="w-full h-[46px] rounded-[8px] flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(to bottom, #00b867, #00522e)",
                }}
              >
                <span
                  style={{
                    ...F,
                    fontSize: 15,
                    color: "#fff",
                  }}
                >
                  تم
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ============================================================
// دباجة الطباعة (بتظهر في الورقة المطبوعة بس، مش على الشاشة)
// ============================================================

function PrintLetterhead() {
  return (
    <div
      className="daily-print-letterhead"
      dir="rtl"
      style={{
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #cbd2e0",
        paddingBottom: 10,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>
          قيــادة قوات الصـاعقة
        </span>
        <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>
          فـرع التنظيــــم والإدارة
        </span>
        <span style={{ ...F, fontSize: 14, color: "#717d96" }}>
          المنظومة الالكترونية للفرع
        </span>
      </div>

      <img src={logoImg} alt="" style={{ width: 64, height: 64, objectFit: "contain" }} />
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
  const showSoldier = config.category !== "ضباط صف";
  const showNco = config.category !== "جنود";
  const groupColSpan = (showSoldier ? 1 : 0) + (showNco ? 1 : 0);

  const rows = units
    .filter((unit) => unit.unit_type === "MAIN")
    .sort((a, b) => {
      const indexA = ALL_OUTSIDERS_UNIT_ORDER.indexOf(a.name.trim());
      const indexB = ALL_OUTSIDERS_UNIT_ORDER.indexOf(b.name.trim());
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    })
    .map((unit) => {
      const unitPeople = people.filter(
        (person) => person.primary_unit?.id === unit.id
      );
      const soldierForce = unitPeople.filter(isSoldier);
      const ncoForce = unitPeople.filter(isNco);
      const outsiders = unitPeople.filter(isOutsider);
      const soldierOutsiders = outsiders.filter(isSoldier);
      const ncoOutsiders = outsiders.filter(isNco);

      return {
        unit,
        soldierForce: soldierForce.length,
        ncoForce: ncoForce.length,
        soldierOutside: soldierOutsiders.length,
        ncoOutside: ncoOutsiders.length,
        soldierRemaining: soldierForce.length - soldierOutsiders.length,
        ncoRemaining: ncoForce.length - ncoOutsiders.length,
      };
    });

  const totals = rows.reduce(
    (acc, row) => ({
      soldierForce: acc.soldierForce + row.soldierForce,
      ncoForce: acc.ncoForce + row.ncoForce,
      soldierOutside: acc.soldierOutside + row.soldierOutside,
      ncoOutside: acc.ncoOutside + row.ncoOutside,
      soldierRemaining: acc.soldierRemaining + row.soldierRemaining,
      ncoRemaining: acc.ncoRemaining + row.ncoRemaining,
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
            <th rowSpan={2} className={`${TH_CLASS} text-center`}>
              <TableText bold>الوحدة</TableText>
            </th>
            <th colSpan={groupColSpan} className={`${TH_CLASS} text-center`}>
              <TableText bold>القوة</TableText>
            </th>
            <th colSpan={groupColSpan} className={`${TH_CLASS} text-center`}>
              <TableText bold>الخوارج</TableText>
            </th>
            <th colSpan={groupColSpan} className={`${TH_CLASS} text-center`}>
              <TableText bold>المتبقي</TableText>
            </th>
          </tr>

          <tr>
            {showSoldier && (
              <th className={`${TH_CLASS} text-center`}><TableText>جنود</TableText></th>
            )}
            {showNco && (
              <th className={`${TH_CLASS} text-center`}><TableText>ضباط صف</TableText></th>
            )}
            {showSoldier && (
              <th className={`${TH_CLASS} text-center`}><TableText>جنود</TableText></th>
            )}
            {showNco && (
              <th className={`${TH_CLASS} text-center`}><TableText>ضباط صف</TableText></th>
            )}
            {showSoldier && (
              <th className={`${TH_CLASS} text-center`}><TableText>جنود</TableText></th>
            )}
            {showNco && (
              <th className={`${TH_CLASS} text-center`}><TableText>ضباط صف</TableText></th>
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.unit.id}>
              <td className={TH_CLASS}><TableText>{row.unit.name}</TableText></td>
              {showSoldier && <td className={TD_CLASS}><TableText>{row.soldierForce}</TableText></td>}
              {showNco && <td className={TD_CLASS}><TableText>{row.ncoForce}</TableText></td>}
              {showSoldier && <td className={TD_CLASS}><TableText>{row.soldierOutside}</TableText></td>}
              {showNco && <td className={TD_CLASS}><TableText>{row.ncoOutside}</TableText></td>}
              {showSoldier && <td className={TD_CLASS}><TableText>{row.soldierRemaining}</TableText></td>}
              {showNco && <td className={TD_CLASS}><TableText>{row.ncoRemaining}</TableText></td>}
            </tr>
          ))}

          <tr className="bg-[#f7f9fc]">
            <td className={TH_CLASS}><TableText bold>إجمالي</TableText></td>
            {showSoldier && <td className={TD_CLASS}><TableText bold>{totals.soldierForce}</TableText></td>}
            {showNco && <td className={TD_CLASS}><TableText bold>{totals.ncoForce}</TableText></td>}
            {showSoldier && <td className={TD_CLASS}><TableText bold>{totals.soldierOutside}</TableText></td>}
            {showNco && <td className={TD_CLASS}><TableText bold>{totals.ncoOutside}</TableText></td>}
            {showSoldier && <td className={TD_CLASS}><TableText bold>{totals.soldierRemaining}</TableText></td>}
            {showNco && <td className={TD_CLASS}><TableText bold>{totals.ncoRemaining}</TableText></td>}
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

              <td className={TD_CLASS}>
                <TableText children={undefined}></TableText>
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
// Report 4
// يومية عددية بخوارج وحدة
//
// ✅ تعديل: تمت إضافة مفتاح تبديل (Switch) بين عرضين:
//    - عرض رأسي: نفس الشكل القديم (رؤوس أعمدة ملفوفة بزاوية 90°)
//    - عرض أفقي: جدول عادي — كل صف = وحدة إلحاق، وأعمدته:
//      اسم الوحدة | خوارج مجندين | خوارج ضباط صف | الاجمالي
//      مع صف إجمالي في الأسفل.
//
// الطباعة تطبع أيًا كان العرض المفعّل حاليًا (لأن العرض التاني مش
// موجود في الـ DOM أصلًا وقتها، والزرارين نفسهم عليهم كلاس
// no-print فمش هيظهروا في الطباعة).
// ============================================================
function UnitOutsidersReport({
  people,
  config,
}: {
  people: Personnel[];
  config: ReportConfig;
}) {
  const [viewMode, setViewMode] = useState<
    "vertical" | "horizontal"
  >("vertical");

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
const showSoldier = config.category !== "ضباط صف";
const showNco = config.category !== "جنود";
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

  const grandTotal = ncoRowTotal + soldierRowTotal;

  return (
    <ReportTableWrapper>
      {/* ======================================================
          مفتاح تبديل طريقة العرض (رأسي / أفقي)
          مخفي بالكامل وقت الطباعة
         ====================================================== */}

      <div
        className="flex items-center gap-2 justify-start px-5 pt-4 pb-2 no-print"
        dir="rtl"
      >
        <span
          style={{
            ...F,
            fontSize: 13,
            color: "#717d96",
          }}
        >
          طريقة العرض:
        </span>

        <div
          className="flex items-center rounded-[8px] border border-[#e2e7f0] overflow-hidden h-[38px]"
          dir="rtl"
        >
          <button
            type="button"
            onClick={() => setViewMode("vertical")}
            className="h-full px-4 flex items-center justify-center transition-all"
            style={{
              ...F,
              fontSize: 13,
              color:
                viewMode === "vertical"
                  ? "#fff"
                  : "#2d3648",
              background:
                viewMode === "vertical"
                  ? "linear-gradient(to bottom, #00b867, #00522e)"
                  : "#fff",
              borderLeft: "1px solid #e2e7f0",
            }}
          >
            عرض رأسي
          </button>

          <button
            type="button"
            onClick={() => setViewMode("horizontal")}
            className="h-full px-4 flex items-center justify-center transition-all"
            style={{
              ...F,
              fontSize: 13,
              color:
                viewMode === "horizontal"
                  ? "#fff"
                  : "#2d3648",
              background:
                viewMode === "horizontal"
                  ? "linear-gradient(to bottom, #00b867, #00522e)"
                  : "#fff",
            }}
          >
            عرض أفقي
          </button>
        </div>
      </div>

      <div className="overflow-x-auto px-5 pb-5">
        {viewMode === "vertical" ? (
          // ====================================================
          // العرض الرأسي (القديم بالظبط)
          // ====================================================
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
                        امــــــــــــــــاكن الألحـــــــــــــــــــــــاق
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
                            backgroundColor: "#ffffff", // ✅ خلفية بيضاء بدل الرمادي
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
{/* صف ضباط صف */}
{showNco && (
  <tr>
    <td className={TH_CLASS} style={{ width: 22, padding: 2 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap" }}>
          <TableText bold>ر.ع</TableText>
        </div>
      </div>
    </td>

    {tableColumns.map((col) => (
      <td key={col.unit.id} className={`${TD_CLASS} text-center`}>
        <TableText>{col.ncoValue}</TableText>
      </td>
    ))}

    <td className={`${TD_CLASS} text-center`}>
      <TableText bold>{ncoRowTotal}</TableText>
    </td>
  </tr>
)}

{/* صف مجند */}
{showSoldier && (
  <tr>
    <td className={TH_CLASS} style={{ width: 22, padding: 2 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap" }}>
          <TableText bold>مجند</TableText>
        </div>
      </div>
    </td>

    {tableColumns.map((col) => (
      <td key={col.unit.id} className={`${TD_CLASS} text-center`}>
        <TableText>{col.soldierValue}</TableText>
      </td>
    ))}

    <td className={`${TD_CLASS} text-center`}>
      <TableText bold>{soldierRowTotal}</TableText>
    </td>
  </tr>
)}

 

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
        ) : (
          // ====================================================
          // العرض الأفقي (الجديد)
          // اسم الوحدة | خوارج مجندين | خوارج ضباط صف | الاجمالي
          // ====================================================
<table className="w-full min-w-[560px] border-collapse">
  <thead>
    <tr>
      <th className={`${TH_CLASS} text-center`}><TableText bold>اسم الوحدة</TableText></th>
      {showSoldier && <th className={`${TH_CLASS} text-center`}><TableText bold>خوارج مجندين</TableText></th>}
      {showNco && <th className={`${TH_CLASS} text-center`}><TableText bold>خوارج ضباط صف</TableText></th>}
      <th className={`${TH_CLASS} text-center`}><TableText bold>الاجمالي</TableText></th>
    </tr>
  </thead>

  <tbody>
    {tableColumns.length === 0 ? (
      <EmptyRow colSpan={2 + (showSoldier ? 1 : 0) + (showNco ? 1 : 0)} />
    ) : (
      tableColumns.map((col) => (
        <tr key={col.unit.id}>
          <td className={TH_CLASS}><TableText>{col.unit.name}</TableText></td>
          {showSoldier && <td className={TD_CLASS}><TableText>{col.soldierValue}</TableText></td>}
          {showNco && <td className={TD_CLASS}><TableText>{col.ncoValue}</TableText></td>}
          <td className={TD_CLASS}><TableText bold>{col.soldierValue + col.ncoValue}</TableText></td>
        </tr>
      ))
    )}

    {tableColumns.length > 0 && (
      <tr className="bg-[#f7f9fc]">
        <td className={TH_CLASS}><TableText bold>الاجمالي</TableText></td>
        {showSoldier && <td className={TD_CLASS}><TableText bold>{soldierRowTotal}</TableText></td>}
        {showNco && <td className={TD_CLASS}><TableText bold>{ncoRowTotal}</TableText></td>}
        <td className={TD_CLASS}><TableText bold>{grandTotal}</TableText></td>
      </tr>
    )}
  </tbody>
</table>
        )}
      </div>
    </ReportTableWrapper>
  );
}
// ============================================================
// Report 6
// يومية عددية لإدارات وحدة
//
// نفس شكل UnitOutsidersReport بالظبط (عرض رأسي / أفقي)، لكن
// التجميع هنا حسب "الإدارة" (external_administrations عن طريق
// personnel.administration_id) بدل "وحدة الإلحاق".
//
// شرط دخول الفرد للحساب: وحدته الأساسية = الوحدة المختارة فقط،
// بغض النظر عن حالته الخدمية أو مكان إلحاقه.
// ============================================================
function UnitAdministrationsReport({
  people,
  config,
  groupLabel = "الإدارة",
  groupLabelPlural = "الإدارات",
}: {
  people: Personnel[];
  config: ReportConfig;
  groupLabel?: string;
  groupLabelPlural?: string;
}) {
  const [viewMode, setViewMode] =
    useState<"vertical" | "horizontal">(
      "vertical"
    );

  const showSoldier =
    config.category !== "ضباط صف";

  const showNco =
    config.category !== "جنود";

  const unitPeople = people.filter(
    (person) =>
      person.primary_unit?.id ===
        config.unitId &&
      matchesCategory(
        person,
        config.category
      )
  );

  const grouped = new Map<
    string,
    {
      administration: {
        id: string;
        name: string;
      };
      soldiers: number;
      nco: number;
    }
  >();

  unitPeople.forEach((person) => {
    const admin = person.administration;

    if (!admin?.id) {
      return;
    }

    const existing =
      grouped.get(admin.id);

    if (existing) {
      if (isSoldier(person)) {
        existing.soldiers += 1;
      }

      if (isNco(person)) {
        existing.nco += 1;
      }

      return;
    }

    grouped.set(admin.id, {
      administration: {
        id: admin.id,
        name: admin.name,
      },

      soldiers: isSoldier(person)
        ? 1
        : 0,

      nco: isNco(person)
        ? 1
        : 0,
    });
  });

  // ✅ فلترة حسب الإدارات المختارة من البوب اب (فاضية = كل الإدارات)
  const filteredByAdmin =
    config.administrationIds &&
    config.administrationIds.length > 0
      ? Array.from(grouped.values()).filter(
          (col) =>
            config.administrationIds.includes(
              col.administration.id
            )
        )
      : Array.from(grouped.values());

  // ✅ ترتيب: صاعقة دايمًا أول إدارة، والباقي بنفس الترتيب الأصلي
  const columns = filteredByAdmin.sort(
    (a, b) => {
      const aPriority =
        a.administration.name === "صاعقة"
          ? 0
          : 1;

      const bPriority =
        b.administration.name === "صاعقة"
          ? 0
          : 1;

      return aPriority - bPriority;
    }
  );

  const ncoRowTotal = columns.reduce(
    (sum, col) => sum + col.nco,
    0
  );

  const soldierRowTotal = columns.reduce(
    (sum, col) => sum + col.soldiers,
    0
  );

  const grandTotal =
    ncoRowTotal + soldierRowTotal;

  return (
    <ReportTableWrapper>
      <div
        className="flex items-center gap-2 justify-start px-5 pt-4 pb-2 no-print"
        dir="rtl"
      >
        <span
          style={{
            ...F,
            fontSize: 13,
            color: "#717d96",
          }}
        >
          طريقة العرض:
        </span>

        <div
          className="flex items-center rounded-[8px] border border-[#e2e7f0] overflow-hidden h-[38px]"
          dir="rtl"
        >
          <button
            type="button"
            onClick={() => setViewMode("vertical")}
            className="h-full px-4 flex items-center justify-center transition-all"
            style={{
              ...F,
              fontSize: 13,
              color:
                viewMode === "vertical"
                  ? "#fff"
                  : "#2d3648",
              background:
                viewMode === "vertical"
                  ? "linear-gradient(to bottom, #00b867, #00522e)"
                  : "#fff",
              borderLeft: "1px solid #e2e7f0",
            }}
          >
            عرض رأسي
          </button>

          <button
            type="button"
            onClick={() => setViewMode("horizontal")}
            className="h-full px-4 flex items-center justify-center transition-all"
            style={{
              ...F,
              fontSize: 13,
              color:
                viewMode === "horizontal"
                  ? "#fff"
                  : "#2d3648",
              background:
                viewMode === "horizontal"
                  ? "linear-gradient(to bottom, #00b867, #00522e)"
                  : "#fff",
            }}
          >
            عرض أفقي
          </button>
        </div>
      </div>

      <div className="overflow-x-auto px-5 pb-5">
        {viewMode === "vertical" ? (
          <div className="flex flex-col gap-4">
            {columns.length === 0 ? (
              <table className="w-full min-w-[300px] border-collapse">
                <thead>
                  <tr>
                    <th
                      className={`${TH_CLASS} text-center`}
                    >
                      <TableText bold>
                        {groupLabelPlural}
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
                        columns.length + 2
                      }
                      className={`${TH_CLASS} text-center`}
                    >
                      <TableText bold>
                        {groupLabelPlural}
                      </TableText>
                    </th>
                  </tr>

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

                    {columns.map(
                      (col) => (
                        <th
                          key={
                            col.administration.id
                          }
                          className={`${TH_CLASS} text-center`}
                          style={{
                            width: 22,
                            height: 130,
                            padding: 2,
                            backgroundColor: "#ffffff",
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
                                    .administration
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
                  {/* صف ر.ع — يظهر فقط لو الفئة مش "جنود" */}
                  {showNco && (
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

                      {columns.map(
                        (col) => (
                          <td
                            key={
                              col.administration.id
                            }
                            className={`${TD_CLASS} text-center`}
                          >
                            <TableText>
                              {
                                col.nco
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
                  )}

                  {/* صف مجند — يظهر فقط لو الفئة مش "ضباط صف" */}
                  {showSoldier && (
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

                      {columns.map(
                        (col) => (
                          <td
                            key={
                              col.administration.id
                            }
                            className={`${TD_CLASS} text-center`}
                          >
                            <TableText>
                              {
                                col.soldiers
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
                  )}

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

                    {columns.map(
                      (col) => (
                        <td
                          key={
                            col.administration.id
                          }
                          className={`${TD_CLASS} text-center`}
                        >
                          <TableText bold>
                            {col.nco +
                              col.soldiers}
                          </TableText>
                        </td>
                      )
                    )}

                    <td
                      className={`${TD_CLASS} text-center`}
                    >
                      <TableText bold>
                        {grandTotal}
                      </TableText>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                <th className={`${TH_CLASS} text-center`}>
                  <TableText bold>{`اسم ${groupLabel}`}</TableText>
                </th>

                {showSoldier && (
                  <th className={`${TH_CLASS} text-center`}>
                    <TableText bold>عدد مجندين</TableText>
                  </th>
                )}

                {showNco && (
                  <th className={`${TH_CLASS} text-center`}>
                    <TableText bold>عدد ضباط صف</TableText>
                  </th>
                )}

                <th className={`${TH_CLASS} text-center`}>
                  <TableText bold>الاجمالي</TableText>
                </th>
              </tr>
            </thead>

            <tbody>
              {columns.length === 0 ? (
                <EmptyRow
                  colSpan={
                    2 +
                    (showSoldier ? 1 : 0) +
                    (showNco ? 1 : 0)
                  }
                />
              ) : (
                columns.map((col) => (
                  <tr key={col.administration.id}>
                    <td className={TH_CLASS}>
                      <TableText>
                        {col.administration.name}
                      </TableText>
                    </td>

                    {showSoldier && (
                      <td className={TD_CLASS}>
                        <TableText>
                          {col.soldiers}
                        </TableText>
                      </td>
                    )}

                    {showNco && (
                      <td className={TD_CLASS}>
                        <TableText>
                          {col.nco}
                        </TableText>
                      </td>
                    )}

                    <td className={TD_CLASS}>
                      <TableText bold>
                        {col.soldiers +
                          col.nco}
                      </TableText>
                    </td>
                  </tr>
                ))
              )}

              {columns.length > 0 && (
                <tr className="bg-[#f7f9fc]">
                  <td className={TH_CLASS}>
                    <TableText bold>
                      الاجمالي
                    </TableText>
                  </td>

                  {showSoldier && (
                    <td className={TD_CLASS}>
                      <TableText bold>
                        {soldierRowTotal}
                      </TableText>
                    </td>
                  )}

                  {showNco && (
                    <td className={TD_CLASS}>
                      <TableText bold>
                        {ncoRowTotal}
                      </TableText>
                    </td>
                  )}

                  <td className={TD_CLASS}>
                    <TableText bold>
                      {grandTotal}
                    </TableText>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </ReportTableWrapper>
  );
}
// ============================================================
// Report 8
// كشف أسماء إدارات وحدة
//
// نفس منطق UnitAdministrationsReport (وحدة أساسية = الوحدة
// المختارة + فلتر الفئة + الإدارات المختارة + صاعقة أولًا)،
// لكن بدل الأعداد بنعرض جدول أسماء لكل إدارة.
// ============================================================
function UnitAdministrationsNamesReport({
  people,
  config,
  groupLabel = "الإدارة",
}: {
  people: Personnel[];
  config: ReportConfig;
  groupLabel?: string;
}) {
  // ✅ عمود تاريخ التسريح يختفي لو الفئة "ضباط صف" فقط
  const showDischarge = config.category !== "ضباط صف";

  const unitPeople = people.filter(
    (person) =>
      person.primary_unit?.id === config.unitId &&
      matchesCategory(person, config.category)
  );

  const grouped = new Map<
    string,
    {
      administration: { id: string; name: string };
      persons: Personnel[];
    }
  >();

  unitPeople.forEach((person) => {
    const admin = person.administration;

    if (!admin?.id) return;

    const existing = grouped.get(admin.id);

    if (existing) {
      existing.persons.push(person);
      return;
    }

    grouped.set(admin.id, {
      administration: {
        id: admin.id,
        name: admin.name,
      },
      persons: [person],
    });
  });

  const selectedIds = config.administrationIds ?? [];

  const sections = Array.from(grouped.values())
    // فلترة الإدارات المختارة (فاضية = كل الإدارات)
    .filter(
      (sec) =>
        selectedIds.length === 0 ||
        selectedIds.includes(sec.administration.id)
    )
    // صاعقة دايمًا أول إدارة
    .sort((a, b) => {
      const aPriority =
        a.administration.name === "صاعقة" ? 0 : 1;
      const bPriority =
        b.administration.name === "صاعقة" ? 0 : 1;

      return aPriority - bPriority;
    })
    .map((sec) => ({
      ...sec,
      persons: [...sec.persons].sort(
        compareByCategoryAndRank
      ),
    }));

  // ✅ نفرد كل الأفراد في قائمة واحدة، وأول فرد في كل إدارة
  // هو اللي بيرسم خلية الإدارة المدمجة (rowSpan)
  const rows = sections.flatMap((sec) =>
    sec.persons.map((person, i) => ({
      person,
      administration: sec.administration,
      isFirstInGroup: i === 0,
      groupSize: sec.persons.length,
    }))
  );

  const totalCols = showDischarge ? 7 : 6;

  if (rows.length === 0) {
    return (
      <ReportTableWrapper>
        <table className="w-full border-collapse">
          <tbody>
            <EmptyRow colSpan={1} />
          </tbody>
        </table>
      </ReportTableWrapper>
    );
  }
const headers = [
    "م",
    groupLabel,
    "الرقم العسكري",
    "الدرجة",
    "الاسم",
    ...(showDischarge ? ["تاريخ التسريح"] : []),
    "ملاحظات",
  ];

  return (
    <ReportTableWrapper>
      <style>
        {`
          @media print {
            .admin-names-table thead {
              display: table-header-group;
            }
            .admin-names-table tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      <div className="overflow-x-auto">
        <table className="admin-names-table w-full min-w-[800px] border-collapse">
          <thead>
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className={`${TH_CLASS} text-center`}
                >
                  <TableText bold>{h}</TableText>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={row.person.id}>
                <td className={TD_CLASS}>
                  <TableText>{index + 1}</TableText>
                </td>

                {/* ✅ خلية الإدارة: بتظهر مرة واحدة ومدمجة على كل أفراد الإدارة */}
                {row.isFirstInGroup && (
                  <td
                    rowSpan={row.groupSize}
                    className={TD_CLASS}
                    style={{ verticalAlign: "middle" }}
                  >
                    <TableText bold>
                      {row.administration.name}
                    </TableText>
                  </td>
                )}

                <td className={TD_CLASS}>
                  <TableText>
                    {row.person.military_number}
                  </TableText>
                </td>

                <td className={TD_CLASS}>
                  <TableText>
                    {row.person.rank?.name ?? "-"}
                  </TableText>
                </td>

                <td className={TD_CLASS}>
                  <TableText>
                    {row.person.full_name}
                  </TableText>
                </td>

                {showDischarge && (
                  <td className={TD_CLASS}>
                    <TableText>
                      {isNco(row.person)
                        ? "-"
                        : formatDate(
                            row.person.discharge_date
                          )}
                    </TableText>
                  </td>
                )}

                <td className={TD_CLASS}>
                  <TableText>{""}</TableText>
                </td>
              </tr>
            ))}

            {/* الإجمالي العام */}
            <tr className="bg-[#f7f9fc]">
              <td
                colSpan={totalCols - 1}
                className={TH_CLASS}
              >
                <TableText bold>الإجمالي العام</TableText>
              </td>

              <td className={TD_CLASS}>
                <TableText bold>{rows.length}</TableText>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ReportTableWrapper>
  );
}
// ============================================================
// يومية عددية لوظائف وحدة
// وحدة أساسية = الوحدة المختارة، وصف لكل وظيفة (عرض أفقي)
// ============================================================
function UnitJobsReport({
  people,
  config,
}: {
  people: Personnel[];
  config: ReportConfig;
}) {
  const showSoldier = config.category !== "ضباط صف";
  const showNco = config.category !== "جنود";

  const unitPeople = people.filter(
    (person) =>
      person.primary_unit?.id === config.unitId &&
      matchesCategory(person, config.category)
  );

  const grouped = new Map<
    string,
    { id: string; name: string; soldiers: number; nco: number }
  >();

  unitPeople.forEach((person) => {
    const id = person.job?.id ?? NO_JOB_ID;
    const name = person.job?.name ?? NO_JOB_NAME;

    const entry = grouped.get(id) ?? {
      id,
      name,
      soldiers: 0,
      nco: 0,
    };

    if (isSoldier(person)) entry.soldiers += 1;
    if (isNco(person)) entry.nco += 1;

    grouped.set(id, entry);
  });

  const rows = Array.from(grouped.values()).sort((a, b) => {
    if (a.id === NO_JOB_ID) return 1;
    if (b.id === NO_JOB_ID) return -1;

    return a.name.localeCompare(b.name, "ar");
  });

  const totalSoldiers = rows.reduce((sum, r) => sum + r.soldiers, 0);
  const totalNco = rows.reduce((sum, r) => sum + r.nco, 0);
  const grandTotal = totalSoldiers + totalNco;

  const emptyColSpan = 3 + (showSoldier ? 1 : 0) + (showNco ? 1 : 0);

  return (
    <ReportTableWrapper>
      <div className="overflow-x-auto p-5">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr>
              <th className={`${TH_CLASS} text-center`}>
                <TableText bold>م</TableText>
              </th>

              <th className={`${TH_CLASS} text-center`}>
                <TableText bold>اسم الوظيفة</TableText>
              </th>

              {showSoldier && (
                <th className={`${TH_CLASS} text-center`}>
                  <TableText bold>عدد مجندين</TableText>
                </th>
              )}

              {showNco && (
                <th className={`${TH_CLASS} text-center`}>
                  <TableText bold>عدد ضباط صف</TableText>
                </th>
              )}

              <th className={`${TH_CLASS} text-center`}>
                <TableText bold>الاجمالي</TableText>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={emptyColSpan} />
            ) : (
              rows.map((row, index) => (
                <tr key={row.id}>
                  <td className={TD_CLASS}>
                    <TableText>{index + 1}</TableText>
                  </td>

                  <td className={TD_CLASS}>
                    <TableText>{row.name}</TableText>
                  </td>

                  {showSoldier && (
                    <td className={TD_CLASS}>
                      <TableText>{row.soldiers}</TableText>
                    </td>
                  )}

                  {showNco && (
                    <td className={TD_CLASS}>
                      <TableText>{row.nco}</TableText>
                    </td>
                  )}

                  <td className={TD_CLASS}>
                    <TableText bold>{row.soldiers + row.nco}</TableText>
                  </td>
                </tr>
              ))
            )}

            {rows.length > 0 && (
              <tr className="bg-[#f7f9fc]">
                <td colSpan={2} className={TH_CLASS}>
                  <TableText bold>الاجمالي</TableText>
                </td>

                {showSoldier && (
                  <td className={TD_CLASS}>
                    <TableText bold>{totalSoldiers}</TableText>
                  </td>
                )}

                {showNco && (
                  <td className={TD_CLASS}>
                    <TableText bold>{totalNco}</TableText>
                  </td>
                )}

                <td className={TD_CLASS}>
                  <TableText bold>{grandTotal}</TableText>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ReportTableWrapper>
  );
}
// ============================================================
// Report 7
// يومية عددية لإدارات جميع الوحدات
//
// جدول واحد فقط (مفيش رأسي/أفقي): صف لكل وحدة رئيسية، وعمود
// مزدوج (مجند / ر.ع) لكل إدارة، بالإضافة لعمود إجمالي مزدوج في
// النهاية. الطباعة هنا landscape دايمًا.
//
// شرط دخول الفرد لحساب أي وحدة: وحدته الأساسية = هذه الوحدة، بغض
// النظر عن حالته الخدمية أو مكان إلحاقه (نفس مبدأ "قوة الوحدة").
// ============================================================
function AllUnitsAdministrationsReport({
  units,
  people,
  config,
}: {
  units: Unit[];
  people: Personnel[];
  config: ReportConfig;
}) {
  const showSoldier =
    config.category !== "ضباط صف";

  const showNco =
    config.category !== "جنود";

  // ✅ الوحدات الرئيسية مرتبة حسب التسلسل الهرمي المعتمد
  const mainUnits = units
    .filter(
      (unit) => unit.unit_type === "MAIN"
    )
    .sort((a, b) => {
      const indexA =
        ALL_OUTSIDERS_UNIT_ORDER.indexOf(
          a.name.trim()
        );

      const indexB =
        ALL_OUTSIDERS_UNIT_ORDER.indexOf(
          b.name.trim()
        );

      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });

  // ✅ كل الإدارات الموجودة فعليًا في البيانات
  const adminMap = new Map<
    string,
    { id: string; name: string }
  >();

  people.forEach((person) => {
    if (person.administration?.id) {
      adminMap.set(
        person.administration.id,
        {
          id: person.administration.id,
          name: person.administration.name,
        }
      );
    }
  });

  let administrations = Array.from(
    adminMap.values()
  );

  // ✅ فلترة حسب الإدارات المختارة من البوب اب (فاضية = كل الإدارات)
  if (
    config.administrationIds &&
    config.administrationIds.length > 0
  ) {
    administrations =
      administrations.filter((admin) =>
        config.administrationIds.includes(
          admin.id
        )
      );
  }

  // ✅ ترتيب: صاعقة دايمًا أول إدارة
  administrations = administrations.sort(
    (a, b) => {
      const aPriority =
        a.name === "صاعقة" ? 0 : 1;

      const bPriority =
        b.name === "صاعقة" ? 0 : 1;

      return aPriority - bPriority;
    }
  );

  const subColsCount =
    (showSoldier ? 1 : 0) +
    (showNco ? 1 : 0);

  // ✅ صفوف الجدول: لكل وحدة، لكل إدارة، عدد مجند وعدد ر.ع
  const rows = mainUnits.map((unit) => {
    const unitPeople = people.filter(
      (person) =>
        person.primary_unit?.id ===
        unit.id
    );

    const perAdmin = administrations.map(
      (admin) => {
        const adminPeople =
          unitPeople.filter(
            (person) =>
              person.administration
                ?.id === admin.id
          );

        return {
          adminId: admin.id,
          soldiers:
            adminPeople.filter(isSoldier)
              .length,
          nco: adminPeople.filter(isNco)
            .length,
        };
      }
    );

    const totalSoldiers = perAdmin.reduce(
      (sum, a) => sum + a.soldiers,
      0
    );

    const totalNco = perAdmin.reduce(
      (sum, a) => sum + a.nco,
      0
    );

    return {
      unit,
      perAdmin,
      totalSoldiers,
      totalNco,
    };
  });

  // ✅ إجمالي عام لكل إدارة عبر كل الوحدات
  const grandPerAdmin = administrations.map(
    (admin, idx) => ({
      adminId: admin.id,
      soldiers: rows.reduce(
        (sum, row) =>
          sum + row.perAdmin[idx].soldiers,
        0
      ),
      nco: rows.reduce(
        (sum, row) =>
          sum + row.perAdmin[idx].nco,
        0
      ),
    })
  );

  const grandTotalSoldiers = rows.reduce(
    (sum, row) => sum + row.totalSoldiers,
    0
  );

  const grandTotalNco = rows.reduce(
    (sum, row) => sum + row.totalNco,
    0
  );

  // ✅ صف رؤوس الأعمدة الفرعية (مجند / ر.ع) — قائمة مسطّحة بدل
  // Fragments متداخلة، عشان نضمن key فريد لكل عمود.
  const subHeaderCells: {
    key: string;
    label: string;
  }[] = [];

  administrations.forEach((admin) => {
    if (showSoldier) {
      subHeaderCells.push({
        key: `${admin.id}-s`,
        label: "مجند",
      });
    }

    if (showNco) {
      subHeaderCells.push({
        key: `${admin.id}-n`,
        label: "ر.ع",
      });
    }
  });

  if (showSoldier) {
    subHeaderCells.push({
      key: "total-s",
      label: "مجند",
    });
  }

  if (showNco) {
    subHeaderCells.push({
      key: "total-n",
      label: "ر.ع",
    });
  }

  function buildRowCells(
    perAdmin: {
      adminId: string;
      soldiers: number;
      nco: number;
    }[],
    totalSoldiers: number,
    totalNco: number
  ) {
    const cells: {
      key: string;
      value: number;
    }[] = [];

    perAdmin.forEach((a) => {
      if (showSoldier) {
        cells.push({
          key: `${a.adminId}-s`,
          value: a.soldiers,
        });
      }

      if (showNco) {
        cells.push({
          key: `${a.adminId}-n`,
          value: a.nco,
        });
      }
    });

    if (showSoldier) {
      cells.push({
        key: "total-s",
        value: totalSoldiers,
      });
    }

    if (showNco) {
      cells.push({
        key: "total-n",
        value: totalNco,
      });
    }

    return cells;
  }

  const emptyColSpan =
    1 +
    administrations.length *
      subColsCount +
    subColsCount;

  return (
    <ReportTableWrapper>
      {/* ✅ الطباعة landscape دايمًا لهذا التقرير */}
      <style>
        {`
          @media print {
            @page {
              size: landscape;
            }
          }
        `}
      </style>

      <div className="overflow-x-auto p-5">
        <table className="w-full border-collapse min-w-[900px]">
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

              {administrations.map(
                (admin) => (
                  <th
                    key={admin.id}
                    colSpan={
                      subColsCount
                    }
                    className={`${TH_CLASS} text-center`}
                  >
                    <TableText bold>
                      {admin.name}
                    </TableText>
                  </th>
                )
              )}

              <th
                colSpan={subColsCount}
                className={`${TH_CLASS} text-center`}
              >
                <TableText bold>
                  الاجمالي
                </TableText>
              </th>
            </tr>

            <tr>
              {subHeaderCells.map(
                (cell) => (
                  <th
                    key={cell.key}
                    className={`${TH_CLASS} text-center`}
                  >
                    <TableText>
                      {cell.label}
                    </TableText>
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <EmptyRow
                colSpan={emptyColSpan}
              />
            ) : (
              rows.map((row) => (
                <tr key={row.unit.id}>
                  <td className={TH_CLASS}>
                    <TableText>
                      {row.unit.name}
                    </TableText>
                  </td>

                  {buildRowCells(
                    row.perAdmin,
                    row.totalSoldiers,
                    row.totalNco
                  ).map((cell) => (
                    <td
                      key={cell.key}
                      className={`${TD_CLASS} text-center`}
                    >
                      <TableText
                        bold={cell.key.startsWith(
                          "total"
                        )}
                      >
                        {cell.value}
                      </TableText>
                    </td>
                  ))}
                </tr>
              ))
            )}

            {rows.length > 0 && (
              <tr className="bg-[#f7f9fc]">
                <td
                  className={TH_CLASS}
                >
                  <TableText bold>
                    إجمالي
                  </TableText>
                </td>

                {buildRowCells(
                  grandPerAdmin,
                  grandTotalSoldiers,
                  grandTotalNco
                ).map((cell) => (
                  <td
                    key={cell.key}
                    className={`${TD_CLASS} text-center`}
                  >
                    <TableText bold>
                      {cell.value}
                    </TableText>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
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
                <TableText children={undefined}></TableText>
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
      {children}
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
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  // ✅ قبل الطباعة: نسخة من اليومية زي ما هي بتتحفظ في الأرشيف.
  // لو الحفظ فشل، اليومية بتتطبع برضو وبتظهر رسالة.
  async function handlePrint() {
    setArchiving(true);
    setArchiveError("");

    try {
      const html = buildDailyReportSnapshot("daily-report-print-area", reportTitle);

      await archiveDailyReport(
        {
          reportType: config.reportType ?? "",
          reportTitle,
          unitId: config.unitId || null,
          unitName: config.unitName,
          category: config.category,
          excludeBatch: config.excludeBatch,
          dischargeDate: config.excludeBatch && config.dischargeDate ? config.dischargeDate : null,
        },
        html
      );
    } catch (err: any) {
      setArchiveError("اليومية اتطبعت بس متحفظتش في الأرشيف: " + (err?.message ?? ""));
    } finally {
      setArchiving(false);
    }

    window.print();
  }

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

      case "unit-administrations":
        return (
          <UnitAdministrationsReport
            people={people}
            config={config}
          />
        );
      case "all-units-administrations":
        return (
          <AllUnitsAdministrationsReport
            units={units}
            people={people}
            config={config}
          />
        );

      // ✅ جديد
      case "unit-administrations-names":
        return (
          <UnitAdministrationsNamesReport
            people={people}
            config={config}
          />
        );
              case "all-units-jobs":
        return (
          <AllUnitsAdministrationsReport
            units={units}
            people={projectJobsAsGroups(people)}
            config={config}
          />
        );

      case "unit-jobs":
        return (
          <UnitAdministrationsReport
            people={projectJobsAsGroups(people)}
            config={config}
            groupLabel="الوظيفة"
            groupLabelPlural="الوظائف"
          />
        );

      case "unit-jobs-names":
        return (
          <UnitAdministrationsNamesReport
            people={projectJobsAsGroups(people)}
            config={config}
            groupLabel="الوظيفة"
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
      <PrintLetterhead />

      <ReportHeader
        title={reportTitle}
        config={config}
      />

      {renderReport()}

      <button
        type="button"
        onClick={() => void handlePrint()}
        disabled={archiving}
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
          {archiving ? "جاري الحفظ في الأرشيف..." : "طباعة اليومية"}
        </span>
      </button>

      {archiveError && (
        <p
          className="no-print text-center"
          style={{ ...F, fontSize: 13, color: "#991b1b", fontWeight: 700 }}
        >
          {archiveError}
        </p>
      )}
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

  // ✅ آخر إعدادات اتكتبت في الخطوة 2 (حتى لو ما اتعملتش معاينة)
  const [settingsDraft, setSettingsDraft] =
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

      const personnelData = (await fetchAllRows<any>(
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
              ),

              administration:external_administrations(
                id,
                name,
                code
              ),

              job:jobs!job_id(
                id,
                name
              )
            `)
            .eq("is_active", true)
            .range(from, to)
      )) as Personnel[];

      setPeople(personnelData);
    } catch (err: any) {
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
    // ✅ نفس اليومية: نحافظ على الإعدادات. يومية مختلفة: نصفّرها لأن
    // الحقول (وحدة / إدارات) بتختلف حسب النوع
    if (selectedCard?.id !== card.id) {
      setSettingsDraft(null);
      setReportConfig(null);
    }

    setSelectedCard(card);
    setStep(2);
  }

  function handleStepClick(target: 1 | 2 | 3) {
    if (target === 3) {
      // نعيد بناء المعاينة من آخر إعدادات، بعد نفس التحقق بتاع "معاينة"
      if (reportConfig) setStep(3);
      return;
    }

    setStep(target);
  }

  function canGoTo(target: 1 | 2 | 3) {
    if (target === 1) return true;
    if (target === 2) return selectedCard !== null;
    return reportConfig !== null && selectedCard !== null;
  }

  // ==========================================================
  // Settings
  // ==========================================================

  function handleSettings(
    cfg: ReportConfig
  ) {
    const finalConfig: ReportConfig = {
      ...cfg,
      reportType:
        selectedCard?.id ??
        "unit-force",
    };

    setSettingsDraft(finalConfig);
    setReportConfig(finalConfig);

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
          .daily-print-letterhead {
            display: none;
          }

          @media print {
            .daily-print-letterhead {
              display: flex !important;
            }

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
        <DailyStepper
          step={step}
          onStepClick={handleStepClick}
          canGoTo={canGoTo}
        />
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
            key={selectedCard.id}
            reportTitle={
              selectedCard.title
            }
            units={units}
            onNext={handleSettings}
            initial={settingsDraft}
            onDraftChange={(cfg) => {
              setSettingsDraft(cfg);
              // أي تعديل بيلغي المعاينة القديمة، فالمستخدم يضغط
              // "معاينة اليومية" من جديد وياخد آخر إعدادات
              setReportConfig(null);
            }}
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