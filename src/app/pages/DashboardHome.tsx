import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

import { StatCard } from "../components/dashboard/StatCard";
import { ProgressCard } from "../components/dashboard/ProgressCard";
import { DonutChart } from "../components/dashboard/DonutChart";
import { UnitBarChart } from "../components/dashboard/UnitBarChart";

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
// الصفحة الرئيسية
// ============================================================

export function DashboardHome() {
  // ============================================================
  // المستخدم الحالي
  // ============================================================

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);


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
  // تحميل البيانات
  // ============================================================

  useEffect(() => {
    loadCurrentUser();
    loadPersonnelStats();
    loadReserveBatchData();
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
      // 2. حالات الخدمة
      // --------------------------------------------------------

      const {
        data: statuses,
        error: statusesError,
      } = await supabase
        .from("service_statuses")
        .select("id, code")
        .in("code", [
          "UNIT_FORCE",
          "ATTACHED",
        ]);

      if (statusesError) {
        console.error(
          "خطأ في جلب حالات الخدمة:",
          statusesError
        );
        return;
      }

      const unitForceStatus =
        statuses?.find(
          (item) =>
            item.code === "UNIT_FORCE"
        );

      const attachedStatus =
        statuses?.find(
          (item) =>
            item.code === "ATTACHED"
        );

      if (
        !unitForceStatus ||
        !attachedStatus
      ) {
        console.error(
          "لم يتم العثور على UNIT_FORCE أو ATTACHED"
        );
        return;
      }


      // --------------------------------------------------------
      // 3. إجمالي المتطوعين
      //
      // UNIT_FORCE + ATTACHED
      // --------------------------------------------------------

      const {
        count: volunteersCount,
        error: volunteersError,
      } = await supabase
        .from("personnel")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "personnel_category_id",
          volunteerCategory.id
        )
        .in("service_status_id", [
          unitForceStatus.id,
          attachedStatus.id,
        ])
        .eq("is_active", true);

      if (volunteersError) {
        console.error(
          "خطأ في حساب المتطوعين:",
          volunteersError
        );
      }


      // --------------------------------------------------------
      // 4. إجمالي المجندين
      //
      // UNIT_FORCE + ATTACHED
      // --------------------------------------------------------

      const {
        count: conscriptsCount,
        error: conscriptsError,
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
        .in("service_status_id", [
          unitForceStatus.id,
          attachedStatus.id,
        ])
        .eq("is_active", true);

      if (conscriptsError) {
        console.error(
          "خطأ في حساب المجندين:",
          conscriptsError
        );
      }


      // --------------------------------------------------------
      // 5. خوارج المتطوعين
      //
      // ATTACHED فقط
      // --------------------------------------------------------

      const {
        count: outsideVolunteersCount,
        error: outsideVolunteersError,
      } = await supabase
        .from("personnel")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "personnel_category_id",
          volunteerCategory.id
        )
        .eq(
          "service_status_id",
          attachedStatus.id
        )
        .eq("is_active", true);

      if (outsideVolunteersError) {
        console.error(
          "خطأ في حساب خوارج المتطوعين:",
          outsideVolunteersError
        );
      }


      // --------------------------------------------------------
      // 6. خوارج المجندين
      //
      // ATTACHED فقط
      // --------------------------------------------------------

      const {
        count: outsideConscriptsCount,
        error: outsideConscriptsError,
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
        .eq(
          "service_status_id",
          attachedStatus.id
        )
        .eq("is_active", true);

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

      const year =
        batchDate.getFullYear();

      const month =
        String(
          batchDate.getMonth() + 1
        ).padStart(2, "0");

      const day =
        String(
          batchDate.getDate()
        ).padStart(2, "0");

      const formattedBatchDate =
        `${year}-${month}-${day}`;


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
      // مجند فقط
      // تاريخ التسريح = تاريخ الدفعة القادمة
      // نشط فقط
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
        .eq(
          "discharge_date",
          formattedBatchDate
        )
        .eq(
          "is_active",
          true
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

                </>
              )}

            </div>

          </div>
        )}


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

      </div>


      {/* ========================================================
          الرخصة وتحقيق الشخصية
          
          سيتم ربطهما ببيانات دفعات الرديف لاحقًا
      ======================================================== */}

      <div className="flex gap-4 flex-wrap pb-6">

        <ProgressCard
          icon={<IdCardIcon />}
          value="--"
          subValue="--"
          label="عدد مسلِّمي رخصة القيادة"
          percentage={0}
          percentLabel="0%"
        />


        <ProgressCard
          icon={<PersonCheckIcon />}
          value="--"
          subValue="--"
          label="عدد مسلِّمي تحقيق الشخصية"
          percentage={0}
          percentLabel="0%"
        />

      </div>

    </>
  );
}