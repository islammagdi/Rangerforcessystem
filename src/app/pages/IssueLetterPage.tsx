import { useState } from "react";
import { useNavigate } from "react-router";

// ─── Shared style ─────────────────────────────────────────────────────────────
const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── SVG path for the staircase / steps icon (p8cec1f0) ──────────────────────
const STEPS_PATH =
  "M0 11.25V17.5C0 17.8315 0.131696 18.1495 0.366117 18.3839C0.600537 18.6183 0.918479 18.75 1.25 18.75H7.5C7.83152 18.75 8.14946 18.6183 8.38388 18.3839C8.6183 18.1495 8.75 17.8315 8.75 17.5C8.75 17.1685 8.6183 16.8505 8.38388 16.6161C8.14946 16.3817 7.83152 16.25 7.5 16.25H2.5V11.25C2.5 10.9185 2.3683 10.6005 2.13388 10.3661C1.89946 10.1317 1.58152 10 1.25 10C0.918479 10 0.600537 10.1317 0.366117 10.3661C0.131696 10.6005 0 10.9185 0 11.25ZM5 6.25V12.5C5 12.8315 5.1317 13.1495 5.36612 13.3839C5.60054 13.6183 5.91848 13.75 6.25 13.75H12.5C12.8315 13.75 13.1495 13.6183 13.3839 13.3839C13.6183 13.1495 13.75 12.8315 13.75 12.5C13.75 12.1685 13.6183 11.8505 13.3839 11.6161C13.1495 11.3817 12.8315 11.25 12.5 11.25H7.5V6.25C7.5 5.91848 7.3683 5.60054 7.13388 5.36612C6.89946 5.1317 6.58152 5 6.25 5C5.91848 5 5.60054 5.1317 5.36612 5.36612C5.1317 5.60054 5 5.91848 5 6.25ZM10 1.25V7.5C10 7.83152 10.1317 8.14946 10.3661 8.38388C10.6005 8.6183 10.9185 8.75 11.25 8.75H17.5C17.8315 8.75 18.1495 8.6183 18.3839 8.38388C18.6183 8.14946 18.75 7.83152 18.75 7.5C18.75 7.16848 18.6183 6.85054 18.3839 6.61612C18.1495 6.3817 17.8315 6.25 17.5 6.25H12.5V1.25C12.5 0.918479 12.3683 0.600537 12.1339 0.366117C11.8995 0.131696 11.5815 0 11.25 0C10.9185 0 10.6005 0.131696 10.3661 0.366117C10.1317 0.600537 10 0.918479 10 1.25Z";

// ─── Step indicator ───────────────────────────────────────────────────────────
interface StepProps {
  number: string;
  label: string;
  active?: boolean;
}

function Step({ number, label, active = false }: StepProps) {
  return (
    <div className="flex flex-col items-center gap-3 shrink-0">
      {/* Circle */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2"
        style={{ borderColor: active ? "#415844" : "#a1aebe" }}
      >
        <span
          style={{
            ...F,
            fontSize: 14,
            color: active ? "#415844" : "#2d3648",
            lineHeight: 1.4,
          }}
        >
          {number}
        </span>
      </div>
      {/* Label */}
      <span
        className="text-center whitespace-nowrap"
        style={{
          ...F,
          fontSize: 14,
          color: active ? "#415844" : "#465668",
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Dotted connector between steps ──────────────────────────────────────────
function StepConnector() {
  return (
    <div className="flex items-center gap-[3px] mb-[26px] shrink-0">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] h-[3px] rounded-full bg-[#a1aebe]"
        />
      ))}
    </div>
  );
}

// ─── Letter type card ─────────────────────────────────────────────────────────
interface LetterCardProps {
  title: string;
  iconRotate: string;
  selected: boolean;
  onClick: () => void;
}

function LetterCard({
  title,
  iconRotate,
  selected,
  onClick,
}: LetterCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 min-w-[220px] max-w-[300px] bg-white rounded-[24px] flex flex-col items-center gap-6 px-12 py-8 cursor-pointer transition-all duration-200"
      style={{
        boxShadow: selected
          ? "0 0 0 2.5px #415844, 0px 4px 16px 0px rgba(31,61,151,0.18)"
          : "0px 1px 4px 0px rgba(0,0,0,0.15)",
        outline: "none",
      }}
    >
      {/* Icon */}
      <div className="w-20 h-20 flex items-center justify-center">
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ transform: iconRotate }}
        >
          <svg
            width="76"
            height="76"
            viewBox="0 0 18.75 18.75"
            fill="none"
          >
            <path
              clipRule="evenodd"
              d={STEPS_PATH}
              fill={selected ? "#415844" : "#4a5468"}
              fillRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Title */}
      <span
        style={{
          ...F,
          fontWeight: 700,
          fontSize: 24,
          color: selected ? "#415844" : "#575d65",
          lineHeight: 1.5,
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function IssueLetterPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<
    "attachment" | "end-attachment" | null
  >(null);

  function handleNext() {
    if (!selected) return;
    navigate("/dashboard/issue-letter/soldiers", {
      state: { letterType: selected },
    });
  }

  return (
    <div
      className="flex flex-col items-center gap-10 w-full pb-10"
      dir="rtl"
    >
      {/* ── Page title ──────────────────────────────────────── */}
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
        اصدار خطابات
      </h1>

      {/* ── Stepper ─────────────────────────────────────────── */}
      <div
        className="flex items-start justify-center gap-0 flex-wrap"
        dir="rtl"
      >
        {/* Step 01 — active */}
        <Step number="01" label="تحديد نوع الخطاب" active />
        <StepConnector />

        {/* Step 02 */}
        <Step number="02" label="تحديد الأفراد" />
        <StepConnector />

        {/* Step 03 */}
        <Step number="03" label="بيانات الخطاب" />
        <StepConnector />

        {/* Step 04 */}
        <Step number="04" label="المراجعة والتصديق" />
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-10 w-full max-w-[640px]">
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
          يرجى تحديد نوع الخطاب المطلوب إصداره
        </p>

        {/* Cards row */}
        <div className="flex items-stretch justify-center gap-8 w-full flex-wrap">
          {/* خطاب إلحاق */}
          <LetterCard
            title="خطاب إلحاق"
            iconRotate="rotate(90deg) scaleY(-1)"
            selected={selected === "attachment"}
            onClick={() => setSelected("attachment")}
          />

          {/* خطاب إنهاء إلحاق */}
          <LetterCard
            title="خطاب إنهاء إلحاق"
            iconRotate="rotate(-90deg) scaleY(-1)"
            selected={selected === "end-attachment"}
            onClick={() => setSelected("end-attachment")}
          />
        </div>

        {/* Navigate button */}
        <button
          type="button"
          disabled={!selected}
          onClick={handleNext}
          className="w-full min-h-[52px] rounded-[8px] flex items-center justify-center transition-colors"
          style={{
            background: selected
              ? "linear-gradient(to bottom, #00b867, #00522e)"
              : "#edf0f7",
            cursor: selected ? "pointer" : "not-allowed",
          }}
        >
          <span
            style={{
              ...F,
              fontSize: 16,
              color: selected ? "#ffffff" : "#cbd2e0",
              lineHeight: 1.5,
            }}
          >
            الانتقال إلى تحديد الأفراد
          </span>
        </button>
      </div>
    </div>
  );
}