import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Calendar,
  ChevronDown,
  Eye,
  Printer,
  CheckSquare,
  Square,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

type LetterArchiveRecord = {
  id: string;
  letterNumber: string;
  date: string;
  type: string;
  destination: string;
  soldiersCount: number;
  status: "موثق" | "غير موثق";
};

type SoldierData = {
  id: string;
  militaryId: string;
  name: string;
  rank: string;
  unit: string;
  attachmentPlace: string;
};

function StatusBadge({
  status,
}: {
  status: "موثق" | "غير موثق";
}) {
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
        style={{
          background: isVerified ? "#16a34a" : "#E37032",
        }}
      />

      {status}
    </span>
  );
}

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

function FilterDropdown({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex-1 min-w-[140px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-[52px] bg-white border border-[#e2e7f0] rounded-[8px] flex items-center gap-2 px-3 hover:border-[#a0aec0] transition-colors"
      >
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#2d3648] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />

        <span
          className="flex-1 text-right"
          style={{
            ...F,
            fontSize: 16,
            color: value ? "#2d3648" : "#4a5468",
          }}
        >
          {value || placeholder}
        </span>
      </button>

      {open && (
        <ul
          className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden"
          dir="rtl"
        >
          <li>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="w-full text-right px-4 py-2.5 hover:bg-[#f5f6fb]"
              style={{
                ...F,
                fontSize: 14,
                color: "#717d96",
              }}
            >
              الكل
            </button>
          </li>

          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={[
                  "w-full text-right px-4 py-2.5 transition-colors",
                  opt === value
                    ? "bg-[#f0f2fd] text-[#1f3d97]"
                    : "hover:bg-[#f5f6fb] text-[#2d3648]",
                ].join(" ")}
                style={{
                  ...F,
                  fontSize: 14,
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

function LettersTable({
  records,
  onView,
  onPrint,
  loading = false,
}: {
  records: LetterArchiveRecord[];
  onView: (id: string) => void;
  onPrint: (id: string) => void;
  loading?: boolean;
}) {
  const [checked, setChecked] = useState<Set<string>>(
    new Set()
  );

  const [allChecked, setAllChecked] = useState(false);

  function toggleRow(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function toggleAll() {
    if (allChecked) {
      setChecked(new Set());
      setAllChecked(false);
    } else {
      setChecked(new Set(records.map((r) => r.id)));
      setAllChecked(true);
    }
  }

  const thClass =
    "px-4 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]";

  const tdClass =
    "px-4 py-3 text-right border-b border-[#e2e7f0]";

  return (
    <div
      className="w-full overflow-x-auto rounded-[12px] border border-[#e2e7f0]"
      dir="rtl"
    >
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr>
            <th
              className={thClass}
              style={{ width: 44 }}
            >
              <button
                type="button"
                onClick={toggleAll}
                disabled={loading || records.length === 0}
              >
                {allChecked ? (
                  <CheckSquare
                    size={16}
                    style={{ color: "#1f3d97" }}
                  />
                ) : (
                  <Square
                    size={16}
                    style={{ color: "#a1aebe" }}
                  />
                )}
              </button>
            </th>

            {[
              "رقم الخطاب",
              "تاريخ الخطاب",
              "نوع الخطاب",
              "جهة الخطاب",
              "عدد الافراد",
              "حالة الخطاب",
              "الاجراء",
            ].map((h) => (
              <th
                key={h}
                className={thClass}
              >
                <div className="flex items-center gap-1 justify-start">
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#717d96",
                    }}
                  >
                    {h}
                  </span>

                  <SortIcon />
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={8}
                className="py-12 text-center"
              >
                <span
                  style={{
                    ...F,
                    fontSize: 15,
                    color: "#717d96",
                  }}
                >
                  جاري تحميل الخطابات...
                </span>
              </td>
            </tr>
          ) : records.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="py-12 text-center"
              >
                <span
                  style={{
                    ...F,
                    fontSize: 15,
                    color: "#a1aebe",
                  }}
                >
                  لا توجد نتائج
                </span>
              </td>
            </tr>
          ) : (
            records.map((rec) => (
              <tr
                key={rec.id}
                className="hover:bg-[#fafbff] transition-colors"
              >
                <td
                  className={tdClass}
                  style={{ width: 44 }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      toggleRow(rec.id)
                    }
                  >
                    {checked.has(rec.id) ? (
                      <CheckSquare
                        size={16}
                        style={{
                          color: "#1f3d97",
                        }}
                      />
                    ) : (
                      <Square
                        size={16}
                        style={{
                          color: "#a1aebe",
                        }}
                      />
                    )}
                  </button>
                </td>

                <td className={tdClass}>
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                    }}
                  >
                    {rec.letterNumber}
                  </span>
                </td>

                <td className={tdClass}>
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                    }}
                  >
                    {rec.date}
                  </span>
                </td>

                <td className={tdClass}>
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                    }}
                  >
                    {rec.type}
                  </span>
                </td>

                <td className={tdClass}>
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                    }}
                  >
                    {rec.destination}
                  </span>
                </td>

                <td className={tdClass}>
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                    }}
                  >
                    {rec.soldiersCount}
                  </span>
                </td>

                <td className={tdClass}>
                  <StatusBadge status={rec.status} />
                </td>

                <td className={tdClass}>
                  <div className="flex items-center gap-2 justify-start">
                    <button
                      type="button"
                      onClick={() =>
                        onPrint(rec.id)
                      }
                      className="w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: "#ebedfd",
                      }}
                      title="طباعة"
                    >
                      <Printer
                        size={14}
                        style={{
                          color: "#2d3648",
                        }}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onView(rec.id)
                      }
                      className="w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: "#f0f2fd",
                      }}
                      title="عرض"
                    >
                      <Eye
                        size={14}
                        style={{
                          color: "#1f3d97",
                        }}
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function GeneralArchiveTab({
  onView,
  onPrint,
}: {
  onView: (id: string) => void;
  onPrint: (id: string) => void;
}) {
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [records, setRecords] =
    useState<LetterArchiveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadLetters() {
      setLoading(true);
      setError("");

      try {
        const { data, error } = await supabase
          .from("letters")
          .select(`
            id,
            letter_number,
            letter_date,
            reason,
            personnel_count,
            status,
            letter_type_id,
            letter_types (
              id,
              name,
              code
            )
          `)
          .order("letter_date", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        if (!mounted) return;

        const mapped: LetterArchiveRecord[] =
          (data ?? []).map((row: any) => {
            const letterType =
              Array.isArray(row.letter_types)
                ? row.letter_types[0]
                : row.letter_types;

            return {
              id: row.id,
              letterNumber:
                row.letter_number != null
                  ? String(row.letter_number)
                  : "-",
              date: row.letter_date
                ? new Date(
                    `${row.letter_date}T00:00:00`
                  ).toLocaleDateString("en-GB")
                : "-",
              type:
                letterType?.name ??
                (letterType?.code === "DEATTACH"
                  ? "إنهاء إلحاق"
                  : letterType?.code === "ATTACH"
                  ? "إلحاق"
                  : "-"),
              destination: row.reason || "-",
              soldiersCount:
                Number(row.personnel_count) || 0,
              status:
                row.status === "DOCUMENTED"
                  ? "موثق"
                  : "غير موثق",
            };
          });

        setRecords(mapped);
      } catch (err: any) {
        console.error("LOAD LETTERS ERROR:", err);

        if (!mounted) return;

        setError(
          err?.message ||
            err?.details ||
            err?.hint ||
            "حدث خطأ أثناء تحميل الخطابات."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadLetters();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return records.filter((l) => {
      if (
        filterStatus &&
        l.status !== filterStatus
      ) {
        return false;
      }

      if (
        filterType &&
        l.type !== filterType
      ) {
        return false;
      }

      if (
        searchText &&
        !l.letterNumber
          .toLowerCase()
          .includes(
            searchText.trim().toLowerCase()
          ) &&
        !l.destination
          .toLowerCase()
          .includes(
            searchText.trim().toLowerCase()
          )
      ) {
        return false;
      }

      if (dateFrom) {
        const from = new Date(dateFrom);
        const parts = l.date.split("/");

        const letterDate =
          parts.length === 3
            ? new Date(
                `${parts[2]}-${parts[1]}-${parts[0]}`
              )
            : null;

        if (
          letterDate &&
          letterDate < from
        ) {
          return false;
        }
      }

      if (dateTo) {
        const to = new Date(dateTo);
        const parts = l.date.split("/");

        const letterDate =
          parts.length === 3
            ? new Date(
                `${parts[2]}-${parts[1]}-${parts[0]}`
              )
            : null;

        if (
          letterDate &&
          letterDate > to
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    records,
    searchText,
    filterStatus,
    filterType,
    dateFrom,
    dateTo,
  ]);

  return (
    <div className="flex flex-col gap-5 w-full">
      {error && (
        <div
          className="rounded-[8px] px-4 py-3"
          style={{
            ...F,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      <div
        className="flex flex-wrap gap-3 items-stretch w-full"
        dir="rtl"
      >
        <div
          className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[52px] flex-[2] min-w-[200px]"
          dir="rtl"
        >
          <input
            type="text"
            placeholder="ابحث برقم الخطاب او جهة الخطاب"
            value={searchText}
            onChange={(e) =>
              setSearchText(e.target.value)
            }
            className="w-full bg-transparent outline-none text-right"
            style={{
              ...F,
              fontSize: 15,
              color: "#2d3648",
            }}
            dir="rtl"
          />

          <Search
            size={18}
            className="shrink-0 text-[#2d3648]"
          />
        </div>

        <div
          className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[52px] min-w-[170px]"
          dir="rtl"
        >
          <Calendar
            size={16}
            className="shrink-0 text-[#2d3648]"
          />

          <input
            type="date"
            value={dateFrom}
            onChange={(e) =>
              setDateFrom(e.target.value)
            }
            className="flex-1 text-right bg-transparent outline-none"
            style={{
              ...F,
              fontSize: 14,
              color: "#4a5468",
            }}
          />
        </div>

        <div
          className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[52px] min-w-[170px]"
          dir="rtl"
        >
          <Calendar
            size={16}
            className="shrink-0 text-[#2d3648]"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) =>
              setDateTo(e.target.value)
            }
            className="flex-1 text-right bg-transparent outline-none"
            style={{
              ...F,
              fontSize: 14,
              color: "#4a5468",
            }}
          />
        </div>

        <FilterDropdown
          placeholder="عرض حسب الحالة"
          options={["موثق", "غير موثق"]}
          value={filterStatus}
          onChange={setFilterStatus}
        />

        <FilterDropdown
          placeholder="عرض حسب النوع"
          options={["الحاق", "إنهاء الحاق"]}
          value={filterType}
          onChange={setFilterType}
        />
      </div>

      <LettersTable
        records={filtered}
        onView={onView}
        onPrint={onPrint}
        loading={loading}
      />
    </div>
  );
}

function SoldierCard({
  soldier,
}: {
  soldier: SoldierData;
}) {
  return (
    <div
      className="w-full bg-white rounded-[12px] border border-[#e2e7f0] px-5 py-4 flex flex-wrap items-center justify-between gap-4"
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <span
          style={{
            ...F,
            fontSize: 17,
            color: "#2d3648",
            fontWeight: 700,
          }}
        >
         {soldier.name}
        </span>

        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
          style={{
            background: "#dbeafe",
            ...F,
            fontSize: 12,
            fontWeight: 700,
            color: "#1e40af",
          }}
        >
          فرد
        </span>
      </div>

      <div
        className="flex flex-wrap gap-5"
        dir="rtl"
      >
        <div className="flex items-center gap-1.5">
          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#717d96",
            }}
          >
            الرقم العسكري
          </span>

          <span>:</span>

          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#2d3648",
            }}
          >
            {soldier.militaryId}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#717d96",
            }}
          >
            الرتبة
          </span>

          <span>:</span>

          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#2d3648",
            }}
          >
            {soldier.rank}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#717d96",
            }}
          >
            الوحدة الاساسية
          </span>

          <span>:</span>

          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#2d3648",
            }}
          >
            {soldier.unit}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#717d96",
            }}
          >
            وحدة الالحاق
          </span>

          <span>:</span>

          <span
            style={{
              ...F,
              fontSize: 13,
              color: "#2d3648",
            }}
          >
            {soldier.attachmentPlace}
          </span>
        </div>
      </div>
    </div>
  );
}

