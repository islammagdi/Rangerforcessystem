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
// الرقم السابع والثامن في الرقم العسكري = 66
// (نفس المنطق المستخدم في ReserveBatchesPage)
// ============================================================

function hasLicenseEligibility(
  militaryId: string | null | undefined
) {
  const value = String(
    militaryId ?? ""
  ).trim();

  return (
    value.length >= 8 &&
    value.substring(6, 8) === "66"
  );
}


// ============================================================
// عنصر "X من Y" بحجمي خط مختلفين
// (رقم المُسلَّم بخط كبير، و"من الإجمالي" بخط أصغر)
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
  // ============================================================
  // المستخدم الحالي
  // ============================================================
const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
const { alerts, loading: loadingAlerts } = useSystemAlerts();
const { stats: todayStats, loading: loadingTodayStats } = useDashboardStats();
const [openModal, setOpenModal] = useState<"discharged" | "letters" | null>(
    null
  );

  // ============================================================
  // بيانات القوة
  // ============================================================

  const [stats, setStats] = useState({
    volunteers: 0,
    conscripts: 0,
    totalForce: 0,

    outsideVolunteers: 0,
    outsideConscripts: 0,
    totalOutside: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);


  // ============================================================
  // بيانات دفعة الرديف
  // ============================================================

  const [nextBatchDate, setNextBatchDate] =
    useState<Date | null>(null);

  const [nextBatchCount, setNextBatchCount] =
    useState(0);

  const [loadingReserveBatch, setLoadingReserveBatch] =
    useState(true);


  // ============================================================
  // بيانات تحقيق الشخصية ورخصة القيادة (دفعة الرديف القادمة)
  //
  // ✅ مصدر الحقيقة: reserve_batch_documents لنفس دفعة الرديف
  // القادمة، بنفس شرط "مستحقي التسريح" المستخدم في nextBatchCount:
  //   - فئة الفرد = مجند
  //   - is_active = true
  //   - discharge_date = تاريخ الدفعة القادمة
  //
  // الكارنيه (KARIZA): على كل مستحقي التسريح.
  // الرخصة (LICENSE): فقط على المؤهلين (رقم عسكري رقم 7-8 = 66)،
  // بنفس منطق hasLicenseEligibility في ReserveBatchesPage.
  // ============================================================

  const [docStats, setDocStats] = useState({
    karizaDelivered: 0,
    karizaTotal: 0,

    licenseDelivered: 0,
    licenseTotal: 0,
  });

  const [loadingDocStats, setLoadingDocStats] =
    useState(true);


  // ============================================================
  // تحميل البيانات
  // ============================================================

  useEffect(() => {
    loadCurrentUser();
    loadPersonnelStats();
    loadReserveBatchData();
    loadDocumentsStats();
  }, []);


  // ============================================================
  // المستخدم الحالي
  // ============================================================

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
        console.error(
          "خطأ في جلب بيانات المستخدم:",
          error
        );
        return;
      }

      console.log("بيانات المستخدم:", data);

      setCurrentUser(data);

    } catch (error) {
      console.error(
        "خطأ غير متوقع:",
        error
      );
    } finally {
      setLoadingUser(false);
    }
  };


  // ============================================================
  // إحصائيات القوة والخوارج
  //
  // ✅ مصدر الحقيقة الموحّد (نفس المطبّق بالظبط في تقرير الوحدات وصفحة
  // اليوميات):
  //
  //   القوة العامة (جنود/ضباط صف) — فرد يُحسب ضمنها بغض النظر عن كونه
  //   "قوة الوحدة" أو "ملحق" (الملحق برضه جزء من قوة وحدته الأصلية):
  //     - primary_unit.unit_type = MAIN فقط (مش MANAGE)
  //     - is_active = true
  //     - "جنود" = فئة الفرد "مجند"، "ضباط صف" = فئة الفرد "متطوع"
  //
  //   خارج (من نفس تجمّع القوة أعلاه):
  //     - primary_unit_id موجود
  //     - service_status_id = ATTACHED (ملحق)
  //     - is_active = true
  //
  // القيود بالـ !inner join على primary_unit.unit_type بتضمن إن نفس
  // التجميع (MAIN فقط) بيتطبق هنا زي ما بيتطبق في تقرير الوحدات
  // ويومية "بخوارج الوحدات" بالظبط، فالأرقام تتطابق دايمًا.
  // ============================================================

  const loadPersonnelStats = async () => {
    try {
      setLoadingStats(true);


      // --------------------------------------------------------
      // 1. تصنيفات الأفراد
      // --------------------------------------------------------

      const {
        data: categories,
        error: categoriesError,
      } = await supabase
        .from("personnel_categories")
        .select("id, code")
        .in("code", [
          "VOLUNTEER",
          "CONSCRIPT",
        ]);

      if (categoriesError) {
        console.error(
          "خطأ في جلب تصنيفات الأفراد:",
          categoriesError
        );
        return;
      }

      const volunteerCategory =
        categories?.find(
          (item) =>
            item.code === "VOLUNTEER"
        );

      const conscriptCategory =
        categories?.find(
          (item) =>
            item.code === "CONSCRIPT"
        );

      if (
        !volunteerCategory ||
        !conscriptCategory
      ) {
        console.error(
          "لم يتم العثور على VOLUNTEER / CONSCRIPT"
        );
        return;
      }


      // --------------------------------------------------------
      // 2. حالة "ملحق"
      // --------------------------------------------------------

      const {
        data: statuses,
        error: statusesError,
      } = await supabase
        .from("service_statuses")
        .select("id, code")
        .eq("code", "ATTACHED");

      if (statusesError) {
        console.error(
          "خطأ في جلب حالات الخدمة:",
          statusesError
        );
        return;
      }

      const attachedStatus =
        statuses?.find(
          (item) =>
            item.code === "ATTACHED"
        );

      if (!attachedStatus) {
        console.error(
          "لم يتم العثور على ATTACHED"
        );
        return;
      }


      // --------------------------------------------------------
      // 3. عدد المتطوعين (= "ضباط صف" ضمن القوة العامة)
      //
      // وحدة أساسية نوعها MAIN فقط + is_active = true
      // (بغض النظر عن كونه قوة الوحدة أو ملحق)
      // --------------------------------------------------------

      const {
        count: volunteersCount,
        error: volunteersError,
      } = await supabase
        .from("personnel")
        .select(
          "id, primary_unit:units!personnel_primary_unit_id_fkey!inner(unit_type)",
          { count: "exact", head: true }
        )
        .eq(
          "personnel_category_id",
          volunteerCategory.id
        )
        .eq("is_active", true)
        .ilike("primary_unit.unit_type", "MAIN");

      if (volunteersError) {
        console.error(
          "خطأ في حساب المتطوعين:",
          volunteersError
        );
      }


      // --------------------------------------------------------
      // 4. عدد المجندين (= "جنود" ضمن القوة العامة)
      //
      // نفس شرط القوة أعلاه
      // --------------------------------------------------------

      const {
        count: conscriptsCount,
        error: conscriptsError,
      } = await supabase
        .from("personnel")
        .select(
          "id, primary_unit:units!personnel_primary_unit_id_fkey!inner(unit_type)",
          { count: "exact", head: true }
        )
        .eq(
          "personnel_category_id",
          conscriptCategory.id
        )
        .eq("is_active", true)
        .ilike("primary_unit.unit_type", "MAIN");

      if (conscriptsError) {
        console.error(
          "خطأ في حساب المجندين:",
          conscriptsError
        );
      }


      // --------------------------------------------------------
      // 5. خوارج المتطوعين
      //
      // من ضمن نفس تجمّع القوة (MAIN) + حالته ملحق + is_active = true
      // --------------------------------------------------------

      const {
        count: outsideVolunteersCount,
        error: outsideVolunteersError,
      } = await supabase
        .from("personnel")
        .select(
          "id, primary_unit:units!personnel_primary_unit_id_fkey!inner(unit_type)",
          { count: "exact", head: true }
        )
        .eq(
          "personnel_category_id",
          volunteerCategory.id
        )
        .eq("is_active", true)
        .eq(
          "service_status_id",
          attachedStatus.id
        )
        .ilike("primary_unit.unit_type", "MAIN");

      if (outsideVolunteersError) {
        console.error(
          "خطأ في حساب خوارج المتطوعين:",
          outsideVolunteersError
        );
      }


      // --------------------------------------------------------
      // 6. خوارج المجندين
      //
      // نفس شرط الخارج أعلاه
      // --------------------------------------------------------

      const {
        count: outsideConscriptsCount,
        error: outsideConscriptsError,
      } = await supabase
        .from("personnel")
        .select(
          "id, primary_unit:units!personnel_primary_unit_id_fkey!inner(unit_type)",
          { count: "exact", head: true }
        )
        .eq(
          "personnel_category_id",
          conscriptCategory.id
        )
        .eq("is_active", true)
        .eq(
          "service_status_id",
          attachedStatus.id
        )
        .ilike("primary_unit.unit_type", "MAIN");

      if (outsideConscriptsError) {
        console.error(
          "خطأ في حساب خوارج المجندين:",
          outsideConscriptsError
        );
      }


      // --------------------------------------------------------
      // 7. النتائج
      // --------------------------------------------------------

      const volunteers =
        volunteersCount ?? 0;

      const conscripts =
        conscriptsCount ?? 0;

      const outsideVolunteers =
        outsideVolunteersCount ?? 0;

      const outsideConscripts =
        outsideConscriptsCount ?? 0;

      // ✅ عدد المتطوعين + عدد المجندين = إجمالي القوة دايمًا (نفس تجمّع
      // البيانات بالظبط، مفيش أي استعلام منفصل لـ"إجمالي القوة")
      const totalForce =
        volunteers + conscripts;

      const totalOutside =
        outsideVolunteers +
        outsideConscripts;


      setStats({
        volunteers,
        conscripts,
        totalForce,

        outsideVolunteers,
        outsideConscripts,
        totalOutside,
      });


      console.log(
        "إحصائيات القوة:",
        {
          volunteers,
          conscripts,
          totalForce,
          outsideVolunteers,
          outsideConscripts,
          totalOutside,
        }
      );

    } catch (error) {
      console.error(
        "خطأ غير متوقع أثناء حساب الإحصائيات:",
        error
      );
    } finally {
      setLoadingStats(false);
    }
  };


  // ============================================================
  // مواعيد دفعات الرديف
  //
  // فبراير
  // مارس
  // مايو
  // يونيو
  // أغسطس
  // سبتمبر
  // نوفمبر
  // ديسمبر
  // ============================================================

  function getNextReserveBatchDate() {

    const batchMonths = [
      1,  // فبراير
      2,  // مارس
      4,  // مايو
      5,  // يونيو
      7,  // أغسطس
      8,  // سبتمبر
      10, // نوفمبر
      11, // ديسمبر
    ];

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const currentYear =
      today.getFullYear();


    // ----------------------------------------------------------
    // البحث عن أقرب دفعة في نفس السنة
    // ----------------------------------------------------------

    for (
      const month of batchMonths
    ) {

      const batchDate = new Date(
        currentYear,
        month,
        1
      );

      if (batchDate >= today) {
        return batchDate;
      }
    }


    // ----------------------------------------------------------
    // لو خلصت دفعات السنة
    // نرجع لأول دفعة في السنة التالية
    // ----------------------------------------------------------

    return new Date(
      currentYear + 1,
      batchMonths[0],
      1
    );
  }


  // ============================================================
  // تنسيق تاريخ الدفعة بصيغة YYYY-MM-DD (لمطابقة discharge_date /
  // batch_date في قاعدة البيانات)
  // ============================================================

  function toDbDateString(date: Date) {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  // ============================================================
  // تحميل بيانات دفعة الرديف القادمة
  // ============================================================

  async function loadReserveBatchData() {

    try {

      setLoadingReserveBatch(true);


      // --------------------------------------------------------
      // تحديد تاريخ الدفعة القادمة
      // --------------------------------------------------------

      const batchDate =
        getNextReserveBatchDate();

      setNextBatchDate(batchDate);


      // --------------------------------------------------------
      // تحويل التاريخ إلى YYYY-MM-DD
      // --------------------------------------------------------

      const formattedBatchDate =
        toDbDateString(batchDate);


      // --------------------------------------------------------
      // جلب ID فئة المجندين
      // --------------------------------------------------------

      const {
        data: conscriptCategory,
        error: categoryError,
      } = await supabase
        .from("personnel_categories")
        .select("id")
        .eq("code", "CONSCRIPT")
        .single();


      if (categoryError) {

        console.error(
          "خطأ في جلب فئة المجندين:",
          categoryError
        );

        setNextBatchCount(0);

        return;
      }


      // --------------------------------------------------------
      // حساب مستحقي التسريح
      //
      // مجند فقط + تاريخ التسريح = تاريخ الدفعة القادمة + is_active=true
      // --------------------------------------------------------

      const {
        count,
        error: personnelError,
      } = await supabase
        .from("personnel")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "personnel_category_id",
          conscriptCategory.id
        )
        .eq("is_active", true)
        .eq(
          "discharge_date",
          formattedBatchDate
        );


      if (personnelError) {

        console.error(
          "خطأ في حساب مستحقي دفعة الرديف:",
          personnelError
        );

        setNextBatchCount(0);

        return;
      }


      setNextBatchCount(
        count ?? 0
      );


      console.log(
        "بيانات دفعة الرديف:",
        {
          date: formattedBatchDate,
          count: count ?? 0,
        }
      );

    } catch (error) {

      console.error(
        "خطأ غير متوقع في بيانات دفعة الرديف:",
        error
      );

      setNextBatchCount(0);

    } finally {

      setLoadingReserveBatch(false);

    }
  }


  // ============================================================
  // تحميل بيانات تحقيق الشخصية ورخصة القيادة لدفعة الرديف القادمة
  //
  // ✅ نفس شرط مستحقي التسريح المستخدم في loadReserveBatchData
  // (مجند + is_active=true + discharge_date = تاريخ الدفعة القادمة)،
  // ثم نجيب حالة المستندات (KARIZA / LICENSE) بتاعتهم من
  // reserve_batch_documents، بنفس منطق ReserveBatchesPage.
  // ============================================================

  async function loadDocumentsStats() {

    try {

      setLoadingDocStats(true);


      // --------------------------------------------------------
      // تاريخ الدفعة القادمة
      // --------------------------------------------------------

      const batchDate =
        getNextReserveBatchDate();

      const formattedBatchDate =
        toDbDateString(batchDate);


      // --------------------------------------------------------
      // فئة المجندين
      // --------------------------------------------------------

      const {
        data: conscriptCategory,
        error: categoryError,
      } = await supabase
        .from("personnel_categories")
        .select("id")
        .eq("code", "CONSCRIPT")
        .single();

      if (categoryError || !conscriptCategory) {

        console.error(
          "خطأ في جلب فئة المجندين (مستندات):",
          categoryError
        );

        setDocStats({
          karizaDelivered: 0,
          karizaTotal: 0,
          licenseDelivered: 0,
          licenseTotal: 0,
        });

        return;
      }


      // --------------------------------------------------------
      // مستحقو التسريح في الدفعة القادمة
      // --------------------------------------------------------

      const {
        data: personnel,
        error: personnelError,
      } = await supabase
        .from("personnel")
        .select("id, military_number")
        .eq(
          "personnel_category_id",
          conscriptCategory.id
        )
        .eq("is_active", true)
        .eq(
          "discharge_date",
          formattedBatchDate
        );

      if (personnelError) {

        console.error(
          "خطأ في جلب أفراد الدفعة القادمة:",
          personnelError
        );

        setDocStats({
          karizaDelivered: 0,
          karizaTotal: 0,
          licenseDelivered: 0,
          licenseTotal: 0,
        });

        return;
      }

      const personnelRows =
        personnel ?? [];

      if (personnelRows.length === 0) {

        setDocStats({
          karizaDelivered: 0,
          karizaTotal: 0,
          licenseDelivered: 0,
          licenseTotal: 0,
        });

        return;
      }

      const karizaTotal =
        personnelRows.length;

      const eligibleForLicense =
        personnelRows.filter((p) =>
          hasLicenseEligibility(
            p.military_number
          )
        );

      const licenseTotal =
        eligibleForLicense.length;


      // --------------------------------------------------------
      // سجل دفعة الرديف الرسمي (reserve_batches) بنفس التاريخ،
      // عشان نقدر نجيب منه reserve_batch_documents
      // --------------------------------------------------------

      const {
        data: batchRow,
        error: batchRowError,
      } = await supabase
        .from("reserve_batches")
        .select("id")
        .eq(
          "batch_date",
          formattedBatchDate
        )
        .maybeSingle();

      if (batchRowError) {
        console.error(
          "خطأ في جلب سجل دفعة الرديف:",
          batchRowError
        );
      }

      if (!batchRow) {

        // لسه مفيش سجل دفعة رسمي بالتاريخ ده، يبقى مفيش مستندات متسجلة
        setDocStats({
          karizaDelivered: 0,
          karizaTotal,
          licenseDelivered: 0,
          licenseTotal,
        });

        return;
      }


      // --------------------------------------------------------
      // حالات المستندات لمستحقي التسريح في الدفعة القادمة
      // --------------------------------------------------------

      const personnelIds =
        personnelRows.map(
          (p) => p.id
        );

      const {
        data: documents,
        error: documentsError,
      } = await supabase
        .from(
          "reserve_batch_documents"
        )
        .select(
          "personnel_id, document_type, status"
        )
        .eq(
          "reserve_batch_id",
          batchRow.id
        )
        .in(
          "personnel_id",
          personnelIds
        );

      if (documentsError) {

        console.error(
          "خطأ في جلب حالات المستندات:",
          documentsError
        );

        setDocStats({
          karizaDelivered: 0,
          karizaTotal,
          licenseDelivered: 0,
          licenseTotal,
        });

        return;
      }

      const karizaDelivered =
        (documents ?? []).filter(
          (doc: any) =>
            doc.document_type ===
              "KARIZA" &&
            doc.status ===
              "DELIVERED"
        ).length;

      const eligibleIds = new Set(
        eligibleForLicense.map(
          (p) => p.id
        )
      );

      const licenseDelivered =
        (documents ?? []).filter(
          (doc: any) =>
            doc.document_type ===
              "LICENSE" &&
            doc.status ===
              "DELIVERED" &&
            eligibleIds.has(
              doc.personnel_id
            )
        ).length;


      setDocStats({
        karizaDelivered,
        karizaTotal,
        licenseDelivered,
        licenseTotal,
      });


      console.log(
        "بيانات تحقيق الشخصية / الرخصة:",
        {
          karizaDelivered,
          karizaTotal,
          licenseDelivered,
          licenseTotal,
        }
      );

    } catch (error) {

      console.error(
        "خطأ غير متوقع أثناء حساب مستندات الدفعة:",
        error
      );

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


  // ============================================================
  // تنسيق الأرقام
  // ============================================================

  const formatNumber = (
    value: number
  ) => {
    return value.toLocaleString(
      "en-US"
    );
  };


  // ============================================================
  // تنسيق تاريخ الدفعة
  // ============================================================

  function formatArabicDate(
    date: Date | null
  ) {

    if (!date) {
      return "غير محدد";
    }

    return date.toLocaleDateString(
      "ar-EG",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }


  // ============================================================
  // حساب نسب مئوية للكاردين (تحقيق شخصية / رخصة)
  // ============================================================

  const karizaPercentage =
    docStats.karizaTotal > 0
      ? Math.round(
          (docStats.karizaDelivered /
            docStats.karizaTotal) *
            100
        )
      : 0;

  const licensePercentage =
    docStats.licenseTotal > 0
      ? Math.round(
          (docStats.licenseDelivered /
            docStats.licenseTotal) *
            100
        )
      : 0;


  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      {/* ========================================================
          بيانات المستخدم الحالي
      ======================================================== */}

      {!loadingUser &&
        currentUser && (

          <div
            className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            dir="rtl"
          >
    

 <p
                  className="text-gray-800 text-lg mb-1"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                  }}
                >
                 المستخدم الحالي للمنظومه
                </p>
               <div className="w-full h-px bg-[#eff0f6] my-2" />
            <div className="flex flex-wrap gap-8 items-center">

              {/* اسم المستخدم */}

              <div>

                <p
                  className="text-gray-500 text-sm mb-1"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                  }}
                >
                  اسم المستخدم
                </p>

                <p
                  className="font-bold text-[#344736]"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                  }}
                >
                  {currentUser.username ||
                    "غير محدد"}
                </p>

              </div>


              {currentUser.personnel && (
                <>
                   {/* الرقم العسكري */}

                  <div>

                    <p
                      className="text-gray-500 text-sm mb-1"
                      style={{
                        fontFamily:
                          "'Almarai', sans-serif",
                      }}
                    >
                      الرقم العسكري
                    </p>

                    <p
                      className="font-bold text-[#344736]"
                      style={{
                        fontFamily:
                          "'Almarai', sans-serif",
                      }}
                    >
                      {currentUser
                        .personnel
                        .military_number ||
                        "غير محدد"}
                    </p>

                  </div>


                  
               

                  {/* الدرجة */}

                  <div>

                    <p
                      className="text-gray-500 text-sm mb-1"
                      style={{
                        fontFamily:
                          "'Almarai', sans-serif",
                      }}
                    >
                      الدرجة
                    </p>

                    <p
                      className="font-bold text-[#344736]"
                      style={{
                        fontFamily:
                          "'Almarai', sans-serif",
                      }}
                    >
                      {currentUser
                        .personnel
                        .rank?.name ||
                        "غير محدد"}
                    </p>

                  </div>
{/* الاسم الكامل */}

                  <div>

                    <p
                      className="text-gray-500 text-sm mb-1"
                      style={{
                        fontFamily:
                          "'Almarai', sans-serif",
                      }}
                    >
                      الاسم الكامل
                    </p>

                    <p
                      className="font-bold text-[#344736]"
                      style={{
                        fontFamily:
                          "'Almarai', sans-serif",
                      }}
                    >
                      {currentUser
                        .personnel
                        .full_name ||
                        "غير محدد"}
                    </p>

                  </div>


                </>
              )}

            </div>

          </div>
        )}

