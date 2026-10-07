import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useSystemAlerts } from "../../hooks/useSystemAlerts";
import { StatCard } from "../components/dashboard/StatCard";
import { ProgressCard } from "../components/dashboard/ProgressCard";
import { DonutChart } from "../components/dashboard/DonutChart";
import { UnitBarChart } from "../components/dashboard/UnitBarChart";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { DutyDashboardSection } from "../components/dashboard/DutyDashboardSection";
import { UpcomingVisitsSection } from "../components/dashboard/UpcomingVisitsSection";
import { NcoDischargeTasksSection } from "../components/dashboard/NcoDischargeTasksSection";
import { ACTIVE_STATUSES, STALE_DAYS } from "./NcoDischargesPage";
import { useDashboardSections } from "../../lib/dashboardSections";
import { usePermissions } from "../../lib/usePermissions";
import { useNavigate } from "react-router";
import { CircleCheckBig, CircleX, Inbox, Send, FileText, Users, UserCheck, FileWarning, Hourglass } from "lucide-react";
import { fetchSocialRecordUnitStats } from "../../lib/socialRecords";
import {
  PHASE_STATUS_LABELS,
  fetchDashboardPhaseStats,
  type DashboardCategoryStats,
  type DashboardPhaseStats,
} from "../../lib/recruitArrivals";
import {
  fetchTodayMailAlerts,
  fetchPendingMailTasks,
  fetchPendingLetterTasks,
  fetchTodayLettersCount,
  type OfficeMailAlert,
  type PendingMailTask,
  type PendingMailTaskType,
  type PendingLetterTask,
} from "../../lib/mailArchive";
import {
  RankIcon,
  SoldiersIcon,
  PeopleIcon,
  CalendarIcon,
  IdCardIcon,
  PersonCheckIcon,
} from "../components/dashboard/DashboardIcons";
// ============================================================
// عنوان القسم
// ============================================================

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p
      className="text-right w-full"
      style={{
        color: "#2d3648",
        fontFamily: "'Almarai', sans-serif",
        fontWeight: 700,
        fontSize: "clamp(18px, 3vw, 24px)",
        lineHeight: 1.5,
      }}
    >
      {children}
    </p>
  );
}


// ============================================================
// أهلية الرخصة
// ============================================================

function hasLicenseEligibility(
  militaryId: string | null | undefined
) {
  const value = String(militaryId ?? "").trim();

  return value.length >= 8 && value.substring(6, 8) === "66";
}


// ============================================================
// عنصر "X من Y" بحجمي خط مختلفين
// ============================================================

function DeliveredOfTotalLabel({
  delivered,
  total,
  deliveredFontSize = 20,
  totalFontSize = 13,
}: {
  delivered: string;
  total: string;
  deliveredFontSize?: number;
  totalFontSize?: number;
}) {
  return (
    <>
      <span
        style={{
          fontSize: deliveredFontSize,
          fontWeight: 700,
        }}
      >
        {delivered}
      </span>

      <span
        style={{
          fontSize: totalFontSize,
          fontWeight: 400,
          color: "#717d96",
        }}
      >
        {" "}من {total}
      </span>
    </>
  );
}

const TASK_TYPE_META: Record<
  PendingMailTaskType,
  { label: string; route: (faxId: string) => string }
> = {
  incoming_not_opened: {
    label: "فاكسات واردة لم يتم فتحها",
    route: (id) => `/dashboard/archive/incoming/${id}`,
  },
  incoming_action_needed: {
    label: "فاكسات واردة بانتظار الإجراء",
    route: (id) => `/dashboard/archive/incoming/${id}`,
  },
  incoming_branch_decision: {
    label: "فاكسات بانتظار قرار رئيس الفرع",
    route: (id) => `/dashboard/archive/incoming/${id}`,
  },
  outgoing_receipt_needed: {
    label: "فاكسات صادرة بانتظار تأكيد الاستلام",
    route: (id) => `/dashboard/archive/outgoing/${id}`,
  },
  outgoing_recipients_needed: {
    label: "فاكسات صادرة بلا بيانات مستلمين",
    route: (id) => `/dashboard/archive/outgoing/${id}`,
  },
  outgoing_handover_needed: {
    label: "فاكسات صادرة بانتظار تسليم الأصل",
    route: (id) => `/dashboard/archive/outgoing/${id}`,
  },
};

function isOverdue(referenceDate: string): boolean {
  const diffMs = Date.now() - new Date(referenceDate).getTime();
  return diffMs > 3 * 24 * 60 * 60 * 1000;
}

const MAX_VISIBLE_TASK_BADGES = 10;



// ============================================================
// مكونات موقف وصول المجندين
// ============================================================

const RECRUIT_FONT: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

const fmtNum = (n: number) => n.toLocaleString("en-US");

const calcPercent = (arrived: number, target: number) =>
  target > 0 ? Math.min(100, Math.round((arrived / target) * 100)) : 0;

function RecruitProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-[#eff0f6] overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${percent}%`, background: "#00b867" }}
      />
    </div>
  );
}

function RecruitDonut({ percent, size = 96 }: { percent: number; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="shrink-0 relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#eff0f6"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#00b867"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ ...RECRUIT_FONT, fontWeight: 700, fontSize: 16, color: "#2d3648" }}
      >
        {percent}%
      </div>
    </div>
  );
}

