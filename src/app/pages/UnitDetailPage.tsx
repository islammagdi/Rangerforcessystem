import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { ArrowDownUp, Building2 } from "lucide-react";

import svgPaths from "../../imports/بيانالوحداتالموقفالعامبيانوحده-1/svg-bswzreobyg";
import { supabase } from "../../lib/supabase";
import {
  isCountedInUnitStrength,
  isOutsideOwnUnit,
  isAttachedStatus,
  isConscriptCategory,
  isVolunteerCategory,
  type StatusLike,
  type CategoryLike,
  type PersonnelLike,
} from "../../lib/personnelRules";

// ─────────────────────────────────────────────────────────────
// Shared style
// ─────────────────────────────────────────────────────────────

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

const GRAD_ID = "statGrad";

// ─────────────────────────────────────────────────────────────
// Database rows
// ─────────────────────────────────────────────────────────────

interface DbUnit {
  id: string;
  name: string;
  code: string | null;
  unit_type: string | null;
  parent_unit_id: string | null;
  is_active: boolean;
}

interface DbPersonnelRow extends PersonnelLike {
  id: string;
  military_number: string;
  full_name: string;
  rank_id: string | null;
}

interface DbRank {
  id: string;
  name: string;
  code: string | null;
}

interface DbPersonnelCategory {
  id: string;
  name: string;
  code: string | null;
}

interface DbServiceStatus {
  id: string;
  name: string;
  code: string | null;
}

// ─────────────────────────────────────────────────────────────
// Gradient definitions
// ─────────────────────────────────────────────────────────────

function GradDefs() {
  return (
    <defs>
      <linearGradient
        id={GRAD_ID}
        x1="0"
        y1="0"
        x2="0"
        y2="1"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#00B867" />
        <stop offset="1" stopColor="#00522E" />
      </linearGradient>
    </defs>
  );
}

// ─────────────────────────────────────────────────────────────
// Stat icons
// ─────────────────────────────────────────────────────────────

function IconKhawarij() {
  return (
    <svg width="24" height="24" viewBox="0 0 18.75 18.75" fill="none">
      <GradDefs />

      <path
        clipRule="evenodd"
        d={svgPaths.p8cec1f0}
        fill={`url(#${GRAD_ID})`}
        fillRule="evenodd"
      />
    </svg>
  );
}

function IconSoldiers() {
  return (
    <svg width="24" height="30" viewBox="0 0 25.9877 30" fill="none">
      <defs>
        <linearGradient
          id="soldierGrad1"
          x1="12.9938"
          x2="12.9938"
          y1="0"
          y2="24.9314"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>

        <linearGradient
          id="soldierGrad2"
          x1="10.5369"
          x2="10.5369"
          y1="14.655"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
      </defs>

      <path
        clipRule="evenodd"
        d={svgPaths.p1528f680}
        fill="url(#soldierGrad1)"
        fillRule="evenodd"
      />

      <path
        clipRule="evenodd"
        d={svgPaths.p1681e00}
        fill="url(#soldierGrad2)"
        fillRule="evenodd"
      />
    </svg>
  );
}

function IconNCO() {
  return (
    <svg width="24" height="24" viewBox="0 0 19.62 23.1075" fill="none">
      <defs>
        <linearGradient
          id="ncoGrad1"
          x1="9.81"
          x2="9.81"
          y1="6.21"
          y2="16.0275"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>

        <linearGradient
          id="ncoGrad2"
          x1="9.81"
          x2="9.81"
          y1="0"
          y2="23.1075"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
      </defs>

      <path d={svgPaths.p8118600} fill="url(#ncoGrad1)" />
      <path d={svgPaths.p14328e00} fill="url(#ncoGrad2)" />
    </svg>
  );
}

