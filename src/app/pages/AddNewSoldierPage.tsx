import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router";
import {
  CalendarDays,
  Download,
  Upload,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";

// ============================================================
// Types
// ============================================================

type RegistrationMethod = "فرد واحد" | "مجموعة افراد";
type SoldierCategory = "مجند" | "متطوع";

interface Rank {
  id: string;
  name: string;
  code: string | null;
  sort_order: number | null;
  is_active: boolean;
}

interface Unit {
  id: string;
  name: string;
  code: string | null;
  unit_type: string | null;
  parent_unit_id: string | null;
  is_active: boolean;
}

interface ServiceStatus {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
}

interface PersonnelCategory {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
}

interface Option {
  value: string;
  label: string;
}

interface UploadedFile {
  name: string;
  size: string;
  raw: File;
}

interface GroupPersonnelRow {
  military_number: string;
  rank_name: string;
  full_name: string;
  personnel_category_name: string;
  primary_unit_name: string;
  service_status_name: string;
  discharge_date: string | null;
  attachment_unit_name: string;
  row_number: number;
}

// النوع الناتج بعد مطابقة كل صف مع قاعدة البيانات
type RowClassification = "new" | "update" | "error";

interface ClassifiedPersonnelRow extends GroupPersonnelRow {
  classification: RowClassification;
  errors: string[];
  rank_id: string | null;
  personnel_category_id: string | null;
  primary_unit_id: string | null;
  service_status_id: string | null;
  attachment_unit_id: string | null;
}

// ============================================================
// Excel
// ============================================================

const EXCEL_TEMPLATE_URL =
  "https://github.com/islammagdi/Rangerforcessystem/raw/0639ca38fd820f9e59a1891492d4bb1592aebca8/Data.xlsx";

const REQUIRED_EXCEL_COLUMNS = [
  "الرقم العسكري",
  "الدرجة",
  "الاسم",
  "فئه الفرد",
  "الوحده الاساسيه",
  "الموقف الخدمي",
  "تاريخ التسريح",
  "جهه الالحاق",
];

// ⚠️ عدّل اسم الجدول هذا ليطابق الجدول الفعلي الذي يخزن الأفراد المسجلين بالفعل
const PERSONNEL_TABLE_NAME = "personnel";

function normalizeExcelHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/ة/g, "ه")
    .replace(/أ/g, "ا")
    .replace(/إ/g, "ا")
    .replace(/آ/g, "ا");
}

function normalizeExcelValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    return String(value);
  }

  return String(value).trim();
}

function excelDateToISO(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);

    if (!date) {
      return null;
    }

    const month = String(date.m).padStart(2, "0");
    const day = String(date.d).padStart(2, "0");

    return `${date.y}-${month}-${day}`;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) {
    const [y, m, d] = text.split("-");

    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    const [d, m, y] = text.split("/");

    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(text)) {
    const [d, m, y] = text.split("-");

    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return text;
}

// ============================================================
// Shared
// ============================================================

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ============================================================
// Stepper
// ============================================================

const STEPS = [
  { num: "01", label: "ادخال البيانات", active: true },
  { num: "02", label: "المراجعة", active: false },
  { num: "03", label: "اعتماد", active: false },
];

function StepDots() {
  return (
    <div className="flex items-center gap-[3px] mx-2">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] h-[3px] rounded-full bg-[#a1aebe]"
        />
      ))}
    </div>
  );
}

