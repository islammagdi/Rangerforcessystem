import svgPaths from "./svg-bqmzp0irjj";

function Group() {
  return (
    <div className="absolute inset-[3.13%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 90 90">
        <g id="Group">
          <path d={svgPaths.p1bae7800} fill="url(#paint0_linear_41_8630)" id="Vector" />
          <path d={svgPaths.p37dfa000} fill="var(--fill-0, #FFFCEE)" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_41_8630" x1="45" x2="45" y1="0" y2="90">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Frame() {
  return (
    <div className="overflow-clip relative shrink-0 size-[96px]" data-name="Frame">
      <Group />
    </div>
  );
}

export default function Frame1() {
  return (
    <div className="bg-white content-stretch flex flex-col items-center justify-center overflow-clip py-[77px] relative rounded-[24px] size-full">
      <Frame />
      <div className="h-[144px] relative shrink-0 w-full" data-name="Title">
        <div className="flex flex-col items-center size-full">
          <div className="content-stretch flex flex-col font-['Almarai:Bold',sans-serif] gap-[16px] items-center not-italic p-[30px] relative size-full text-center whitespace-nowrap">
            <p className="leading-[1.2] relative shrink-0 text-[#122b16] text-[36px]" dir="auto">
              عملية ناجحة!
            </p>
            <p className="leading-[1.5] relative shrink-0 text-[#404040] text-[24px]" dir="auto">
              تمت طباعة الجواب بنجاح, جاري توجهيك للصفحة الرئيسية
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}