function RecruitCategoryCard({
  data,
  onClick,
}: {
  data: DashboardCategoryStats;
  onClick: () => void;
}) {
  const percent = calcPercent(data.arrived, data.target);
  const remaining = data.target - data.arrived;

  return (
    <button
      type="button"
      onClick={onClick}
      dir="rtl"
      className="flex-1 min-w-[280px] bg-white rounded-2xl border border-[#eff0f6] p-4 sm:p-5 flex flex-col gap-4 text-right hover:border-[#00b867] transition-colors"
    >
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="flex flex-col gap-1.5">
          <span style={{ ...RECRUIT_FONT, fontWeight: 700, fontSize: 18, color: "#2d3648" }}>
            {data.label}
          </span>
          <span style={{ ...RECRUIT_FONT, fontSize: 13, color: "#717d96" }}>
            وصل {fmtNum(data.arrived)} من {fmtNum(data.target)}
          </span>
          <span
            style={{
              ...RECRUIT_FONT,
              fontSize: 13,
              color: remaining < 0 ? "#e3282c" : "#92400e",
            }}
          >
            المتبقي: {fmtNum(remaining)}
          </span>
          <span
            className="self-start px-2 py-0.5 rounded-full"
            style={{
              ...RECRUIT_FONT,
              background: "#e0f2fe",
              fontSize: 12,
              fontWeight: 700,
              color: "#075985",
            }}
          >
            وصل اليوم: {fmtNum(data.today)}
          </span>
        </div>

        <RecruitDonut percent={percent} />
      </div>

      <div className="flex flex-col gap-3 pt-3 border-t border-[#eff0f6] w-full">
        {data.levels.map((l) => (
          <div key={l.level} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span style={{ ...RECRUIT_FONT, fontSize: 13, fontWeight: 700, color: "#2d3648" }}>
                {l.label}
              </span>

              <div className="flex items-center gap-2">
                <span style={{ ...RECRUIT_FONT, fontSize: 12, color: "#717d96" }}>
                  {fmtNum(l.arrived)} من {fmtNum(l.target)}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    ...RECRUIT_FONT,
                    background: "#e0f2fe",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#075985",
                  }}
                >
                  اليوم {fmtNum(l.today)}
                </span>
              </div>
            </div>

            <RecruitProgressBar percent={calcPercent(l.arrived, l.target)} />
          </div>
        ))}
      </div>
    </button>
  );
}
// ============================================================
// الصفحة الرئيسية
// ============================================================