function Stepper() {
  return (
    <div className="flex items-start gap-0" dir="rtl">
      {STEPS.map((step, idx) => (
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
                whiteSpace: "nowrap",
              }}
            >
              {step.label}
            </span>
          </div>

          {idx < STEPS.length - 1 && (
            <div className="mt-[14px]">
              <StepDots />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Icons
// ============================================================

function SoldierIcon({ white = false }: { white?: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
      <path
        d="M0 18.55C.024 17.76.038 16.9.064 16.01c1.766.09 4.896.24 5.726-.27.77-.46 1.17-1.08 1.57-1.69.53-.83 1.06-1.64 2.55-1.95 1.87-.4 4.01-.53 6.2-.67 2.68-.17 5.43-.35 7.85-1 .21-.06.54-.26.83-.46.17.26.37.53.61.81.31.38.64.93.58 1.51 0 0-.36.37-1.71.73-4.37 1.18-9.85.79-14.03 1.67-.82.17-1.85.64-2.61 1.84 0 0-.61 1.24-1.59 1.84-.95.57-4.77.21-6.04.18ZM.08 15.49c.12-3.59.48-7.72 2.25-10.68C5.09.18 12.62-.93 17.38.72c1.54.53 3.16 1.47 4.33 3.13 0 0 .45.62.89 1.37.99 1.69 1.03 2.83 1.92 4.32-.27.17-.55.35-.7.39-2.37.64-5.09.81-7.74.98-2.21.14-4.37.28-6.28.68-1.7.36-2.28 1.26-2.88 2.18-.36.56-.73 1.13-1.4 1.53-.69.43-3.73.28-5.44.19Z"
        fill={white ? "white" : "#00B867"}
      />
      <path
        d="M11.56 14.98c.28 1.93.41 5.58.38 6.76-.01.57-.22.49.62.49h2.48s-.06-4.67-.38-7.57c-.24.01-.48.03-.71.05-.8.06-1.6.15-2.39.27ZM6.04 18.93v3.09h2.97v-6.27c-.36.25-.67.59-.92 1.02-.38.75-1.07 1.6-1.78 2.04-.08.04-.17.09-.27.12ZM6.04 25.45v3.43c0 .62.67 1.12 1.49 1.12.81 0 1.48-.5 1.48-1.12v-3.43H6.04Z"
        fill={white ? "white" : "#00522E"}
      />
    </svg>
  );
}

function StarIcon({ white = false }: { white?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
      <path
        d="M13 2l3.09 7.26L24 10.27l-5.5 5.37 1.32 7.86L13 19.77 6.18 23.5l1.32-7.86L2 10.27l7.91-1.01L13 2Z"
        fill={white ? "white" : "#00B867"}
        stroke={white ? "white" : "#00522E"}
        strokeWidth="1.5"
      />
    </svg>
  );
}

// ============================================================
// Category Toggle
// ============================================================

function CategoryToggle({
  value,
  onChange,
}: {
  value: SoldierCategory;
  onChange: (value: SoldierCategory) => void;
}) {
  return (
    <div className="flex items-stretch rounded-[12px] overflow-hidden border border-[#eff0f6]">
      <button
        type="button"
        onClick={() => onChange("مجند")}
        className={[
          "flex items-center gap-4 px-3 py-3 w-[155px] justify-end",
          value === "مجند"
            ? "bg-gradient-to-b from-[#00b867] to-[#00522e]"
            : "bg-white hover:bg-gray-50",
        ].join(" ")}
      >
        <span
          style={{
            ...F,
            fontSize: 18,
            color: value === "مجند" ? "white" : "#2d3648",
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
          "flex items-center gap-4 px-3 py-3 w-[155px] justify-end",
          value === "متطوع"
            ? "bg-gradient-to-b from-[#00b867] to-[#00522e]"
            : "bg-white hover:bg-gray-50",
        ].join(" ")}
      >
        <span
          style={{
            ...F,
            fontSize: 18,
            color: value === "متطوع" ? "white" : "#2d3648",
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

// ============================================================
// Dropdown
// ============================================================

function FormDropdown({
  placeholder,
  options,
  value,
  onChange,
  error,
  disabled = false,
}: {
  placeholder: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          dir="rtl"
          className={[
            "w-full h-[54px] appearance-none bg-white border rounded-[8px]",
            "px-3 pl-10 outline-none transition-colors",
            disabled
              ? "bg-[#f3f4f6] cursor-not-allowed opacity-60"
              : "cursor-pointer focus:border-[#344736]",
            error ? "border-[#ef4444]" : "border-[#e2e7f0]",
          ].join(" ")}
          style={{
            ...F,
            fontSize: 16,
            color: value ? "#4a5468" : "#a0abc0",
          }}
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#344736]">
          ▼
        </span>
      </div>

      {error && (
        <p
          className="text-right px-1"
          style={{ ...F, fontSize: 13, color: "#ef4444" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Input
// ============================================================

function FormInput({
  placeholder,
  value,
  onChange,
  error,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir="rtl"
        className={[
          "w-full h-[54px] bg-white border rounded-[8px] px-3",
          "text-right outline-none focus:border-[#344736]",
          error ? "border-[#ef4444]" : "border-[#e2e7f0]",
        ].join(" ")}
        style={{ ...F, fontSize: 18, color: "#4a5468" }}
      />

      {error && (
        <p
          className="text-right px-1"
          style={{ ...F, fontSize: 13, color: "#ef4444" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Date
// ============================================================

function DateInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative">
        <CalendarDays
          size={20}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-[#415844]"
        />

        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={[
            "w-full h-[54px] bg-white border rounded-[8px]",
            "pr-10 pl-3 outline-none focus:border-[#415844]",
            error ? "border-[#ef4444]" : "border-[#e2e7f0]",
          ].join(" ")}
          style={{
            ...F,
            fontSize: 18,
            color: value ? "#4a5468" : "#a0abc0",
            direction: "ltr",
            textAlign: "right",
          }}
        />
      </div>

      {error && (
        <p
          className="text-right px-1"
          style={{ ...F, fontSize: 13, color: "#ef4444" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Field Group
// ============================================================

function FieldGroup({
  label,
  children,
  labelColor = "#2d3648",
}: {
  label: string;
  children: React.ReactNode;
  labelColor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <label
        className="block text-right px-1"
        style={{ ...F, fontWeight: 700, fontSize: 16, color: labelColor }}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-right w-full"
      style={{ ...F, fontWeight: 700, fontSize: 18, color: "#2d3648" }}
    >
      {children}
    </p>
  );
}

// ============================================================
// Excel Icon
// ============================================================

function ExcelIcon({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: "#217346",
        borderRadius: 5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 800,
        fontSize: size * 0.42,
        fontFamily: "Arial",
      }}
    >
      X
    </div>
  );
}

// ============================================================
// Group Upload Section
// ============================================================

function GroupUploadSection({
  onSubmit,
  loading,
  uploadedFile,
  setUploadedFile,
}: {
  onSubmit: () => void;
  loading: boolean;
  uploadedFile: UploadedFile | null;
  setUploadedFile: React.Dispatch<React.SetStateAction<UploadedFile | null>>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);

  const formatSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }

    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(0)}KB`;
    }

    return `${bytes}B`;
  };

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (!["xls", "xlsx"].includes(ext ?? "")) {
        alert("الملفات المدعومة فقط هي ملفات الاكسيل (.xls, .xlsx)");
        return;
      }

      setUploadedFile({
        name: file.name,
        size: formatSize(file.size),
        raw: file,
      });
    },
    [setUploadedFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      handleFile(file);
    }

    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full">
      <div className="flex flex-col gap-5 px-6 py-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 w-full">
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
                lineHeight: 1.6,
                textAlign: "right",
              }}
            >
              قم بتحميل نموذج القيد الموحّد، ثم قم بتعبئة بيانات الأفراد
              ورفع الملف مرة أخرى لإجراء المراجعة.
            </p>
          </div>

          {/* Download template */}
          <a
            href={EXCEL_TEMPLATE_URL}
            download="Data.xlsx"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 shrink-0 group"
          >
            <Download size={18} style={{ color: "#00b867" }} />

            <span
              className="group-hover:opacity-80 transition-opacity"
              style={{
                ...F,
                fontSize: 16,
                background: "linear-gradient(to bottom, #00b867, #00522e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              تحميل نموذج القيد الموحّد
            </span>
          </a>
        </div>

        <div className="w-full h-px bg-[#efefef]" />

        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={[
            "flex flex-col items-center justify-center gap-4 py-10 px-6 rounded-[12px]",
            "border-2 border-dashed transition-colors cursor-default",
            dragOver
              ? "border-[#415844] bg-[#f0f3ff]"
              : "border-[#cbd2e0] bg-transparent",
          ].join(" ")}
        >
          <Upload size={42} strokeWidth={1.5} className="text-[#415844]" />

          <div className="flex flex-col items-center gap-3 w-full">
            <p style={{ ...F, fontSize: 14, color: "#5B795F" }}>
              اسحب ملف Excel هنا أو تصفح
            </p>

            <div className="flex items-center gap-3 w-[200px]">
              <div className="flex-1 h-px bg-[#e7e7e7]" />

              <span style={{ ...F, fontSize: 12, color: "#717d96" }}>أو</span>

              <div className="flex-1 h-px bg-[#e7e7e7]" />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#f7f9fc] border border-[#415844] rounded-[8px] px-3 py-1.5 transition-colors hover:bg-[#eef1fd] active:opacity-80"
            >
              <span
                style={{ ...F, fontWeight: 700, fontSize: 12, color: "#415844" }}
              >
                تصفح الملفات
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        </div>

        <p className="text-right" style={{ ...F, fontSize: 12, color: "#717d96" }}>
          الملفات المدعومة فقط هي ملفات الاكسيل (.xls, .xlsx)
        </p>

        {/* Uploaded File */}
        {uploadedFile && (
          <div className="flex items-center gap-3 bg-white border border-[#e7e7e7] rounded-[12px] px-4 py-3 w-full">
            <div className="shrink-0">
              <ExcelIcon size={28} />
            </div>

            <div className="flex flex-col items-end flex-1 min-w-0 gap-0.5">
              <p
                className="w-full text-right truncate"
                style={{ ...F, fontWeight: 700, fontSize: 12, color: "#2d3648" }}
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

            <button
              type="button"
              onClick={() => setUploadedFile(null)}
              className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full hover:bg-[#f5f5f5] transition-colors"
            >
              <X size={16} className="text-[#717d96]" />
            </button>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!uploadedFile || loading}
            className="h-[44px] px-6 rounded-[8px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(to bottom, #00b867, #00522e)" }}
          >
            <span style={{ ...F, fontSize: 16, color: "#f5f5f5" }}>
              {loading ? "جاري قراءة الكشف..." : "مراجعة الكشف"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export function AddNewSoldierPage() {
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // Basic state
  // ----------------------------------------------------------

  const [method, setMethod] = useState<RegistrationMethod>("فرد واحد");

  const [category, setCategory] = useState<SoldierCategory>("مجند");

  const [milId, setMilId] = useState("");
  const [rank, setRank] = useState("");
  const [name, setName] = useState("");
  const [discharge, setDischarge] = useState("");
  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState("");
  const [attachment, setAttachment] = useState("");

  // ----------------------------------------------------------
  // Group upload
  // ----------------------------------------------------------

  const [uploadedGroupFile, setUploadedGroupFile] =
    useState<UploadedFile | null>(null);

  const [groupLoading, setGroupLoading] = useState(false);

  // ----------------------------------------------------------
  // Database state
  // ----------------------------------------------------------

  const [ranks, setRanks] = useState<Rank[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [statuses, setStatuses] = useState<ServiceStatus[]>([]);
  const [categories, setCategories] = useState<PersonnelCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ==========================================================
  // Load database data
  // ==========================================================

  useEffect(() => {
    loadFormData();
  }, []);

  async function loadFormData() {
    try {
      setLoading(true);

      const [ranksResult, unitsResult, statusesResult, categoriesResult] =
        await Promise.all([
          supabase
            .from("ranks")
            .select("id,name,code,sort_order,is_active")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),

          supabase
            .from("units")
            .select("id,name,code,unit_type,parent_unit_id,is_active")
            .eq("is_active", true)
            .order("name", { ascending: true }),

          supabase
            .from("service_statuses")
            .select("id,name,code,is_active")
            .eq("is_active", true)
            .order("name", { ascending: true }),

          supabase
            .from("personnel_categories")
            .select("id,name,code,is_active")
            .eq("is_active", true)
            .order("name", { ascending: true }),
        ]);

      if (ranksResult.error) {
        throw ranksResult.error;
      }

      if (unitsResult.error) {
        throw unitsResult.error;
      }

      if (statusesResult.error) {
        throw statusesResult.error;
      }

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      setRanks(ranksResult.data ?? []);
      setUnits(unitsResult.data ?? []);
      setStatuses(statusesResult.data ?? []);
      setCategories(categoriesResult.data ?? []);

      const attachedStatus = (statusesResult.data ?? []).find(
        (s) =>
          s.code?.toUpperCase() === "ATTACHED" || s.name === "ملحق علي القوة"
      );

      if (attachedStatus) {
        setStatus(attachedStatus.id);
      }
    } catch (error) {
      console.error("Error loading form data:", error);

      alert("حدث خطأ أثناء تحميل البيانات من قاعدة البيانات");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // Category DB record
  // ==========================================================

  const selectedCategory = useMemo(() => {
    return categories.find((c) => {
      const code = c.code?.toUpperCase() ?? "";

      if (category === "مجند") {
        return (
          c.name === "مجند" || code === "CONSCRIPT" || code === "SOLDIER"
        );
      }

      return c.name === "متطوع" || code === "VOLUNTEER";
    });
  }, [categories, category]);

  // ==========================================================
  // Rank filtering
  // ==========================================================

  const filteredRanks = useMemo(() => {
    if (category === "مجند") {
      return ranks.filter((r) => {
        const rankName = r.name.trim();
        const code = r.code?.trim().toUpperCase();

        return rankName === "جندي" || code === "SOLDIER";
      });
    }

    return ranks.filter((r) => {
      const rankName = r.name.trim();
      const code = r.code?.trim().toUpperCase();

      return rankName !== "جندي" && code !== "SOLDIER";
    });
  }, [ranks, category]);

  // ==========================================================
  // Unit options
  // ==========================================================

  const mainUnitOptions = useMemo(() => {
    return units
      .filter((u) => u.unit_type?.toUpperCase() === "MAIN")
      .map((u) => ({ value: u.id, label: u.name }));
  }, [units]);

  const attachmentUnitOptions = useMemo(() => {
    return units.map((u) => ({ value: u.id, label: u.name }));
  }, [units]);

  // ==========================================================
  // Options
  // ==========================================================

  const rankOptions = useMemo(() => {
    return filteredRanks.map((r) => ({ value: r.id, label: r.name }));
  }, [filteredRanks]);

  const statusOptions = useMemo(() => {
    return statuses.map((s) => ({ value: s.id, label: s.name }));
  }, [statuses]);

  const selectedStatus = statuses.find((s) => s.id === status);

  // ==========================================================
  // Attachment
  // ==========================================================

  const isAttachmentEnabled =
    selectedStatus?.code?.toUpperCase() === "ATTACHED" ||
    selectedStatus?.name === "ملحق علي القوة";

  // ==========================================================
  // Lookup maps للمطابقة بين ملف الإكسيل وجداول قاعدة البيانات
  // ==========================================================

  const rankLookup = useMemo(() => {
    const map = new Map<string, Rank>();

    ranks.forEach((r) => {
      map.set(normalizeExcelHeader(r.name), r);
    });

    return map;
  }, [ranks]);

  const unitLookup = useMemo(() => {
    const map = new Map<string, Unit>();

    units.forEach((u) => {
      map.set(normalizeExcelHeader(u.name), u);
    });

    return map;
  }, [units]);

  const statusLookup = useMemo(() => {
    const map = new Map<string, ServiceStatus>();

    statuses.forEach((s) => {
      map.set(normalizeExcelHeader(s.name), s);
    });

    return map;
  }, [statuses]);

  const categoryLookup = useMemo(() => {
    const map = new Map<string, PersonnelCategory>();

    categories.forEach((c) => {
      map.set(normalizeExcelHeader(c.name), c);
    });

    return map;
  }, [categories]);

  // ==========================================================
  // مطابقة صف واحد من الإكسيل مع قاعدة البيانات وتصنيفه
  // ==========================================================

  const classifyRow = useCallback(
    (
      row: GroupPersonnelRow,
      existingMilitaryNumbers: Set<string>,
      duplicateMilitaryNumbers: Set<string>
    ): ClassifiedPersonnelRow => {
      const errors: string[] = [];

      // --------------------------------------------------
      // حقول أساسية مفقودة
      // --------------------------------------------------

      if (!row.military_number) {
        errors.push("الرقم العسكري مفقود");
      }

      if (!row.rank_name) {
        errors.push("الدرجة مفقودة");
      }

      if (!row.full_name) {
        errors.push("الاسم مفقود");
      }

      if (!row.personnel_category_name) {
        errors.push("فئة الفرد مفقودة");
      }

      if (!row.primary_unit_name) {
        errors.push("الوحدة الأساسية مفقودة");
      }

      if (!row.service_status_name) {
        errors.push("الموقف الخدمي مفقود");
      }

      if (
        row.military_number &&
        duplicateMilitaryNumbers.has(row.military_number)
      ) {
        errors.push("الرقم العسكري مكرر داخل نفس الملف");
      }

      // --------------------------------------------------
      // مطابقة القيم النصية بجداول قاعدة البيانات
      // --------------------------------------------------

      const matchedRank = row.rank_name
        ? rankLookup.get(normalizeExcelHeader(row.rank_name))
        : undefined;

      const matchedCategory = row.personnel_category_name
        ? categoryLookup.get(normalizeExcelHeader(row.personnel_category_name))
        : undefined;

      const matchedUnit = row.primary_unit_name
        ? unitLookup.get(normalizeExcelHeader(row.primary_unit_name))
        : undefined;

      const matchedStatus = row.service_status_name
        ? statusLookup.get(normalizeExcelHeader(row.service_status_name))
        : undefined;

      const matchedAttachmentUnit = row.attachment_unit_name
        ? unitLookup.get(normalizeExcelHeader(row.attachment_unit_name))
        : undefined;

      if (row.rank_name && !matchedRank) {
        errors.push(`الدرجة "${row.rank_name}" غير موجودة في قاعدة البيانات`);
      }

      if (row.personnel_category_name && !matchedCategory) {
        errors.push(
          `فئة الفرد "${row.personnel_category_name}" غير موجودة في قاعدة البيانات`
        );
      }

      if (row.primary_unit_name && !matchedUnit) {
        errors.push(
          `الوحدة الأساسية "${row.primary_unit_name}" غير موجودة في قاعدة البيانات`
        );
      }

      if (row.service_status_name && !matchedStatus) {
        errors.push(
          `الموقف الخدمي "${row.service_status_name}" غير موجود في قاعدة البيانات`
        );
      }

      if (row.attachment_unit_name && !matchedAttachmentUnit) {
        errors.push(
          `جهة الإلحاق "${row.attachment_unit_name}" غير موجودة في قاعدة البيانات`
        );
      }

      // --------------------------------------------------
      // تطابق الدرجة مع الفئة (نفس منطق القيد الفردي:
      // فئة "مجند" تقبل درجة "جندي" فقط والعكس صحيح)
      // --------------------------------------------------

      let isConscriptCategory = false;

      if (matchedCategory) {
        const code = matchedCategory.code?.toUpperCase() ?? "";

        isConscriptCategory =
          matchedCategory.name === "مجند" ||
          code === "CONSCRIPT" ||
          code === "SOLDIER";
      }

      if (matchedRank && matchedCategory) {
        const rankCode = matchedRank.code?.trim().toUpperCase();
        const isSoldierRank =
          matchedRank.name.trim() === "جندي" || rankCode === "SOLDIER";

        if (isConscriptCategory && !isSoldierRank) {
          errors.push('فئة (مجند) يجب أن تكون الدرجة فيها "جندي" فقط');
        }

        if (!isConscriptCategory && isSoldierRank) {
          errors.push('فئة (متطوع) لا يمكن أن تكون الدرجة فيها "جندي"');
        }
      }

      // تاريخ التسريح مطلوب للمجندين
      if (isConscriptCategory && !row.discharge_date) {
        errors.push('تاريخ التسريح مطلوب لفئة "مجند"');
      }

      // جهة الإلحاق مطلوبة لو الموقف الخدمي "ملحق علي القوة"
      const requiresAttachment =
        matchedStatus?.code?.toUpperCase() === "ATTACHED" ||
        matchedStatus?.name === "ملحق علي القوة";

      if (requiresAttachment && !matchedAttachmentUnit) {
        errors.push("جهة الإلحاق مطلوبة لهذا الموقف الخدمي");
      }

      // --------------------------------------------------
      // التصنيف النهائي
      // --------------------------------------------------

      const classification: RowClassification =
        errors.length > 0
          ? "error"
          : existingMilitaryNumbers.has(row.military_number)
          ? "update"
          : "new";

      return {
        ...row,
        classification,
        errors,
        rank_id: matchedRank?.id ?? null,
        personnel_category_id: matchedCategory?.id ?? null,
        primary_unit_id: matchedUnit?.id ?? null,
        service_status_id: matchedStatus?.id ?? null,
        attachment_unit_id: matchedAttachmentUnit?.id ?? null,
      };
    },
    [rankLookup, categoryLookup, unitLookup, statusLookup]
  );

  // ==========================================================
  // Category changed
  // ==========================================================

  function handleCategoryChange(value: SoldierCategory) {
    setCategory(value);
    setRank("");

    setErrors((prev) => {
      const next = { ...prev };

      delete next.rank;
      delete next.discharge;

      return next;
    });

    if (value === "متطوع") {
      setDischarge("");
    }
  }

  // ==========================================================
  // Status changed
  // ==========================================================

  function handleStatusChange(value: string) {
    setStatus(value);

    const newStatus = statuses.find((s) => s.id === value);

    const enabled =
      newStatus?.code?.toUpperCase() === "ATTACHED" ||
      newStatus?.name === "ملحق علي القوة";

    if (!enabled) {
      setAttachment("");

      setErrors((prev) => {
        const next = { ...prev };
        delete next.attachment;
        return next;
      });
    }
  }

  // ==========================================================
  // Validation
  // ==========================================================

  function validate() {
    const e: Record<string, string> = {};

    if (!milId.trim()) {
      e.milId = "الرقم العسكري مطلوب";
    }

    if (!name.trim()) {
      e.name = "الاسم مطلوب";
    }

    if (!rank) {
      e.rank = "الدرجة مطلوبة";
    }

    if (!unit) {
      e.unit = "الوحدة الأساسية مطلوبة";
    }

    if (!status) {
      e.status = "موقف الفرد مطلوب";
    }

    if (!selectedCategory) {
      e.category = "لم يتم العثور على فئة الفرد في قاعدة البيانات";
    }

    if (category === "مجند" && !discharge) {
      e.discharge = "تاريخ التسريح مطلوب";
    }

    if (isAttachmentEnabled && !attachment) {
      e.attachment = "جهة الإلحاق مطلوبة";
    }

    return e;
  }

  // ==========================================================
  // Individual Submit
  // ==========================================================

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const payload = {
        military_number: milId.trim(),
        full_name: name.trim(),
        rank_id: rank,
        personnel_category_id: selectedCategory!.id,
        service_status_id: status,
        primary_unit_id: unit,
        attachment_unit_id: isAttachmentEnabled ? attachment : null,
        discharge_date: category === "متطوع" ? null : discharge || null,
        is_active: true,
      };

      const selectedRank = ranks.find((r) => r.id === rank);
      const selectedUnit = units.find((u) => u.id === unit);
      const selectedAttachmentUnit = units.find((u) => u.id === attachment);

      navigate("/dashboard/add-soldier/review", {
        state: {
          ...payload,
          personnel_category: category,
          personnel_category_id: payload.personnel_category_id,
          personnel_category_name: selectedCategory?.name ?? "",
          rank_name: selectedRank?.name ?? "",
          status_name: selectedStatus?.name ?? "",
          primary_unit_name: selectedUnit?.name ?? "",
          attachment_unit_name: isAttachmentEnabled
            ? selectedAttachmentUnit?.name ?? ""
            : "",
        },
      });
    } catch (error) {
      console.error("Submit error:", error);

      alert("حدث خطأ أثناء تجهيز البيانات");
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // GROUP EXCEL PARSER
  // ==========================================================

  async function handleGroupSubmit() {
    if (!uploadedGroupFile) {
      alert("من فضلك اختر ملف Excel أولاً");
      return;
    }

    try {
      setGroupLoading(true);

      const arrayBuffer = await uploadedGroupFile.raw.arrayBuffer();

      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
        cellDates: true,
      });

      if (!workbook.SheetNames.length) {
        throw new Error("ملف Excel لا يحتوي على أي ورقة");
      }

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        firstSheet,
        {
          defval: "",
          raw: true,
        }
      );

      if (!rows.length) {
        alert("ملف Excel فارغ ولا يحتوي على بيانات");
        return;
      }

      // ------------------------------------------------------
      // Check headers (خطأ حرج يوقف العملية لأن الملف غير مطابق للنموذج)
      // ------------------------------------------------------

      const originalHeaders = Object.keys(rows[0]);

      const normalizedHeaders = originalHeaders.map(normalizeExcelHeader);

      const missingColumns = REQUIRED_EXCEL_COLUMNS.filter((required) => {
        const normalizedRequired = normalizeExcelHeader(required);

        return !normalizedHeaders.includes(normalizedRequired);
      });

      if (missingColumns.length > 0) {
        alert(
          `ملف Excel غير مطابق للنموذج.\n\nالأعمدة المفقودة:\n${missingColumns.join(
            "\n"
          )}`
        );

        return;
      }

      // ------------------------------------------------------
      // Create header mapping
      // ------------------------------------------------------

      const headerMap: Record<string, string> = {};

      originalHeaders.forEach((header) => {
        headerMap[normalizeExcelHeader(header)] = header;
      });

      const getValue = (
        row: Record<string, unknown>,
        arabicHeader: string
      ) => {
        const actualHeader = headerMap[normalizeExcelHeader(arabicHeader)];

        return actualHeader ? row[actualHeader] : "";
      };

      // ------------------------------------------------------
      // Parse rows
      // ------------------------------------------------------

      const parsedRows: GroupPersonnelRow[] = [];

      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];

        const militaryNumber = normalizeExcelValue(
          getValue(row, "الرقم العسكري")
        );

        const rankName = normalizeExcelValue(getValue(row, "الدرجة"));

        const fullName = normalizeExcelValue(getValue(row, "الاسم"));

        const categoryName = normalizeExcelValue(
          getValue(row, "فئه الفرد")
        );

        const primaryUnitName = normalizeExcelValue(
          getValue(row, "الوحده الاساسيه")
        );

        const serviceStatusName = normalizeExcelValue(
          getValue(row, "الموقف الخدمي")
        );

        const dischargeDate = excelDateToISO(
          getValue(row, "تاريخ التسريح")
        );

        const attachmentUnitName = normalizeExcelValue(
          getValue(row, "جهه الالحاق")
        );

        // تجاهل الصف الفارغ بالكامل
        const isEmptyRow =
          !militaryNumber &&
          !rankName &&
          !fullName &&
          !categoryName &&
          !primaryUnitName &&
          !serviceStatusName &&
          !dischargeDate &&
          !attachmentUnitName;

        if (isEmptyRow) {
          continue;
        }

        parsedRows.push({
          military_number: militaryNumber,
          rank_name: rankName,
          full_name: fullName,
          personnel_category_name: categoryName,
          primary_unit_name: primaryUnitName,
          service_status_name: serviceStatusName,
          discharge_date: dischargeDate,
          attachment_unit_name: attachmentUnitName,
          row_number: index + 2,
        });
      }

      if (!parsedRows.length) {
        alert("لم يتم العثور على أفراد صالحين داخل الملف");
        return;
      }

      // ------------------------------------------------------
      // تحديد الأرقام العسكرية المكررة داخل نفس الملف
      // (لا توقف العملية، فقط تُصنَّف كأخطاء لهذه الصفوف)
      // ------------------------------------------------------

      const numberCounts = new Map<string, number>();

      parsedRows.forEach((row) => {
        if (!row.military_number) {
          return;
        }

        numberCounts.set(
          row.military_number,
          (numberCounts.get(row.military_number) ?? 0) + 1
        );
      });

      const duplicateMilitaryNumbers = new Set(
        Array.from(numberCounts.entries())
          .filter(([, count]) => count > 1)
          .map(([number]) => number)
      );

      // ------------------------------------------------------
      // البحث عن الأرقام العسكرية الموجودة بالفعل في قاعدة
      // البيانات لتحديد من سيُضاف جديدًا ومن سيتم تحديث بياناته
      // ------------------------------------------------------

      const uniqueMilitaryNumbers = Array.from(
        new Set(parsedRows.map((r) => r.military_number).filter(Boolean))
      );

      let existingMilitaryNumbers = new Set<string>();

      if (uniqueMilitaryNumbers.length > 0) {
        const { data: existingData, error: existingError } = await supabase
          .from(PERSONNEL_TABLE_NAME)
          .select("military_number")
          .in("military_number", uniqueMilitaryNumbers);

        if (existingError) {
          throw existingError;
        }

        existingMilitaryNumbers = new Set(
          (existingData ?? []).map((item: { military_number: unknown }) =>
            String(item.military_number)
          )
        );
      }

      // ------------------------------------------------------
      // تصنيف كل صف: جديد / تحديث / خطأ
      // ------------------------------------------------------

      const classifiedRows: ClassifiedPersonnelRow[] = parsedRows.map((row) =>
        classifyRow(row, existingMilitaryNumbers, duplicateMilitaryNumbers)
      );

      const stats = {
        total: classifiedRows.length,
        newCount: classifiedRows.filter((r) => r.classification === "new")
          .length,
        updated: classifiedRows.filter((r) => r.classification === "update")
          .length,
        issues: classifiedRows.filter((r) => r.classification === "error")
          .length,
      };

      // ------------------------------------------------------
      // Navigate to group review
      // ------------------------------------------------------

      navigate("/dashboard/add-soldier/group-review", {
        state: {
          rows: classifiedRows,
          stats,
          file_name: uploadedGroupFile.name,
          file_size: uploadedGroupFile.size,
          // رابط مؤقت للملف نفسه عشان يفضل متاح للتحميل في صفحة النجاح بعد الاعتماد
          file_url: URL.createObjectURL(uploadedGroupFile.raw),
        },
      });
    } catch (error) {
      console.error("Excel parsing error:", error);

      alert(
        "حدث خطأ أثناء قراءة ملف Excel. تأكد أن الملف بصيغة xls أو xlsx وأنه مطابق للنموذج."
      );
    } finally {
      setGroupLoading(false);
    }
  }

  // ==========================================================
  // Loading
  // ==========================================================

  if (loading) {
    return (
      <div dir="rtl" className="w-full flex items-center justify-center py-20">
        <p style={{ ...F, fontSize: 18, color: "#415844" }}>
          جاري تحميل البيانات...
        </p>
      </div>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      {/* Title */}

      <h1
        className="text-center w-full"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(24px, 4vw, 32px)",
          color: "#2d3648",
        }}
      >
        قيد قوة جديدة
      </h1>

      {/* Stepper */}

      <div className="flex justify-center">
        <Stepper />
      </div>

      {/* Registration Method */}

      <div className="flex flex-col gap-4 items-start">
        <p style={{ ...F, fontWeight: 700, fontSize: 18, color: "#2d3648" }}>
          طريقة القيد
        </p>

        <div className="flex flex-wrap gap-4">
          {(["فرد واحد", "مجموعة افراد"] as RegistrationMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={[
                "flex items-center gap-3 px-4 py-4 rounded-[12px]",
                "border transition-colors w-[200px]",
                method === m
                  ? "border-[#4bff62] bg-white"
                  : "border-[#e2e7f0] bg-white",
              ].join(" ")}
            >
              <span className="shrink-0 w-5 h-5 rounded-full border-[1.5px] border-[#344736] flex items-center justify-center">
                {method === m && (
                  <span className="w-3 h-3 rounded-full bg-gradient-to-b from-[#00b867] to-[#00522e]" />
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

      {/* ====================================================
          Individual
      ==================================================== */}

      {method === "فرد واحد" && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full">
            <div className="flex flex-col gap-6 px-6 py-5">
              <div className="flex items-center justify-start gap-3 pb-3 border-b border-[#cbd2e0]">
                <span style={{ ...F, fontSize: 18, color: "#4a5468" }}>
                  البيانات الأساسية
                </span>
              </div>

              <div className="flex flex-col gap-3 items-start">
                <SubHeader>فئة الفرد</SubHeader>

                <CategoryToggle
                  value={category}
                  onChange={handleCategoryChange}
                />

                {errors.category && (
                  <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>
                    {errors.category}
                  </p>
                )}
              </div>

              <SubHeader>البيانات التعريفية</SubHeader>

              <div className="flex flex-col sm:flex-row gap-4">
                <FieldGroup label="الرقم العسكري">
                  <FormInput
                    placeholder="ادخل الرقم العسكري"
                    value={milId}
                    onChange={(v) => {
                      setMilId(v);

                      setErrors((prev) => ({ ...prev, milId: "" }));
                    }}
                    error={errors.milId}
                  />
                </FieldGroup>

                <FieldGroup label="الدرجة">
                  <FormDropdown
                    placeholder={
                      category === "مجند" ? "جندي فقط" : "اختيار الدرجة"
                    }
                    options={rankOptions}
                    value={rank}
                    onChange={(v) => {
                      setRank(v);

                      setErrors((prev) => ({ ...prev, rank: "" }));
                    }}
                    error={errors.rank}
                  />

                  {category === "مجند" && rankOptions.length === 0 && (
                    <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>
                      لا توجد درجة جندي نشطة في جدول ranks
                    </p>
                  )}
                </FieldGroup>

                <FieldGroup label="الاسم">
                  <FormInput
                    placeholder="اسم الفرد"
                    value={name}
                    onChange={(v) => {
                      setName(v);

                      setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    error={errors.name}
                  />
                </FieldGroup>
              </div>

              {category === "مجند" && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <FieldGroup label="تاريخ التسريح" labelColor="#415844">
                    <DateInput
                      value={discharge}
                      onChange={(v) => {
                        setDischarge(v);

                        setErrors((prev) => ({ ...prev, discharge: "" }));
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
                <FieldGroup label="الوحدة الأساسية">
                  <FormDropdown
                    placeholder="اختار الوحدة"
                    options={mainUnitOptions}
                    value={unit}
                    onChange={(v) => {
                      setUnit(v);

                      setErrors((prev) => ({ ...prev, unit: "" }));
                    }}
                    error={errors.unit}
                  />
                </FieldGroup>

                <FieldGroup label="موقف الفرد">
                  <FormDropdown
                    placeholder="اختر الموقف"
                    options={statusOptions}
                    value={status}
                    onChange={handleStatusChange}
                    error={errors.status}
                  />
                </FieldGroup>

                <FieldGroup label="جهة الإلحاق">
                  <FormDropdown
                    placeholder={
                      isAttachmentEnabled ? "اختر الوحدة" : "غير متاح"
                    }
                    options={attachmentUnitOptions}
                    value={isAttachmentEnabled ? attachment : ""}
                    disabled={!isAttachmentEnabled}
                    onChange={(v) => {
                      setAttachment(v);

                      setErrors((prev) => ({ ...prev, attachment: "" }));
                    }}
                    error={isAttachmentEnabled ? errors.attachment : undefined}
                  />
                </FieldGroup>
              </div>

              {!isAttachmentEnabled && status && (
                <div className="bg-[#f5f8f5] border border-[#dce8dd] rounded-[10px] px-4 py-3">
                  <p style={{ ...F, fontSize: 13, color: "#415844" }}>
                    جهة الإلحاق غير متاحة لهذا الموقف، وسيتم حفظ
                    attachment_unit_id بقيمة NULL.
                  </p>
                </div>
              )}

              {category === "متطوع" && (
                <div className="bg-[#f5f8f5] border border-[#dce8dd] rounded-[10px] px-4 py-3">
                  <p style={{ ...F, fontSize: 13, color: "#415844" }}>
                    الأفراد من فئة متطوع سيتم حفظ تاريخ التسريح لهم بقيمة NULL.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className={[
                    "h-[44px] px-6 rounded-[8px]",
                    "flex items-center justify-center",
                    "transition-opacity",
                    saving ? "opacity-50 cursor-not-allowed" : "hover:opacity-90",
                  ].join(" ")}
                  style={{
                    background: "linear-gradient(to bottom, #00b867, #00522e)",
                  }}
                >
                  <span style={{ ...F, fontSize: 16, color: "white" }}>
                    {saving ? "جاري التجهيز..." : "المراجعة والضم"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ====================================================
          Group
      ==================================================== */}

      {method === "مجموعة افراد" && (
        <GroupUploadSection
          uploadedFile={uploadedGroupFile}
          setUploadedFile={setUploadedGroupFile}
          loading={groupLoading}
          onSubmit={handleGroupSubmit}
        />
      )}
    </div>
  );
}
