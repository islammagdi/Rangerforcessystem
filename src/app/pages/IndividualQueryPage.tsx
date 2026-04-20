import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronDown,
  ArrowDownUp,
  Eye,
  Trash2,
  ArrowLeftRight,
  Minus,
} from "lucide-react";
import { DeleteConfirmDialog } from "../components/dashboard/DeleteConfirmDialog";
import {
  getSoldiers,
  deleteSoldier,
} from "../data/soldiersData";
import type { SoldierData } from "../data/soldiersData";

// ─── Types ──────────────────────────────────────────────────────────────────
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

// Map SoldierData → SoldierRecord for table display
function toRecord(s: SoldierData): SoldierRecord {
  const statusMap: Record<string, DistributionStatus> = {
    "قوة الوحده": "ملحق",
    "منتهي خدمته": "منتهي خدمته",
    "علي القوة": "علي القوة",
    ملحق: "ملحق",
  };
  return {
    id: s.id,
    militaryId: s.militaryId,
    rank: s.rank,
    name: s.name,
    unit: s.unit,
    attachmentPlace: s.attachmentPlace,
    status: statusMap[s.serviceStatus] ?? "علي القوة",
  };
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_RESULTS: SoldierRecord[] = [
  {
    id: "1",
    militaryId: "2024427700265",
    rank: "جندي",
    name: "اسلام مجدي عبدالستار",
    unit: "ك ١١٣ صع",
    attachmentPlace: "فرع العمليات",
    status: "ملحق",
  },
  {
    id: "2",
    militaryId: "2024159308527",
    rank: "جندي",
    name: "احمد عادل عبدالستار",
    unit: "مع العمليات الخاصة",
    attachmentPlace: "لا يوجد",
    status: "منتهي خدمته",
  },
  {
    id: "3",
    militaryId: "2024964213580",
    rank: "مساعد أ",
    name: "محمود اسلام عبدالله",
    unit: "س ١٤٥ اشارة",
    attachmentPlace: "لا يوجد",
    status: "علي القوة",
  },
];

// ─── Query basis options ─────────────────────────────────────────────────────
const QUERY_BASIS_OPTIONS = [
  "رقم عسكري",
  "الاسم",
  "الرقم القومي",
  "رقم الوحدة",
];

// ─── Category options ────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "جميع الفئات" },
  { id: "conscript", label: "مجند" },
  { id: "volunteer", label: "متطوع" },
];

// ─── Status badge config ─────────────────────────────────────────────────────
const STATUS_STYLES: Record<
  DistributionStatus,
  { bg: string; text: string; dot: string }
