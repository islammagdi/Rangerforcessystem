import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { ChevronDown, Trash2 } from "lucide-react";

import { supabase } from "../../lib/supabase";
import { STAGE_MONTHS } from "../../lib/trainingRecommendations";
import type { SoldierData } from "../data/soldiersData";
import { useUnsavedChanges } from "../../lib/unsavedChanges";
import {
  useLetterDraft,
  patchLetterDraft,
  getLetterDraft,
  isLetterDraftDirty,
} from "../../lib/letterDraft";
import { SaveDraftButton } from "../components/SaveDraftButton";
import {
  mapLetterTypeRow,
  getLetterScopedFields,
  getSoldierScopedFields,
  getTableVisibleSoldierFields,
    SYSTEM_MANAGED_LETTER_TYPE_CODES,
  DEFAULT_VISIBLE_SOLDIER_COLUMNS,
  type LetterTypeConfig,
  type ExtraFieldDefinition,
  type BaseSoldierColumnKey,
} from "../../lib/letterTypeEngine";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Unit {
  id: string;
  name: string;
  code: string;
  unit_type: string | null;
  is_active: boolean;
}

interface ExternalAdministration {
  id: string;
  name: string;
}

export interface LetterData {
  destination: string;
  destinationId: string;
  issuingUnitId: string;
  // ✅ قيم كل حقول "بيانات الخطاب" (scope: letter)، مفتاح كل
  // حقل هو نفس الـ key بتاعه في extra_fields
  letterFieldValues: Record<string, string>;
}

