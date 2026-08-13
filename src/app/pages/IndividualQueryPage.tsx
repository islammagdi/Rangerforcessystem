import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronDown,
  ArrowDownUp,
  Eye,
  Trash2,
  ArrowLeftRight,
  Minus,
} from "lucide-react";
import { logActivity } from "../../lib/logActivity";
import { DeleteConfirmDialog } from "../components/dashboard/DeleteConfirmDialog";
import { supabase } from "../../lib/supabase";
function normalizeDigits(value: string): string {
  const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndex = arabicIndicDigits.indexOf(digit);
    if (arabicIndex !== -1) return String(arabicIndex);

    const persianIndex = persianDigits.indexOf(digit);
    if (persianIndex !== -1) return String(persianIndex);

    return digit;
  });
}
// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type DistributionStatus = "ملحق" | "منتهي خدمته" | "علي القوة";

interface SoldierRecord {
  id: string;
  militaryId: string;
  rank: string;
  name: string;
  unit: string;
  attachmentPlace: string;
  status: DistributionStatus;
}

interface PersonnelRow {
  id: string;
  military_number: string;
  full_name: string;
  personnel_category_id: string | null;
  primary_unit_id: string | null;
  attachment_unit_id: string | null;
  service_status_id: string | null;

  personnel_categories?: {
    id: string;
    name: string;
    code: string;
  } | null;

  primary_unit?: {
    id: string;
    name: string;
    code: string;
  } | null;

  attachment_unit?: {
    id: string;
    name: string;
    code: string;
  } | null;

