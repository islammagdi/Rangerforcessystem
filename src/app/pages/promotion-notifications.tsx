import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";

export function PromotionNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermissions();

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const { data, error } = await supabase
        .from("promotion_notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span style={{ fontFamily: "'Almarai', sans-serif" }}>
          جاري التحميل...
        </span>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Almarai', sans-serif" }}>
      <h1 className="text-2xl font-bold mb-6">نشرات الترقي</h1>
      
      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg p-6 text-center text-gray-500">
          لا توجد نشرات ترقي حالياً
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right">الاسم</th>
                <th className="px-6 py-3 text-right">الرتبة الجديدة</th>
                <th className="px-6 py-3 text-right">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notif: any) => (
                <tr key={notif.id} className="border-t">
                  <td className="px-6 py-4">{notif.name}</td>
                  <td className="px-6 py-4">{notif.new_rank}</td>
                  <td className="px-6 py-4">
                    {new Date(notif.created_at).toLocaleDateString("ar-EG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}