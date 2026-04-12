import { ChevronDown } from "lucide-react";
import imgAvatar from "figma:asset/8b9f86452ff0e90495bf9daf1494dd6920ad538a.png";

interface DashboardHeaderProps {
  pageTitle?: string;
}

export function DashboardHeader({
  pageTitle = "الموقف العام",
}: DashboardHeaderProps) {
  return (
    <header className="bg-white h-[100px] w-full border-b border-[#eff0f6] flex items-center justify-between px-7 shrink-0">
      {/* Right: Page title */}
      <div className="flex items-center">
        <span
          style={{
            color: "#2d3648",
            fontFamily: "'Almarai', sans-serif",
            fontSize: "18px",
          }}
        >
          {pageTitle}
        </span>
      </div>

      {/* Left: User info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <ChevronDown size={18} className="text-[#081021]" />

          <div className="flex flex-col items-end gap-0.5">
            <span
              style={{
                color: "#64748b",
                fontFamily: "'Almarai', sans-serif",
                fontSize: "12px",
              }}
            >
              مرحبا بك
            </span>
            <span
              style={{
                color: "#081021",
                fontFamily: "'Almarai', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              جندي / اسلام مجدي
            </span>
          </div>
        </div>

        {/* Avatar */}
        <div className="bg-[#ffb31f] w-10 h-10 rounded-full overflow-hidden relative shrink-0">
          <img
            src={imgAvatar}
            alt="اسلام مجدي"
            className="absolute object-contain pointer-events-none"
            style={{
              inset: "-35% -40% -45% -40%",
              width: "180%",
              height: "180%",
            }}
          />
        </div>
      </div>
    </header>
  );
}