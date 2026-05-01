import Select from "react-select";
import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ChevronDown,
  CalendarDays,
  X,
  Download,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
type RegistrationMethod = "فرد واحد" | "مجموعة افراد";
type SoldierCategory = "مجند" | "متطوع";

// ─── Shared style ────────────────────────────────────────────────────────────
const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── Stepper ─────────────────────────────────────────────────────────────────
const STEPS = [
  { num: "01", label: "رفع البيانات", active: true },
  { num: "02", label: "المراجعة", active: false },
  { num: "03", label: "الحفظ النهائي", active: false },
];

function StepDots() {
  return (
    <div className="flex items-center gap-[3px] mx-2">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] h-[3px] rounded-full bg-[#a1aebe] shrink-0"
        />
      ))}
    </div>
  );
}

function Stepper({
  groupMode = false,
}: {
  groupMode?: boolean;
}) {
  const steps = groupMode
    ? STEPS
    : [
        { num: "01", label: "ادخال البيانات", active: true },
        { num: "02", label: "المراجعة", active: false },
        { num: "03", label: "اعتماد", active: false },
      ];

  return (
    <div className="flex items-start gap-0" dir="rtl">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-start">
          <div className="flex flex-col items-center gap-2">
            <div
              className={[
                "w-8 h-8 rounded-full flex items-center justify-center border-2",
                step.active
                  ? "border-[#344736] bg-white"
                  : "border-[#a1aebe] bg-white",
              ].join(" ")}
            >
              <span
                style={{
                  ...F,
                  fontSize: 14,
                  color: step.active ? "#344736" : "#2d3648",
                  lineHeight: 1.4,
                }}
              >
                {step.num}
              </span>
            </div>
            <span
              style={{
                ...F,
                fontSize: 14,
                color: step.active ? "#344736" : "#465668",
                lineHeight: 1.4,
                whiteSpace: "nowrap",
              }}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className="mt-[14px]">
              <StepDots />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Category toggle ─────────────────────────────────────────────────────────
function SoldierIcon({ white = false }: { white?: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
      <defs>
        <linearGradient
          id="g1"
          x1="12.81"
          x2="12.81"
          y1="0"
          y2="23.11"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
        <linearGradient
          id="g2"
          x1="10.53"
          x2="10.53"
          y1="14.66"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
      </defs>
      <path
        d="M0 18.55C0.024 17.76 0.038 16.9 0.064 16.01C1.83 16.1 4.96 16.25 5.79 15.74C6.56 15.28 6.96 14.66 7.36 14.05C7.89 13.22 8.42 12.41 9.91 12.1C11.78 11.7 13.92 11.57 16.11 11.43C18.79 11.26 21.54 11.08 23.96 10.43C24.17 10.37 24.5 10.17 24.79 9.97C24.96 10.23 25.16 10.5 25.4 10.78C25.71 11.16 26.04 11.71 25.98 12.29C25.98 12.29 25.62 12.66 24.27 13.02C19.9 14.2 14.42 13.81 10.24 14.69C9.42 14.86 8.39 15.33 7.63 16.53C7.63 16.53 7.02 17.77 6.04 18.37C5.09 18.94 1.27 18.58 0 18.55ZM0.08 15.49C0.2 11.9 0.56 7.77 2.33 4.81C5.09 0.18 12.62 -0.93 17.38 0.72C18.92 1.25 20.54 2.19 21.71 3.85C21.71 3.85 22.16 4.47 22.6 5.22C23.59 6.91 23.63 8.05 24.52 9.54C24.25 9.71 23.97 9.89 23.82 9.93C21.45 10.57 18.73 10.74 16.08 10.91C13.87 11.05 11.71 11.19 9.8 11.59C8.1 11.95 7.52 12.85 6.92 13.77C6.56 14.33 6.19 14.9 5.52 15.3C4.83 15.73 1.79 15.58 0.08 15.49ZM4.44 11.99C4.17 11.99 3.9 12.1 3.71 12.3C3.51 12.49 3.4 12.76 3.4 13.03C3.4 13.31 3.51 13.58 3.71 13.77C3.9 13.97 4.17 14.08 4.44 14.08C4.72 14.08 4.99 13.97 5.18 13.77C5.38 13.58 5.49 13.31 5.49 13.03C5.49 12.76 5.38 12.49 5.18 12.3C4.99 12.1 4.72 11.99 4.44 11.99ZM5.06 22.54H9.98V24.93H5.06V22.54Z"
        fill={white ? "white" : "url(#g1)"}
      />
      <path
        d="M11.56 14.98C11.84 16.91 11.97 20.56 11.94 21.74C11.93 22.31 11.72 22.23 12.56 22.23H15.04C15.04 22.23 14.98 17.56 14.66 14.66C14.42 14.67 14.18 14.69 13.95 14.71C13.15 14.77 12.35 14.86 11.56 14.98ZM6.04 18.93V22.02H9.01V15.75C8.65 16 8.34 16.34 8.09 16.77C7.71 17.52 7.02 18.37 6.31 18.81C6.23 18.85 6.14 18.9 6.04 18.93ZM6.04 25.45V28.88C6.04 29.5 6.71 30 7.53 30C8.34 30 9.01 29.5 9.01 28.88V25.45H6.04Z"
        fill={white ? "white" : "url(#g2)"}
      />
    </svg>
  );
}

function StarIcon({ white = false }: { white?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
      <defs>
        <linearGradient
          id="gs"
          x1="13"
          x2="13"
          y1="2"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
      </defs>
      <path
        d="M13 2L16.09 9.26L24 10.27L18.5 15.64L19.82 23.5L13 19.77L6.18 23.5L7.5 15.64L2 10.27L9.91 9.26L13 2Z"
        fill={white ? "white" : "url(#gs)"}
        stroke={white ? "white" : "url(#gs)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryToggle({
  value,
  onChange,
}: {
  value: SoldierCategory;
  onChange: (v: SoldierCategory) => void;
}) {
  return (
    <div className="flex items-stretch rounded-[12px] overflow-hidden border border-[#eff0f6]">
     <button
        type="button"
        onClick={() => onChange("مجند")}
        className={[
          "flex items-center gap-4 px-3 py-3 w-[155px] justify-end transition-colors border-r border-[#eff0f6]",
          value === "مجند"
            ? "bg-gradient-to-b from-[#00b867] to-[#00522e]"
            : "bg-white hover:bg-gray-50",
        ].join(" ")}
      >
        <span
          style={{
            ...F,
            fontSize: 18,
            color: value === "مجند" ? "#f5f5f5" : "#2d3648",
            flex: 1,
            textAlign: "right",
          }}
        >
          مجند
        </span>
        <SoldierIcon white={value === "مجند"} />
      </button>
      <button
        type="button"
        onClick={() => onChange("متطوع")}
        className={[
          "flex items-center gap-4 px-3 py-3 w-[155px] justify-end transition-colors",
          value === "متطوع"
            ? "bg-gradient-to-b from-[#00b867] to-[#00522e]"
            : "bg-white hover:bg-gray-50",
        ].join(" ")}
      >
        <span
          style={{
            ...F,
            fontSize: 18,
            color: value === "متطوع" ? "#f5f5f5" : "#2d3648",
            flex: 1,
            textAlign: "right",
          }}
        >
          متطوع
        </span>
        <StarIcon white={value === "متطوع"} />
      </button>
      
    </div>
  );
}

// ─── Reusable Dropdown ────────────────────────────────────────────────────────
function FormDropdown({
  placeholder,
  options,
  value,
  onChange,
  error,
  disabled,
}: {
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          className={[
            "w-full h-[54px] bg-white border rounded-[8px] flex items-center gap-3 px-3 transition-colors",
            disabled
              ? "opacity-50 cursor-not-allowed border-[#e2e7f0]"
              : "hover:border-[#a0aec0] cursor-pointer",
            error ? "border-[#ef4444]" : "border-[#e2e7f0]",
          ].join(" ")}
        >
          <ChevronDown
            size={20}
            className={`shrink-0 text-[#2d3648] transition-transform ${open ? "rotate-180" : ""}`}
          />
          <span
            className="flex-1 text-right"
            style={{ ...F, fontSize: 18, color: "##4a5468" }}
          >
            {value || placeholder}
          </span>
        </button>
        {open && (
          <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden">
            {options.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={[
                    "w-full text-right px-4 py-3 transition-colors",
                    opt === value
                      ? "bg-[#f0f2fd] text-[#344736]"
                      : "hover:bg-[#f5f6fb] text-[#2d3648]",
                  ].join(" ")}
                  style={{ ...F, fontSize: 16 }}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && (
        <p
          className="text-right px-1"
          style={{
            ...F,
            fontSize: 13,
            color: "#ef4444",
            lineHeight: 1.4,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Reusable Text Input ──────────────────────────────────────────────────────
function FormInput({
  placeholder,
  value,
  onChange,
  error,
  disabled,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        dir="rtl"
        className={[
          "w-full h-[54px] bg-white border rounded-[8px] px-3 text-right outline-none focus:border-[#344736] transition-colors",
          disabled ? "opacity-50 cursor-not-allowed" : "",
          error ? "border-[#ef4444]" : "border-[#e2e7f0]",
        ].join(" ")}
        style={{ ...F, fontSize: 18, color: "#4a5468" }}
      />
      {error && (
        <p
          className="text-right px-1"
          style={{
            ...F,
            fontSize: 13,
            color: "#ef4444",
            lineHeight: 1.4,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Date Input ───────────────────────────────────────────────────────────────
function DateInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (inputRef.current) {
      try {
        (inputRef.current as any).showPicker?.();
      } catch {
        inputRef.current.click();
      }
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative w-full">
        {/* Calendar icon — clickable to open picker */}
        <button
          type="button"
          onClick={openPicker}
          className="absolute inset-y-0 right-3 flex items-center z-10"
          tabIndex={-1}
        >
          <CalendarDays
            size={20}
            style={{ color: "#415844" }}
          />
        </button>

        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={[
            "w-full h-[54px] bg-white border rounded-[8px] pr-10 pl-3 outline-none focus:border-[#415844] transition-colors cursor-pointer",
            error ? "border-[#ef4444]" : "border-[#e2e7f0]",
          ].join(" ")}
          style={{
            ...F,
            fontSize: 18,
            color: value ? "#4a5468" : "#a0abc0",
            colorScheme: "light",
            direction: "ltr",
            textAlign: "right",
          }}
        />
      </div>
      {error && (
        <p
          className="text-right px-1"
          style={{
            ...F,
            fontSize: 13,
            color: "#ef4444",
            lineHeight: 1.4,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Field Group ─────────────────────────────────────────────────────────────
function FieldGroup({
  label,
  labelColor = "#2d3648",
  children,
}: {
  label: string;
  labelColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <label
        className="block text-right px-1"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: 16,
          color: labelColor,
          lineHeight: 1.5,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SubHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p
      className="text-right w-full"
      style={{
        ...F,
        fontWeight: 700,
        fontSize: 18,
        color: "#2d3648",
        lineHeight: 1.5,
      }}
    >
      {children}
    </p>
  );
}

// ─── Excel Icon ──────────────────────────────────────────────────────────────
function ExcelIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 28 35"
      fill="none"
    >
      <rect
        x="0"
        y="0"
        width="20"
        height="35"
        rx="2"
        fill="#E7E7E9"
      />
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
  );
}

// ─── Upload Icon ────────────────────────────────────────────────────────────
function UploadFolderIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <rect width="42" height="42" rx="8" fill="#DCF4DF" />
      <path
        d="M8 16C8 13.8 9.8 12 12 12H18L21 15H30C32.2 15 34 16.8 34 19V28C34 30.2 32.2 32 30 32H12C9.8 32 8 30.2 8 28V16Z"
        fill="#395945"
      />
      <path
        d="M8 20H34V28C34 30.2 32.2 32 30 32H12C9.8 32 8 30.2 8 28V20Z"
        fill="#415844"
      />
      <path
        d="M21 22V28M21 22L19 24M21 22L23 24"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Group Upload Section ─────────────────────────────────────────────────────
interface UploadedFile {
  name: string;
  size: string;
  raw: File;
}

function GroupUploadSection({
  onSubmit,
}: {
  onSubmit: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] =
    useState<UploadedFile | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const formatSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${bytes}B`;
  };

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xls", "xlsx"].includes(ext ?? "")) {
      alert(
        "الملفات المدعومة فقط هي ملفات الاكسيل (.xls, .xlsx)",
      );
      return;
    }
    setUploadedFile({
      name: file.name,
      size: formatSize(file.size),
      raw: file,
    });
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full">
      <div className="flex flex-col gap-5 px-6 py-5">
        {/* ── Header row ───────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4 w-full">
          {/* Right: title + description */}
          <div className="flex flex-col gap-1 items-start flex-1 min-w-0">
            <p
              style={{
                ...F,
                fontWeight: 700,
                fontSize: 18,
                color: "#2d3648",
                lineHeight: 1.5,
              }}
            >
              قيد مجموعة من خلال كشف مجمّع
            </p>
            <p
              style={{
                ...F,
                fontSize: 14,
                color: "#717d96",
                lineHeight: 1.4,
                textAlign: "right",
              }}
            >
              يتم استيفاء بيانات الأفراد بنموذج القيد الموحّد،
              ثم رفع الكشف بصيغة Excel لإتمام المراجعة.
            </p>
          </div>
          {/* Left: download link */}
          <a
            href="https://github.com/islammagdi/Rangerforcessystem/raw/refs/heads/main/Data.xlsx"
            download
            className="flex items-center gap-1.5 shrink-0 group"
          >
            <button
              type="button"
              className="flex items-center gap-1.5 shrink-0 group"
            >
              <Download
                size={18}
                style={{ color: "#00b867" }}
              />
              <span
                className=" group-hover:opacity-80 transition-opacity"
                style={{
                  ...F,
                  fontSize: 18,
                  background:
                    "linear-gradient(to bottom, #00b867, #00522e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                تحميل نموذج القيد الموحّد
              </span>
            </button>
          </a>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#efefef]" />

        {/* ── Drop zone ────────────────────────────────────────────── */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={[
            "flex flex-col items-center justify-center gap-4 py-10 px-6 rounded-[12px] border-2 border-dashed transition-colors cursor-default",
            dragOver
              ? "border-[#415844] bg-[#f0f3ff]"
              : "border-[#cbd2e0] bg-transparent",
          ].join(" ")}
        >
          <UploadFolderIcon />

          <div className="flex flex-col items-center gap-3 w-full">
            <p style={{ ...F, fontSize: 14, color: "#5B795F" }}>
              اسحب الملف هنا أو تصفح
            </p>

            {/* أو divider */}
            <div className="flex items-center gap-3 w-[200px]">
              <div className="flex-1 h-px bg-[#e7e7e7]" />
              <span
                style={{ ...F, fontSize: 12, color: "#717d96" }}
              >
                أو
              </span>
              <div className="flex-1 h-px bg-[#e7e7e7]" />
            </div>

            {/* Browse button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#f7f9fc] border border-[#415844] rounded-[8px] px-3 py-1.5 transition-colors hover:bg-[#eef1fd] active:opacity-80"
            >
              <span
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#415844",
                }}
              >
                تصفح الملفات
              </span>
            </button>

            {/* Hidden file input — Excel only */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Supported formats note */}
        <p
          className="text-right"
          style={{ ...F, fontSize: 12, color: "#717d96" }}
        >
          الملفات المدعومة فقط هي ملفات الاكسيل
        </p>

        {/* ── Uploaded file item ───────────────────────────────────── */}
        {uploadedFile && (
          <div className="flex items-center gap-3 bg-white border border-[#e7e7e7] rounded-[12px] px-4 py-3 w-full">
            {/* Remove button */}
            <button
              type="button"
              onClick={() => setUploadedFile(null)}
              className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full hover:bg-[#f5f5f5] transition-colors"
            >
              <X size={16} className="text-[#717d96]" />
            </button>

            {/* File info */}
            <div className="flex flex-col items-end flex-1 min-w-0 gap-0.5">
              <p
                className="w-full text-right truncate"
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#2d3648",
                }}
              >
                {uploadedFile.name}
              </p>
              <p
                className="w-full text-right"
                style={{ ...F, fontSize: 12, color: "#a0abc0" }}
              >
                {uploadedFile.size}
              </p>
            </div>

            {/* Excel icon */}
            <div className="shrink-0">
              <ExcelIcon size={28} />
            </div>
          </div>
        )}

        {/* ── Submit button ─────────────────────────────────────────── */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!uploadedFile}
            className="h-[44px] px-6 rounded-[8px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(to bottom, #00b867, #00522e)",
            }}
          >
            <span
              style={{ ...F, fontSize: 16, color: "#f5f5f5" }}
            >
              مراجعة الكشف
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function AddNewSoldierPage() {
  const navigate = useNavigate();

  // Form state
  const [method, setMethod] =
    useState<RegistrationMethod>("فرد واحد");
  const [category, setCategory] =
    useState<SoldierCategory>("مجند");
  const [milId, setMilId] = useState("");
  const [rank, setRank] = useState("");
  const [name, setName] = useState("");
  const [discharge, setDischarge] = useState("");
  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState("ملحق علي القوة");
  const [attachment, setAttachment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>(
    {},
  );

  const RANKS = [
    "جندي",
    "عريف",
    "وكيل رقيب",
    "رقيب",
    "رقيب أول",
    "مساعد أول",
  ];
  const UNITS = [
    "مج العمليات الخاصة",
    "ك ١١٣ صع",
    "س ١٤٥ اشارة",
    "فرع العمليات",
    "قيادة المنطقة",
  ];
  const STATUS = [
    "ملحق علي القوة",
    "قوة الوحده",
    "منتهي خدمته",
  ];
  const ATTACH = [
    "لا يوجد",
    "فرع العمليات",
    "قيادة المنطقة",
    "وحدة الدعم",
  ];

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "الاسم مطلوب";
    if (!rank.trim()) e.rank = "الدرجة مطلوبة";
    if (!milId.trim()) e.milId = "الرقم العسكري مطلوب";
    // تاريخ التسريح غير مطلوب للمتطوع
    if (category !== "متطوع" && !discharge.trim())
      e.discharge = "تاريخ التسريح مطلوب";
    if (!unit.trim()) e.unit = "الوحدة الاساسية مطلوبة";
    // جهة الالحاق غير مطلوبة عند "ملحق علي القوة"
    if (status !== "ملحق علي القوة" && !attachment.trim())
      e.attachment = "جهة الالحاق مطلوبة";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    navigate("/dashboard/add-soldier/review", {
      state: {
        name,
        rank,
        milId,
        category,
        unit,
        status,
        attachment,
        discharge,
      },
    });
  }

  function handleGroupSubmit() {
    navigate("/dashboard/add-soldier/group-review");
  }

  const isGroup = method === "مجموعة افراد";
  const isAttachmentDisabled = status === "قوة الوحده";

  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      {/* ── Page title ──────────────────────────────────────────────── */}
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

      {/* ── Stepper ─────────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <Stepper groupMode={isGroup} />
      </div>

      {/* ── طريقة القيد ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 items-start">
        <p
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 18,
            color: "#2d3648",
          }}
        >
          طريقة القيد
        </p>
        <div className="flex flex-wrap gap-4 justify-end">
          {(
            [, "فرد واحد","مجموعة افراد"] as RegistrationMethod[]
          ).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={[
                "flex items-center gap-3 px-4 py-4 rounded-[12px] border transition-colors w-[200px]",
                method === m
                  ? "border-[#4bff62] bg-white"
                  : "border-[#e2e7f0] bg-white hover:border-[#a0aec0]",
              ].join(" ")}
            >
              <span className="shrink-0 w-5 h-5 rounded-full border-[1.5px] border-[#344736] flex items-center justify-center">
                {method === m && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      background:
                        "linear-gradient(to bottom, #00b867, #00522e)",
                    }}
                  />
                )}
              </span>
              <span
                className="flex-1 text-right"
                style={{ ...F, fontSize: 18, color: "#2d3648" }}
              >
                {m}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Conditional content ─────────────────────────────────────── */}
      {isGroup ? (
        /* Group upload UI */
        <GroupUploadSection onSubmit={handleGroupSubmit} />
      ) : (
        /* Individual form */
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
        >
          <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full">
            <div className="flex flex-col gap-6 px-6 py-5">
              {/* Card header */}
              <div className="flex items-center justify-start gap-3 pb-3 border-b border-[#cbd2e0]">
                <span
                  style={{
                    ...F,
                    fontSize: 18,
                    color: "#4a5468",
                  }}
                >
                  البيانات الاساسية
                </span>
              </div>

              {/* فئة الفرد */}
              <div className="flex flex-col gap-3 items-start">
                <SubHeader>فئة الفرد</SubHeader>
                <CategoryToggle
                  value={category}
                  onChange={setCategory}
                />
              </div>

              <SubHeader>البيانات التعريفية</SubHeader>

              <div className="flex flex-col sm:flex-row gap-4">
                <FieldGroup label="الرقم العسكري">
                  <FormInput
                    placeholder="ادخل الرقم العسكري"
                    value={milId}
                    onChange={(v) => {
                      setMilId(v);
                      setErrors((p) => ({
                        ...p,
                        milId: undefined,
                      }));
                    }}
                    error={errors.milId}
                  />
                </FieldGroup>
                <FieldGroup label="الدرجة">
                  <FormDropdown
                    placeholder="اختيار الدرجة"
                    options={RANKS}
                    value={rank}
                    onChange={(v) => {
                      setRank(v);
                      setErrors((p) => ({
                        ...p,
                        rank: undefined,
                      }));
                    }}
                    error={errors.rank}
                  />
                </FieldGroup>
                <FieldGroup label="الاسم">
                  <FormInput
                    placeholder="اسم الفرد"
                    value={name}
                    onChange={(v) => {
                      setName(v);
                      setErrors((p) => ({
                        ...p,
                        name: undefined,
                      }));
                    }}
                    error={errors.name}
                  />
                </FieldGroup>
              </div>

              {/* تاريخ التسريح — مخفي عند متطوع */}
              {category !== "متطوع" && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <FieldGroup
                    label="تاريخ التسريح"
                    labelColor="#415844"
                  >
                    <DateInput
                      value={discharge}
                      onChange={(v) => {
                        setDischarge(v);
                        setErrors((p) => ({
                          ...p,
                          discharge: undefined,
                        }));
                      }}
                      error={errors.discharge}
                    />
                  </FieldGroup>
                  <div className="flex-1 hidden sm:block" />
                  <div className="flex-1 hidden sm:block" />
                </div>
              )}

              <SubHeader>بيانات الوحدة والموقف</SubHeader>

              <div className="flex flex-col sm:flex-row gap-4">
                <FieldGroup label="الوحدة الاساسية">
                  <FormDropdown
                    placeholder="اختار الوحدة"
                    options={UNITS}
                    value={unit}
                    onChange={(v) => {
                      setUnit(v);
                      setErrors((p) => ({
                        ...p,
                        unit: undefined,
                      }));
                    }}
                    error={errors.unit}
                  />
                </FieldGroup>
                <FieldGroup label="موقف الفرد">
                  <FormDropdown
                    placeholder="اختر الموقف"
                    options={STATUS}
                    value={status}
                    onChange={(v) => {
                      setStatus(v);
                      // clear attachment when disabling
                      if (v === "ملحق علي القوة") {
                        setAttachment("");
                        setErrors((p) => ({
                          ...p,
                          attachment: undefined,
                        }));
                      }
                    }}
                  />
                </FieldGroup>
                <FieldGroup label="جهة الالحاق">
                  <FormDropdown
                    placeholder={
                      isAttachmentDisabled
                        ? "غير متاح"
                        : "اختر الوحدة"
                    }
                    options={ATTACH}
                    value={attachment}
                    disabled={isAttachmentDisabled}
                    onChange={(v) => {
                      setAttachment(v);
                      setErrors((p) => ({
                        ...p,
                        attachment: undefined,
                      }));
                    }}
                    error={
                      isAttachmentDisabled
                        ? undefined
                        : errors.attachment
                    }
                  />
                </FieldGroup>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="h-[44px] px-6 rounded-[8px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80"
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
                    }}
                  >
                    المراجعة والضم
                  </span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}