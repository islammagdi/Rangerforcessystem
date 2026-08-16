import { useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate } from "react-router";
import {
  Trash2,
  Pencil,
  AlertTriangle,
  Users,
  X,
  CalendarDays,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/logActivity";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

const PERSONNEL_TABLE_NAME = "personnel";
async function getCurrentUserInfo(): Promise<{
  userId: string | null;
  userName: string;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, userName: "غير معروف" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    userName: profile?.username ?? "غير معروف",
  };
}
/* =========================================================
   Types
========================================================= */

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

type RowClassification = "new" | "update" | "error";

interface ClassifiedPersonnelRow {
  military_number: string;
  rank_name: string;
  full_name: string;
  personnel_category_name: string;
  primary_unit_name: string;
  service_status_name: string;
  discharge_date: string | null;
  attachment_unit_name: string;

  row_number: number;

  classification: RowClassification;
  errors: string[];

  rank_id: string | null;
  personnel_category_id: string | null;
  primary_unit_id: string | null;
  service_status_id: string | null;
  attachment_unit_id: string | null;
}

interface ReviewRow extends ClassifiedPersonnelRow {
  id: number;
  checked: boolean;
}

interface GroupReviewStats {
  total: number;
  newCount: number;
  updated: number;
  issues: number;
}

interface GroupReviewLocationState {
  rows: ClassifiedPersonnelRow[];
  stats: GroupReviewStats;
  file_name: string;
  file_size: string;
  file_url?: string;
}

/* =========================================================
   Helpers
========================================================= */

const ERROR_MESSAGES = {
  UNIT_OR_ATTACHMENT: "الوحده/مكان الالحاق خطأ",
  RANK_OR_CATEGORY: "خطأ بالدرجه او فئه الفرد",
  MISSING_DISCHARGE_DATE: "تاريخ تسريح فارغ",
} as const;

function isSoldierRankName(name?: string | null): boolean {
  const n = (name ?? "").trim();

  return n === "جندي" || n === "جندى";
}

function isConscriptCategoryRecord(
  category?: PersonnelCategory | null
): boolean {
  if (!category) return false;

  const code = category.code?.trim().toUpperCase() ?? "";

  return (
    category.name?.trim() === "مجند" ||
    code === "CONSCRIPT" ||
    code === "SOLDIER"
  );
}

function isAttachedStatusRecord(
  status?: ServiceStatus | null
): boolean {
  if (!status) return false;

  const code = status.code?.trim().toUpperCase() ?? "";
  const name = status.name?.trim() ?? "";

  return (
    code === "ATTACHED" ||
    name === "ملحق" ||
    name === "ملحق علي القوة"
  );
}

function isUnitForceStatusRecord(
  status?: ServiceStatus | null
): boolean {
  if (!status) return false;

  const code = status.code?.trim().toUpperCase() ?? "";
  const name = status.name?.trim() ?? "";

  return (
    code === "UNIT_FORCE" ||
    name === "قوة الوحدة" ||
    name === "قوه الوحده"
  );
}

/* =========================================================
   Badge
========================================================= */

type BadgeVariant = "success" | "info" | "error";

/* FIX: Record syntax */
const BADGE_VARIANT_STYLES: Record<
  BadgeVariant,
  {
    bg: string;
    dot: string;
    textColor: string;
  }
> = {
  success: {
    bg: "#ebfaea",
    dot: "#35C128",
    textColor: "#26861d",
  },

  info: {
    bg: "#e9f9ff",
    dot: "#29BBD4",
    textColor: "#146d7c",
  },

  error: {
    bg: "#fce8f1",
    dot: "#E3282C",
    textColor: "#be192a",
  },
};

