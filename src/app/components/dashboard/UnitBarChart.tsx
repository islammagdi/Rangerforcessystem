/**
 * UnitBarChart — pure SVG implementation (no Recharts BarChart).
 * Recharts BarChart + custom shape prop causes duplicate-key warnings in the
 * SVG layer that cannot be resolved externally, so we draw the chart ourselves.
 */

const chartData = [
  { name: "س 680 اشارة",     value: 432,  active: false },
  { name: "ميس 4",            value: 189,  active: false },
  { name: "س 145 اشارة",     value: 460,  active: false },
  { name: "مج عمليات خاصة", value: 276,  active: false },
  { name: "كـ 50 صع",        value: 636,  active: true  },
  { name: "كـ 23 صع",        value: 151,  active: false },
  { name: "كـ 143 صع",       value: 397,  active: false },
];

// ── Layout constants ────────────────────────────────────────────────────────
const SVG_W   = 600;
const SVG_H   = 280;
const PAD_TOP = 60;   // room for tooltip bubble
const PAD_BOT = 40;   // room for x-axis labels
const PAD_L   = 44;   // y-axis labels
const PAD_R   = 16;

const CHART_W = SVG_W - PAD_L - PAD_R;
const CHART_H = SVG_H - PAD_TOP - PAD_BOT;

const MAX_VAL = 800;
const Y_TICKS = [0, 200, 400, 800];

const BAR_GAP_RATIO = 0.35; // fraction of slot used as gap
const n             = chartData.length;
const SLOT_W        = CHART_W / n;
const BAR_W         = SLOT_W * (1 - BAR_GAP_RATIO);

function valueToY(v: number) {
  return PAD_TOP + CHART_H - (v / MAX_VAL) * CHART_H;
}

// ── Rounded-top rectangle path ──────────────────────────────────────────────
function roundedTopPath(x: number, y: number, w: number, h: number, r: number) {
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

// ── Truncate long Arabic label ───────────────────────────────────────────────
function truncate(text: string, max = 9) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// ── Component ────────────────────────────────────────────────────────────────
export function UnitBarChart() {
  return (
    <div className="bg-white flex-1 rounded-[20px] border border-[#eff0f6] flex flex-col p-6 gap-4 min-w-0 overflow-hidden">
      {/* Title */}
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

      {/* SVG chart — ltr so geometry is left→right */}
      <div dir="ltr" style={{ width: "100%", overflow: "hidden" }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          aria-label="توزيع الخوارج على الوحدات"
        >
          {/* ── Y-axis grid lines & labels ─────────────────────────────── */}
          {Y_TICKS.map((tick) => {
            const ty = valueToY(tick);
            return (
              <g key={`ytick-${tick}`}>
                <line
                  x1={PAD_L}
                  y1={ty}
                  x2={SVG_W - PAD_R}
                  y2={ty}
                  stroke="#E5E5EF"
                  strokeDasharray="4 7"
                  strokeWidth={1}
                />
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

          {/* ── Bars ───────────────────────────────────────────────────── */}
          {chartData.map((entry, i) => {
            const slotX  = PAD_L + i * SLOT_W;
            const barX   = slotX + (SLOT_W - BAR_W) / 2;
            const barY   = valueToY(entry.value);
            const barH   = PAD_TOP + CHART_H - barY;
            const cx     = barX + BAR_W / 2;
            const fill   = entry.active ? "#00a35a" : "#abb5f5";
            const path   = roundedTopPath(barX, barY, BAR_W, barH, 7);

            // X-axis label — split into two lines if long
            const label  = truncate(entry.name);
            const labelY = PAD_TOP + CHART_H + 16;

            return (
              <g key={`bar-${entry.name}`}>
                {/* Bar */}
                <path d={path} fill={fill} />

                {/* Active tooltip bubble */}
                {entry.active && (
                  <>
                    <rect
                      x={cx - 36}
                      y={barY - 46}
                      width={72}
                      height={34}
                      rx={8}
                      fill="#294DBB"
                    />
                    <polygon
                      points={`${cx - 6},${barY - 14} ${cx + 6},${barY - 14} ${cx},${barY - 4}`}
                      fill="#294DBB"
                    />
                    <text
                      x={cx}
                      y={barY - 24}
                      textAnchor="middle"
                      fill="#f5f5f5"
                      fontSize={13}
                      fontFamily="'Almarai', sans-serif"
                    >
                      2,313
                    </text>
                  </>
                )}

                {/* X-axis label */}
                <text
                  x={cx}
                  y={labelY}
                  textAnchor="middle"
                  fill="#615e83"
                  fontSize={11}
                  fontFamily="'Almarai', sans-serif"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
