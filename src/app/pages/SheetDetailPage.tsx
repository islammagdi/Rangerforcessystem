import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Plus, Trash2, Printer, ArrowRight, Pencil, Check, X } from "lucide-react";

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
  type Sheet,
  type SheetColumn,
  type SheetRow,
  type SheetCell,
  type SheetColumnType,
  COLUMN_TYPE_LABELS,
} from "../../lib/sheets";
import { SheetReportsTab } from "../components/sheets/SheetReportsTab";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

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

    try {
      const newRowId = await addRow(id, rows.length);
      setRows((prev) => [...prev, { id: newRowId, sheet_id: id, row_order: prev.length }]);
    } catch (err: any) {
      console.error("Add row error:", err);
      alert(err?.message || "حدث خطأ أثناء إضافة صف");
    }
  }

  async function handleDeleteRow(rowId: string) {
    const confirmed = window.confirm("هل تريد حذف هذا الصف؟");
    if (!confirmed) return;

    try {
      await deleteRow(rowId);
      setRows((prev) => prev.filter((r) => r.id !== rowId));
      setCells((prev) => prev.filter((c) => c.row_id !== rowId));
    } catch (err: any) {
      console.error("Delete row error:", err);
      alert(err?.message || "حدث خطأ أثناء حذف الصف");
    }
  }

  async function handleAddColumn() {
    if (!id || !newColumnName.trim()) return;

    try {
      await addColumn(id, newColumnName.trim(), newColumnType, columns.length);
      const updatedColumns = await fetchSheetColumns(id);
      setColumns(updatedColumns);
      setNewColumnName("");
      setNewColumnType("TEXT");
      setShowAddColumn(false);
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

    try {
      await deleteColumn(columnId);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      setCells((prev) => prev.filter((c) => c.column_id !== columnId));
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
    } catch (err: any) {
      console.error("Update sheet name error:", err);
      alert(err?.message || "حدث خطأ أثناء تعديل اسم الكشف");
    }
  }

  function handlePrint() {
    if (!sheet) return;

    const printWindow = window.open("", "_blank", "width=1000,height=1200");

    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    const tableHeaders = `
      <th>م</th>
      ${columns.map((col) => `<th>${col.name}</th>`).join("")}
    `;

    const tableRows = rows
      .map((row, index) => {
        const cellsHtml = columns
          .map((col) => `<td>${getCellValue(row.id, col.id) || "-"}</td>`)
          .join("");

        return `<tr><td>${index + 1}</td>${cellsHtml}</tr>`;
      })
      .join("");

    const formattedDate = new Intl.DateTimeFormat("ar-EG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date());

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${sheet.name}</title>

          <style>
            @page { size: A4 landscape; margin: 10mm; }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body {
              margin: 0;
              padding: 0;
              direction: rtl;
              font-family: 'Times New Roman', Times, serif;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
              padding-bottom: 10px;
              border-bottom: 1px solid #999;
            }

            .title { text-align: center; margin: 16px 0; }
            .title h1 { font-size: 18px; margin: 0; }

            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #999; padding: 6px; text-align: center; }
            th { background: #f0f0f0; }
          </style>
        </head>

        <body>
          <div class="header">
            <span>التاريخ: ${formattedDate}</span>
          </div>

          <div class="title">
            <h1>${sheet.name}</h1>
          </div>

          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
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
            onClick={handlePrint}
            className="flex items-center gap-1.5 h-[42px] px-4 rounded-[8px]"
            style={{ background: "#DCF4DF" }}
          >
            <Printer size={15} color="#2d3648" />
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>طباعة</span>
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
    </div>
  );
}