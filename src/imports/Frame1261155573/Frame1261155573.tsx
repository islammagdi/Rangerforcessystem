import svgPaths from "./svg-oxkvn7pewu";

function Group() {
  return (
    <div className="absolute inset-[3.77%_0]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 36.9813">
        <g id="Group">
          <path d={svgPaths.p34af000} fill="url(#paint0_linear_48_5512)" id="Vector" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_48_5512" x1="20" x2="20" y1="0" y2="36.9813">
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
    <div className="overflow-clip relative shrink-0 size-[40px]" data-name="Frame">
      <Group />
    </div>
  );
}

function Title() {
  return (
    <div className="relative shrink-0 w-full" data-name="Title">
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-center px-[30px] relative w-full">
          <Frame />
          <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#122b16] text-[18px] text-center whitespace-nowrap" dir="auto">
            ترحيل دفعة
          </p>
          <p className="font-['Almarai:Bold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#404040] text-[14px] text-center whitespace-nowrap" dir="auto">
            يرجي اختيار دفعة الترحيل الجديدة للافراد
          </p>
        </div>
      </div>
    </div>
  );
}

function LeftContent() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Left Content">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Arrow / Chevron_Down">
        <div className="absolute inset-[33.33%_16.67%_29.17%_16.67%]" data-name="Vector (Stroke)">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 9">
            <path clipRule="evenodd" d={svgPaths.p1cca4380} fill="var(--fill-0, #2D3648)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] min-h-[30px] min-w-px not-italic relative text-[#4a5468] text-[18px] text-right">
        <p className="leading-[1.5]">2-2026</p>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#e2e7f0] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center p-[12px] relative w-full">
          <LeftContent />
        </div>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] h-[54px] items-start relative shrink-0 w-full">
      <Input />
    </div>
  );
}

function LeftIcon() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Left Icon">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f5f5f5] text-[16px] text-right whitespace-nowrap">
        <p className="leading-[1.5]">ترحيل الافراد</p>
      </div>
    </div>
  );
}

export default function Frame1() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[24px] items-center overflow-clip p-[24px] relative rounded-[24px] size-full">
      <Title />
      <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Text Field Input Opition">
        <Frame2 />
      </div>
      <div className="bg-gradient-to-b from-[#00b867] min-h-[52px] relative rounded-[8px] shrink-0 to-[#00522e] w-full" data-name="Buttons">
        <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
          <div className="content-stretch flex gap-[4px] items-center justify-center min-h-[inherit] px-[20px] py-[12px] relative w-full">
            <LeftIcon />
          </div>
        </div>
      </div>
    </div>
  );
}