function IconGroup() {
  return (
    <svg width="30" height="22.5" viewBox="0 0 30 22.5" fill="none">
      <defs>
        <linearGradient
          id="grp0"
          x1="5"
          x2="5"
          y1="0"
          y2="7.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>

        <linearGradient
          id="grp1"
          x1="4.55625"
          x2="4.55625"
          y1="8.75"
          y2="17.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>

        <linearGradient
          id="grp2"
          x1="25"
          x2="25"
          y1="0"
          y2="7.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>

        <linearGradient
          id="grp3"
          x1="25.4437"
          x2="25.4437"
          y1="8.75"
          y2="17.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>

        <linearGradient
          id="grp4"
          x1="15"
          x2="15"
          y1="0"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>

        <linearGradient
          id="grp5"
          x1="15"
          x2="15"
          y1="11.25"
          y2="22.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
      </defs>

      <path d={svgPaths.p24391d00} fill="url(#grp0)" />
      <path d={svgPaths.p2f932980} fill="url(#grp1)" />
      <path d={svgPaths.p3a06cf00} fill="url(#grp2)" />
      <path d={svgPaths.p23b55080} fill="url(#grp3)" />
      <path d={svgPaths.p4eff300} fill="url(#grp4)" />
      <path d={svgPaths.p32f2a500} fill="url(#grp5)" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────

function getStatusBadgeStyle(
  status: DbServiceStatus | undefined
) {
  const name = status?.name ?? "";

  // ⬅️ استخدام isAttachedStatus الموحدة (lib/personnelRules)
  //    بدل تكرار الشرط محليًا
  if (isAttachedStatus(status)) {
    return {
      bg: "#e9f9ff",
      dot: "#29BBD4",
      text: "#146d7c",
    };
  }

  const code = status?.code?.toUpperCase() ?? "";

  if (
    code === "LEAVE" ||
    name.includes("اجاز")
  ) {
    return {
      bg: "#fff7f0",
      dot: "#e37032",
      text: "#9a4a10",
    };
  }

  return {
    bg: "#ebfaea",
    dot: "#35C128",
    text: "#26861d",
  };
}

function StatusBadge({
  status,
}: {
  status: DbServiceStatus | undefined;
}) {
  const s = getStatusBadgeStyle(status);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[16px] pl-1.5 pr-2 py-0.5"
      style={{ background: s.bg }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: s.dot }}
      />

      <span
        style={{
          ...F,
          fontWeight: 700,
          fontSize: 12,
          color: s.text,
          whiteSpace: "nowrap",
        }}
      >
        {status?.name ?? "—"}
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Action buttons
// ─────────────────────────────────────────────────────────────

function ActionBtns({
  onView,
}: {
  onView: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <button
        type="button"
        className="bg-[#DCF4DF] rounded-[4px] p-[2px] hover:opacity-80 transition-opacity"
        title="تحديد"
      >
        <svg
          width="15"
          height="14"
          viewBox="0 0 15 13.868"
          fill="none"
        >
          <path
            d={svgPaths.p11466900}
            fill="#415844"
          />
        </svg>
      </button>

      <button
        type="button"
        className="bg-[#f5f5f5] rounded-[4px] p-[2px] hover:opacity-80 transition-opacity"
        title="عرض"
        onClick={onView}
      >
        <svg
          width="13"
          height="9"
          viewBox="0 0 12.9339 8.74995"
          fill="none"
        >
          <path
            clipRule="evenodd"
            d={svgPaths.p513580}
            fill="#2D3648"
            fillRule="evenodd"
          />
        </svg>
      </button>

      <button
        type="button"
        className="bg-[#f5f5f5] rounded-[4px] p-[2px] hover:opacity-80 transition-opacity"
        title="تحويل"
      >
        <ArrowDownUp
          size={11}
          className="text-[#2d3648]"
        />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bar chart
// ─────────────────────────────────────────────────────────────

interface BarChartRow {
  label: string;
  outside: number;
  remaining: number;
}

function UnitBarChart({
  data,
}: {
  data: BarChartRow[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 justify-end">
        <div className="flex items-center gap-2">
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#2d3648",
            }}
          >
            المتبقي
          </span>

          <span className="w-4 h-4 rounded-[2px] shrink-0 bg-[#abb5f5]" />
        </div>

        <div className="flex items-center gap-2">
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#2d3648",
            }}
          >
            الخارج
          </span>

          <span className="w-4 h-4 rounded-[2px] shrink-0 bg-[#00B867]" />
        </div>
      </div>

      <ResponsiveContainer
        width="100%"
        height={180}
      >
        <BarChart
          data={data}
          barCategoryGap="30%"
          barGap={3}
          margin={{
            top: 4,
            right: 0,
            bottom: 4,
            left: 0,
          }}
        >
          <XAxis
            dataKey="label"
            tick={{
              fontFamily: "'Almarai', sans-serif",
              fontSize: 12,
              fill: "#2d3648",
            }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{
              fontFamily: "'Almarai', sans-serif",
              fontSize: 11,
              fill: "#2d3648",
            }}
            axisLine={false}
            tickLine={false}
            width={45}
            orientation="right"
            allowDecimals={false}
          />

          <Bar
            dataKey="outside"
            name="الخارج"
            fill="#00B867"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell
                key={`outside-${i}`}
                fill="#00B867"
              />
            ))}
          </Bar>

          <Bar
            dataKey="remaining"
            name="المتبقي"
            fill="#abb5f5"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell
                key={`remaining-${i}`}
                fill="#abb5f5"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Donut chart
// ─────────────────────────────────────────────────────────────

function DonutChartPanel({
  pct,
  inside,
  outside,
}: {
  pct: number;
  inside: number;
  outside: number;
}) {
  const donutData = [
    {
      value: pct,
      name: "khawarij",
    },
    {
      value: Math.max(0, 100 - pct),
      name: "inside",
    },
  ];

  return (
    <div
      className="flex flex-col items-center justify-between h-full gap-2 py-2"
      dir="rtl"
    >
      <div className="flex flex-col items-center">
        <span
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 20,
            color: "#2d3648",
            lineHeight: 1.5,
          }}
        >
          {inside}
        </span>

        <span
          style={{
            ...F,
            fontSize: 14,
            color: "#2d3648",
          }}
        >
          داخل الوحدة
        </span>
      </div>

      <div
        className="relative"
        style={{
          width: 160,
          height: 160,
        }}
      >
        <PieChart
          width={160}
          height={160}
        >
          <Pie
            data={donutData}
            cx={75}
            cy={75}
            innerRadius={50}
            outerRadius={76}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell
              key="cell-khawarij"
              fill="#7D8FF0"
            />

            <Cell
              key="cell-inside"
              fill="#00B867"
            />
          </Pie>
        </PieChart>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 20,
              color: "#2d3648",
            }}
          >
            {pct}%
          </span>

          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#2d3648",
            }}
          >
            خوارج
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <span
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 20,
            color: "#2d3648",
            lineHeight: 1.5,
          }}
        >
          {outside}
        </span>

        <span
          style={{
            ...F,
            fontSize: 14,
            color: "#2d3648",
          }}
        >
          خارج الوحده
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Source units panel
// ─────────────────────────────────────────────────────────────

interface SourceUnitRow {
  unitName: string;
  count: number;
}