function StatusBadge({
  variant,
  label,
  tooltip,
}: {
  variant: BadgeVariant;
  label: string;
  tooltip?: string;
}) {
  const style = BADGE_VARIANT_STYLES[variant];

  return (
    <span
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-[16px] w-fit max-w-[220px]"
      style={{
        background: style.bg,
      }}
      title={tooltip}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{
          background: style.dot,
        }}
      />

      <span
        style={{
          ...F,
          fontWeight: 700,
          fontSize: 12,
          color: style.textColor,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
    </span>
  );
}

/* =========================================================
   Row validation
========================================================= */

function computeRowIssues(
  row: ReviewRow,
  refs: {
    ranks: Rank[];
    units: Unit[];
    statuses: ServiceStatus[];
    categories: PersonnelCategory[];
  }
): string[] {
  const issues = new Set<string>();

  const category = refs.categories.find(
    (c) => c.id === row.personnel_category_id
  );

  const rank = refs.ranks.find(
    (r) => r.id === row.rank_id
  );

  const status = refs.statuses.find(
    (s) => s.id === row.service_status_id
  );

  const isConscript = category
    ? isConscriptCategoryRecord(category)
    : row.personnel_category_name?.trim() === "مجند";

  const rankIsSoldier = rank
    ? isSoldierRankName(rank.name) ||
      rank.code?.trim().toUpperCase() === "SOLDIER"
    : isSoldierRankName(row.rank_name);

  const isAttached = status
    ? isAttachedStatusRecord(status)
    : ["ملحق", "ملحق علي القوة"].includes(
        row.service_status_name?.trim() ?? ""
      );

  const isUnitForce = status
    ? isUnitForceStatusRecord(status)
    : ["قوة الوحدة", "قوه الوحده"].includes(
        row.service_status_name?.trim() ?? ""
      );

  /*
   * 1- الوحدة الأساسية لازم تكون موجودة
   */
  if (!row.primary_unit_id) {
    issues.add(ERROR_MESSAGES.UNIT_OR_ATTACHMENT);
  }

  /*
   * 2- لو الحالة ملحق لازم يكون فيه جهة إلحاق
   */
  if (isAttached && !row.attachment_unit_id) {
    issues.add(ERROR_MESSAGES.UNIT_OR_ATTACHMENT);
  }

  /*
   * 3- لو الحالة قوة الوحدة ممنوع جهة إلحاق
   */
  if (isUnitForce && row.attachment_unit_id) {
    issues.add(ERROR_MESSAGES.UNIT_OR_ATTACHMENT);
  }

  /*
   * 4- الدرجة والفئة
   */
  if (!row.rank_id || !row.personnel_category_id) {
    issues.add(ERROR_MESSAGES.RANK_OR_CATEGORY);
  } else {
    if (isConscript && !rankIsSoldier) {
      issues.add(ERROR_MESSAGES.RANK_OR_CATEGORY);
    }

    if (!isConscript && rankIsSoldier) {
      issues.add(ERROR_MESSAGES.RANK_OR_CATEGORY);
    }
  }

  /*
   * 5- المجند لازم يكون له تاريخ تسريح
   */
  if (isConscript && !row.discharge_date) {
    issues.add(ERROR_MESSAGES.MISSING_DISCHARGE_DATE);
  }

  return Array.from(issues);
}

/* =========================================================
   Badge info
========================================================= */

function getBadgeInfo(
  row: ReviewRow
): {
  variant: BadgeVariant;
  label: string;
  tooltip?: string;
} {
  if (row.classification === "new") {
    return {
      variant: "success",
      label: "بيان جديد",
    };
  }

  if (row.classification === "update") {
    return {
      variant: "info",
      label: "تحديث",
    };
  }

  const messages =
    row.errors.length > 0
      ? row.errors
      : ["خطأ بالبيانات"];

  return {
    variant: "error",
    label: messages[0],
    tooltip: messages.join("\n"),
  };
}

function classificationToBg(
  classification: RowClassification
): string | undefined {
  if (classification === "update") {
    return "#e9f9ff";
  }

  if (classification === "error") {
    return "#fce8f1";
  }

  return undefined;
}

function buildReviewRows(
  source: ClassifiedPersonnelRow[]
): ReviewRow[] {
  return source.map((row, index) => ({
    ...row,
    id: index + 1,
    checked: row.classification !== "error",
  }));
}

function formatDisplayDate(
  value: string | null
): string {
  if (!value) return "لا يوجد";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/* =========================================================
   Stepper
========================================================= */

function GreenCheckCircle({
  id,
}: {
  id: string;
}) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
    >
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

function StepDots({
  color = "#A1AEBE",
}: {
  color?: string;
}) {
  return (
    <div className="flex items-center gap-[3px] mx-3 mt-[15px]">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] h-[3px] rounded-full shrink-0"
          style={{
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}

function Stepper() {
  return (
    <div
      className="flex items-start justify-center"
      dir="rtl"
    >
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

      <StepDots color="#2d3648" />

      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#415844] bg-white">
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#415844",
            }}
          >
            02
          </span>
        </div>

        <span
          style={{
            ...F,
            fontSize: 14,
            color: "#415844",
            whiteSpace: "nowrap",
          }}
        >
          المراجعة
        </span>
      </div>

      <StepDots color="#A1AEBE" />

      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#a1aebe] bg-white">
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#2d3648",
            }}
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
    </div>
  );
}

/* =========================================================
   Stats
========================================================= */

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
      style={{
        background: bg,
      }}
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

        <div className="shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

