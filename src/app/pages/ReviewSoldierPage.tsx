import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { LoadingOverlay } from "../components/LoadingOverlay";

// ─── Shared style ─────────────────────────────────────────────────────────────
const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── Stepper ─────────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 12L11 14L15 10M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepDots({ color = "#A1AEBE" }: { color?: string }) {
  return (
    <div className="flex items-center gap-[3px] mx-2">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] h-[3px] rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function Stepper() {
  return (
    <div
      className="flex items-start justify-center gap-0"
      dir="rtl"
    >
      {/* Step 01 — ادخال البيانات (completed) */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background:
              "linear-gradient(to bottom, #00b867, #00522e)",
          }}
        >
          <CheckIcon />
        </div>
        <span
          style={{
            ...F,
            fontSize: 14,
            fontWeight: 700,
            background:
              "linear-gradient(to bottom, #00b867, #00522e)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ادخال البيانات
        </span>
      </div>

      <div className="mt-[14px]">
        <StepDots color="#2d3648" />
      </div>

      {/* Step 02 — المراجعة (active) */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#344736] bg-white">
          <span
            style={{ ...F, fontSize: 14, color: "#344736" }}
          >
            02
          </span>
        </div>
        <span style={{ ...F, fontSize: 14, color: "#344736" }}>
          المراجعة
        </span>
      </div>

      <div className="mt-[14px]">
        <StepDots />
      </div>

      {/* Step 03 — اعتماد (inactive) */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#a1aebe] bg-white">
          <span
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          >
            03
          </span>
        </div>
        <span style={{ ...F, fontSize: 14, color: "#465668" }}>
          اعتماد
        </span>
      </div>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  blurred = false,
  bold = false,
}: {
  label: string;
  value: string;
  blurred?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 justify-start flex-1 min-w-0">
      <span
        className="w-[130px] shrink-0 text-right"
        style={{ ...F, fontSize: 18, color: "#717d96" }}
      >
        {label}
      </span>
      <span style={{ ...F, fontSize: 18, color: "#172e78" }}>
        :
      </span>
      <span
        className={blurred ? "blur-[7px] select-none" : ""}
        style={{
          ...F,
          fontSize: 18,
          color: "#2d3648",
          whiteSpace: "nowrap",
          fontWeight: bold ? 700 : 400,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ReviewSoldierPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = (location.state as {
    name: string;
    rank: string;
    milId: string;
    category: string;
    unit: string;
    status: string;
    attachment: string;
    discharge: string;
  } | null) ?? {
    name: "اسلام مجدى عبدالستار السيد حجاج",
    rank: "جندي",
    milId: "2024427700265",
    category: "مجند",
    unit: "مج العمليات الخاصة",
    status: "قوة الوحده",
    attachment: "لا يوجد",
    discharge: "2025 - 3 - 1",
  };

  // Called when user taps "اعتماد القيد"
  const handleConfirm = useCallback(() => {
    setIsLoading(true);
    // after 5 s the overlay calls onDone → navigate to success page
  }, []);

  // Called by LoadingOverlay after 5 s
  const handleLoadingDone = useCallback(() => {
    navigate("/dashboard/add-soldier/success", { state: form });
  }, [navigate, form]);

  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      {/* Loading overlay — rendered in DOM but only "shown" when isLoading */}
      {isLoading && (
        <LoadingOverlay
          onDone={handleLoadingDone}
          durationMs={5000}
        />
      )}

      {/* ── Page title ──────────────────────────────────────────────────── */}
      <h1
        className="text-center w-full"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(24px, 4vw, 32px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        قيد قوة جديدة
      </h1>

      {/* ── Stepper ─────────────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <Stepper />
      </div>

      {/* ── Review Card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full">
        <div className="flex flex-col gap-6 px-6 py-5">
          {/* Card header */}
          <div className="flex flex-col gap-3 items-start w-full">
            <p
              className="text-right w-full"
              style={{
                ...F,
                fontSize: 18,
                color: "#2d3648",
                lineHeight: 1.5,
              }}
            >
              مراجعة البيانات
            </p>
            <div className="w-full h-px bg-[#cbd2e0]" />
          </div>

          {/* Row 1 */}
          <div className="flex flex-wrap gap-6">
            <InfoRow label="الدرجة" value={form.rank} />
            <InfoRow label="الرقم العسكري" value={form.milId} />
          </div>
          {/* Row 2 */}
          <div className="flex flex-wrap gap-6">
            <InfoRow label="فئة الفرد" value={form.category} />
            <InfoRow label="الاسم" value={form.name} />
          </div>
          {/* Row 3 */}
          <div className="flex flex-wrap gap-6">
            <InfoRow
              label="الموقف الخدمي"
              value={form.status}
              bold
            />
            <InfoRow
              label="الوحدة الاساسية"
              value={form.unit}
            />
          </div>
          {/* Row 4 */}
          <div className="flex flex-wrap gap-6">
            <InfoRow
              label="جهة الالحاق"
              value={form.attachment}
            />
            <InfoRow
              label="تاريخ التسريح"
              value={form.discharge}
            />
          </div>

          {/* ── اعتماد القيد button ──────────────────────────────────── */}
          <div className="flex justify-end py-2">
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex items-center justify-center px-5 min-h-[44px] rounded-[8px] transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
              }}
            >
              <span
                style={{
                  ...F,
                  fontSize: 16,
                  color: "#f5f5f5",
                  lineHeight: 1.5,
                }}
              >
                اعتماد القيد
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}