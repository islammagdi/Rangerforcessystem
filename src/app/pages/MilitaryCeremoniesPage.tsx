import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Loader2, X, Search, ChevronLeft, CalendarDays } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { logActivity } from "../../lib/logActivity";

// =====================================================
// Helpers مشتركة (بتستخدمها صفحة تفاصيل الزيارة كمان)
// =====================================================

export const toAr = (value: string | number): string =>
  String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

export function formatVisitDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function logCeremony(actionType: string, action: string, details: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, full_name")
      .eq("id", user.id)
      .maybeSingle();

    await logActivity({
      userId: user.id,
      userName: profile?.full_name ?? profile?.username ?? "مستخدم غير معروف",
      actionType,
      action,
      entity: "المراسم العسكرية",
      details,
    } as any);
  } catch {
    // التسجيل مش لازم يوقف الشغل
  }
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// =====================================================
// Types
// =====================================================

type VisitRow = {
  id: string;
  title: string;
  visit_date: string;
  guest_count: number;
  host_count: number;
};

// =====================================================
// الصفحة
// =====================================================

export function MilitaryCeremoniesPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("military_ceremonies:edit");

  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(todayIso());
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("military_ceremony_visits")
      .select("id, title, visit_date, created_at, military_ceremony_attendees(side)")
      .order("visit_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (loadError) {
      setError("تعذر تحميل الزيارات: " + loadError.message);
      setLoading(false);
      return;
    }

    setVisits(
      (data ?? []).map((row: any) => {
        const attendees: { side: string }[] = row.military_ceremony_attendees ?? [];
        return {
          id: row.id,
          title: row.title,
          visit_date: row.visit_date,
          guest_count: attendees.filter((a) => a.side === "guest").length,
          host_count: attendees.filter((a) => a.side === "host").length,
        };
      })
    );
    setLoading(false);
  }

  async function handleCreate() {
    const title = newTitle.trim();

    if (!title) {
      setError("اكتب اسم الزيارة.");
      return;
    }

    if (!newDate) {
      setError("اختر تاريخ الزيارة.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const { data, error: insertError } = await supabase
        .from("military_ceremony_visits")
        .insert({ title, visit_date: newDate })
        .select("id")
        .single();

      if (insertError) {
        setError("تعذر إنشاء الزيارة: " + insertError.message);
        return;
      }

      await logCeremony("CREATE", "إنشاء زيارة", `${title} - ${newDate}`);
      navigate(`/dashboard/military-ceremonies/${data.id}`);
    } finally {
      setCreating(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim();
    return q ? visits.filter((v) => v.title.includes(q)) : visits;
  }, [visits, search]);

  return (
    <div
      className="flex flex-col gap-4 w-full"
      dir="rtl"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      {/* شريط البحث + زيارة جديدة */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم الزيارة"
            className="w-full h-[42px] rounded-lg border border-[#cbd5e1] pr-9 pl-3 outline-none focus:border-[#00B867]"
            style={{ fontSize: 14 }}
          />
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="flex items-center gap-1 px-4 h-[42px] rounded-lg bg-[#DCF4DF] text-[#00522E] hover:opacity-80 transition-opacity"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            <Plus size={16} />
            زيارة جديدة
          </button>
        )}
      </div>

      {/* إنشاء زيارة */}
      {showCreate && canEdit && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label style={{ fontSize: 13, color: "#717d96", display: "block", marginBottom: 4 }}>
              اسم الزيارة *
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="مثال: زيارة السيد قائد ..."
              className="w-full h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]"
              style={{ fontSize: 14 }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: "#717d96", display: "block", marginBottom: 4 }}>
              تاريخ الزيارة *
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]"
              style={{ fontSize: 14 }}
            />
          </div>

          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating}
            className="flex items-center gap-2 px-5 h-[42px] rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            {creating && <Loader2 size={14} className="animate-spin" />}
            إنشاء الزيارة
          </button>

          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className="h-[42px] px-4 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-gray-50"
            style={{ fontSize: 14 }}
          >
            إلغاء
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl px-5 py-3 bg-[#fef2f2] border border-[#fecaca] flex items-center justify-between">
          <span style={{ color: "#991b1b", fontSize: 14, fontWeight: 700 }}>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-[#991b1b]">
            <X size={16} />
          </button>
        </div>
      )}

      {/* قائمة الزيارات */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-[#00B867]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[#717d96]" style={{ fontSize: 14 }}>
            {visits.length === 0
              ? canEdit
                ? "لا توجد زيارات بعد. اضغط «زيارة جديدة» للبدء."
                : "لا توجد زيارات مسجلة."
              : "لا توجد زيارات مطابقة للبحث."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                  <th className="text-right px-4 py-3">الزيارة</th>
                  <th className="text-right px-4 py-3">التاريخ</th>
                  <th className="text-right px-4 py-3">الضيوف</th>
                  <th className="text-right px-4 py-3">المستضيف</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>

              <tbody>
                {filtered.map((visit) => (
                  <tr
                    key={visit.id}
                    onClick={() => navigate(`/dashboard/military-ceremonies/${visit.id}`)}
                    className="border-t border-[#eff0f6] cursor-pointer hover:bg-[#fafbff]"
                  >
                    <td className="px-4 py-3" style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                      {visit.title}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-[#94a3b8]" />
                        {formatVisitDate(visit.visit_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                      {toAr(visit.guest_count)}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                      {toAr(visit.host_count)}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <ChevronLeft size={16} className="text-[#94a3b8] inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}