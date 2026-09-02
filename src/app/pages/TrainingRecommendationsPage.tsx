import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Printer, Plus, Pencil, Trash2, X } from "lucide-react";

import { supabase } from "../../lib/supabase";

import {
  fetchRecommendations,
  deleteRecommendation,
  getListTypeLabel,
  getStageLabel,
  STAGE_MONTHS,
  LIST_TYPE_LABELS,
  type ListType,
  type TrainingRecommendation,
} from "../../lib/trainingRecommendations";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

const PF: React.CSSProperties = {
  fontFamily: "'Times New Roman', Times, serif",
};

function normalizeArabicSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ة/g, "ه")
    .replace(/ي/g, "ى")
    .replace(/أ|إ|آ/g, "ا");
}

type PrintColumnKey =
  | "national_id"
  | "triple_number"
  | "qualification"
  | "recruitment_area"
  | "required_weapon"
  | "current_weapon"
  | "required_unit"
  | "current_unit"
  | "recommender"
  | "notes";

interface PrintColumnDef {
  key: PrintColumnKey;
  label: string;
}

const PRINT_COLUMNS: PrintColumnDef[] = [
  { key: "national_id", label: "الرقم القومي" },
  { key: "triple_number", label: "الرقم الثلاثي" },
  { key: "qualification", label: "المؤهل" },
  { key: "recruitment_area", label: "المنطقة" },
  { key: "required_weapon", label: "السلاح المطلوب" },
  { key: "current_weapon", label: "السلاح الحالي" },
  { key: "required_unit", label: "الوحدة المطلوبة" },
  { key: "current_unit", label: "الوحدة الحالية" },
  { key: "recommender", label: "الموصي" },
  { key: "notes", label: "ملاحظات" },
];

const DEFAULT_SELECTED_COLUMNS: Record<PrintColumnKey, boolean> = {
  national_id: true,
  triple_number: true,
  qualification: true,
  recruitment_area: true,
  required_weapon: true,
  current_weapon: true,
  required_unit: true,
  current_unit: true,
  recommender: true,
  notes: true,
};

