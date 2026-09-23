import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  valueColor?: string;
}

/**
 * Reusable stat/metric card with an icon and value+label.
 */
export function StatCard({
  icon,
  value,
  label,
  valueColor = "#2d3648",
}: StatCardProps) {
  return (
    <div className="bg-white flex-1 min-w-[160px] sm:min-w-[200px] rounded-[20px] border border-[#eff0f6] flex flex-row-reverse items-center gap-3 px-4 sm:px-6 py-4 transition-shadow hover:shadow-sm">
      {/* Icon */}
      <div className="shrink-0 w-[26px] h-[26px] sm:w-[30px] sm:h-[30px] flex items-center justify-center">
        {icon}
      </div>
      {/* Text - RTL aligned */}
      <div className="flex-1 flex flex-col gap-1.5 sm:gap-2 items-start text-right min-w-0">
        <span
          className="leading-tight"
          style={{
            color: valueColor,
            fontFamily: "'Almarai', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
          }}
        >
          {value}
        </span>
        <span
          className="whitespace-nowrap"
          style={{
            color: "#717d96",
            fontFamily: "'Almarai', sans-serif",
            fontWeight: 400,
            fontSize: "13px",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}