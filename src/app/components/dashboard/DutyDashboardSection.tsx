import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CalendarDays, Megaphone, ChevronLeft } from "lucide-react";
import { supabase } from "../../../lib/supabase";

// ⚠️ عدّل المسار ده لو صفحة النوبتجية عندك على رابط مختلف
const BRANCH_DUTY_ROUTE = "/dashboard/branch-duty";

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const WEEKDAYS = [
  "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت",
];

const FONT: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

const toAr = (value: string | number): string =>
  String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

const pad = (n: number) => String(n).padStart(2, "0");

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseISO(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return { y, m, d };
}

function dayLabel(value: string): string {
  const { y, m, d } = parseISO(value);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${weekday} ${toAr(d)}/${toAr(m)}`;
}

function rangeLabel(start: string, end: string): string {
  return start === end ? dayLabel(start) : `${dayLabel(start)} – ${dayLabel(end)}`;
}

function dayCount(start: string, end: string): number {
  return parseISO(end).d - parseISO(start).d + 1;
}

type PublishAlert = {
  rosterId: string;
  year: number;
  month: number;
  notificationIds: string[];
};

type MyRoster = { id: string; year: number; month: number };

type MyShift = {
  id: string;
  start_date: string;
  end_date: string;
  note: string | null;
  signed_at: string | null;
};

type ShiftState = "past" | "today" | "upcoming";

function shiftState(shift: MyShift, today: string): ShiftState {
  if (shift.end_date < today) return "past";
  if (shift.start_date <= today) return "today";
  return "upcoming";
}

const STATE_META: Record<ShiftState, { label: string; bg: string; color: string }> = {
  today: { label: "اليوم", bg: "#DCF4DF", color: "#00522E" },
  upcoming: { label: "قادمة", bg: "#e8f0fe", color: "#172e78" },
  past: { label: "انتهت", bg: "#f1f5f9", color: "#64748b" },
};

export function DutyDashboardSection() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<PublishAlert[]>([]);
  const [myRoster, setMyRoster] = useState<MyRoster | null>(null);
  const [myShifts, setMyShifts] = useState<MyShift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserId(user.id);
      await Promise.all([loadPublishAlerts(user.id), loadMyShifts(user.id)]);
    } catch (error) {
      console.error("خطأ في تحميل بيانات النوبتجيات:", error);
    } finally {
      setLoading(false);
    }
  }

  // تنبيهات النشر اللي لسه ما اتقرتش
  async function loadPublishAlerts(uid: string) {
    const { data: notifs, error } = await supabase
      .from("notifications")
      .select("id, entity_id")
      .eq("target_user_id", uid)
      .eq("entity_type", "duty_roster")
      .like("title", "تم نشر نوبتجية%");

    if (error || !notifs || notifs.length === 0) {
      setAlerts([]);
      return;
    }

    const ids = notifs.map((n) => n.id);

    const { data: reads } = await supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("user_id", uid)
      .in("notification_id", ids);

    const readSet = new Set((reads ?? []).map((r: any) => r.notification_id));
    const unread = notifs.filter((n) => n.entity_id && !readSet.has(n.id));

    if (unread.length === 0) {
      setAlerts([]);
      return;
    }

    const rosterIds = Array.from(new Set(unread.map((n) => n.entity_id as string)));

    // بنجيب الشهر والسنة من النوبتجية نفسها (ولو اتحذفت مش هتظهر)
    const { data: rosters } = await supabase
      .from("duty_rosters")
      .select("id, year, month")
      .in("id", rosterIds)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    setAlerts(
      (rosters ?? []).map((r: any) => ({
        rosterId: r.id,
        year: r.year,
        month: r.month,
        notificationIds: unread.filter((n) => n.entity_id === r.id).map((n) => n.id),
      }))
    );
  }

  // نوبتجياتي في الشهر الحالي (بعد الاعتماد وتوقيع رئيس الفرع)
  async function loadMyShifts(uid: string) {
    const now = new Date();

    const { data: roster } = await supabase
      .from("duty_rosters")
      .select("id, year, month")
      .eq("year", now.getFullYear())
      .eq("month", now.getMonth() + 1)
      .eq("status", "approved")
      .not("head_signed_at", "is", null)
      .maybeSingle();

    if (!roster) {
      setMyRoster(null);
      setMyShifts([]);
      return;
    }

    const { data: shifts, error } = await supabase
      .from("duty_roster_shifts")
      .select("id, start_date, end_date, note, signed_at")
      .eq("roster_id", roster.id)
      .eq("assigned_user_id", uid)
      .order("start_date", { ascending: true });

    if (error) {
      console.error("خطأ في تحميل نوبتجياتي:", error);
      return;
    }

    setMyRoster(roster as MyRoster);
    setMyShifts((shifts ?? []) as MyShift[]);
  }

  async function handleOpenAlert(alert: PublishAlert) {
    // نخفيه فورًا
    setAlerts((prev) => prev.filter((a) => a.rosterId !== alert.rosterId));

    if (userId && alert.notificationIds.length > 0) {
      const { error } = await supabase.from("notification_reads").insert(
        alert.notificationIds.map((id) => ({
          notification_id: id,
          user_id: userId,
        }))
      );

      // 23505 = متسجلة مقروءة بالفعل
      if (error && error.code !== "23505") {
        console.error("تعذر تسجيل التنبيه كمقروء:", error);
      }
    }

    navigate(BRANCH_DUTY_ROUTE, { state: { rosterId: alert.rosterId } });
  }

  const today = todayIso();

  const nextShift = useMemo(
    () => myShifts.find((s) => s.end_date >= today) ?? null,
    [myShifts, today]
  );

  if (loading || (alerts.length === 0 && myShifts.length === 0)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 w-full" dir="rtl">
      <p
        className="text-right w-full"
        style={{
          ...FONT,
          color: "#2d3648",
          fontWeight: 700,
          fontSize: "clamp(18px, 3vw, 24px)",
          lineHeight: 1.5,
        }}
      >
        النوبتجيات
      </p>

      {/* تنبيهات النشر */}
      {alerts.map((alert) => (
        <button
          key={alert.rosterId}
          type="button"
          onClick={() => void handleOpenAlert(alert)}
          className="w-full rounded-[12px] px-4 sm:px-5 py-3 sm:py-4 flex flex-wrap items-center gap-2 sm:gap-3 text-right hover:opacity-80 transition-opacity"
          style={{ background: "#eef4ff", border: "1px solid #c7d7fe" }}
        >
          <Megaphone size={18} color="#172e78" className="shrink-0" />

          <span style={{ ...FONT, fontSize: 14, fontWeight: 700, color: "#172e78" }}>
            تم نشر نوبتجية شهر {MONTHS[alert.month - 1]} {toAr(alert.year)}
          </span>

          <span
            className="flex items-center gap-1"
            style={{
              ...FONT,
              fontSize: 12,
              color: "#172e78",
              marginRight: "auto",
              textDecoration: "underline",
            }}
          >
            اضغط للعرض
            <ChevronLeft size={14} />
          </span>
        </button>
      ))}

      {/* نوبتجياتي في الشهر الحالي */}
      {myRoster && myShifts.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
          <button
            type="button"
            onClick={() =>
              navigate(BRANCH_DUTY_ROUTE, { state: { rosterId: myRoster.id } })
            }
            className="w-full px-4 sm:px-5 py-4 border-b border-[#eff0f6] flex flex-wrap items-center justify-between gap-3 text-right hover:bg-[#fafbff] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[12px] bg-[#DCF4DF] flex items-center justify-center shrink-0">
                <CalendarDays size={20} color="#00522e" />
              </div>

              <div className="flex flex-col">
                <span style={{ ...FONT, fontWeight: 700, fontSize: 16, color: "#2d3648" }}>
                  نوبتجياتي – شهر {MONTHS[myRoster.month - 1]} {toAr(myRoster.year)}
                </span>
                <span style={{ ...FONT, fontSize: 13, color: "#717d96" }}>
                  عدد الفترات المعيّنة لك: {toAr(myShifts.length)}
                  {nextShift &&
                    ` • ${
                      shiftState(nextShift, today) === "today" ? "نوبتجيتك اليوم" : "القادمة"
                    }: ${rangeLabel(nextShift.start_date, nextShift.end_date)}`}
                </span>
              </div>
            </div>

            <span
              className="flex items-center gap-1"
              style={{ ...FONT, fontSize: 12, color: "#1f3d97" }}
            >
              عرض النوبتجية كاملة
              <ChevronLeft size={14} />
            </span>
          </button>

          <div className="flex flex-col">
            {myShifts.map((shift) => {
              const state = shiftState(shift, today);
              const meta = STATE_META[state];
              const days = dayCount(shift.start_date, shift.end_date);

              return (
                <div
                  key={shift.id}
                  className="px-4 sm:px-5 py-3 border-b border-[#eff0f6] last:border-b-0 flex flex-wrap items-center gap-3"
                  style={{
                    background: state === "today" ? "#f6fcf8" : undefined,
                    opacity: state === "past" ? 0.65 : 1,
                  }}
                >
                  <span
                    className="px-2.5 py-0.5 rounded-full shrink-0"
                    style={{
                      ...FONT,
                      fontSize: 12,
                      fontWeight: 700,
                      background: meta.bg,
                      color: meta.color,
                    }}
                  >
                    {meta.label}
                  </span>

                  <span style={{ ...FONT, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                    {rangeLabel(shift.start_date, shift.end_date)}
                  </span>

                  {days > 1 && (
                    <span style={{ ...FONT, fontSize: 12, color: "#717d96" }}>
                      ({toAr(days)} أيام)
                    </span>
                  )}

                  {shift.note && (
                    <span style={{ ...FONT, fontSize: 12, color: "#8a6500" }}>
                      {shift.note}
                    </span>
                  )}

                  <span
                    style={{
                      ...FONT,
                      fontSize: 12,
                      marginRight: "auto",
                      color: shift.signed_at ? "#166534" : "#b45309",
                    }}
                  >
                    {shift.signed_at ? "تم التوقيع ✓" : "لم توقّع بعد"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}