export interface SoldierWithExtraData extends SoldierData {
  // ✅ قيم كل الحقول الخاصة بالفرد (scope: soldier)، مفتاح كل
  // حقل هو نفس الـ key بتاعه في extra_fields
  extraData: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stepper
// ─────────────────────────────────────────────────────────────────────────────

function GreenCheckBubble({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient
              id="ld-sg1"
              x1="16"
              x2="16"
              y1="0"
              y2="32"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00B867" />
              <stop offset="1" stopColor="#00522E" />
            </linearGradient>
          </defs>

          <circle cx="16" cy="16" r="15" fill="url(#ld-sg1)" />
        </svg>

        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="absolute"
        >
          <path
            d="M9 11.5L11.5 14L15.5 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <span
        style={{
          ...F,
          fontSize: 14,
          background: "linear-gradient(to bottom, #00b867, #00522e)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function NumberBubble({
  num,
  label,
  active,
}: {
  num: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2"
        style={{
          borderColor: active ? "#2d3648" : "#a1aebe",
        }}
      >
        <span
          style={{
            ...F,
            fontSize: 14,
            color: "#2d3648",
            lineHeight: 1.4,
          }}
        >
          {num}
        </span>
      </div>

      <span
        style={{
          ...F,
          fontSize: 14,
          color: active ? "#2d3648" : "#465668",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function StepDots({ dark }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-[3px] mt-4 mx-2 shrink-0">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] h-[3px] rounded-full shrink-0"
          style={{
            background: dark ? "#1A202C" : "#A1AEBE",
          }}
        />
      ))}
    </div>
  );
}

function LetterStepper({
  activeStep,
  onStepClick,
}: {
  activeStep: 1 | 2 | 3 | 4;
  onStepClick?: (step: 1 | 2 | 3 | 4) => void;
}) {
  const steps = [
    { num: "01", label: "تحديد نوع الخطاب" },
    { num: "02", label: "تحديد الأفراد" },
    { num: "03", label: "بيانات الخطاب" },
    { num: "04", label: "المراجعة والتصديق" },
  ];

  return (
    <div className="flex items-start justify-center flex-wrap gap-0" dir="rtl">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < activeStep;
        const isActive = stepNum === activeStep;

        return (
          <div key={step.num} className="flex items-start">
            {isDone ? (
              onStepClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick(stepNum as 1 | 2 | 3 | 4)}
                  className="bg-transparent p-0 cursor-pointer hover:opacity-80 transition-opacity"
                  title="الرجوع لهذه الخطوة"
                >
                  <GreenCheckBubble label={step.label} />
                </button>
              ) : (
                <GreenCheckBubble label={step.label} />
              )
            ) : (
              <NumberBubble num={step.num} label={step.label} active={isActive} />
            )}

            {idx < steps.length - 1 && <StepDots dark={idx + 1 < activeStep} />}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Searchable Dropdown (مستخدمة بس لحقول "بيانات الخطاب" العامة)
// ─────────────────────────────────────────────────────────────────────────────

function FormDropdown({
  placeholder,
  options,
  value,
  onChange,
  error,
  disabled = false,
  allowCustomValue = false,
}: {
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
  allowCustomValue?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(option: string) {
    onChange(option);
    setSearch("");
    setOpen(false);
  }

  function handleOpen() {
    if (disabled) return;

    setOpen((prev) => !prev);

    if (!open) {
      setSearch(allowCustomValue ? value : "");
    }
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative w-full">
        <div
          className={[
            "w-full h-[52px] bg-white border rounded-[8px] flex items-center transition-colors",
            disabled ? "opacity-60 cursor-not-allowed" : "hover:border-[#a0aec0]",
            error ? "border-[#ef4444]" : open ? "border-[#1f3d97]" : "border-[#e2e7f0]",
          ].join(" ")}
        >
          <input
            type="text"
            value={open ? search : value}
            disabled={disabled}
            placeholder={value || placeholder}
            onFocus={() => {
              if (!disabled) {
                setOpen(true);
                setSearch(allowCustomValue ? value : "");
              }
            }}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);

              if (allowCustomValue) {
                onChange(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                setSearch("");
              }

              if (e.key === "Enter") {
                if (allowCustomValue) {
                  setOpen(false);
                  return;
                }

                if (filteredOptions.length === 1) {
                  handleSelect(filteredOptions[0]);
                }
              }
            }}
            className="flex-1 h-full bg-transparent outline-none px-3 text-right"
            style={{
              ...F,
              fontSize: 16,
              color: "#2d3648",
            }}
          />

          <button
            type="button"
            disabled={disabled}
            onClick={handleOpen}
            className="w-10 h-full flex items-center justify-center shrink-0"
          >
            <ChevronDown
              size={18}
              className={[
                "text-[#2d3648] transition-transform",
                open ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>
        </div>

        {open && !disabled && (
          <div className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden">
            <div
              className="px-3 py-2 border-b border-[#eff0f6] text-right bg-[#fafbfc]"
              style={{
                ...F,
                fontSize: 12,
                color: "#717d96",
              }}
            >
              {filteredOptions.length} نتيجة
            </div>

            <ul className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <li>
                  <div
                    className="px-4 py-4 text-center"
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#717d96",
                    }}
                  >
                    لا توجد نتيجة بهذا الاسم
                  </div>
                </li>
              ) : (
                filteredOptions.map((option) => (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={[
                        "w-full text-right px-4 py-2.5 transition-colors",
                        option === value
                          ? "bg-[#f0f2fd] text-[#1f3d97]"
                          : "hover:bg-[#f5f6fb] text-[#2d3648]",
                      ].join(" ")}
                      style={{
                        ...F,
                        fontSize: 15,
                      }}
                    >
                      {option}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <p
          className="text-right px-1"
          style={{
            ...F,
            fontSize: 13,
            color: "#ef4444",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sort Icon
// ─────────────────────────────────────────────────────────────────────────────
const BASE_COLUMN_RENDERERS: Record<
  BaseSoldierColumnKey,
  { header: string; render: (s: SoldierData) => React.ReactNode }
> = {
  military_id: { header: "رقم عسكري", render: (s) => s.militaryId || "-" },
  rank: { header: "درجة", render: (s) => s.rank },
  name: { header: "اسم", render: (s) => s.name },
  unit: { header: "الوحدة", render: (s) => s.unit },
  attachment_unit: {
    header: "وحدة الإلحاق",
    render: () => "لا يوجد",
  },
};
function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 3v10M8 13l-3-3M8 13l3-3"
        stroke="#A0ABC0"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function LetterDataPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    letterTypeId?: string;
    letterTypeCode?: string;
    letterTypeName?: string;
    soldiers?: SoldierData[];
  } | null;

  // ✅ مصدر الحقيقة = المسودة المشتركة (state بتاع الـ navigate بقى احتياطي)
  const draft = useLetterDraft();
  const draftAtMount = getLetterDraft();

  const incomingSoldiers: SoldierData[] =
    draftAtMount.soldiers.length > 0
      ? (draftAtMount.soldiers as SoldierData[])
      : state?.soldiers ?? [];

  // ─────────────────────────────────────────────────────────
  // Supabase Data (units / administrations / letter type config)
  // ─────────────────────────────────────────────────────────

  const [units, setUnits] = useState<Unit[]>([]);
  const [administrations, setAdministrations] = useState<
    ExternalAdministration[]
  >([]);
  const [letterTypeConfig, setLetterTypeConfig] =
    useState<LetterTypeConfig | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      setLoadError("");

      if (!state?.letterTypeId) {
        setLoadError("نوع الخطاب غير موجود. ارجع واختر نوع الخطاب مرة أخرى.");
        setLoadingData(false);
        return;
      }

      try {
        const [
          { data: unitsData, error: unitsError },
          { data: adminsData, error: adminsError },
          { data: typeRow, error: typeError },
        ] = await Promise.all([
          supabase
            .from("units")
            .select("id,name,code,unit_type,is_active")
            .eq("is_active", true)
            .order("name"),

          supabase
            .from("external_administrations")
            .select("id,name")
            .eq("is_active", true)
            .order("name"),

          supabase
            .from("letter_types")
            .select(
              "id, name, code, body_template_singular, body_template_plural, extra_fields, personnel_effect, eligibility_rules"
            )
            .eq("id", state.letterTypeId)
            .maybeSingle(),
        ]);

        if (unitsError) {
          throw new Error(`خطأ في تحميل الوحدات: ${unitsError.message}`);
        }

        if (adminsError) {
          throw new Error(
            `خطأ في تحميل الإدارات الخارجية: ${adminsError.message}`
          );
        }

        if (typeError) {
          throw new Error(`خطأ في تحميل نوع الخطاب: ${typeError.message}`);
        }

        if (!typeRow) {
          throw new Error("نوع الخطاب غير موجود في قاعدة البيانات.");
        }

        setUnits(unitsData ?? []);
        setAdministrations(adminsData ?? []);
        setLetterTypeConfig(mapLetterTypeRow(typeRow));
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحميل البيانات"
        );
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [state?.letterTypeId]);

  // ─────────────────────────────────────────────────────────
  // Destination (حقل ثابت — إجباري لكل الأنواع)
  // ─────────────────────────────────────────────────────────
  const [destination, setDestination] = useState(
    () => draftAtMount.destination
  );
  const [destinationId, setDestinationId] = useState(
    () => draftAtMount.destinationId
  );

  function handleDestinationChange(name: string) {
    const unit = units.find((item) => item.name === name);

    setDestination(name);
    setDestinationId(unit?.id ?? "");

    if (errors.destination) {
      setErrors((prev) => ({ ...prev, destination: "" }));
    }
  }

  // ─────────────────────────────────────────────────────────
  // قيم حقول "بيانات الخطاب" (scope: letter)
  // ─────────────────────────────────────────────────────────

  const [letterFieldValues, setLetterFieldValues] = useState<
    Record<string, string>
  >(() => draftAtMount.letterFieldValues);

  function handleLetterFieldChange(key: string, value: string) {
    setLetterFieldValues((prev) => ({ ...prev, [key]: value }));

    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  }

  // ─────────────────────────────────────────────────────────
  // قيم حقول الأفراد (scope: soldier)
  // القيمة الفعلية لكل فرد = تخصيصه الفردي (لو موجود)، وإلا
  // القيمة العامة، وإلا القيمة الافتراضية من تعريف الحقل
  // ─────────────────────────────────────────────────────────

  const [soldierFieldGeneralValues, setSoldierFieldGeneralValues] = useState<
    Record<string, string>
  >(() => draftAtMount.soldierFieldGeneralValues);

  const [soldierFieldOverrides, setSoldierFieldOverrides] = useState<
    Record<string, Record<string, string>>
  >(() => draftAtMount.soldierFieldOverrides);

  const [localSoldiers, setLocalSoldiers] =
    useState<SoldierData[]>(incomingSoldiers);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─────────────────────────────────────────────────────────
  // تتبّع التعديلات غير المحفوظة
  // ─────────────────────────────────────────────────────────
  // الأفراد جايين من خطوة سابقة (عمل تم إنجازه)، وأي بيانات
  // خطاب أو تخصيص لحقول الأفراد لسه محفوظتش في قاعدة البيانات
  const { setDirty, setPerformingSensitiveOperation } = useUnsavedChanges();

  // ⭐ عملية حساسة (جزء من مسار إصدار خطاب)
  useEffect(() => {
    setPerformingSensitiveOperation(true);
    return () => {
      setPerformingSensitiveOperation(false);
    };
  }, [setPerformingSensitiveOperation]);

   // ✅ مزامنة كل بيانات الصفحة مع المسودة المشتركة: الرجوع لخطوة الأفراد
  // ما يضيّعش حاجة، و"حفظ كمسودة" بيحفظ كل ده
  useEffect(() => {
    patchLetterDraft({
      letterTypeId: state?.letterTypeId ?? getLetterDraft().letterTypeId,
      letterTypeCode: state?.letterTypeCode ?? getLetterDraft().letterTypeCode,
      letterTypeName: state?.letterTypeName ?? getLetterDraft().letterTypeName,
      soldiers: localSoldiers,
      destination,
      destinationId,
      letterFieldValues,
      soldierFieldGeneralValues,
      soldierFieldOverrides,
      currentStep: 3,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    localSoldiers,
    destination,
    destinationId,
    letterFieldValues,
    soldierFieldGeneralValues,
    soldierFieldOverrides,
  ]);

  // ✅ فيه تعديل غير محفوظ = الحالة الحالية مختلفة عن آخر مسودة اتحفظت
  const isDirty = isLetterDraftDirty(draft);

  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);
  useEffect(() => {
    return () => setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getEffectiveSoldierFieldValue(
    fieldKey: string,
    soldierId: string
  ): string {
    const override = soldierFieldOverrides[fieldKey]?.[soldierId];
    if (override !== undefined) return override;

    const general = soldierFieldGeneralValues[fieldKey];
    if (general !== undefined) return general;

    const field = soldierFields.find((f) => f.key === fieldKey);
    return field?.default_value ?? "";
  }

  function handleSoldierFieldGeneralChange(fieldKey: string, value: string) {
    setSoldierFieldGeneralValues((prev) => ({ ...prev, [fieldKey]: value }));

    // ✅ تغيير القيمة العامة بيصفّر أي تخصيص فردي سابق لنفس
    // الحقل، عشان القيمة الجديدة تتطبق على الكل من الأول
    setSoldierFieldOverrides((prev) => ({ ...prev, [fieldKey]: {} }));

    if (errors[`soldier_${fieldKey}`]) {
      setErrors((prev) => ({ ...prev, [`soldier_${fieldKey}`]: "" }));
    }
  }

  function handleSoldierFieldOverride(
    fieldKey: string,
    soldierId: string,
    value: string
  ) {
    setSoldierFieldOverrides((prev) => ({
      ...prev,
      [fieldKey]: {
        ...(prev[fieldKey] ?? {}),
        [soldierId]: value,
      },
    }));

    if (errors[`soldier_${fieldKey}`]) {
      setErrors((prev) => ({ ...prev, [`soldier_${fieldKey}`]: "" }));
    }
  }

  function handleRemoveSoldier(id: string) {
    setLocalSoldiers((prev) => prev.filter((s) => s.id !== id));
  }

  // ✅ الرجوع لخطوة الأفراد لإضافة/تعديل من غير ما نخسر أي بيانات
  function goToSoldiersStep() {
    setDirty(false);

    navigate("/dashboard/issue-letter/soldiers", {
      state: {
        letterTypeId: state?.letterTypeId,
        letterTypeCode: state?.letterTypeCode,
        letterTypeName: state?.letterTypeName,
      },
    });
  }

  function goToStep(step: 1 | 2 | 3 | 4) {
    if (step === 1) {
      setDirty(false);
      navigate("/dashboard/issue-letter", { state: { keepDraft: true } });
    } else if (step === 2) {
      goToSoldiersStep();
    }
  }

  const problemSoldiers = localSoldiers.filter(
    (s) => draft.soldierProblems[s.id]
  );

  // ─────────────────────────────────────────────────────────
  // Options للحقول من نوع select_unit / select_administration
  // ─────────────────────────────────────────────────────────

  const unitOptions = units.map((unit) => unit.name).filter(Boolean);
  const administrationOptions = administrations.map((a) => a.name);

  function unitNameById(id: string): string {
    return units.find((u) => u.id === id)?.name ?? "";
  }

  function unitIdByName(name: string): string {
    return units.find((u) => u.name === name)?.id ?? "";
  }

  function administrationNameById(id: string): string {
    return administrations.find((a) => a.id === id)?.name ?? "";
  }

  function administrationIdByName(name: string): string {
    return administrations.find((a) => a.name === name)?.id ?? "";
  }
  // ✅ لو النوع مش من الأربعة الأساسية، الخطاب ممكن يكون موجّه
  // لجهة مش مسجّلة في النظام أصلًا — فمنقيدش حقل "جهة الخطاب"
  // باختيار من القايمة، ونسمح بكتابة قيمة حرة.
  const isSystemManagedType = letterTypeConfig
    ? (SYSTEM_MANAGED_LETTER_TYPE_CODES as readonly string[]).includes(
        letterTypeConfig.code
      )
    : true;
  // ─────────────────────────────────────────────────────────
  // تقسيم الحقول حسب النطاق
  // ─────────────────────────────────────────────────────────

  const letterFields: ExtraFieldDefinition[] = letterTypeConfig
    ? getLetterScopedFields(letterTypeConfig)
    : [];
  const soldierFields: ExtraFieldDefinition[] = letterTypeConfig
    ? getSoldierScopedFields(letterTypeConfig)
    : [];


  // ✅ نفس soldierFields لكن بس اللي متعلّم عليها "إظهار كعمود"
  const tableSoldierFields: ExtraFieldDefinition[] = letterTypeConfig
    ? getTableVisibleSoldierFields(letterTypeConfig)
    : [];

  // ─────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────

  function validate() {
    const e: Record<string, string> = {};
    if (isSystemManagedType) {
      if (!destinationId) {
        e.destination = "جهة الخطاب مطلوبة";
      }
    } else {
      if (!destination.trim()) {
        e.destination = "جهة الخطاب مطلوبة";
      }
    }

    if (!letterTypeConfig) {
      e.letterType = "نوع الخطاب غير موجود في قاعدة البيانات";
    }

    if (localSoldiers.length === 0) {
      e.soldiers = "يجب اختيار فرد واحد على الأقل";
    } else if (localSoldiers.some((s) => draft.soldierProblems[s.id])) {
      e.soldiers =
        "يوجد أفراد غير مؤهلين. أزلهم من الجدول أو ارجع لخطوة الأفراد قبل المتابعة.";
    }

    letterFields.forEach((field) => {
      if (field.required && !(letterFieldValues[field.key] ?? "").trim()) {
        e[field.key] = `${field.label} مطلوب`;
      }
    });

    soldierFields.forEach((field) => {
      if (field.required) {
        const missingFor = localSoldiers.filter(
          (soldier) =>
            !getEffectiveSoldierFieldValue(field.key, soldier.id).trim()
        );

        if (missingFor.length > 0) {
          e[`soldier_${field.key}`] = `${field.label} مطلوب لكل الأفراد`;
        }
      }

      // ✅ قاعدة: منع اختيار نفس الوحدة الأساسية للفرد (لو الحقل
      // محدد عليه forbid_same_as_primary_unit)
      if (field.type === "select_unit" && field.forbid_same_as_primary_unit) {
        const invalidNames = localSoldiers
          .filter((soldier) => {
            const value = getEffectiveSoldierFieldValue(
              field.key,
              soldier.id
            );
            return value && value === soldier.unitId;
          })
          .map((soldier) => soldier.name);

        if (invalidNames.length > 0) {
          e[`soldier_${field.key}`] = `لا يمكن اختيار نفس الوحدة الأساسية للفرد. يرجى تعديل ${field.label} للأفراد التاليين: ${invalidNames.join("، ")}`;
        }
      }
    });

    return e;
  }

  // ─────────────────────────────────────────────────────────
  // Submit → Review
  // ─────────────────────────────────────────────────────────

  function handleSubmit() {
    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});

    const soldiersPayload: SoldierWithExtraData[] = localSoldiers.map(
      (soldier) => {
        const extraData: Record<string, string> = {};

        soldierFields.forEach((field) => {
          extraData[field.key] = getEffectiveSoldierFieldValue(
            field.key,
            soldier.id
          );
        });

        return { ...soldier, extraData };
      }
    );

    const letterData: LetterData = {
      destination,
      destinationId,
      issuingUnitId: destinationId,
      letterFieldValues,
    };
    // ✅ كل حاجة هتتنقل كـ state لصفحة المراجعة النهائية
    setDirty(false);

    navigate("/dashboard/issue-letter/review", {
      state: {
        letterTypeId: letterTypeConfig?.id,
        letterTypeCode: letterTypeConfig?.code,
        letterTypeName: letterTypeConfig?.name,
        soldiers: soldiersPayload,
        letterData,
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // Loading / Error States
  // ─────────────────────────────────────────────────────────

  if (loadingData) {
    return (
      <div
        className="flex items-center justify-center w-full min-h-[400px]"
        dir="rtl"
      >
        <div style={{ ...F, fontSize: 18, color: "#415844" }}>
          جاري تحميل بيانات الخطاب...
        </div>
      </div>
    );
  }

  if (loadError || !letterTypeConfig) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 w-full min-h-[400px]"
        dir="rtl"
      >
        <div
          className="bg-red-50 border border-red-200 rounded-xl px-6 py-4"
          style={{ ...F, color: "#b91c1c" }}
        >
          {loadError || "تعذر تحميل بيانات نوع الخطاب."}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Render Helpers
  // ─────────────────────────────────────────────────────────

  function renderLetterFieldInput(field: ExtraFieldDefinition) {
    const value = letterFieldValues[field.key] ?? "";
    const error = errors[field.key];

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) =>
              handleLetterFieldChange(field.key, e.target.value)
            }
            placeholder={`اكتب ${field.label}`}
            rows={3}
            dir="rtl"
            className={[
              "w-full bg-white border rounded-[8px] px-3 py-3 text-right outline-none resize-none focus:border-[#1f3d97] transition-colors",
              error ? "border-[#ef4444]" : "border-[#e2e7f0]",
            ].join(" ")}
            style={{ ...F, fontSize: 16, color: "#4a5468" }}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) =>
              handleLetterFieldChange(field.key, e.target.value)
            }
            dir="rtl"
            className={[
              "w-full h-[52px] bg-white border rounded-[8px] px-3 text-right outline-none focus:border-[#1f3d97] transition-colors",
              error ? "border-[#ef4444]" : "border-[#e2e7f0]",
            ].join(" ")}
            style={{ ...F, fontSize: 16, color: "#2d3648" }}
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) =>
              handleLetterFieldChange(field.key, e.target.value)
            }
            dir="rtl"
            className={[
              "w-full h-[52px] bg-white border rounded-[8px] px-3 text-right outline-none focus:border-[#1f3d97] transition-colors",
              error ? "border-[#ef4444]" : "border-[#e2e7f0]",
            ].join(" ")}
            style={{ ...F, fontSize: 16, color: "#2d3648" }}
          />
        );

      case "month":
        return (
          <select
            value={value}
            onChange={(e) =>
              handleLetterFieldChange(field.key, e.target.value)
            }
            dir="rtl"
            className="w-full h-[52px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#1f3d97] bg-white"
            style={{ ...F, fontSize: 16, color: "#2d3648" }}
          >
            <option value="">اختر الشهر</option>
            {STAGE_MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        );

      case "select_unit":
        return (
          <FormDropdown
            placeholder={`ابحث عن ${field.label}`}
            options={unitOptions}
            value={unitNameById(value)}
            onChange={(name) =>
              handleLetterFieldChange(field.key, unitIdByName(name))
            }
            error={error}
          />
        );

      case "select_administration":
        return (
          <FormDropdown
            placeholder={`اختر ${field.label}`}
            options={administrationOptions}
            value={administrationNameById(value)}
            onChange={(name) =>
              handleLetterFieldChange(field.key, administrationIdByName(name))
            }
            error={error}
          />
        );

      case "text":
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) =>
              handleLetterFieldChange(field.key, e.target.value)
            }
            placeholder={`اكتب ${field.label}`}
            dir="rtl"
            className={[
              "w-full h-[52px] bg-white border rounded-[8px] px-3 text-right outline-none focus:border-[#1f3d97] transition-colors",
              error ? "border-[#ef4444]" : "border-[#e2e7f0]",
            ].join(" ")}
            style={{ ...F, fontSize: 16, color: "#2d3648" }}
          />
        );
    }
  }

  function renderSoldierFieldGeneralInput(field: ExtraFieldDefinition) {
    const value = soldierFieldGeneralValues[field.key] ?? "";

    switch (field.type) {
      case "select_unit":
        return (
          <FormDropdown
            placeholder={`ابحث عن ${field.label}`}
            options={unitOptions}
            value={unitNameById(value)}
            onChange={(name) =>
              handleSoldierFieldGeneralChange(field.key, unitIdByName(name))
            }
          />
        );

      case "select_administration":
        return (
          <FormDropdown
            placeholder={`اختر ${field.label}`}
            options={administrationOptions}
            value={administrationNameById(value)}
            onChange={(name) =>
              handleSoldierFieldGeneralChange(
                field.key,
                administrationIdByName(name)
              )
            }
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) =>
              handleSoldierFieldGeneralChange(field.key, e.target.value)
            }
            placeholder={`اكتب ${field.label} (يتطبق على الكل)`}
            dir="rtl"
            className="w-full h-[52px] bg-white border border-[#e2e7f0] rounded-[8px] px-3 text-right outline-none focus:border-[#1f3d97] transition-colors"
            style={{ ...F, fontSize: 16, color: "#2d3648" }}
          />
        );
    }
  }

  function renderSoldierFieldCell(
    field: ExtraFieldDefinition,
    soldier: SoldierData
  ) {
    const value = getEffectiveSoldierFieldValue(field.key, soldier.id);

    switch (field.type) {
      case "select_unit":
        return (
          <select
            value={value}
            onChange={(e) =>
              handleSoldierFieldOverride(field.key, soldier.id, e.target.value)
            }
            dir="rtl"
            className="w-full min-w-[140px] h-9 px-2 rounded-[6px] border border-[#e2e7f0] text-right outline-none focus:border-[#1f3d97] bg-white"
            style={{ ...F, fontSize: 13, color: "#2d3648" }}
          >
            <option value="">اختر</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        );

      case "select_administration":
        return (
          <select
            value={value}
            onChange={(e) =>
              handleSoldierFieldOverride(field.key, soldier.id, e.target.value)
            }
            dir="rtl"
            className="w-full min-w-[140px] h-9 px-2 rounded-[6px] border border-[#e2e7f0] text-right outline-none focus:border-[#1f3d97] bg-white"
            style={{ ...F, fontSize: 13, color: "#2d3648" }}
          >
            <option value="">اختر</option>
            {administrations.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) =>
              handleSoldierFieldOverride(field.key, soldier.id, e.target.value)
            }
            dir="rtl"
            className="w-full min-w-[140px] h-9 px-2 rounded-[6px] border border-[#e2e7f0] text-right outline-none focus:border-[#1f3d97]"
            style={{ ...F, fontSize: 13, color: "#2d3648" }}
          />
        );
    }
  }

