import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";

// ─── Shared font style ────────────────────────────────────────────────────────
const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

// ─── Step types ───────────────────────────────────────────────────────────────
type StepState = "done" | "active" | "inactive";

interface StepDef {
  number: string;
  label: string;
  state: StepState;
}

// ─── Stepper connector ────────────────────────────────────────────────────────
function StepConnector({ done }: { done?: boolean }) {
  const color = done ? "#1a202c" : "#a1aebe";
  return (
    <div className="flex items-center gap-[3px] mb-[26px] shrink-0">
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

// ─── Step bubble ──────────────────────────────────────────────────────────────
function StepBubble({ step }: { step: StepDef }) {
  if (step.state === "done") {
    return (
      <div className="flex flex-col items-center gap-3 shrink-0">
        {/* Green circle with check */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(to bottom, #00b867, #00522e)",
            border: "2px solid #4bff62",
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 11.5L11.5 14L15.5 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
        <span
          className="text-center whitespace-nowrap"
          style={{ ...F, fontSize: 14, lineHeight: 1.4, background: "linear-gradient(to bottom,#00b867,#00522e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
        >
          {step.label}
        </span>
      </div>
    );
  }

  if (step.state === "active") {
    return (
      <div className="flex flex-col items-center gap-3 shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2"
          style={{ borderColor: "#2d3648" }}
        >
          <span style={{ ...F, fontSize: 14, color: "#2d3648", lineHeight: 1.4 }}>
            {step.number}
          </span>
        </div>
        <span
          className="text-center whitespace-nowrap"
          style={{ ...F, fontSize: 14, color: "#2d3648", lineHeight: 1.4 }}
        >
          {step.label}
        </span>
      </div>
    );
  }

  // inactive
  return (
    <div className="flex flex-col items-center gap-3 shrink-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2"
        style={{ borderColor: "#a1aebe" }}
      >
        <span style={{ ...F, fontSize: 14, color: "#2d3648", lineHeight: 1.4 }}>
          {step.number}
        </span>
      </div>
      <span
        className="text-center whitespace-nowrap"
        style={{ ...F, fontSize: 14, color: "#465668", lineHeight: 1.4 }}
      >
        {step.label}
      </span>
    </div>
  );
}

// ─── Soldier row in added list ────────────────────────────────────────────────
interface SoldierRowProps {
  number: string;
  index: number;
  onRemove: () => void;
}

function SoldierRow({ number, index, onRemove }: SoldierRowProps) {
  return (
    <div
      className="flex items-center justify-between w-full px-4 py-3 rounded-[8px] bg-white border"
      style={{ borderColor: "#e2e7f0" }}
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs"
          style={{ background: "#1f3d97", ...F }}
        >
          {index + 1}
        </span>
        <span style={{ ...F, fontSize: 15, color: "#2d3648" }}>{number}</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded"
        aria-label="حذف الفرد"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 18L18 6M6 6l12 12"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function SelectSoldiersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Letter type passed from previous page
  const letterType: "attachment" | "end-attachment" =
    (location.state as { letterType?: string })?.letterType === "end-attachment"
      ? "end-attachment"
      : "attachment";

  const pageTitle =
    letterType === "end-attachment" ? "اصدار خطاب إنهاء إلحاق" : "اصدار خطاب إلحاق";

  const [militaryNumber, setMilitaryNumber] = useState("");
  const [soldiers, setSoldiers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const steps: StepDef[] = [
    { number: "01", label: "تحديد نوع الخطاب", state: "done" },
    { number: "02", label: "تحديد الأفراد",     state: "active" },
    { number: "03", label: "بيانات الخطاب",     state: "inactive" },
    { number: "04", label: "المراجعة والتصديق", state: "inactive" },
  ];

  function handleAdd() {
    const trimmed = militaryNumber.trim();
    if (!trimmed) {
      setError("يرجى إدخال الرقم العسكري أولاً");
      inputRef.current?.focus();
      return;
    }
    if (soldiers.includes(trimmed)) {
      setError("هذا الرقم العسكري مضاف بالفعل");
      return;
    }
    setSoldiers((prev) => [...prev, trimmed]);
    setMilitaryNumber("");
    setError("");
    inputRef.current?.focus();
  }

  function handleRemove(index: number) {
    setSoldiers((prev) => prev.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAdd();
  }

  function handleNext() {
    if (soldiers.length === 0) return;
    navigate("/dashboard/issue-letter/letter-data", {
      state: { letterType, soldiers },
    });
  }

  const canProceed = soldiers.length > 0;

  return (
    <div className="flex flex-col items-center gap-10 w-full pb-10" dir="rtl">

      {/* ── Page title ─────────────────────────────────────── */}
      <h1
        className="text-center"
        style={{ ...F, fontWeight: 700, fontSize: "clamp(20px,4vw,32px)", color: "#2d3648", lineHeight: 1.5 }}
      >
        {pageTitle}
      </h1>

      {/* ── Stepper ────────────────────────────────────────── */}
      <div className="flex items-start justify-center flex-wrap gap-0" dir="rtl">
        <StepBubble step={steps[0]} />
        <StepConnector done />

        <StepBubble step={steps[1]} />
        <StepConnector />

        <StepBubble step={steps[2]} />
        <StepConnector />

        <StepBubble step={steps[3]} />
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-10 w-full max-w-[760px]">

        {/* Subtitle */}
        <p
          className="text-center"
          style={{ ...F, fontWeight: 700, fontSize: "clamp(18px,3vw,24px)", color: "#404040", lineHeight: 1.5 }}
        >
          يرجي تحديد الافراد المعنيين
        </p>

        {/* Input row: "اضافة الفرد" btn + military-number field */}
        <div className="flex items-end gap-6 w-full flex-wrap" dir="rtl">

          {/* Add button */}
          <button
            type="button"
            onClick={handleAdd}
            className="shrink-0 min-h-[52px] px-5 py-3 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[#f0f1fd] active:bg-[#e0e2fb]"
            style={{
              border: "2.5px solid #7d8ff0",
              minWidth: 140,
            }}
          >
            <span style={{ ...F, fontSize: 16, color: "#7d8ff0" }}>اضافة الفرد</span>
          </button>

          {/* Label + Input */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]" dir="rtl">
            <label
              style={{ ...F, fontWeight: 700, fontSize: 16, color: "#2d3648", lineHeight: 1.5 }}
            >
              الرقم العسكري
            </label>
            <input
              ref={inputRef}
              type="text"
              value={militaryNumber}
              onChange={(e) => { setMilitaryNumber(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              placeholder="ادخل الرقم العسكري"
              className="w-full rounded-[8px] bg-white outline-none transition-shadow"
              style={{
                border: error ? "1.5px solid #ef4444" : "1px solid #e2e7f0",
                padding: "12px",
                ...F,
                fontSize: 18,
                color: "#4a5468",
                direction: "rtl",
                boxShadow: "none",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.border = error
                  ? "1.5px solid #ef4444"
                  : "1.5px solid #7d8ff0")
              }
              onBlur={(e) =>
                (e.currentTarget.style.border = error
                  ? "1.5px solid #ef4444"
                  : "1px solid #e2e7f0")
              }
            />
            {error && (
              <p style={{ ...F, fontSize: 13, color: "#ef4444", lineHeight: 1.4 }}>{error}</p>
            )}
          </div>
        </div>

        {/* Added soldiers list */}
        {soldiers.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            <p style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>
              الأفراد المضافون ({soldiers.length})
            </p>
            <div className="flex flex-col gap-2 w-full">
              {soldiers.map((num, i) => (
                <SoldierRow
                  key={num}
                  number={num}
                  index={i}
                  onRemove={() => handleRemove(i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Navigate button */}
        <button
          type="button"
          disabled={!canProceed}
          onClick={handleNext}
          className="w-full min-h-[52px] rounded-[8px] flex items-center justify-center transition-colors"
          style={{
            background: canProceed ? "linear-gradient(to bottom, #00b867, #00522e)" : "#edf0f7",
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
