import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowRight, Search, Printer, FileWarning } from "lucide-react";
import logoImg from "../../assets/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";
import { toArabicDigits } from "../../lib/normalizeDigits";
import {
  fetchUnitPersonnelWithStatus,
  fetchUnitName,
  type UnitPersonnelRow,
  type SocialRecordStatus,
} from "../../lib/socialRecords";
import { sortByRankHierarchy } from "../../lib/rankOrder";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

type StatusFilter = "all" | SocialRecordStatus;
type NameListColumnKey = "military_number" | "rank_name" | "full_name" | "record_status";

const COLUMN_ORDER: NameListColumnKey[] = ["military_number", "rank_name", "full_name", "record_status"];

const COLUMN_LABELS: Record<NameListColumnKey, string> = {
  military_number: "الرقم العسكري",
  rank_name: "الرتبة",
  full_name: "الاسم",
  record_status: "حالة السجل",
};

function getStatusLabel(status: SocialRecordStatus): string {
  if (status === "complete") return "له سجل";
  if (status === "incomplete") return "غير مكتمل";
  return "بدون سجل";
}

const PRINT_STYLE = `
  @page {
    size: A4;
    margin: 8mm;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Almarai', Arial, sans-serif;
    direction: rtl;
    color: #2d3648;
  }

  .page {
    border: 2px solid #cbd2e0;
    border-radius: 10px;
    padding: 18px 24px;
    min-height: 100%;
  }
  .header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #cbd2e0;
    padding-bottom: 10px;
    margin-bottom: 10px;
  }

  .header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .header-title {
    font-size: 18px;
    font-weight: 700;
  }

  .header-subtitle {
    font-size: 14px;
    font-weight: 700;
  }

  .header-system {
    font-size: 12px;
    color: #717d96;
  }

  .header-logo {
    width: 64px;
    height: 64px;
    object-fit: contain;
  }

  .header-title-box {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);

    border-radius: 6px;
    padding: 6px 18px;
    font-size: 18px;
    font-weight: 700;
    text-decoration: underline;
    white-space: nowrap;
  }

  .section-title {
    font-size: 15px;
    font-weight: 700;
    background: #f7f9fc;
    padding: 6px 10px;
    border-radius: 6px;
    margin-top: 16px;
    margin-bottom: 8px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-top: 4px;
  }

  th, td {
    border: 1px solid #e2e7f0;
    padding: 6px 8px;
    text-align: center;
  }

  th {
    background: #f7f9fc;
    font-weight: 700;
  }

  .empty-row {
    color: #a1aebe;
    padding: 12px;
  }
`;

