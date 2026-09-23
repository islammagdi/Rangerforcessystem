import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Printer, X, ChevronLeft } from "lucide-react";

import { supabase } from "../../../lib/supabase";
import { logActivity } from "../../../lib/logActivity";
import {
  fetchSheetReports,
  fetchReportColumns,
  createReport,
  deleteReport,
  buildGroupTree,
  buildPivotTable,
  logReportCreated,
  logReportDeleted,
  type Sheet,
  type SheetColumn,
  type SheetRow,
  type SheetReport,
  type GroupNode,
  type PivotTable,
} from "../../../lib/sheets";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// =====================================================
// نافذة إنشاء قالب يومية جديد
// =====================================================

function CreateReportModal({
  sheet,
  columns,
  onClose,
  onCreated,
}: {
  sheet: Sheet;
  columns: SheetColumn[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleColumn(columnId: string) {
    setSelectedColumnIds((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      }
      return [...prev, columnId];
    });
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setSelectedColumnIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    setSelectedColumnIds((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("اسم اليومية مطلوب");
      return;
    }

    if (selectedColumnIds.length === 0) {
      setError("اختر عمود واحد على الأقل للتجميع");
      return;
    }

    setSaving(true);
    setError("");

    try {
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

      await createReport({
        sheetId: sheet.id,
        name: name.trim(),
        columnIds: selectedColumnIds,
        createdBy: user?.id ?? null,
        createdByName: userName,
      });

      try {
        await logActivity({
          userId: user?.id ?? null,
          userName,
          actionType: "CREATE",
          action: `إنشاء يومية: ${name.trim()}`,
          entity: "sheets",
          details: `تم إنشاء قالب يومية جديد للكشف "${sheet.name}"`,
        });
      } catch (auditError) {
   
      }

      try {
        await logReportCreated(sheet.id, userName, name.trim());
      } catch (logErr) {
     
      }

      onCreated();
      onClose();
    } catch (err: any) {
    
      setError(err?.message || "حدث خطأ أثناء إنشاء اليومية");
    } finally {
      setSaving(false);
    }
  }

  const columnsById = useMemo(() => {
    const map = new Map<string, SheetColumn>();
    columns.forEach((c) => map.set(c.id, c));
    return map;
  }, [columns]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="bg-white rounded-[16px] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eff0f6]">
          <h2 style={{ ...F, fontWeight: 700, fontSize: 18, color: "#2d3648" }}>
            إنشاء يومية جديدة
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-[#aaa] hover:text-[#555]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {error && (
            <div
              className="rounded-[8px] px-4 py-3"
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                ...F,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontWeight: 700, fontSize: 14, color: "#2d3648" }}>
              اسم اليومية
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: يومية بعدد الأفراد حسب الوحدة والرتبة"
              dir="rtl"
              className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 15, color: "#2d3648" }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label style={{ ...F, fontWeight: 700, fontSize: 14, color: "#2d3648" }}>
              اختر الأعمدة (بترتيب التفصيل)
            </label>

            <p style={{ ...F, fontSize: 12, color: "#a1aebe" }}>
              أول عمود تختاره هو المستوى الأساسي للتجميع، والباقي تفصيل داخله بالترتيب.
            </p>

            <div className="flex flex-col gap-2">
              {columns.map((col) => (
                <label
                  key={col.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] border border-[#e2e7f0] cursor-pointer hover:bg-[#f5f6fb]"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumnIds.includes(col.id)}
                    onChange={() => toggleColumn(col.id)}
                    className="w-4 h-4 accent-[#00b867]"
                  />

                  <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                    {col.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {selectedColumnIds.length > 0 && (
            <div className="flex flex-col gap-2">
              <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#2d3648" }}>
                ترتيب مستويات التجميع
              </label>

              <div className="flex flex-col gap-1.5">
                {selectedColumnIds.map((columnId, index) => {
                  const col = columnsById.get(columnId);

                  return (
                    <div
                      key={columnId}
                      className="flex items-center justify-between px-3 py-2 rounded-[8px]"
                      style={{ background: "#f7f9fc" }}
                    >
                      <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                        {index + 1}. {col?.name}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="w-7 h-7 rounded-[6px] flex items-center justify-center disabled:opacity-30 hover:bg-white"
                        >
                          <ChevronLeft size={14} className="rotate-90" />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveDown(index)}
                          disabled={index === selectedColumnIds.length - 1}
                          className="w-7 h-7 rounded-[6px] flex items-center justify-center disabled:opacity-30 hover:bg-white"
                        >
                          <ChevronLeft size={14} className="-rotate-90" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#eff0f6] flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 h-11 rounded-[8px] disabled:opacity-50"
            style={{
              background: "linear-gradient(to bottom,#00b867,#00522e)",
              ...F,
              fontSize: 14,
              color: "#fff",
            }}
          >
            {saving ? "جاري الإنشاء..." : "إنشاء اليومية"}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
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

// =====================================================
// عرض شجرة التجميع (متداخلة)
// =====================================================

function GroupTreeView({
  nodes,
  depth = 0,
}: {
  nodes: GroupNode[];
  depth?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {nodes.map((node, index) => (
        <div key={`${node.value}-${index}`} className="flex flex-col gap-1.5">
          <div
            className="flex items-center justify-between px-3 py-2 rounded-[8px]"
            style={{
              background: depth === 0 ? "#DCF4DF" : "#f7f9fc",
              marginRight: depth * 20,
            }}
          >
            <span
              style={{
                ...F,
                fontSize: depth === 0 ? 14 : 13,
                fontWeight: depth === 0 ? 700 : 400,
                color: "#2d3648",
              }}
            >
              {node.value}
            </span>

            <span
              style={{
                ...F,
                fontSize: 13,
                fontWeight: 700,
                color: "#00522e",
              }}
            >
              {node.count}
            </span>
          </div>

          {node.children.length > 0 && (
            <GroupTreeView nodes={node.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

// =====================================================
// عرض الجدول المتقاطع (Pivot Table)
// =====================================================

function PivotTableView({
  pivot,
  rowColumnName,
}: {
  pivot: PivotTable;
  rowColumnName: string;
}) {
  const headerLevelsCount = pivot.headerLevels.length;

  function groupSize(level: number) {
    let size = 1;
    for (let j = level + 1; j < pivot.headerLevels.length; j++) {
      size *= pivot.headerLevels[j].length;
    }
    return size;
  }

  function renderHeaderCells(level: number) {
    const size = groupSize(level);
    const repeatCount = pivot.headerLevels
      .slice(0, level)
      .reduce((acc, arr) => acc * arr.length, 1);

    const cells: { value: string; span: number }[] = [];

    for (let r = 0; r < repeatCount; r++) {
      pivot.headerLevels[level].forEach((value) => {
        cells.push({ value, span: size });
      });
    }

    return cells;
  }

  const thBase = "border border-[#e2e7f0] px-3 py-2 text-center";

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" dir="rtl">
        <thead>
          {headerLevelsCount === 0 ? (
            <tr>
              <th className={thBase} style={{ ...F, fontSize: 13, background: "#f7f9fc" }}>
                {rowColumnName}
              </th>
              <th className={thBase} style={{ ...F, fontSize: 13, background: "#f7f9fc" }}>
                العدد
              </th>
              <th className={thBase} style={{ ...F, fontSize: 13, background: "#DCF4DF" }}>
                الإجمالي
              </th>
            </tr>
          ) : (
            Array.from({ length: headerLevelsCount }).map((_, level) => (
              <tr key={level}>
                {level === 0 && (
                  <th
                    rowSpan={headerLevelsCount}
                    className={thBase}
                    style={{ ...F, fontSize: 13, fontWeight: 700, background: "#f7f9fc" }}
                  >
                    {rowColumnName}
                  </th>
                )}

                {renderHeaderCells(level).map((cell, index) => (
                  <th
                    key={index}
                    colSpan={cell.span}
                    className={thBase}
                    style={{ ...F, fontSize: 13, fontWeight: 700, background: "#f7f9fc" }}
                  >
                    {cell.value}
                  </th>
                ))}

                {level === 0 && (
                  <th
                    rowSpan={headerLevelsCount}
                    className={thBase}
                    style={{ ...F, fontSize: 13, fontWeight: 700, background: "#DCF4DF" }}
                  >
                    الإجمالي
                  </th>
                )}
              </tr>
            ))
          )}
        </thead>

        <tbody>
          {pivot.rowValues.map((rowValue, rowIndex) => (
            <tr key={rowValue}>
              <th
                className={thBase}
                style={{ ...F, fontSize: 13, fontWeight: 700, background: "#fafbff" }}
              >
                {rowValue}
              </th>

              {pivot.matrix[rowIndex].map((value, colIndex) => (
                <td
                  key={colIndex}
                  className={thBase}
                  style={{ ...F, fontSize: 13, color: "#2d3648" }}
                >
                  {value}
                </td>
              ))}

              <td
                className={thBase}
                style={{
                  ...F,
                  fontSize: 13,
                  fontWeight: 700,
                  background: "#f0fdf6",
                  color: "#00522e",
                }}
              >
                {pivot.rowTotals[rowIndex]}
              </td>
            </tr>
          ))}

          <tr>
            <th
              className={thBase}
              style={{ ...F, fontSize: 13, fontWeight: 700, background: "#DCF4DF" }}
            >
              إجمالي
            </th>

            {pivot.columnTotals.map((value, index) => (
              <td
                key={index}
                className={thBase}
                style={{ ...F, fontSize: 13, fontWeight: 700, background: "#DCF4DF" }}
              >
                {value}
              </td>
            ))}

            <td
              className={thBase}
              style={{
                ...F,
                fontSize: 14,
                fontWeight: 700,
                background: "#00522e",
                color: "#fff",
              }}
            >
              {pivot.grandTotal}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// =====================================================
// نافذة اختيار وترتيب أعمدة الطباعة (Drag & Drop)
// =====================================================

function PrintReportModal({
  columnIds,
  columnsById,
  onClose,
  onConfirm,
}: {
  columnIds: string[];
  columnsById: Map<string, SheetColumn>;
  onClose: () => void;
  onConfirm: (orderedSelectedIds: string[]) => void;
}) {
  const [order, setOrder] = useState<string[]>(columnIds);
  const [checked, setChecked] = useState<Set<string>>(new Set(columnIds));
  const [error, setError] = useState("");

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

    onConfirm(finalIds);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="bg-white rounded-[16px] w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
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
            استخدم الأسهم لترتيب الأعمدة (أول عمود = الصفوف، الباقي = الأعمدة)، وألغِ
            تحديد أي عمود مش عايزه يظهر في الطباعة.
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

                  {index === 0 && checked.has(id) && (
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ ...F, fontSize: 10, background: "#DCF4DF", color: "#00522e" }}
                    >
                      صفوف
                    </span>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="w-7 h-7 rounded-[6px] flex items-center justify-center disabled:opacity-30 hover:bg-[#f5f6fb]"
                    >
                      <ChevronLeft size={14} className="rotate-90" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveDown(index)}
                      disabled={index === order.length - 1}
                      className="w-7 h-7 rounded-[6px] flex items-center justify-center disabled:opacity-30 hover:bg-[#f5f6fb]"
                    >
                      <ChevronLeft size={14} className="-rotate-90" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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

// =====================================================
// المكوّن الرئيسي
// =====================================================

export function SheetReportsTab({
  sheet,
  columns,
  rows,
  cellMap,
  canEdit,
  canDelete,
}: {
  sheet: Sheet;
  columns: SheetColumn[];
  rows: SheetRow[];
  cellMap: Map<string, string>;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [reports, setReports] = useState<SheetReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SheetReport | null>(
    null
  );
  const [selectedReportColumnIds, setSelectedReportColumnIds] = useState<string[]>(
    []
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    loadReports();
  }, [sheet.id]);

  async function loadReports() {
    setLoading(true);

    try {
      const data = await fetchSheetReports(sheet.id);
      setReports(data);
    } catch (err) {

    } finally {
      setLoading(false);
    }
  }

  async function handleOpenReport(report: SheetReport) {
    try {
      const reportColumns = await fetchReportColumns(report.id);
      setSelectedReportColumnIds(reportColumns.map((rc) => rc.column_id));
      setSelectedReport(report);
    } catch (err) {

      alert("حدث خطأ أثناء تحميل اليومية");
    }
  }

  async function handleDeleteReport(report: SheetReport) {
    const confirmed = window.confirm(`هل تريد حذف يومية "${report.name}"؟`);
    if (!confirmed) return;

    setDeletingId(report.id);

    try {
      await deleteReport(report.id);
      setReports((prev) => prev.filter((r) => r.id !== report.id));

      if (selectedReport?.id === report.id) {
        setSelectedReport(null);
      }

      try {
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

        await logReportDeleted(sheet.id, userName, report.name);
      } catch (logErr) {

      }
    } catch (err: any) {

      alert(err?.message || "حدث خطأ أثناء حذف اليومية");
    } finally {
      setDeletingId(null);
    }
  }


  const pivotTable = useMemo(() => {
    if (!selectedReport || selectedReportColumnIds.length === 0) return null;
    return buildPivotTable(rows, cellMap, selectedReportColumnIds);
  }, [selectedReport, selectedReportColumnIds, rows, cellMap]);

  const groupTree = useMemo(() => {
    if (!selectedReport || selectedReportColumnIds.length === 0) return [];
    return buildGroupTree(rows, cellMap, selectedReportColumnIds);
  }, [selectedReport, selectedReportColumnIds, rows, cellMap]);

  const totalCount = rows.length;

  const columnsById = useMemo(() => {
    const map = new Map<string, SheetColumn>();
    columns.forEach((c) => map.set(c.id, c));
    return map;
  }, [columns]);

   function toArabicDigitsStr(value: string): string {
    return value.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
  }

  function executePrint(printColumnIds: string[]) {
    if (!selectedReport) return;

    const printWindow = window.open("", "_blank", "width=900,height=1100");

    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    function renderNodesHtml(nodes: GroupNode[], depth: number): string {
      return nodes
        .map(
          (node) => `
            <div style="margin-right: ${depth * 24}px; padding: 6px 10px; border-bottom: 1px solid #eee; display:flex; justify-content: space-between;">
              <span style="font-weight:${depth === 0 ? 700 : 400};">${toArabicDigitsStr(node.value)}</span>
              <span style="font-weight:700;">${toArabicDigitsStr(String(node.count))}</span>
            </div>
            ${renderNodesHtml(node.children, depth + 1)}
          `
        )
        .join("");
    }

    function buildPivotPrintHtml(pivot: PivotTable, rowColumnName: string): string {
      const headerLevelsCount = pivot.headerLevels.length;

      function groupSize(level: number) {
        let size = 1;
        for (let j = level + 1; j < pivot.headerLevels.length; j++) {
          size *= pivot.headerLevels[j].length;
        }
        return size;
      }

      function renderHeaderCellsHtml(level: number): string {
        const size = groupSize(level);
        const repeatCount = pivot.headerLevels
          .slice(0, level)
          .reduce((acc, arr) => acc * arr.length, 1);

        let html = "";

        for (let r = 0; r < repeatCount; r++) {
          pivot.headerLevels[level].forEach((value) => {
            html += `<th colspan="${size}">${toArabicDigitsStr(value)}</th>`;
          });
        }

        return html;
      }
      let theadHtml = "";

      if (headerLevelsCount === 0) {
        theadHtml = `
          <tr>
            <th>${toArabicDigitsStr(rowColumnName)}</th>
            <th>الإجمالي</th>
          </tr>
        `;
      } else {
        for (let level = 0; level < headerLevelsCount; level++) {
          theadHtml += "<tr>";

          if (level === 0) {
            theadHtml += `<th rowspan="${headerLevelsCount}">${toArabicDigitsStr(rowColumnName)}</th>`;
          }

          theadHtml += renderHeaderCellsHtml(level);

          if (level === 0) {
            theadHtml += `<th rowspan="${headerLevelsCount}">الإجمالي</th>`;
          }

          theadHtml += "</tr>";
        }
      }
      const bodyRowsHtml = pivot.rowValues
        .map((rowValue, rowIndex) => {
          const cells = pivot.matrix[rowIndex]
            .map((value) => `<td>${toArabicDigitsStr(String(value))}</td>`)
            .join("");

          return `<tr><th>${toArabicDigitsStr(rowValue)}</th>${cells}<td>${toArabicDigitsStr(String(pivot.rowTotals[rowIndex]))}</td></tr>`;
        })
        .join("");

      const totalsRowHtml = `
        <tr>
          <th>إجمالي</th>
          ${pivot.columnTotals.map((v) => `<td>${toArabicDigitsStr(String(v))}</td>`).join("")}
          <td>${toArabicDigitsStr(String(pivot.grandTotal))}</td>
        </tr>
      `;

      return `
        <table>
          <thead>${theadHtml}</thead>
          <tbody>${bodyRowsHtml}${totalsRowHtml}</tbody>
        </table>
      `;
    }

    const rawDate = new Intl.DateTimeFormat("ar-EG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date());

    const formattedDate = toArabicDigitsStr(rawDate);

    const isTableView = viewMode === "table" && printColumnIds.length > 1;

    const bodyHtml = isTableView
      ? buildPivotPrintHtml(
          buildPivotTable(rows, cellMap, printColumnIds),
          columnsById.get(printColumnIds[0])?.name ?? ""
        )
      : `
          <div class="total">إجمالي العدد: ${toArabicDigitsStr(String(rows.length))}</div>
          <div>${renderNodesHtml(
            buildGroupTree(rows, cellMap, printColumnIds),
            0
          )}</div>
        `;

    const orientation = isTableView ? "landscape" : "portrait";

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${selectedReport.name}</title>

          <style>
            @page {
              size: A4 ${orientation};
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
              font-size: 14px;
              margin: 4px 0 0;
              font-weight: 400;
              color: #555;
            }

            .total {
              text-align: center;
              margin: 16px 0;
              font-size: 15px;
              font-weight: 700;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }

            th, td {
              border: 1px solid #999;
              padding: 6px;
              text-align: center;
            }

            th {
              background: #f0f0f0;
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
              <h1>${selectedReport.name}</h1>
              <h2>كشف: ${sheet.name}</h2>
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
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 style={{ ...F, fontWeight: 700, fontSize: 16, color: "#2d3648" }}>
          اليوميات المحفوظة
        </h3>

        {canEdit && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 h-[38px] px-4 rounded-[7px]"
            style={{ background: "#f0f2fd" }}
          >
            <Plus size={14} color="#1f3d97" />
            <span style={{ ...F, fontSize: 13, color: "#1f3d97" }}>
              إنشاء يومية جديدة
            </span>
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ ...F, fontSize: 13, color: "#a1aebe" }}>
          جاري تحميل اليوميات...
        </p>
      ) : reports.length === 0 ? (
        <p style={{ ...F, fontSize: 13, color: "#a1aebe" }}>
          لا توجد يوميات محفوظة لهذا الكشف بعد
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center gap-2 px-3 py-2 rounded-[8px] border"
              style={{
                borderColor:
                  selectedReport?.id === report.id ? "#00b867" : "#e2e7f0",
                background:
                  selectedReport?.id === report.id ? "#f0fdf6" : "#fff",
              }}
            >
              <button
                type="button"
                onClick={() => handleOpenReport(report)}
                style={{ ...F, fontSize: 13, color: "#2d3648" }}
              >
                {report.name}
              </button>

              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDeleteReport(report)}
                  disabled={deletingId === report.id}
                  className="text-[#e3282c] hover:opacity-70 disabled:opacity-40"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <div className="bg-white rounded-[16px] border border-[#eff0f6] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>
                {selectedReport.name}
              </h4>

              <p style={{ ...F, fontSize: 12, color: "#a1aebe" }}>
                {selectedReportColumnIds
                  .map((id) => columnsById.get(id)?.name)
                  .filter(Boolean)
                  .join(" ← ")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1 p-1 bg-[#f1f5f9] rounded-[8px]">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className="px-3 h-[34px] rounded-[6px] text-sm transition-colors"
                  style={{
                    ...F,
                    background: viewMode === "list" ? "#fff" : "transparent",
                    color: viewMode === "list" ? "#00522e" : "#717d96",
                    fontWeight: viewMode === "list" ? 700 : 400,
                    boxShadow: viewMode === "list" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  عرض قائمة
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className="px-3 h-[34px] rounded-[6px] text-sm transition-colors"
                  style={{
                    ...F,
                    background: viewMode === "table" ? "#fff" : "transparent",
                    color: viewMode === "table" ? "#00522e" : "#717d96",
                    fontWeight: viewMode === "table" ? 700 : 400,
                    boxShadow: viewMode === "table" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  عرض جدول
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="flex items-center gap-1.5 h-[38px] px-4 rounded-[7px]"
                style={{ background: "#DCF4DF" }}
              >
                <Printer size={14} color="#2d3648" />
                <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                  طباعة اليومية
                </span>
              </button>
            </div>
          </div>

          <div
            className="flex items-center justify-between px-3 py-2 rounded-[8px]"
            style={{ background: "#f7f9fc" }}
          >
            <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
              إجمالي العدد
            </span>

            <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#00522e" }}>
              {totalCount}
            </span>
          </div>

          {viewMode === "list" ? (
            <GroupTreeView nodes={groupTree} />
          ) : (
            pivotTable && (
              <PivotTableView
                pivot={pivotTable}
                rowColumnName={
                  columnsById.get(selectedReportColumnIds[0])?.name ?? ""
                }
              />
            )
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateReportModal
          sheet={sheet}
          columns={columns}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadReports}
        />
      )}

      {showPrintModal && selectedReport && (
        <PrintReportModal
          columnIds={selectedReportColumnIds}
          columnsById={columnsById}
          onClose={() => setShowPrintModal(false)}
          onConfirm={executePrint}
        />
      )}
    </div>
  );
}