function RedXIcon() {
  return (
    <div
      className="w-[30px] h-[30px] rounded-full flex items-center justify-center"
      style={{
        background: "#E3282C",
      }}
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

function CyanRefreshIcon() {
  return (
    <div
      className="w-[30px] h-[30px] rounded-full flex items-center justify-center"
      style={{
        background: "#29BBD4",
      }}
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

function GroupIcon() {
  return (
    <div className="w-[30px] h-[30px] flex items-center justify-center">
      <Users
        size={26}
        className="text-[#2d3648]"
      />
    </div>
  );
}

/* =========================================================
   Modal inputs
========================================================= */

function ModalInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <label
        className="block text-right px-1"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: 14,
          color: "#2d3648",
        }}
      >
        {label}
      </label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        dir="rtl"
        className="w-full h-[46px] bg-white border border-[#e2e7f0] rounded-[8px] px-3 text-right outline-none focus:border-[#415844]"
        style={{
          ...F,
          fontSize: 15,
          color: "#4a5468",
        }}
      />
    </div>
  );
}

function ModalDropdown({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <label
        className="block text-right px-1"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: 14,
          color: "#2d3648",
        }}
      >
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          dir="rtl"
          className={[
            "w-full h-[46px] appearance-none bg-white border rounded-[8px]",
            "px-3 pl-9 outline-none transition-colors border-[#e2e7f0]",
            disabled
              ? "bg-[#f3f4f6] cursor-not-allowed opacity-60"
              : "cursor-pointer focus:border-[#415844]",
          ].join(" ")}
          style={{
            ...F,
            fontSize: 15,
            color: value ? "#4a5468" : "#a0abc0",
          }}
        >
          <option value="">
            {placeholder}
          </option>

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#415844]">
          ▼
        </span>
      </div>
    </div>
  );
}

function ModalDateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <label
        className="block text-right px-1"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: 14,
          color: "#2d3648",
        }}
      >
        {label}
      </label>

      <div className="relative">
        <CalendarDays
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-[#415844]"
        />

        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-[46px] bg-white border border-[#e2e7f0] rounded-[8px] pr-9 pl-3 outline-none focus:border-[#415844]"
          style={{
            ...F,
            fontSize: 15,
            color: value ? "#4a5468" : "#a0abc0",
            direction: "ltr",
            textAlign: "right",
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   Edit Modal
========================================================= */

function EditSoldierModal({
  row,
  ranks,
  units,
  statuses,
  categories,
  otherMilitaryNumbers,
  onClose,
  onSave,
}: {
  row: ReviewRow;
  ranks: Rank[];
  units: Unit[];
  statuses: ServiceStatus[];
  categories: PersonnelCategory[];
  otherMilitaryNumbers: string[];
  onClose: () => void;
  onSave: (updated: ReviewRow) => void;
}) {
  const [milId, setMilId] = useState(
    row.military_number
  );

  const [fullName, setFullName] = useState(
    row.full_name
  );

  const [categoryId, setCategoryId] = useState(
    row.personnel_category_id ?? ""
  );

  const [rankId, setRankId] = useState(
    row.rank_id ?? ""
  );

  const [unitId, setUnitId] = useState(
    row.primary_unit_id ?? ""
  );

  const [statusId, setStatusId] = useState(
    row.service_status_id ?? ""
  );

  const [attachmentId, setAttachmentId] = useState(
    row.attachment_unit_id ?? ""
  );

  const [discharge, setDischarge] = useState(
    row.discharge_date ?? ""
  );

  const [formErrors, setFormErrors] =
    useState<string[]>([]);

  const [saving, setSaving] = useState(false);

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [categories]
  );

  const selectedCategory = categories.find(
    (c) => c.id === categoryId
  );

  const isConscriptCategory =
    !!selectedCategory &&
    isConscriptCategoryRecord(selectedCategory);

  const rankOptions = useMemo(() => {
    return ranks
      .filter((r) => {
        const soldier =
          isSoldierRankName(r.name) ||
          r.code?.trim().toUpperCase() === "SOLDIER";

        if (isConscriptCategory) {
          return soldier;
        }

        return !soldier;
      })
      .map((r) => ({
        value: r.id,
        label: r.name,
      }));
  }, [ranks, isConscriptCategory]);

  const mainUnitOptions = useMemo(
    () =>
      units
        .filter(
          (u) =>
            u.unit_type?.trim().toUpperCase() ===
            "MAIN"
        )
        .map((u) => ({
          value: u.id,
          label: u.name,
        })),
    [units]
  );

  const attachmentUnitOptions = useMemo(
    () =>
      units.map((u) => ({
        value: u.id,
        label: u.name,
      })),
    [units]
  );

  const statusOptions = useMemo(
    () =>
      statuses.map((s) => ({
        value: s.id,
        label: s.name,
      })),
    [statuses]
  );

  const selectedStatus = statuses.find(
    (s) => s.id === statusId
  );

  const isAttachmentEnabled =
    isAttachedStatusRecord(selectedStatus);

  async function handleSave() {
    const errors: string[] = [];

    const trimmedMilId = milId.trim();
    const trimmedName = fullName.trim();

    if (!trimmedMilId) {
      errors.push("الرقم العسكري مطلوب");
    }

    if (!trimmedName) {
      errors.push("الاسم مطلوب");
    }

    if (!categoryId) {
      errors.push("فئة الفرد مطلوبة");
    }

    if (!rankId) {
      errors.push("الدرجة مطلوبة");
    }

    if (!unitId) {
      errors.push("الوحدة الأساسية مطلوبة");
    }

    if (!statusId) {
      errors.push("الموقف الخدمي مطلوب");
    }

    if (
      trimmedMilId &&
      otherMilitaryNumbers.includes(trimmedMilId)
    ) {
      errors.push(
        "الرقم العسكري مكرر مع فرد آخر في نفس الكشف"
      );
    }

    const rankRecord = ranks.find(
      (r) => r.id === rankId
    );

    const categoryRecord = categories.find(
      (c) => c.id === categoryId
    );

    const unitRecord = units.find(
      (u) => u.id === unitId
    );

    const statusRecord = statuses.find(
      (s) => s.id === statusId
    );

    const attachmentRecord = units.find(
      (u) => u.id === attachmentId
    );

    if (rankRecord && categoryRecord) {
      const soldierRank =
        isSoldierRankName(rankRecord.name) ||
        rankRecord.code?.trim().toUpperCase() ===
          "SOLDIER";

      if (
        isConscriptCategory &&
        !soldierRank
      ) {
        errors.push(
          ERROR_MESSAGES.RANK_OR_CATEGORY
        );
      }

      if (
        !isConscriptCategory &&
        soldierRank
      ) {
        errors.push(
          ERROR_MESSAGES.RANK_OR_CATEGORY
        );
      }
    }

    if (
      isConscriptCategory &&
      !discharge
    ) {
      errors.push(
        ERROR_MESSAGES.MISSING_DISCHARGE_DATE
      );
    }

    const requiresAttachment =
      isAttachedStatusRecord(statusRecord);

    const mustBeEmptyAttachment =
      isUnitForceStatusRecord(statusRecord);

    if (
      requiresAttachment &&
      !attachmentId
    ) {
      errors.push(
        ERROR_MESSAGES.UNIT_OR_ATTACHMENT
      );
    }

    if (
      mustBeEmptyAttachment &&
      attachmentId
    ) {
      errors.push(
        ERROR_MESSAGES.UNIT_OR_ATTACHMENT
      );
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors([]);
    setSaving(true);

    try {
      const { data, error } =
        await supabase
          .from(PERSONNEL_TABLE_NAME)
          .select("military_number")
          .eq(
            "military_number",
            trimmedMilId
          )
          .maybeSingle();

      if (error) {
        throw error;
      }

      const classification: RowClassification =
        data ? "update" : "new";

      onSave({
        ...row,

        military_number: trimmedMilId,

        full_name: trimmedName,

        personnel_category_name:
          categoryRecord?.name ?? "",

        personnel_category_id:
          categoryId,

        rank_name:
          rankRecord?.name ?? "",

        rank_id:
          rankId,

        primary_unit_name:
          unitRecord?.name ?? "",

        primary_unit_id:
          unitId,

        service_status_name:
          statusRecord?.name ?? "",

        service_status_id:
          statusId,

        attachment_unit_name:
          requiresAttachment
            ? attachmentRecord?.name ?? ""
            : "",

        attachment_unit_id:
          requiresAttachment
            ? attachmentId || null
            : null,

        discharge_date:
          isConscriptCategory
            ? discharge || null
            : null,

        classification,

        errors: [],

        checked: true,
      });
    } catch (error: any) {
      console.error(
        "Error checking military number:",
        error
      );

      alert(
        `حدث خطأ أثناء التحقق من الرقم العسكري في قاعدة البيانات${
          error?.message
            ? `\n\nتفاصيل الخطأ: ${error.message}`
            : ""
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div
        dir="rtl"
        className="bg-white rounded-[20px] shadow-2xl w-full max-w-[720px] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eff0f6]">
          <p
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 18,
              color: "#2d3648",
            }}
          >
            تعديل بيانات الفرد
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f5f5f5]"
          >
            <X
              size={18}
              className="text-[#717d96]"
            />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          {row.errors.length > 0 && (
            <div className="bg-[#fce8f1] border border-[#f4b5ae] rounded-[10px] px-4 py-3">
              <p
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#90132a",
                }}
              >
                الملاحظات الحالية:
              </p>

              <ul
                className="list-disc pr-5"
                style={{
                  ...F,
                  fontSize: 13,
                  color: "#90132a",
                }}
              >
                {row.errors.map(
                  (error, index) => (
                    <li key={index}>
                      {error}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {formErrors.length > 0 && (
            <div className="bg-[#fff7f0] border border-[#f4b5ae] rounded-[10px] px-4 py-3">
              <ul
                className="list-disc pr-5"
                style={{
                  ...F,
                  fontSize: 13,
                  color: "#90132a",
                }}
              >
                {formErrors.map(
                  (error, index) => (
                    <li key={index}>
                      {error}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <ModalInput
              label="الرقم العسكري"
              value={milId}
              onChange={setMilId}
            />

            <ModalInput
              label="الاسم"
              value={fullName}
              onChange={setFullName}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <ModalDropdown
              label="فئة الفرد"
              placeholder="اختر الفئة"
              options={categoryOptions}
              value={categoryId}
              onChange={(value) => {
                setCategoryId(value);
                setRankId("");
              }}
            />

            <ModalDropdown
              label="الدرجة"
              placeholder="اختر الدرجة"
              options={rankOptions}
              value={rankId}
              onChange={setRankId}
            />
          </div>

          {isConscriptCategory && (
            <div className="flex flex-col sm:flex-row gap-4">
              <ModalDateInput
                label="تاريخ التسريح"
                value={discharge}
                onChange={setDischarge}
              />

              <div className="flex-1 hidden sm:block" />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <ModalDropdown
              label="الوحدة الأساسية"
              placeholder="اختر الوحدة"
              options={mainUnitOptions}
              value={unitId}
              onChange={setUnitId}
            />

            <ModalDropdown
              label="الموقف الخدمي"
              placeholder="اختر الموقف"
              options={statusOptions}
              value={statusId}
              onChange={(value) => {
                setStatusId(value);

                /*
                 * لو الحالة الجديدة ليست ملحق
                 * نمسح جهة الإلحاق.
                 */
                const newStatus =
                  statuses.find(
                    (s) => s.id === value
                  );

                if (
                  !isAttachedStatusRecord(
                    newStatus
                  )
                ) {
                  setAttachmentId("");
                }
              }}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <ModalDropdown
              label="جهة الإلحاق"
              placeholder={
                isAttachmentEnabled
                  ? "اختر الوحدة"
                  : "غير متاح"
              }
              options={
                attachmentUnitOptions
              }
              value={
                isAttachmentEnabled
                  ? attachmentId
                  : ""
              }
              disabled={
                !isAttachmentEnabled
              }
              onChange={setAttachmentId}
            />

            <div className="flex-1 hidden sm:block" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#eff0f6]">
          <button
            type="button"
            onClick={onClose}
            className="h-[42px] px-5 rounded-[8px] border border-[#e2e7f0] hover:bg-[#f7f9fc]"
          >
            <span
              style={{
                ...F,
                fontSize: 15,
                color: "#4a5468",
              }}
            >
              إلغاء
            </span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-[42px] px-6 rounded-[8px] disabled:opacity-50"
            style={{
              background:
                "linear-gradient(to bottom, #00b867, #00522e)",
            }}
          >
            <span
              style={{
                ...F,
                fontSize: 15,
                color: "white",
              }}
            >
              {saving
                ? "جاري الحفظ..."
                : "حفظ التعديلات"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Table
========================================================= */

const HEADERS = [
  "رقم عسكري",
  "درجة",
  "اسم",
  "نوع الخدمة",
  "الوحدة",
  "حاله الفرد",
  "مكان الالحاق",
  "تاريخ التسريح",
  "حالة الفرد",
  "الاجراء",
];

function SortIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
    >
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
      className="w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0"
      style={{
        borderColor: checked
          ? "#415844"
          : "#cbd2e0",
        background: checked
          ? "#415844"
          : "white",
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
      <button
        type="button"
        onClick={onDelete}
        className="p-1 rounded-[4px] bg-[#fce8f1] hover:bg-[#f5c6d8]"
        title="حذف"
      >
        <Trash2
          size={13}
          className="text-[#E3282C]"
        />
      </button>

      <button
        type="button"
        onClick={onEdit}
        className="p-1 rounded-[4px] bg-[#f5f5f5] hover:bg-[#e8e8e8]"
        title="تعديل"
      >
        <Pencil
          size={13}
          className="text-[#2d3648]"
        />
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
  rows: ReviewRow[];
  onCheck: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-b-[12px]">
      <table
        className="w-full min-w-[1000px] border-collapse"
        dir="rtl"
      >
        <thead>
          <tr className="bg-white border-b-2 border-[#d4d8fa]">
            <th className="px-4 py-3 w-12">
              <span className="sr-only">
                تحديد
              </span>
            </th>

            {HEADERS.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-right"
              >
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
                    {header}
                  </span>

                  <SortIcon />
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const badge =
              getBadgeInfo(row);

            return (
              <tr
                key={row.id}
                style={{
                  background:
                    classificationToBg(
                      row.classification
                    ) ?? "white",
                }}
                className="border-b border-[#eaecf0]"
              >
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <CheckboxCell
                      checked={row.checked}
                      onChange={() =>
                        onCheck(row.id)
                      }
                    />
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.military_number ||
                      "—"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                    }}
                  >
                    {row.rank_name || "—"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.full_name || "—"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                    }}
                  >
                    {row.personnel_category_name ||
                      "—"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.primary_unit_name ||
                      "—"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.service_status_name ||
                      "—"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.attachment_unit_name ||
                      "لا يوجد"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDisplayDate(
                      row.discharge_date
                    )}
                  </span>
                </td>

                <td className="px-4 pb-3 pt-[11px]">
                  <StatusBadge
                    variant={badge.variant}
                    label={badge.label}
                    tooltip={badge.tooltip}
                  />
                </td>

                <td className="px-4 py-3">
                  <ActionIcons
                    onDelete={() =>
                      onDelete(row.id)
                    }
                    onEdit={() =>
                      onEdit(row.id)
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   Loading
========================================================= */

function GroupLoadingOverlay() {
  return (
    <>
      <style>{`
        @keyframes grp-bounce {
          0%, 80%, 100% {
            transform: translateY(0);
          }

          40% {
            transform: translateY(-18px);
          }
        }

        .grp-dot {
          animation:
            grp-bounce 1.2s ease-in-out infinite;
        }

        .grp-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .grp-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-[24px] shadow-2xl flex flex-col items-center justify-center py-16 px-12 w-[480px] max-w-[90vw]">
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
            >
              يتم قيد الافراد الجدد الان
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   Main Page
========================================================= */

export function GroupReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state =
    location.state as
      | GroupReviewLocationState
      | undefined;

  const [rows, setRows] =
    useState<ReviewRow[]>(() =>
      buildReviewRows(
        state?.rows ?? []
      )
    );

  const [loading, setLoading] =
    useState(false);

  const [ranks, setRanks] =
    useState<Rank[]>([]);

  const [units, setUnits] =
    useState<Unit[]>([]);

  const [statuses, setStatuses] =
    useState<ServiceStatus[]>([]);

  const [categories, setCategories] =
    useState<PersonnelCategory[]>([]);

  const [referenceLoading, setReferenceLoading] =
    useState(true);

  const [editingRowId, setEditingRowId] =
    useState<number | null>(null);

  /* =======================================================
     Load references
  ======================================================= */

  useEffect(() => {
    loadReferenceData();
  }, []);

  async function loadReferenceData() {
    try {
      setReferenceLoading(true);

      const [
        ranksResult,
        unitsResult,
        statusesResult,
        categoriesResult,
      ] = await Promise.all([
        supabase
          .from("ranks")
          .select(
            "id,name,code,sort_order,is_active"
          )
          .eq("is_active", true)
          .order("sort_order", {
            ascending: true,
          }),

        supabase
          .from("units")
          .select(
            "id,name,code,unit_type,parent_unit_id,is_active"
          )
          .eq("is_active", true)
          .order("name", {
            ascending: true,
          }),

        supabase
          .from("service_statuses")
          .select(
            "id,name,code,is_active"
          )
          .eq("is_active", true)
          .order("name", {
            ascending: true,
          }),

        supabase
          .from("personnel_categories")
          .select(
            "id,name,code,is_active"
          )
          .eq("is_active", true)
          .order("name", {
            ascending: true,
          }),
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

      setRanks(
        ranksResult.data ?? []
      );

      setUnits(
        unitsResult.data ?? []
      );

      setStatuses(
        statusesResult.data ?? []
      );

      setCategories(
        categoriesResult.data ?? []
      );
    } catch (error) {
      console.error(
        "Error loading reference data:",
        error
      );

      alert(
        "حدث خطأ أثناء تحميل البيانات المرجعية"
      );
    } finally {
      setReferenceLoading(false);
    }
  }

  /* =======================================================
     Direct access protection
  ======================================================= */

  useEffect(() => {
    if (!state?.rows?.length) {
      navigate(
        "/dashboard/add-soldier"
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     Recalculate errors
  ======================================================= */

  useEffect(() => {
    if (referenceLoading) return;

    setRows((previousRows) =>
      previousRows.map((row) => {
        const issues =
          computeRowIssues(row, {
            ranks,
            units,
            statuses,
            categories,
          });

        if (issues.length > 0) {
          return {
            ...row,
            classification: "error",
            errors: issues,
            checked: false,
          };
        }

        if (
          row.classification ===
          "error"
        ) {
          return {
            ...row,
            classification: "new",
            errors: [],
            checked: true,
          };
        }

        return {
          ...row,
          errors: [],
        };
      })
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    referenceLoading,
    ranks,
    units,
    statuses,
    categories,
  ]);

  /* =======================================================
     Row actions
  ======================================================= */

  function toggleCheck(id: number) {
    setRows((previousRows) =>
      previousRows.map((row) =>
        row.id === id
          ? {
              ...row,
              checked: !row.checked,
            }
          : row
      )
    );
  }

  function deleteRow(id: number) {
    setRows((previousRows) =>
      previousRows.filter(
        (row) => row.id !== id
      )
    );
  }

  function handleEditClick(id: number) {
    if (referenceLoading) {
      alert(
        "جاري تحميل البيانات، برجاء الانتظار"
      );

      return;
    }

    setEditingRowId(id);
  }

  function handleSaveEdit(
    updated: ReviewRow
  ) {
    setRows((previousRows) =>
      previousRows.map((row) =>
        row.id === updated.id
          ? updated
          : row
      )
    );

    setEditingRowId(null);
  }

  /* =======================================================
     Stats
  ======================================================= */

  const stats: GroupReviewStats =
    useMemo(
      () => ({
        total: rows.length,

        newCount: rows.filter(
          (r) =>
            r.classification ===
            "new"
        ).length,

        updated: rows.filter(
          (r) =>
            r.classification ===
            "update"
        ).length,

        issues: rows.filter(
          (r) =>
            r.classification ===
            "error"
        ).length,
      }),
      [rows]
    );

  const hasErrors = rows.some(
    (r) =>
      r.classification ===
      "error"
  );

  const editingRow =
    rows.find(
      (r) =>
        r.id === editingRowId
    ) ?? null;

  /* =======================================================
     Save
  ======================================================= */

  function isConscriptCategoryId(
    categoryId: string | null
  ) {
    if (!categoryId) return false;

    const category =
      categories.find(
        (c) => c.id === categoryId
      );

    return isConscriptCategoryRecord(
      category
    );
  }

  function requiresAttachmentForStatusId(
    statusId: string | null
  ) {
    if (!statusId) return false;

    const status =
      statuses.find(
        (s) => s.id === statusId
      );

    return isAttachedStatusRecord(
      status
    );
  }

  async function handleApprove() {
    if (hasErrors || loading) {
      return;
    }

    const approvedRows =
      rows.filter(
        (row) => row.checked
      );

    if (
      approvedRows.length === 0
    ) {
      alert(
        "لم يتم تحديد أي فرد للاعتماد"
      );

      return;
    }

    setLoading(true);

    try {
      const payload =
        approvedRows.map((row) => {
          const conscript =
            isConscriptCategoryId(
              row.personnel_category_id
            );

          const needsAttachment =
            requiresAttachmentForStatusId(
              row.service_status_id
            );

          return {
            military_number:
              row.military_number,

            full_name:
              row.full_name,

            rank_id:
              row.rank_id,

            personnel_category_id:
              row.personnel_category_id,

            service_status_id:
              row.service_status_id,

            primary_unit_id:
              row.primary_unit_id,

            attachment_unit_id:
              needsAttachment
                ? row.attachment_unit_id
                : null,

            discharge_date:
              conscript
                ? row.discharge_date
                : null,

            is_active: true,
          };
        });

  const { data: savedPersonnel, error } =
  await supabase
    .from(
      PERSONNEL_TABLE_NAME
    )
    .upsert(payload, {
      onConflict:
        "military_number",
    })
    .select("id, military_number");

if (error) {
  throw error;
}
const { userId, userName } = await getCurrentUserInfo();

const newCount = approvedRows.filter(
  (r) => r.classification === "new"
).length;

const updatedCount = approvedRows.filter(
  (r) => r.classification === "update"
).length;

await logActivity({
  userId,
  userName,
  actionType: "CREATE",
  action: "قيد قوة جديدة (كشف جماعي)",
  entity: "personnel",
  details: JSON.stringify({
    fileName: state?.file_name ?? "",
    resultsCount: approvedRows.length,
    newCount,
    updatedCount,
    personnel: (savedPersonnel ?? []).map((p) => ({
      id: p.id,
      militaryNumber: p.military_number,
    })),
  }),
});

navigate(
  "/dashboard/add-soldier/group-success",
  {
          state: {
            stats: {
              total:
                approvedRows.length,

              newCount:
                approvedRows.filter(
                  (r) =>
                    r.classification ===
                    "new"
                ).length,

              updated:
                approvedRows.filter(
                  (r) =>
                    r.classification ===
                    "update"
                ).length,
            },

            file_name:
              state?.file_name ?? "",

            file_size:
              state?.file_size ?? "",

            file_url:
              state?.file_url,

            approved_at:
              new Date().toISOString(),
          },
        }
      );
    } catch (error: any) {
      console.error(
        "Error saving personnel:",
        error
      );

      alert(
        `حدث خطأ أثناء حفظ بيانات الأفراد${
          error?.message
            ? `\n\n${error.message}`
            : ""
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div
      className="flex flex-col gap-6 w-full"
      dir="rtl"
    >
      {loading && (
        <GroupLoadingOverlay />
      )}

      {editingRow && (
        <EditSoldierModal
          row={editingRow}
          ranks={ranks}
          units={units}
          statuses={statuses}
          categories={categories}
          otherMilitaryNumbers={rows
            .filter(
              (r) =>
                r.id !==
                editingRow.id
            )
            .map(
              (r) =>
                r.military_number
            )
            .filter(Boolean)}
          onClose={() =>
            setEditingRowId(null)
          }
          onSave={handleSaveEdit}
        />
      )}

      <h1
        className="text-center w-full"
        style={{
          ...F,
          fontWeight: 700,
          fontSize:
            "clamp(24px, 4vw, 32px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        قيد قوة جديدة
      </h1>

      <div className="flex justify-center">
        <Stepper />
      </div>

      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
        <div className="flex flex-col gap-5 px-6 py-5">
          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <p
                className="text-right"
                style={{
                  ...F,
                  fontSize: 18,
                  color: "#2d3648",
                }}
              >
                مراجعة الكشف قبل الاعتماد
              </p>

              {state?.file_name && (
                <p
                  style={{
                    ...F,
                    fontSize: 13,
                    color: "#717d96",
                  }}
                >
                  {state.file_name} (
                  {state.file_size})
                </p>
              )}
            </div>

            <div className="w-full h-px bg-[#cbd2e0]" />
          </div>

          {hasErrors && (
            <div className="flex items-center gap-4 w-full rounded-[8px] px-4 py-3 bg-[#fff7f0] border border-[#f4b5ae]">
              <div
                className="flex items-center justify-center rounded-full p-1.5 shrink-0"
                style={{
                  background: "#f4b5ae",
                }}
              >
                <AlertTriangle
                  size={20}
                  style={{
                    color: "#E37032",
                  }}
                />
              </div>

              <div className="flex flex-col items-start flex-1 min-w-0">
                <p
                  style={{
                    ...F,
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#2d3648",
                  }}
                >
                  تحذير !
                </p>

                <p
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#4a5468",
                  }}
                >
                  يرجى تصحيح الملاحظات الواردة
                  ببيانات بعض الأفراد لاستكمال
                  إجراءات الاعتماد والحفظ النهائي.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 w-full items-start">
            <StatCard
              count={stats.total}
              label="اجمالي الافراد بالكشف"
              bg="white"
              textColor="#2d3648"
              icon={<GroupIcon />}
            />

            <StatCard
              count={stats.newCount}
              label="أفراد جدد"
              bg="#ebfaea"
              textColor="#2d3648"
              icon={<GreenCheckIcon />}
            />

            <StatCard
              count={stats.updated}
              label="افراد يتم تحديث بياناتهم"
              bg="#e9f9ff"
              textColor="#146d7c"
              icon={<CyanRefreshIcon />}
            />

            <StatCard
              count={stats.issues}
              label="بيانات بها ملاحظات"
              bg="#fce8f1"
              textColor="#90132a"
              icon={<RedXIcon />}
            />
          </div>
        </div>

        <div className="w-full h-px bg-[#eff0f6]" />

        <SoldierTable
          rows={rows}
          onCheck={toggleCheck}
          onDelete={deleteRow}
          onEdit={handleEditClick}
        />

        <div className="flex items-center justify-end px-6 py-5 gap-3">
          {hasErrors && (
            <p
              style={{
                ...F,
                fontSize: 13,
                color: "#90132a",
              }}
            >
              يرجى تصحيح الأخطاء قبل الاعتماد
            </p>
          )}

          <button
            type="button"
            disabled={
              hasErrors || loading
            }
            onClick={handleApprove}
            className="h-[44px] px-6 rounded-[8px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
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
              اعتماد القيد
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}