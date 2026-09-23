import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Pencil } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

type LetterTypeRow = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  numbering_digit: number | null;
};

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
      style={{
        background: isActive ? "#dcfce7" : "#f1f3f9",
        ...F,
        fontSize: 12,
        fontWeight: 700,
        color: isActive ? "#166534" : "#4a5468",
        whiteSpace: "nowrap",
      }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: isActive ? "#16a34a" : "#a1aebe" }}
      />
      {isActive ? "نشط" : "متوقف"}
    </span>
  );
}

export function LetterTypesManagementPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
const canCreate = hasPermission("letter_types:create");
const canEdit = hasPermission("letter_types:edit");
const canToggle = hasPermission("letter_types:toggle");
  const [letterTypes, setLetterTypes] = useState<LetterTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function loadLetterTypes() {
    setLoading(true);
    setError("");

    // ✅ الترتيب بقى برقم الخطاب (numbering_digit) تصاعديًا بدل الاسم
    const { data, error } = await supabase
      .from("letter_types")
      .select("id, name, code, is_active, numbering_digit")
      .order("numbering_digit", { ascending: true });

    if (error) {
   
      setError(`تعذر تحميل أنواع الخطابات: ${error.message}`);
      setLetterTypes([]);
    } else {
      setLetterTypes(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadLetterTypes();
  }, []);

async function handleToggleActive(row: LetterTypeRow) {
  if (!canToggle) return;
  setTogglingId(row.id);
  // ...باقي الدالة زي ما هي

    const { error } = await supabase
      .from("letter_types")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);

    if (error) {
 
      alert(`تعذر تحديث حالة الخطاب: ${error.message}`);
    } else {
      setLetterTypes((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, is_active: !item.is_active } : item
        )
      );
    }

    setTogglingId(null);
  }

  if (!hasPermission("letter_types:manage")) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 w-full min-h-[300px]"
        dir="rtl"
      >
        <p style={{ ...F, fontSize: 16, color: "#717d96" }}>
          ليس لديك صلاحية الوصول لهذه الصفحة.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between w-full flex-wrap gap-4">
        <h1
          style={{
            ...F,
            fontWeight: 700,
            fontSize: "clamp(22px,4vw,28px)",
            color: "#2d3648",
          }}
        >
          إدارة الخطابات
        </h1>

{canCreate && (
  <button
    type="button"
    onClick={() => navigate("/dashboard/manage-letter-types/new")}
    className="flex items-center gap-2 min-h-[44px] px-5 rounded-[8px]"
    style={{ background: "linear-gradient(to bottom,#00b867,#00522e)" }}
  >
    <Plus size={16} color="#fff" />
    <span style={{ ...F, fontSize: 15, color: "#fff" }}>إضافة نوع خطاب جديد</span>
  </button>
)}
      </div>

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{ ...F, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
        >
          {error}
        </div>
      )}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span style={{ ...F, fontSize: 15, color: "#717d96" }}>
              جاري تحميل أنواع الخطابات...
            </span>
          </div>
        ) : letterTypes.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <span style={{ ...F, fontSize: 15, color: "#717d96" }}>
              لا توجد أنواع خطابات مسجّلة بعد.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse">
              <thead>
                <tr className="bg-[#f7f9fc]">
                  <th className="px-4 py-3 text-right border-b border-[#e2e7f0]">
                    <span style={{ ...F, fontSize: 14, color: "#717d96" }}>اسم الخطاب</span>
                  </th>
                  <th className="px-4 py-3 text-right border-b border-[#e2e7f0]">
                    <span style={{ ...F, fontSize: 14, color: "#717d96" }}>الكود</span>
                  </th>
                  <th className="px-4 py-3 text-right border-b border-[#e2e7f0]">
                    <span style={{ ...F, fontSize: 14, color: "#717d96" }}>رقم الخطاب</span>
                  </th>
                  <th className="px-4 py-3 text-right border-b border-[#e2e7f0]">
                    <span style={{ ...F, fontSize: 14, color: "#717d96" }}>الحالة</span>
                  </th>
{(canEdit || canToggle) && (
  <th className="px-4 py-3 text-right border-b border-[#e2e7f0]">
    <span style={{ ...F, fontSize: 14, color: "#717d96" }}>الإجراءات</span>
  </th>
)}
                </tr>
              </thead>

              <tbody>
                {letterTypes.map((row) => (
                  <tr key={row.id} className="hover:bg-[#fafbff]">
                    <td className="px-4 py-3 border-b border-[#e2e7f0]">
                      <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{row.name}</span>
                    </td>

                    <td className="px-4 py-3 border-b border-[#e2e7f0]">
                      <span
                        style={{
                          ...F,
                          fontSize: 13,
                          color: "#717d96",
                          direction: "ltr",
                          display: "inline-block",
                        }}
                      >
                        {row.code}
                      </span>
                    </td>

                    <td className="px-4 py-3 border-b border-[#e2e7f0]">
                      <span style={{ ...F, fontSize: 14, color: "#2d3648", fontWeight: 700 }}>
                        {row.numbering_digit ?? "-"}
                      </span>
                    </td>

                    <td className="px-4 py-3 border-b border-[#e2e7f0]">
                      <StatusBadge isActive={row.is_active} />
                    </td>

{(canEdit || canToggle) && (
  <td className="px-4 py-3 border-b border-[#e2e7f0]">
    <div className="flex items-center gap-2">
      {canEdit && (
        <button
          type="button"
          onClick={() => navigate(`/dashboard/manage-letter-types/${row.id}`)}
          className="w-8 h-8 rounded-[6px] flex items-center justify-center"
          style={{ backgroundColor: "#ebedfd" }}
          title="تعديل"
        >
          <Pencil size={14} style={{ color: "#1f3d97" }} />
        </button>
      )}

      {canToggle && (
        <button
          type="button"
          disabled={togglingId === row.id}
          onClick={() => handleToggleActive(row)}
          className="px-3 h-8 rounded-[6px]"
          style={{
            ...F,
            fontSize: 13,
            border: "1px solid #e2e7f0",
            color: row.is_active ? "#b91c1c" : "#166534",
            opacity: togglingId === row.id ? 0.6 : 1,
          }}
        >
          {togglingId === row.id ? "..." : row.is_active ? "إيقاف" : "تفعيل"}
        </button>
      )}
    </div>
  </td>
)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}