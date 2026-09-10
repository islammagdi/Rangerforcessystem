import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, BellRing } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;

  action_type?: string;
  action_data?: any;
  status?: string;
}

const TYPE_DOT_COLOR: Record<string, string> = {
  info: "#294dbb",
  success: "#00a85a",
  warning: "#e37032",
  critical: "#e3282c",
};

export function NotificationBell() {
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationRow | null>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // تحميل آخر 20 إشعار + الإشعارات اللي المستخدم الحالي قراها
  // ============================================================

  async function loadNotifications() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: notifData, error: notifError } = await supabase
      .from("notifications")
      .select(`
  id,
  title,
  body,
  type,
  created_at,
  action_type,
  action_data,
  status
`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (notifError) {
      console.error("loadNotifications error:", notifError);
      setLoading(false);
      return;
    }

    setNotifications(notifData ?? []);

    if (user) {
      const { data: readsData, error: readsError } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", user.id);

      if (readsError) {
        console.error("loadReads error:", readsError);
      } else {
        setReadIds(new Set((readsData ?? []).map((r) => r.notification_id)));
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    loadNotifications();

    // تحديث لحظي: أي إشعار جديد يتحط في القائمة أوتوماتيك
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [
            payload.new as NotificationRow,
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ============================================================
  // إغلاق القائمة عند الضغط بره
  // ============================================================

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================================
  // تعليم إشعار كمقروء
  // ============================================================

  async function markAsRead(notificationId: string) {
    if (readIds.has(notificationId)) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setReadIds((prev) => new Set(prev).add(notificationId));

    const { error } = await supabase.from("notification_reads").upsert({
      notification_id: notificationId,
      user_id: user.id,
    });

    if (error) {
      console.error("markAsRead error:", error);
    }
  }

  // ============================================================
  // إعادة تعيين كلمة المرور من الإشعار
  // ============================================================

  async function handleResetPasswordFromNotification() {
    if (!selectedNotification) return;

    try {
      console.log("Notification:", selectedNotification);
      console.log("Action Data:", selectedNotification.action_data);

      const { data, error } = await supabase.functions.invoke(
        "reset-user-password",
        {
          body: {
            user_id: selectedNotification.action_data.user_id,
          },
        }
      );

      if (error) throw error;

      if (!data?.success) {
        throw new Error(
          data?.error || data?.message || "فشل إعادة تعيين كلمة المرور"
        );
      }

      // ✅ إجبار المستخدم على تغيير كلمة المرور في أول تسجيل دخول
      const { error: forceChangeError } = await supabase
        .from("profiles")
        .update({
          must_change_password: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedNotification.action_data.user_id);

      if (forceChangeError) {
        console.error(
          "FORCE PASSWORD CHANGE FLAG ERROR:",
          forceChangeError
        );
      }

      await supabase
        .from("notifications")
        .update({
          status: "completed",
        })
        .eq("id", selectedNotification.id);

      alert("تم إعادة تعيين كلمة المرور");

      setSelectedNotification(null);

      loadNotifications();
    } catch (err: any) {
      console.error("ERROR:", err);

      alert(
        err?.message ||
          JSON.stringify(err) ||
          "فشل إعادة تعيين كلمة المرور"
      );
    }
  }

  const unreadCount = notifications.filter(
    (n) => !readIds.has(n.id)
  ).length;

  function timeAgo(dateStr: string) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "الآن";
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;

    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  }

  return (
    <div className="relative shrink-0" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#f5f6fb] transition-colors"
        aria-label="الإشعارات"
      >
        <Bell size={20} style={{ color: "#2d3648" }} />

        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1"
            style={{
              background: "#e3282c",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          dir="rtl"
          className="absolute left-0 top-[calc(100%+8px)] z-50 bg-white rounded-[12px] border border-[#eff0f6] shadow-lg overflow-hidden w-[320px] max-w-[90vw]"
        >
          <div className="px-4 py-3 border-b border-[#eff0f6]">
            <span
              style={{
                ...F,
                fontSize: 15,
                fontWeight: 700,
                color: "#2d3648",
              }}
            >
              الإشعارات
            </span>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center">
                <span style={{ ...F, fontSize: 13, color: "#a1aebe" }}>
                  جاري التحميل...
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <span style={{ ...F, fontSize: 13, color: "#a1aebe" }}>
                  لا توجد إشعارات
                </span>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !readIds.has(n.id);

                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markAsRead(n.id);
                      setSelectedNotification(n);
                    }}
                    className="w-full flex items-start gap-2.5 px-4 py-3 text-right border-b border-[#f5f6fb] hover:bg-[#fafbff] transition-colors"
                    style={{
                      background: isUnread ? "#f7f9ff" : "#fff",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{
                        background: isUnread
                          ? TYPE_DOT_COLOR[n.type] ?? "#294dbb"
                          : "transparent",
                      }}
                    />

                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span
                        style={{
                          ...F,
                          fontSize: 13,
                          fontWeight: isUnread ? 700 : 400,
                          color: "#2d3648",
                        }}
                      >
                        {n.title}
                      </span>

                      <span
                        style={{
                          ...F,
                          fontSize: 12,
                          color: "#717d96",
                        }}
                      >
                        {n.body}
                      </span>

                      <span
                        style={{
                          ...F,
                          fontSize: 11,
                          color: "#a1aebe",
                          marginTop: 2,
                        }}
                      >
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-[#eff0f6]">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/dashboard/notifications");
              }}
              className="w-full py-3 text-center hover:bg-[#f5f6fb] transition-colors"
            >
              <span
                style={{
                  ...F,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1f3d97",
                }}
              >
                عرض جميع الإشعارات
              </span>
            </button>
          </div>
        </div>
      )}

      {selectedNotification && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-[420px] max-w-[95vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                ...F,
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 15,
              }}
            >
              {selectedNotification.title}
            </h2>

            <p
              style={{
                ...F,
                fontSize: 14,
                marginBottom: 20,
              }}
            >
              {selectedNotification.body}
            </p>

            {selectedNotification.action_type === "password_reset" &&
              selectedNotification.status === "pending" && (
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  onClick={handleResetPasswordFromNotification}
                >
                  إعادة تعيين كلمة المرور
                </button>
              )}

            <button
              className="mr-3 px-4 py-2 rounded-lg border"
              onClick={() => setSelectedNotification(null)}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}