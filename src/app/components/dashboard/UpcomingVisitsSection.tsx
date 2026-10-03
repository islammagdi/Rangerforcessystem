import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Award, CalendarDays, ChevronLeft, Users } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { usePermissions } from "../../../lib/usePermissions";
import { formatVisitDate, toAr } from "../../pages/MilitaryCeremoniesPage";

const FONT: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

// عدد الزيارات القادمة اللي تظهر
const MAX_UPCOMING_VISITS = 2;

type UpcomingVisit = {
  id: string;
  title: string;
  visit_date: string;
  guest_count: number;
  host_count: number;
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function daysUntil(value: string): number {
  const [y, m, d] = value.split("-").map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / (24 * 60 * 60 * 1000));
}

function remainingLabel(days: number): { text: string; bg: string; color: string } {
  if (days <= 0) return { text: "اليوم", bg: "#DCF4DF", color: "#00522E" };
  if (days === 1) return { text: "غدًا", bg: "#fff8e8", color: "#8a6500" };
  if (days === 2) return { text: "بعد يومين", bg: "#e8f0fe", color: "#172e78" };
  if (days <= 10) return { text: `بعد ${toAr(days)} أيام`, bg: "#e8f0fe", color: "#172e78" };
  return { text: `بعد ${toAr(days)} يومًا`, bg: "#f1f5f9", color: "#475569" };
}

export function UpcomingVisitsSection() {
  const navigate = useNavigate();
  const { loading: permsLoading, hasPermission } = usePermissions();
  const canView =
    hasPermission("military_ceremonies:view") || hasPermission("military_ceremonies:edit");

  const [visits, setVisits] = useState<UpcomingVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (permsLoading) return;

    if (!canView) {
      setLoading(false);
      return;
    }

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permsLoading, canView]);

  async function load() {
    try {
      const { data, error } = await supabase
        .from("military_ceremony_visits")
        .select("id, title, visit_date, created_at, military_ceremony_attendees(side)")
        .gte("visit_date", todayIso())
        .order("visit_date", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(MAX_UPCOMING_VISITS);

      if (error) {
        console.error("خطأ في تحميل الزيارات القادمة:", error);
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
    } finally {
      setLoading(false);
    }
  }

  if (permsLoading || loading || !canView || visits.length === 0) {
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
        الزيارات القادمة
      </p>

      <div className="flex gap-3 sm:gap-4 flex-wrap items-stretch">
        {visits.map((visit) => {
          const remaining = remainingLabel(daysUntil(visit.visit_date));

          return (
            <button
              key={visit.id}
              type="button"
              onClick={() => navigate(`/dashboard/military-ceremonies/${visit.id}`)}
              className="flex-1 min-w-[280px] bg-white rounded-2xl border border-[#eff0f6] p-4 sm:p-5 flex flex-col gap-4 text-right hover:border-[#00b867] transition-colors"
            >
              <div className="flex items-start justify-between gap-3 w-full">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-[12px] bg-[#DCF4DF] flex items-center justify-center shrink-0">
                    <Award size={22} color="#00522e" />
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <span
                      className="truncate"
                      style={{ ...FONT, fontWeight: 700, fontSize: 17, color: "#2d3648" }}
                      title={visit.title}
                    >
                      {visit.title}
                    </span>

                    <span
                      className="flex items-center gap-1.5"
                      style={{ ...FONT, fontSize: 13, color: "#717d96" }}
                    >
                      <CalendarDays size={14} />
                      {formatVisitDate(visit.visit_date)}
                    </span>
                  </div>
                </div>

                <span
                  className="px-3 py-1 rounded-full shrink-0"
                  style={{
                    ...FONT,
                    fontSize: 12,
                    fontWeight: 700,
                    background: remaining.bg,
                    color: remaining.color,
                  }}
                >
                  {remaining.text}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#eff0f6] w-full">
                <div className="flex items-center gap-4 flex-wrap">
                  <span
                    className="flex items-center gap-1.5"
                    style={{ ...FONT, fontSize: 13, color: "#172e78" }}
                  >
                    <Users size={15} />
                    الضيوف:
                    <span style={{ fontWeight: 700 }}>{toAr(visit.guest_count)}</span>
                  </span>

                  <span
                    className="flex items-center gap-1.5"
                    style={{ ...FONT, fontSize: 13, color: "#00522E" }}
                  >
                    <Users size={15} />
                    المستضيف:
                    <span style={{ fontWeight: 700 }}>{toAr(visit.host_count)}</span>
                  </span>
                </div>

                <span
                  className="flex items-center gap-1"
                  style={{ ...FONT, fontSize: 12, color: "#1f3d97" }}
                >
                  التفاصيل
                  <ChevronLeft size={14} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}