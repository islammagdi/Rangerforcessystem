import { useLocation, useNavigate } from "react-router";
import imgDocs from "figma:asset/0b415e099a9a0d48863970a33cf2c018036bb031.png";
import { Clock, CalendarDays, User } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SoldierState {
  name: string;
  rank: string;
  milId: string;
  category: string;
  unit: string;
  status: string;
  attachment: string;
  discharge: string;
}

// ─── Shared style ─────────────────────────────────────────────────────────────
const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── Stepper (all 3 completed) ────────────────────────────────────────────────
function GreenCheck({ id }: { id: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient
          id={`g-${id}`}
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
        fill={`url(#g-${id})`}
        stroke={`url(#g-${id})`}
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

function StepDots({ color = "#2d3648" }: { color?: string }) {
  return (
    <div className="flex items-center gap-[3px] mx-2 mt-[14px]">
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
  const steps = [
    { id: "s3", label: "ادخال البيانات" },
    { id: "s2", label: "المراجعة" },
    { id: "s1", label: "اعتماد النهائي" },
  ];

  return (
    <div className="flex items-start justify-center" dir="rtl">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-start">
          <div className="flex flex-col items-center gap-2">
            <GreenCheck id={step.id} />
            <span
              style={{
                ...F,
                fontWeight: 700,
                fontSize: 14,
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                whiteSpace: "nowrap",
              }}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && <StepDots />}
        </div>
      ))}
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-start gap-2 justify-start flex-1 min-w-0"
      dir="rtl"
    >
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
        style={{
          ...F,
          fontSize: 18,
          color: "#2d3648",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Audit info strip (المستخدم الحالي) ──────────────────────────────────────
function AuditStrip() {
  return (
    <div
      className="flex flex-col gap-2 items-start w-full"
      dir="rtl"
    >
      <p style={{ ...F, fontSize: 14, color: "#4a5468" }}>
        المستخدم الحالي
      </p>
      <div className="flex items-center gap-3 border border-[#e7e7e7] rounded-[12px] px-3 py-3 flex-wrap">
        <div className="flex items-center gap-1">
          <User size={18} className="text-[#a0abc0]" />
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#4a5468",
              whiteSpace: "nowrap",
            }}
          >
            جندي / اسلام مجدي عبدالستار
          </span>
        </div>

        <div className="h-3 w-px bg-[#cbd2e0]" />
        <div className="flex items-center gap-1">
          <CalendarDays size={18} className="text-[#a0abc0]" />
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#4a5468",
              whiteSpace: "nowrap",
            }}
          >
            2025 - 08 - 20
          </span>
        </div>
        <div className="h-3 w-px bg-[#cbd2e0]" />
        <div className="flex items-center gap-1">
          <Clock size={18} className="text-[#a0abc0]" />
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#4a5468",
              whiteSpace: "nowrap",
            }}
          >
            10 : 00 ص
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function SuccessSoldierPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const form = (location.state as SoldierState | null) ?? {
    name: "اسلام مجدي عبدالستار",
    rank: "جندي",
    milId: "2024427700265",
    category: "مجند",
    unit: "ك ١١٣ صع",
    status: "ملحق",
    attachment: "فرع العمليات",
    discharge: "2025 - 3 - 1",
  };

  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      {/* ── Stepper ───────────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <Stepper />
      </div>

      {/* ── Main card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
        <div className="flex flex-col gap-6 px-6 py-5 items-center">
          {/* Success title */}
          <p
            className="text-center"
            style={{
              ...F,
              fontWeight: 700,
              fontSize: "clamp(22px, 4vw, 32px)",
              background:
                "linear-gradient(to bottom, #00b867, #00522e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.5,
            }}
          >
            تم اعتماد القيد بنجاح
          </p>

          {/* Documents illustration + green check badge */}
          <div
            className="relative flex items-end justify-center"
            style={{ width: 270, height: 200 }}
          >
            <img
              src={imgDocs}
              alt="documents"
              className="absolute inset-0 w-full object-cover"
              style={{ height: "103.47%" }}
            />
            <div className="relative z-10 mb-1">
              <svg
                width="96"
                height="96"
                viewBox="0 0 96 96"
                fill="none"
              >
                <defs>
                  <linearGradient
                    id="gc-badge"
                    x1="48"
                    x2="48"
                    y1="3"
                    y2="93"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00B867" />
                    <stop offset="1" stopColor="#00522E" />
                  </linearGradient>
                </defs>
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="url(#gc-badge)"
                />
                <path
                  d="M30 48L42 60L66 36"
                  stroke="#FFFCEE"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* ── Data table card ──────────────────────────────────────── */}
          <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full">
            <div
              className="flex flex-col gap-3 px-6 py-4"
              style={{ ...F, fontSize: 18 }}
            >
              {/* Row 1 */}
              <div className="flex flex-wrap gap-6">
                <InfoRow label="الدرجة" value={form.rank} />
                <InfoRow
                  label="الرقم العسكري"
                  value={form.milId}
                />
              </div>
              {/* Row 2 */}
              <div className="flex flex-wrap gap-6">
                <InfoRow
                  label="فئة الفرد"
                  value={form.category}
                />
                <InfoRow label="الاسم" value={form.name} />
              </div>
              {/* Row 3 */}
              <div className="flex flex-wrap gap-6">
                <InfoRow
                  label="الوحدة الاساسية"
                  value={form.unit}
                />
                <InfoRow
                  label="الموقف الخدمي"
                  value={form.status}
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
            </div>
          </div>

          {/* ── Audit strip ──────────────────────────────────────────── */}
          <AuditStrip />

          {/* ── Action buttons ───────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 items-center w-full justify-end">
            <button
              onClick={() => navigate("/dashboard/add-soldier")}
              className="flex items-center justify-center min-h-[44px] px-5 rounded-[8px] transition-opacity hover:opacity-90 active:opacity-80"
              style={{
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
              }}
            >
              <span
                style={{ ...F, fontSize: 16, color: "#f5f5f5" }}
              >
                اضافة فرد اخري
              </span>
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center justify-center min-h-[44px] px-5 rounded-[8px] bg-[#ebedfd] transition-opacity hover:opacity-90 active:opacity-80"
            >
              <span
                style={{ ...F, fontSize: 16, color: "#2d3648" }}
              >
                الموقف العام
              </span>
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center justify-center min-h-[44px] px-4 rounded-[8px] transition-opacity hover:opacity-80"
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