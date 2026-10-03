import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, X, Loader2 } from "lucide-react";

const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

export function SoftDeleteDialog({
  open,
  subtitle,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  subtitle?: string;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  async function submit() {
    if (!reason.trim()) {
      setError("اكتب سبب الحذف.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onConfirm(reason.trim());
    } catch (err: any) {
      setError(err?.message || "تعذر حذف الفرد");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div className="bg-white rounded-[20px] p-6 w-full max-w-md flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#fce8f1" }}>
            <Trash2 size={18} style={{ color: "#e3282c" }} />
          </div>
          <button type="button" onClick={onCancel} disabled={saving} className="text-[#aaa] hover:text-[#555]">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <p style={{ ...F, fontSize: 18, fontWeight: 700, color: "#2d3648" }}>حذف الفرد</p>
          {subtitle && <p style={{ ...F, fontSize: 14, color: "#717d96" }}>{subtitle}</p>}
          <p style={{ ...F, fontSize: 13, color: "#717d96", lineHeight: 1.7 }}>
            الحذف مخصص للأفراد المسجلين بالخطأ. الفرد هيختفي من المنظومة، وبياناته بتفضل محفوظة وممكن تتسترجع.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontSize: 13, color: "#717d96" }}>سبب الحذف *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            autoFocus
            placeholder="مثال: الفرد اتسجل مرتين برقمين مختلفين"
            className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 outline-none focus:border-[#e3282c] resize-none"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />
        </div>

        {error && (
          <p
            className="rounded-[8px] px-3 py-2"
            style={{ ...F, fontSize: 13, color: "#9d2e15", background: "#fce9ea", lineHeight: 1.7 }}
          >
            {error}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="flex items-center gap-2 px-5 h-[44px] rounded-[8px] text-white disabled:opacity-50"
            style={{ ...F, fontSize: 14, background: "#e3282c" }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            حذف الفرد
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-5 h-[44px] rounded-[8px] border border-[#e2e7f0]"
            style={{ ...F, fontSize: 14, color: "#717d96" }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}