import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "اجمالي القوة", value: 75 },
  { name: "اجمالي الخوارج", value: 25 },
];

const COLORS = ["#00b867", "#476ae9"];

/** Legend item with coloured dot */
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 justify-end">
      <span style={{ color: "#717d96", fontFamily: "'Almarai', sans-serif", fontSize: "14px" }}>
        {label}
      </span>
      <div className="w-4 h-4 rounded-[4px] shrink-0" style={{ background: color }} />
    </div>
  );
}

/**
 * Donut chart showing Khawarej percentage vs total force.
 */
export function DonutChart() {
  return (
    <div className="bg-white rounded-[20px] border border-[#eff0f6] flex flex-col items-end p-6 gap-8 self-stretch min-w-[200px]">
      {/* Title */}
      <p
        className="text-right w-full"
        style={{ color: "#2d3648", fontFamily: "'Almarai', sans-serif", fontWeight: 700, fontSize: "20px" }}
      >
        نسبة الخوارج من القوة
      </p>

      {/* Chart */}
      <div className="w-full flex justify-center" style={{ height: 180 }}>
        <div className="relative w-[180px] h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
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
                {data.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              style={{ color: "#717d96", fontFamily: "'Almarai', sans-serif", fontSize: "14px" }}
            >
              الخوارج/القوة
            </span>
            <span
              style={{ color: "#2d3648", fontFamily: "'Almarai', sans-serif", fontWeight: 700, fontSize: "28px", lineHeight: 1.2 }}
            >
              25%
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-3 items-end w-full">
        <LegendItem color="#00b867" label="اجمالي القوة" />
        <LegendItem color="#476ae9" label="اجمالي الخوارج" />
      </div>
    </div>
  );
}