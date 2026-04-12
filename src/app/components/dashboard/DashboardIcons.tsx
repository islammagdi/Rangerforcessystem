import svgPaths from "../../../imports/الموقفالعام/svg-mvyseyn5e6";

/** Green gradient definition (shared) */
function GreenGrad({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="#00B867" />
        <stop offset="1" stopColor="#00522E" />
      </linearGradient>
    </defs>
  );
}

/** Rank/sergeant icon (ضباط الصف) */
export function RankIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 23.1075" fill="none">
      <GreenGrad id="rg1" />
      <path d={svgPaths.p8118600} fill="url(#rg1)" />
      <path d={svgPaths.p14328e00} fill="url(#rg1)" />
    </svg>
  );
}

/** Soldiers / group people icon */
export function SoldiersIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <GreenGrad id="sg1" />
      <path clipRule="evenodd" d={svgPaths.p1528f680} fill="url(#sg1)" fillRule="evenodd" />
      <path clipRule="evenodd" d={svgPaths.p1681e00} fill="url(#sg1)" fillRule="evenodd" />
    </svg>
  );
}

/** Multiple people icon (القوة الفعلية / اجمالي الخوارج) */
export function PeopleIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 22.5" fill="none">
      <GreenGrad id="pg1" />
      <path d={svgPaths.p24391d00} fill="url(#pg1)" />
      <path d={svgPaths.p2f932980} fill="url(#pg1)" />
      <path d={svgPaths.p3a06cf00} fill="url(#pg1)" />
      <path d={svgPaths.p23b55080} fill="url(#pg1)" />
      <path d={svgPaths.p4eff300} fill="url(#pg1)" />
      <path d={svgPaths.p32f2a500} fill="url(#pg1)" />
    </svg>
  );
}

/** Calendar icon (تاريخ الدفعة) */
export function CalendarIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 26.25 27.1877" fill="none">
      <GreenGrad id="cg1" />
      <path d={svgPaths.pd6f5300} fill="url(#cg1)" />
      <path d={svgPaths.p3f12080} fill="url(#cg1)" />
    </svg>
  );
}

/** ID/Card icon */
export function IdCardIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 19.8633" fill="none">
      <GreenGrad id="idg1" />
      <path d={svgPaths.p38fa9980} fill="url(#idg1)" />
      <path d={svgPaths.p38e29900} fill="url(#idg1)" />
    </svg>
  );
}

/** Person check / identity icon */
export function PersonCheckIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 22.5" fill="none">
      <GreenGrad id="pcg1" />
      <path d={svgPaths.p24800200} fill="url(#pcg1)" />
    </svg>
  );
}
