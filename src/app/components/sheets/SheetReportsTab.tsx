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
  type Sheet,
  type SheetColumn,
  type SheetRow,
  type SheetReport,
  type GroupNode,
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
        console.error("Audit log error:", auditError);
      }

      onCreated();
      onClose();
    } catch (err: any) {
      console.error("Create report error:", err);
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

  useEffect(() => {
    loadReports();
  }, [sheet.id]);

  async function loadReports() {
    setLoading(true);

    try {
      const data = await fetchSheetReports(sheet.id);
      setReports(data);
    } catch (err) {
      console.error("Load reports error:", err);
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
      console.error("Load report columns error:", err);
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
    } catch (err: any) {
      console.error("Delete report error:", err);
      alert(err?.message || "حدث خطأ أثناء حذف اليومية");
    } finally {
      setDeletingId(null);
    }
  }

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

  function handlePrintReport() {
    if (!selectedReport) return;

    const printWindow = window.open("", "_blank", "width=800,height=1000");

    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    function renderNodesHtml(nodes: GroupNode[], depth: number): string {
      return nodes
        .map(
          (node) => `
            <div style="margin-right: ${depth * 24}px; padding: 6px 10px; border-bottom: 1px solid #eee; display:flex; justify-content: space-between;">
              <span style="font-weight:${depth === 0 ? 700 : 400};">${node.value}</span>
              <span style="font-weight:700;">${node.count}</span>
            </div>
            ${renderNodesHtml(node.children, depth + 1)}
          `
        )
        .join("");
    }

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
          <title>${selectedReport.name}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Times New Roman', Times, serif; direction: rtl; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 18px; margin: 0 0 6px; }
            .header p { font-size: 13px; color: #555; margin: 0; }
            .total { text-align: center; margin: 16px 0; font-size: 15px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${selectedReport.name}</h1>
            <p>كشف: ${sheet.name} — التاريخ: ${formattedDate}</p>
          </div>

          <div class="total">إجمالي العدد: ${totalCount}</div>

          <div>${renderNodesHtml(groupTree, 0)}</div>
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

            <button
              type="button"
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 h-[38px] px-4 rounded-[7px]"
              style={{ background: "#DCF4DF" }}
            >
              <Printer size={14} color="#2d3648" />
              <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                طباعة اليومية
              </span>
            </button>
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

          <GroupTreeView nodes={groupTree} />
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
    </div>
  );
}