{/* ========================================================
          تنبيهات النظام (System Alerts)
      ======================================================== */}

      {!loadingAlerts && alerts.length > 0 && (
        <div className="flex flex-col gap-3 w-full" dir="rtl">
          {alerts.map((alert, idx) => {
                        const isClickable =
              alert.key === "overdue" ||
              alert.key === "undocumented-letters";

            const content = (
              <>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background:
                      alert.type === "critical" ? "#e3282c" : "#e37032",
                  }}
                />

                <span
                  style={{
                    fontFamily: "'Almarai', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color:
                      alert.type === "critical" ? "#991b1b" : "#8a6500",
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
              background:
                alert.type === "critical" ? "#fef2f2" : "#fff8e8",
              border:
                alert.type === "critical"
                  ? "1px solid #fecaca"
                  : "1px solid #f4d58d",
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
{/* ========================================================
          إحصائيات اليوم (Statistics)
      ======================================================== */}

      <SectionTitle>إحصائيات اليوم</SectionTitle>

      <div className="flex gap-4 w-full ">
       <div className="flex-1">
        <button
        
          type="button"
          onClick={() =>
            todayStats.dischargedToday > 0 && setOpenModal("discharged")
          }
          className="w-full block text-right"
          style={{
            cursor:
              todayStats.dischargedToday > 0 ? "pointer" : "default",
          }}
        >
          <StatCard
            icon={<PeopleIcon />}
            value={
              loadingTodayStats
                ? "..."
                : formatNumber(todayStats.dischargedToday)
            }
            label="تم إنهاء خدمتهم اليوم"
          />
        </button>

       </div>
       <div className="flex-1">
         <button
          type="button"
          onClick={() =>
            todayStats.lettersToday > 0 && setOpenModal("letters")
          }
          className="w-full block text-right"
          style={{
            cursor: todayStats.lettersToday > 0 ? "pointer" : "default",
          }}
        >
          <StatCard
            icon={<IdCardIcon />}
            value={
              loadingTodayStats
                ? "..."
                : formatNumber(todayStats.lettersToday)
            }
            label="خطابات صادرة اليوم"
          />
        </button>
       </div>

        <div className="flex-1">
          <StatCard
          icon={<PersonCheckIcon />}
          value={
            loadingTodayStats
              ? "..."
              : formatNumber(todayStats.activitiesToday)
          }
          label="عملياتك اليوم"
        />
        </div>
      </div>
      {/* ========================================================
          1. الموقف العام للقوة
      ======================================================== */}

      <SectionTitle>
        الموقف العام للقوة الحالية
      </SectionTitle>



      {loadingStats ? (

        <div className="text-right text-gray-500 py-4">
          جاري تحميل إحصائيات القوة...
        </div>

      ) : (

        <>

          {/* ----------------------------------------------------
              القوة الفعلية
          ---------------------------------------------------- */}

          <div className="flex gap-4 flex-wrap">

            <StatCard
              icon={<RankIcon />}
              value={formatNumber(
                stats.volunteers
              )}
              label="عدد المتطوعين"
            />

            <StatCard
              icon={<SoldiersIcon />}
              value={formatNumber(
                stats.conscripts
              )}
              label="عدد المجندين"
            />

            <StatCard
              icon={<PeopleIcon />}
              value={formatNumber(
                stats.totalForce
              )}
              label="القوة الفعلية"
            />

          </div>


          {/* ----------------------------------------------------
              الخوارج
          ---------------------------------------------------- */}

          <div className="flex gap-4 flex-wrap">

            <StatCard
              icon={<RankIcon />}
              value={formatNumber(
                stats.outsideVolunteers
              )}
              label="خوارج المتطوعين"
              valueColor="#2D3648"
            />

            <StatCard
              icon={<SoldiersIcon />}
              value={formatNumber(
                stats.outsideConscripts
              )}
              label="خوارج المجندين"
              valueColor="#2D3648"
            />

            <StatCard
              icon={<PeopleIcon />}
              value={formatNumber(
                stats.totalOutside
              )}
              label="إجمالي الخوارج"
              valueColor="#2D3648"
            />

          </div>

        </>
      )}


      {/* ========================================================
          2. تحليل موقف الخوارج
      ======================================================== */}

      <SectionTitle>
        تحليل موقف الخوارج
      </SectionTitle>


      <div className="flex gap-4 items-start flex-wrap lg:flex-nowrap">

        <div className="w-full lg:w-[280px] shrink-0">

          <DonutChart />

        </div>


        <div className="flex-1 min-w-0 w-full">

          <UnitBarChart />

        </div>

      </div>


      {/* ========================================================
          3. موقف دفعات الرديف
      ======================================================== */}

      <div className="flex items-center justify-between flex-wrap gap-2">

        <p
          style={{
            color: "#2d3648",
            fontFamily:
              "'Almarai', sans-serif",
            fontSize: "14px",
          }}
        >
          آخر تحديث:{" "}
          {new Date().toLocaleDateString(
            "ar-EG"
          )}
        </p>


        <SectionTitle>
          موقف دفعة الرديف
        </SectionTitle>

      </div>


      {/* ========================================================
          كروت دفعة الرديف
      ======================================================== */}

      <div className="flex gap-4 flex-wrap">

        {/* ------------------------------------------------------
            تاريخ الدفعة التالية
        ------------------------------------------------------ */}

        <StatCard
          icon={<CalendarIcon />}
          value={
            loadingReserveBatch
              ? "..."
              : formatArabicDate(
                  nextBatchDate
                )
          }
          label="تاريخ الدفعة التالية"
        />
        {/* ------------------------------------------------------
            عدد المستحقين للتسريح
        ------------------------------------------------------ */}

        <StatCard
          icon={<PeopleIcon />}
          value={
            loadingReserveBatch
              ? "..."
              : formatNumber(
                  nextBatchCount
                )
          }
          label="عدد المستحقين للتسريح"
        />



      </div>


      {/* ========================================================
          الرخصة وتحقيق الشخصية
          
          ✅ مربوطة الآن ببيانات دفعة الرديف القادمة من
          reserve_batch_documents (KARIZA / LICENSE)
          
          ✅ القيمة معروضة بصيغة "X من Y" بحجمي خط مختلفين عبر
          DeliveredOfTotalLabel — عدّل deliveredFontSize و
          totalFontSize بالأسفل للتحكم في الحجم
      ======================================================== */}

      <div className="flex gap-4 flex-wrap pb-6">
 <ProgressCard
          icon={<PersonCheckIcon />}
          value={
            loadingDocStats ? (
              "..."
            ) : (
              <DeliveredOfTotalLabel
                delivered={formatNumber(
                  docStats.karizaDelivered
                )}
                total={formatNumber(
                  docStats.karizaTotal
                )}
                deliveredFontSize={20}
                totalFontSize={16}
              />
            )
          }
          label="عدد مسلِّمي تحقيق الشخصية"
          percentage={
            loadingDocStats
              ? 0
              : karizaPercentage
          }
          percentLabel={
            loadingDocStats
              ? "0%"
              : `${karizaPercentage}%`
          }
        />
        <ProgressCard
          icon={<IdCardIcon />}
          value={
            loadingDocStats ? (
              "..."
            ) : (
              <DeliveredOfTotalLabel
                delivered={formatNumber(
                  docStats.licenseDelivered
                )}
                total={formatNumber(
                  docStats.licenseTotal
                )}
                deliveredFontSize={20}
                totalFontSize={16}
              />
            )
          }
          label="عدد مسلِّمي رخصة القيادة"
          percentage={
            loadingDocStats
              ? 0
              : licensePercentage
          }
          percentLabel={
            loadingDocStats
              ? "0%"
              : `${licensePercentage}%`
          }
        />


       

      </div>
{/* ========================================================
          Modal: تفاصيل الأفراد اللي اتنهت خدمتهم اليوم
      ======================================================== */}

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
              الأفراد اللي اتنهت خدمتهم اليوم (
              {todayStats.dischargedList.length})
            </h2>

            <div className="overflow-y-auto flex-1 flex flex-col gap-2">
              {todayStats.dischargedList.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/dashboard/individual-query/soldier/${person.id}`
                    )
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

      {/* ========================================================
          Modal: تفاصيل الخطابات الصادرة اليوم
      ======================================================== */}

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
                  onClick={() =>
                    navigate(`/dashboard/letters-archive/${letter.id}`)
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