export function DashboardHome() {

  const navigate = useNavigate();
  const { loading: loadingSections, canSee } = useDashboardSections();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { roleNames, hasPermission } = usePermissions();
  const currentUserRole = roleNames.length > 0 ? roleNames.join("، ") : null;
  const [socialStats, setSocialStats] = useState({
    total: 0,
    complete: 0,
    incomplete: 0,
    without: 0,
  });
  const [loadingSocialStats, setLoadingSocialStats] = useState(true);

  const [recruitStats, setRecruitStats] = useState<DashboardPhaseStats | null>(null);
  const [loadingRecruitStats, setLoadingRecruitStats] = useState(true);
  const [recruitUpdatedAt, setRecruitUpdatedAt] = useState<Date | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const { alerts, loading: loadingAlerts } = useSystemAlerts();
  const { stats: todayStats, loading: loadingTodayStats } = useDashboardStats();

  const [openModal, setOpenModal] = useState<"discharged" | "letters" | null>(null);

  const [stats, setStats] = useState({
    volunteers: 0,
    conscripts: 0,
    totalForce: 0,
    outsideVolunteers: 0,
    outsideConscripts: 0,
    totalOutside: 0,
    absentVolunteers: 0,
    absentConscripts: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);

  const [nextBatchDate, setNextBatchDate] = useState<Date | null>(null);
  const [nextBatchCount, setNextBatchCount] = useState(0);
  const [loadingReserveBatch, setLoadingReserveBatch] = useState(true);

  const [docStats, setDocStats] = useState({
    karizaDelivered: 0,
    karizaTotal: 0,
    licenseDelivered: 0,
    licenseTotal: 0,
  });

  const [loadingDocStats, setLoadingDocStats] = useState(true);

  const [reviewStats, setReviewStats] = useState({
    reviewed: 0,
    notReviewed: 0,
    total: 0,
  });

  const [loadingReviewStats, setLoadingReviewStats] = useState(true);
  const [mailAlerts, setMailAlerts] = useState<OfficeMailAlert[]>([]);
  const [loadingMailAlerts, setLoadingMailAlerts] = useState(true);
  const [pendingTasks, setPendingTasks] = useState<PendingMailTask[]>([]);
  const [loadingPendingTasks, setLoadingPendingTasks] = useState(true);

  const [pendingLetters, setPendingLetters] = useState<PendingLetterTask[]>([]);
  const [loadingPendingLetters, setLoadingPendingLetters] = useState(true);

  const [todayLettersCount, setTodayLettersCount] = useState(0);
  const [loadingTodayLetters, setLoadingTodayLetters] = useState(true);
  useEffect(() => {
    loadCurrentUser();
    loadOverview();
    loadMailAlerts();
    loadPendingTasks();
    loadPendingLetters();
    loadTodayLettersCount();
  }, []);
  // ==========================================================
  // تنبيهات تحتاج متابعة (بيانات ناقصة + ملفات إنهاء خدمة متوقفة)
  // ==========================================================

  const canViewDataQuality = hasPermission("data_quality:view");
  const canViewNcoDischarges = hasPermission("nco_discharge:view");

  const [followUpAlerts, setFollowUpAlerts] = useState({
    incompleteData: 0,
    staleCases: 0,
  });

  useEffect(() => {
    void loadFollowUpAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewDataQuality, canViewNcoDischarges]);

  async function loadFollowUpAlerts() {
    const next = { incompleteData: 0, staleCases: 0 };

    try {
      if (canViewDataQuality) {
        const { data } = await supabase.rpc("get_data_issue_summary", {
          p_unit_id: null,
          p_category_id: null,
        });

        const all = ((data ?? []) as any[]).find((r) => r.issue_code === "__ALL__");
        next.incompleteData = Number(all?.issue_count ?? 0);
      }

      if (canViewNcoDischarges) {
        const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString();

        const { count } = await supabase
          .from("nco_discharge_cases")
          .select("id", { count: "exact", head: true })
          .in("status", ACTIVE_STATUSES)
          .lt("updated_at", cutoff);

        next.staleCases = count ?? 0;
      }
    } catch (error) {
      console.error("خطأ في تحميل تنبيهات المتابعة:", error);
    }

    setFollowUpAlerts(next);
  }

  const canViewSocialRecordStats = canSee("social_record_stats");

  useEffect(() => {
    if (canViewSocialRecordStats) loadSocialRecordStats();
  }, [canViewSocialRecordStats]);
  const canViewRecruitStats = canSee("recruit_arrivals");

  useEffect(() => {
    if (canViewRecruitStats) loadRecruitStats();
  }, [canViewRecruitStats]);

  async function loadRecruitStats() {
    try {
      setLoadingRecruitStats(true);
      const data = await fetchDashboardPhaseStats(toDbDateString(new Date()));
      setRecruitStats(data);
      setRecruitUpdatedAt(new Date());
    } catch (error) {
      console.error("خطأ في تحميل موقف وصول المجندين:", error);
    } finally {
      setLoadingRecruitStats(false);
    }
  }

  async function loadSocialRecordStats() {
    try {
      setLoadingSocialStats(true);
      const units = await fetchSocialRecordUnitStats();

      setSocialStats(
        units.reduce(
          (acc, unit) => {
            acc.total += unit.total_count;
            acc.complete += unit.complete_count;
            acc.incomplete += unit.incomplete_count;
            acc.without += unit.without_record_count;
            return acc;
          },
          { total: 0, complete: 0, incomplete: 0, without: 0 }
        )
      );
    } catch (error) {
      console.error("خطأ في تحميل إحصائيات السجل الاجتماعي:", error);
    } finally {
      setLoadingSocialStats(false);
    }
  }

  const loadCurrentUser = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
   
        return;
      }

      if (!user) {

        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          username,
          full_name,
          rank_name,
          personnel:personnel_id (
            full_name,
            military_number,
            rank_id,
            rank:ranks (
              id,
              name
            )
          )
        `)
        .eq("id", user.id)
        .single();
      if (error) {
        console.error("خطأ في تحميل بيانات المستخدم:", error);
        return;
      }

      setCurrentUser(data);


    } catch (error) {

    } finally {
      setLoadingUser(false);
    }
  };



  function toDbDateString(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseDbDateString(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
    // كل أرقام القوة والدفعة في طلب واحد (نفس تعريف بيان الوحدات)
  async function loadOverview() {
    setLoadingStats(true);
    setLoadingReserveBatch(true);
    setLoadingDocStats(true);
    setLoadingReviewStats(true);

    try {
      const { data, error } = await supabase.rpc("get_dashboard_overview");
      if (error) throw error;

      const o = (data ?? {}) as Record<string, any>;
      const n = (key: string) => Number(o[key] ?? 0);

      setStats({
        volunteers: n("volunteers"),
        conscripts: n("conscripts"),
        totalForce: n("volunteers") + n("conscripts"),
        outsideVolunteers: n("outside_volunteers"),
        outsideConscripts: n("outside_conscripts"),
        totalOutside: n("outside_volunteers") + n("outside_conscripts"),
        absentVolunteers: n("absent_volunteers"),
        absentConscripts: n("absent_conscripts"),
      });

      setNextBatchDate(o.next_batch_date ? parseDbDateString(o.next_batch_date) : null);
      setNextBatchCount(n("batch_total"));

      setDocStats({
        karizaDelivered: n("kariza_delivered"),
        karizaTotal: n("batch_total"),
        licenseDelivered: n("license_delivered"),
        licenseTotal: n("license_total"),
      });

      const reviewed = n("reviewed");
      const total = n("batch_total");

      setReviewStats({
        reviewed,
        notReviewed: Math.max(0, total - reviewed),
        total,
      });
    } catch (error) {
      console.error("خطأ في تحميل أرقام الموقف العام:", error);
    } finally {
      setLoadingStats(false);
      setLoadingReserveBatch(false);
      setLoadingDocStats(false);
      setLoadingReviewStats(false);
    }
  }



 





  async function loadMailAlerts() {
    try {
      setLoadingMailAlerts(true);
      const data = await fetchTodayMailAlerts();
      setMailAlerts(data);
    } catch (error) {
      console.error("خطأ في تحميل تنبيهات الفاكسات:", error);
    } finally {
      setLoadingMailAlerts(false);
    }
  }

  const totalIncomingToday = mailAlerts.reduce((sum, o) => sum + o.incoming_count, 0);
  const totalOutgoingToday = mailAlerts.reduce((sum, o) => sum + o.outgoing_count, 0);

  async function loadPendingTasks() {
    try {
      setLoadingPendingTasks(true);
      const data = await fetchPendingMailTasks();
      setPendingTasks(data);
    } catch (error) {
      console.error("خطأ في تحميل المهام المعلقة:", error);
    } finally {
      setLoadingPendingTasks(false);
    }
  }

  const tasksByType = useMemo(() => {
    const map = new Map<PendingMailTaskType, PendingMailTask[]>();
    pendingTasks.forEach((task) => {
      const list = map.get(task.task_type) ?? [];
      list.push(task);
      map.set(task.task_type, list);
    });
    return map;
  }, [pendingTasks]);

  async function loadPendingLetters() {
    try {
      setLoadingPendingLetters(true);
      const data = await fetchPendingLetterTasks();
      setPendingLetters(data);
    } catch (error) {
      console.error("خطأ في تحميل الخطابات غير الموثقة:", error);
    } finally {
      setLoadingPendingLetters(false);
    }
  }

  async function loadTodayLettersCount() {
    try {
      setLoadingTodayLetters(true);
      const count = await fetchTodayLettersCount();
      setTodayLettersCount(count);
    } catch (error) {
      console.error("خطأ في تحميل عدد الخطابات اليوم:", error);
    } finally {
      setLoadingTodayLetters(false);
    }
  }
  const formatNumber = (value: number) => {
    return value.toLocaleString("en-US");
  };

  function formatArabicDate(date: Date | null) {
    if (!date) {
      return "غير محدد";
    }

    return date.toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const karizaPercentage =
    docStats.karizaTotal > 0
      ? Math.round((docStats.karizaDelivered / docStats.karizaTotal) * 100)
      : 0;

  const licensePercentage =
    docStats.licenseTotal > 0
      ? Math.round((docStats.licenseDelivered / docStats.licenseTotal) * 100)
      : 0;

  const reviewPercentage =
    reviewStats.total > 0
      ? Math.round((reviewStats.reviewed / reviewStats.total) * 100)
      : 0;
  if (loadingSections) {
    return (
      <div className="text-right text-gray-500 py-10" style={{ fontFamily: "'Almarai', sans-serif" }}>
        جاري تحميل الموقف العام...
      </div>
    );
  }

  return (
    <>
      {canSee("current_user") && !loadingUser && currentUser && (
        <div
          className="w-full bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100"
          dir="rtl"
        >
          <p
            className="text-gray-800 text-base sm:text-lg mb-1"
            style={{ fontFamily: "'Almarai', sans-serif" }}
          >
            المستخدم الحالي
          </p>

          <div className="w-full h-px bg-[#eff0f6] my-2" />

          <div className="flex flex-wrap gap-4 sm:gap-8 items-center">
            {currentUser.personnel?.military_number && (
              <div>
                <p
                  className="text-gray-500 text-sm mb-1"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  الرقم العسكري
                </p>

                <p
                  className="font-bold text-[#344736]"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  {currentUser.personnel.military_number}
                </p>
              </div>
            )}

            <div>
              <p
                className="text-gray-500 text-sm mb-1"
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
                الدرجة
              </p>

              <p
                className="font-bold text-[#344736]"
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
                {currentUser.personnel?.rank?.name ||
                  currentUser.rank_name ||
                  "غير محدد"}
              </p>
            </div>

                       <div>
              <p
                className="text-gray-500 text-sm mb-1"
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
                الاسم الكامل
              </p>

              <p
                className="font-bold text-[#344736]"
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
                {currentUser.personnel?.full_name ||
                  currentUser.full_name ||
                  "غير محدد"}
              </p>
            </div>

            <div>
              <p
                className="text-gray-500 text-sm mb-1"
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
                {roleNames.length > 1 ? "الأدوار" : "الدور"}
              </p>

              <p
                className="font-bold text-[#344736]"
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
                {currentUserRole || "غير محدد"}
              </p>
            </div>
          </div>
        </div>
      )}

      {canSee("system_alerts") && !loadingAlerts && alerts.length > 0 && (
        <div className="flex flex-col gap-3 w-full" dir="rtl">
          {alerts.map((alert, idx) => {
            const isClickable =
              alert.key === "overdue" || alert.key === "undocumented-letters";

            const content = (
              <>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: alert.type === "critical" ? "#e3282c" : "#e37032",
                  }}
                />

                <span
                  style={{
                    fontFamily: "'Almarai', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: alert.type === "critical" ? "#991b1b" : "#8a6500",
                  }}
                >
                  {alert.text}
                </span>

                {isClickable && (
                  <span
                    style={{
                      fontFamily: "'Almarai', sans-serif",
                      fontSize: 12,
                      color: "#991b1b",
                      marginRight: "auto",
                      textDecoration: "underline",
                    }}
                  >
                    عرض الأفراد ←
                  </span>
                )}
              </>
            );

            const sharedStyle: React.CSSProperties = {
              background: alert.type === "critical" ? "#fef2f2" : "#fff8e8",
              border:
                alert.type === "critical" ? "1px solid #fecaca" : "1px solid #f4d58d",
            };

            if (isClickable) {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (alert.key === "undocumented-letters") {
                      navigate("/dashboard/letters-archive", {
                        state: { statusFilter: "UNDOCUMENTED" },
                      });
                      return;
                    }

                    navigate("/dashboard/reserve-batches", {
                      state: { batchDate: alert.batchDate },
                    });
                  }}
                  className="w-full rounded-[12px] px-4 sm:px-5 py-3 sm:py-4 flex flex-wrap items-center gap-2 sm:gap-3 text-right hover:opacity-80 transition-opacity"
                  style={sharedStyle}
                >
                  {content}
                </button>
              );
            }

            return (
              <div
                key={idx}
                className="w-full rounded-[12px] px-4 sm:px-5 py-3 sm:py-4 flex flex-wrap items-center gap-2 sm:gap-3"
                style={sharedStyle}
              >
                {content}
              </div>
            );
          })}
        </div>
      )}

   

      {(followUpAlerts.incompleteData > 0 || followUpAlerts.staleCases > 0) && (
        <>
          <SectionTitle>تنبيهات تحتاج متابعة</SectionTitle>

          <div className="flex gap-3 sm:gap-4 flex-wrap">
            {followUpAlerts.incompleteData > 0 && (
              <StatCard
                icon={<FileWarning size={20} color="#92400e" />}
                value={formatNumber(followUpAlerts.incompleteData)}
                label="أفراد بياناتهم ناقصة"
                valueColor="#92400e"
                onClick={() => navigate("/dashboard/data-quality")}
              />
            )}

            {followUpAlerts.staleCases > 0 && (
              <StatCard
                icon={<Hourglass size={20} color="#9d2e15" />}
                value={formatNumber(followUpAlerts.staleCases)}
                label={`ملفات إنهاء خدمة متوقفة أكتر من ${STALE_DAYS} يوم`}
                valueColor="#9d2e15"
                onClick={() =>
                  navigate("/dashboard/nco-discharges", {
                    state: { staleOnly: true },
                  })
                }
              />
            )}
          </div>
        </>
      )}

      {canSee("branch_duty") && <DutyDashboardSection />}

      {canSee("upcoming_visits") && <UpcomingVisitsSection />}

      {canSee("pending_tasks") && (
      <>
      <SectionTitle>المهام المعلقة</SectionTitle>

      {loadingPendingTasks || loadingPendingLetters ? (
        <div className="text-right text-gray-500 py-4">
          جاري تحميل المهام المعلقة...
        </div>
      ) : pendingTasks.length === 0 && pendingLetters.length === 0 ? (
        <div
          className="text-right text-gray-400 py-4"
          style={{ fontFamily: "'Almarai', sans-serif" }}
        >
          لا توجد مهام معلقة حاليًا
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full">
                 {(Object.keys(TASK_TYPE_META) as PendingMailTaskType[]).map((type) => {
            const tasks = tasksByType.get(type);
            if (!tasks || tasks.length === 0) return null;

            const meta = TASK_TYPE_META[type];

            return (
              <div
                key={type}
                className="bg-white rounded-2xl border border-[#eff0f6] p-4"
                dir="rtl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    style={{
                      fontFamily: "'Almarai', sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#2d3648",
                    }}
                  >
                    {meta.label}
                  </span>

                  <span
                    className="px-2 py-0.5 rounded-full bg-[#f7f9fc]"
                    style={{ fontFamily: "'Almarai', sans-serif", fontSize: 12, color: "#717d96" }}
                  >
                    {tasks.length}
                  </span>
                </div>

                   <div className="flex flex-wrap gap-2">
                  {tasks.slice(0, MAX_VISIBLE_TASK_BADGES).map((task) => {
                    const overdue = isOverdue(task.reference_date);

                    return (
                      <button
                        key={task.fax_id}
                        type="button"
                        onClick={() => navigate(meta.route(task.fax_id))}
                        className="px-3 py-1.5 rounded-full border transition-colors"
                        style={{
                          fontFamily: "'Almarai', sans-serif",
                          fontSize: 13,
                          background: overdue ? "#fef2f2" : "#f7f9fc",
                          borderColor: overdue ? "#fecaca" : "#eff0f6",
                          color: overdue ? "#991b1b" : "#2d3648",
                        }}
                      >
                        {task.fax_number}/{task.fax_year}
                      </button>
                    );
                  })}

                  {tasks.length > MAX_VISIBLE_TASK_BADGES && (
                    <button
                      type="button"
                      onClick={() => navigate(meta.route(tasks[0].fax_id))}
                      className="px-3 py-1.5 rounded-full border transition-colors"
                      style={{
                        fontFamily: "'Almarai', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        background: "#f0f2fd",
                        borderColor: "#dbe0fb",
                        color: "#1f3d97",
                      }}
                    >
                      و{tasks.length - MAX_VISIBLE_TASK_BADGES} أخرى
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {pendingLetters.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#eff0f6] p-4" dir="rtl">
              <div className="flex items-center justify-between mb-2">
                <span
                  style={{
                    fontFamily: "'Almarai', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#2d3648",
                  }}
                >
                  خطابات غير موثقة
                </span>

                <span
                  className="px-2 py-0.5 rounded-full bg-[#f7f9fc]"
                  style={{ fontFamily: "'Almarai', sans-serif", fontSize: 12, color: "#717d96" }}
                >
                  {pendingLetters.length}
                </span>
              </div>

                   <div className="flex flex-wrap gap-2">
                {pendingLetters.slice(0, MAX_VISIBLE_TASK_BADGES).map((letter) => {
                  const overdue = isOverdue(letter.reference_date);

                  return (
                    <button
                      key={letter.letter_id}
                      type="button"
                      onClick={() =>
                        navigate("/dashboard/letters-archive", {
                          state: { statusFilter: "UNDOCUMENTED" },
                        })
                      }
                      className="px-3 py-1.5 rounded-full border transition-colors"
                      style={{
                        fontFamily: "'Almarai', sans-serif",
                        fontSize: 13,
                        background: overdue ? "#fef2f2" : "#f7f9fc",
                        borderColor: overdue ? "#fecaca" : "#eff0f6",
                        color: overdue ? "#991b1b" : "#2d3648",
                      }}
                    >
                      خطاب {letter.letter_number}
                    </button>
                  );
                })}

                {pendingLetters.length > MAX_VISIBLE_TASK_BADGES && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/dashboard/letters-archive", {
                        state: { statusFilter: "UNDOCUMENTED" },
                      })
                    }
                    className="px-3 py-1.5 rounded-full border transition-colors"
                    style={{
                      fontFamily: "'Almarai', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      background: "#f0f2fd",
                      borderColor: "#dbe0fb",
                      color: "#1f3d97",
                    }}
                  >
                    و{pendingLetters.length - MAX_VISIBLE_TASK_BADGES} أخرى
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      </>
      )}

      {canSee("discharge_tasks") && hasPermission("nco_discharge:view") && (
        <NcoDischargeTasksSection
          dischargedTodayCount={
            loadingTodayStats ? undefined : todayStats.dischargedList.length
          }
          onDischargedTodayClick={() => setOpenModal("discharged")}
        />
      )}

      {canSee("mail_alerts") && (
      <>
      <SectionTitle>التنبيهات</SectionTitle>

      {loadingMailAlerts ? (
        <div className="text-right text-gray-500 py-4">
          جاري تحميل التنبيهات...
        </div>
      ) : mailAlerts.length === 0 ? (
        <div
          className="text-right text-gray-400 py-4"
          style={{ fontFamily: "'Almarai', sans-serif" }}
        >
          لا توجد فاكسات جديدة اليوم
        </div>
      ) : (
        <>
          <div className="flex gap-3 sm:gap-4 flex-wrap">
            <button
              type="button"
              onClick={() =>
                navigate("/dashboard/archive/incoming", {
                  state: {
                    officeFilter:
                      mailAlerts.length === 1 ? mailAlerts[0].office_id : undefined,
                  },
                })
              }
              className="text-right"
            >
              <StatCard
                icon={<Inbox size={20} />}
                value={formatNumber(totalIncomingToday)}
                label="فاكسات واردة جديدة اليوم"
              />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard/archive/outgoing", {
                  state: {
                    officeFilter:
                      mailAlerts.length === 1 ? mailAlerts[0].office_id : undefined,
                    dateToday: true,
                  },
                })
              }
              className="text-right"
            >
              <StatCard
                icon={<Send size={20} />}
                value={formatNumber(totalOutgoingToday)}
                label="فاكسات صادرة اليوم"
              />
            </button>

            {!loadingTodayLetters && todayLettersCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  navigate("/dashboard/letters-archive", {
                    state: { dateToday: true },
                  })
                }
                className="text-right"
              >
                <StatCard
                  icon={<FileText size={20} />}
                  value={formatNumber(todayLettersCount)}
                  label="خطابات صادرة اليوم"
                />
              </button>
            )}
          </div>

          {mailAlerts.length > 1 && (
            <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
              <table className="w-full text-sm" dir="rtl">
                <thead>
                  <tr>
                    <th className="bg-[#f7f9fc] px-4 py-3 text-right border-b-2 border-[#e2e7f0]">
                      <span style={{ fontFamily: "'Almarai', sans-serif", fontSize: 13, color: "#717d96" }}>
                        المكتب
                      </span>
                    </th>
                    <th className="bg-[#f7f9fc] px-4 py-3 text-right border-b-2 border-[#e2e7f0]">
                      <span style={{ fontFamily: "'Almarai', sans-serif", fontSize: 13, color: "#717d96" }}>
                        وارد اليوم
                      </span>
                    </th>
                    <th className="bg-[#f7f9fc] px-4 py-3 text-right border-b-2 border-[#e2e7f0]">
                      <span style={{ fontFamily: "'Almarai', sans-serif", fontSize: 13, color: "#717d96" }}>
                        صادر اليوم
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {mailAlerts.map((office) => (
                    <tr key={office.office_id} className="hover:bg-[#fafbff]">
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ fontFamily: "'Almarai', sans-serif", fontSize: 14, color: "#2d3648" }}>
                          {office.office_name}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <button
                          type="button"
                          onClick={() =>
                            navigate("/dashboard/archive/incoming", {
                              state: { officeFilter: office.office_id },
                            })
                          }
                          style={{ fontFamily: "'Almarai', sans-serif", fontSize: 14, color: "#1f3d97" }}
                        >
                          {office.incoming_count}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <button
                          type="button"
                          onClick={() =>
                            navigate("/dashboard/archive/outgoing", {
                              state: { officeFilter: office.office_id, dateToday: true },
                            })
                          }
                          style={{ fontFamily: "'Almarai', sans-serif", fontSize: 14, color: "#1f3d97" }}
                        >
                          {office.outgoing_count}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

         </>
      )}

      {canViewSocialRecordStats && (
        <>
          <SectionTitle>موقف السجل الاجتماعي</SectionTitle>

          {loadingSocialStats ? (
            <div className="text-right text-gray-500 py-4">
              جاري تحميل إحصائيات السجل الاجتماعي...
            </div>
          ) : (
            <div className="flex gap-3 sm:gap-4 flex-wrap">
              <StatCard
                icon={<Users size={20} />}
                value={formatNumber(socialStats.total)}
                label="إجمالي الأفراد"
              />

              <StatCard
                icon={<Users size={20} color="#166534" />}
                value={formatNumber(socialStats.complete)}
                label="له سجل"
                valueColor="#166534"
              />

              <StatCard
                icon={<Users size={20} color="#92400e" />}
                value={formatNumber(socialStats.incomplete)}
                label="غير مكتمل"
                valueColor="#92400e"
              />

              <StatCard
                icon={<Users size={20} color="#9d2e15" />}
                value={formatNumber(socialStats.without)}
                label="بدون سجل"
                valueColor="#9d2e15"
              />
            </div>
          )}
        </>
      )}

      {canViewRecruitStats && (loadingRecruitStats || recruitStats) && (
        <>
                 <div className="flex items-center justify-between flex-wrap gap-2">
            {recruitUpdatedAt && (
              <p
                style={{
                  color: "#2d3648",
                  fontFamily: "'Almarai', sans-serif",
                  fontSize: "14px",
                }}
              >
                آخر تحديث: {recruitUpdatedAt.toLocaleDateString("ar-EG")} -{" "}
                {recruitUpdatedAt.toLocaleTimeString("ar-EG", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}

            <SectionTitle>موقف وصول المجندين</SectionTitle>
          </div>

          {loadingRecruitStats || !recruitStats ? (
            <div className="text-right text-gray-500 py-4">
              جاري تحميل موقف وصول المجندين...
            </div>
          ) : (
            <>
              <button
                type="button"
                dir="rtl"
                onClick={() =>
                  navigate(`/dashboard/recruit-arrivals/${recruitStats.phase.id}`)
                }
                className="w-full bg-white rounded-2xl border border-[#eff0f6] p-5 flex items-center justify-between gap-3 text-right hover:border-[#00b867] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[12px] bg-[#DCF4DF] flex items-center justify-center shrink-0">
                    <UserCheck size={22} color="#00522e" />
                  </div>

                  <div className="flex flex-col">
                    <span style={{ ...RECRUIT_FONT, fontSize: 13, color: "#717d96" }}>
                      {recruitStats.phase.status === "ongoing"
                        ? "الدفعة الجارية"
                        : "آخر دفعة"}
                    </span>
                    <span
                      style={{
                        ...RECRUIT_FONT,
                        fontWeight: 700,
                        fontSize: 22,
                        color: "#2d3648",
                      }}
                    >
                      {recruitStats.phase.name}
                    </span>
                  </div>
                </div>

                <span
                  className="px-3 py-1 rounded-full"
                  style={{
                    ...RECRUIT_FONT,
                    fontSize: 12,
                    fontWeight: 700,
                    background:
                      recruitStats.phase.status === "arrived" ? "#e0f2fe" : "#fef3c7",
                    color:
                      recruitStats.phase.status === "arrived" ? "#075985" : "#92400e",
                  }}
                >
                  {PHASE_STATUS_LABELS[recruitStats.phase.status]}
                </span>
              </button>

              <div className="flex gap-3 sm:gap-4 flex-wrap">
                <StatCard
                  icon={<Users size={20} />}
                  value={formatNumber(recruitStats.targetTotal)}
                  label="إجمالي الدفعة"
                />

                <StatCard
                  icon={<Users size={20} color="#166534" />}
                  value={formatNumber(recruitStats.arrivedTotal)}
                  label="إجمالي الوصول"
                  valueColor="#166534"
                />

                <StatCard
                  icon={<Users size={20} color="#92400e" />}
                  value={formatNumber(
                    recruitStats.targetTotal - recruitStats.arrivedTotal
                  )}
                  label="المتبقي"
                  valueColor={
                    recruitStats.targetTotal - recruitStats.arrivedTotal < 0
                      ? "#e3282c"
                      : "#92400e"
                  }
                />
              </div>

              <div className="flex gap-3 sm:gap-4 flex-wrap items-stretch">
                {recruitStats.categories.map((category) => (
                  <RecruitCategoryCard
                    key={category.category}
                    data={category}
                    onClick={() =>
                      navigate(`/dashboard/recruit-arrivals/${recruitStats.phase.id}`)
                    }
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

         {canSee("force_status") && (
      <>
      <SectionTitle>الموقف العام للقوة الحالية</SectionTitle>

      {loadingStats ? (
        <div className="text-right text-gray-500 py-4">
          جاري تحميل إحصائيات القوة...
        </div>
      ) : (
        <>
          <div className="flex gap-3 sm:gap-4 flex-wrap">
            <StatCard
              icon={<RankIcon />}
              value={formatNumber(stats.volunteers)}
              label="عدد المتطوعين"
            />

            <StatCard
              icon={<SoldiersIcon />}
              value={formatNumber(stats.conscripts)}
              label="عدد المجندين"
            />

            <StatCard
              icon={<PeopleIcon />}
              value={formatNumber(stats.totalForce)}
              label="القوة الفعلية"
            />
          </div>

          <div className="flex gap-3 sm:gap-4 flex-wrap">
            <StatCard
              icon={<RankIcon />}
              value={formatNumber(stats.outsideVolunteers)}
              label="خوارج المتطوعين"
              valueColor="#2D3648"
            />

            <StatCard
              icon={<SoldiersIcon />}
              value={formatNumber(stats.outsideConscripts)}
              label="خوارج المجندين"
              valueColor="#2D3648"
            />

            <StatCard
              icon={<PeopleIcon />}
              value={formatNumber(stats.totalOutside)}
              label="إجمالي الخوارج"
              valueColor="#2D3648"
            />
          </div>

          {stats.absentVolunteers + stats.absentConscripts > 0 && (
            <div className="flex gap-3 sm:gap-4 flex-wrap">
              <StatCard
                icon={<RankIcon />}
                value={formatNumber(stats.absentVolunteers)}
                label="غائبون من المتطوعين"
                valueColor="#991b1b"
                onClick={
                  hasPermission("absence_decisions:view")
                    ? () => navigate("/dashboard/absence-decisions")
                    : undefined
                }
              />

              <StatCard
                icon={<SoldiersIcon />}
                value={formatNumber(stats.absentConscripts)}
                label="غائبون من المجندين"
                valueColor="#991b1b"
                onClick={
                  hasPermission("absence_decisions:view")
                    ? () => navigate("/dashboard/absence-decisions")
                    : undefined
                }
              />

              <StatCard
                icon={<PeopleIcon />}
                value={formatNumber(stats.absentVolunteers + stats.absentConscripts)}
                label="إجمالي الغائبين (خارج القوة)"
                valueColor="#991b1b"
                onClick={
                  hasPermission("absence_decisions:view")
                    ? () => navigate("/dashboard/absence-decisions")
                    : undefined
                }
              />
            </div>
          )}
        </>
      )}

         </>
      )}

      {canSee("outside_analysis") && (
      <>
      <SectionTitle>تحليل موقف الخوارج</SectionTitle>

      <div className="flex gap-4 items-start flex-wrap lg:flex-nowrap">
        <div className="w-full lg:w-[280px] shrink-0">
          <DonutChart />
        </div>

        <div className="flex-1 min-w-0 w-full">
          <UnitBarChart />
        </div>
      </div>

      </>
      )}

      {canSee("reserve_batch") && (
      <>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p
          style={{
            color: "#2d3648",
            fontFamily: "'Almarai', sans-serif",
            fontSize: "14px",
          }}
        >
          آخر تحديث: {new Date().toLocaleDateString("ar-EG")}
        </p>

        <SectionTitle>موقف دفعة الرديف</SectionTitle>
      </div>

      <div className="flex gap-3 sm:gap-4 flex-wrap">
        <StatCard
          icon={<CalendarIcon />}
          value={loadingReserveBatch ? "..." : formatArabicDate(nextBatchDate)}
          label="تاريخ الدفعة التالية"
          disabled={loadingReserveBatch || !nextBatchDate}
          onClick={() =>
            nextBatchDate &&
            navigate("/dashboard/reserve-batches", {
              state: { batchDate: toDbDateString(nextBatchDate) },
            })
          }
        />

        <StatCard
          icon={<PeopleIcon />}
          value={loadingReserveBatch ? "..." : formatNumber(nextBatchCount)}
          label="عدد المستحقين للتسريح"
        />
      </div>
      <div className="flex gap-3 sm:gap-4 flex-wrap">
        <ProgressCard
          icon={<CircleCheckBig color="#22c55e" size={24} />}
          value={
            loadingReviewStats ? (
              "..."
            ) : (
              <DeliveredOfTotalLabel
                delivered={formatNumber(reviewStats.reviewed)}
                total={formatNumber(reviewStats.total)}
                deliveredFontSize={20}
                totalFontSize={16}
              />
            )
          }
          label="عدد الأفراد المراجعين"
          percentage={loadingReviewStats ? 0 : reviewPercentage}
          percentLabel={loadingReviewStats ? "0%" : `${reviewPercentage}%`}
        />

        <StatCard
          icon={<CircleX color="#e37032" size={24} />}
          value={loadingReviewStats ? "..." : formatNumber(reviewStats.notReviewed)}
          label="عدد الأفراد غير المراجعين"
          valueColor="#e37032"
        />
      </div>
      <div className="flex gap-3 sm:gap-4 flex-wrap pb-6 items-align-start">
        <ProgressCard
        
          icon={<PersonCheckIcon />}
          value={
            loadingDocStats ? (
              "..."
            ) : (
              <DeliveredOfTotalLabel
            
                delivered={formatNumber(docStats.karizaDelivered)}
                total={formatNumber(docStats.karizaTotal)}
                deliveredFontSize={20}
                totalFontSize={16}
              />
            )
          }
          label="عدد مسلِّمي تحقيق الشخصية"
          percentage={loadingDocStats ? 0 : karizaPercentage}
          percentLabel={loadingDocStats ? "0%" : `${karizaPercentage}%`}
          
        />

        <ProgressCard
          icon={<IdCardIcon />}
          value={
            loadingDocStats ? (
              "..."
            ) : (
              <DeliveredOfTotalLabel
                delivered={formatNumber(docStats.licenseDelivered)}
                total={formatNumber(docStats.licenseTotal)}
                deliveredFontSize={20}
                totalFontSize={16}
              />
            )
          }
          label="عدد مسلِّمي رخصة القيادة"
          percentage={loadingDocStats ? 0 : licensePercentage}
          percentLabel={loadingDocStats ? "0%" : `${licensePercentage}%`}
        />
      </div>


      </>
      )}

      {openModal === "discharged" && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] px-4"
          onClick={() => setOpenModal(null)}
        >
          <div
            dir="rtl"
            className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-[420px] max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontFamily: "'Almarai', sans-serif",
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 15,
              }}
            >
              الأفراد اللي اتنهت خدمتهم اليوم ({todayStats.dischargedList.length})
            </h2>

            <div className="overflow-y-auto flex-1 flex flex-col gap-2">
              {todayStats.dischargedList.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() =>
                    navigate(`/dashboard/individual-query/soldier/${person.id}`)
                  }
                  className="w-full text-right px-3 py-2.5 rounded-lg hover:bg-[#f5f6fb] border border-[#eff0f6] transition-colors"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#2d3648",
                    }}
                  >
                    {person.full_name}
                  </span>

                  {person.military_number && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "#717d96",
                        marginRight: 8,
                      }}
                    >
                      ({person.military_number})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              className="mt-4 px-4 py-2 rounded-lg border self-start"
              style={{ fontFamily: "'Almarai', sans-serif" }}
              onClick={() => setOpenModal(null)}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {openModal === "letters" && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] px-4"
          onClick={() => setOpenModal(null)}
        >
          <div
            dir="rtl"
            className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-[420px] max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontFamily: "'Almarai', sans-serif",
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 15,
              }}
            >
              الخطابات الصادرة اليوم ({todayStats.lettersList.length})
            </h2>

            <div className="overflow-y-auto flex-1 flex flex-col gap-2">
              {todayStats.lettersList.map((letter) => (
                <button
                  key={letter.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/letters-archive/${letter.id}`)}
                  className="w-full text-right px-3 py-2.5 rounded-lg hover:bg-[#f5f6fb] border border-[#eff0f6] transition-colors"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#2d3648",
                    }}
                  >
                    خطاب رقم {letter.letter_number}
                  </span>

                  {letter.letter_type_name && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "#717d96",
                        marginRight: 8,
                      }}
                    >
                      ({letter.letter_type_name})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              className="mt-4 px-4 py-2 rounded-lg border self-start"
              style={{ fontFamily: "'Almarai', sans-serif" }}
              onClick={() => setOpenModal(null)}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
}