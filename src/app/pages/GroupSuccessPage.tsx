import { useNavigate } from "react-router";
import imgDocs from "figma:asset/0b415e099a9a0d48863970a33cf2c018036bb031.png";
import {
  Clock,
  CalendarDays,
  User,
  Download,
} from "lucide-react";

// ─── Shared style ─────────────────────────────────────────────────────────────
const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── Stepper — all 3 completed ────────────────────────────────────────────────
function GreenCheck({ uid }: { uid: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient
          id={`gs-${uid}`}
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
      <circle
        cx="16"
        cy="16"
        r="15"
        fill={`url(#gs-${uid})`}
        stroke={`url(#gs-${uid})`}
        strokeWidth="2"
      />
      <path
        d="M10 16.5L13.5 20L22 12"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepDots() {
  return (
    <div className="flex items-center gap-[3px] mx-3 mt-[15px]">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] h-[3px] rounded-full shrink-0 bg-[#2d3648]"
        />
      ))}
    </div>
  );
}

const DONE_STEPS = [
  { uid: "s03", label: "الحفظ النهائي" },
  { uid: "s02", label: "المراجعة" },
  { uid: "s01", label: "رفع البيانات" },
];

function SuccessStepper() {
  return (
    <div className="flex items-start justify-center" dir="rtl">
      {DONE_STEPS.map((step, idx) => (
        <div key={step.uid} className="flex items-start">
          <div className="flex flex-col items-center gap-2">
            <GreenCheck uid={step.uid} />
            <span
              style={{
                ...F,
                fontSize: 14,
                fontWeight: 700,
                whiteSpace: "nowrap",
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {step.label}
            </span>
          </div>
          {idx < DONE_STEPS.length - 1 && <StepDots />}
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  count: number;
  label: string;
  bg?: string;
  textColor: string;
  icon: React.ReactNode;
}

function StatCard({
  count,
  label,
  bg = "transparent",
  textColor,
  icon,
}: StatCardProps) {
  return (
    <div
      className="flex-1 min-w-0 rounded-[16px] border border-[#eff0f6]"
      style={{ background: bg }}
    >
      <div className="flex items-center justify-start gap-3 px-5 py-3 w-full">
        <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
          <span
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 20,
              color: textColor,
              lineHeight: 1.5,
            }}
          >
            {count}
          </span>
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#717d96",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
        <div className="shrink-0">{icon}</div>
      </div>
    </div>
  );
}

// ── Cyan refresh icon ──
function CyanRefreshIcon() {
  return (
    <div
      className="w-[30px] h-[30px] rounded-full flex items-center justify-center"
      style={{ background: "#29BBD4" }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M1 4v6h6M23 20v-6h-6"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ── Green soldier icon ──
function GreenGroupIcon() {
  return (
    <div
      className="w-[30px] h-[30px] flex items-center justify-center"
      style={{
        color: "linear-gradient(to bottom,#00b867,#00522e)",
      }}
    >
      <svg
        width="26"
        height="20"
        viewBox="0 0 30 22.5"
        fill="none"
      >
        <defs>
          <linearGradient
            id="gg1"
            x1="5"
            x2="5"
            y1="0"
            y2="7.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient
            id="gg2"
            x1="25"
            x2="25"
            y1="0"
            y2="7.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient
            id="gg3"
            x1="15"
            x2="15"
            y1="0"
            y2="10"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
        <ellipse
          cx="5"
          cy="3.75"
          rx="3"
          ry="3.75"
          fill="url(#gg1)"
        />
        <ellipse
          cx="25"
          cy="3.75"
          rx="3"
          ry="3.75"
          fill="url(#gg2)"
        />
        <ellipse
          cx="15"
          cy="4.5"
          rx="4"
          ry="4.5"
          fill="url(#gg3)"
        />
        <path
          d="M0 18.5 C0 14 2 12 5 12 L8 12 C8 14 11 16 15 16 C19 16 22 14 22 12 L25 12 C28 12 30 14 30 18.5 L30 22.5 L0 22.5Z"
          fill="url(#gg1)"
        />
      </svg>
    </div>
  );
}

// ─── Excel Icon ───────────────────────────────────────────────────────────────
function ExcelIcon() {
  return (
    <div className="shrink-0 h-[35px] w-[28px] relative">
      <svg
        width="28"
        height="35"
        viewBox="0 0 28 35"
        fill="none"
      >
        <rect width="20" height="35" rx="2" fill="#E7E7E9" />
        <rect
          x="20"
          y="8"
          width="8"
          height="27"
          rx="1"
          fill="#E7E7E9"
        />
        <polygon points="20,0 28,8 20,8" fill="#A3A2A3" />
        <rect
          x="0"
          y="0"
          width="18"
          height="22"
          rx="2"
          fill="#00A649"
        />
        <rect
          x="0"
          y="0"
          width="3"
          height="22"
          rx="1"
          fill="#05DB5C"
        />
        <text
          x="4"
          y="15"
          fill="white"
          fontSize="8"
          fontWeight="bold"
          fontFamily="Arial"
        >
          XLS
        </text>
      </svg>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function GroupSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      {/* ── Page title ────────────────────────────────────────────── */}
      <h1
        className="text-center w-full"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(28px, 4vw, 32px)",
          lineHeight: 1.5,
          background:
            "linear-gradient(to bottom, #00b867, #00522e)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        تم اعتماد القيد بنجاح
      </h1>

      {/* ── Stepper — all completed ──────────────────────────────── */}
      <div className="flex justify-center">
        <SuccessStepper />
      </div>

      {/* ── Main card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full">
        <div className="flex flex-col items-center gap-6 px-6 py-5">
          {/* ── Illustration ──────────────────────────────────── */}
          <div className="relative flex items-end justify-center w-[270px] h-[200px]">
            {/* Documents illustration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img
                alt="documents"
                src={imgDocs}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
            {/* Green check badge over image */}
            <div className="relative z-10 mb-2">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(to bottom, #00b867, #00522e)",
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 12l5 5L20 7"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Stat cards ──────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 w-full">
            <StatCard
              count={200}
              label="اجمالي الافراد بالكشف"
              bg="white"
              textColor="#2d3648"
              icon={<GreenGroupIcon />}
            />
            <StatCard
              count={180}
              label="أفراد تمت اضافتهم"
              bg="transparent"
              textColor="#2d3648"
              icon={
                <div
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(to bottom, #00b867, #00522e)",
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M5 12l5 5L20 7"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              }
            />
            <StatCard
              count={20}
              label="بيانات تم تحديثها"
              bg="transparent"
              textColor="#146d7c"
              icon={<CyanRefreshIcon />}
            />
          </div>

          {/* ── Info row ────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch w-full">
            {/* الملف المعتمد */}
            <div className="flex flex-col items-start gap-2 flex-1 min-w-0">
              <p
                style={{
                  ...F,
                  fontSize: 14,
                  color: "#4a5468",
                  textAlign: "right",
                }}
              >
                الملف الذي تم اعتماده
              </p>
              <div className="w-full rounded-[12px] border border-[#e7e7e7] bg-white px-4 py-3 flex items-center gap-3">
                {/* Download link */}
                {/* Excel icon */}
                <ExcelIcon />
                {/* File info */}
                <div className="flex flex-col items-start flex-1 min-w-0 gap-0.5">
                  <span
                    style={{
                      ...F,
                      fontWeight: 700,
                      fontSize: 12,
                      color: "#2d3648",
                    }}
                  >
                    س 145 اشارة .xlsx
                  </span>
                  <span
                    style={{
                      ...F,
                      fontSize: 12,
                      color: "#a0abc0",
                    }}
                  >
                    5.3MB
                  </span>
                </div>
                <button
                  type="button"
                  className="shrink-0 flex items-center gap-1 group hover:opacity-80 transition-opacity"
                >
                  <span
                    style={{
                      ...F,
                      fontSize: 16,
                      lineHeight: 1.5,
                      background:
                        "linear-gradient(to bottom, #00b867, #00522e)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    تحميل الملف
                  </span>
                </button>
              </div>
            </div>

           
          </div>

          {/* ── Action buttons ──────────────────────────────────── */}
          <div className="flex items-center flex-wrap gap-3 w-full justify-end">
             {/* قيد كشف جديد — green gradient */}
            <button
              type="button"
              onClick={() => navigate("/dashboard/add-soldier")}
              className="h-[44px] px-4 flex items-center justify-center rounded-[8px] transition-opacity hover:opacity-90 active:opacity-80"
              style={{
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
              }}
            >
              <span
                style={{ ...F, fontSize: 16, color: "#f5f5f5" }}
              >
                قيد كشف جديد
              </span>
            </button>
            {/* العودة إلى لوحة المتابعة — light blue */}
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="h-[44px] px-4 flex items-center justify-center rounded-[8px] bg-[#DCF4DF] transition-colors hover:bg-[#d8dcfb] active:opacity-80"
            >
              <span
                style={{ ...F, fontSize: 16, color: "#2d3648" }}
              >
                العودة إلى لوحة المتابعة
              </span>
            </button>

          
             {/* اصدار خطاب — text underline */}
            <button
              type="button"
              className="h-[44px] px-4 flex items-center justify-center rounded-[8px] transition-opacity hover:opacity-70"
            >
              <span
                style={{
                  ...F,
                  fontSize: 16,
                  color: "#273629",
                  textDecoration: "underline",
                }}
              >
                اصدار خطاب
              </span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}