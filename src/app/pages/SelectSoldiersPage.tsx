import { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Trash2, AlertCircle } from "lucide-react";
import type { CSSProperties, KeyboardEvent } from "react";
import { supabase } from "../../lib/supabase";
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
                  {soldier.militaryId}
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

  const letterType =
    state?.letterType === "end-attachment"
      ? "end-attachment"
      : "attachment";

  const [militaryNumber, setMilitaryNumber] = useState("");
  const [soldiers, setSoldiers] = useState<SoldierData[]>([]);
  const [errorType, setErrorType] = useState<
    "not-found" | "duplicate" | "empty" | "database" | "undocumented-letter" | null
  >(null);
  const [pendingLetterNumber, setPendingLetterNumber] = useState<string | null>(null);

  const [searching, setSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

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

        rank:ranks!personnel_rank_id_fkey(
          id,
          name
        ),

        primary_unit:units!personnel_primary_unit_id_fkey(
          id,
          name
        ),

        attachment_unit:units!personnel_attachment_unit_id_fkey(
          id,
          name
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

    // ✅ منع إضافة فرد عليه خطاب سابق لسه "غير موثّق"
    // لازم يتوثّق الأول قبل ما نقدر نصدر خطاب جديد ليه
    const {
      data: pendingLetters,
      error: pendingError,
    } = await supabase
      .from("letter_personnel")
      .select("letter_id, letters!inner(letter_number, status)")
      .eq("personnel_id", data.id)
      .eq("letters.status", "UNDOCUMENTED");

    if (pendingError) {
      console.error(pendingError);
      setErrorType("database");
      return;
    }

    if (pendingLetters && pendingLetters.length > 0) {
      const firstPending = pendingLetters[0] as any;

      const letterRecord = Array.isArray(firstPending.letters)
        ? firstPending.letters[0]
        : firstPending.letters;

      setPendingLetterNumber(
        letterRecord?.letter_number != null
          ? String(letterRecord.letter_number)
          : null
      );

      setErrorType("undocumented-letter");
      return;
    }

    const rank = Array.isArray(data.rank)
      ? data.rank[0]
      : data.rank;

    const primaryUnit = Array.isArray(data.primary_unit)
      ? data.primary_unit[0]
      : data.primary_unit;

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

  function handleRemove(id: string) {
    setSoldiers((previous) =>
      previous.filter((soldier) => soldier.id !== id),
    );
  }

  function handleNext() {
    if (!soldiers.length) return;

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

  const pageTitle =
    letterType === "end-attachment"
      ? "اصدار خطاب إنهاء إلحاق"
      : "اصدار خطاب إلحاق";

  const hasError =
    errorType === "not-found" ||
    errorType === "duplicate" ||
    errorType === "database"||
     errorType === "undocumented-letter";;

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
                {errorType === "undocumented-letter" && (
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
                عنده خطاب سابق
                {pendingLetterNumber
                  ? ` رقم ${pendingLetterNumber} `
                  : " "}
                لسه غير موثّق. يجب رفع النسخة الموقّعة منه أولًا قبل إصدار
                خطاب جديد لنفس الفرد.
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