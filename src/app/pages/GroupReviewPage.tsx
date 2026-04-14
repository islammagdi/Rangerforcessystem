import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronDown,
  Trash2,
  Pencil,
  AlertTriangle,
  Users,
} from "lucide-react";

// ─── Shared style ──────────────────────────────────────────────────────────────
const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── Stepper ──────────────────────────────────────────────────────────────────
function GreenCheckCircle({ id }: { id: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient
          id={`gc-${id}`}
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
        fill={`url(#gc-${id})`}
        stroke={`url(#gc-${id})`}
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

function StepDots({ color = "#A1AEBE" }: { color?: string }) {
  return (
    <div className="flex items-center gap-[3px] mx-3 mt-[15px]">
      {Array.from({ length: 16 }).map((_, i) => (
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
    <div className="flex items-start justify-center" dir="rtl">
      {/* Step 03 — الحفظ النهائي (inactive) */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#a1aebe] bg-white">
          <span
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          >
            03
          </span>
        </div>
        <span
          style={{
            ...F,
            fontSize: 14,
            color: "#465668",
            whiteSpace: "nowrap",
          }}
        >
          الحفظ النهائي
        </span>
      </div>

      <StepDots color="#A1AEBE" />

      {/* Step 02 — المراجعة (active) */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#294dbb] bg-white">
          <span
            style={{ ...F, fontSize: 14, color: "#294dbb" }}
          >
            02
          </span>
        </div>
        <span
          style={{
            ...F,
            fontSize: 14,
            color: "#294dbb",
            whiteSpace: "nowrap",
          }}
        >
          المراجعة
        </span>
      </div>

      <StepDots color="#2d3648" />

      {/* Step 01 — رفع البيانات (completed) */}
      <div className="flex flex-col items-center gap-2">
        <GreenCheckCircle id="step01" />
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
          رفع البيانات
        </span>
      </div>
    </div>
  );
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────
interface StatCardProps {
  count: number;
  label: string;
  bg: string;
  textColor: string;
  icon: React.ReactNode;
}

function StatCard({
  count,
  label,
  bg,
  textColor,
  icon,
}: StatCardProps) {
  return (
    <div
      className="flex-1 min-w-0 rounded-[16px] border border-[#eff0f6]"
      style={{ background: bg }}
    >
      <div className="flex items-center justify-end gap-3 px-5 py-3 w-full">
        <div className="flex flex-col items-end gap-0.5 flex-1 min-w-0">
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

// ── Red X icon ────
function RedXIcon() {
  return (
    <div
      className="w-[30px] h-[30px] rounded-full flex items-center justify-center"
      style={{ background: "#E3282C" }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
      >
        <path
          d="M2 2L12 12M12 2L2 12"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
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

// ── Green check icon ──
function GreenCheckIcon() {
  return (
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
  );
}

// ── Group of people icon ──
function GroupIcon() {
  return (
    <div className="w-[30px] h-[30px] flex items-center justify-center">
      <Users
        size={26}
        style={{ color: "url(#gusers)" }}
        className="text-[#2d3648]"
      />
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeType = "بيان جديد" | "تحديث" | "خطأ بالوحدة";

const BADGE_STYLES: Record<
  BadgeType,
  { bg: string; dot: string; text: string; textColor: string }
> = {
  "بيان جديد": {
    bg: "#ebfaea",
    dot: "#35C128",
    text: "بيان جديد",
    textColor: "#26861d",
  },
  تحديث: {
    bg: "#e9f9ff",
    dot: "#29BBD4",
    text: "تحديث",
    textColor: "#146d7c",
  },
  "خطأ بالوحدة": {
    bg: "#fce8f1",
    dot: "#E3282C",
    text: "خطأ بالوحدة",
    textColor: "#be192a",
  },
};

function StatusBadge({ type }: { type: BadgeType }) {
  const s = BADGE_STYLES[type];
  return (
    <span
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-[16px]"
      style={{ background: s.bg }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: s.dot }}
      />
      <span
        style={{
          ...F,
          fontWeight: 700,
          fontSize: 12,
          color: s.textColor,
          whiteSpace: "nowrap",
        }}
      >
        {s.text}
      </span>
    </span>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
interface SoldierRow {
  id: number;
  milId: string;
  rank: string;
  name: string;
  serviceType: string;
  unit: string;
  distributionStatus: string;
  attachment: string;
  rowStatus: BadgeType;
  rowBg?: string;
  checked: boolean;
}

const INITIAL_ROWS: SoldierRow[] = [
  {
    id: 1,
    milId: "2024427700265",
    rank: "جندي",
    name: "اسلام مجدي عبدالستار",
    serviceType: "مجند",
    unit: "ك ١١٣ صع",
    distributionStatus: "ملحق",
    attachment: "فرع العمليات",
    rowStatus: "بيان جديد",
    rowBg: undefined,
    checked: true,
  },
  {
    id: 2,
    milId: "2024159308527",
    rank: "جندي",
    name: "احمد عادل عبدالستار",
    serviceType: "مجند",
    unit: "مع العمليات الخاصة",
    distributionStatus: "منتهي خدمته",
    attachment: "لا يوجد",
    rowStatus: "تحديث",
    rowBg: "#e9f9ff",
    checked: true,
  },
  {
    id: 3,
    milId: "2024964213580",
    rank: "مساعد أ",
    name: "محمود اسلام عبدالله",
    serviceType: "مجند",
    unit: "س ١٤٥ اشارة",
    distributionStatus: "علي القوة",
    attachment: "لا يوجد",
    rowStatus: "خطأ بالوحدة",
    rowBg: "#fce8f1",
    checked: true,
  },
];

const HEADERS = [
  "رقم عسكري",
  "درجة",
  "اسم",
  "نوع الخدمة",
  "الوحدة",
  "حالة التوزيع",
  "مكان الالحاق",
  "حالة الفرد",
  "الاجراء",
];

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

function CheckboxCell({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-colors"
      style={{
        borderColor: checked ? "#294dbb" : "#cbd2e0",
        background: checked ? "#294dbb" : "white",
      }}
    >
      {checked && (
        <svg
          width="11"
          height="9"
          viewBox="0 0 11 9"
          fill="none"
        >
          <path
            d="M1 4.5L4 7.5L10 1.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

function ActionIcons({
  onDelete,
  onEdit,
}: {
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        className="p-1 rounded-[4px] bg-[#fce8f1] hover:bg-[#f5c6d8] transition-colors"
        title="حذف"
      >
        <Trash2 size={13} className="text-[#E3282C]" />
      </button>
      {/* Edit */}
      <button
        type="button"
        onClick={onEdit}
        className="p-1 rounded-[4px] bg-[#f5f5f5] hover:bg-[#e8e8e8] transition-colors"
        title="تعديل"
      >
        <Pencil size={13} className="text-[#2d3648]" />
      </button>
    </div>
  );
}

function SoldierTable({
  rows,
  onCheck,
  onDelete,
  onEdit,
}: {
  rows: SoldierRow[];
  onCheck: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-b-[12px]">
      <table
        className="w-full min-w-[900px] border-collapse"
        dir="rtl"
      >
        <thead>
          <tr className="bg-white border-b-2 border-[#d4d8fa]">
            {/* Checkbox col */}
            <th className="px-4 py-3 w-12">
              <span className="sr-only">تحديد</span>
            </th>
            {HEADERS.map((h) => (
              <th key={h} className="px-4 py-3 text-right">
                <span className="flex items-center justify-end gap-1">
                  <span
                    style={{
                      ...F,
                      fontWeight: 700,
                      fontSize: 12,
                      color: "#717d96",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </span>
                  <SortIcon />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              style={{ background: row.rowBg ?? "white" }}
              className="border-b border-[#eaecf0] transition-colors hover:brightness-95"
            >
              {/* Checkbox */}
              <td className="px-4 py-3">
                <div className="flex justify-center">
                  <CheckboxCell
                    checked={row.checked}
                    onChange={() => onCheck(row.id)}
                  />
                </div>
              </td>
              {/* رقم عسكري */}
              <td className="px-4 py-3">
                <span
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#2d3648",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.milId}
                </span>
              </td>
              {/* درجة */}
              <td className="px-4 py-3">
                <span
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#2d3648",
                  }}
                >
                  {row.rank}
                </span>
              </td>
              {/* اسم */}
              <td className="px-4 py-3">
                <span
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#2d3648",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.name}
                </span>
              </td>
              {/* نوع الخدمة */}
              <td className="px-4 py-3">
                <span
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#2d3648",
                  }}
                >
                  {row.serviceType}
                </span>
              </td>
              {/* الوحدة */}
              <td className="px-4 py-3">
                <span
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#2d3648",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.unit}
                </span>
              </td>
              {/* حالة التوزيع */}
              <td className="px-4 py-3">
                <span
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#2d3648",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.distributionStatus}
                </span>
              </td>
              {/* مكان الالحاق */}
              <td className="px-4 py-3">
                <span
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#2d3648",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.attachment}
                </span>
              </td>
              {/* حالة الفرد */}
              <td className="px-4 pb-3 pt-[11px]">
                <StatusBadge type={row.rowStatus} />
              </td>
              {/* الاجراء */}
              <td className="px-4 py-3">
                <ActionIcons
                  onDelete={() => onDelete(row.id)}
                  onEdit={() => onEdit(row.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Loading Overlay ──────────────────────────────────────────────────────────
function GroupLoadingOverlay() {
  return (
    <>
      {/* keyframes injected once */}
      <style>{`
        @keyframes grp-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-18px); }
        }
        .grp-dot { animation: grp-bounce 1.2s ease-in-out infinite; }
        .grp-dot:nth-child(2) { animation-delay: 0.2s; }
        .grp-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        {/* Card */}
        <div className="bg-white rounded-[24px] shadow-2xl flex flex-col items-center justify-center py-16 px-12 w-[480px] max-w-[90vw]">
          {/* Three bouncing dots */}
          <div className="flex items-center gap-5 mb-10">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="grp-dot block w-4 h-4 rounded-full"
                style={{
                  background:
                    "linear-gradient(to bottom, #00B867, #00522E)",
                }}
              />
            ))}
          </div>

          {/* Text */}
          <div className="flex flex-col items-center gap-3">
            <p
              style={{
                ...F,
                fontWeight: 700,
                fontSize: 36,
                color: "#122b16",
                lineHeight: 1.2,
                textAlign: "center",
              }}
              dir="rtl"
            >
              يرجي الانتظار
            </p>
            <p
              style={{
                ...F,
                fontWeight: 700,
                fontSize: 24,
                color: "#404040",
                lineHeight: 1.5,
                textAlign: "center",
              }}
              dir="rtl"
            >
              يتم قيد الافراد الجدد الان
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function GroupReviewPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SoldierRow[]>(INITIAL_ROWS);
  const [loading, setLoading] = useState(false);

  const toggleCheck = (id: number) =>
    setRows((r) =>
      r.map((row) =>
        row.id === id ? { ...row, checked: !row.checked } : row,
      ),
    );

  const deleteRow = (id: number) =>
    setRows((r) => r.filter((row) => row.id !== id));

  const hasErrors = rows.some(
    (r) => r.rowStatus === "خطأ بالوحدة",
  );

  function handleApprove() {
    if (hasErrors || loading) return;
    setLoading(true);
  }

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      navigate("/dashboard/add-soldier/group-success");
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading, navigate]);

  const stats = {
    total: 200,
    newCount: 180,
    updated: 5,
    issues: 15,
  };

  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      {/* Loading overlay */}
      {loading && <GroupLoadingOverlay />}

      {/* ── Page title ────────────────────────────────────────────── */}
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

      {/* ── Stepper ──────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <Stepper />
      </div>

      {/* ── Main card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
        <div className="flex flex-col gap-5 px-6 py-5">
          {/* ── Section header ──────────────────────────────────── */}
          <div className="flex flex-col gap-3 w-full">
            <p
              className="text-right w-full"
              style={{
                ...F,
                fontSize: 18,
                color: "#2d3648",
                lineHeight: 1.5,
              }}
            >
              مراجعة الكشف قبل الاعتماد
            </p>
            <div className="w-full h-px bg-[#cbd2e0]" />
          </div>

          {/* ── Warning banner ──────────────────────────────────── */}
          <div className="flex items-center gap-4 w-full rounded-[8px] px-4 py-3 bg-[#fff7f0] border border-[#f4b5ae]">
            {/* Icon pill */}
            <div
              className="flex items-center justify-center rounded-full p-1.5 shrink-0"
              style={{ background: "#f4b5ae" }}
            >
              <AlertTriangle
                size={20}
                style={{ color: "#E37032" }}
              />
            </div>
            {/* Text */}
            <div className="flex flex-col items-start flex-1 min-w-0">
              <p
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#2d3648",
                  lineHeight: 1.5,
                }}
              >
                تحذير !
              </p>
              <p
                style={{
                  ...F,
                  fontSize: 14,
                  color: "#4a5468",
                  lineHeight: 1.4,
                  textAlign: "right",
                }}
              >
                يرجى تصحيح الملاحظات الواردة ببيانات بعض الأفراد
                لاستكمال إجراءات الاعتماد والحفظ النهائي.
              </p>
            </div>
          </div>

          {/* ── Stats cards ─────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 w-full items-start">
            <StatCard
              count={stats.issues}
              label="بيانات بها ملاحظات"
              bg="#fce8f1"
              textColor="#90132a"
              icon={<RedXIcon />}
            />
            <StatCard
              count={stats.updated}
              label="افراد يتم تحديث بياناتهم"
              bg="#e9f9ff"
              textColor="#146d7c"
              icon={<CyanRefreshIcon />}
            />
            <StatCard
              count={stats.newCount}
              label="أفراد جدد"
              bg="#ebfaea"
              textColor="#2d3648"
              icon={<GreenCheckIcon />}
            />
            <StatCard
              count={stats.total}
              label="اجمالي الافراد بالكشف"
              bg="white"
              textColor="#2d3648"
              icon={<GroupIcon />}
            />
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────────── */}
        <div className="w-full h-px bg-[#eff0f6]" />

        {/* ── Table ────────────────────────────────────────────── */}
        <SoldierTable
          rows={rows}
          onCheck={toggleCheck}
          onDelete={deleteRow}
          onEdit={(id) => console.log("edit", id)}
        />

        {/* ── Footer action ─────────────────────────────────────── */}
        <div className="flex items-center justify-start px-6 py-5 gap-3">
          <button
            type="button"
            disabled={hasErrors || loading}
            onClick={handleApprove}
            className="h-[44px] px-6 rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(to bottom, #00b867, #00522e)",
            }}
            title={hasErrors ? "يرجى تصحيح الأخطاء أولاً" : ""}
          >
            <span
              style={{ ...F, fontSize: 16, color: "#f5f5f5" }}
            >
              اعتماد القيد
            </span>
          </button>

          {hasErrors && (
            <p style={{ ...F, fontSize: 13, color: "#90132a" }}>
              يرجى تصحيح الأخطاء قبل الاعتماد
            </p>
          )}
        </div>
      </div>
    </div>
  );
}