function IndividualTab({
  onView,
  onPrint,
}: {
  onView: (id: string) => void;
  onPrint: (id: string) => void;
}) {
  const [searchText, setSearchText] =
    useState("");

  const [foundSoldier, setFoundSoldier] =
    useState<SoldierData | null>(null);

  const [notFound, setNotFound] =
    useState(false);

  const [letters, setLetters] =
    useState<LetterArchiveRecord[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSearch() {
    const trimmed = searchText.trim();

    if (!trimmed) {
      return;
    }

    setLoading(true);
    setError("");
    setNotFound(false);
    setFoundSoldier(null);
    setLetters([]);

    try {
      /*
       * =====================================================
       * 1) البحث عن الفرد + الرتبة + الوحدة الأساسية
       *    + وحدة الإلحاق في نفس الاستعلام
       * =====================================================
       *
       * مهم:
       * primary_unit_id -> units.id
       * attachment_unit_id -> units.id
       * rank_id -> ranks.id
       */

      const {
        data: personnel,
        error: personnelError,
      } = await supabase
        .from("personnel")
        .select(`
          id,
          military_number,
          full_name,
          rank_id,
          primary_unit_id,
          attachment_unit_id,

          rank:ranks!rank_id (
            id,
            name
          ),

          primary_unit:units!primary_unit_id (
            id,
            name,
            code
          ),

          attachment_unit:units!attachment_unit_id (
            id,
            name,
            code
          )
        `)
        .eq("military_number", trimmed)
        .maybeSingle();

      if (personnelError) {
        throw personnelError;
      }

      if (!personnel) {
        setNotFound(true);
        return;
      }
console.log("FOUND PERSONNEL:", {
  id: personnel.id,
  military_number: personnel.military_number,
});
      /*
       * =====================================================
       * 2) استخراج بيانات الرتبة والوحدات
       * =====================================================
       */

      const rank = Array.isArray(personnel.rank)
        ? personnel.rank[0]
        : personnel.rank;

      const primaryUnit = Array.isArray(
        personnel.primary_unit
      )
        ? personnel.primary_unit[0]
        : personnel.primary_unit;

      const attachmentUnit = Array.isArray(
        personnel.attachment_unit
      )
        ? personnel.attachment_unit[0]
        : personnel.attachment_unit;

      const soldier: SoldierData = {
        id: personnel.id,

        militaryId:
          personnel.military_number ??
          trimmed,

        name:
          personnel.full_name ?? "-",

        rank:
          rank?.name ??
          "-",

        unit:
          primaryUnit?.name ??
          "-",

        attachmentPlace:
          attachmentUnit?.name ??
          "لا يوجد",
      };

      setFoundSoldier(soldier);

      /*
       * =====================================================
       * 3) جلب كل الخطابات المرتبطة بالفرد
       *
       * الربط:
       *
       * personnel.id
       *       ↓
       * letter_personnel.personnel_id
       *       ↓
       * letter_personnel.letter_id
       *       ↓
       * letters.id
       * =====================================================
       */

      const { data: links, error: linksError } =
  await supabase
    .from("letter_personnel")
    .select("letter_id")
    .eq("personnel_id", personnel.id);
console.log("PERSONNEL ID USED:", personnel.id);
console.log("LINKS RESULT:", links);
console.log("LINKS ERROR:", linksError);
if (linksError) {
  throw linksError;
}

const letterIds = (links ?? [])
  .map((row) => row.letter_id)
  .filter(Boolean);

if (letterIds.length === 0) {
  setLetters([]);
  return;
}

const { data: lettersData, error: lettersError } =
  await supabase
    .from("letters")
    .select(`
      id,
      letter_number,
      letter_date,
      reason,
      personnel_count,
      status,
      letter_type_id,
      letter_types (
        id,
        name,
        code
      )
    `)
    .in("id", letterIds)
    .order("letter_date", {
      ascending: false,
    });

if (lettersError) {
  throw lettersError;
}

const mapped: LetterArchiveRecord[] =
  (lettersData ?? []).map((letter: any) => {
    const letterType = Array.isArray(letter.letter_types)
      ? letter.letter_types[0]
      : letter.letter_types;

    return {
      id: letter.id,
      letterNumber:
        letter.letter_number != null
          ? String(letter.letter_number)
          : "-",

      date: letter.letter_date
        ? new Date(
            `${letter.letter_date}T00:00:00`
          ).toLocaleDateString("en-GB")
        : "-",

      type:
        letterType?.name ??
        (letterType?.code === "DEATTACH"
          ? "إنهاء إلحاق"
          : letterType?.code === "ATTACH"
            ? "إلحاق"
            : "-"),

      destination: letter.reason || "-",

      soldiersCount:
        Number(letter.personnel_count) || 0,

      status:
        letter.status === "DOCUMENTED"
          ? "موثق"
          : "غير موثق",
    };
  });

setLetters(mapped);

      setLetters(mapped);
    } catch (err: any) {
      console.error(
        "SEARCH SOLDIER LETTERS ERROR:",
        err
      );

      setError(
        err?.message ||
          err?.details ||
          err?.hint ||
          "حدث خطأ أثناء البحث."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Enter") {
      void handleSearch();
    }
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {error && (
        <div
          className="rounded-[8px] px-4 py-3"
          style={{
            ...F,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          <div className="font-bold mb-1">
            حدث خطأ أثناء البحث:
          </div>

          <div
            dir="ltr"
            className="text-left"
          >
            {error}
          </div>
        </div>
      )}

      <div
        className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[52px] w-full"
        dir="rtl"
      >
        <input
          type="text"
          placeholder="ابحث بالرقم العسكري"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setNotFound(false);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-right"
          style={{
            ...F,
            fontSize: 15,
            color: "#2d3648",
          }}
          dir="rtl"
        />

        <button
          type="button"
          onClick={() =>
            void handleSearch()
          }
          disabled={loading}
          className="disabled:opacity-50"
        >
          <Search
            size={18}
            className="shrink-0 text-[#2d3648]"
          />
        </button>
      </div>

      {loading && (
        <p
          className="text-right"
          style={{
            ...F,
            fontSize: 14,
            color: "#717d96",
          }}
        >
          جاري البحث في قاعدة البيانات...
        </p>
      )}

      {notFound && !loading && (
        <p
          className="text-right"
          style={{
            ...F,
            fontSize: 14,
            color: "#ef4444",
          }}
        >
          لا يوجد فرد بهذا الرقم العسكري
        </p>
      )}

      {foundSoldier && !loading && (
        <>
          <SoldierCard
            soldier={foundSoldier}
          />

          <LettersTable
            records={letters}
            onView={onView}
            onPrint={onPrint}
          />
        </>
      )}
    </div>
  );
}

export function LettersArchivePage() {
  const navigate = useNavigate();

  const [tab, setTab] =
    useState<
      "general" | "individual"
    >("general");

  function handleView(id: string) {
    navigate(
      `/dashboard/letters-archive/${id}`
    );
  }

  function handlePrint(id: string) {
    navigate(
      `/dashboard/letters-archive/${id}`
    );
  }

  const activeTabStyle: React.CSSProperties = {
    background:
      "linear-gradient(to bottom, #00b867, #00522e)",
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
    <div
      className="flex flex-col gap-6 w-full pb-10"
      dir="rtl"
    >
      <h1
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize:
            "clamp(22px,4vw,32px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        سجل الخطابات
      </h1>

      <div className="flex flex-col gap-3 items-start w-full">
        <p
          style={{
            ...F,
            fontSize: 16,
            color: "#2d3648",
          }}
        >
          بحث حسب
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            style={
              tab === "general"
                ? activeTabStyle
                : inactiveTabStyle
            }
            onClick={() =>
              setTab("general")
            }
          >
            الارشيف العام
          </button>

          <button
            type="button"
            style={
              tab === "individual"
                ? activeTabStyle
                : inactiveTabStyle
            }
            onClick={() =>
              setTab("individual")
            }
          >
            الفرد
          </button>
        </div>
      </div>

      {tab === "general" ? (
        <GeneralArchiveTab
          onView={handleView}
          onPrint={handlePrint}
        />
      ) : (
        <IndividualTab
          onView={handleView}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
}