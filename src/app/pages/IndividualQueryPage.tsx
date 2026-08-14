import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronDown,
  ArrowDownUp,
  Eye,
  Trash2,
  ArrowLeftRight,
  Minus,
  Search,
  RotateCcw,
} from "lucide-react";

import { logActivity } from "../../lib/logActivity";
import { DeleteConfirmDialog } from "../components/dashboard/DeleteConfirmDialog";
import { supabase } from "../../lib/supabase";

// ═════════════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════════════

function normalizeDigits(value: string): string {
  const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndex = arabicIndicDigits.indexOf(digit);

    if (arabicIndex !== -1) {
      return String(arabicIndex);
    }

    const persianIndex = persianDigits.indexOf(digit);

    if (persianIndex !== -1) {
      return String(persianIndex);
    }

    return digit;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════════════════════════════════════

type DistributionStatus =
  | "ملحق"
  | "منتهي خدمته"
  | "علي القوة";

type StatusFilter =
  | "الكل"
  | "علي القوة"
  | "ملحق";

interface RankRow {
  id: string;
  name: string | null;
  code: string | null;
}

interface UnitRow {
  id: string;
  name: string | null;
  code: string | null;
  unit_type?: string | null;
  parent_unit_id?: string | null;
  is_active?: boolean | null;
}

interface PersonnelRow {
  id: string;
  military_number: string | null;
  full_name: string | null;

  rank_id: string | null;

  personnel_category_id: string | null;
  primary_unit_id: string | null;
  attachment_unit_id: string | null;
  service_status_id: string | null;

  ranks?: RankRow | null;

  personnel_categories?: {
    id: string;
    name: string | null;
    code: string | null;
  } | null;

  primary_unit?: {
    id: string;
    name: string | null;
    code: string | null;
  } | null;

  attachment_unit?: {
    id: string;
    name: string | null;
    code: string | null;
  } | null;

  service_statuses?: {
    id: string;
    name: string | null;
    code: string | null;
  } | null;
}

interface SoldierRecord {
  id: string;

  militaryId: string;
  rank: string;
  rankId: string | null;

  name: string;

  unit: string;
  unitId: string | null;

  attachmentPlace: string;

  status: DistributionStatus;
}

// ═════════════════════════════════════════════════════════════════════════════
// Constants
// ═════════════════════════════════════════════════════════════════════════════

const QUERY_BASIS_OPTIONS = [
  "رقم عسكري",
  "الاسم",
];

const CATEGORIES = [
  { id: "all", label: "جميع الفئات" },
  { id: "conscript", label: "مجند" },
  { id: "volunteer", label: "متطوع" },
];

const STATUS_FILTER_OPTIONS: StatusFilter[] = [
  "الكل",
  "علي القوة",
  "ملحق",
];

const RANK_OPTIONS = [
  "جميع الدرجات",
  "جندى",
  "عريف",
  "رقيب",
  "رقيب اول",
  "مساعد",
  "مساعد اول",
];

const STATUS_STYLES: Record<
  DistributionStatus,
  {
    bg: string;
    text: string;
    dot: string;
  }
> = {
  ملحق: {
    bg: "#ebfaea",
    text: "#26861d",
    dot: "#35C128",
  },

  "منتهي خدمته": {
    bg: "#fce9ea",
    text: "#c5481b",
    dot: "#E37032",
  },

  "علي القوة": {
    bg: "#e9f9ff",
    text: "#146d7c",
    dot: "#29BBD4",
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// Status Helpers
// ═════════════════════════════════════════════════════════════════════════════

function normalizeStatus(
  value?: string | null
): DistributionStatus {
  if (!value) {
    return "علي القوة";
  }

  const normalized = value.trim();

  if (
    normalized === "ملحق" ||
    normalized === "قوة الوحدة" ||
    normalized === "قوة الوحده"
  ) {
    return "ملحق";
  }

  if (
    normalized === "منتهي خدمته" ||
    normalized === "منتهى خدمته"
  ) {
    return "منتهي خدمته";
  }

  return "علي القوة";
}

// ═════════════════════════════════════════════════════════════════════════════
// Personnel Mapping
// ═════════════════════════════════════════════════════════════════════════════

function mapPersonnelToRecord(
  person: PersonnelRow
): SoldierRecord {
  const rankName =
    person.ranks?.name ??
    person.ranks?.code ??
    "";

  const primaryUnitName =
    person.primary_unit?.name ??
    person.primary_unit?.code ??
    "لا يوجد";

  const attachmentUnitName =
    person.attachment_unit?.name ??
    person.attachment_unit?.code ??
    "لا يوجد";

  return {
    id: person.id,

    militaryId:
      person.military_number ?? "",

    rank: rankName,

    rankId:
      person.rank_id ?? null,

    name:
      person.full_name ?? "",

    unit: primaryUnitName,

    unitId:
      person.primary_unit_id ?? null,

    attachmentPlace:
      attachmentUnitName,

    status: normalizeStatus(
      person.service_statuses?.name ??
        person.service_statuses?.code
    ),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// Radio Card
// ═════════════════════════════════════════════════════════════════════════════

function RadioCard({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={[
        "flex items-center gap-3 px-4 py-4 rounded-[12px]",
        "border transition-colors text-right",
        "w-full sm:w-[200px] shrink-0",

        checked
          ? "border-[#4BFF62] bg-[#f0f2fd]"
          : "border-[#e2e7f0] bg-white hover:border-[#a0aec0]",
      ].join(" ")}
    >
      <span className="shrink-0 w-5 h-5 rounded-full border-[1.5px] border-[#4BFF62] flex items-center justify-center">
        {checked && (
          <span className="w-2.5 h-2.5 rounded-full bg-[#4BFF62]" />
        )}
      </span>

      <span
        style={{
          fontFamily: "'Almarai', sans-serif",
          fontSize: "18px",
          color: "#2d3648",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Dropdown
// ═════════════════════════════════════════════════════════════════════════════

function Dropdown({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-[54px] bg-white border border-[#e2e7f0] rounded-[8px] flex items-center gap-3 px-3 text-right hover:border-[#a0aec0] transition-colors"
      >
        <ChevronDown
          size={20}
          className={[
            "shrink-0 text-[#2d3648] transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        />

        <span
          className="flex-1 text-right"
          style={{
            fontFamily: "'Almarai', sans-serif",
            fontSize: "18px",
            color: "#4a5468",
          }}
        >
          {value}
        </span>
      </button>

      {open && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={[
                  "w-full text-right px-4 py-3",
                  "hover:bg-[#f5f6fb] transition-colors",

                  option === value
                    ? "bg-[#f0f2fd] text-[#168b4f]"
                    : "text-[#2d3648]",
                ].join(" ")}
                style={{
                  fontFamily: "'Almarai', sans-serif",
                  fontSize: "16px",
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Searchable Unit Dropdown
// ═════════════════════════════════════════════════════════════════════════════

function SearchableUnitDropdown({
  units,
  value,
  onChange,
}: {
  units: UnitRow[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const selectedUnit = units.find(
    (unit) => unit.id === value
  );

  const filteredUnits = useMemo(() => {
    const search = searchText
      .trim()
      .toLowerCase();

    if (!search) {
      return units;
    }

    return units.filter((unit) => {
      const name = String(
        unit.name ?? ""
      ).toLowerCase();

      const code = String(
        unit.code ?? ""
      ).toLowerCase();

      return (
        name.includes(search) ||
        code.includes(search)
      );
    });
  }, [units, searchText]);

  function selectUnit(unitId: string) {
    onChange(unitId);
    setOpen(false);
    setSearchText("");
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-[54px] bg-white border border-[#e2e7f0] rounded-[8px] flex items-center gap-3 px-3 text-right hover:border-[#a0aec0] transition-colors"
      >
        <ChevronDown
          size={20}
          className={[
            "shrink-0 text-[#2d3648]",
            open ? "rotate-180" : "",
          ].join(" ")}
        />

        <span
          className="flex-1 text-right truncate"
          style={{
            fontFamily: "'Almarai', sans-serif",
            fontSize: "16px",
            color: "#4a5468",
          }}
        >
          {selectedUnit
            ? String(
                selectedUnit.name ??
                  selectedUnit.code ??
                  "وحدة"
              )
            : "جميع الوحدات"}
        </span>
      </button>

      {open && (
        <div className="absolute z-[60] top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[#e2e7f0]">
            <div className="relative">
              <Search
                size={17}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b95a8]"
              />

              <input
                type="text"
                value={searchText}
                onChange={(e) =>
                  setSearchText(e.target.value)
                }
                placeholder="ابحث عن الوحدة..."
                className="w-full h-[42px] border border-[#e2e7f0] rounded-[7px] pr-9 pl-3 outline-none focus:border-[#4BFF62]"
                style={{
                  fontFamily: "'Almarai', sans-serif",
                  fontSize: "14px",
                }}
                dir="rtl"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[260px] overflow-y-auto">
            <button
              type="button"
              onClick={() => selectUnit("")}
              className={[
                "w-full text-right px-4 py-3",
                "hover:bg-[#f5f6fb]",
                value === ""
                  ? "bg-[#f0f2fd] text-[#168b4f]"
                  : "text-[#2d3648]",
              ].join(" ")}
              style={{
                fontFamily: "'Almarai', sans-serif",
                fontSize: "14px",
              }}
            >
              جميع الوحدات
            </button>

            {filteredUnits.map((unit) => {
              const name = String(
                unit.name ?? ""
              );

              const code = String(
                unit.code ?? ""
              );

              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() =>
                    selectUnit(unit.id)
                  }
                  className={[
                    "w-full text-right px-4 py-3",
                    "hover:bg-[#f5f6fb]",
                    value === unit.id
                      ? "bg-[#f0f2fd] text-[#168b4f]"
                      : "text-[#2d3648]",
                  ].join(" ")}
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                    fontSize: "14px",
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <span>
                      {name || "بدون اسم"}
                    </span>

                    {code && (
                      <span className="text-[11px] text-[#8b95a8]">
                        {code}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredUnits.length === 0 && (
              <div
                className="py-6 text-center text-[#8b95a8]"
                style={{
                  fontFamily:
                    "'Almarai', sans-serif",
                  fontSize: "13px",
                }}
              >
                لا توجد وحدات مطابقة
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Status Badge
// ═════════════════════════════════════════════════════════════════════════════

function StatusBadge({
  status,
}: {
  status: DistributionStatus;
}) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[16px] whitespace-nowrap"
      style={{
        backgroundColor: style.bg,
      }}
    >
      <span
        className="shrink-0 w-2 h-2 rounded-full"
        style={{
          backgroundColor: style.dot,
        }}
      />

      <span
        style={{
          fontFamily: "'Almarai', sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          color: style.text,
        }}
      >
        {status}
      </span>
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Notification Badge
// ═════════════════════════════════════════════════════════════════════════════

function NotifBadge({
  label,
  dot,
  bg,
  text,
}: {
  label: string;
  dot: string;
  bg: string;
  text: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-[16px] whitespace-nowrap"
      style={{
        backgroundColor: bg,
      }}
    >
      <span
        style={{
          fontFamily: "'Almarai', sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          color: text,
        }}
      >
        {label}
      </span>

      <span
        className="shrink-0 w-2 h-2 rounded-full"
        style={{
          backgroundColor: dot,
        }}
      />
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Sort Arrow
// ═════════════════════════════════════════════════════════════════════════════

function SortArrow() {
  return (
    <ArrowDownUp
      size={14}
      className="text-[#a0abc0] shrink-0"
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Checkbox
// ═════════════════════════════════════════════════════════════════════════════

function Checkbox({
  checked,
  onChange,
  indeterminate = false,
}: {
  checked: boolean;
  onChange: () => void;
  indeterminate?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={[
        "w-5 h-5 rounded-[4px] border-2",
        "flex items-center justify-center",
        "transition-colors shrink-0",

        checked || indeterminate
          ? "bg-[#4BFF62] border-[#4BFF62]"
          : "bg-white border-[#d4d8fa] hover:border-[#4BFF62]",
      ].join(" ")}
    >
      {indeterminate && !checked ? (
        <Minus
          size={10}
          className="text-white"
        />
      ) : checked ? (
        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
        >
          <path
            d="M1 4L4 7L9 1"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Action Buttons
// ═════════════════════════════════════════════════════════════════════════════

function ActionButtons({
  onDelete,
  onView,
}: {
  onDelete: () => void;
  onView: () => void;
}) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <button
        type="button"
        onClick={onDelete}
        title="حذف"
        className="w-[30px] h-[30px] rounded-[4px] flex items-center justify-center hover:opacity-80"
        style={{
          backgroundColor: "#fce8f1",
        }}
      >
        <Trash2
          size={14}
          style={{
            color: "#E3282C",
          }}
        />
      </button>

      <button
        type="button"
        onClick={onView}
        title="عرض"
        className="w-[30px] h-[30px] rounded-[4px] flex items-center justify-center hover:opacity-80"
        style={{
          backgroundColor: "#f5f5f5",
        }}
      >
        <Eye
          size={14}
          style={{
            color: "#2D3648",
          }}
        />
      </button>

      <button
        type="button"
        title="تحويل"
        className="w-[40px] h-[30px] rounded-[4px] flex items-center justify-center hover:opacity-80"
        style={{
          backgroundColor: "#f5f5f5",
        }}
      >
        <ArrowLeftRight
          size={14}
          style={{
            color: "#2D3648",
          }}
        />
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Results Table
// ═════════════════════════════════════════════════════════════════════════════

function ResultsTable({
  records,
  selectedIds,
  onToggleAll,
  onToggleRow,
  onDelete,
  onView,
}: {
  records: SoldierRecord[];
  selectedIds: Set<string>;
  onToggleAll: () => void;
  onToggleRow: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}) {
  const allSelected =
    records.length > 0 &&
    records.every((record) =>
      selectedIds.has(record.id)
    );

  const someSelected =
    selectedIds.size > 0 &&
    !allSelected;

  const headerClass =
    "bg-white px-5 py-3 text-right whitespace-nowrap border-b-2 border-[#d4d8fa]";

  const cellClass =
    "px-5 py-3 text-right border-b border-[#eaecf0] whitespace-nowrap";

  const headerStyle: React.CSSProperties = {
    fontFamily: "'Almarai', sans-serif",
    fontSize: "16px",
    color: "#717d96",
  };

  const cellStyle: React.CSSProperties = {
    fontFamily: "'Almarai', sans-serif",
    fontSize: "16px",
    color: "#2d3648",
  };

  return (
    <div className="w-full overflow-x-auto rounded-[12px] border border-[#e2e7f0] bg-white shadow-sm">
      <table
        className="w-full min-w-[900px]"
        dir="rtl"
      >
        <thead>
          <tr>
            <th
              className={`${headerClass} w-12`}
            >
              <div className="flex justify-center">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={onToggleAll}
                />
              </div>
            </th>

            {[
              "رقم عسكري",
              "درجة",
              "اسم",
              "الوحدة",
              "مكان الالحاق",
              "حالة التوزيع",
              "الاجراء",
            ].map((title) => (
              <th
                key={title}
                className={headerClass}
              >
                <div className="flex items-center gap-1 justify-start">
                  <span style={headerStyle}>
                    {title}
                  </span>

                  <SortArrow />
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {records.map((record) => {
            const selected =
              selectedIds.has(record.id);

            return (
              <tr
                key={record.id}
                className={
                  selected
                    ? "bg-[#f5f7ff]"
                    : "hover:bg-[#fafafa]"
                }
              >
                <td
                  className={`${cellClass} w-12`}
                >
                  <div className="flex justify-center">
                    <Checkbox
                      checked={selected}
                      onChange={() =>
                        onToggleRow(record.id)
                      }
                    />
                  </div>
                </td>

                <td className={cellClass}>
                  <span style={cellStyle}>
                    {record.militaryId}
                  </span>
                </td>

                <td className={cellClass}>
                  <span style={cellStyle}>
                    {record.rank || "غير محدد"}
                  </span>
                </td>

                <td className={cellClass}>
                  <span style={cellStyle}>
                    {record.name}
                  </span>
                </td>

                <td className={cellClass}>
                  <span style={cellStyle}>
                    {record.unit}
                  </span>
                </td>

                <td className={cellClass}>
                  <span style={cellStyle}>
                    {record.attachmentPlace}
                  </span>
                </td>

                <td className={cellClass}>
                  <StatusBadge
                    status={record.status}
                  />
                </td>

                <td className={cellClass}>
                  <ActionButtons
                    onDelete={() =>
                      onDelete(record.id)
                    }
                    onView={() =>
                      onView(record.id)
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

// ═════════════════════════════════════════════════════════════════════════════
// Main Page
// ═════════════════════════════════════════════════════════════════════════════

export function IndividualQueryPage() {
  const navigate = useNavigate();

  // ═══════════════════════════════════════════════════════════════════════════
  // Current User
  // ═══════════════════════════════════════════════════════════════════════════

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [currentUserName, setCurrentUserName] =
    useState("غير معروف");

  // ═══════════════════════════════════════════════════════════════════════════
  // Search
  // ═══════════════════════════════════════════════════════════════════════════

  const [selectedCategory, setSelectedCategory] =
    useState("جميع الفئات");

  const [queryBasis, setQueryBasis] =
    useState("رقم عسكري");

  const [queryText, setQueryText] =
    useState("");

  const [queryTextError, setQueryTextError] =
    useState("");

  const [searchError, setSearchError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [hasSearched, setHasSearched] =
    useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // Raw Results
  // ═══════════════════════════════════════════════════════════════════════════

  const [results, setResults] =
    useState<SoldierRecord[]>([]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Filters
  // ═══════════════════════════════════════════════════════════════════════════

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("الكل");

  const [unitFilter, setUnitFilter] =
    useState("");

  const [rankFilter, setRankFilter] =
    useState("جميع الدرجات");

  // ⭐ فلتر الاسم الجديد
  const [nameFilter, setNameFilter] =
    useState("");

  // ═══════════════════════════════════════════════════════════════════════════
  // Units
  // ═══════════════════════════════════════════════════════════════════════════

  const [units, setUnits] =
    useState<UnitRow[]>([]);

  const [unitsLoading, setUnitsLoading] =
    useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════════════════════════

  const [selectedIds, setSelectedIds] =
    useState<Set<string>>(new Set());

  const [deleteTargetId, setDeleteTargetId] =
    useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // Load Current User
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    async function loadCurrentUser() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Get current user error:",
          userError
        );
        return;
      }

      if (!user) {
        return;
      }

      setCurrentUserId(user.id);

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "Profile error:",
          profileError
        );
      }

      setCurrentUserName(
        profile?.username ??
          user.user_metadata?.full_name ??
          user.email ??
          "غير معروف"
      );
    }

    loadCurrentUser();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Load Units
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    async function loadUnits() {
      setUnitsLoading(true);

      try {
        const {
          data,
          error,
        } = await supabase
          .from("units")
          .select(
            "id,name,code,unit_type,parent_unit_id,is_active"
          )
          .eq("is_active", true)
          .order("name", {
            ascending: true,
          });

        if (error) {
          throw error;
        }

        setUnits(
          (data ?? []) as UnitRow[]
        );
      } catch (error) {
        console.error(
          "Load units error:",
          error
        );

        setUnits([]);
      } finally {
        setUnitsLoading(false);
      }
    }

    loadUnits();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Filtered Results
  // ═══════════════════════════════════════════════════════════════════════════

  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // الحالة
    if (statusFilter !== "الكل") {
      filtered = filtered.filter(
        (record) =>
          record.status === statusFilter
      );
    }

    // الوحدة الأساسية
    if (unitFilter) {
      filtered = filtered.filter(
        (record) =>
          record.unitId === unitFilter
      );
    }

    // الدرجة
    if (rankFilter !== "جميع الدرجات") {
      filtered = filtered.filter(
        (record) =>
          record.rank.trim() ===
          rankFilter.trim()
      );
    }

    // ⭐ الاسم
    if (nameFilter.trim()) {
      const searchName =
        nameFilter.trim().toLowerCase();

      filtered = filtered.filter(
        (record) =>
          record.name
            .trim()
            .toLowerCase()
            .includes(searchName)
      );
    }

    return filtered;
  }, [
    results,
    statusFilter,
    unitFilter,
    rankFilter,
    nameFilter,
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Reset Filters
  // ═══════════════════════════════════════════════════════════════════════════

  function resetFilters() {
    setStatusFilter("الكل");
    setUnitFilter("");
    setRankFilter("جميع الدرجات");

    // ⭐ تصفير فلتر الاسم
    setNameFilter("");

    setSelectedIds(
      new Set(
        results.map(
          (record) => record.id
        )
      )
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Search
  // ═══════════════════════════════════════════════════════════════════════════

  async function handleSearch(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!queryText.trim()) {
      setQueryTextError(
        "يرجى إدخال بيانات الاستعلام أولاً"
      );
      return;
    }

    setQueryTextError("");
    setSearchError("");
    setLoading(true);
    setHasSearched(true);

    setResults([]);
    setSelectedIds(new Set());

    // إعادة الفلاتر مع كل بحث جديد
    setStatusFilter("الكل");
    setUnitFilter("");
    setRankFilter("جميع الدرجات");
    setNameFilter("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let userName = currentUserName;

      if (user) {
        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "Profile error:",
            profileError
          );
        }

        userName =
          profile?.username ??
          user.user_metadata?.full_name ??
          user.email ??
          "غير معروف";
      }

      // ═════════════════════════════════════════════════════════════════════
      // Base Query
      // ═════════════════════════════════════════════════════════════════════

      let query = supabase
        .from("personnel")
        .select(`
          id,
          military_number,
          full_name,
          rank_id,
          personnel_category_id,
          primary_unit_id,
          attachment_unit_id,
          service_status_id,

          ranks (
            id,
            name,
            code
          ),

          personnel_categories (
            id,
            name,
            code
          ),

          primary_unit:units!personnel_primary_unit_id_fkey (
            id,
            name,
            code
          ),

          attachment_unit:units!personnel_attachment_unit_id_fkey (
            id,
            name,
            code
          ),

          service_statuses (
            id,
            name,
            code
          )
        `);

      // ═════════════════════════════════════════════════════════════════════
      // Category
      // ═════════════════════════════════════════════════════════════════════

      if (
        selectedCategory !==
        "جميع الفئات"
      ) {
        const categoryName =
          selectedCategory === "مجند"
            ? "مجند"
            : "متطوع";

        const {
          data: category,
          error: categoryError,
        } = await supabase
          .from("personnel_categories")
          .select("id")
          .eq("name", categoryName)
          .eq("is_active", true)
          .maybeSingle();

        if (categoryError) {
          throw categoryError;
        }

        if (!category) {
          throw new Error(
            `لم يتم العثور على فئة "${categoryName}" في قاعدة البيانات`
          );
        }

        query = query.eq(
          "personnel_category_id",
          category.id
        );
      }

      // ═════════════════════════════════════════════════════════════════════
      // Search Value
      // ═════════════════════════════════════════════════════════════════════

      const value = normalizeDigits(
        queryText.trim()
      );

      // ═════════════════════════════════════════════════════════════════════
      // Military Number
      // ═════════════════════════════════════════════════════════════════════

      if (
        queryBasis === "رقم عسكري"
      ) {
        query = query.ilike(
          "military_number",
          `%${value}%`
        );
      }

      // ═════════════════════════════════════════════════════════════════════
      // Name Search
      // ═════════════════════════════════════════════════════════════════════

      else if (
        queryBasis === "الاسم"
      ) {
        query = query.ilike(
          "full_name",
          `%${value}%`
        );
      }

      // ═════════════════════════════════════════════════════════════════════
      // Execute
      // ═════════════════════════════════════════════════════════════════════

      const {
        data,
        error,
      } = await query;

      if (error) {
        throw error;
      }

      const records =
        (
          (data ?? []) as unknown as PersonnelRow[]
        ).map(mapPersonnelToRecord);

      setResults(records);

      // تحديد كل النتائج تلقائيًا
      setSelectedIds(
        new Set(
          records.map(
            (record) => record.id
          )
        )
      );

      // ═════════════════════════════════════════════════════════════════════
      // Audit
      // ═════════════════════════════════════════════════════════════════════

      if (records.length > 0) {
        try {
          await logActivity({
            userId:
              user?.id ??
              currentUserId ??
              null,

            userName,

            actionType: "QUERY",

            action:
              "الاستعلام عن بيانات فرد",

            entity: "personnel",

            details: JSON.stringify({
              queryBasis,
              queryValue: value,
              category:
                selectedCategory,

              resultsCount:
                records.length,

              personnelIds:
                records.map(
                  (record) =>
                    record.id
                ),
            }),
          });
        } catch (auditError) {
          console.error(
            "Audit log error:",
            auditError
          );
        }
      }
    } catch (error) {
      console.error(
        "Individual query error:",
        error
      );

      setSearchError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تنفيذ الاستعلام"
      );

      setResults([]);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════════════════════════

  function toggleAll() {
    if (
      filteredResults.length > 0 &&
      filteredResults.every((record) =>
        selectedIds.has(record.id)
      )
    ) {
      setSelectedIds((previous) => {
        const next = new Set(previous);

        filteredResults.forEach(
          (record) => {
            next.delete(record.id);
          }
        );

        return next;
      });
    } else {
      setSelectedIds((previous) => {
        const next = new Set(previous);

        filteredResults.forEach(
          (record) => {
            next.add(record.id);
          }
        );

        return next;
      });
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Delete
  // ═══════════════════════════════════════════════════════════════════════════

  function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  async function confirmDelete() {
    if (!deleteTargetId) {
      return;
    }

    try {
      const deletedRecord =
        results.find(
          (record) =>
            record.id ===
            deleteTargetId
        );

      const {
        error,
      } = await supabase
        .from("personnel")
        .delete()
        .eq(
          "id",
          deleteTargetId
        );

      if (error) {
        throw error;
      }

      try {
        await logActivity({
          userId: currentUserId,

          userName:
            currentUserName,

          actionType: "DELETE",

          action: "حذف فرد",

          entity: "personnel",

          details: JSON.stringify({
            personnelId:
              deleteTargetId,

            militaryNumber:
              deletedRecord?.militaryId ??
              null,

            fullName:
              deletedRecord?.name ??
              null,
          }),
        });
      } catch (auditError) {
        console.error(
          "Audit delete error:",
          auditError
        );
      }

      setResults((previous) =>
        previous.filter(
          (record) =>
            record.id !==
            deleteTargetId
        )
      );

      setSelectedIds((previous) => {
        const next = new Set(previous);

        next.delete(
          deleteTargetId
        );

        return next;
      });
    } catch (error) {
      console.error(
        "Delete personnel error:",
        error
      );

      alert(
        "حدث خطأ أثناء حذف الفرد"
      );
    }

    setDeleteTargetId(null);
  }

  function cancelDelete() {
    setDeleteTargetId(null);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // View
  // ═══════════════════════════════════════════════════════════════════════════

  function handleView(id: string) {
    navigate(
      `/dashboard/individual-query/soldier/${id}`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UI States
  // ═══════════════════════════════════════════════════════════════════════════

  const notFound =
    hasSearched &&
    !loading &&
    results.length === 0 &&
    !searchError;

  const found =
    hasSearched &&
    !loading &&
    results.length > 0;

  const filteredNotFound =
    found &&
    filteredResults.length === 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div
      className="flex flex-col gap-6 w-full"
      dir="rtl"
    >
      <DeleteConfirmDialog
        open={
          deleteTargetId !== null
        }
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Title */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      <h1
        className="text-center w-full"
        style={{
          fontFamily:
            "'Almarai', sans-serif",
          fontWeight: 700,
          fontSize:
            "clamp(22px, 4vw, 32px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        الاستعلام عن بيانات فرد
      </h1>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Search Form */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-6 items-end"
      >
        {/* Category */}

        <div className="flex flex-col gap-3 items-start w-full">
          <p
            style={{
              fontFamily:
                "'Almarai', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              color: "#2d3648",
              textAlign: "right",
            }}
          >
            فئة الفرد
          </p>

          <div className="flex flex-wrap gap-4 justify-start w-full">
            {CATEGORIES.map(
              (category) => (
                <RadioCard
                  key={category.id}
                  label={
                    category.label
                  }
                  checked={
                    selectedCategory ===
                    category.label
                  }
                  onChange={() =>
                    setSelectedCategory(
                      category.label
                    )
                  }
                />
              )
            )}
          </div>
        </div>

        {/* Query Controls */}

        <div className="flex flex-col sm:flex-row gap-5 w-full items-end">
          {/* Basis */}

          <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
            <label
              style={{
                fontFamily:
                  "'Almarai', sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                color: "#2d3648",
                textAlign: "right",
                display: "block",
              }}
            >
              أساس الاستعلام
            </label>

            <Dropdown
              options={
                QUERY_BASIS_OPTIONS
              }
              value={queryBasis}
              onChange={
                setQueryBasis
              }
            />
          </div>

          {/* Search Value */}

          <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
            <label
              style={{
                fontFamily:
                  "'Almarai', sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                color: "#2d3648",
                textAlign: "right",
                display: "block",
              }}
            >
              البيان
            </label>

            <input
              type="text"
              value={queryText}
              onChange={(e) => {
                setQueryText(
                  e.target.value
                );

                if (
                  queryTextError
                ) {
                  setQueryTextError(
                    ""
                  );
                }

                if (searchError) {
                  setSearchError("");
                }
              }}
              placeholder={
                queryBasis ===
                "رقم عسكري"
                  ? "أدخل جزء من الرقم العسكري"
                  : "أدخل الاسم"
              }
              className={[
                "w-full h-[54px] bg-white border rounded-[8px]",
                "px-3 text-right outline-none",
                "focus:border-[#4BFF62] transition-colors",

                queryTextError
                  ? "border-[#ef4444]"
                  : "border-[#e2e7f0]",
              ].join(" ")}
              style={{
                fontFamily:
                  "'Almarai', sans-serif",
                fontSize: "18px",
                color: "#4a5468",
              }}
              dir="rtl"
            />

            {queryTextError && (
              <p
                className="text-right"
                style={{
                  fontFamily:
                    "'Almarai', sans-serif",
                  fontSize: "13px",
                  color: "#ef4444",
                }}
              >
                {queryTextError}
              </p>
            )}
          </div>

          {/* Search Button */}

          <button
            type="submit"
            disabled={loading}
            className="shrink-0 w-full sm:w-[150px] h-[52px] rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              background:
                "linear-gradient(to bottom, #00b867, #00522e)",
              fontFamily:
                "'Almarai', sans-serif",
              fontSize: "16px",
              color: "#f5f5f5",
            }}
          >
            {loading
              ? "جاري البحث..."
              : "استعلام"}
          </button>
        </div>
      </form>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Search Error */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {searchError && (
        <div
          className="w-full rounded-[10px] px-4 py-3"
          style={{
            background: "#fce8f1",
            color: "#90132a",
            fontFamily:
              "'Almarai', sans-serif",
            fontSize: "14px",
          }}
        >
          {searchError}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Results */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {hasSearched && (
        <div className="flex flex-col gap-4">

          {/* Status */}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              style={{
                fontFamily:
                  "'Almarai', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "#2d3648",
              }}
            >
              {found
                ? `تم تحديد (${selectedIds.size}) افراد`
                : ""}
            </p>

            <div className="flex flex-wrap gap-3 items-center justify-end">
              {notFound && (
                <NotifBadge
                  label="لم يتم العثور علي نتائج استعلام"
                  dot="#E3282C"
                  bg="#fce8f1"
                  text="#90132a"
                />
              )}

              {found && (
                <NotifBadge
                  label={`تم العثور علي ${results.length} نتائج استعلام`}
                  dot="#35C128"
                  bg="#ebfaea"
                  text="#26861d"
                />
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* FILTERS */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {found && (
            <div className="w-full bg-white border border-[#e2e7f0] rounded-[12px] p-5 shadow-sm">

              <div className="flex flex-col gap-4">

                {/* Filter Header */}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2
                      style={{
                        fontFamily:
                          "'Almarai', sans-serif",
                        fontWeight: 700,
                        fontSize: "17px",
                        color: "#2d3648",
                      }}
                    >
                      تصفية النتائج
                    </h2>

                    <p
                      className="mt-1"
                      style={{
                        fontFamily:
                          "'Almarai', sans-serif",
                        fontSize: "12px",
                        color: "#8b95a8",
                      }}
                    >
                      الفلاتر تطبق على نتائج الاستعلام الحالية
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      resetFilters
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-[7px] border border-[#e2e7f0] bg-white hover:bg-[#f7f8fb] transition-colors"
                    style={{
                      fontFamily:
                        "'Almarai', sans-serif",
                      fontSize: "13px",
                      color: "#2d3648",
                    }}
                  >
                    <RotateCcw
                      size={15}
                    />

                    إعادة تعيين الفلاتر
                  </button>
                </div>

                {/* Filter Fields */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                  {/* ⭐ Name Filter */}

                  <div className="flex flex-col gap-2">
                    <label
                      style={{
                        fontFamily:
                          "'Almarai', sans-serif",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#2d3648",
                      }}
                    >
                      اسم الفرد
                    </label>

                    <div className="relative">
                      <Search
                        size={17}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b95a8]"
                      />

                      <input
                        type="text"
                        value={nameFilter}
                        onChange={(e) =>
                          setNameFilter(
                            e.target.value
                          )
                        }
                        placeholder="ابحث بالاسم..."
                        className="w-full h-[54px] bg-white border border-[#e2e7f0] rounded-[8px] pr-10 pl-3 text-right outline-none focus:border-[#4BFF62] transition-colors"
                        style={{
                          fontFamily:
                            "'Almarai', sans-serif",
                          fontSize: "16px",
                          color: "#4a5468",
                        }}
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Status */}

                  <div className="flex flex-col gap-2">
                    <label
                      style={{
                        fontFamily:
                          "'Almarai', sans-serif",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#2d3648",
                      }}
                    >
                      الحالة
                    </label>

                    <Dropdown
                      options={
                        STATUS_FILTER_OPTIONS
                      }
                      value={
                        statusFilter
                      }
                      onChange={(value) =>
                        setStatusFilter(
                          value as StatusFilter
                        )
                      }
                    />
                  </div>

                  {/* Unit */}

                  <div className="flex flex-col gap-2">
                    <label
                      style={{
                        fontFamily:
                          "'Almarai', sans-serif",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#2d3648",
                      }}
                    >
                      الوحدة الأساسية
                    </label>

                    <SearchableUnitDropdown
                      units={units}
                      value={
                        unitFilter
                      }
                      onChange={
                        setUnitFilter
                      }
                    />

                    {unitsLoading && (
                      <span
                        style={{
                          fontFamily:
                            "'Almarai', sans-serif",
                          fontSize: "11px",
                          color: "#8b95a8",
                        }}
                      >
                        جاري تحميل الوحدات...
                      </span>
                    )}
                  </div>

                  {/* Rank */}

                  <div className="flex flex-col gap-2">
                    <label
                      style={{
                        fontFamily:
                          "'Almarai', sans-serif",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#2d3648",
                      }}
                    >
                      الدرجة
                    </label>

                    <Dropdown
                      options={
                        RANK_OPTIONS
                      }
                      value={
                        rankFilter
                      }
                      onChange={
                        setRankFilter
                      }
                    />
                  </div>
                </div>

                {/* Filter Result Counter */}

                <div className="flex items-center justify-between border-t border-[#eaecf0] pt-3">
                  <span
                    style={{
                      fontFamily:
                        "'Almarai', sans-serif",
                      fontSize: "13px",
                      color: "#717d96",
                    }}
                  >
                    النتائج بعد التصفية
                  </span>

                  <span
                    style={{
                      fontFamily:
                        "'Almarai', sans-serif",
                      fontWeight: 700,
                      fontSize: "14px",
                      color: "#168b4f",
                    }}
                  >
                    {filteredResults.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* Filtered Empty */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {filteredNotFound && (
            <div className="w-full py-12 flex flex-col items-center gap-3 bg-white rounded-[12px] border border-[#e2e7f0]">
              <p
                style={{
                  fontFamily:
                    "'Almarai', sans-serif",
                  fontSize: "17px",
                  color: "#717d96",
                }}
              >
                لا توجد نتائج مطابقة للفلاتر المحددة
              </p>

              <button
                type="button"
                onClick={
                  resetFilters
                }
                className="px-4 py-2 rounded-[7px] bg-[#f0f2fd] text-[#168b4f]"
                style={{
                  fontFamily:
                    "'Almarai', sans-serif",
                  fontSize: "13px",
                }}
              >
                إعادة تعيين الفلاتر
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* Table */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {found &&
            filteredResults.length >
              0 && (
              <ResultsTable
                records={
                  filteredResults
                }
                selectedIds={
                  selectedIds
                }
                onToggleAll={
                  toggleAll
                }
                onToggleRow={
                  toggleRow
                }
                onDelete={
                  handleDelete
                }
                onView={
                  handleView
                }
              />
            )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* Empty Search */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {notFound && (
            <div className="w-full py-16 flex flex-col items-center gap-3 bg-white rounded-[12px] border border-[#e2e7f0]">
              <p
                style={{
                  fontFamily:
                    "'Almarai', sans-serif",
                  fontSize: "18px",
                  color: "#717d96",
                }}
              >
                لم يتم العثور على نتائج
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}