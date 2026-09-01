import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  computeKhawarijByUnit,
  type StatusLike,
} from "../../../lib/personnelRules";

interface ChartData {
  name: string;
  value: number;
}

// ── Layout ────────────────────────────────────────────────────────────────
const SVG_W = 600;
const SVG_H = 280;
const PAD_TOP = 60;
const PAD_BOT = 40;
const PAD_L = 44;
const PAD_R = 16;

const CHART_W = SVG_W - PAD_L - PAD_R;
const CHART_H = SVG_H - PAD_TOP - PAD_BOT;

// ── محور Y ─────────────────────────────────────────────
// 0 / 20 / 40 / 60 / 80 / 100
const Y_TICKS = [0, 20, 40, 60, 80, 100];
const MAX_VALUE = 100;

const BAR_GAP_RATIO = 0.35;

// ── Helpers ────────────────────────────────────────────────────────────────

function roundedTopPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (h <= 0) return "";

  r = Math.min(r, w / 2, h);

  return [
    `M ${x + r},${y}`,
    `H ${x + w - r}`,
    `Q ${x + w},${y} ${x + w},${y + r}`,
    `V ${y + h}`,
    `H ${x}`,
    `V ${y + r}`,
    `Q ${x},${y} ${x + r},${y}`,
    "Z",
  ].join(" ");
}

function truncate(text: string, max = 9) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// ── Tooltip ────────────────────────────────────────────────────────────────

