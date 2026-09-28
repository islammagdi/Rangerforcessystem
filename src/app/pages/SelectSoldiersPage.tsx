import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Trash2, AlertCircle } from "lucide-react";
import type { CSSProperties, KeyboardEvent } from "react";
import { supabase } from "../../lib/supabase";
import {
  checkEligibility,
  mapLetterTypeRow,
  extractAdministrationCode,
  type LetterTypeConfig,
} from "../../lib/letterTypeEngine";
import { useUnsavedChanges } from "../../lib/unsavedChanges";

function normalizeDigits(value: string): string {
  const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndex = arabicIndicDigits.indexOf(digit);
    if (arabicIndex !== -1) return String(arabicIndex);

    const persianIndex = persianDigits.indexOf(digit);
    if (persianIndex !== -1) return String(persianIndex);

    return digit;
  });
}
const F: CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

export type SoldierData = {
  id: string;
  militaryId: string;
  name: string;
  rank: string;
  rankId: string;
  unit: string;
  unitId: string;
  attachmentUnit: string;
  attachmentUnitId: string | null;
  dischargeDate: string | null;
  // ✅ فرد مُدخَل يدويًا (اسم + رتبة + وحدة نصية)، من غير سجل
  // حقيقي في جدول personnel — بيبقى معروف بالعلامة دي في كل
  // مكان بيستخدم بيانات الفرد لاحقًا
  isManual?: boolean;
};

