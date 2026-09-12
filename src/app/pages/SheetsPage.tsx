import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Eye, Trash2, X, FileSpreadsheet, Copy } from "lucide-react";

import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { logActivity } from "../../lib/logActivity";
import {
  fetchSheets,
  createSheet,
  deleteSheet,
  duplicateSheet,
  type Sheet,
  type SheetColumnType,
  COLUMN_TYPE_LABELS,
} from "../../lib/sheets";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

interface ColumnDraft {
  name: string;
  column_type: SheetColumnType;
}

function CreateSheetModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [columns, setColumns] = useState<ColumnDraft[]>([
    { name: "", column_type: "TEXT" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addColumnDraft() {
    setColumns((prev) => [...prev, { name: "", column_type: "TEXT" }]);
  }

  function removeColumnDraft(index: number) {
    setColumns((prev) => prev.filter((_, i) => i !== index));
  }

  function updateColumnDraft(
    index: number,
    field: keyof ColumnDraft,
    value: string
  ) {
    setColumns((prev) =>
      prev.map((col, i) =>
        i === index ? { ...col, [field]: value } : col
      )
    );
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("اسم الكشف مطلوب");
      return;
    }

    const validColumns = columns.filter((c) => c.name.trim());

    if (validColumns.length === 0) {
      setError("أضف عمود واحد على الأقل");
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

      const sheetId = await createSheet({
        name: name.trim(),
        columns: validColumns.map((c) => ({
          name: c.name.trim(),
          column_type: c.column_type,
        })),
        createdBy: user?.id ?? null,
        createdByName: userName,
      });

      try {
        await logActivity({
          userId: user?.id ?? null,
          userName,
          actionType: "CREATE",
          action: `إنشاء كشف: ${name.trim()}`,
          entity: "sheets",
          details: `تم إنشاء كشف جديد بعدد ${validColumns.length} أعمدة`,
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      onCreated();
      onClose();
    } catch (err: any) {
      console.error("Create sheet error:", err);
      setError(err?.message || "حدث خطأ أثناء إنشاء الكشف");
    } finally {
      setSaving(false);
    }
  }

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
            إنشاء كشف جديد
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
              اسم الكشف
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: كشف أفراد الوحدة الأولى"
              dir="rtl"
              className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 15, color: "#2d3648" }}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label style={{ ...F, fontWeight: 700, fontSize: 14, color: "#2d3648" }}>
                الأعمدة
              </label>

              <button
                type="button"
                onClick={addColumnDraft}
                className="flex items-center gap-1.5 text-[#00522e] text-sm"
                style={F}
              >
                <Plus size={16} />
                إضافة عمود
              </button>
            </div>

            {columns.map((col, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={col.name}
                  onChange={(e) =>
                    updateColumnDraft(index, "name", e.target.value)
                  }
                  placeholder={`اسم العمود ${index + 1}`}
                  dir="rtl"
                  className="flex-1 h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
                  style={{ ...F, fontSize: 14, color: "#2d3648" }}
                />

                <select
                  value={col.column_type}
                  onChange={(e) =>
                    updateColumnDraft(index, "column_type", e.target.value)
                  }
                  dir="rtl"
                  className="w-[110px] h-[42px] rounded-[8px] border border-[#e2e7f0] px-2 text-right outline-none focus:border-[#00b867] bg-white"
                  style={{ ...F, fontSize: 13, color: "#2d3648" }}
                >
                  {Object.entries(COLUMN_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                {columns.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeColumnDraft(index)}
                    className="w-[36px] h-[36px] rounded-[6px] flex items-center justify-center shrink-0"
                    style={{ background: "#fce8f1" }}
                  >
                    <Trash2 size={14} color="#e3282c" />
                  </button>
                )}
              </div>
            ))}
          </div>
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
            {saving ? "جاري الإنشاء..." : "إنشاء الكشف"}
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

export function SheetsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  useEffect(() => {
    loadSheets();
  }, []);

  async function loadSheets() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchSheets();
      setSheets(data);
    } catch (err: any) {
      console.error("Load sheets error:", err);
      setError(err?.message || "حدث خطأ أثناء تحميل الكشوفات");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(sheet: Sheet) {
    const confirmed = window.confirm(
      `هل تريد حذف كشف "${sheet.name}"؟ سيتم حذف كل البيانات الموجودة به.`
    );

    if (!confirmed) return;

    setDeletingId(sheet.id);

    try {
      await deleteSheet(sheet.id);

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
          actionType: "DELETE",
          action: `حذف كشف: ${sheet.name}`,
          entity: "sheets",
          details: `تم حذف الكشف نهائيًا`,
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      setSheets((prev) => prev.filter((s) => s.id !== sheet.id));
    } catch (err: any) {
      console.error("Delete sheet error:", err);
      alert(err?.message || "حدث خطأ أثناء حذف الكشف");
    } finally {
      setDeletingId(null);
    }
  }
async function handleDuplicate(sheet: Sheet) {
  const confirmed = window.confirm(
    `هل تريد عمل نسخة من كشف "${sheet.name}"؟`
  );

  if (!confirmed) return;

  setDuplicatingId(sheet.id);

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

    const newSheetId = await duplicateSheet({
      sheetId: sheet.id,
      createdBy: user?.id ?? null,
      createdByName: userName,
    });

    try {
      await logActivity({
        userId: user?.id ?? null,
        userName,
        actionType: "CREATE",
        action: `نسخ كشف: ${sheet.name}`,
        entity: "sheets",
        details: `تم إنشاء نسخة من الكشف "${sheet.name}"`,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    await loadSheets();
    void newSheetId;
  } catch (err: any) {
    console.error("Duplicate sheet error:", err);
    alert(err?.message || "حدث خطأ أثناء نسخ الكشف");
  } finally {
    setDuplicatingId(null);
  }
}
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
          كشوفات
        </h1>

        {hasPermission("sheets:create") && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 h-[46px] px-5 rounded-[8px]"
            style={{ background: "linear-gradient(to bottom,#00b867,#00522e)" }}
          >
            <Plus size={18} color="#fff" />
            <span style={{ ...F, fontSize: 15, color: "#fff" }}>
              إنشاء كشف جديد
            </span>
          </button>
        )}
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

      {loading ? (
        <div className="py-16 text-center">
          <p style={{ ...F, fontSize: 15, color: "#a1aebe" }}>
            جاري تحميل الكشوفات...
          </p>
        </div>
      ) : sheets.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 bg-white rounded-[20px] border border-[#eff0f6]">
          <FileSpreadsheet size={36} className="text-[#cbd5e1]" />
          <p style={{ ...F, fontSize: 15, color: "#a1aebe" }}>
            لا توجد كشوفات حتى الآن
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className="bg-white rounded-[16px] border border-[#eff0f6] p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#DCF4DF] flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={18} color="#00522e" />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="truncate"
                    style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
                  >
                    {sheet.name}
                  </p>

                  <p style={{ ...F, fontSize: 12, color: "#a1aebe" }}>
                    بواسطة {sheet.created_by_name || "غير معروف"}
                  </p>
                </div>
              </div>

              <p style={{ ...F, fontSize: 12, color: "#a1aebe" }}>
                {new Date(sheet.created_at).toLocaleDateString("ar-EG", {
                  dateStyle: "medium",
                })}
              </p>

              <div className="flex items-center gap-2 pt-2 border-t border-[#eff0f6]">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/dashboard/sheets/${sheet.id}`)
                  }
                  className="flex-1 h-9 rounded-[7px] flex items-center justify-center gap-1.5"
                  style={{ background: "#f0f2fd" }}
                >
                  <Eye size={14} color="#1f3d97" />
                  <span style={{ ...F, fontSize: 13, color: "#1f3d97" }}>
                    فتح
                  </span>
                </button>
{hasPermission("sheets:create") && (
  <button
    type="button"
    onClick={() => handleDuplicate(sheet)}
    disabled={duplicatingId === sheet.id}
    className="w-9 h-9 rounded-[7px] flex items-center justify-center shrink-0 disabled:opacity-50"
    style={{ background: "#fff4de" }}
    title="نسخ الكشف"
  >
    <Copy size={14} color="#b45309" />
  </button>
)}
                {hasPermission("sheets:delete") && (
                  <button
                    type="button"
                    onClick={() => handleDelete(sheet)}
                    disabled={deletingId === sheet.id}
                    className="w-9 h-9 rounded-[7px] flex items-center justify-center disabled:opacity-50"
                    style={{ background: "#fce8f1" }}
                  >
                    <Trash2 size={14} color="#e3282c" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateSheetModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadSheets}
        />
      )}
    </div>
  );
}