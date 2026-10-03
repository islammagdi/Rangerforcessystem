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

      // نفس أرقام كروت القوة وبيان الوحدات بالظبط
      const { data, error } = await supabase.rpc("get_dashboard_overview");
      if (error) throw error;

      const o = (data ?? {}) as Record<string, any>;
      const n = (key: string) => Number(o[key] ?? 0);

      setTotalForce(n("volunteers") + n("conscripts"));
      setKhawarej(n("outside_volunteers") + n("outside_conscripts"));
    } catch (error) {
      console.error("خطأ في DonutChart:", error);
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