function PrintColumnsModal({
  selectedColumns,
  onToggleColumn,
  onSelectAll,
  onDeselectAll,
  includeSignature,
  onToggleSignature,
  onCancel,
  onConfirm,
}: {
  selectedColumns: Record<PrintColumnKey, boolean>;
  onToggleColumn: (key: PrintColumnKey) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  includeSignature: boolean;
  onToggleSignature: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4"
      onClick={onCancel}
    >
      <div
        dir="rtl"
        className="bg-white rounded-[16px] p-6 w-full max-w-md flex flex-col gap-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            style={{
              ...F,
              fontSize: 18,
              fontWeight: 700,
              color: "#2d3648",
            }}
          >
            اختر بيانات الطباعة
          </h2>

          <button
            type="button"
            onClick={onCancel}
            className="text-[#aaa] hover:text-[#555]"
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ ...F, fontSize: 13, color: "#717d96" }}>
          عمودا "م" و"الاسم" يظهران دائمًا في الكشف. اختر باقي البيانات
          المطلوب طباعتها.
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-sm px-3 py-1.5 rounded-[6px] border border-[#e2e7f0] hover:bg-[#f5f6fb]"
            style={{ ...F, fontSize: 13, color: "#1f3d97" }}
          >
            تحديد الكل
          </button>

          <button
            type="button"
            onClick={onDeselectAll}
            className="text-sm px-3 py-1.5 rounded-[6px] border border-[#e2e7f0] hover:bg-[#f5f6fb]"
            style={{ ...F, fontSize: 13, color: "#717d96" }}
          >
            إلغاء التحديد
          </button>
        </div>

        <div className="w-full h-px bg-[#eff0f6]" />

        <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto">
          {PRINT_COLUMNS.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2.5 cursor-pointer px-1 py-1.5 rounded-[6px] hover:bg-[#f5f6fb]"
            >
              <input
                type="checkbox"
                checked={selectedColumns[col.key]}
                onChange={() => onToggleColumn(col.key)}
                className="w-4 h-4 accent-[#00b867]"
              />

              <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                {col.label}
              </span>
            </label>
          ))}
        </div>

        <div className="w-full h-px bg-[#eff0f6]" />

        <label className="flex items-center gap-2.5 cursor-pointer px-1 py-1.5 rounded-[6px] hover:bg-[#f5f6fb]">
          <input
            type="checkbox"
            checked={includeSignature}
            onChange={onToggleSignature}
            className="w-4 h-4 accent-[#00b867]"
          />

          <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
            إظهار بلوك التوقيع في الكشف
          </span>
        </label>

        <div className="flex items-center gap-2 justify-start pt-2">
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-[8px]"
            style={{
              background: "linear-gradient(to bottom,#00b867,#00522e)",
              ...F,
              fontSize: 14,
              color: "#fff",
            }}
          >
            طباعة الكشف
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-[8px]"
            style={{ ...F, fontSize: 14, color: "#888" }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

export function TrainingRecommendationsPage() {
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, i) => currentYear + i),
    [currentYear]
  );

  const [stageYear, setStageYear] = useState(currentYear);
  const [stageMonth, setStageMonth] = useState(STAGE_MONTHS[0].value);
  const [listType, setListType] = useState<ListType>("COMMANDER");

  const [hasSearched, setHasSearched] = useState(false);
  const [rows, setRows] = useState<TrainingRecommendation[]>([]);
  const [nameFilter, setNameFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showPrintModal, setShowPrintModal] = useState(false);

  const [selectedColumns, setSelectedColumns] = useState<
    Record<PrintColumnKey, boolean>
  >(DEFAULT_SELECTED_COLUMNS);

  const [includeSignature, setIncludeSignature] = useState(true);

  async function handleSearch() {
    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const data = await fetchRecommendations({
        stageMonth,
        stageYear,
        listType,
      });

      setRows(data);
    } catch (err: any) {
      console.error("Fetch recommendations error:", err);
      setError(
        err?.message || "حدث خطأ أثناء تحميل بيانات التوصيات"
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = useMemo(() => {
    const term = normalizeArabicSearch(nameFilter);

    if (!term) return rows;

    return rows.filter((row) =>
      normalizeArabicSearch(row.full_name).includes(term)
    );
  }, [rows, nameFilter]);

  async function handleDelete(row: TrainingRecommendation) {
    const confirmed = window.confirm(
      `هل تريد حذف توصية الفرد "${row.full_name}"؟`
    );

    if (!confirmed) return;

    setDeletingId(row.id);
    setError("");

    try {
      await deleteRecommendation(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err: any) {
      console.error("Delete recommendation error:", err);
      setError(err?.message || "حدث خطأ أثناء حذف التوصية");
    } finally {
      setDeletingId(null);
    }
  }

  function handlePrintClick() {
    if (filteredRows.length === 0) return;
    setShowPrintModal(true);
  }

  function toggleColumn(key: PrintColumnKey) {
    setSelectedColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function selectAllColumns() {
    const all = { ...DEFAULT_SELECTED_COLUMNS };

    (Object.keys(all) as PrintColumnKey[]).forEach((key) => {
      all[key] = true;
    });

    setSelectedColumns(all);
  }

  function deselectAllColumns() {
    const none = { ...DEFAULT_SELECTED_COLUMNS };

    (Object.keys(none) as PrintColumnKey[]).forEach((key) => {
      none[key] = false;
    });

    setSelectedColumns(none);
  }

  function toggleSignature() {
    setIncludeSignature((prev) => !prev);
  }

  function handleConfirmPrint() {
    setShowPrintModal(false);
    executePrint();
  }

  async function executePrint() {
    let branchHeadName = "جاري تحميل الاسم";
    let branchHeadRank = "جاري تحميل الرتبة";

    if (includeSignature) {
      try {
        const { data: branchHead, error: branchError } = await supabase
          .from("branch_heads")
          .select(`
            full_name,
            rank:letter_officer_ranks!branch_heads_rank_id_fkey(name)
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!branchError && branchHead) {
          const rank = Array.isArray(branchHead.rank)
            ? branchHead.rank[0]
            : branchHead.rank;

          branchHeadName = branchHead.full_name ?? "-";
          branchHeadRank = rank?.name ?? "";
        }
      } catch (err) {
        console.error("Load branch head error:", err);
      }
    }

    const printWindow = window.open("", "_blank", "width=1000,height=1200");

    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    const stageLabel = getStageLabel(stageMonth, stageYear);
    const listLabel = LIST_TYPE_LABELS[listType];

    const toArabicDigits = (value: string | number | null | undefined) => {
      if (value == null || value === "") return "-";

      return String(value).replace(/\d/g, (d) =>
        "٠١٢٣٤٥٦٧٨٩"[Number(d)]
      );
    };

    const activeColumns = PRINT_COLUMNS.filter(
      (col) => selectedColumns[col.key]
    );

    const tableHeaders = `
      <th>م</th>
      <th>الاسم</th>
      ${activeColumns.map((col) => `<th>${col.label}</th>`).join("")}
    `;

    function getColumnValue(
      row: TrainingRecommendation,
      key: PrintColumnKey
    ): string {
      switch (key) {
        case "national_id":
          return toArabicDigits(row.national_id);
        case "triple_number":
          return toArabicDigits(row.triple_number);
        case "qualification":
          return row.qualification ?? "-";
        case "recruitment_area":
          return row.recruitment_area ?? "-";
        case "required_weapon":
          return toArabicDigits(row.required_weapon ?? "-");
        case "current_weapon":
          return toArabicDigits(row.current_weapon ?? "-");
        case "required_unit":
          return toArabicDigits(row.required_unit ?? "-");
        case "current_unit":
          return toArabicDigits(row.current_unit ?? "-");
        case "recommender":
          return row.recommender ?? "-";
        case "notes":
          return "";
        default:
          return "-";
      }
    }

    const tableRows = filteredRows
      .map((row, index) => {
        const cells = activeColumns
          .map((col) => `<td>${getColumnValue(row, col.key)}</td>`)
          .join("");

        return `
          <tr>
            <td>${toArabicDigits(index + 1)}</td>
            <td>${row.full_name}</td>
            ${cells}
          </tr>
        `;
      })
      .join("");

    printWindow.document.open();

    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat("ar-EG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date());

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>كشف توصيات ${stageLabel} - ${listLabel}</title>

          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            html, body {
              height: 100%;
            }

            body {
              margin: 0;
              padding: 0;
              direction: rtl;
              font-family: 'Times New Roman', Times, serif;
              min-height: calc(210mm - 20mm);
              display: flex;
              flex-direction: column;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
              padding-bottom: 10px;
              border-bottom: 1px solid #999;
            }

            .header-text p {
              margin: 2px 0;
              font-size: 14px;
              font-weight: bold;
              text-align: center;
            }

            .header-text {
              text-align: right;
            }

            .logo {
              width: 70px;
              height: 70px;
              object-fit: contain;
            }

            .title {
              text-align: center;
              margin: 16px 0;
            }

            .title h1 {
              font-size: 18px;
              margin: 0;
            }

            .title h2 {
              font-size: 15px;
              margin: 4px 0 0;
              font-weight: 400;
            }

            .table-container {
              flex: 1;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }

            th, td {
              border: 1px solid #999;
              padding: 6px;
              text-align: center;
            }

            th {
              background: #f0f0f0;
            }

            .signature-block {
              margin-top: auto;
              width: fit-content;
              max-width: 60%;
              display: flex;
              flex-direction: column;
              align-items: stretch;
              margin-left: 0;
              margin-right: auto;
              text-align: right;
            }

            .signature-block p {
              margin: 4px 0;
              font-weight: 700;
              font-size: 14px;
              text-align: justify;
              text-align-last: justify;
              width: 100%;
            }

            .sig-line {
              white-space: pre;
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div class="header-text">
              <p>قيـادة قـوات الصـاعقـــة</p>
              <p>فـــرع التنظيـــم والإدارة</p>
              <p>التاريخ: ${formattedDate}</p>
            </div>
                      <div class="title">
           <h1>كشف توصيات المرحلة التجنيدية ${toArabicDigits(stageLabel)}</h1>
                        <h2>(${toArabicDigits(listLabel)})</h2>
          </div>
            <img
              src="https://qgsqlqlkdppxljyjujsq.supabase.co/storage/v1/object/sign/images/Logo_Ranger.png?token=eyJraWQiOiJlZTY4MzBjYi1hMmVmLTQyN2EtOWRiZi1hNWZmZmY0MjFjY2QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvTG9nb19SYW5nZXIucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4ODE2OTY2OCwiZXhwIjozMzMyNDE2OTY2OH0.tkuKl6uwrAXAaGcMC5r2hGtXP9uWCREsbZYcBxdgdFw"
              class="logo"
              alt="Logo"
            />
          </div>



          <div class="table-container">
            <table>
              <thead>
                <tr>
                  ${tableHeaders}
                </tr>
              </thead>

              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>

          ${
            includeSignature
              ? `
          <div class="signature-block">
            <p class="sig-line">التوقيع (                                  )</p>
            <p class="sig-name">${branchHeadRank} / ${branchHeadName}</p>
            <p class="sig-title">رئيـــــس فــــــرع التنظيــــم والإدارة</p>
          </div>
          `
              : ""
          }
        </body>
      </html>
    `);

    printWindow.document.close();

    const doPrint = () => {
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };

    if (printWindow.document.readyState === "complete") {
      doPrint();
    } else {
      printWindow.onload = doPrint;
    }
  }

  const thClass =
    "px-4 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]";
  const tdClass = "px-4 py-3 text-right border-b border-[#e2e7f0]";

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between w-full flex-wrap gap-3">
        <h1
          style={{
            ...F,
            fontWeight: 700,
            fontSize: "clamp(22px,4vw,32px)",
            color: "#2d3648",
          }}
        >
          كشوف التوصيات
        </h1>

        <button
          type="button"
          onClick={() =>
            navigate("/dashboard/training-recommendations/new")
          }
          className="flex items-center gap-2 h-[46px] px-5 rounded-[8px]"
          style={{
            background: "linear-gradient(to bottom,#00b867,#00522e)",
          }}
        >
          <Plus size={18} color="#fff" />
          <span style={{ ...F, fontSize: 15, color: "#fff" }}>
            إضافة توصية جديدة
          </span>
        </button>
      </div>

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            ...F,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] p-5">
        <div className="flex flex-wrap items-end gap-3 w-full">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>
              السنة
            </label>

            <select
              value={stageYear}
              onChange={(e) => setStageYear(Number(e.target.value))}
              dir="rtl"
              className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>
              المرحلة التجنيدية
            </label>

            <select
              value={stageMonth}
              onChange={(e) => setStageMonth(Number(e.target.value))}
              dir="rtl"
              className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              {STAGE_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>
              نوع الكشف
            </label>

            <select
              value={listType}
              onChange={(e) => setListType(e.target.value as ListType)}
              dir="rtl"
              className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              {Object.entries(LIST_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="h-[44px] px-6 rounded-[8px] disabled:opacity-50"
            style={{
              background: "linear-gradient(to bottom,#00b867,#00522e)",
              ...F,
              fontSize: 14,
              color: "#fff",
            }}
          >
            {loading ? "جاري التحميل..." : "عرض"}
          </button>
        </div>
      </section>

      {hasSearched && (
        <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e2e7f0] flex items-center justify-between flex-wrap gap-2">
            <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
              كشف توصيات {getStageLabel(stageMonth, stageYear)} —{" "}
              {LIST_TYPE_LABELS[listType]} ({filteredRows.length} فرد)
            </span>

            <button
              type="button"
              onClick={handlePrintClick}
              disabled={filteredRows.length === 0}
              className="flex items-center gap-1.5 h-[36px] px-4 rounded-[8px] disabled:opacity-40"
              style={{ background: "#DCF4DF" }}
            >
              <Printer size={15} color="#2d3648" />
              <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                طباعة الكشف
              </span>
            </button>
          </div>

          {rows.length > 0 && (
            <div className="px-6 py-4 border-b border-[#e2e7f0]">
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="ابحث بالاسم أو جزء منه..."
                dir="rtl"
                className="w-full max-w-sm h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
                style={{ ...F, fontSize: 14, color: "#2d3648" }}
              />
            </div>
          )}

          {rows.length === 0 ? (
            <div className="py-16 text-center">
              <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
                لا توجد توصيات مسجلة لهذه المرحلة ونوع الكشف
              </p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-16 text-center">
              <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
                لا توجد نتائج مطابقة للبحث
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={thClass}>
                      <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                        الاسم
                      </span>
                    </th>

                    <th className={thClass}>
                      <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                        الرقم القومي
                      </span>
                    </th>

                    <th className={thClass}>
                      <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                        الرقم الثلاثي
                      </span>
                    </th>

                    <th className={thClass}>
                      <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                        الموصي
                      </span>
                    </th>

                    <th className={thClass}>
                      <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                        المنطقة
                      </span>
                    </th>

                    <th className={thClass}>
                      <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                        المؤهل
                      </span>
                    </th>

                    <th className={thClass}>
                      <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                        السلاح المطلوب
                      </span>
                    </th>

                    <th className={thClass}>
                      <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                        الوحدة المطلوبة
                      </span>
                    </th>

                    <th className={thClass}>
                      <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                        الإجراء
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#fafbff]">
                      <td className={tdClass}>
                        <span
                          style={{
                            ...F,
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#2d3648",
                          }}
                        >
                          {row.full_name}
                        </span>
                      </td>

                      <td className={tdClass}>
                        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                          {row.national_id || "-"}
                        </span>
                      </td>

                      <td className={tdClass}>
                        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                          {row.triple_number || "-"}
                        </span>
                      </td>

                      <td className={tdClass}>
                        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                          {row.recommender}
                        </span>
                      </td>

                      <td className={tdClass}>
                        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                          {row.recruitment_area}
                        </span>
                      </td>

                      <td className={tdClass}>
                        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                          {row.qualification ?? "-"}
                        </span>
                      </td>

                      <td className={tdClass}>
                        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                          {row.required_weapon ?? "-"}
                        </span>
                      </td>

                      <td className={tdClass}>
                        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                          {row.required_unit ?? "-"}
                        </span>
                      </td>

                      <td className={tdClass}>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/dashboard/training-recommendations/${row.id}`
                              )
                            }
                            className="w-8 h-8 rounded-[6px] flex items-center justify-center"
                            style={{ background: "#ebedfd" }}
                          >
                            <Pencil size={13} color="#1f3d97" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            disabled={deletingId === row.id}
                            className="w-8 h-8 rounded-[6px] flex items-center justify-center disabled:opacity-50"
                            style={{ background: "#fce8f1" }}
                          >
                            <Trash2 size={13} color="#e3282c" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {showPrintModal && (
        <PrintColumnsModal
          selectedColumns={selectedColumns}
          onToggleColumn={toggleColumn}
          onSelectAll={selectAllColumns}
          onDeselectAll={deselectAllColumns}
          includeSignature={includeSignature}
          onToggleSignature={toggleSignature}
          onCancel={() => setShowPrintModal(false)}
          onConfirm={handleConfirmPrint}
        />
      )}
    </div>
  );
}