function SourceUnitsPanel({
  distribution,
  totalCount,
}: {
  distribution: SourceUnitRow[];
  totalCount: number;
}) {
  const half = Math.ceil(
    distribution.length / 2
  );

  const leftColumn = distribution.slice(
    0,
    half
  );

  const rightColumn = distribution.slice(
    half
  );

  const rowCount = Math.max(
    leftColumn.length,
    rightColumn.length
  );

  const thClass =
    "px-3 py-2 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]";

  const tdClass =
    "px-3 py-2 text-right border-b border-[#eaecf0]";

  return (
    <div
      className="flex flex-col gap-3 w-full h-full"
      dir="rtl"
    >
      <div className="flex items-center justify-between w-full">
        <span
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 16,
            color: "#2d3648",
          }}
        >
          توزيع الأفراد حسب الوحدة الأصلية
        </span>

        <span
          style={{
            ...F,
            fontSize: 13,
            color: "#717d96",
          }}
        >
          {distribution.length} وحدة مصدر
        </span>
      </div>

      {distribution.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-6">
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#a1aebe",
            }}
          >
            لا يوجد أفراد ملحقين بهذه الوحدة حاليًا
          </span>
        </div>
      ) : (
        <div className="w-full overflow-x-auto max-h-[260px] overflow-y-auto rounded-[8px] border border-[#e2e7f0]">
          <table
            className="w-full min-w-[420px] border-collapse"
            dir="rtl"
          >
            <thead>
              <tr>
                <th className={thClass}>
                  <span
                    style={{
                      ...F,
                      fontSize: 13,
                      color: "#717d96",
                    }}
                  >
                    الوحدة
                  </span>
                </th>

                <th className={thClass}>
                  <span
                    style={{
                      ...F,
                      fontSize: 13,
                      color: "#717d96",
                    }}
                  >
                    العدد
                  </span>
                </th>

                <th className={thClass}>
                  <span
                    style={{
                      ...F,
                      fontSize: 13,
                      color: "#717d96",
                    }}
                  >
                    الوحدة
                  </span>
                </th>

                <th className={thClass}>
                  <span
                    style={{
                      ...F,
                      fontSize: 13,
                      color: "#717d96",
                    }}
                  >
                    العدد
                  </span>
                </th>
              </tr>
            </thead>

            <tbody>
              {Array.from({
                length: rowCount,
              }).map((_, i) => {
                const left = leftColumn[i];
                const right = rightColumn[i];

                return (
                  <tr key={i}>
                    <td className={tdClass}>
                      <span
                        style={{
                          ...F,
                          fontSize: 13,
                          color: "#2d3648",
                        }}
                        dir="auto"
                      >
                        {left?.unitName ?? ""}
                      </span>
                    </td>

                    <td className={tdClass}>
                      <span
                        style={{
                          ...F,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#2d3648",
                        }}
                      >
                        {left?.count ?? ""}
                      </span>
                    </td>

                    <td className={tdClass}>
                      <span
                        style={{
                          ...F,
                          fontSize: 13,
                          color: "#2d3648",
                        }}
                        dir="auto"
                      >
                        {right?.unitName ?? ""}
                      </span>
                    </td>

                    <td className={tdClass}>
                      <span
                        style={{
                          ...F,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#2d3648",
                        }}
                      >
                        {right?.count ?? ""}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="w-full h-px bg-[#eff0f6]" />

      <div className="flex items-center justify-between w-full">
        <span
          style={{
            ...F,
            fontSize: 13,
            color: "#717d96",
          }}
        >
          إجمالي الأفراد الملحقين
        </span>

        <span
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 15,
            color: "#2d3648",
          }}
        >
          {totalCount}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Print styles
// ─────────────────────────────────────────────────────────────

function PrintStyles() {
  return (
    <style>
      {`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .unit-print-area,
          .unit-print-area * {
            visibility: visible !important;
          }

          .unit-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          .no-print {
            display: none !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          th,
          td {
            border: 1px solid #ccc;
            padding: 6px !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}
    </style>
  );
}

// ─────────────────────────────────────────────────────────────
// Print report
// ─────────────────────────────────────────────────────────────

function UnitPrintReport({
  unit,
  isMain,
  computed,
}: {
  unit: DbUnit;
  isMain: boolean;
  computed: {
    strengthCount: number;
    soldiersCount: number;
    ncosCount: number;
    khawarijCount: number;
    khawarijPct: number;
    chartData: BarChartRow[];
    inside: number;
    outside: number;
    sourceUnitsCount: number;
    sourceUnitsDistribution: SourceUnitRow[];
  };
}) {
  const today =
    new Date().toLocaleDateString(
      "ar-EG",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

  return (
    <div
      className="unit-print-area hidden print:block"
      dir="rtl"
    >
      <div className="text-center mb-6">
        <h2
          style={{
            ...F,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          إحصائية الموقف العام - {unit.name}
        </h2>

        <p
          style={{
            ...F,
            fontSize: 14,
            marginTop: 6,
          }}
        >
          تاريخ الطباعة: {today}
        </p>
      </div>

      <table
        className="w-full mb-6"
        style={F}
      >
        <thead>
          <tr>
            <th>البيان</th>
            <th>العدد</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>إجمالي القوة</td>
            <td>
              {computed.strengthCount.toLocaleString(
                "ar-EG"
              )}
            </td>
          </tr>

          <tr>
            <td>إجمالي ضباط الصف</td>
            <td>
              {computed.ncosCount.toLocaleString(
                "ar-EG"
              )}
            </td>
          </tr>

          <tr>
            <td>إجمالي الجنود</td>
            <td>
              {computed.soldiersCount.toLocaleString(
                "ar-EG"
              )}
            </td>
          </tr>

          {isMain ? (
            <tr>
              <td>إجمالي الخوارج</td>
              <td>
                {computed.khawarijCount.toLocaleString(
                  "ar-EG"
                )}
              </td>
            </tr>
          ) : (
            <tr>
              <td>عدد الوحدات المصدر</td>
              <td>
                {computed.sourceUnitsCount.toLocaleString(
                  "ar-EG"
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isMain ? (
        <>
          <table
            className="w-full mb-6"
            style={F}
          >
            <thead>
              <tr>
                <th>الفئة</th>
                <th>داخل الوحدة</th>
                <th>خارج الوحدة (خوارج)</th>
              </tr>
            </thead>

            <tbody>
              {computed.chartData.map(
                (row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>

                    <td>
                      {row.remaining.toLocaleString(
                        "ar-EG"
                      )}
                    </td>

                    <td>
                      {row.outside.toLocaleString(
                        "ar-EG"
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          <p
            style={{
              ...F,
              fontSize: 16,
              textAlign: "center",
              marginTop: 20,
            }}
          >
            نسبة الخوارج:{" "}
            {computed.khawarijPct}% (
            {computed.outside} فرد من إجمالي{" "}
            {computed.strengthCount} فرد)
          </p>
        </>
      ) : (
        <>
          <table
            className="w-full mb-6"
            style={F}
          >
            <thead>
              <tr>
                <th>الوحدة الأصلية</th>
                <th>عدد الأفراد الملحقين</th>
              </tr>
            </thead>

            <tbody>
              {computed.sourceUnitsDistribution
                .length === 0 ? (
                <tr>
                  <td colSpan={2}>
                    لا يوجد أفراد ملحقين بهذه الوحدة
                  </td>
                </tr>
              ) : (
                computed.sourceUnitsDistribution.map(
                  (row) => (
                    <tr key={row.unitName}>
                      <td>{row.unitName}</td>
                      <td>
                        {row.count.toLocaleString(
                          "ar-EG"
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>

          <p
            style={{
              ...F,
              fontSize: 16,
              textAlign: "center",
              marginTop: 20,
            }}
          >
            إجمالي الأفراد الملحقين بالوحدة:{" "}
            {computed.strengthCount} فرد من{" "}
            {computed.sourceUnitsCount} وحدة مصدر
          </p>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function isMainUnitType(
  unitType: string | null
): boolean {
  return (
    unitType?.trim().toUpperCase() ===
    "MAIN"
  );
}

// ترتيب المتطوعين
const VOLUNTEER_RANK_ORDER = [
  "مساعد اول",
  "مساعد",
  "رقيب اول",
  "رقيب",
  "عريف",
];

function getVolunteerRankIndex(
  rankName: string
): number {
  const idx =
    VOLUNTEER_RANK_ORDER.findIndex(
      (r) => rankName.includes(r)
    );

  return idx === -1
    ? VOLUNTEER_RANK_ORDER.length
    : idx;
}

// ─────────────────────────────────────────────────────────────
// Table columns
// ─────────────────────────────────────────────────────────────

function getTableCols(isMain: boolean) {
  return [
    {
      key: "milId",
      label: "رقم عسكري",
    },
    {
      key: "rank",
      label: "درجة",
    },
    {
      key: "name",
      label: "اسم",
    },
    {
      key: "serviceType",
      label: "نوع الخدمه",
    },

    ...(isMain
      ? [
          {
            key: "status",
            label: "حالة التوزيع",
          },
        ]
      : []),

    {
      key: "attachment",
      label: isMain
        ? "مكان الالحاق"
        : "الوحدة الأساسية",
    },

    {
      key: "actions",
      label: "الاجراء",
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export function UnitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [unit, setUnit] =
    useState<DbUnit | null>(null);

  const [unitPersonnel, setUnitPersonnel] =
    useState<DbPersonnelRow[]>([]);

  const [ranks, setRanks] =
    useState<DbRank[]>([]);

  const [categories, setCategories] =
    useState<DbPersonnelCategory[]>([]);

  const [statuses, setStatuses] =
    useState<DbServiceStatus[]>([]);

  const [unitNamesById, setUnitNamesById] =
    useState<Record<string, string>>({});

  const [loading, setLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  // ─────────────────────────────────────
  // Load data
  // ─────────────────────────────────────

  useEffect(() => {
    if (id) {
      loadUnitDetail(id);
    }
  }, [id]);

  async function loadUnitDetail(
    unitId: string
  ) {
    try {
      setLoading(true);
      setNotFound(false);

      const {
        data: unitRow,
        error: unitError,
      } = await supabase
        .from("units")
        .select(
          "id,name,code,unit_type,parent_unit_id,is_active"
        )
        .eq("id", unitId)
        .maybeSingle();

      if (unitError) {
        throw unitError;
      }

      if (!unitRow) {
        setNotFound(true);
        setUnit(null);
        return;
      }

      const main =
        isMainUnitType(
          unitRow.unit_type
        );

      // ⬅️ ملاحظة: نجيب الأفراد بنفس شرط is_active=true كما كان،
      //    لكن التصنيف النهائي لمن يُحسب ضمن "القوة" أو "الخوارج"
      //    بقى بالكامل عبر lib/personnelRules (isCountedInUnitStrength /
      //    isOutsideOwnUnit) بدل الاعتماد فقط على شرط الاستعلام.
      const [
        personnelResult,
        ranksResult,
        categoriesResult,
        statusesResult,
        unitsResult,
      ] = await Promise.all([
        main
          ? supabase
              .from("personnel")
              .select(
                "id,military_number,full_name,rank_id,personnel_category_id,service_status_id,primary_unit_id,attachment_unit_id,is_active,discharge_date"
              )
              .eq(
                "primary_unit_id",
                unitId
              )
              .eq("is_active", true)
          : supabase
              .from("personnel")
              .select(
                "id,military_number,full_name,rank_id,personnel_category_id,service_status_id,primary_unit_id,attachment_unit_id,is_active,discharge_date"
              )
              .eq(
                "attachment_unit_id",
                unitId
              )
              .eq("is_active", true),

        supabase
          .from("ranks")
          .select("id,name,code"),

        supabase
          .from("personnel_categories")
          .select("id,name,code"),

        supabase
          .from("service_statuses")
          .select("id,name,code"),

        supabase
          .from("units")
          .select("id,name"),
      ]);

      if (personnelResult.error) {
        throw personnelResult.error;
      }

      if (ranksResult.error) {
        throw ranksResult.error;
      }

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      if (statusesResult.error) {
        throw statusesResult.error;
      }

      if (unitsResult.error) {
        throw unitsResult.error;
      }

      setUnit(unitRow);

      setUnitPersonnel(
        (personnelResult.data ??
          []) as DbPersonnelRow[]
      );

      setRanks(
        ranksResult.data ?? []
      );

      setCategories(
        categoriesResult.data ?? []
      );

      setStatuses(
        statusesResult.data ?? []
      );

      const namesMap: Record<
        string,
        string
      > = {};

      (
        unitsResult.data ?? []
      ).forEach(
        (u: {
          id: string;
          name: string;
        }) => {
          namesMap[u.id] = u.name;
        }
      );

      setUnitNamesById(namesMap);
    } catch (error: any) {
      console.error(
        "Error loading unit detail:",
        error
      );

      alert(
        `حدث خطأ أثناء تحميل بيانات الوحدة${
          error?.message
            ? `\n\nتفاصيل الخطأ: ${error.message}`
            : ""
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────
  // Maps
  // ─────────────────────────────────────

  const rankById = useMemo(() => {
    const map =
      new Map<string, DbRank>();

    ranks.forEach((r) =>
      map.set(r.id, r)
    );

    return map;
  }, [ranks]);

  const categoryById = useMemo(() => {
    const map = new Map<
      string,
      CategoryLike
    >();

    categories.forEach((c) =>
      map.set(c.id, c)
    );

    return map;
  }, [categories]);

  const statusById = useMemo(() => {
    const map = new Map<
      string,
      StatusLike
    >();

    statuses.forEach((s) =>
      map.set(s.id, s)
    );

    return map;
  }, [statuses]);

  const isMain = isMainUnitType(
    unit?.unit_type ?? null
  );

  // ─────────────────────────────────────
  // الأفراد الذين يُحسبون فعليًا لهذه الصفحة
  // (نفس المجموعة المستخدمة في الإحصائيات وفي الجدول —
  //  حتى لا يختلف عدد صفوف الجدول عن رقم الكارت)
  // ─────────────────────────────────────
  //
  // - للوحدة الرئيسية: من يتحقق فيه isCountedInUnitStrength
  //   (قوة الوحدة أو ملحق + نشط + وحدته الأساسية هي هذه الوحدة)
  // - للوحدة الإدارية: من يتحقق فيه isOutsideOwnUnit
  //   (فعليًا "ملحق" هنا من وحدة أساسية أخرى)
  //
  // ─────────────────────────────────────

  const roster = useMemo<
    DbPersonnelRow[]
  >(() => {
    if (!unit) return [];

    if (isMain) {
      return unitPersonnel.filter((p) =>
        isCountedInUnitStrength(
          p,
          unit.id,
          statusById
        )
      );
    }

    return unitPersonnel.filter((p) =>
      isOutsideOwnUnit(p, statusById)
    );
  }, [
    unit,
    unitPersonnel,
    isMain,
    statusById,
  ]);

  // ─────────────────────────────────────
  // Sorted personnel
  // ─────────────────────────────────────
  //
  // الترتيب:
  // 1. المتطوعون أولاً
  // 2. المتطوعون حسب الرتبة
  // 3. المجندون حسب تاريخ التسريح
  // 4. أي فئات أخرى في النهاية
  //
  // ─────────────────────────────────────

  const sortedPersonnel = useMemo(() => {
    return [...roster].sort(
      (a, b) => {
        const catA =
          categoryById.get(
            a.personnel_category_id ?? ""
          );

        const catB =
          categoryById.get(
            b.personnel_category_id ?? ""
          );

        const aIsVolunteer =
          isVolunteerCategory(catA);

        const bIsVolunteer =
          isVolunteerCategory(catB);

        // المتطوعون أولاً
        if (
          aIsVolunteer &&
          !bIsVolunteer
        ) {
          return -1;
        }

        if (
          !aIsVolunteer &&
          bIsVolunteer
        ) {
          return 1;
        }

        // لو الاتنين متطوعين
        if (
          aIsVolunteer &&
          bIsVolunteer
        ) {
          const rankNameA =
            rankById.get(
              a.rank_id ?? ""
            )?.name ?? "";

          const rankNameB =
            rankById.get(
              b.rank_id ?? ""
            )?.name ?? "";

          const rankIndexA =
            getVolunteerRankIndex(
              rankNameA
            );

          const rankIndexB =
            getVolunteerRankIndex(
              rankNameB
            );

          if (
            rankIndexA !== rankIndexB
          ) {
            return (
              rankIndexA -
              rankIndexB
            );
          }

          return rankNameA.localeCompare(
            rankNameB,
            "ar"
          );
        }

        // المجندون حسب تاريخ التسريح
        const dateA =
          a.discharge_date;

        const dateB =
          b.discharge_date;

        if (!dateA && !dateB) {
          return 0;
        }

        if (!dateA) {
          return 1;
        }

        if (!dateB) {
          return -1;
        }

        return dateA.localeCompare(
          dateB
        );
      }
    );
  }, [
    roster,
    categoryById,
    rankById,
  ]);

  // ─────────────────────────────────────
  // Computed statistics
  // ─────────────────────────────────────
  //
  // ⬅️ كل الأرقام هنا مبنية من roster (نفس المجموعة المعروضة
  //    في الجدول أسفل الصفحة)، وباستخدام نفس دوال lib/personnelRules
  //    المستخدمة في UnitSoldiersPage و UnitBarChart.
  //
  // ─────────────────────────────────────

  const computed = useMemo(() => {
    const strengthCount =
      roster.length;

    const soldiers =
      roster.filter((p) =>
        isConscriptCategory(
          categoryById.get(
            p.personnel_category_id ?? ""
          )
        )
      );

    const ncos =
      roster.filter((p) =>
        isVolunteerCategory(
          categoryById.get(
            p.personnel_category_id ?? ""
          )
        )
      );

    // الخوارج (للوحدة الرئيسية فقط):
    // جزء من roster نفسه (لأن roster هنا = القوة كاملة)
    const khawarijList = isMain
      ? roster.filter((p) =>
          isOutsideOwnUnit(
            p,
            statusById
          )
        )
      : [];

    const soldiersKhawarijCount =
      isMain
        ? soldiers.filter((p) =>
            isOutsideOwnUnit(
              p,
              statusById
            )
          ).length
        : 0;

    const ncosKhawarijCount =
      isMain
        ? ncos.filter((p) =>
            isOutsideOwnUnit(
              p,
              statusById
            )
          ).length
        : 0;

    const khawarijCount =
      khawarijList.length;

    const khawarijPct =
      isMain &&
      strengthCount > 0
        ? Math.round(
            (khawarijCount /
              strengthCount) *
              100
          )
        : 0;

    const chartData: BarChartRow[] = [
      {
        label: "اجمالي ضباط الصف",
        outside:
          ncosKhawarijCount,
        remaining: Math.max(
          0,
          ncos.length -
            ncosKhawarijCount
        ),
      },

      {
        label: "اجمالي الجنود",
        outside:
          soldiersKhawarijCount,
        remaining: Math.max(
          0,
          soldiers.length -
            soldiersKhawarijCount
        ),
      },

      {
        label: "اجمالي القوة",
        outside:
          khawarijCount,
        remaining: Math.max(
          0,
          strengthCount -
            khawarijCount
        ),
      },
    ];

    // توزيع الأفراد حسب الوحدة الأصلية
    // (roster هنا للوحدة الإدارية = فقط من تحقق فيهم isOutsideOwnUnit)
    const sourceUnitsCountMap =
      new Map<string, number>();

    if (!isMain) {
      roster.forEach((p) => {
        const sourceUnitId =
          p.primary_unit_id;

        const sourceUnitName =
          sourceUnitId
            ? unitNamesById[
                sourceUnitId
              ] ?? "غير محدد"
            : "غير محدد";

        sourceUnitsCountMap.set(
          sourceUnitName,
          (sourceUnitsCountMap.get(
            sourceUnitName
          ) ?? 0) + 1
        );
      });
    }

    const sourceUnitsDistribution =
      Array.from(
        sourceUnitsCountMap.entries()
      )
        .map(
          ([
            unitName,
            count,
          ]) => ({
            unitName,
            count,
          })
        )
        .sort(
          (a, b) =>
            b.count - a.count
        );

    return {
      strengthCount,

      soldiersCount:
        soldiers.length,

      ncosCount:
        ncos.length,

      khawarijCount,

      soldiersKhawarijCount,

      ncosKhawarijCount,

      khawarijPct,

      chartData,

      inside:
        Math.max(
          0,
          strengthCount -
            khawarijCount
        ),

      outside:
        khawarijCount,

      sourceUnitsCount:
        sourceUnitsCountMap.size,

      sourceUnitsDistribution,
    };
  }, [
    roster,
    categoryById,
    statusById,
    isMain,
    unitNamesById,
  ]);

  // ─────────────────────────────────────
  // Print
  // ─────────────────────────────────────

  function handlePrintUnitStats() {
    if (!unit) return;

    const originalTitle =
      document.title;

    document.title =
      `احصائيه الموقف العام ${unit.name}`;

    window.print();

    document.title =
      originalTitle;
  }

  // ─────────────────────────────────────
  // Loading
  // ─────────────────────────────────────

  if (loading) {
    return (
      <div
        dir="rtl"
        className="w-full flex items-center justify-center py-20"
      >
        <p
          style={{
            ...F,
            fontSize: 18,
            color: "#415844",
          }}
        >
          جاري تحميل البيانات...
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────
  // Not found
  // ─────────────────────────────────────

  if (notFound || !unit) {
    return (
      <div
        dir="rtl"
        className="w-full flex flex-col items-center justify-center gap-4 py-20"
      >
        <p
          style={{
            ...F,
            fontSize: 18,
            color: "#2d3648",
          }}
        >
          لم يتم العثور على هذه الوحدة
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/dashboard/units-report"
            )
          }
          className="h-[40px] px-5 rounded-[8px] bg-[#DCF4DF]"
        >
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#2d3648",
            }}
          >
            العودة لقائمة الوحدات
          </span>
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────
  // Table columns
  // ─────────────────────────────────────

  const tableCols =
    getTableCols(isMain);

  // ─────────────────────────────────────
  // Stats cards
  // ─────────────────────────────────────

  const STATS = isMain
    ? [
        {
          label: "اجمالي القوة",
          value:
            computed.strengthCount.toLocaleString(
              "ar-EG"
            ),
          icon: <IconGroup />,
        },

        {
          label: "اجمالي ضباط الصف",
          value:
            computed.ncosCount.toLocaleString(
              "ar-EG"
            ),
          icon: <IconNCO />,
        },

        {
          label: "اجمالي الجنود",
          value:
            computed.soldiersCount.toLocaleString(
              "ar-EG"
            ),
          icon: <IconSoldiers />,
        },
      ]
    : [
        {
          label: "اجمالي القوة",
          value:
            computed.strengthCount.toLocaleString(
              "ar-EG"
            ),
          icon: <IconGroup />,
        },

        {
          label: "اجمالي ضباط الصف",
          value:
            computed.ncosCount.toLocaleString(
              "ar-EG"
            ),
          icon: <IconNCO />,
        },

        {
          label: "اجمالي الجنود",
          value:
            computed.soldiersCount.toLocaleString(
              "ar-EG"
            ),
          icon: <IconSoldiers />,
        },

        {
          label: "عدد الوحدات المصدر",
          value:
            computed.sourceUnitsCount.toLocaleString(
              "ar-EG"
            ),
          icon: (
            <Building2
              size={24}
              className="text-[#00522E]"
              strokeWidth={2}
            />
          ),
        },
      ];
  const KHAWARIJ_STATS = isMain
    ? [
        {
          label: "اجمالي الخوارج",
          value:
            computed.khawarijCount.toLocaleString(
              "ar-EG"
            ),
          icon: <IconKhawarij />,
        },

        {
          label: "اجمالي خوارج المتطوعين",
          value:
            computed.ncosKhawarijCount.toLocaleString(
              "ar-EG"
            ),
          icon: <IconKhawarij />,
        },

        {
          label: "اجمالي خوارج الجنود",
          value:
            computed.soldiersKhawarijCount.toLocaleString(
              "ar-EG"
            ),
          icon: <IconKhawarij />,
        },
      ]
    : [];
  // ─────────────────────────────────────
  // Render
  // ─────────────────────────────────────

  return (
    <div
      className="flex flex-col gap-5 w-full"
      dir="rtl"
    >
      <PrintStyles />

      <UnitPrintReport
        unit={unit}
        isMain={isMain}
        computed={computed}
      />

      {/* Page title */}
      <h1
        className="text-center w-full"
        style={{
          ...F,
          fontWeight: 700,
          fontSize:
            "clamp(20px,3.5vw,30px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        الموقف العام {unit.name}
      </h1>

      {/* Stats */}
      <section className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between w-full">
          <h2
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 24,
              color: "#2d3648",
            }}
          >
            إحصائيات الوحدة
          </h2>

          <button
            type="button"
            onClick={
              handlePrintUnitStats
            }
            className="flex items-center gap-1.5 bg-[#DCF4DF] rounded-[8px] px-3 py-2 hover:opacity-80 transition-opacity no-print"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 13.3333 13.3333"
              fill="none"
            >
              <path
                clipRule="evenodd"
                d={svgPaths.pfd2e80}
                fill="#2D3648"
                fillRule="evenodd"
              />
            </svg>

            <span
              style={{
                ...F,
                fontSize: 14,
                color: "#2d3648",
                whiteSpace: "nowrap",
              }}
            >
              طباعة احصائية الوحده
            </span>
          </button>
        </div>

             <div className="flex flex-wrap gap-4 w-full">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex-1 min-w-[120px] bg-white rounded-[16px] border border-[#eff0f6] px-6 py-4 flex items-center gap-3 justify-between"
            >
              <div className="flex flex-col items-start gap-2">
                <span
                  style={{
                    ...F,
                    fontWeight: 700,
                    fontSize: 24,
                    color: "#2d3648",
                    lineHeight: 1.5,
                  }}
                >
                  {s.value}
                </span>

                <span
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#717d96",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {s.label}
                </span>
              </div>

              <div className="flex items-center justify-center shrink-0">
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {isMain && (
          <div className="flex flex-wrap gap-4 w-full">
            {KHAWARIJ_STATS.map((s) => (
              <div
                key={s.label}
                className="flex-1 min-w-[120px] bg-white rounded-[16px] border border-[#eff0f6] px-6 py-4 flex items-center gap-3 justify-between"
              >
                <div className="flex flex-col items-start gap-2">
                  <span
                    style={{
                      ...F,
                      fontWeight: 700,
                      fontSize: 24,
                      color: "#2d3648",
                      lineHeight: 1.5,
                    }}
                  >
                    {s.value}
                  </span>

                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#717d96",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {s.label}
                  </span>
                </div>

                <div className="flex items-center justify-center shrink-0">
                  {s.icon}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Charts */}
      <section className="flex flex-wrap gap-4 w-full items-stretch">
        {isMain ? (
          <>
            <div className="flex-1 min-w-[300px] bg-white rounded-[12px] border border-[#eff0f6] p-6">
              <UnitBarChart
                data={
                  computed.chartData
                }
              />
            </div>

            <div className="bg-white rounded-[12px] border border-[#eff0f6] p-5 w-[220px] min-w-[200px] flex items-center justify-center">
              <DonutChartPanel
                pct={
                  computed.khawarijPct
                }
                inside={
                  computed.inside
                }
                outside={
                  computed.outside
                }
              />
            </div>
          </>
        ) : (
          <div className="flex-1 min-w-[300px] bg-white rounded-[12px] border border-[#eff0f6] p-6">
            <SourceUnitsPanel
              distribution={
                computed.sourceUnitsDistribution
              }
              totalCount={
                computed.strengthCount
              }
            />
          </div>
        )}
      </section>

      {/* Personnel table */}
      <section className="bg-white rounded-[12px] border border-[#eff0f6] w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eff0f6]">
          <h3
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 24,
              color: "#2d3648",
            }}
          >
            افراد الوحده
          </h3>

          <button
            type="button"
            className="hover:opacity-80 transition-opacity"
            onClick={() =>
              navigate(
                `/dashboard/units-report/${unit.id}/soldiers`
              )
            }
          >
            <span
              style={{
                ...F,
                fontWeight: 700,
                fontSize: 18,
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
                WebkitBackgroundClip:
                  "text",
                WebkitTextFillColor:
                  "transparent",
              }}
            >
              عرض الجميع
            </span>
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table
            className="w-full min-w-[720px]"
            dir="rtl"
          >
            <thead>
              <tr className="bg-white border-b border-[#d4d8fa]">
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[#d4d8fa] cursor-pointer"
                    readOnly
                  />
                </th>

                {tableCols.map(
                  (c) => (
                    <th
                      key={c.key}
                      className="px-4 py-3 text-right whitespace-nowrap"
                    >
                      <div className="flex items-start gap-1 justify-start">
                        <span
                          style={{
                            ...F,
                            fontWeight: 700,
                            fontSize: 12,
                            color:
                              "#717d96",
                          }}
                        >
                          {c.label}
                        </span>

                        <svg
                          className="shrink-0"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d={
                              svgPaths.p14089660
                            }
                            stroke="#A0ABC0"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.33"
                          />
                        </svg>
                      </div>
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {sortedPersonnel.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      tableCols.length + 1
                    }
                    className="text-center py-10"
                    style={{
                      ...F,
                      fontSize: 14,
                      color:
                        "#717d96",
                    }}
                  >
                    لا يوجد أفراد بهذه الوحدة
                  </td>
                </tr>
              ) : (
                sortedPersonnel.map(
                  (row, idx) => {
                    const rank =
                      rankById.get(
                        row.rank_id ??
                          ""
                      );

                    const category =
                      categoryById.get(
                        row.personnel_category_id ??
                          ""
                      );

                    const status =
                      statusById.get(
                        row.service_status_id ??
                          ""
                      );

                    // مهم:
                    // مكان الإلحاق للوحدة الرئيسية
                    // والوحدة الأساسية للوحدة الإدارية
                    const attachmentName =
                      isMain
                        ? row.attachment_unit_id
                          ? unitNamesById[
                              row
                                .attachment_unit_id
                            ] ??
                            "—"
                          : "لا يوجد"
                        : row.primary_unit_id
                        ? unitNamesById[
                            row
                              .primary_unit_id
                          ] ??
                          "—"
                        : "—";

                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-[#eaecf0] ${
                          idx % 2 === 0
                            ? "bg-white"
                            : "bg-[#fafbff]"
                        } hover:bg-[#f5f6fb] transition-colors`}
                      >
                        {/* Checkbox */}
                        <td className="w-10 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-[#d4d8fa] cursor-pointer"
                            readOnly
                          />
                        </td>

                        {/* Military number */}
                        <td className="px-4 py-3">
                          <span
                            style={{
                              ...F,
                              fontSize: 14,
                              color:
                                "#2d3648",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              row.military_number
                            }
                          </span>
                        </td>

                        {/* Rank */}
                        <td className="px-4 py-3">
                          <span
                            style={{
                              ...F,
                              fontSize: 14,
                              color:
                                "#2d3648",
                            }}
                          >
                            {rank?.name ??
                              "—"}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="px-4 py-3">
                          <span
                            style={{
                              ...F,
                              fontSize: 14,
                              color:
                                "#2d3648",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {row.full_name}
                          </span>
                        </td>

                        {/* Service type */}
                        <td className="px-4 py-3">
                          <span
                            style={{
                              ...F,
                              fontSize: 14,
                              color:
                                "#2d3648",
                            }}
                          >
                            {category?.name ??
                              "—"}
                          </span>
                        </td>

                        {/* Status - main unit only */}
                        {isMain && (
                          <td className="px-4 py-3">
                            <StatusBadge
                              status={
                                status
                              }
                            />
                          </td>
                        )}

                        {/* Attachment / primary unit */}
                        <td className="px-4 py-3">
                          <span
                            style={{
                              ...F,
                              fontSize: 14,
                              color:
                                "#2d3648",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              attachmentName
                            }
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <ActionBtns
                            onView={() =>
                              navigate(
                                `/dashboard/individual-query/soldier/${row.id}`
                              )
                            }
                          />
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default UnitDetailPage;