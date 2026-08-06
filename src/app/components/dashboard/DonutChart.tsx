import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "../../../lib/supabase";

const COLORS = ["#00b867", "#476ae9"];

interface ChartData {
  name: string;
  value: number;
}

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 justify-start">
      <div
        className="w-4 h-4 rounded-[4px] shrink-0"
        style={{ background: color }}
      />

      <span
        style={{
          color: "#717d96",
          fontFamily: "'Almarai', sans-serif",
          fontSize: "14px",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function DonutChart() {
  const [totalForce, setTotalForce] = useState(0);
  const [khawarej, setKhawarej] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // ============================================================
      // 1. جلب تصنيفات الأفراد
      // ============================================================

      const { data: categories, error: categoriesError } =
        await supabase
          .from("personnel_categories")
          .select("id, code")
          .in("code", ["VOLUNTEER", "CONSCRIPT"]);

      if (categoriesError) {
        console.error(
          "خطأ في جلب تصنيفات الأفراد:",
          categoriesError
        );
        return;
      }

      const volunteerCategory = categories?.find(
        (item) => item.code === "VOLUNTEER"
      );

      const conscriptCategory = categories?.find(
        (item) => item.code === "CONSCRIPT"
      );

      if (!volunteerCategory || !conscriptCategory) {
        console.error(
          "لم يتم العثور على VOLUNTEER أو CONSCRIPT"
        );
        return;
      }

      // ============================================================
      // 2. جلب حالات الخدمة
      // ============================================================

      const { data: statuses, error: statusesError } =
        await supabase
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

      const unitForceStatus = statuses?.find(
        (item) => item.code === "UNIT_FORCE"
      );

      const attachedStatus = statuses?.find(
        (item) => item.code === "ATTACHED"
      );

      if (!unitForceStatus || !attachedStatus) {
        console.error(
          "لم يتم العثور على UNIT_FORCE أو ATTACHED"
        );
        return;
      }

      // ============================================================
      // 3. إجمالي القوة
      //
      // إجمالي القوة =
      // جميع المتطوعين + جميع المجندين
      //
      // سواء كان:
      // UNIT_FORCE
      // أو ATTACHED
      //
      // OUTSIDE_FORCE و DISCHARGED لا يدخلوا في الحساب
      // ============================================================

      const { count: totalForceCount, error: totalForceError } =
        await supabase
          .from("personnel")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("personnel_category_id", [
            volunteerCategory.id,
            conscriptCategory.id,
          ])
          .in("service_status_id", [
            unitForceStatus.id,
            attachedStatus.id,
          ])
          .eq("is_active", true);

      if (totalForceError) {
        console.error(
          "خطأ في حساب إجمالي القوة:",
          totalForceError
        );
        return;
      }

      // ============================================================
      // 4. إجمالي الخوارج
      //
      // الخوارج =
      // المتطوعين + المجندين
      // بشرط أن الحالة ATTACHED فقط
      //
      // UNIT_FORCE ليس خوارج
      // OUTSIDE_FORCE ليس خوارج
      // DISCHARGED ليس خوارج
      // ============================================================

      const { count: khawarejCount, error: khawarejError } =
        await supabase
          .from("personnel")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("personnel_category_id", [
            volunteerCategory.id,
            conscriptCategory.id,
          ])
          .eq("service_status_id", attachedStatus.id)
          .eq("is_active", true);

      if (khawarejError) {
        console.error(
          "خطأ في حساب إجمالي الخوارج:",
          khawarejError
        );
        return;
      }

      const total = totalForceCount ?? 0;
      const outside = khawarejCount ?? 0;

      setTotalForce(total);
      setKhawarej(outside);

      console.log("بيانات Donut:", {
        totalForce: total,
        khawarej: outside,
      });
    } catch (error) {
      console.error(
        "خطأ غير متوقع في DonutChart:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // النسبة
  // ============================================================

  const percentage =
    totalForce > 0
      ? Math.round((khawarej / totalForce) * 100)
      : 0;

  // الجزء الخاص بالقوة داخل الوحدة
  const forceInside = Math.max(totalForce - khawarej, 0);

  const chartData: ChartData[] = [
    {
      name: "اجمالي القوة",
      value: forceInside,
    },
    {
      name: "اجمالي الخوارج",
      value: khawarej,
    },
  ];

  return (
    <div className="bg-white rounded-[20px] border border-[#eff0f6] flex flex-col items-end p-6 gap-8 self-stretch min-w-[200px]">

      {/* ========================================================
          العنوان
      ======================================================== */}

      <p
        className="text-right w-full"
        style={{
          color: "#2d3648",
          fontFamily: "'Almarai', sans-serif",
          fontWeight: 700,
          fontSize: "20px",
        }}
      >
        نسبة الخوارج من القوة
      </p>

      {/* ========================================================
          الرسم البياني
      ======================================================== */}

      <div
        className="w-full flex justify-center"
        style={{ height: 180 }}
      >
        <div className="relative w-[180px] h-[180px]">

          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <span
                style={{
                  color: "#717d96",
                  fontFamily: "'Almarai', sans-serif",
                  fontSize: "14px",
                }}
              >
                جاري التحميل...
              </span>
            </div>
          ) : (
            <>
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="white"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={COLORS[index]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* ==================================================
                  الرقم الموجود في المنتصف
              ================================================== */}

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">

                <span
                  style={{
                    color: "#717d96",
                    fontFamily: "'Almarai', sans-serif",
                    fontSize: "14px",
                  }}
                >
                  الخوارج/القوة
                </span>

                <span
                  style={{
                    color: "#2d3648",
                    fontFamily: "'Almarai', sans-serif",
                    fontWeight: 700,
                    fontSize: "28px",
                    lineHeight: 1.2,
                  }}
                >
                  {percentage}%
                </span>

              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================
          Legend
      ======================================================== */}

      <div className="flex flex-col gap-3 items-start w-full">

        <LegendItem
          color="#00b867"
          label={`القوة داخل الوحدات (${forceInside.toLocaleString(
            "en-US"
          )})`}
        />

        <LegendItem
          color="#476ae9"
          label={`إجمالي الخوارج (${khawarej.toLocaleString(
            "en-US"
          )})`}
        />

      </div>
    </div>
  );
}