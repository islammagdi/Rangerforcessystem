import svgPaths from "../../imports/تسجيلالدخول/svg-9l9hko8aij";

/**
 * A single diagonal checkmark / arrow decorative shape.
 */
function CheckShape({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <svg fill="none" viewBox="0 0 138.649 64.2332" className="w-full h-full">
        <path d={svgPaths.p16d61980} fill="#6E6CDF" />
      </svg>
    </div>
  );
}

/**
 * A circular ring ornament.
 */
function CircleShape({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <svg fill="none" viewBox="0 0 56.8888 346.259" className="w-full h-full">
        <path d={svgPaths.p19e19e80} fill="#6E6CDF" stroke="#6E6CDF" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

/**
 * Decorative cross / plus ornament.
 */
function CrossShape({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <svg fill="none" viewBox="0 0 50.8288 23.5468" className="w-full h-full">
        <path d={svgPaths.p1547a280} fill="#6E6CDF" />
      </svg>
    </div>
  );
}

/**
 * Full-page decorative background with scattered geometric shapes at very low opacity.
 * These shapes are purely visual and marked aria-hidden.
 */
export function BackgroundPattern() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      {/* Top-left region */}
      <CheckShape className="absolute top-[5%] left-[2%] w-[100px] opacity-[0.06] rotate-[-15deg]" />
      <CrossShape className="absolute top-[12%] left-[18%] w-[40px] opacity-[0.07] rotate-12" />
      <CircleShape className="absolute top-[3%] left-[6%] w-[40px] opacity-[0.05] rotate-[30deg]" />

      {/* Top-right region */}
      <CheckShape className="absolute top-[4%] right-[2%] w-[90px] opacity-[0.06] rotate-[10deg]" />
      <CrossShape className="absolute top-[18%] right-[15%] w-[38px] opacity-[0.07] -rotate-12" />
      <CircleShape className="absolute top-[8%] right-[20%] w-[36px] opacity-[0.05] -rotate-[20deg]" />

      {/* Mid-left */}
      <CheckShape className="absolute top-[40%] left-[1%] w-[80px] opacity-[0.05] rotate-[-8deg]" />
      <CrossShape className="absolute top-[55%] left-[12%] w-[36px] opacity-[0.06] rotate-[5deg]" />

      {/* Mid-right */}
      <CheckShape className="absolute top-[35%] right-[0%] w-[85px] opacity-[0.05] rotate-[8deg]" />
      <CrossShape className="absolute top-[50%] right-[10%] w-[34px] opacity-[0.06] -rotate-[5deg]" />

      {/* Bottom-left */}
      <CheckShape className="absolute bottom-[8%] left-[3%] w-[95px] opacity-[0.06] rotate-[-12deg]" />
      <CircleShape className="absolute bottom-[15%] left-[14%] w-[38px] opacity-[0.05] rotate-[15deg]" />
      <CrossShape className="absolute bottom-[3%] left-[25%] w-[40px] opacity-[0.06] rotate-[20deg]" />

      {/* Bottom-right */}
      <CheckShape className="absolute bottom-[6%] right-[2%] w-[90px] opacity-[0.06] rotate-[14deg]" />
      <CircleShape className="absolute bottom-[12%] right-[18%] w-[36px] opacity-[0.05] -rotate-[10deg]" />
      <CrossShape className="absolute bottom-[2%] right-[28%] w-[42px] opacity-[0.06] -rotate-[18deg]" />

      {/* Centre top */}
      <CheckShape className="absolute top-[2%] left-[45%] w-[88px] opacity-[0.04] rotate-[6deg]" />
      {/* Centre bottom */}
      <CheckShape className="absolute bottom-[4%] left-[42%] w-[80px] opacity-[0.04] rotate-[-6deg]" />

      {/* Large faint circle — upper-left */}
      <div className="absolute -top-[10%] -left-[8%] w-[320px] h-[320px] rounded-full border border-[#6E6CDF]/10" />
      {/* Large faint circle — lower-right */}
      <div className="absolute -bottom-[8%] -right-[5%] w-[280px] h-[280px] rounded-full border border-[#6E6CDF]/10" />
    </div>
  );
}
