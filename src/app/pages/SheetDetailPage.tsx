import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Plus, Trash2, Printer, ArrowRight, Pencil, Check, X, History, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { logActivity } from "../../lib/logActivity";
import {
  fetchSheetById,
  fetchSheetColumns,
  fetchSheetRows,
  fetchSheetCells,
  addColumn,
  deleteColumn,
  addRow,
  deleteRow,
  upsertCell,
  updateSheetName,
  fetchSheetLogs,
  logSheetRowAdded,
  logSheetRowDeleted,
  logSheetCellChanged,
  logSheetColumnAdded,
  logSheetColumnDeleted,
  logSheetNameChanged,
  type Sheet,
  type SheetColumn,
  type SheetRow,
  type SheetCell,
  type SheetColumnType,
  type SheetLog,
  COLUMN_TYPE_LABELS,
} from "../../lib/sheets";
import { SheetReportsTab } from "../components/sheets/SheetReportsTab";


const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

async function getCurrentUserName(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "غير معروف";

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.username ?? "غير معروف";
}

// =====================================================
// نافذة سجل تعديلات الكشف
// =====================================================

function SheetLogsModal({
  logs,
  loading,
  onClose,
}: {
  logs: SheetLog[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="bg-white rounded-[16px] w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eff0f6]">
          <h2 style={{ ...F, fontWeight: 700, fontSize: 17, color: "#2d3648" }}>
            سجل تعديلات الكشف
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-[#aaa] hover:text-[#555]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4 flex flex-col gap-3 flex-1">
          {loading && (
            <p style={{ ...F, fontSize: 13, color: "#a1aebe" }}>
              جاري تحميل السجل...
            </p>
          )}

          {!loading && logs.length === 0 && (
            <p style={{ ...F, fontSize: 13, color: "#a1aebe" }}>
              لا يوجد سجل تعديلات لهذا الكشف
            </p>
          )}

          {!loading &&
            logs.map((log) => (
              <div
                key={log.id}
                className="rounded-[8px] px-3 py-2.5"
                style={{ background: "#f8fafc" }}
              >
                <p style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                  {log.message}
                </p>

                <p
                  style={{
                    ...F,
                    fontSize: 11,
                    color: "#a1aebe",
                    marginTop: 4,
                  }}
                >
                  {new Date(log.created_at).toLocaleString("ar-EG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}


// =====================================================
// نافذة اختيار وترتيب أعمدة الطباعة (Drag & Drop)
// =====================================================

function PrintColumnsModal({
  columnIds,
  columnsById,
  onClose,
  onConfirm,
}: {
  columnIds: string[];
  columnsById: Map<string, SheetColumn>;
  onClose: () => void;
  onConfirm: (orderedSelectedIds: string[], includeSignature: boolean) => void;
}) {
  const [order, setOrder] = useState<string[]>(columnIds);
  const [checked, setChecked] = useState<Set<string>>(new Set(columnIds));
  const [includeSignature, setIncludeSignature] = useState(true);
  const [error, setError] = useState("");

  const overlayMouseDown = useRef(false);

  function toggleChecked(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    setOrder((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function handleConfirm() {
    const finalIds = order.filter((id) => checked.has(id));

    if (finalIds.length === 0) {
      setError("اختر عمود واحد على الأقل للطباعة");
      return;
    }

    onConfirm(finalIds, includeSignature);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        overlayMouseDown.current = e.target === e.currentTarget;
      }}
      onMouseUp={(e) => {
        if (overlayMouseDown.current && e.target === e.currentTarget) {
          onClose();
        }
        overlayMouseDown.current = false;
      }}
    >
      <div
        dir="rtl"
        className="bg-white rounded-[16px] w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eff0f6]">
          <h2 style={{ ...F, fontWeight: 700, fontSize: 17, color: "#2d3648" }}>
            اختر أعمدة الطباعة وترتيبها
          </h2>

          <button type="button" onClick={onClose} className="text-[#aaa] hover:text-[#555]">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          <p style={{ ...F, fontSize: 12, color: "#a1aebe" }}>
            استخدم الأسهم لترتيب الأعمدة، وألغِ تحديد أي عمود مش عايزه يظهر في الطباعة.
          </p>

          {error && (
            <div
              className="rounded-[8px] px-4 py-2"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", ...F, fontSize: 13 }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {order.map((id, index) => {
              const col = columnsById.get(id);

              return (
                <div
                  key={id}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] border border-[#e2e7f0] bg-white"
                  style={{ opacity: checked.has(id) ? 1 : 0.5 }}
                >
                  <input
                    type="checkbox"
                    checked={checked.has(id)}
                    onChange={() => toggleChecked(id)}
                    className="w-4 h-4 accent-[#00b867] shrink-0"
                  />

                  <span style={{ ...F, fontSize: 14, color: "#2d3648" }} className="flex-1">
                    {index + 1}. {col?.name}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="w-7 h-7 rounded-[6px] flex items-center justify-center disabled:opacity-30 hover:bg-[#f5f6fb]"
                    >
                      <ChevronUp size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveDown(index)}
                      disabled={index === order.length - 1}
                      className="w-7 h-7 rounded-[6px] flex items-center justify-center disabled:opacity-30 hover:bg-[#f5f6fb]"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="w-full h-px bg-[#eff0f6]" />

          <label className="flex items-center gap-2.5 cursor-pointer px-1 py-1.5 rounded-[6px] hover:bg-[#f5f6fb]">
            <input
              type="checkbox"
              checked={includeSignature}
              onChange={() => setIncludeSignature((v) => !v)}
              className="w-4 h-4 accent-[#00b867]"
            />
            <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              إظهار بلوك التوقيع في الكشف
            </span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-[#eff0f6] flex items-center gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 h-11 rounded-[8px]"
            style={{ background: "linear-gradient(to bottom,#00b867,#00522e)", ...F, fontSize: 14, color: "#fff" }}
          >
            طباعة
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 h-11 rounded-[8px] border border-[#cbd5e1]"
            style={{ ...F, fontSize: 14, color: "#475569" }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

export function SheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [columns, setColumns] = useState<SheetColumn[]>([]);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [cells, setCells] = useState<SheetCell[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<SheetColumnType>("TEXT");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logs, setLogs] = useState<SheetLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const originalCellValuesRef = useRef<Map<string, string>>(new Map());

  const canEdit = hasPermission("sheets:create");
  const canDelete = hasPermission("sheets:delete");

  const [activeTab, setActiveTab] = useState<"data" | "reports">("data");

  useEffect(() => {
    if (id) {
      loadAll(id);
    }
  }, [id]);

  async function loadAll(sheetId: string) {
    setLoading(true);
    setError("");

    try {
      const [sheetData, columnsData, rowsData] = await Promise.all([
        fetchSheetById(sheetId),
        fetchSheetColumns(sheetId),
        fetchSheetRows(sheetId),
      ]);

      const cellsData = await fetchSheetCells(rowsData.map((r) => r.id));

      setSheet(sheetData);
      setColumns(columnsData);
      setRows(rowsData);
      setCells(cellsData);
      setNameDraft(sheetData.name);
    } catch (err: any) {
      console.error("Load sheet detail error:", err);
      setError(err?.message || "حدث خطأ أثناء تحميل الكشف");
    } finally {
      setLoading(false);
    }
  }

  // بناء خريطة (row_id, column_id) -> value لسهولة العرض
  const cellMap = useMemo(() => {
    const map = new Map<string, string>();

    cells.forEach((cell) => {
      map.set(`${cell.row_id}:${cell.column_id}`, cell.value ?? "");
    });

    return map;
  }, [cells]);

  const columnsById = useMemo(() => {
    const map = new Map<string, SheetColumn>();
    columns.forEach((c) => map.set(c.id, c));
    return map;
  }, [columns]);

  async function openLogsModal() {
    if (!id) return;

    setShowLogsModal(true);
    setLoadingLogs(true);

    try {
      const data = await fetchSheetLogs(id);
      setLogs(data);
    } catch (err) {
      console.error("Fetch sheet logs error:", err);
    } finally {
      setLoadingLogs(false);
    }
  }

  function handleCellFocus(rowId: string, columnId: string) {
    const key = `${rowId}:${columnId}`;
    originalCellValuesRef.current.set(key, getCellValue(rowId, columnId));
  }

  async function handleCellBlur(
    rowId: string,
    columnId: string,
    rowNumber: number,
    columnName: string
  ) {
    const key = `${rowId}:${columnId}`;
    const originalValue = originalCellValuesRef.current.get(key);
    originalCellValuesRef.current.delete(key);

    const currentValue = getCellValue(rowId, columnId);

    if (!id || originalValue === undefined || originalValue === currentValue) {
      return;
    }

    try {
      const userName = await getCurrentUserName();
      await logSheetCellChanged(
        id,
        userName,
        rowNumber,
        columnName,
        originalValue,
        currentValue
      );
    } catch (err) {
      console.error("Log cell change error:", err);
    }
  }

  function getCellValue(rowId: string, columnId: string) {
    return cellMap.get(`${rowId}:${columnId}`) ?? "";
  }

  async function handleCellChange(
    rowId: string,
    columnId: string,
    value: string
  ) {
    // تحديث فوري في الواجهة
    setCells((prev) => {
      const exists = prev.some(
        (c) => c.row_id === rowId && c.column_id === columnId
      );

      if (exists) {
        return prev.map((c) =>
          c.row_id === rowId && c.column_id === columnId
            ? { ...c, value }
            : c
        );
      }

      return [
        ...prev,
        { id: `temp-${rowId}-${columnId}`, row_id: rowId, column_id: columnId, value },
      ];
    });

    try {
      await upsertCell(rowId, columnId, value);
    } catch (err) {
      console.error("Update cell error:", err);
    }
  }

  async function handleAddRow() {
    if (!id) return;

    const newRowNumber = rows.length + 1;

    try {
      const newRowId = await addRow(id, rows.length);
      setRows((prev) => [...prev, { id: newRowId, sheet_id: id, row_order: prev.length }]);

      try {
        const userName = await getCurrentUserName();
        await logSheetRowAdded(id, userName, newRowNumber);
      } catch (logErr) {
        console.error("Log row add error:", logErr);
      }
    } catch (err: any) {
      console.error("Add row error:", err);
      alert(err?.message || "حدث خطأ أثناء إضافة صف");
    }
  }

  async function handleDeleteRow(rowId: string) {
    const confirmed = window.confirm("هل تريد حذف هذا الصف؟");
    if (!confirmed) return;

    const rowNumber = rows.findIndex((r) => r.id === rowId) + 1;

    try {
      await deleteRow(rowId);
      setRows((prev) => prev.filter((r) => r.id !== rowId));
      setCells((prev) => prev.filter((c) => c.row_id !== rowId));

      if (id) {
        try {
          const userName = await getCurrentUserName();
          await logSheetRowDeleted(id, userName, rowNumber);
        } catch (logErr) {
          console.error("Log row delete error:", logErr);
        }
      }
    } catch (err: any) {
      console.error("Delete row error:", err);
      alert(err?.message || "حدث خطأ أثناء حذف الصف");
    }
  }

  async function handleAddColumn() {
    if (!id || !newColumnName.trim()) return;

    const columnNameToLog = newColumnName.trim();

    try {
      await addColumn(id, columnNameToLog, newColumnType, columns.length);
      const updatedColumns = await fetchSheetColumns(id);
      setColumns(updatedColumns);
      setNewColumnName("");
      setNewColumnType("TEXT");
      setShowAddColumn(false);

      try {
        const userName = await getCurrentUserName();
        await logSheetColumnAdded(id, userName, columnNameToLog);
      } catch (logErr) {
        console.error("Log column add error:", logErr);
      }
    } catch (err: any) {
      console.error("Add column error:", err);
      alert(err?.message || "حدث خطأ أثناء إضافة العمود");
    }
  }

  async function handleDeleteColumn(columnId: string) {
    const confirmed = window.confirm(
      "هل تريد حذف هذا العمود؟ سيتم حذف كل بياناته من كل الصفوف."
    );
    if (!confirmed) return;

    const columnName = columnsById.get(columnId)?.name ?? "عمود";

    try {
      await deleteColumn(columnId);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      setCells((prev) => prev.filter((c) => c.column_id !== columnId));

      if (id) {
        try {
          const userName = await getCurrentUserName();
          await logSheetColumnDeleted(id, userName, columnName);
        } catch (logErr) {
          console.error("Log column delete error:", logErr);
        }
      }
    } catch (err: any) {
      console.error("Delete column error:", err);
      alert(err?.message || "حدث خطأ أثناء حذف العمود");
    }
  }

  async function handleSaveName() {
    if (!id || !nameDraft.trim() || !sheet) return;

    try {
      await updateSheetName(id, nameDraft.trim());
      setSheet({ ...sheet, name: nameDraft.trim() });
      setEditingName(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let userName = "غير معروف";

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        userName = profile?.username ?? "غير معروف";
      }

      try {
        await logActivity({
          userId: user?.id ?? null,
          userName,
          actionType: "UPDATE",
          action: `تعديل اسم كشف: ${nameDraft.trim()}`,
          entity: "sheets",
          details: `الاسم القديم: ${sheet.name} → الاسم الجديد: ${nameDraft.trim()}`,
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      try {
        if (id) {
          await logSheetNameChanged(id, userName, sheet.name, nameDraft.trim());
        }
      } catch (logErr) {
        console.error("Log name change error:", logErr);
      }
    } catch (err: any) {
      console.error("Update sheet name error:", err);
      alert(err?.message || "حدث خطأ أثناء تعديل اسم الكشف");
    }
  }

  function toArabicDigitsStr(value: string): string {
    return value.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
  }

  async function executePrint(
    printColumnIds: string[],
    includeSignature: boolean
  ) {
    if (!sheet) return;

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

    const printColumns = printColumnIds
      .map((id) => columnsById.get(id))
      .filter((c): c is SheetColumn => Boolean(c));

    const tableHeaders = `
      <th>م</th>
      ${printColumns.map((col) => `<th>${col.name}</th>`).join("")}
    `;

    const tableRows = rows
      .map((row, index) => {
        const cellsHtml = printColumns
          .map((col) => {
            const rawValue = getCellValue(row.id, col.id);
            const displayValue = rawValue ? toArabicDigitsStr(rawValue) : "-";
            return `<td>${displayValue}</td>`;
          })
          .join("");

        return `<tr><td>${toArabicDigitsStr(String(index + 1))}</td>${cellsHtml}</tr>`;
      })
      .join("");

    const rawDate = new Intl.DateTimeFormat("ar-EG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date());

    const formattedDate = toArabicDigitsStr(rawDate);

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${sheet.name}</title>

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
              margin: 0;
              padding: 0;
            }

            body {
              direction: rtl;
              font-family: 'Times New Roman', Times, serif;
            }

            .page-frame {
              border: 2px solid #000;
              height: 100%;
              padding: 5mm;
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
              padding-top: 16px;
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
          <div class="page-frame">
            <div class="header">
              <div class="header-text">
                <p>قيـادة قـوات الصـاعقـــة</p>
                <p>فـــرع التنظيـــم والإدارة</p>
                <p>التاريخ: ${formattedDate}</p>
              </div>

              <img
                src="https://qgsqlqlkdppxljyjujsq.supabase.co/storage/v1/object/sign/images/Logo_Ranger.png?token=eyJraWQiOiJlZTY4MzBjYi1hMmVmLTQyN2EtOWRiZi1hNWZmZmY0MjFjY2QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvTG9nb19SYW5nZXIucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4OTIwNTUyNSwiZXhwIjozMzMyNTIwNTUyNX0.j85GdkKQ9LXcQB5xJ4_kntFjea-WRjomsKk2Padi2kI"
                class="logo"
                alt="Logo"
              />
            </div>

            <div class="title">
              <h1>${sheet.name}</h1>
            </div>

            <table>
              <thead><tr>${tableHeaders}</tr></thead>
              <tbody>${tableRows}</tbody>
            </table>

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <p style={{ ...F, fontSize: 15, color: "#717d96" }}>
          جاري تحميل الكشف...
        </p>
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4" dir="rtl">
        <p style={{ ...F, fontSize: 15, color: "#717d96" }}>
          {error || "لم يتم العثور على الكشف"}
        </p>

        <button
          type="button"
          onClick={() => navigate("/dashboard/sheets")}
          className="px-4 py-2 rounded-lg text-white"
          style={{ ...F, backgroundColor: "#2d3648" }}
        >
          العودة للكشوفات
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/sheets")}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#f5f6fb]"
          >
            <ArrowRight size={18} />
          </button>

          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                dir="rtl"
                autoFocus
                className="h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
                style={{ ...F, fontSize: 18, fontWeight: 700, color: "#2d3648" }}
              />

              <button
                type="button"
                onClick={handleSaveName}
                className="w-9 h-9 rounded-[7px] flex items-center justify-center"
                style={{ background: "#DCF4DF" }}
              >
                <Check size={16} color="#00522e" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingName(false);
                  setNameDraft(sheet.name);
                }}
                className="w-9 h-9 rounded-[7px] flex items-center justify-center"
                style={{ background: "#fce8f1" }}
              >
                <X size={16} color="#e3282c" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: "clamp(20px,4vw,28px)",
                  color: "#2d3648",
                }}
              >
                {sheet.name}
              </h1>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="text-[#a1aebe] hover:text-[#2d3648]"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openLogsModal}
            className="flex items-center gap-1.5 h-[42px] px-4 rounded-[8px] border border-[#e2e7f0]"
          >
            <History size={15} color="#2d3648" />
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
              سجل التعديلات
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 h-[42px] px-4 rounded-[8px]"
            style={{ background: "#DCF4DF" }}
          >
            <Printer size={15} color="#2d3648" />
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>طباعة كشف اليومية</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[#eff0f6]">
        <button
          type="button"
          onClick={() => setActiveTab("data")}
          className="px-4 py-2.5 border-b-2 transition-colors"
          style={{
            ...F,
            fontSize: 14,
            fontWeight: 700,
            borderColor: activeTab === "data" ? "#00b867" : "transparent",
            color: activeTab === "data" ? "#00522e" : "#a1aebe",
          }}
        >
          البيانات
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className="px-4 py-2.5 border-b-2 transition-colors"
          style={{
            ...F,
            fontSize: 14,
            fontWeight: 700,
            borderColor: activeTab === "reports" ? "#00b867" : "transparent",
            color: activeTab === "reports" ? "#00522e" : "#a1aebe",
          }}
        >
          اليوميات
        </button>
      </div>

      {activeTab === "reports" && (
        <SheetReportsTab
          sheet={sheet}
          columns={columns}
          rows={rows}
          cellMap={cellMap}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {activeTab === "data" && (
        <div className="bg-white rounded-[16px] border border-[#eff0f6] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]" dir="rtl">
              <thead>
                <tr>
                  <th className="bg-[#f7f9fc] px-4 py-3 text-right border-b-2 border-[#e2e7f0] w-12">
                    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>م</span>
                  </th>

                  {columns.map((col) => (
                    <th
                      key={col.id}
                      className="bg-[#f7f9fc] px-4 py-3 text-right border-b-2 border-[#e2e7f0]"
                    >
                      <div className="flex items-center gap-2 justify-between">
                        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                          {col.name}
                          <span className="text-[10px] text-[#a1aebe] mr-1">
                            ({COLUMN_TYPE_LABELS[col.column_type]})
                          </span>
                        </span>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteColumn(col.id)}
                            className="text-[#e3282c] hover:opacity-70 shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}

                  <th className="bg-[#f7f9fc] px-4 py-3 border-b-2 border-[#e2e7f0] w-16" />
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-[#fafbff]">
                    <td className="px-4 py-2 border-b border-[#eaecf0]">
                      <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                        {index + 1}
                      </span>
                    </td>

                    {columns.map((col) => (
                      <td key={col.id} className="px-2 py-1.5 border-b border-[#eaecf0]">
                        <input
                          type={col.column_type === "NUMBER" ? "number" : col.column_type === "DATE" ? "date" : "text"}
                          value={getCellValue(row.id, col.id)}
                          onChange={(e) =>
                            handleCellChange(row.id, col.id, e.target.value)
                          }
                          onFocus={() => handleCellFocus(row.id, col.id)}
                          onBlur={() =>
                            handleCellBlur(row.id, col.id, index + 1, col.name)
                          }
                          disabled={!canEdit}
                          dir="rtl"
                          className="w-full h-[38px] rounded-[6px] border border-transparent hover:border-[#e2e7f0] focus:border-[#00b867] px-2 outline-none disabled:bg-transparent"
                          style={{ ...F, fontSize: 14, color: "#2d3648" }}
                        />
                      </td>
                    ))}

                    <td className="px-4 py-2 border-b border-[#eaecf0]">
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="w-8 h-8 rounded-[6px] flex items-center justify-center"
                          style={{ background: "#fce8f1" }}
                        >
                          <Trash2 size={13} color="#e3282c" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + 2}
                      className="py-10 text-center"
                    >
                      <span style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
                        لا توجد بيانات في هذا الكشف بعد
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {canEdit && (
            <div className="px-6 py-4 border-t border-[#eff0f6] flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1.5 h-[38px] px-4 rounded-[7px]"
                style={{ background: "#f0f2fd" }}
              >
                <Plus size={14} color="#1f3d97" />
                <span style={{ ...F, fontSize: 13, color: "#1f3d97" }}>
                  إضافة صف
                </span>
              </button>

              {!showAddColumn ? (
                <button
                  type="button"
                  onClick={() => setShowAddColumn(true)}
                  className="flex items-center gap-1.5 h-[38px] px-4 rounded-[7px] border border-[#e2e7f0]"
                >
                  <Plus size={14} color="#2d3648" />
                  <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                    إضافة عمود
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="اسم العمود"
                    dir="rtl"
                    className="h-[38px] rounded-[7px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
                    style={{ ...F, fontSize: 13, color: "#2d3648" }}
                  />

                  <select
                    value={newColumnType}
                    onChange={(e) =>
                      setNewColumnType(e.target.value as SheetColumnType)
                    }
                    dir="rtl"
                    className="h-[38px] rounded-[7px] border border-[#e2e7f0] px-2 text-right outline-none bg-white"
                    style={{ ...F, fontSize: 13, color: "#2d3648" }}
                  >
                    {Object.entries(COLUMN_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="h-[38px] px-4 rounded-[7px]"
                    style={{ background: "#00b867", color: "#fff", ...F, fontSize: 13 }}
                  >
                    إضافة
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddColumn(false);
                      setNewColumnName("");
                    }}
                    className="h-[38px] px-3 rounded-[7px] border border-[#e2e7f0]"
                    style={{ ...F, fontSize: 13, color: "#717d96" }}
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showPrintModal && (
        <PrintColumnsModal
          columnIds={columns.map((c) => c.id)}
          columnsById={columnsById}
          onClose={() => setShowPrintModal(false)}
          onConfirm={executePrint}
        />
      )}

      {showLogsModal && (
        <SheetLogsModal
          logs={logs}
          loading={loadingLogs}
          onClose={() => setShowLogsModal(false)}
        />
      )}
    </div>
  );
}