  service_statuses?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const QUERY_BASIS_OPTIONS = [
  "رقم عسكري",
  "الاسم",
  
];

const CATEGORIES = [
  { id: "all", label: "جميع الفئات" },
  { id: "conscript", label: "مجند" },
  { id: "volunteer", label: "متطوع" },
];

const STATUS_STYLES: Record<
  DistributionStatus,
  { bg: string; text: string; dot: string }
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeStatus(value?: string | null): DistributionStatus {
  if (!value) return "علي القوة";

  if (
    value === "ملحق" ||
    value === "قوة الوحدة" ||
    value === "قوة الوحده"
  ) {
    return "ملحق";
  }

  if (
    value === "منتهي خدمته" ||
    value === "منتهى خدمته"
  ) {
    return "منتهي خدمته";
  }

  return "علي القوة";
}

function mapPersonnelToRecord(
  person: PersonnelRow
): SoldierRecord {
  return {
    id: person.id,
    militaryId: person.military_number,
    name: person.full_name,

    // نعرض اسم الفئة كـ "درجة" حاليًا إذا لم يكن عندك
    // عمود rank مستقل في personnel.
    rank:
      person.personnel_categories?.name ??
      person.personnel_categories?.code ??
      "",

    unit:
      person.primary_unit?.name ??
      person.primary_unit?.code ??
      "لا يوجد",

    attachmentPlace:
      person.attachment_unit?.name ??
      person.attachment_unit?.code ??
      "لا يوجد",

    status: normalizeStatus(
      person.service_statuses?.name
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Radio Card
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown
// ─────────────────────────────────────────────────────────────────────────────

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
          className={`shrink-0 text-[#2d3648] transition-transform ${
            open ? "rotate-180" : ""
          }`}
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
                    ? "bg-[#f0f2fd] text-[#4BFF62]"
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

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({
  status,
}: {
  status: DistributionStatus;
}) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[16px] whitespace-nowrap"
      style={{ backgroundColor: style.bg }}
    >
      <span
        className="shrink-0 w-2 h-2 rounded-full"
        style={{ backgroundColor: style.dot }}
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

// ─────────────────────────────────────────────────────────────────────────────
// Notification Badge
// ─────────────────────────────────────────────────────────────────────────────

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
      style={{ backgroundColor: bg }}
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
        style={{ backgroundColor: dot }}
      />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sort Arrow
// ─────────────────────────────────────────────────────────────────────────────

function SortArrow() {
  return (
    <ArrowDownUp
      size={14}
      className="text-[#a0abc0] shrink-0"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkbox
// ─────────────────────────────────────────────────────────────────────────────

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
        <Minus size={10} className="text-white" />
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

// ─────────────────────────────────────────────────────────────────────────────
// Action Buttons
// ─────────────────────────────────────────────────────────────────────────────

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
        style={{ backgroundColor: "#fce8f1" }}
      >
        <Trash2
          size={14}
          style={{ color: "#E3282C" }}
        />
      </button>

      <button
        type="button"
        onClick={onView}
        title="عرض"
        className="w-[30px] h-[30px] rounded-[4px] flex items-center justify-center hover:opacity-80"
        style={{ backgroundColor: "#f5f5f5" }}
      >
        <Eye
          size={14}
          style={{ color: "#2D3648" }}
        />
      </button>

      <button
        type="button"
        title="تحويل"
        className="w-[40px] h-[30px] rounded-[4px] flex items-center justify-center hover:opacity-80"
        style={{ backgroundColor: "#f5f5f5" }}
      >
        <ArrowLeftRight
          size={14}
          style={{ color: "#2D3648" }}
        />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Results Table
// ─────────────────────────────────────────────────────────────────────────────

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
    selectedIds.size === records.length;

  const someSelected =
    selectedIds.size > 0 && !allSelected;

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
            <th className={`${headerClass} w-12`}>
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
            const selected = selectedIds.has(record.id);

            return (
              <tr
                key={record.id}
                className={
                  selected
                    ? "bg-[#f5f7ff]"
                    : "hover:bg-[#fafafa]"
                }
              >
                <td className={`${cellClass} w-12`}>
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
                    {record.rank}
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

  // المستخدم الحالي
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("غير معروف");

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

  const [results, setResults] =
    useState<SoldierRecord[]>([]);

  const [selectedIds, setSelectedIds] =
    useState<Set<string>>(new Set());

  const [deleteTargetId, setDeleteTargetId] =
    useState<string | null>(null);

  // تحميل بيانات المستخدم الحالي مرة واحدة
  useEffect(() => {
    async function loadCurrentUser() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Get current user error:", userError);
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
        console.error("Profile error:", profileError);
      }

      setCurrentUserName(
        profile?.username ?? "غير معروف"
      );
    }

    loadCurrentUser();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Search
  // ─────────────────────────────────────────────────────────────────────────

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

    try {
      /*
       * الاستعلام الأساسي.
       *
       * بنجيب:
       * personnel
       * + personnel_categories
       * + primary unit
       * + attachment unit
       * + service status
       */
const {
  data: { user },
} = await supabase.auth.getUser();

let userName = "غير معروف";

if (user) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile error:", profileError);
  }

  userName = profile?.username ?? "غير معروف";
}
      let query = supabase
        .from("personnel")
        .select(`
          id,
          military_number,
          full_name,
          personnel_category_id,
          primary_unit_id,
          attachment_unit_id,
          service_status_id,

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

      // ─────────────────────────────────────────────────────────────────────
      // فلتر الفئة
      // ─────────────────────────────────────────────────────────────────────

      if (selectedCategory !== "جميع الفئات") {
        /*
         * بدل ما نفترض UUID معين للمجند أو المتطوع،
         * بنجيب الـ ID من personnel_categories حسب الاسم.
         */

        const categoryName =
          selectedCategory === "مجند"
            ? "مجند"
            : "متطوع";

        const { data: category, error: categoryError } =
          await supabase
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

      // ─────────────────────────────────────────────────────────────────────
      // أساس الاستعلام
      // ─────────────────────────────────────────────────────────────────────

  const value = normalizeDigits(queryText.trim());

if (queryBasis === "رقم عسكري") {
  query = query.eq(
    "military_number",
    value
  );
}

      else if (queryBasis === "الاسم") {
        query = query.ilike(
          "full_name",
          `%${value}%`
        );
      }

      else if (queryBasis === "رقم الوحدة") {
        /*
         * البحث في primary_unit_id مباشرة غير ممكن
         * لو المستخدم يكتب اسم/كود الوحدة.
         *
         * لذلك نبحث أولاً في units عن الاسم أو الكود.
         */

        const { data: units, error: unitsError } =
          await supabase
            .from("units")
            .select("id")
            .or(
              `name.ilike.%${value}%,code.ilike.%${value}%`
            )
            .eq("is_active", true);

        if (unitsError) {
          throw unitsError;
        }

        const unitIds =
          units?.map((unit) => unit.id) ?? [];

        if (unitIds.length === 0) {
          setResults([]);
          setSelectedIds(new Set());
          return;
        }

        query = query.in(
          "primary_unit_id",
          unitIds
        );
      }

      else if (queryBasis === "الرقم القومي") {
        /*
         * لو عندك عمود الرقم القومي في personnel
         * ضعه هنا.
         *
         * حاليًا الأعمدة التي أرسلتها لا تحتوي
         * على national_id، لذلك لن أخترع اسم عمود.
         */

        setSearchError(
          "عمود الرقم القومي غير موجود ضمن الأعمدة التي تم إرسالها لجدول personnel."
        );

        setResults([]);
        setSelectedIds(new Set());
        return;
      }

      // ─────────────────────────────────────────────────────────────────────
      // Execute
      // ─────────────────────────────────────────────────────────────────────

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const records =
        ((data ?? []) as unknown as PersonnelRow[])
          .map(mapPersonnelToRecord);

      setResults(records);
// تسجيل نجاح الاستعلام في audit_logs
if (records.length > 0) {
  await logActivity({
    userId: user?.id ?? null,
    userName,
    actionType: "QUERY",
    action: "الاستعلام عن بيانات فرد",
    entity: "personnel",
    details: JSON.stringify({
      queryBasis,
      queryValue: value,
      category: selectedCategory,
      resultsCount: records.length,
      personnelIds: records.map((record) => record.id),
    }),
  });
}
      setSelectedIds(
        new Set(records.map((record) => record.id))
      );
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
  

  // ─────────────────────────────────────────────────────────────────────────
  // Selection
  // ─────────────────────────────────────────────────────────────────────────

  function toggleAll() {
    if (
      results.length > 0 &&
      selectedIds.size === results.length
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(results.map((r) => r.id))
      );
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

  // ─────────────────────────────────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────────────────────────────────

  function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  async function confirmDelete() {
  if (!deleteTargetId) return;

  try {
    // نجيب بيانات الفرد قبل الحذف عشان نسجلها في الـ audit
    const deletedRecord = results.find(
      (record) => record.id === deleteTargetId
    );

    const { error } = await supabase
      .from("personnel")
      .delete()
      .eq("id", deleteTargetId);

    if (error) {
      throw error;
    }

    // تسجيل عملية الحذف
    await logActivity({
      userId: currentUserId,
      userName: currentUserName,
      actionType: "DELETE",
      action: "حذف فرد",
      entity: "personnel",
      details: JSON.stringify({
        personnelId: deleteTargetId,
        militaryNumber: deletedRecord?.militaryId ?? null,
        fullName: deletedRecord?.name ?? null,
      }),
    });

    // تحديث الجدول
    setResults((previous) =>
      previous.filter(
        (record) => record.id !== deleteTargetId
      )
    );

    setSelectedIds((previous) => {
      const next = new Set(previous);
      next.delete(deleteTargetId);
      return next;
    });

  } catch (error) {
    console.error("Delete personnel error:", error);
    alert("حدث خطأ أثناء حذف الفرد");
  }

  setDeleteTargetId(null);
}
  function cancelDelete() {
    setDeleteTargetId(null);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // View
  // ─────────────────────────────────────────────────────────────────────────

  function handleView(id: string) {
    navigate(
      `/dashboard/individual-query/soldier/${id}`
    );
  }

  const notFound =
    hasSearched &&
    !loading &&
    results.length === 0 &&
    !searchError;

  const found =
    hasSearched &&
    !loading &&
    results.length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col gap-6 w-full"
      dir="rtl"
    >
      <DeleteConfirmDialog
        open={deleteTargetId !== null}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

      {/* Page title */}
      <h1
        className="text-center w-full"
        style={{
          fontFamily: "'Almarai', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(22px, 4vw, 32px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        الاستعلام عن بيانات فرد
      </h1>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-6 items-end"
      >
        {/* Category */}
        <div className="flex flex-col gap-3 items-start w-full">
          <p
            style={{
              fontFamily: "'Almarai', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              color: "#2d3648",
              textAlign: "right",
            }}
          >
            فئة الفرد
          </p>

          <div className="flex flex-wrap gap-4 justify-start w-full">
            {CATEGORIES.map((category) => (
              <RadioCard
                key={category.id}
                label={category.label}
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
            ))}
          </div>
        </div>

        {/* Query controls */}
        <div className="flex flex-col sm:flex-row gap-5 w-full items-end">
          {/* Query basis */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
            <label
              style={{
                fontFamily: "'Almarai', sans-serif",
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
              options={QUERY_BASIS_OPTIONS}
              value={queryBasis}
              onChange={setQueryBasis}
            />
          </div>

          {/* Search value */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0 w-full">
            <label
              style={{
                fontFamily: "'Almarai', sans-serif",
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
                setQueryText(e.target.value);

                if (queryTextError) {
                  setQueryTextError("");
                }

                if (searchError) {
                  setSearchError("");
                }
              }}
              placeholder={
                queryBasis === "رقم عسكري"
                  ? "أدخل الرقم العسكري"
                  : queryBasis === "الاسم"
                    ? "أدخل الاسم"
                    : queryBasis ===
                        "رقم الوحدة"
                      ? "أدخل اسم أو كود الوحدة"
                      : "بيانات الاستعلام"
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
                fontFamily: "'Almarai', sans-serif",
                fontSize: "18px",
                color: "#4a5468",
              }}
              dir="rtl"
            />

            {queryTextError && (
              <p
                className="text-right"
                style={{
                  fontFamily: "'Almarai', sans-serif",
                  fontSize: "13px",
                  color: "#ef4444",
                }}
              >
                {queryTextError}
              </p>
            )}
          </div>

          {/* Search button */}
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 w-full sm:w-[150px] h-[52px] rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              background:
                "linear-gradient(to bottom, #00b867, #00522e)",
              fontFamily: "'Almarai', sans-serif",
              fontSize: "16px",
              color: "#f5f5f5",
            }}
          >
            {loading ? "جاري البحث..." : "استعلام"}
          </button>
        </div>
      </form>

      {/* Error */}
      {searchError && (
        <div
          className="w-full rounded-[10px] px-4 py-3"
          style={{
            background: "#fce8f1",
            color: "#90132a",
            fontFamily: "'Almarai', sans-serif",
            fontSize: "14px",
          }}
        >
          {searchError}
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div className="flex flex-col gap-4">
          {/* Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              style={{
                fontFamily: "'Almarai', sans-serif",
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

          {/* Table */}
          {found && (
            <ResultsTable
              records={results}
              selectedIds={selectedIds}
              onToggleAll={toggleAll}
              onToggleRow={toggleRow}
              onDelete={handleDelete}
              onView={handleView}
            />
          )}

          {/* Empty */}
          {notFound && (
            <div className="w-full py-16 flex flex-col items-center gap-3 bg-white rounded-[12px] border border-[#e2e7f0]">
              <p
                style={{
                  fontFamily: "'Almarai', sans-serif",
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