function openPrintWindow(title: string, titleBoxText: string, bodyHtml: string) {
  const printWindow = window.open("", "_blank", "width=1000,height=1200");

  if (!printWindow) {
    alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
    return;
  }

  printWindow.document.open();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>${PRINT_STYLE}</style>
      </head>

      <body>
        <div class="page">
          <div class="header">
              <div class="header-text">
                <div class="header-title">قيادة قوات الصـاعقة</div>
                <div class="header-subtitle">فــــــرع التنظيــــم والإدارة</div>
                <div class="header-system"> المنظومـــة الالكترونيــــة للفرع</div>
              </div>

            <div class="header-title-box">${titleBoxText}</div>

            <img src="${logoImg}" class="header-logo" />
          </div>

          ${bodyHtml}
        </div>
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

export function SocialRecordUnitPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();

  const [unitName, setUnitName] = useState("");
  const [rows, setRows] = useState<UnitPersonnelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Record<NameListColumnKey, boolean>>({
    military_number: true,
    rank_name: true,
    full_name: true,
    record_status: true,
  });

  useEffect(() => {
    if (unitId) loadData(unitId);
  }, [unitId]);

  const sortedRows = useMemo(() => sortByRankHierarchy(rows), [rows]);

  const filteredRows = useMemo(() => {
    const trimmed = searchText.trim();

    return sortedRows.filter((row) => {
      const matchesSearch =
        !trimmed ||
        row.full_name.includes(trimmed) ||
        (row.military_number ?? "").includes(trimmed);

      const matchesStatus = statusFilter === "all" || row.record_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sortedRows, searchText, statusFilter]);

  const unitStats = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.record_status === "complete") acc.complete += 1;
        else if (row.record_status === "incomplete") acc.incomplete += 1;
        else acc.without += 1;
        return acc;
      },
      { total: 0, complete: 0, incomplete: 0, without: 0 }
    );
  }, [rows]);

  async function loadData(id: string) {
    setLoading(true);
    setError("");

    try {
      const [name, personnel] = await Promise.all([
        fetchUnitName(id),
        fetchUnitPersonnelWithStatus(id),
      ]);

      setUnitName(name);
      setRows(personnel);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل بيانات الوحدة");
    } finally {
      setLoading(false);
    }
  }

  function handlePrintNamesList() {
    const activeColumns = COLUMN_ORDER.filter((key) => selectedColumns[key]);

    if (activeColumns.length === 0) {
      alert("اختر عمود واحد على الأقل قبل الطباعة");
      return;
    }

    const ar = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined || value === "") return "-";
      return toArabicDigits(String(value));
    };

    const headHtml = activeColumns.map((key) => `<th>${COLUMN_LABELS[key]}</th>`).join("");

    const rowsHtml = filteredRows.length
      ? filteredRows
          .map((row) => {
            const cells = activeColumns
              .map((key) => {
                if (key === "military_number") return `<td>${ar(row.military_number)}</td>`;
                if (key === "rank_name") return `<td>${row.rank_name ?? "-"}</td>`;
                if (key === "full_name") return `<td>${row.full_name}</td>`;
                return `<td>${getStatusLabel(row.record_status)}</td>`;
              })
              .join("");
            return `<tr>${cells}</tr>`;
          })
          .join("")
      : `<tr><td colspan="${activeColumns.length}" class="empty-row">لا يوجد أفراد مطابقين</td></tr>`;

    const bodyHtml = `
      <div class="section-title">كشف أسماء أفراد وحدة ${unitName}</div>
      <table>
        <thead><tr>${headHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;

    setShowColumnPicker(false);
    openPrintWindow(`كشف أسماء - ${unitName}`, "كشف أسماء الأفراد", bodyHtml);
  }

  function handlePrintMissingFieldsReport() {
    const ar = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined || value === "") return "-";
      return toArabicDigits(String(value));
    };

    const targetRows = sortByRankHierarchy(rows).filter((row) => row.record_status !== "complete");

    const rowsHtml = targetRows.length
      ? targetRows
          .map(
            (row) => `
        <tr>
          <td>${ar(row.military_number)}</td>
          <td>${row.rank_name ?? "-"}</td>
          <td>${row.full_name}</td>
          <td>${getStatusLabel(row.record_status)}</td>
          <td style="text-align: right;">${row.missing_fields.join("، ")}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="5" class="empty-row">لا يوجد أفراد ناقصة بياناتهم</td></tr>`;

    const bodyHtml = `
      <div class="section-title">تقرير الحقول المفقودة - وحدة ${unitName}</div>
      <table>
        <thead>
          <tr>
            <th>الرقم العسكري</th>
            <th>الرتبة</th>
            <th>الاسم</th>
            <th>حالة السجل</th>
            <th>الحقول المفقودة</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;

    openPrintWindow(`تقرير الحقول المفقودة - ${unitName}`, "تقرير الحقول المفقودة", bodyHtml);
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 style={{ ...F, fontWeight: 700, fontSize: "clamp(20px,3.5vw,28px)", color: "#2d3648" }}>
          أفراد وحدة {unitName}
        </h1>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-[#e2e7f0] rounded-[8px] p-1" dir="rtl">
            {(
              [
                { key: "all", label: "الكل" },
                { key: "complete", label: "له سجل" },
                { key: "incomplete", label: "غير مكتمل" },
                { key: "none", label: "بدون سجل" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                className="px-3 h-[34px] rounded-[6px] transition-colors"
                style={{
                  ...F,
                  fontSize: 13,
                  fontWeight: 700,
                  background: statusFilter === opt.key ? "#00b867" : "transparent",
                  color: statusFilter === opt.key ? "#ffffff" : "#717d96",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div
            className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[42px] w-full sm:w-[260px]"
            dir="rtl"
          >
            <Search size={16} className="shrink-0 text-[#a1aebe]" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم العسكري"
              className="flex-1 bg-transparent outline-none text-right"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
              dir="rtl"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowColumnPicker(true)}
            className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px]"
            style={{ background: "#DCF4DF" }}
          >
            <Printer size={15} color="#2d3648" />
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>طباعة كشف الأسماء</span>
          </button>

          <button
            type="button"
            onClick={handlePrintMissingFieldsReport}
            className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px]"
            style={{ background: "#fef3c7" }}
          >
            <FileWarning size={15} color="#92400e" />
            <span style={{ ...F, fontSize: 13, color: "#92400e" }}>تقرير الحقول المفقودة</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/social-record")}
            className="flex items-center gap-1.5"
            style={{ ...F, fontSize: 14, color: "#1f3d97" }}
          >
            <ArrowRight size={16} />
            العودة للوحدات
          </button>
        </div>
      </div>

      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex flex-col gap-1">
            <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#2d3648" }}>{unitStats.total}</span>
            <span style={{ ...F, fontSize: 12, color: "#717d96" }}>إجمالي الأفراد</span>
          </div>

          <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex flex-col gap-1">
            <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#166534" }}>{unitStats.complete}</span>
            <span style={{ ...F, fontSize: 12, color: "#717d96" }}>له سجل</span>
          </div>

          <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex flex-col gap-1">
            <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#92400e" }}>{unitStats.incomplete}</span>
            <span style={{ ...F, fontSize: 12, color: "#717d96" }}>غير مكتمل</span>
          </div>

          <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex flex-col gap-1">
            <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#9d2e15" }}>{unitStats.without}</span>
            <span style={{ ...F, fontSize: 12, color: "#717d96" }}>بدون سجل</span>
          </div>
        </div>
      )}

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", ...F, fontSize: 14 }}
        >
          {error}
        </div>
      )}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <p style={{ ...F, fontSize: 14, color: "#717d96" }}>جاري تحميل البيانات...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>لا يوجد أفراد نشطون في هذه الوحدة</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-16 text-center">
            <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>لا يوجد نتائج مطابقة للبحث</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>الرقم العسكري</span>
                  </th>
                  <th className="px-5 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>الدرجة</span>
                  </th>
                  <th className="px-5 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>الاسم</span>
                  </th>
                  <th className="px-5 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>حالة السجل</span>
                  </th>
                  <th className="px-5 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]" />
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#fafbff]">
                    <td className="px-5 py-3 border-b border-[#e2e7f0]">
                      <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                        {row.military_number ?? "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3 border-b border-[#e2e7f0]">
                      <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{row.rank_name ?? "-"}</span>
                    </td>
                    <td className="px-5 py-3 border-b border-[#e2e7f0]">
                      <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{row.full_name}</span>
                    </td>

                    <td className="px-5 py-3 border-b border-[#e2e7f0]">
                      {row.record_status === "complete" ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                          style={{ background: "#dcfce7", ...F, fontSize: 12, fontWeight: 700, color: "#166534" }}
                        >
                          له سجل
                        </span>
                      ) : row.record_status === "incomplete" ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                          style={{ background: "#fef3c7", ...F, fontSize: 12, fontWeight: 700, color: "#92400e" }}
                        >
                          غير مكتمل
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                          style={{ background: "#fce9ea", ...F, fontSize: 12, fontWeight: 700, color: "#9d2e15" }}
                        >
                          بدون سجل
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3 border-b border-[#e2e7f0]">
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/social-record/personnel/${row.id}`)}
                        className="text-[#1f3d97]"
                        style={{ ...F, fontSize: 13 }}
                      >
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showColumnPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          dir="rtl"
        >
          <div className="bg-white rounded-[16px] p-6 w-full max-w-[360px] flex flex-col gap-4">
            <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>
              اختر أعمدة كشف الأسماء
            </span>

            <div className="flex flex-col gap-3">
              {COLUMN_ORDER.map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedColumns[key]}
                    onChange={(e) =>
                      setSelectedColumns((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="accent-[#00b867]"
                  />
                  <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{COLUMN_LABELS[key]}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrintNamesList}
                className="flex-1 h-[42px] rounded-[8px]"
                style={{ background: "linear-gradient(to bottom,#00b867,#00522e)", ...F, fontSize: 14, color: "#fff" }}
              >
                طباعة
              </button>

              <button
                type="button"
                onClick={() => setShowColumnPicker(false)}
                className="flex-1 h-[42px] rounded-[8px] border border-[#e2e7f0]"
                style={{ ...F, fontSize: 14, color: "#717d96" }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}