function GreenCheckBubble({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="w-8 h-8 rounded-full flex items-center justify-center relative">
        <div
          className="w-8 h-8 rounded-full"
          style={{
            background: "linear-gradient(to bottom,#00b867,#00522e)",
          }}
        />

        <span
          className="absolute text-white"
          style={{ fontSize: 16 }}
        >
          ✓
        </span>
      </div>

      <span
        style={{
          ...F,
          fontSize: 14,
          color: "#00864d",
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
        <span style={{ ...F, fontSize: 14 }}>
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
          className="w-[3px] h-[3px] rounded-full"
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
}: {
  activeStep: 1 | 2 | 3 | 4;
}) {
  const steps = [
    { num: "01", label: "تحديد نوع الخطاب" },
    { num: "02", label: "تحديد الأفراد" },
    { num: "03", label: "بيانات الخطاب" },
    { num: "04", label: "المراجعة والتصديق" },
  ];

  return (
    <div
      className="flex items-start justify-center flex-wrap gap-0"
      dir="rtl"
    >
      {steps.map((step, index) => {
        const number = index + 1;
        const done = number < activeStep;
        const active = number === activeStep;

        return (
          <div
            key={step.num}
            className="flex items-start"
          >
            {done ? (
              <GreenCheckBubble label={step.label} />
            ) : (
              <NumberBubble
                num={step.num}
                label={step.label}
                active={active}
              />
            )}

            {index < 3 && (
              <StepDots dark={number < activeStep} />
            )}
          </div>
        );
      })}
    </div>
  );
}

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

function SoldiersTable({
  soldiers,
  onRemove,
}: {
  soldiers: SoldierData[];
  onRemove: (id: string) => void;
}) {
  const headers = [
    "رقم عسكري",
    "درجة",
    "اسم",
    "الوحدة",
    "وحدة الإلحاق",
    "الإجراء",
  ];

  return (
    <div
      className="w-full overflow-x-auto rounded-[12px] border border-[#e2e7f0]"
      dir="rtl"
    >
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr className="border-b border-[#e2e7f0] bg-[#f7f9fc]">
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-right"
              >
                <div className="flex items-center gap-1">
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#717d96",
                    }}
                  >
                    {header}
                  </span>
                  <SortIcon />
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {soldiers.map((soldier, index) => (
            <tr
              key={soldier.id}
              className={
                index < soldiers.length - 1
                  ? "border-b border-[#e2e7f0]"
                  : ""
              }
            >
              <td className="px-4 py-3">
                <span style={{ ...F, fontSize: 14 }}>
                  {soldier.militaryId || "-"}
                </span>
              </td>

              <td className="px-4 py-3">
                <span style={{ ...F, fontSize: 14 }}>
                  {soldier.rank}
                </span>
              </td>

              <td className="px-4 py-3">
                <span style={{ ...F, fontSize: 14 }}>
                  {soldier.name}
                </span>
              </td>

              <td className="px-4 py-3">
                <span style={{ ...F, fontSize: 14 }}>
                  {soldier.unit}
                </span>
              </td>

              <td className="px-4 py-3">
                <span style={{ ...F, fontSize: 14 }}>
                  {soldier.attachmentUnit || "لا يوجد"}
                </span>
              </td>

              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onRemove(soldier.id)}
                  className="w-8 h-8 rounded-[6px] flex items-center justify-center"
                  style={{ background: "#fce8f1" }}
                >
                  <Trash2
                    size={15}
                    color="#e3282c"
                  />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SelectSoldiersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    letterType?: string;
    letterTypeId?: string;
    letterTypeCode?: string;
    letterTypeName?: string;
  } | null;

  // ✅ نص الخطوة ده بقى مستخدم بس كنص عرض احتياطي في العنوان،
  // منطق التحقق الفعلي بقى معتمد بالكامل على letterTypeConfig
  const letterType = state?.letterType ?? "attachment";

  const [militaryNumber, setMilitaryNumber] = useState("");
  const [soldiers, setSoldiers] = useState<SoldierData[]>([]);

  // ✅ بيانات نوع الخطاب (بما فيها قواعد الأهلية) — بتتجاب مرة
  // واحدة وقت تحميل الصفحة
  const [letterTypeConfig, setLetterTypeConfig] =
    useState<LetterTypeConfig | null>(null);
  const [loadingType, setLoadingType] = useState(true);
  const [loadTypeError, setLoadTypeError] = useState("");

  const [errorType, setErrorType] = useState<
    "not-found" | "duplicate" | "empty" | "database" | "eligibility" | null
  >(null);

  const [eligibilityMessage, setEligibilityMessage] = useState("");

  const [searching, setSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ وضع الإدخال: بالرقم العسكري (الافتراضي دايمًا)، أو يدوي
  // (بيظهر بس لو نوع الخطاب بيسمح بيه)
  const [entryMode, setEntryMode] = useState<"military" | "manual">(
    "military"
  );

  const [manualMilitaryId, setManualMilitaryId] = useState("");
  const [manualRank, setManualRank] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualUnit, setManualUnit] = useState("");
  const [manualErrors, setManualErrors] = useState<Record<string, string>>(
    {}
  );

  // ─────────────────────────────────────────────────────────
  // تتبّع التعديلات غير المحفوظة
  // ─────────────────────────────────────────────────────────
  // بمجرد إضافة فرد واحد على الأقل للجدول (بأي طريقة) ولسه
  // محصلش انتقال للخطوة اللي بعدها، يبقى فيه تعديل غير محفوظ
// ─────────────────────────────────────────────────────────
// تتبّع التعديلات غير المحفوظة
// ─────────────────────────────────────────────────────────
const { setDirty, setPerformingSensitiveOperation } = useUnsavedChanges();

useEffect(() => {
  setDirty(soldiers.length > 0);
}, [soldiers.length, setDirty]);

useEffect(() => {
  return () => setDirty(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// ⭐ عملية حساسة (جزء من مسار إصدار خطاب)
useEffect(() => {
  setPerformingSensitiveOperation(true);
  return () => {
    setPerformingSensitiveOperation(false);
  };
}, [setPerformingSensitiveOperation]);

  /* =======================================================
     تحميل بيانات نوع الخطاب (بما فيها eligibility_rules)
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadLetterType() {
      if (!state?.letterTypeId) {
        setLoadTypeError(
          "نوع الخطاب غير موجود. ارجع واختر نوع الخطاب مرة أخرى."
        );
        setLoadingType(false);
        return;
      }

      setLoadingType(true);
      setLoadTypeError("");

      const { data, error } = await supabase
        .from("letter_types")
        .select(
          "id, name, code, body_template_singular, body_template_plural, extra_fields, personnel_effect, eligibility_rules, allow_manual_soldier_entry"
        )
        .eq("id", state.letterTypeId)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("LETTER TYPE LOAD ERROR:", error);
        setLoadTypeError(`تعذر تحميل بيانات نوع الخطاب: ${error.message}`);
        setLoadingType(false);
        return;
      }

      if (!data) {
        setLoadTypeError("نوع الخطاب غير موجود في قاعدة البيانات.");
        setLoadingType(false);
        return;
      }

      setLetterTypeConfig(mapLetterTypeRow(data));
      setLoadingType(false);
    }

    loadLetterType();

    return () => {
      mounted = false;
    };
  }, [state?.letterTypeId]);

  async function handleAdd() {
    const trimmed = normalizeDigits(militaryNumber.trim());

    if (!trimmed) {
      setErrorType("empty");
      inputRef.current?.focus();
      return;
    }

    if (
      soldiers.some(
        (soldier) => soldier.militaryId === trimmed,
      )
    ) {
      setErrorType("duplicate");
      return;
    }

    if (!letterTypeConfig) {
      setErrorType("database");
      return;
    }

    setSearching(true);
    setErrorType(null);

    const { data, error } = await supabase
      .from("personnel")
      .select(`
        id,
        military_number,
        full_name,
        rank_id,
        discharge_date,
        is_active,
        service_status_id,
        personnel_category_id,

        rank:ranks!personnel_rank_id_fkey(
          id,
          name
        ),

        category:personnel_categories!personnel_personnel_category_id_fkey(
          id,
          name,
          code
        ),

        primary_unit:units!personnel_primary_unit_id_fkey(
          id,
          name
        ),

        attachment_unit:units!personnel_attachment_unit_id_fkey(
          id,
          name
        ),

        service_status:service_statuses!personnel_service_status_id_fkey(
          id,
          name,
          code
        )
      `)
      .eq("military_number", trimmed)
      .maybeSingle();

    setSearching(false);

    if (error) {
      console.error(error);
      setErrorType("database");
      return;
    }

    if (!data) {
      setErrorType("not-found");
      return;
    }

    if (data.is_active === false) {
      setErrorType("not-found");
      return;
    }

    const categoryRecord = Array.isArray(data.category)
      ? data.category[0]
      : data.category;

    const statusRecord = Array.isArray(data.service_status)
      ? data.service_status[0]
      : data.service_status;

    const primaryUnit = Array.isArray(data.primary_unit)
      ? data.primary_unit[0]
      : data.primary_unit;

    // ✅ التحقق كله بقى بنداء واحد بيفهم قواعد أهلية النوع من
    // قاعدة البيانات (eligibilityRules)، بدل شروط منفصلة مكتوبة
    // يدويًا لكل نوع خطاب
    const eligibility = await checkEligibility(
      letterTypeConfig.eligibilityRules,
      {
        id: data.id,
        serviceStatusCode: statusRecord?.code ?? null,
        categoryCode: categoryRecord?.code ?? null,
        administrationCode: extractAdministrationCode(
          data.military_number ?? ""
        ),
        primaryUnitId: primaryUnit?.id ?? data.primary_unit ?? null,
      },
      supabase
    );

    if (!eligibility.ok) {
      setErrorType("eligibility");
      setEligibilityMessage(
        eligibility.relatedLetterNumber
          ? `${eligibility.errorMessage} (رقم الخطاب: ${eligibility.relatedLetterNumber})`
          : eligibility.errorMessage
      );

      return;
    }

    const rank = Array.isArray(data.rank)
      ? data.rank[0]
      : data.rank;



    const attachmentUnit = Array.isArray(
      data.attachment_unit,
    )
      ? data.attachment_unit[0]
      : data.attachment_unit;

    const soldier: SoldierData = {
      id: data.id,
      militaryId: data.military_number,
      name: data.full_name,
      rank: rank?.name ?? "غير محدد",
      rankId: data.rank_id,
      unit: primaryUnit?.name ?? "غير محدد",
      unitId: primaryUnit?.id ?? data.primary_unit,
      attachmentUnit: attachmentUnit?.name ?? "",
      attachmentUnitId:
        attachmentUnit?.id ?? data.attachment_unit ?? null,
      dischargeDate: data.discharge_date,
    };

    setSoldiers((previous) => [
      ...previous,
      soldier,
    ]);

    setMilitaryNumber("");
    setErrorType(null);
    inputRef.current?.focus();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      void handleAdd();
    }
  }

  function handleAddManual() {
    const errs: Record<string, string> = {};

    if (!manualRank.trim()) errs.rank = "الرتبة مطلوبة";
    if (!manualName.trim()) errs.name = "الاسم مطلوب";
    if (!manualUnit.trim()) errs.unit = "الوحدة مطلوبة";

    if (Object.keys(errs).length > 0) {
      setManualErrors(errs);
      return;
    }

    setManualErrors({});

    const soldier: SoldierData = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      militaryId: normalizeDigits(manualMilitaryId.trim()),
      name: manualName.trim(),
      rank: manualRank.trim(),
      rankId: "",
      unit: manualUnit.trim(),
      unitId: "",
      attachmentUnit: "",
      attachmentUnitId: null,
      dischargeDate: null,
      isManual: true,
    };

    setSoldiers((previous) => [...previous, soldier]);

    setManualMilitaryId("");
    setManualRank("");
    setManualName("");
    setManualUnit("");
  }
  function handleRemove(id: string) {
    setSoldiers((previous) =>
      previous.filter((soldier) => soldier.id !== id),
    );
  }

  function handleNext() {
    if (!soldiers.length) return;

    // ✅ الأفراد هيتنقلوا كـ state لصفحة "بيانات الخطاب"، فمن هنا
    // بقت مسؤولية التتبّع بتاعة الصفحة الجاية
    setDirty(false);

    navigate(
      "/dashboard/issue-letter/letter-data",
      {
        state: {
          letterType,
          letterTypeId: state?.letterTypeId,
          letterTypeCode: state?.letterTypeCode,
          letterTypeName: state?.letterTypeName,
          soldiers,
        },
      },
    );
  }

  const pageTitle = state?.letterTypeName
    ? `اصدار ${state.letterTypeName}`
    : "اصدار خطاب";

  const hasError =
    errorType === "not-found" ||
    errorType === "duplicate" ||
    errorType === "database" ||
    errorType === "eligibility";

  if (loadingType) {
    return (
      <div
        className="flex items-center justify-center w-full min-h-[300px]"
        dir="rtl"
      >
        <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
          جاري تحميل بيانات نوع الخطاب...
        </span>
      </div>
    );
  }

  if (loadTypeError) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 w-full min-h-[300px]"
        dir="rtl"
      >
        <div
          className="rounded-[10px] px-5 py-4"
          style={{
            ...F,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          {loadTypeError}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-6 w-full pb-10"
      dir="rtl"
    >
      <h1
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(22px,4vw,32px)",
          color: "#2d3648",
        }}
      >
        {pageTitle}
      </h1>

      <div className="flex justify-center">
        <LetterStepper activeStep={2} />
      </div>

      <div className="flex flex-col gap-5 w-full max-w-[760px] mx-auto">
        <p
          className="text-center"
          style={{
            ...F,
            fontWeight: 700,
            fontSize: "clamp(18px,3vw,24px)",
            color: "#404040",
          }}
        >
          يرجي تحديد الافراد المعنيين
        </p>

        {letterTypeConfig?.allowManualSoldierEntry && (
          <div className="flex items-center gap-2 justify-center">
            <button
              type="button"
              onClick={() => setEntryMode("military")}
              className="px-4 py-2 rounded-[8px]"
              style={{
                ...F,
                fontSize: 14,
                background: entryMode === "military" ? "#ebedfd" : "transparent",
                color: entryMode === "military" ? "#1f3d97" : "#717d96",
                border: "1px solid #e2e7f0",
              }}
            >
              بالرقم العسكري
            </button>

            <button
              type="button"
              onClick={() => setEntryMode("manual")}
              className="px-4 py-2 rounded-[8px]"
              style={{
                ...F,
                fontSize: 14,
                background: entryMode === "manual" ? "#ebedfd" : "transparent",
                color: entryMode === "manual" ? "#1f3d97" : "#717d96",
                border: "1px solid #e2e7f0",
              }}
            >
              إدخال يدوي (فرد غير مسجّل)
            </button>
          </div>
        )}

        {entryMode === "military" ? (
          <>
            <div className="flex flex-col gap-2">
              <label
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#2d3648",
                }}
              >
                الرقم العسكري
              </label>

              <input
                ref={inputRef}
                value={militaryNumber}
                type="text"
                onChange={(event) => {
                  setMilitaryNumber(event.target.value);
                  setErrorType(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="ادخل الرقم العسكري"
                className="w-full rounded-[8px] bg-white outline-none"
                style={{
                  border: hasError
                    ? "1.5px solid #ef4444"
                    : "1px solid #e2e7f0",
                  padding: "12px",
                  ...F,
                  fontSize: 18,
                  color: "#4a5468",
                }}
              />
            </div>

            <button
              type="button"
              disabled={searching}
              onClick={() => void handleAdd()}
              className="shrink-0 min-h-[52px] px-5 py-3 rounded-[8px]"
              style={{
                border: "2.5px solid #769D7B",
                color: "#769D7B",
                opacity: searching ? 0.6 : 1,
              }}
            >
              <span style={{ ...F, fontSize: 16 }}>
                {searching ? "جاري البحث..." : "اضافة الفرد"}
              </span>
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-3 bg-[#fafbfc] border border-[#e2e7f0] rounded-[10px] p-4">
            <p style={{ ...F, fontSize: 13, color: "#8a6500" }}>
              الفرد ده مش هيتضاف لقاعدة بيانات الأفراد ولا هيتأثر بيه أي حاجة
              في بياناته — بيانات وصفية بس للخطاب ده.
            </p>
            <div className="flex flex-col gap-1.5">
              <label style={{ ...F, fontWeight: 700, fontSize: 14, color: "#2d3648" }}>
                الرقم العسكري (اختياري)
              </label>

              <input
                type="text"
                value={manualMilitaryId}
                onChange={(e) => setManualMilitaryId(e.target.value)}
                dir="rtl"
                placeholder="لو متاح، لغرض التوحيد مع باقي الأفراد"
                className="w-full h-[46px] bg-white border border-[#e2e7f0] rounded-[8px] px-3 text-right outline-none focus:border-[#1f3d97]"
                style={{ ...F, fontSize: 15, color: "#2d3648" }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label style={{ ...F, fontWeight: 700, fontSize: 14, color: "#2d3648" }}>
                  الرتبة
                </label>

                <input
                  type="text"
                  value={manualRank}
                  onChange={(e) => {
                    setManualRank(e.target.value);
                    if (manualErrors.rank) {
                      setManualErrors((p) => ({ ...p, rank: "" }));
                    }
                  }}
                  dir="rtl"
                  className={[
                    "w-full h-[46px] bg-white border rounded-[8px] px-3 text-right outline-none focus:border-[#1f3d97]",
                    manualErrors.rank ? "border-[#ef4444]" : "border-[#e2e7f0]",
                  ].join(" ")}
                  style={{ ...F, fontSize: 15, color: "#2d3648" }}
                />

                {manualErrors.rank && (
                  <p style={{ ...F, fontSize: 12, color: "#ef4444" }}>
                    {manualErrors.rank}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <label style={{ ...F, fontWeight: 700, fontSize: 14, color: "#2d3648" }}>
                  الاسم
                </label>

                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => {
                    setManualName(e.target.value);
                    if (manualErrors.name) {
                      setManualErrors((p) => ({ ...p, name: "" }));
                    }
                  }}
                  dir="rtl"
                  className={[
                    "w-full h-[46px] bg-white border rounded-[8px] px-3 text-right outline-none focus:border-[#1f3d97]",
                    manualErrors.name ? "border-[#ef4444]" : "border-[#e2e7f0]",
                  ].join(" ")}
                  style={{ ...F, fontSize: 15, color: "#2d3648" }}
                />

                {manualErrors.name && (
                  <p style={{ ...F, fontSize: 12, color: "#ef4444" }}>
                    {manualErrors.name}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <label style={{ ...F, fontWeight: 700, fontSize: 14, color: "#2d3648" }}>
                  الوحدة
                </label>

                <input
                  type="text"
                  value={manualUnit}
                  onChange={(e) => {
                    setManualUnit(e.target.value);
                    if (manualErrors.unit) {
                      setManualErrors((p) => ({ ...p, unit: "" }));
                    }
                  }}
                  dir="rtl"
                  className={[
                    "w-full h-[46px] bg-white border rounded-[8px] px-3 text-right outline-none focus:border-[#1f3d97]",
                    manualErrors.unit ? "border-[#ef4444]" : "border-[#e2e7f0]",
                  ].join(" ")}
                  style={{ ...F, fontSize: 15, color: "#2d3648" }}
                />

                {manualErrors.unit && (
                  <p style={{ ...F, fontSize: 12, color: "#ef4444" }}>
                    {manualErrors.unit}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddManual}
              className="self-start px-5 py-2.5 rounded-[8px]"
              style={{ border: "2.5px solid #769D7B", color: "#769D7B" }}
            >
              <span style={{ ...F, fontSize: 15 }}>إضافة الفرد</span>
            </button>
          </div>
        )}

        {errorType === "not-found" && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-[10px]"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            <AlertCircle color="#ef4444" />

            <div>
              <p
                style={{
                  ...F,
                  fontWeight: 700,
                  color: "#991b1b",
                }}
              >
                رقم عسكري غير موجود
              </p>

              <p
                style={{
                  ...F,
                  fontSize: 13,
                  color: "#b91c1c",
                }}
              >
                لا يوجد فرد مرتبط بالرقم العسكري المدخل.
              </p>
            </div>
          </div>
        )}

        {errorType === "duplicate" && (
          <div
            className="px-4 py-3 rounded-[10px]"
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
            }}
          >
            <p
              style={{
                ...F,
                fontSize: 14,
                color: "#92400e",
              }}
            >
              هذا الرقم العسكري مضاف بالفعل.
            </p>
          </div>
        )}

        {errorType === "eligibility" && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-[10px]"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            <AlertCircle color="#ef4444" />

            <div>
              <p
                style={{
                  ...F,
                  fontWeight: 700,
                  color: "#991b1b",
                }}
              >
                لا يمكن إضافة هذا الفرد
              </p>

              <p
                style={{
                  ...F,
                  fontSize: 13,
                  color: "#b91c1c",
                }}
              >
                {eligibilityMessage}
              </p>
            </div>
          </div>
        )}

        {errorType === "empty" && (
          <div
            className="px-4 py-3 rounded-[10px]"
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
            }}
          >
            <p
              style={{
                ...F,
                fontSize: 14,
                color: "#92400e",
              }}
            >
              من فضلك أدخل الرقم العسكري.
            </p>
          </div>
        )}

        {errorType === "database" && (
          <div
            className="px-4 py-3 rounded-[10px]"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            <p
              style={{
                ...F,
                fontSize: 14,
                color: "#991b1b",
              }}
            >
              حدث خطأ أثناء الاتصال بقاعدة البيانات.
            </p>
          </div>
        )}

        {soldiers.length > 0 && (
          <SoldiersTable
            soldiers={soldiers}
            onRemove={handleRemove}
          />
        )}

        <button
          type="button"
          disabled={soldiers.length === 0}
          onClick={handleNext}
          className="w-full min-h-[52px] rounded-[8px]"
          style={{
            background:
              soldiers.length > 0
                ? "linear-gradient(to bottom,#00b867,#00522e)"
                : "#edf0f7",
          }}
        >
          <span
            style={{
              ...F,
              fontSize: 16,
              color:
                soldiers.length > 0
                  ? "#fff"
                  : "#cbd2e0",
            }}
          >
            الانتقال لبيانات الخطاب
          </span>
        </button>
      </div>
    </div>
  );
}