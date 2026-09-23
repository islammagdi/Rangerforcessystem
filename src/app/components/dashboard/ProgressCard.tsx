import React from "react";

interface ProgressCardProps {
  icon: React.ReactNode;
  value: React.ReactNode;
  subValue?: string;
  label: string;
  percentage: number;
  percentLabel?: string;
}

export function ProgressCard({
  icon,
  value,
  subValue,
  label,
  percentage,
  percentLabel,
}: ProgressCardProps) {
  const clampedPct = Math.min(100, Math.max(0, percentage));

  return (
    <div
      dir="rtl"
      className="bg-white flex-1 min-w-[220px] sm:min-w-[240px] rounded-[20px] border border-[#eff0f6] flex flex-col justify-center px-4 sm:px-6 py-4 gap-3 transition-shadow hover:shadow-sm"
    >
      {/* Top row: icon + value + label */}
      <div className="flex items-start gap-3">

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="leading-tight flex flex-wrap items-baseline gap-x-1">
            <span
              style={{
                color: "#2d3648",
                fontFamily: "'Almarai', sans-serif",
                fontWeight: 700,
                fontSize: "20px",
              }}
            >
              {value}
            </span>
            {subValue && (
              <span
                style={{
                  color: "#717d96",
                  fontFamily: "'Almarai', sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                }}
              >
                {subValue}
              </span>
            )}
          </div>
          <span
            className="w-full break-words"
            style={{
              color: "#717d96",
              fontFamily: "'Almarai', sans-serif",
              fontWeight: 400,
              fontSize: "13px",
              lineHeight: 1.4,
            }}
          >
            {label}
          </span>
        </div>
                <div className="shrink-0 w-[26px] h-[26px] sm:w-[30px] sm:h-[30px] flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}