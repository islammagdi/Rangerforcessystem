import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, FileText } from "lucide-react";
import {
  fetchBulletins,
  createBulletin,
  bulletinLabel,
  type PromotionBulletin,
} from "../../lib/promotionBulletins";
import { usePermissions } from "../../lib/usePermissions";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

export function PromotionNotificationsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("promotion_bulletin:edit");

  const [bulletins, setBulletins] = useState<PromotionBulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newMonth, setNewMonth] = useState<1 | 7>(7);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newDecisionNumber, setNewDecisionNumber] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchBulletins();
      setBulletins(data);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل النشرات");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newDecisionNumber.trim()) {
      setError("رقم قرار النشرة مطلوب");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const id = await createBulletin({
        bulletin_month: newMonth,
        bulletin_year: newYear,
        decision_number: newDecisionNumber.trim(),
      });

      setShowCreate(false);
      setNewDecisionNumber("");
      navigate(`/dashboard/promotion-notifications/${id}`);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إنشاء النشرة");
    } finally {
      setCreating(false);
    }
  }

  const inputClass =
    "h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white";

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 style={{ ...F, fontWeight: 700, fontSize: "clamp(20px,3.5vw,28px)", color: "#2d3648" }}>
          نشرة الترقي
        </h1>

        {canEdit && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px]"
            style={{ background: "#DCF4DF" }}
          >
            <Plus size={15} color="#2d3648" />
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>إنشاء نشرة جديدة</span>
          </button>
        )}
      </div>

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", ...F, fontSize: 14 }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ ...F, fontSize: 14, color: "#717d96" }}>جاري تحميل النشرات...</p>
      ) : bulletins.length === 0 ? (
        <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>لا يوجد نشرات ترقي مضافة بعد</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bulletins.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => navigate(`/dashboard/promotion-notifications/${b.id}`)}
              className="bg-white rounded-[16px] border border-[#eff0f6] p-5 flex flex-col gap-3 text-right hover:border-[#00b867] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#DCF4DF] flex items-center justify-center shrink-0">
                  <FileText size={18} color="#00522e" />
                </div>

                <div className="flex flex-col">
                  <span style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>
                    {bulletinLabel(b.bulletin_month, b.bulletin_year)}
                  </span>
                  <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                    عدد الأفراد: {b.item_count}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#eff0f6]">
                {b.status === "published" ? (
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ background: "#dcfce7", ...F, fontSize: 12, fontWeight: 700, color: "#166534" }}
                  >
                    منشورة
                  </span>
                ) : (
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ background: "#fef3c7", ...F, fontSize: 12, fontWeight: 700, color: "#92400e" }}
                  >
                    مسودة
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          dir="rtl"
        >
          <div className="bg-white rounded-[16px] p-6 w-full max-w-[400px] flex flex-col gap-4">
            <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>إنشاء نشرة ترقي</span>

            <div className="flex flex-col gap-1.5">
              <label style={{ ...F, fontSize: 13, color: "#717d96" }}>الدورة</label>
              <select
                value={newMonth}
                onChange={(e) => setNewMonth(Number(e.target.value) as 1 | 7)}
                dir="rtl"
                className={inputClass}
                style={F}
              >
                <option value={7}>يوليو</option>
                <option value={1}>يناير</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{ ...F, fontSize: 13, color: "#717d96" }}>السنة</label>
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(Number(e.target.value))}
                className={inputClass}
                style={F}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{ ...F, fontSize: 13, color: "#717d96" }}>رقم قرار النشرة</label>
              <input
                type="text"
                value={newDecisionNumber}
                onChange={(e) => setNewDecisionNumber(e.target.value)}
                dir="rtl"
                className={inputClass}
                style={F}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 h-[42px] rounded-[8px] disabled:opacity-50"
                style={{ background: "linear-gradient(to bottom,#00b867,#00522e)", ...F, fontSize: 14, color: "#fff" }}
              >
                {creating ? "جاري الإنشاء..." : "إنشاء"}
              </button>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
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