> = {
  ملحق: { bg: "#ebfaea", text: "#26861d", dot: "#35C128" },
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

// ════════════════════════════════════════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════════════════════════════════════════

// ─── Radio Card ──────────────────────────────────────────────────────────────
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
        "flex items-center gap-3 px-4 py-4 rounded-[12px] border transition-colors text-right w-full sm:w-[200px] shrink-0",
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

// ─── Custom Dropdown ─────────────────────────────────────────────────────────
function Dropdown({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-[54px] bg-white border border-[#e2e7f0] rounded-[8px] flex items-center gap-3 px-3 text-right hover:border-[#a0aec0] transition-colors"
      >
        <ChevronDown
          size={20}
          className={`shrink-0 text-[#2d3648] transition-transform ${open ? "rotate-180" : ""}`}
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
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={[
                  "w-full text-right px-4 py-3 hover:bg-[#f5f6fb] transition-colors",
                  opt === value
                    ? "bg-[#f0f2fd] text-[#4BFF62]"
                    : "text-[#2d3648]",
                ].join(" ")}
                style={{
                  fontFamily: "'Almarai', sans-serif",
                  fontSize: "16px",
                }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({
  status,
}: {
  status: DistributionStatus;
}) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[16px] whitespace-nowrap"
      style={{ backgroundColor: s.bg }}
    >
      <span
        className="shrink-0 w-2 h-2 rounded-full"
        style={{ backgroundColor: s.dot }}
      />
      <span
        style={{
          fontFamily: "'Almarai', sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          color: s.text,
        }}
      >
        {status}
      </span>
    </span>
  );
}

// ─── Notification Badge ───────────────────────────────────────────────────────
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

// ─── Table Sort Arrow ─────────────────────────────────────────────────────────
function SortArrow() {
  return (
    <ArrowDownUp
      size={14}
      className="text-[#a0abc0] shrink-0"
    />
  );
}

// ─── Checkbox ────────────────────────────────────────────────────────────────
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
        "w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-colors shrink-0",
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

// ─── Action Buttons ───────────────────────────────────────────────────────────
function ActionButtons({
  onDelete,
  onView,
}: {
  onDelete: () => void;
  onView: () => void;
}) {
  return (
    <div className="flex items-center gap-2 justify-end">
      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        title="حذف"
        className="w-[30px] h-[30px] rounded-[4px] flex items-center justify-center transition-opacity hover:opacity-80"
        style={{ backgroundColor: "#fce8f1" }}
      >
        <Trash2 size={14} style={{ color: "#E3282C" }} />
      </button>

      {/* View */}
      <button
        type="button"
        onClick={onView}
        title="عرض"
        className="w-[30px] h-[30px] rounded-[4px] flex items-center justify-center transition-opacity hover:opacity-80"
        style={{ backgroundColor: "#f5f5f5" }}
      >
        <Eye size={14} style={{ color: "#2D3648" }} />
      </button>

      {/* Transfer */}
      <button
        type="button"
        title="تحويل"
        className="w-[40px] h-[30px] rounded-[4px] flex items-center justify-center transition-opacity hover:opacity-80"
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

// ─── Results Table ────────────────────────────────────────────────────────────
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
    records.length > 0 && selectedIds.size === records.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const headerCellClass = [
    "bg-white px-5 py-3 text-right whitespace-nowrap",
    "border-b-2 border-[#d4d8fa]",
  ].join(" ");

  const headerTextStyle: React.CSSProperties = {
    fontFamily: "'Almarai', sans-serif",
    fontSize: "16px",
    color: "#717d96",
  };

  const cellClass =
    "px-5 py-3 text-right border-b border-[#eaecf0] whitespace-nowrap";
  const cellTextStyle: React.CSSProperties = {
    fontFamily: "'Almarai', sans-serif",
    fontSize: "16px",
    color: "#2d3648",
  };

  return (
    <div className="w-full overflow-x-auto rounded-[12px] border border-[#e2e7f0] bg-white shadow-sm">
      <table className="w-full min-w-[700px]" dir="rtl">
        <thead>
          <tr>
            {/* Checkbox header */}
            <th className={`${headerCellClass} w-12`}>
              <div className="flex justify-center">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={onToggleAll}
                />
              </div>
            </th>

            {/* رقم عسكري */}
            <th className={headerCellClass}>
              <div className="flex items-center gap-1 justify-end">
                <span style={headerTextStyle}>رقم عسكري</span>
                <SortArrow />
              </div>
            </th>

            {/* درجة */}
            <th className={headerCellClass}>
              <div className="flex items-center gap-1 justify-end">
                <span style={headerTextStyle}>درجة</span>
                <SortArrow />
              </div>
            </th>

            {/* اسم */}
            <th className={headerCellClass}>
              <div className="flex items-center gap-1 justify-end">
                <span style={headerTextStyle}>اسم</span>
                <SortArrow />
              </div>
            </th>

            {/* الوحدة */}
            <th className={headerCellClass}>
              <div className="flex items-center gap-1 justify-end">
                <span style={headerTextStyle}>الوحدة</span>
                <SortArrow />
              </div>
            </th>

            {/* مكان الالحاق */}
            <th className={headerCellClass}>
              <div className="flex items-center gap-1 justify-end">
                <span style={headerTextStyle}>
                  مكان الالحاق
                </span>
                <SortArrow />
              </div>
            </th>

            {/* حالة التوزيع */}
            <th className={headerCellClass}>
              <div className="flex items-center gap-1 justify-end">
                <span style={headerTextStyle}>
                  حالة التوزيع
                </span>
                <SortArrow />
              </div>
            </th>

            {/* الاجراء */}
            <th className={headerCellClass}>
              <div className="flex items-center gap-1 justify-end">
                <span style={headerTextStyle}>الاجراء</span>
                <SortArrow />
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          {records.map((rec) => {
            const isSelected = selectedIds.has(rec.id);
            return (
              <tr
                key={rec.id}
                className={`transition-colors ${isSelected ? "bg-[#f5f7ff]" : "hover:bg-[#fafafa]"}`}
              >
                {/* Checkbox */}
                <td className={`${cellClass} w-12`}>
                  <div className="flex justify-center">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleRow(rec.id)}
                    />
                  </div>
                </td>

                {/* رقم عسكري — blurred */}
                <td className={cellClass}>
                  <span style={{ ...cellTextStyle }}>
                    {rec.militaryId}
                  </span>
                </td>

                {/* درجة */}
                <td className={cellClass}>
                  <span style={{ ...cellTextStyle }}>
                    {rec.rank}
                  </span>
                </td>

                {/* اسم — blurred */}
                <td className={cellClass}>
                  <span style={{ ...cellTextStyle }}>
                    {rec.name}
                  </span>
                </td>

                {/* الوحدة — blurred */}
                <td className={cellClass}>
                  <span style={{ ...cellTextStyle }}>
                    {rec.unit}
                  </span>
                </td>

                {/* مكان الالحاق */}
                <td className={cellClass}>
                  <span style={cellTextStyle}>
                    {rec.attachmentPlace}
                  </span>
                </td>

                {/* حالة التوزيع */}
                <td className={cellClass}>
                  <StatusBadge status={rec.status} />
                </td>

                {/* الاجراء */}
                <td className={cellClass}>
                  <ActionButtons
                    onDelete={() => onDelete(rec.id)}
                    onView={() => onView(rec.id)}
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

// ════════════════════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════════════════════
export function IndividualQueryPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] =
    useState("جميع الفئات");
  const [queryBasis, setQueryBasis] = useState("رقم عسكري");
  const [queryText, setQueryText] = useState("");
  const [queryTextError, setQueryTextError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SoldierRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(),
  );

  // ── Delete dialog state ────────────────────────────────────────────────
  const [deleteTargetId, setDeleteTargetId] = useState<
    string | null
  >(null);

  // ── Search ──────────────────────────────────────────────────────────────
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!queryText.trim()) {
      setQueryTextError("يرجى إدخال بيانات الاستعلام أولاً");
      return;
    }
    setQueryTextError("");
    // Simulate finding results (frontend only)
    setResults(MOCK_RESULTS);
    setHasSearched(true);
    setSelectedIds(new Set(MOCK_RESULTS.map((r) => r.id))); // all selected by default
  }

  // ── Selection ────────────────────────────────────────────────────────────
  function toggleAll() {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map((r) => r.id)));
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleDelete(id: string) {
    // Open dialog instead of deleting immediately
    setDeleteTargetId(id);
  }

  function confirmDelete() {
    if (deleteTargetId) {
      setResults((prev) =>
        prev.filter((r) => r.id !== deleteTargetId),
      );
      setSelectedIds((prev) => {
        const s = new Set(prev);
        s.delete(deleteTargetId);
        return s;
      });
    }
    setDeleteTargetId(null);
  }

  function cancelDelete() {
    setDeleteTargetId(null);
  }

  function handleView(id: string) {
    navigate(`/dashboard/individual-query/soldier/${id}`);
  }

  const notFound = hasSearched && results.length === 0;
  const found = hasSearched && results.length > 0;

  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      {/* ── Delete confirmation dialog (portal-style overlay) ─────────── */}
      <DeleteConfirmDialog
        open={deleteTargetId !== null}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

      {/* ── Page title ──────────────────────────────────────────────────── */}
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

      {/* ── Search form ─────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-6 items-end"
      >
        {/* ── فئة الفرد ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 items-sart w-full">
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
            {CATEGORIES.map((cat) => (
              <RadioCard
                key={cat.id}
                label={cat.label}
                checked={selectedCategory === cat.label}
                onChange={() => setSelectedCategory(cat.label)}
              />
            ))}
          </div>
        </div>
        {/* ── Row: Dropdown → Input → Button ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-5 w-full items-end">
          {/* 1 - أساس الاستعلام (Dropdown) — rightmost in RTL */}
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

          {/* 2 - البيان (Input) */}
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
                if (queryTextError) setQueryTextError("");
              }}
              placeholder="بيانات الاستعلام"
              className={[
                "w-full h-[54px] bg-white border rounded-[8px] px-3 text-right outline-none focus:border-[#4BFF62] transition-colors",
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
                  lineHeight: 1.4,
                }}
              >
                {queryTextError}
              </p>
            )}
          </div>

          {/* 3 - زر الاستعلام — leftmost in RTL */}
          <button
            type="submit"
            className="shrink-0 w-full sm:w-[150px] h-[52px] rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90 active:opacity-80"
            style={{
              background:
                "linear-gradient(to bottom, #00b867, #00522e)",
              fontFamily: "'Almarai', sans-serif",
              fontSize: "16px",
              color: "#f5f5f5",
            }}
          >
            استعلام
          </button>
        </div>
      </form>

      {/* ── Search result area ───────────────────────────────────────────── */}
      {hasSearched && (
        <div className="flex flex-col gap-4">
          {/* ── Status row ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: selected count */}
            <p
              style={{
                fontFamily: "'Almarai', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "#172e78",
              }}
            >
              {found
                ? `تم تحديد (${selectedIds.size}) افراد`
                : ""}
            </p>

            {/* Right: notification badges */}
            <div className="flex flex-wrap gap-3 items-center justify-end">
              {(notFound || found) && (
                <>
                  {notFound && (
                    <NotifBadge
                      label="لم يتم العثور علي نتائج استعلام"
                      dot="#E3282C"
                      bg="#fce8f1"
                      text="#90132a"
                    />
                  )}
                  {found && (
                    <>
                      <NotifBadge
                        label="لم يتم العثور علي نتائج استعلام"
                        dot="#E3282C"
                        bg="#fce8f1"
                        text="#90132a"
                      />
                      <NotifBadge
                        label={`تم العثور علي ${results.length} نتائج استعلام`}
                        dot="#35C128"
                        bg="#ebfaea"
                        text="#26861d"
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Table ──────────────────────────────────────────────────── */}
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

          {/* ── Empty state ─────────────────────────────────────────────── */}
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