function TooltipBubble({
  cx,
  barY,
  value,
}: {
  cx: number;
  barY: number;
  value: number;
}) {
  const label = value.toLocaleString("en-US");
  const bubbleW = Math.max(label.length * 9, 56);
  const bubbleH = 34;

  const bx = cx - bubbleW / 2;
  const by = barY - bubbleH - 14;

  return (
    <g style={{ pointerEvents: "none" }}>
      <rect
        x={bx + 2}
        y={by + 3}
        width={bubbleW}
        height={bubbleH}
        rx={8}
        fill="rgba(0,0,0,0.08)"
      />

      <rect
        x={bx}
        y={by}
        width={bubbleW}
        height={bubbleH}
        rx={8}
        fill="#00B867"
      />

      <polygon
        points={`${cx - 6},${barY - 14} ${cx + 6},${
          barY - 14
        } ${cx},${barY - 4}`}
        fill="#00B867"
      />

      <text
        x={cx}
        y={by + bubbleH / 2 + 5}
        textAnchor="middle"
        fill="#fff"
        fontSize={13}
        fontFamily="'Almarai', sans-serif"
      >
        {label}
      </text>
    </g>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

export function UnitBarChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnitData();
  }, []);

  async function loadUnitData() {
    try {
      setLoading(true);

      // ============================================================
      // 1. جلب كل حالات الخدمة (لبناء statusById)
      //
      // ⬅️ بدل جلب حالة ATTACHED فقط، نجيب كل الحالات ونستخدم
      //    نفس دالة isOutsideOwnUnit الموحدة (lib/personnelRules)
      //    اللي بتستخدمها UnitDetailPage و UnitSoldiersPage —
      //    فيتطابق تعريف "الخارج" هنا مع باقي الصفحات تمامًا.
      // ============================================================

      const {
        data: statusesData,
        error: statusesError,
      } = await supabase
        .from("service_statuses")
        .select("id, name, code");

      if (statusesError) {
        console.error(
          "خطأ في جلب حالات الخدمة:",
          statusesError
        );

        setChartData([]);
        return;
      }

      const statusById = new Map<
        string,
        StatusLike
      >(
        (statusesData ?? []).map(
          (s: any) => [s.id, s]
        )
      );

      // ============================================================
      // 2. جلب كل الأفراد النشطين مع وحدتهم الأساسية
      //
      // ⬅️ لازم نجيب attachment_unit_id و primary_unit_id صراحةً
      //    حتى تستطيع isOutsideOwnUnit التأكد من الشروط الأربعة
      //    كاملة (is_active + الحالة "ملحق" + وجود attachment_unit_id
      //    + وجود primary_unit_id)، بدل الاكتفاء بفلترة الحالة فقط
      //    زي ما كان يحصل قبل كده (وده كان يسمح بمرور بيانات غير
      //    مكتملة ضمن العدّ).
      // ============================================================

      const PAGE_SIZE = 1000;
let personnel: any[] = [];
let from = 0;

while (true) {
  const { data, error } = await supabase
    .from("personnel")
    .select(`
      id,
      service_status_id,
      primary_unit_id,
      attachment_unit_id,
      is_active,
      units:primary_unit_id (
        id,
        name
      )
    `)
    .eq("is_active", true)
    .range(from, from + PAGE_SIZE - 1);

  if (error) {
    console.error(
      "خطأ في تحميل بيانات الوحدات:",
      error
    );

    setChartData([]);
    return;
  }

  const batch = data ?? [];
  personnel = personnel.concat(batch);

  if (batch.length < PAGE_SIZE) {
    // وصلنا لآخر صفحة (عدد الصفوف الراجعة أقل من حجم الصفحة)
    break;
  }

  from += PAGE_SIZE;
}

      // ============================================================
      // 3. خريطة اسم الوحدة الأساسية (من الـ join)
      // ============================================================

      const unitNameById = new Map<string, string>();

      personnel.forEach((person: any) => {
        if (
          person.primary_unit_id &&
          person.units?.name
        ) {
          unitNameById.set(
            person.primary_unit_id,
            person.units.name
          );
        }
      });

      // ============================================================
      // 4. تجميع الخوارج حسب الوحدة الأساسية — بنفس تعريف
      //    isOutsideOwnUnit الموحد، ثم أعلى 7 وحدات فقط.
      // ============================================================

      const distribution = computeKhawarijByUnit(
        personnel as any,
        statusById,
        unitNameById
      );

      const result: ChartData[] = distribution
        .slice(0, 7)
        .map((row) => ({
          name: row.unitName,
          value: row.count,
        }));

      setChartData(result);

      console.log(
        "توزيع الخوارج على الوحدات:",
        result
      );
    } catch (error) {
      console.error(
        "خطأ غير متوقع في UnitBarChart:",
        error
      );

      setChartData([]);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // إعدادات الرسم
  // ============================================================

  const n = chartData.length || 1;

  const SLOT_W = CHART_W / n;

  const BAR_W =
    SLOT_W * (1 - BAR_GAP_RATIO);

  // ============================================================
  // تحويل القيمة إلى مكان على محور Y
  //
  // 0   = أسفل الرسم
  // 100 = فوقه بمقدار 20%
  // 200 = فوقه بمقدار 40%
  // 300 = فوقه بمقدار 60%
  // 400 = فوقه بمقدار 80%
  // 500 = أعلى الرسم
  // ============================================================

  function dynamicValueToY(v: number) {
    // نحصر القيمة عند 500 حتى لا يخرج العمود
    // خارج مساحة الرسم إذا كانت القيمة أكبر من 500
    const safeValue = Math.min(
      Math.max(v, 0),
      MAX_VALUE
    );

    return (
      PAD_TOP +
      CHART_H -
      (safeValue / MAX_VALUE) * CHART_H
    );
  }

  return (
    <div className="bg-white flex-1 rounded-[20px] border border-[#eff0f6] flex flex-col p-6 gap-4 min-w-0 overflow-hidden">

      {/* ========================================================
          Title
      ======================================================== */}

      <p
        className="text-right"
        style={{
          color: "#2d3648",
          fontFamily: "'Almarai', sans-serif",
          fontWeight: 700,
          fontSize: "20px",
        }}
      >
        توزيع الخوارج على الوحدات
      </p>

      {/* ========================================================
          Loading
      ======================================================== */}

      {loading && (
        <div
          className="flex items-center justify-center"
          style={{ height: 280 }}
        >
          <span
            style={{
              color: "#717d96",
              fontFamily: "'Almarai', sans-serif",
              fontSize: "14px",
            }}
          >
            جاري تحميل البيانات...
          </span>
        </div>
      )}

      {/* ========================================================
          Empty
      ======================================================== */}

      {!loading && chartData.length === 0 && (
        <div
          className="flex items-center justify-center"
          style={{ height: 280 }}
        >
          <span
            style={{
              color: "#717d96",
              fontFamily: "'Almarai', sans-serif",
              fontSize: "14px",
            }}
          >
            لا توجد بيانات خوارج لعرضها
          </span>
        </div>
      )}

      {/* ========================================================
          Chart
      ======================================================== */}

      {!loading && chartData.length > 0 && (
        <div
          dir="ltr"
          style={{
            width: "100%",
            overflow: "hidden",
          }}
        >
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            aria-label="توزيع الخوارج على الوحدات"
            style={{ overflow: "visible" }}
          >

            {/* ==================================================
                Grid + Y Axis
            ================================================== */}

            {Y_TICKS.map((tick) => {
              const ty =
                dynamicValueToY(tick);

              return (
                <g key={`ytick-${tick}`}>

                  {/* خط الشبكة */}

                  <line
                    x1={PAD_L}
                    y1={ty}
                    x2={SVG_W - PAD_R}
                    y2={ty}
                    stroke="#E5E5EF"
                    strokeDasharray="4 7"
                    strokeWidth={1}
                  />

                  {/* الرقم على اليسار */}

                  <text
                    x={PAD_L - 6}
                    y={ty + 4}
                    textAnchor="end"
                    fill="#615e83"
                    fontSize={12}
                    fontFamily="'Almarai', sans-serif"
                  >
                    {tick}
                  </text>

                </g>
              );
            })}

            {/* ==================================================
                Bars
            ================================================== */}

            {chartData.map((entry, i) => {
              const slotX =
                PAD_L + i * SLOT_W;

              const barX =
                slotX +
                (SLOT_W - BAR_W) / 2;

              const barY =
                dynamicValueToY(
                  entry.value
                );

              const barH =
                PAD_TOP +
                CHART_H -
                barY;

              const cx =
                barX + BAR_W / 2;

              const isHovered =
                hoveredIndex === i;

              const fill = isHovered
                ? "#00B867"
                : "#93C199";

              const path =
                roundedTopPath(
                  barX,
                  barY,
                  BAR_W,
                  barH,
                  7
                );

              const labelY =
                PAD_TOP +
                CHART_H +
                16;

              return (
                <g
                  key={`bar-${entry.name}`}
                  style={{
                    cursor: "pointer",
                  }}
                  onMouseEnter={() =>
                    setHoveredIndex(i)
                  }
                  onMouseLeave={() =>
                    setHoveredIndex(null)
                  }
                >

                  {/* Hit area */}

                  <rect
                    x={slotX}
                    y={PAD_TOP}
                    width={SLOT_W}
                    height={CHART_H}
                    fill="transparent"
                  />

                  {/* Bar */}

                  <path
                    d={path}
                    fill={fill}
                    style={{
                      transition:
                        "fill 0.15s ease",
                    }}
                  />

                  {/* Tooltip */}

                  {isHovered && (
                    <TooltipBubble
                      cx={cx}
                      barY={barY}
                      value={entry.value}
                    />
                  )}

                  {/* Unit name */}

                 {/* Unit name */}
<text
  x={cx}
  y={labelY}
  textAnchor="middle"
  fill="#615e83"
  fontSize={11}
  fontFamily="'Almarai', sans-serif"
>
  {(() => {
    const words = entry.name.split(" ");

    if (words.length <= 1) {
      return <tspan x={cx}>{entry.name}</tspan>;
    }

    const mid = Math.ceil(words.length / 2);

    return (
      <>
        <tspan x={cx} dy="0">
          {words.slice(0, mid).join(" ")}
        </tspan>

        <tspan x={cx} dy="15">
          {words.slice(mid).join(" ")}
        </tspan>
      </>
    );
  })()}
</text>

                </g>
              );
            })}

          </svg>
        </div>
      )}
    </div>
  );
}