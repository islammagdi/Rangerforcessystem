import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Search, Calendar, ChevronDown, Eye, Printer, CheckSquare, Square } from "lucide-react";
import { LETTERS_DATA, getLettersBySoldierMilitaryId } from "../data/lettersData";
import { getSoldiers } from "../data/soldiersData";
import type { LetterArchiveRecord } from "../data/lettersData";
import type { SoldierData } from "../data/soldiersData";

const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

// ─── Shared: Status badge ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "موثق" | "غير موثق" }) {
  const isVerified = status === "موثق";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
      style={{
        background: isVerified ? "#dcfce7" : "#fce9ea",
        ...F,
        fontSize: 12,
        fontWeight: 700,
        color: isVerified ? "#166534" : "#9d2e15",
        whiteSpace: "nowrap",
      }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: isVerified ? "#16a34a" : "#E37032" }}
      />
      {status}
    </span>
  );
}

// ─── Shared: Sort icon ────────────────────────────────────────────────────────
function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M8 13l-3-3M8 13l3-3" stroke="#A0ABC0" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Shared: Filter Dropdown ──────────────────────────────────────────────────
function FilterDropdown({ placeholder, options, value, onChange }: {
  placeholder: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-1 min-w-[140px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-[52px] bg-white border border-[#e2e7f0] rounded-[8px] flex items-center gap-2 px-3 hover:border-[#a0aec0] transition-colors"
      >
        <ChevronDown size={16} className={`shrink-0 text-[#2d3648] transition-transform ${open ? "rotate-180" : ""}`} />
        <span className="flex-1 text-right" style={{ ...F, fontSize: 16, color: value ? "#2d3648" : "#4a5468" }}>
          {value || placeholder}
        </span>
      </button>
      {open && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden" dir="rtl">
          <li>
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-right px-4 py-2.5 hover:bg-[#f5f6fb]"
              style={{ ...F, fontSize: 14, color: "#717d96" }}>
              الكل
            </button>
          </li>
          {options.map((opt) => (
            <li key={opt}>
              <button type="button" onClick={() => { onChange(opt); setOpen(false); }}
                className={["w-full text-right px-4 py-2.5 transition-colors", opt === value ? "bg-[#f0f2fd] text-[#1f3d97]" : "hover:bg-[#f5f6fb] text-[#2d3648]"].join(" ")}
                style={{ ...F, fontSize: 14 }}>
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Letters Table ────────────────────────────────────────────────────────────
function LettersTable({ records, onView, onPrint, showSoldierCol = false }: {
  records: LetterArchiveRecord[];
  onView: (id: string) => void;
  onPrint: (id: string) => void;
  showSoldierCol?: boolean;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);

  function toggleRow(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allChecked) { setChecked(new Set()); setAllChecked(false); }
    else { setChecked(new Set(records.map((r) => r.id))); setAllChecked(true); }
  }

  const thClass = "px-4 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]";
  const tdClass = "px-4 py-3 text-right border-b border-[#e2e7f0]";

  return (
    <div className="w-full overflow-x-auto rounded-[12px] border border-[#e2e7f0]" dir="rtl">
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr>
            <th className={thClass} style={{ width: 44 }}>
              <button type="button" onClick={toggleAll}>
                {allChecked
                  ? <CheckSquare size={16} style={{ color: "#1f3d97" }} />
                  : <Square size={16} style={{ color: "#a1aebe" }} />}
              </button>
            </th>
            {["رقم الخطاب", "تاريخ الخطاب", "نوع الخطاب", "جهة الخطاب", "عدد الافراد", "حالة الخطاب", "الاجراء"].map((h) => (
              <th key={h} className={thClass}>
                <div className="flex items-center gap-1 justify-end">
                  <span style={{ ...F, fontSize: 14, color: "#717d96" }}>{h}</span>
                  <SortIcon />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-12 text-center">
                <span style={{ ...F, fontSize: 15, color: "#a1aebe" }}>لا توجد نتائج</span>
              </td>
            </tr>
          ) : records.map((rec) => (
            <tr key={rec.id} className="hover:bg-[#fafbff] transition-colors">
              <td className={tdClass} style={{ width: 44 }}>
                <button type="button" onClick={() => toggleRow(rec.id)}>
                  {checked.has(rec.id)
                    ? <CheckSquare size={16} style={{ color: "#1f3d97" }} />
                    : <Square size={16} style={{ color: "#a1aebe" }} />}
                </button>
              </td>
              <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{rec.letterNumber}</span></td>
              <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{rec.date}</span></td>
              <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{rec.type}</span></td>
              <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{rec.destination}</span></td>
              <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{rec.soldiersCount}</span></td>
              <td className={tdClass}><StatusBadge status={rec.status} /></td>
              <td className={tdClass}>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => onPrint(rec.id)}
                    className="w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors hover:opacity-80"
                    style={{ backgroundColor: "#ebedfd" }}
                    title="طباعة"
                  >
                    <Printer size={14} style={{ color: "#2d3648" }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onView(rec.id)}
                    className="w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors hover:opacity-80"
                    style={{ backgroundColor: "#f0f2fd" }}
                    title="عرض"
                  >
                    <Eye size={14} style={{ color: "#1f3d97" }} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── General Archive Tab ──────────────────────────────────────────────────────
function GeneralArchiveTab({ onView, onPrint }: { onView: (id: string) => void; onPrint: (id: string) => void }) {
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return LETTERS_DATA.filter((l) => {
      if (filterStatus && l.status !== filterStatus) return false;
      if (filterType && l.type !== filterType) return false;
      if (searchText && !l.letterNumber.includes(searchText) && !l.destination.includes(searchText)) return false;
      return true;
    });
  }, [searchText, filterStatus, filterType]);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-stretch w-full" dir="rtl">
        {/* Date range */}
        <div className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[52px] min-w-[200px]">
          <Calendar size={16} className="shrink-0 text-[#2d3648]" />
          <input
            type="text"
            placeholder="التاريخ من الى"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="flex-1 text-right bg-transparent outline-none"
            style={{ ...F, fontSize: 15, color: "#4a5468" }}
            dir="rtl"
          />
        </div>
        {/* Status filter */}
        <FilterDropdown
          placeholder="عرض حسب الحالة"
          options={["موثق", "غير موثق"]}
          value={filterStatus}
          onChange={setFilterStatus}
        />
        {/* Type filter */}
        <FilterDropdown
          placeholder="عرض حسب النوع"
          options={["إلحاق", "إنهاء إلحاق"]}
          value={filterType}
          onChange={setFilterType}
        />
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[52px] flex-[2] min-w-[200px]" dir="rtl">
          <span style={{ ...F, fontSize: 15, color: "#4a5468", flex: 1, textAlign: "right" }}>
            <input
              type="text"
              placeholder="ابحث برقم الخطاب او جهة الخطاب"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-transparent outline-none text-right"
              style={{ ...F, fontSize: 15, color: "#2d3648" }}
              dir="rtl"
            />
          </span>
          <Search size={18} className="shrink-0 text-[#2d3648]" />
        </div>
      </div>

      {/* Table */}
      <LettersTable records={filtered} onView={onView} onPrint={onPrint} />
    </div>
  );
}

// ─── Individual Tab ───────────────────────────────────────────────────────────
function SoldierCard({ soldier }: { soldier: SoldierData }) {
  return (
    <div className="w-full bg-white rounded-[12px] border border-[#e2e7f0] px-5 py-4 flex flex-wrap items-center justify-between gap-4" dir="rtl">
      {/* Left: name + status */}
      <div className="flex items-center gap-3">
        <span style={{ ...F, fontSize: 17, color: "#2d3648", fontWeight: 700 }}>
          جندي / {soldier.name}
        </span>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
          style={{ background: "#dbeafe", ...F, fontSize: 12, fontWeight: 700, color: "#1e40af" }}
        >
          ملحق
        </span>
      </div>
      {/* Right: details */}
      <div className="flex flex-wrap gap-5" dir="rtl">
        <div className="flex items-center gap-1.5">
          <span style={{ ...F, fontSize: 13, color: "#717d96" }}>الرقم العسكري</span>
          <span style={{ ...F, fontSize: 13, color: "#717d96" }}>:</span>
          <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{soldier.militaryId}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ ...F, fontSize: 13, color: "#717d96" }}>الوحدة الاساسية</span>
          <span style={{ ...F, fontSize: 13, color: "#717d96" }}>:</span>
          <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{soldier.unit}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ ...F, fontSize: 13, color: "#717d96" }}>وحدة الالحاق</span>
          <span style={{ ...F, fontSize: 13, color: "#717d96" }}>:</span>
          <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{soldier.attachmentPlace !== "لا يوجد" ? soldier.attachmentPlace : "فرع التنظيم والادارة"}</span>
        </div>
      </div>
    </div>
  );
}

function IndividualTab({ onView, onPrint }: { onView: (id: string) => void; onPrint: (id: string) => void }) {
  const [searchText, setSearchText] = useState("");
  const [foundSoldier, setFoundSoldier] = useState<SoldierData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [letters, setLetters] = useState<LetterArchiveRecord[]>([]);

  function handleSearch() {
    const trimmed = searchText.trim();
    if (!trimmed) return;
    const soldier = getSoldiers().find((s) => s.militaryId === trimmed);
    if (soldier) {
      setFoundSoldier(soldier);
      setNotFound(false);
      setLetters(getLettersBySoldierMilitaryId(trimmed));
    } else {
      setFoundSoldier(null);
      setNotFound(true);
      setLetters([]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSearch();
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Search row */}
      <div className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[52px] w-full" dir="rtl">
        <input
          type="text"
          placeholder="ابحث بالرقم العسكري"
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setNotFound(false); }}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-right"
          style={{ ...F, fontSize: 15, color: "#2d3648" }}
          dir="rtl"
        />
        <button type="button" onClick={handleSearch}>
          <Search size={18} className="shrink-0 text-[#2d3648]" />
        </button>
      </div>

      {notFound && (
        <p className="text-right" style={{ ...F, fontSize: 14, color: "#ef4444" }}>
          لا يوجد فرد بهذا الرقم العسكري
        </p>
      )}

      {foundSoldier && (
        <>
          <SoldierCard soldier={foundSoldier} />
          <LettersTable records={letters} onView={onView} onPrint={onPrint} />
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function LettersArchivePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"general" | "individual">("general");

  function handleView(id: string) {
    navigate(`/dashboard/letters-archive/${id}`);
  }

  function handlePrint(id: string) {
    navigate(`/dashboard/letters-archive/${id}`);
  }

  const activeTabStyle: React.CSSProperties = {
    background: "linear-gradient(to bottom, #00b867, #00522e)",
    color: "#fff",
    border: "none",
    ...F,
    fontSize: 16,
    borderRadius: 8,
    padding: "10px 28px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
  const inactiveTabStyle: React.CSSProperties = {
    background: "#fff",
    color: "#2d3648",
    border: "1px solid #e2e7f0",
    ...F,
    fontSize: 16,
    borderRadius: 8,
    padding: "10px 28px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">

      {/* Title */}
      <h1
        className="text-center"
        style={{ ...F, fontWeight: 700, fontSize: "clamp(22px,4vw,32px)", color: "#2d3648", lineHeight: 1.5 }}
      >
        سجل الخطابات
      </h1>

      {/* بحث حسب label + tabs */}
      <div className="flex flex-col gap-3 items-end w-full">
        <p style={{ ...F, fontSize: 16, color: "#2d3648" }}>بحث حسب</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            style={tab === "individual" ? activeTabStyle : inactiveTabStyle}
            onClick={() => setTab("individual")}
          >
            الفرد
          </button>
          <button
            type="button"
            style={tab === "general" ? activeTabStyle : inactiveTabStyle}
            onClick={() => setTab("general")}
          >
            الارشيف العام
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === "general"
        ? <GeneralArchiveTab onView={handleView} onPrint={handlePrint} />
        : <IndividualTab onView={handleView} onPrint={handlePrint} />
      }

    </div>
  );
}
