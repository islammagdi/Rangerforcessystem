import React from "react";

interface ProgressCardProps {
  icon: React.ReactNode;
  /** Primary value (e.g. "38") */
  value: string;
  /** Optional sub-value text (e.g. "من 120") */
  subValue?: string;
  label: string;
  /** 0–100 percentage for the progress bar */
  percentage: number;
  percentLabel?: string;
}

/**
 * Stat card that includes a progress bar at the bottom.
 */
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
    <div className="bg-white flex-1 rounded-[20px] border border-[#eff0f6] flex flex-col justify-center px-6 py-4 gap-3 min-w-0 transition-shadow hover:shadow-sm">
      {/* Top row: icon + value + label */}
      <div className="flex items-center justify-between gap-3">
        <div className="shrink-0 w-[30px] h-[30px] flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 flex flex-col gap-1 items-end text-right">
          <div className="leading-tight">
            <span
              style={{ color: "#2d3648", fontFamily: "'Almarai', sans-serif", fontWeight: 700, fontSize: "24px" }}
            >
              {value}
            </span>
            {subValue && (
              <span
                className="ms-1"
                style={{ color: "#717d96", fontFamily: "'Almarai', sans-serif", fontWeight: 700, fontSize: "18px" }}
              >
                {subValue}
              </span>
            )}
          </div>
          <span
            className="whitespace-nowrap"
            style={{ color: "#717d96", fontFamily: "'Almarai', sans-serif", fontWeight: 400, fontSize: "14px" }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1">
        {percentLabel && (
          <span
            style={{ color: "#717d96", fontFamily: "'Almarai', sans-serif", fontWeight: 700, fontSize: "12px" }}
          >
            {percentLabel}
          </span>
        )}
        <div className="w-full h-[15px] bg-[#f5f5f5] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${clampedPct}%`,
              background: "linear-gradient(to bottom, #00b867, #00522e)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
