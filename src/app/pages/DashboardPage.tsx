import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

import { Sidebar } from "../components/dashboard/Sidebar";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
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

// ─── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
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

// ─── Dashboard Page ────────────────────────────────────────────────────────────
export function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // ─── تحميل بيانات المستخدم الحالي ─────────────────────────────────────────
  useEffect(() => {
    const loadCurrentUser = async () => {
      console.log("DashboardPage اشتغل");
      try {
        // الحصول على المستخدم المسجل حاليًا
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

        // الحصول على بيانات الـ Profile والـ Personnel
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            username,
            personnel:personnel_id (
              full_name,
              military_number,
              rank_id
            )
          `)
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("خطأ في جلب بيانات المستخدم:", error);
          return;
        }

        setCurrentUser(data);

        // عرض البيانات في Console للتأكد
        console.log("المستخدم الحالي:", data);
      } catch (error) {
        console.error("حدث خطأ غير متوقع:", error);
      }
    };

    loadCurrentUser();
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#f7f9fc]"
      dir="rtl"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
      />

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <DashboardHeader pageTitle="الموقف العام" />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 p-6">

            {/* ── بيانات المستخدم الحالي ────────────────────────────────── */}
            {currentUser && (
              <div
                className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
              >
                <div className="flex flex-wrap gap-6 items-center">

                  <div>
                    <p className="text-gray-500 text-sm">
                      المستخدم
                    </p>
                    <p className="font-bold text-[#344736]">
                      {currentUser.username}
                    </p>
                  </div>

                  {currentUser.personnel && (
                    <>
                      <div>
                        <p className="text-gray-500 text-sm">
                          الاسم
                        </p>
                        <p className="font-bold text-[#344736]">
                          {currentUser.personnel.full_name}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500 text-sm">
                          الرقم العسكري
                        </p>
                        <p className="font-bold text-[#344736]">
                          {currentUser.personnel.military_number}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500 text-sm">
                          رقم الدرجة
                        </p>
                        <p className="font-bold text-[#344736]">
                          {currentUser.personnel.rank_id}
                        </p>
                      </div>
                    </>
                  )}

                </div>
              </div>
            )}

            {/* ── 1. الموقف العام للقوة ─────────────────────────────────── */}
            <SectionTitle>
              الموقف العام للقوة
            </SectionTitle>

            {/* Row 1 */}
            <div className="flex gap-4 flex-wrap">
              <StatCard
                icon={<RankIcon />}
                value="500"
                label="عدد ضباط الصف"
              />

              <StatCard
                icon={<SoldiersIcon />}
                value="4,000"
                label="عدد الجنود"
              />

              <StatCard
                icon={<PeopleIcon />}
                value="4,500"
                label="القوة الفعلية"
              />
            </div>

            {/* Row 2 */}
            <div className="flex gap-4 flex-wrap">
              <StatCard
                icon={<RankIcon />}
                value="40"
                label="خوارج ضباط الصف"
                valueColor="#172e78"
              />

              <StatCard
                icon={<SoldiersIcon />}
                value="200"
                label="خوارج الجنود"
                valueColor="#172e78"
              />

              <StatCard
                icon={<PeopleIcon />}
                value="240"
                label="اجمالي الخوارج"
                valueColor="#172e78"
              />
            </div>

            {/* ── 2. تحليل موقف الخوارج ─────────────────────────────────── */}
            <SectionTitle>
              تحليل موقف الخوارج
            </SectionTitle>

            <div className="flex gap-4 items-start flex-wrap lg:flex-nowrap">

              {/* Donut chart */}
              <div className="w-full lg:w-[280px] shrink-0">
                <DonutChart />
              </div>

              {/* Bar chart */}
              <div className="flex-1 min-w-0 w-full">
                <UnitBarChart />
              </div>

            </div>

            {/* ── 3. موقف دفعات الرديف ─────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-2">

              <p
                style={{
                  color: "#2d3648",
                  fontFamily: "'Almarai', sans-serif",
                  fontSize: "14px",
                }}
              >
                اخر تحديث: 30-3-2026
              </p>

              <SectionTitle>
                موقف دفعات الرديف
              </SectionTitle>

            </div>

            {/* Redif row 1 */}
            <div className="flex gap-4 flex-wrap">

              <StatCard
                icon={<PeopleIcon />}
                value="1,850"
                label="عدد المستحقين للتسريح"
              />

              <StatCard
                icon={<CalendarIcon />}
                value="1 مارس 2026"
                label="تاريخ الدفعة التالية"
              />

            </div>

            {/* Redif row 2 */}
            <div className="flex gap-4 flex-wrap pb-6">

              <ProgressCard
                icon={<IdCardIcon />}
                value="38"
                subValue="من 120"
                label="عدد مسلِّمي رخصة القيادة"
                percentage={50}
                percentLabel="50%"
              />

              <ProgressCard
                icon={<PersonCheckIcon />}
                value="978"
                subValue="من 1,850"
                label="عدد مسلِّمي تحقيق الشخصية"
                percentage={53}
                percentLabel="50%"
              />

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}