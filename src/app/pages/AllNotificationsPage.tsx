import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { handleNotificationAction } from "../lib/notificationActions";
import { Bell, ArrowRight } from "lucide-react";
import { supabase } from "../../lib/supabase";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};
interface NotificationRow {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
  created_by_name: string | null;
  entity_type: string | null;
  entity_id: string | null;
}

const TYPE_DOT_COLOR: Record<string, string> = {
  info: "#294dbb",
  success: "#00a85a",
  warning: "#e37032",
  critical: "#e3282c",
};

const TYPE_LABELS: Record<string, string> = {
  all: "الكل",
  info: "معلومات",
  success: "نجاح",
  warning: "تنبيه",
  critical: "حرج",
};

const PAGE_SIZE = 20;

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr);

  return d.toLocaleString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AllNotificationsPage() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  async function loadFirstPage() {
    setLoading(true);
    setHasMore(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase
      .from("notifications")
      .select(
        "id, title, body, type, created_at, created_by_name, entity_type, entity_id"
      )
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1);

    if (typeFilter !== "all") {
      query = query.eq("type", typeFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("loadFirstPage error:", error);
      setLoading(false);
      return;
    }

    setNotifications(data ?? []);
    setHasMore((data ?? []).length === PAGE_SIZE);

    if (user) {
      const { data: readsData } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", user.id);

      setReadIds(new Set((readsData ?? []).map((r) => r.notification_id)));
    }

    setLoading(false);
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    let query = supabase
      .from("notifications")
      .select("id, title, body, type, created_at, created_by_name, entity_type, entity_id")
      .order("created_at", { ascending: false })
      .range(notifications.length, notifications.length + PAGE_SIZE - 1);

    if (typeFilter !== "all") {
      query = query.eq("type", typeFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("loadMore error:", error);
      setLoadingMore(false);
      return;
    }

    setNotifications((prev) => [...prev, ...(data ?? [])]);
    setHasMore((data ?? []).length === PAGE_SIZE);
    setLoadingMore(false);
  }

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

  return (
    <div className="flex flex-col gap-5 w-full pb-10" dir="rtl">
      {/* العنوان */}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1
          style={{
            ...F,
            fontWeight: 700,
            fontSize: "clamp(22px,4vw,32px)",
            color: "#2d3648",
          }}
        >
          جميع الإشعارات
        </h1>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 h-[42px] px-4 rounded-[8px] border border-[#e2e7f0] bg-white hover:bg-[#f5f6fb] transition-colors"
        >
          <ArrowRight size={16} />
          <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>رجوع</span>
        </button>
      </div>

      {/* الفلاتر */}

      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTypeFilter(key)}
            className="h-[38px] px-4 rounded-full border transition-colors"
            style={{
              ...F,
              fontSize: 13,
              borderColor: typeFilter === key ? "#1f3d97" : "#e2e7f0",
              background: typeFilter === key ? "#f0f2fd" : "#fff",
              color: typeFilter === key ? "#1f3d97" : "#717d96",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* القائمة */}

      <div className="bg-white rounded-[16px] border border-[#eff0f6] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <span style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
              جاري التحميل...
            </span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Bell size={32} className="text-[#cbd2e0]" />
            <span style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
              لا توجد إشعارات
            </span>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((n, idx) => {
              const isUnread = !readIds.has(n.id);

              return (
               <button
                  key={n.id}
                  type="button"
                  onClick={async () => {
                    await markAsRead(n.id);
                    await handleNotificationAction(n, navigate);
                  }}
                  className={`w-full flex items-start gap-3 px-5 py-4 text-right hover:bg-[#fafbff] transition-colors ${
                    idx !== notifications.length - 1
                      ? "border-b border-[#f5f6fb]"
                      : ""
                  }`}
                  style={{
                    background: isUnread ? "#f7f9ff" : "#fff",
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{
                      background: isUnread
                        ? TYPE_DOT_COLOR[n.type] ?? "#294dbb"
                        : "#e2e7f0",
                    }}
                  />

                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        style={{
                          ...F,
                          fontSize: 14,
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
                          color: "#a1aebe",
                        }}
                      >
                        {formatFullDate(n.created_at)}
                      </span>
                    </div>

                    <span
                      style={{
                        ...F,
                        fontSize: 13,
                        color: "#717d96",
                      }}
                    >
                      {n.body}
                    </span>

                    {n.created_by_name && (
                      <span
                        style={{
                          ...F,
                          fontSize: 12,
                          color: "#a1aebe",
                        }}
                      >
                        بواسطة: {n.created_by_name}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* تحميل المزيد */}

      {!loading && hasMore && notifications.length > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="h-[44px] px-6 rounded-[8px] border border-[#e2e7f0] bg-white hover:bg-[#f5f6fb] transition-colors disabled:opacity-50"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          >
            {loadingMore ? "جاري التحميل..." : "تحميل المزيد"}
          </button>
        </div>
      )}
    </div>
  );
}