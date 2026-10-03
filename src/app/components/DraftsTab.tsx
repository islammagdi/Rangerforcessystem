import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router";
import {
  listLetterDrafts,
  deleteLetterDraft,
  openLetterDraft,
  type DraftListItem,
} from "../../lib/letterDraft";

const F: CSSProperties = { fontFamily: "'Almarai', sans-serif" };

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function daysLeft(iso: string) {
  return Math.max(
    0,
    Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  );
}

export function DraftsTab() {
  const navigate = useNavigate();

  const [items, setItems] = useState<DraftListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await listLetterDrafts();

    if (result.ok) setItems(result.items);
    else setError(result.error);

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleContinue(id: string) {
    setBusyId(id);
    setError("");

    const result = await openLetterDraft(id);

    setBusyId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate(result.route, { state: result.navState });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذه المسودة؟")) return;

    setBusyId(id);
    const result = await deleteLetterDraft(id);
    setBusyId(null);

    if (!result.ok) {
      setError(`تعذر حذف المسودة: ${result.error}`);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ ...F, color: "#4a5468" }} dir="rtl">
        جاري تحميل المسودات...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl">
      {error && (
        <div
          className="rounded-[10px] px-4 py-3"
          style={{ ...F, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
        >
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div
          className="bg-white rounded-[20px] border border-[#eff0f6] text-center"
          style={{ ...F, padding: 40, color: "#717d96" }}
        >
          لا توجد مسودات محفوظة
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-[12px] border border-[#e2e7f0] bg-white">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="bg-[#f7f9fc]">
                {[
                  "نوع الخطاب",
                  "عدد الأفراد",
                  "الخطوة",
                  "أنشأها",
                  "آخر تعديل",
                  "تنتهي بعد",
                  "الإجراء",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-right border-b border-[#e2e7f0]">
                    <span style={{ ...F, fontSize: 14, color: "#717d96" }}>{h}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.map((item) => {
                const left = daysLeft(item.expiresAt);
                const busy = busyId === item.id;

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 border-b border-[#e2e7f0]">
                      <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                        {item.letterTypeName}
                      </span>
                    </td>

                    <td className="px-4 py-3 border-b border-[#e2e7f0]">
                      <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                        {item.personnelCount.toLocaleString("ar-EG")}
                      </span>
                    </td>

                    <td className="px-4 py-3 border-b border-[#e2e7f0]">
                      <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                        {item.currentStep === 3 ? "بيانات الخطاب" : "تحديد الأفراد"}
                      </span>
                    </td>

                    <td className="px-4 py-3 border-b border-[#e2e7f0]">
                      <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                        {item.createdByName}
                      </span>
                    </td>

                    <td className="px-4 py-3 border-b border-[#e2e7f0]">
                      <div className="flex flex-col">
                        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                          {formatDateTime(item.updatedAt)}
                        </span>
                        <span style={{ ...F, fontSize: 12, color: "#717d96" }}>
                          بواسطة {item.updatedByName}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 border-b border-[#e2e7f0]">
                      <span
                        style={{
                          ...F,
                          fontSize: 14,
                          color: left <= 1 ? "#b91c1c" : "#2d3648",
                          fontWeight: left <= 1 ? 700 : 400,
                        }}
                      >
                        {left === 0 ? "اليوم" : `${left.toLocaleString("ar-EG")} يوم`}
                      </span>
                    </td>

                    <td className="px-4 py-3 border-b border-[#e2e7f0]">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleContinue(item.id)}
                          className="px-4 py-2 rounded-[8px]"
                          style={{
                            background: "linear-gradient(to bottom,#00b867,#00522e)",
                            opacity: busy ? 0.6 : 1,
                          }}
                        >
                          <span style={{ ...F, fontSize: 14, color: "#fff" }}>
                            {busy ? "جاري الفتح..." : "متابعة"}
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDelete(item.id)}
                          className="px-4 py-2 rounded-[8px]"
                          style={{ background: "#fce8f1", opacity: busy ? 0.6 : 1 }}
                        >
                          <span style={{ ...F, fontSize: 14, color: "#e3282c" }}>
                            حذف
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}