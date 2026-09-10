import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useSystemAlerts } from "../../hooks/useSystemAlerts";
import { StatCard } from "../components/dashboard/StatCard";
import { ProgressCard } from "../components/dashboard/ProgressCard";
import { DonutChart } from "../components/dashboard/DonutChart";
import { UnitBarChart } from "../components/dashboard/UnitBarChart";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { useNavigate } from "react-router";

import {
  RankIcon,
  SoldiersIcon,
  PeopleIcon,
  CalendarIcon,
  IdCardIcon,
  PersonCheckIcon,
} from "../components/dashboard/DashboardIcons";

import { usePermissions } from "../../lib/usePermissions"; // عدّل المسار حسب مكان الصفحة


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
        fontSize: "24px",
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


// ============================================================
// الصفحة الرئيسية
// ============================================================

export function DashboardHome() {

  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
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

  useEffect(() => {
    loadCurrentUser();
    loadPersonnelStats();
    loadReserveBatchData();
    loadDocumentsStats();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("خطأ في Auth:", authError);
        return;
      }

      if (!user) {
        console.log("لا يوجد مستخدم مسجل الدخول");
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
        console.error("خطأ في جلب بيانات المستخدم:", error);
        return;
      }

      setCurrentUser(data);
    } catch (error) {
      console.error("خطأ غير متوقع:", error);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadPersonnelStats = async () => {
    try {
      setLoadingStats(true);

      const { data: categories, error: categoriesError } = await supabase
        .from("personnel_categories")
        .select("id, code")
        .in("code", ["VOLUNTEER", "CONSCRIPT"]);

      if (categoriesError) {
        console.error("خطأ في جلب تصنيفات الأفراد:", categoriesError);
        return;
      }

      const volunteerCategory = categories?.find((item) => item.code === "VOLUNTEER");
      const conscriptCategory = categories?.find((item) => item.code === "CONSCRIPT");

      if (!volunteerCategory || !conscriptCategory) {
        console.error("لم يتم العثور على VOLUNTEER / CONSCRIPT");
        return;
      }

      const { data: statuses, error: statusesError } = await supabase
        .from("service_statuses")
        .select("id, code")
        .eq("code", "ATTACHED");

      if (statusesError) {
        console.error("خطأ في جلب حالات الخدمة:", statusesError);
        return;
      }

      const attachedStatus = statuses?.find((item) => item.code === "ATTACHED");

      if (!attachedStatus) {
        console.error("لم يتم العثور على ATTACHED");
        return;
      }

      const { count: volunteersCount, error: volunteersError } = await supabase
        .from("personnel")
        .select(
          "id, primary_unit:units!personnel_primary_unit_id_fkey!inner(unit_type)",
          { count: "exact", head: true }
        )
        .eq("personnel_category_id", volunteerCategory.id)
        .eq("is_active", true)
        .ilike("primary_unit.unit_type", "MAIN");

      if (volunteersError) {
        console.error("خطأ في حساب المتطوعين:", volunteersError);
      }

      const { count: conscriptsCount, error: conscriptsError } = await supabase
        .from("personnel")
        .select(
          "id, primary_unit:units!personnel_primary_unit_id_fkey!inner(unit_type)",
          { count: "exact", head: true }
        )
        .eq("personnel_category_id", conscriptCategory.id)
        .eq("is_active", true)
        .ilike("primary_unit.unit_type", "MAIN");

      if (conscriptsError) {
        console.error("خطأ في حساب المجندين:", conscriptsError);
      }

      const { count: outsideVolunteersCount, error: outsideVolunteersError } = await supabase
        .from("personnel")
        .select(
          "id, primary_unit:units!personnel_primary_unit_id_fkey!inner(unit_type)",
          { count: "exact", head: true }
        )
        .eq("personnel_category_id", volunteerCategory.id)
        .eq("is_active", true)
        .eq("service_status_id", attachedStatus.id)
        .ilike("primary_unit.unit_type", "MAIN");

      if (outsideVolunteersError) {
        console.error("خطأ في حساب خوارج المتطوعين:", outsideVolunteersError);
      }

      const { count: outsideConscriptsCount, error: outsideConscriptsError } = await supabase
        .from("personnel")
        .select(
          "id, primary_unit:units!personnel_primary_unit_id_fkey!inner(unit_type)",
          { count: "exact", head: true }
        )
        .eq("personnel_category_id", conscriptCategory.id)
        .eq("is_active", true)
        .eq("service_status_id", attachedStatus.id)
        .ilike("primary_unit.unit_type", "MAIN");

      if (outsideConscriptsError) {
        console.error("خطأ في حساب خوارج المجندين:", outsideConscriptsError);
      }

      const volunteers = volunteersCount ?? 0;
      const conscripts = conscriptsCount ?? 0;
      const outsideVolunteers = outsideVolunteersCount ?? 0;
      const outsideConscripts = outsideConscriptsCount ?? 0;

      const totalForce = volunteers + conscripts;
      const totalOutside = outsideVolunteers + outsideConscripts;

      setStats({
        volunteers,
        conscripts,
        totalForce,
        outsideVolunteers,
        outsideConscripts,
        totalOutside,
      });
    } catch (error) {
      console.error("خطأ غير متوقع أثناء حساب الإحصائيات:", error);
    } finally {
      setLoadingStats(false);
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

async function getNextReserveBatch(): Promise<{ id: string; batch_date: string } | null> {
  const todayStr = toDbDateString(new Date());

  // ✅ .gt بدل .gte: الدفعة "التالية" لازم تكون بعد اليوم فعلاً،
  // مش تشمل دفعة بتاريخ اليوم نفسه (اللي ممكن تكون دفعة قديمة/فارغة
  // اتسجلت بنفس تاريخ النهاردة بالصدفة)
  const { data: upcoming, error: upcomingError } = await supabase
    .from("reserve_batches")
    .select("id, batch_date")
    .gt("batch_date", todayStr)
    .order("batch_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (upcomingError) {
    console.error("خطأ في جلب دفعة الرديف القادمة:", upcomingError);
  }

  if (upcoming) {
    return upcoming;
  }

  // احتياطي: لو مفيش أي دفعة بعد اليوم، ناخد آخر دفعة (بما فيها
  // اللي بتاريخ اليوم نفسه أو قبله)
  const { data: latestPast, error: latestPastError } = await supabase
    .from("reserve_batches")
    .select("id, batch_date")
    .lte("batch_date", todayStr)
    .order("batch_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestPastError) {
    console.error("خطأ في جلب آخر دفعة رديف سابقة:", latestPastError);
  }

  return latestPast ?? null;
}

  async function loadReserveBatchData() {
    try {
      setLoadingReserveBatch(true);

      const batch = await getNextReserveBatch();

      if (!batch) {
        setNextBatchDate(null);
        setNextBatchCount(0);
        return;
      }

      setNextBatchDate(parseDbDateString(batch.batch_date));

      const { data: conscriptCategory, error: categoryError } = await supabase
        .from("personnel_categories")
        .select("id")
        .eq("code", "CONSCRIPT")
        .single();

      if (categoryError) {
        console.error("خطأ في جلب فئة المجندين:", categoryError);
        setNextBatchCount(0);
        return;
      }

      const { count, error: personnelError } = await supabase
        .from("personnel")
        .select("id", { count: "exact", head: true })
        .eq("personnel_category_id", conscriptCategory.id)
        .eq("is_active", true)
        .eq("discharge_date", batch.batch_date);

      if (personnelError) {
        console.error("خطأ في حساب مستحقي دفعة الرديف:", personnelError);
        setNextBatchCount(0);
        return;
      }

      setNextBatchCount(count ?? 0);
    } catch (error) {
      console.error("خطأ غير متوقع في بيانات دفعة الرديف:", error);
      setNextBatchCount(0);
    } finally {
      setLoadingReserveBatch(false);
    }
  }

  async function loadDocumentsStats() {
    try {
      setLoadingDocStats(true);

      const batch = await getNextReserveBatch();

      if (!batch) {
        setDocStats({
          karizaDelivered: 0,
          karizaTotal: 0,
          licenseDelivered: 0,
          licenseTotal: 0,
        });
        return;
      }

      const { data: conscriptCategory, error: categoryError } = await supabase
        .from("personnel_categories")
        .select("id")
        .eq("code", "CONSCRIPT")
        .single();

      if (categoryError || !conscriptCategory) {
        console.error("خطأ في جلب فئة المجندين (مستندات):", categoryError);
        setDocStats({
          karizaDelivered: 0,
          karizaTotal: 0,
          licenseDelivered: 0,
          licenseTotal: 0,
        });
        return;
      }

      const { data: personnel, error: personnelError } = await supabase
        .from("personnel")
        .select("id, military_number")
        .eq("personnel_category_id", conscriptCategory.id)
        .eq("is_active", true)
        .eq("discharge_date", batch.batch_date);

      if (personnelError) {
        console.error("خطأ في جلب أفراد الدفعة القادمة:", personnelError);
        setDocStats({
          karizaDelivered: 0,
          karizaTotal: 0,
          licenseDelivered: 0,
          licenseTotal: 0,
        });
        return;
      }

      const personnelRows = personnel ?? [];

      if (personnelRows.length === 0) {
        setDocStats({
          karizaDelivered: 0,
          karizaTotal: 0,
          licenseDelivered: 0,
          licenseTotal: 0,
        });
        return;
      }

      const karizaTotal = personnelRows.length;

      const eligibleForLicense = personnelRows.filter((p) =>
        hasLicenseEligibility(p.military_number)
      );

      const licenseTotal = eligibleForLicense.length;

      const personnelIds = personnelRows.map((p) => p.id);

      const { data: documents, error: documentsError } = await supabase
        .from("reserve_batch_documents")
        .select("personnel_id, document_type, status")
        .eq("reserve_batch_id", batch.id)
        .in("personnel_id", personnelIds);

      if (documentsError) {
        console.error("خطأ في جلب حالات المستندات:", documentsError);
        setDocStats({
          karizaDelivered: 0,
          karizaTotal,
          licenseDelivered: 0,
          licenseTotal,
        });
        return;
      }

      const karizaDelivered = (documents ?? []).filter(
        (doc: any) => doc.document_type === "KARIZA" && doc.status === "DELIVERED"
      ).length;

      const eligibleIds = new Set(eligibleForLicense.map((p) => p.id));

      const licenseDelivered = (documents ?? []).filter(
        (doc: any) =>
          doc.document_type === "LICENSE" &&
          doc.status === "DELIVERED" &&
          eligibleIds.has(doc.personnel_id)
      ).length;

      setDocStats({
        karizaDelivered,
        karizaTotal,
        licenseDelivered,
        licenseTotal,
      });
    } catch (error) {
      console.error("خطأ غير متوقع أثناء حساب مستندات الدفعة:", error);
      setDocStats({
        karizaDelivered: 0,
        karizaTotal: 0,
        licenseDelivered: 0,
        licenseTotal: 0,
      });
    } finally {
      setLoadingDocStats(false);
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

  return (
    <>
      {!loadingUser && currentUser && (
        <div
          className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          dir="rtl"
        >
          <p
            className="text-gray-800 text-lg mb-1"
            style={{ fontFamily: "'Almarai', sans-serif" }}
          >
            المستخدم الحالي
          </p>

          <div className="w-full h-px bg-[#eff0f6] my-2" />

          <div className="flex flex-wrap gap-8 items-center">
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
          </div>
        </div>
      )}

      {!loadingAlerts && alerts.length > 0 && (
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
                  className="w-full rounded-[12px] px-5 py-4 flex items-center gap-3 text-right hover:opacity-80 transition-opacity"
                  style={sharedStyle}
                >
                  {content}
                </button>
              );
            }

            return (
              <div
                key={idx}
                className="w-full rounded-[12px] px-5 py-4 flex items-center gap-3"
                style={sharedStyle}
              >
                {content}
              </div>
            );
          })}
        </div>
      )}

   

      <SectionTitle>الموقف العام للقوة الحالية</SectionTitle>

      {loadingStats ? (
        <div className="text-right text-gray-500 py-4">
          جاري تحميل إحصائيات القوة...
        </div>
      ) : (
        <>
          <div className="flex gap-4 flex-wrap">
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

          <div className="flex gap-4 flex-wrap">
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
        </>
      )}

      <SectionTitle>تحليل موقف الخوارج</SectionTitle>

      <div className="flex gap-4 items-start flex-wrap lg:flex-nowrap">
        <div className="w-full lg:w-[280px] shrink-0">
          <DonutChart />
        </div>

        <div className="flex-1 min-w-0 w-full">
          <UnitBarChart />
        </div>
      </div>

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

      <div className="flex gap-4 flex-wrap">
        <StatCard
          icon={<CalendarIcon />}
          value={loadingReserveBatch ? "..." : formatArabicDate(nextBatchDate)}
          label="تاريخ الدفعة التالية"
        />

        <StatCard
          icon={<PeopleIcon />}
          value={loadingReserveBatch ? "..." : formatNumber(nextBatchCount)}
          label="عدد المستحقين للتسريح"
        />
      </div>

      <div className="flex gap-4 flex-wrap pb-6">
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

      {openModal === "discharged" && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]"
          onClick={() => setOpenModal(null)}
        >
          <div
            dir="rtl"
            className="bg-white rounded-xl p-6 w-[420px] max-w-[95vw] max-h-[80vh] flex flex-col"
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
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]"
          onClick={() => setOpenModal(null)}
        >
          <div
            dir="rtl"
            className="bg-white rounded-xl p-6 w-[420px] max-w-[95vw] max-h-[80vh] flex flex-col"
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