  const thClass = "px-4 py-3 text-right border-b border-[#e2e7f0]";
  const tdClass = "px-4 py-3 text-right border-b border-[#e2e7f0]";

  const activeBaseColumns: BaseSoldierColumnKey[] =
    letterTypeConfig.visibleSoldierColumns ?? DEFAULT_VISIBLE_SOLDIER_COLUMNS;

  const tableHeaders = [
    ...activeBaseColumns.map((key) => BASE_COLUMN_RENDERERS[key].header),
    ...tableSoldierFields.map((f) => f.label),
    "الاجراء",
  ];

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <h1
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(22px,4vw,32px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        {`اصدار ${letterTypeConfig.name}`}
      </h1>

      <div className="flex justify-center">
        <LetterStepper activeStep={3} onStepClick={goToStep} />
      </div>

      <p
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(18px,3vw,24px)",
          color: "#404040",
          lineHeight: 1.5,
        }}
      >
        يرجي ادخال بيانات الخطاب
      </p>

      {errors.letterType && (
        <div
          className="w-full bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-right"
          style={{ ...F, color: "#b91c1c" }}
        >
          {errors.letterType}
        </div>
      )}

      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full">
        <div className="flex flex-col gap-5 px-6 py-5">
          {/* جهة الخطاب — حقل ثابت إجباري لكل الأنواع */}

          <div className="flex flex-col gap-1.5 w-full">
            <label
              style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
            >
              جهة الخطاب
            </label>

            <FormDropdown
              placeholder={
                isSystemManagedType
                  ? "ابحث عن جهة الخطاب"
                  : "ابحث عن جهة مسجّلة أو اكتب جهة غير مسجّلة"
              }
              options={unitOptions}
              value={destination}
              onChange={handleDestinationChange}
              error={errors.destination}
              allowCustomValue={!isSystemManagedType}
            />

            {!isSystemManagedType && (
              <p style={{ ...F, fontSize: 12, color: "#717d96" }}>
                نوع الخطاب ده مش من الأنواع الأساسية — تقدر تكتب اسم جهة غير
                مسجّلة في النظام.
              </p>
            )}
          </div>

          {/* حقول scope: letter — بتتولّد ديناميكيًا */}

          {letterFields.length > 0 && (
            <div className="w-full h-px bg-[#eff0f6]" />
          )}

          {letterFields.map((field) => (
            <div className="flex flex-col gap-1.5 w-full" key={field.key}>
              <label
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#2d3648",
                }}
              >
                {field.label}
              </label>

              {renderLetterFieldInput(field)}

              {errors[field.key] && (
                <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>
                  {errors[field.key]}
                </p>
              )}
            </div>
          ))}

          {/* القيم العامة لحقول scope: soldier — تتطبق على كل الأفراد
              افتراضيًا، وقابلة للتخصيص لكل فرد من الجدول تحت */}

          {soldierFields.length > 0 && (
            <div className="w-full h-px bg-[#eff0f6]" />
          )}

          {soldierFields.map((field) => (
            <div className="flex flex-col gap-1.5 w-full" key={field.key}>
              <label
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#2d3648",
                }}
              >
                {field.label}
              </label>

              {renderSoldierFieldGeneralInput(field)}

              <p
                style={{
                  ...F,
                  fontSize: 12,
                  color: "#717d96",
                  lineHeight: 1.5,
                }}
              >
                سيتم تطبيق القيمة على جميع الأفراد، ويمكنك تعديلها لكل فرد من
                خلال جدول الأفراد
              </p>

              {errors[`soldier_${field.key}`] && (
                <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>
                  {errors[`soldier_${field.key}`]}
                </p>
              )}
            </div>
          ))}

          <div className="w-full h-px bg-[#eff0f6]" />

          {/* شريط أدوات الأفراد */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
            >
              الأفراد ({localSoldiers.length})
            </span>

            <button
              type="button"
              onClick={goToSoldiersStep}
              className="min-h-[42px] px-4 rounded-[8px] transition-opacity hover:opacity-80"
              style={{ border: "2px solid #769D7B" }}
            >
              <span style={{ ...F, fontSize: 14, color: "#4f7a55" }}>
                تعديل الأفراد / إضافة أفراد
              </span>
            </button>
          </div>

          {problemSoldiers.length > 0 && (
            <div
              className="flex flex-col gap-2 px-4 py-3 rounded-[10px]"
              style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
            >
              <p style={{ ...F, fontWeight: 700, color: "#991b1b" }}>
                أفراد لم يعودوا مؤهلين، يرجى إزالتهم قبل المتابعة
              </p>

              {problemSoldiers.map((s) => (
                <p key={s.id} style={{ ...F, fontSize: 13, color: "#b91c1c" }}>
                  {s.name}: {draft.soldierProblems[s.id]}
                </p>
              ))}
            </div>
          )}

          {/* Soldiers Table */}

          {localSoldiers.length > 0 && (
            <div className="w-full overflow-x-auto rounded-[12px] border border-[#e2e7f0]">
              <table className="w-full min-w-[580px] border-collapse">
                <thead>
                  <tr className="bg-[#f7f9fc]">
                    {tableHeaders.map((h) => (
                      <th key={h} className={thClass}>
                        <div className="flex items-center gap-1 justify-start">
                          <span
                            style={{ ...F, fontSize: 14, color: "#717d96" }}
                          >
                            {h}
                          </span>
                          <SortIcon />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {localSoldiers.map((soldier) => (
                    <tr key={soldier.id}>
                      {activeBaseColumns.map((key) => (
                        <td className={tdClass} key={key}>
                          <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                            {BASE_COLUMN_RENDERERS[key].render(soldier)}
                          </span>
                        </td>
                      ))}

                      {tableSoldierFields.map((field) => (
                        <td className={tdClass} key={field.key}>
                          {renderSoldierFieldCell(field, soldier)}
                        </td>
                      ))}

                      <td className={tdClass}>
                        <button
                          type="button"
                          onClick={() => handleRemoveSoldier(soldier.id)}
                          className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors hover:opacity-80"
                          style={{ backgroundColor: "#fce8f1" }}
                        >
                          <Trash2 size={13} style={{ color: "#e3282c" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {localSoldiers.length === 0 && (
            <div
              className="w-full bg-[#fff8e8] border border-[#f4d58d] rounded-lg px-4 py-4 text-center"
              style={{ ...F, fontSize: 14, color: "#8a6500" }}
            >
              لم يتم اختيار أي أفراد.
              <br />
              ارجع إلى الخطوة السابقة لاختيار الأفراد.
            </div>
          )}

          {errors.soldiers && (
            <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>
              {errors.soldiers}
            </p>
          )}

                 <div className="w-full flex flex-wrap items-start gap-3 pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              className="min-h-[48px] px-6 rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90 active:opacity-80"
              style={{
                background: "linear-gradient(to bottom, #00b867, #00522e)",
                minWidth: 180,
              }}
            >
              <span style={{ ...F, fontSize: 16, color: "#f5f5f5" }}>
                المعاينه والحفظ النهائي
              </span>
            </button>

            <SaveDraftButton />
          </div>
        </div>
      </div>
    </div>
  );
}