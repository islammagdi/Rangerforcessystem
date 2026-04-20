import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { Trash2, AlertCircle } from "lucide-react";
import { getSoldiers } from "../data/soldiersData";
import type { SoldierData } from "../data/soldiersData";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── Shared Stepper ───────────────────────────────────────────────────────────
function GreenCheckBubble({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
        >
          <defs>
            <linearGradient
              id="sg1"
              x1="16"
              x2="16"
              y1="0"
              y2="32"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00B867" />
              <stop offset="1" stopColor="#00522E" />
            </linearGradient>
            <linearGradient
              id="sg2"
              x1="16"
              x2="16"
              y1="0"
              y2="32"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4BFF62" />
              <stop offset="1" stopColor="#318B3C" />
            </linearGradient>
          </defs>
          <circle
            cx="16"
            cy="16"
            r="15"
            fill="url(#sg1)"
            strokeWidth="2"
          />
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
          background:
            "linear-gradient(to bottom, #00b867, #00522e)",
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
        style={{ borderColor: active ? "#2d3648" : "#a1aebe" }}
      >
        <span
          style={{
            ...F,
            fontSize: 14,
            color: active ? "#2d3648" : "#2d3648",
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
  const color = dark ? "#1A202C" : "#A1AEBE";
  return (
    <div className="flex items-center gap-[3px] mt-4 mx-2 shrink-0">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] h-[3px] rounded-full shrink-0"
          style={{ background: color }}
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
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < activeStep;
        const isActive = stepNum === activeStep;
        return (
          <div key={step.num} className="flex items-start">
            {isDone ? (
              <GreenCheckBubble label={step.label} />
            ) : (
              <NumberBubble
                num={step.num}
                label={step.label}
                active={isActive}
              />
            )}
            {idx < steps.length - 1 && (
              <StepDots dark={idx + 1 < activeStep} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
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
    "الاجراء",
    "الوحدة",
    "اسم",
    "درجة",
    "رقم عسكري",
  ];
  const thClass = "px-4 py-3 text-right";
  const tdClass = "px-4 py-3 text-right";

  return (
    <div
      className="w-full overflow-x-auto rounded-[12px] border border-[#e2e7f0]"
      dir="rtl"
    >
      <table className="w-full min-w-[600px] border-collapse">
        <thead>
          <tr className="border-b border-[#e2e7f0] bg-[#f7f9fc]">
            {headers.map((h) => (
              <th key={h} className={thClass}>
                <div className="flex items-center gap-1 justify-end">
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#717d96",
                    }}
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
          {soldiers.map((soldier, idx) => (
            <tr
              key={soldier.id}
              className={
                idx < soldiers.length - 1
                  ? "border-b border-[#e2e7f0]"
                  : ""
              }
            >
              <td className={tdClass}>
                <button
                  type="button"
                  onClick={() => onRemove(soldier.id)}
                  className="w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ backgroundColor: "#fce8f1" }}
                >
                  <Trash2
                    size={15}
                    style={{ color: "#e3282c" }}
                  />
                </button>
              </td>
              <td className={tdClass}>
                <span
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#2d3648",
                  }}
                >
                  {soldier.unit}
                </span>
              </td>
              <td className={tdClass}>
                <span
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#2d3648",
                  }}
                >
                  {soldier.name}
                </span>
              </td>
              <td className={tdClass}>
                <span
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#2d3648",
                  }}
                >
                  {soldier.rank}
                </span>
              </td>
              <td className={tdClass}>
                <span
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#2d3648",
                  }}
                >
                  {soldier.militaryId}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function SelectSoldiersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const letterType: "attachment" | "end-attachment" =
    (location.state as { letterType?: string })?.letterType ===
    "end-attachment"
      ? "end-attachment"
      : "attachment";

  const pageTitle =
    letterType === "end-attachment"
      ? "اصدار خطاب إنهاء إلحاق"
      : "اصدار خطاب إلحاق";

  const [militaryNumber, setMilitaryNumber] = useState("");
  const [soldiers, setSoldiers] = useState<SoldierData[]>([]);
  const [errorType, setErrorType] = useState<
    "not-found" | "duplicate" | "empty" | null
  >(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const trimmed = militaryNumber.trim();
    if (!trimmed) {
      setErrorType("empty");
      inputRef.current?.focus();
      return;
    }

    if (soldiers.some((s) => s.militaryId === trimmed)) {
      setErrorType("duplicate");
      return;
    }

    const found = getSoldiers().find(
      (s) => s.militaryId === trimmed,
    );
    if (!found) {
      setErrorType("not-found");
      return;
    }

    setSoldiers((prev) => [...prev, found]);
    setMilitaryNumber("");
    setErrorType(null);
    inputRef.current?.focus();
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Enter") handleAdd();
  }

  function handleRemove(id: string) {
    setSoldiers((prev) => prev.filter((s) => s.id !== id));
  }

  function handleNext() {
    if (soldiers.length === 0) return;
    navigate("/dashboard/issue-letter/letter-data", {
      state: { letterType, soldiers },
    });
  }

  const hasError =
    errorType === "not-found" || errorType === "duplicate";
  const canProceed = soldiers.length > 0;

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      {/* ── Title ───────────────────────────────────────────── */}
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
        {pageTitle}
      </h1>

      {/* ── Stepper ─────────────────────────────────────────── */}
      <div className="flex justify-center">
        <LetterStepper activeStep={2} />
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 w-full max-w-[760px] mx-auto">
        {/* Subtitle */}
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
          يرجي تحديد الافراد المعنيين
        </p>

        {/* Label + Input */}
        <div
          className="flex flex-col gap-1.5 flex-1 min-w-[200px]"
          dir="rtl"
        >
          <label
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 16,
              color: "#2d3648",
              lineHeight: 1.5,
            }}
          >
            الرقم العسكري
          </label>
          <input
            ref={inputRef}
            type="text"
            value={militaryNumber}
            onChange={(e) => {
              setMilitaryNumber(e.target.value);
              if (errorType) setErrorType(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="ادخل الرقم العسكري"
            className="w-full rounded-[8px] bg-white outline-none transition-shadow"
            style={{
              border: hasError
                ? "1.5px solid #ef4444"
                : "1px solid #e2e7f0",
              padding: "12px",
              ...F,
              fontSize: 18,
              color: hasError ? "#ef4444" : "#4a5468",
              direction: "rtl",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.border = hasError
                ? "1.5px solid #ef4444"
                : "1.5px solid #769D7B")
            }
            onBlur={(e) =>
              (e.currentTarget.style.border = hasError
                ? "1.5px solid #ef4444"
                : "1px solid #e2e7f0")
            }
          />
        </div>
        {/* Add button */}
        <button
          type="button"
          onClick={handleAdd}
          className="shrink-0 min-h-[52px] px-5 py-3 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[#f0f1fd] active:bg-[#e0e2fb]"
          style={{
            border: "2.5px solid #769D7B",
            minWidth: 140,
          }}
        >
          <span
            style={{ ...F, fontSize: 16, color: "#769D7B" }}
          >
            اضافة الفرد
          </span>
        </button>
        {/* Input row */}
        <div
          className="flex items-end gap-4 w-full flex-wrap"
          dir="rtl"
        ></div>

        {/* Error alert */}
        {errorType === "not-found" && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-[10px]"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            <div className="shrink-0 mt-0.5">
              <AlertCircle
                size={22}
                style={{ color: "#ef4444" }}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <p
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 15,
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
                  lineHeight: 1.5,
                }}
              >
                لا يوجد فرد مرتبط الرقم العسكري المدخل. يرجي
                التأكد من صحة الرقم العسكري
              </p>
            </div>
          </div>
        )}

        {errorType === "duplicate" && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-[10px]"
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
            }}
          >
            <AlertCircle
              size={22}
              style={{ color: "#d97706" }}
              className="shrink-0 mt-0.5"
            />
            <p style={{ ...F, fontSize: 14, color: "#92400e" }}>
              هذا الرقم العسكري مضاف بالفعل
            </p>
          </div>
        )}

        {/* Soldiers table */}
        {soldiers.length > 0 && (
          <SoldiersTable
            soldiers={soldiers}
            onRemove={handleRemove}
          />
        )}

        {/* Next button */}
        <button
          type="button"
          disabled={!canProceed}
          onClick={handleNext}
          className="w-full min-h-[52px] rounded-[8px] flex items-center justify-center transition-colors"
          style={{
            background: canProceed
              ? "linear-gradient(to bottom, #00b867, #00522e)"
              : "#edf0f7",
            cursor: canProceed ? "pointer" : "not-allowed",
          }}
        >
          <span
            style={{
              ...F,
              fontSize: 16,
              color: canProceed ? "#ffffff" : "#cbd2e0",
              lineHeight: 1.5,
            }}
          >
            الانتقال لبيانات الخطاب
          </span>
        </button>
      </div>
    </div>
  );
}