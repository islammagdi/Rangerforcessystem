import svgPaths from "./svg-9koojzzj35";
import imgBigShoesAvatar from "./8b9f86452ff0e90495bf9daf1494dd6920ad538a.png";

function TextGroup() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-h-px min-w-px not-italic relative text-right" data-name="Text group">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#64748b] text-[12px] w-full" dir="auto">
        مرحبا بك
      </p>
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.4] relative shrink-0 text-[#081021] text-[14px] w-full" dir="auto">
        جندي / اسلام مجدي
      </p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[10px] items-end relative shrink-0 w-[148px]">
      <div className="flex items-center justify-center relative shrink-0 size-[20px]" style={{ "--transform-inner-width": "1185", "--transform-inner-height": "22" } as React.CSSProperties}>
        <div className="-scale-y-100 flex-none rotate-90">
          <div className="overflow-clip relative size-[20px]" data-name="Caret">
            <div className="absolute bottom-1/4 left-[35%] right-[35%] top-1/4" data-name="Icon">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 10">
                <path clipRule="evenodd" d={svgPaths.p28321340} fill="var(--fill-0, #081021)" fillRule="evenodd" id="Icon" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <TextGroup />
    </div>
  );
}

function Avatar1() {
  return (
    <div className="bg-[#ffb31f] overflow-clip relative rounded-[99px] shrink-0 size-[40px]" data-name="Avatar">
      <div className="absolute inset-[-35%_-40%_-45%_-40%]" data-name="Big Shoes Avatar">
        <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" src={imgBigShoesAvatar} />
      </div>
    </div>
  );
}

function Inner() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Inner">
      <Frame8 />
      <Avatar1 />
    </div>
  );
}

function Avatar() {
  return (
    <div className="content-stretch flex items-center py-[24px] relative shrink-0" data-name="Avatar">
      <Inner />
    </div>
  );
}

function IconBreadcrumb() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Icon-Breadcrumb">
      <div className="content-center flex flex-wrap gap-y-[8px] items-center relative rounded-[8px] shrink-0" data-name="Breadcrumb">
        <div className="content-stretch flex items-center justify-center min-h-[24px] min-w-[24px] px-[12px] py-[4px] relative rounded-[12px] shrink-0" data-name="1">
          <div className="content-stretch flex flex-col items-start justify-center relative rounded-[12px] shrink-0 w-[38px]" data-name="Text">
            <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#2d3648] text-[18px] text-center w-full">
              <p className="leading-[1.5]">دفعات الرديف</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="bg-white h-[100px] relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[28px] py-[20px] relative size-full">
          <Avatar />
          <IconBreadcrumb />
        </div>
      </div>
    </div>
  );
}

function LeftIcon() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Left Icon">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f5f5f5] text-[16px] text-right whitespace-nowrap">
        <p className="leading-[1.5]">عرض الافراد</p>
      </div>
    </div>
  );
}

function Label() {
  return (
    <div className="relative shrink-0 w-full" data-name="Label">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[4px] relative w-full">
          <div className="flex flex-[1_0_0] flex-col font-['Almarai:Bold',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#2d3648] text-[16px] text-right">
            <p className="leading-[1.5]">اختر تاريخ التسريح</p>
          </div>
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

function Frame26() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] h-[54px] items-start relative shrink-0 w-full">
      <Input />
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex gap-[24px] items-end justify-end relative shrink-0 w-[1112px]">
      <div className="bg-gradient-to-b content-stretch flex from-[#00b867] gap-[4px] h-[54px] items-center justify-center min-h-[52px] px-[20px] py-[12px] relative rounded-[8px] shrink-0 to-[#00522e] w-[150px]" data-name="Buttons">
        <LeftIcon />
      </div>
      <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-[450px]" data-name="Text Field Input Opition">
        <Label />
        <Frame26 />
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[12.5%_0]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 22.5">
        <g id="Group">
          <path d={svgPaths.p24391d00} fill="url(#paint0_linear_48_5323)" id="Vector" />
          <path d={svgPaths.p2f932980} fill="url(#paint1_linear_48_5323)" id="Vector_2" />
          <path d={svgPaths.p3a06cf00} fill="url(#paint2_linear_48_5323)" id="Vector_3" />
          <path d={svgPaths.p23b55080} fill="url(#paint3_linear_48_5323)" id="Vector_4" />
          <path d={svgPaths.p4eff300} fill="url(#paint4_linear_48_5323)" id="Vector_5" />
          <path d={svgPaths.p32f2a500} fill="url(#paint5_linear_48_5323)" id="Vector_6" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_48_5323" x1="5" x2="5" y1="0" y2="7.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_48_5323" x1="4.55625" x2="4.55625" y1="8.75" y2="17.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint2_linear_48_5323" x1="25" x2="25" y1="0" y2="7.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint3_linear_48_5323" x1="25.4437" x2="25.4437" y1="8.75" y2="17.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint4_linear_48_5323" x1="15" x2="15" y1="0" y2="10">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint5_linear_48_5323" x1="15" x2="15" y1="11.25" y2="22.5">
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
    <div className="overflow-clip relative shrink-0 size-[30px]" data-name="Frame">
      <Group />
    </div>
  );
}

function SmallGraph() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-end leading-[0] min-h-px min-w-px not-italic relative text-right" data-name="Small Graph">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center min-w-full relative shrink-0 text-[#2d3648] text-[24px] w-[min-content]">
        <p className="leading-[1.5]">1,850</p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] w-[116px]">
        <p className="leading-[1.4]" dir="auto">
          عدد الجنود المسرحين
        </p>
      </div>
    </div>
  );
}

function Frame13() {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[20px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-end px-[24px] py-[16px] relative size-full">
          <Frame />
          <SmallGraph />
        </div>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[9.38%_6.25%_0_6.25%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26.25 27.1877">
        <g id="Group">
          <path d={svgPaths.pd6f5300} fill="url(#paint0_linear_48_5310)" id="Vector" />
          <path d={svgPaths.p3f12080} fill="url(#paint1_linear_48_5310)" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_48_5310" x1="13.125" x2="13.125" y1="0.937346" y2="27.1877">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_48_5310" x1="13.125" x2="13.125" y1="0" y2="3.75">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Frame1() {
  return (
    <div className="overflow-clip relative shrink-0 size-[30px]" data-name="Frame">
      <Group1 />
    </div>
  );
}

function SmallGraph1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-end leading-[0] min-h-px min-w-px not-italic relative text-right" data-name="Small Graph">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center min-w-full relative shrink-0 text-[#2d3648] text-[24px] w-[min-content]">
        <p className="leading-[1.5]" dir="auto">
          2-2026
        </p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          دفعة الرديف
        </p>
      </div>
    </div>
  );
}

function Frame9() {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[20px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-end px-[24px] py-[16px] relative size-full">
          <Frame1 />
          <SmallGraph1 />
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex gap-[16px] h-[104px] items-center relative shrink-0 w-full">
      <Frame13 />
      <Frame9 />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute inset-[16.89%_0]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 19.8633">
        <g id="Group">
          <path d={svgPaths.p38fa9980} fill="url(#paint0_linear_48_5319)" id="Vector" />
          <path d={svgPaths.p38e29900} fill="url(#paint1_linear_48_5319)" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_48_5319" x1="8.20313" x2="8.20313" y1="8.85779" y2="14.4517">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_48_5319" x1="15" x2="15" y1="0" y2="19.8633">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Frame2() {
  return (
    <div className="overflow-clip relative shrink-0 size-[30px]" data-name="Frame">
      <Group2 />
    </div>
  );
}

function SmallGraph2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-end leading-[0] min-h-px min-w-px not-italic relative text-right" data-name="Small Graph">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center min-w-full relative shrink-0 text-[#2d3648] text-[0px] w-[min-content]">
        <p dir="auto">
          <span className="leading-[1.5] text-[24px]">{`38 `}</span>
          <span className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic text-[#717d96] text-[18px]">من 120</span>
        </p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          تم تسليم تحقيق رخصة القيادة
        </p>
      </div>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Frame2 />
      <SmallGraph2 />
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex font-['Almarai:Bold',sans-serif] gap-[10px] items-center justify-center leading-[0] not-italic relative shrink-0 text-[#717d96] text-[12px] w-full">
      <div className="flex flex-[1_0_0] flex-col justify-center min-h-px min-w-px relative">
        <p className="leading-[1.5]" dir="auto">
          50%
        </p>
      </div>
      <div className="flex flex-[1_0_0] flex-col justify-center min-h-px min-w-px relative text-right">
        <p className="leading-[1.5]" dir="auto">
          40
        </p>
      </div>
    </div>
  );
}

function Frame18() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex flex-col h-[15px] items-end justify-between relative rounded-[999px] shrink-0 w-full">
      <div className="bg-gradient-to-b from-[#00b867] h-[15px] rounded-[999px] shrink-0 to-[#00522e] w-[150px]" />
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame28 />
      <Frame18 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="bg-white flex-[1_0_0] min-h-px min-w-px relative rounded-[20px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-col items-end justify-center size-full">
        <div className="content-stretch flex flex-col gap-[10px] items-end justify-center px-[24px] py-[16px] relative w-full">
          <Frame17 />
          <Frame19 />
        </div>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute inset-[13.33%_0_11.67%_0]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 22.5">
        <g id="Group">
          <path d={svgPaths.p24800200} fill="url(#paint0_linear_48_5314)" id="Vector" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_48_5314" x1="15" x2="15" y1="0" y2="22.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Frame3() {
  return (
    <div className="overflow-clip relative shrink-0 size-[30px]" data-name="Frame">
      <Group3 />
    </div>
  );
}

function SmallGraph3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-end leading-[0] min-h-px min-w-px not-italic relative text-right" data-name="Small Graph">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center min-w-full relative shrink-0 text-[#2d3648] text-[0px] w-[min-content]">
        <p dir="auto">
          <span className="leading-[1.5] text-[24px]">{`978 `}</span>
          <span className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic text-[#717d96] text-[18px]">من 1,850</span>
        </p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          تم تسليم تحقيق الشخصية العسكرية
        </p>
      </div>
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Frame3 />
      <SmallGraph3 />
    </div>
  );
}

function Frame27() {
  return (
    <div className="content-stretch flex font-['Almarai:Bold',sans-serif] gap-[10px] items-center justify-center leading-[0] not-italic relative shrink-0 text-[#717d96] text-[12px] w-full">
      <div className="flex flex-[1_0_0] flex-col justify-center min-h-px min-w-px relative">
        <p className="leading-[1.5]" dir="auto">
          50%
        </p>
      </div>
      <div className="flex flex-[1_0_0] flex-col justify-center min-h-px min-w-px relative text-right">
        <p className="leading-[1.5]" dir="auto">
          800
        </p>
      </div>
    </div>
  );
}

function Frame22() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex flex-col h-[15px] items-end justify-between relative rounded-[999px] shrink-0 w-full">
      <div className="bg-gradient-to-b from-[#00b867] h-[15px] rounded-[999px] shrink-0 to-[#00522e] w-[260px]" />
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame27 />
      <Frame22 />
    </div>
  );
}

function Frame12() {
  return (
    <div className="bg-white flex-[1_0_0] min-h-px min-w-px relative rounded-[20px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-col items-end justify-center size-full">
        <div className="content-stretch flex flex-col gap-[10px] items-end justify-center px-[24px] py-[16px] relative w-full">
          <Frame20 />
          <Frame21 />
        </div>
      </div>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
      <Frame14 />
      <Frame12 />
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[1112px]">
      <Frame5 />
      <Frame16 />
    </div>
  );
}

function LeftIcon1() {
  return (
    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-name="Left Icon">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#294dbb] text-[14px] text-right whitespace-nowrap">
        <p className="leading-[1.4]">طباعة الكشف</p>
      </div>
    </div>
  );
}

function LeftIcon2() {
  return (
    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-name="Left Icon">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#294dbb] text-[14px] text-right whitespace-nowrap">
        <p className="leading-[1.4]">ترحيل دفعة</p>
      </div>
    </div>
  );
}

function LeftIcon3() {
  return (
    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-name="Left Icon">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f5f5f5] text-[14px] text-right whitespace-nowrap">
        <p className="leading-[1.4]">انهاء خدمة الافراد</p>
      </div>
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex gap-[24px] items-end relative shrink-0 w-[1112px]">
      <div className="content-stretch flex gap-[2px] items-center justify-center min-h-[36px] px-[12px] py-[8px] relative rounded-[8px] shrink-0 w-[120px]" data-name="Buttons">
        <div aria-hidden="true" className="absolute border-[#1f3d97] border-[1.5px] border-solid inset-0 pointer-events-none rounded-[8px]" />
        <LeftIcon1 />
      </div>
      <div className="content-stretch flex gap-[2px] items-center justify-center min-h-[36px] px-[12px] py-[8px] relative rounded-[8px] shrink-0 w-[120px]" data-name="Buttons">
        <div aria-hidden="true" className="absolute border-[#1f3d97] border-[1.5px] border-solid inset-0 pointer-events-none rounded-[8px]" />
        <LeftIcon2 />
      </div>
      <div className="bg-gradient-to-b content-stretch flex from-[#00b867] gap-[2px] items-center justify-center min-h-[36px] px-[12px] py-[8px] relative rounded-[8px] shrink-0 to-[#00522e] w-[120px]" data-name="Buttons">
        <LeftIcon3 />
      </div>
    </div>
  );
}

function ArrowDown() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow-down">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p14089660} id="Icon" stroke="var(--stroke-0, #A0ABC0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function TableHeader() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Table header">
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#717d96] text-[12px] whitespace-nowrap" dir="auto">
        حالة الفرد
      </p>
      <ArrowDown />
    </div>
  );
}

function TableHeaderCell() {
  return (
    <div className="bg-white h-[44px] relative shrink-0 w-full" data-name="Table header cell">
      <div aria-hidden="true" className="absolute border-[#d4d8fa] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TableHeader />
        </div>
      </div>
    </div>
  );
}

function Dot() {
  return (
    <div className="relative shrink-0 size-[8px]" data-name="_Dot">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
        <g id="_Dot">
          <circle cx="4.00001" cy="4" fill="var(--fill-0, #35C128)" id="Dot" r="3" />
        </g>
      </svg>
    </div>
  );
}

function BadgeBase() {
  return (
    <div className="bg-[#ebfaea] content-stretch flex gap-[6px] items-center justify-center pl-[6px] pr-[8px] py-[2px] relative rounded-[16px] shrink-0" data-name="_Badge base">
      <Dot />
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#26861d] text-[12px] text-center whitespace-nowrap" dir="auto">
        بالخدمة
      </p>
    </div>
  );
}

function Badge1() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Badge">
      <BadgeBase />
    </div>
  );
}

function Badge() {
  return (
    <div className="content-stretch flex items-start mix-blend-multiply relative shrink-0" data-name="Badge">
      <Badge1 />
    </div>
  );
}

function TableCell() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#edeff1] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-end justify-end size-full">
        <div className="content-stretch flex items-end justify-end px-[24px] py-[11px] relative size-full">
          <Badge />
        </div>
      </div>
    </div>
  );
}

function Dot1() {
  return (
    <div className="relative shrink-0 size-[8px]" data-name="_Dot">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
        <g id="_Dot">
          <circle cx="4.00001" cy="4" fill="var(--fill-0, #E37032)" id="Dot" r="3" />
        </g>
      </svg>
    </div>
  );
}

function BadgeBase1() {
  return (
    <div className="bg-[#fce9ea] content-stretch flex gap-[6px] items-center justify-center pl-[6px] pr-[8px] py-[2px] relative rounded-[16px] shrink-0" data-name="_Badge base">
      <Dot1 />
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#9d2e15] text-[12px] text-center whitespace-nowrap" dir="auto">
        منتهي خدمته
      </p>
    </div>
  );
}

function TableCell1() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-end justify-end size-full">
        <div className="content-stretch flex items-end justify-end px-[24px] py-[11px] relative size-full">
          <BadgeBase1 />
        </div>
      </div>
    </div>
  );
}

function Dot2() {
  return (
    <div className="relative shrink-0 size-[8px]" data-name="_Dot">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
        <g id="_Dot">
          <circle cx="4.00001" cy="4" fill="var(--fill-0, #35C128)" id="Dot" r="3" />
        </g>
      </svg>
    </div>
  );
}

function BadgeBase2() {
  return (
    <div className="bg-[#ebfaea] content-stretch flex gap-[6px] items-center justify-center pl-[6px] pr-[8px] py-[2px] relative rounded-[16px] shrink-0" data-name="_Badge base">
      <Dot2 />
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#26861d] text-[12px] text-center whitespace-nowrap" dir="auto">
        بالخدمة
      </p>
    </div>
  );
}

function Badge3() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Badge">
      <BadgeBase2 />
    </div>
  );
}

function Badge2() {
  return (
    <div className="content-stretch flex items-start mix-blend-multiply relative shrink-0" data-name="Badge">
      <Badge3 />
    </div>
  );
}

function TableCell2() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#edeff1] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-end justify-end size-full">
        <div className="content-stretch flex items-end justify-end px-[24px] py-[11px] relative size-full">
          <Badge2 />
        </div>
      </div>
    </div>
  );
}

function Column() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative self-stretch" data-name="Column">
      <TableHeaderCell />
      <TableCell />
      <TableCell1 />
      <TableCell2 />
    </div>
  );
}

function ArrowDown1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow-down">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p14089660} id="Icon" stroke="var(--stroke-0, #A0ABC0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function TableHeader1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Table header">
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#717d96] text-[12px] whitespace-nowrap" dir="auto">
        استلام رخصه
      </p>
      <ArrowDown1 />
    </div>
  );
}

function TableHeaderCell1() {
  return (
    <div className="bg-white h-[44px] relative shrink-0 w-full" data-name="Table header cell">
      <div aria-hidden="true" className="absolute border-[#d4d8fa] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end p-[12px] relative size-full">
          <TableHeader1 />
        </div>
      </div>
    </div>
  );
}

function Check() {
  return (
    <div className="absolute inset-[15%]" data-name="check">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="check">
          <path d={svgPaths.p24a494c0} id="Icon" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase() {
  return (
    <div className="bg-[#294dbb] relative rounded-[6px] shrink-0 size-[20px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <Check />
      </div>
      <div aria-hidden="true" className="absolute border border-[#294dbb] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Checkbox() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase />
    </div>
  );
}

function Button() {
  return (
    <div className="content-stretch flex items-center relative rounded-[8px] shrink-0" data-name="Button">
      <Checkbox />
    </div>
  );
}

function TableCell3() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#edeff1] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[12px] py-[11px] relative size-full">
          <Button />
        </div>
      </div>
    </div>
  );
}

function Check1() {
  return (
    <div className="absolute inset-[15%]" data-name="check">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="check">
          <path d={svgPaths.p24a494c0} id="Icon" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase1() {
  return (
    <div className="bg-[#294dbb] relative rounded-[6px] shrink-0 size-[20px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <Check1 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#294dbb] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Checkbox1() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase1 />
    </div>
  );
}

function Button1() {
  return (
    <div className="content-stretch flex items-center relative rounded-[8px] shrink-0" data-name="Button">
      <Checkbox1 />
    </div>
  );
}

function TableCell4() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[12px] py-[11px] relative size-full">
          <Button1 />
        </div>
      </div>
    </div>
  );
}

function Check2() {
  return (
    <div className="absolute inset-[15%]" data-name="check">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="check">
          <path d={svgPaths.p24a494c0} id="Icon" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase2() {
  return (
    <div className="bg-[#294dbb] relative rounded-[6px] shrink-0 size-[20px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <Check2 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#294dbb] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Checkbox2() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase2 />
    </div>
  );
}

function Button2() {
  return (
    <div className="content-stretch flex items-center relative rounded-[8px] shrink-0" data-name="Button">
      <Checkbox2 />
    </div>
  );
}

function TableCell5() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#edeff1] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[12px] py-[11px] relative size-full">
          <Button2 />
        </div>
      </div>
    </div>
  );
}

function Column1() {
  return (
    <div className="content-stretch flex flex-col items-end relative self-stretch shrink-0 w-[112px]" data-name="Column">
      <TableHeaderCell1 />
      <TableCell3 />
      <TableCell4 />
      <TableCell5 />
    </div>
  );
}

function ArrowDown2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow-down">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p14089660} id="Icon" stroke="var(--stroke-0, #A0ABC0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function TableHeader2() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Table header">
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#717d96] text-[12px] whitespace-nowrap" dir="auto">
        استلام كارنيه
      </p>
      <ArrowDown2 />
    </div>
  );
}

function TableHeaderCell2() {
  return (
    <div className="bg-white h-[44px] relative shrink-0 w-full" data-name="Table header cell">
      <div aria-hidden="true" className="absolute border-[#d4d8fa] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end p-[12px] relative size-full">
          <TableHeader2 />
        </div>
      </div>
    </div>
  );
}

function Check3() {
  return (
    <div className="absolute inset-[15%]" data-name="check">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="check">
          <path d={svgPaths.p24a494c0} id="Icon" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase3() {
  return (
    <div className="bg-[#294dbb] relative rounded-[6px] shrink-0 size-[20px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <Check3 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#294dbb] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Checkbox3() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase3 />
    </div>
  );
}

function Button3() {
  return (
    <div className="content-stretch flex items-center relative rounded-[8px] shrink-0" data-name="Button">
      <Checkbox3 />
    </div>
  );
}

function TableCell6() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#edeff1] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[12px] py-[11px] relative size-full">
          <Button3 />
        </div>
      </div>
    </div>
  );
}

function Check4() {
  return (
    <div className="absolute inset-[15%]" data-name="check">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="check">
          <path d={svgPaths.p24a494c0} id="Icon" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase4() {
  return (
    <div className="bg-[#294dbb] relative rounded-[6px] shrink-0 size-[20px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <Check4 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#294dbb] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Checkbox4() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase4 />
    </div>
  );
}

function Button4() {
  return (
    <div className="content-stretch flex items-center relative rounded-[8px] shrink-0" data-name="Button">
      <Checkbox4 />
    </div>
  );
}

function TableCell7() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[12px] py-[11px] relative size-full">
          <Button4 />
        </div>
      </div>
    </div>
  );
}

function Check5() {
  return (
    <div className="absolute inset-[15%]" data-name="check">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="check">
          <path d={svgPaths.p24a494c0} id="Icon" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase5() {
  return (
    <div className="bg-[#294dbb] relative rounded-[6px] shrink-0 size-[20px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <Check5 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#294dbb] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Checkbox5() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase5 />
    </div>
  );
}

function Button5() {
  return (
    <div className="content-stretch flex items-center relative rounded-[8px] shrink-0" data-name="Button">
      <Checkbox5 />
    </div>
  );
}

function TableCell8() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#edeff1] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[12px] py-[11px] relative size-full">
          <Button5 />
        </div>
      </div>
    </div>
  );
}

function Column2() {
  return (
    <div className="content-stretch flex flex-col items-end relative self-stretch shrink-0 w-[120px]" data-name="Column">
      <TableHeaderCell2 />
      <TableCell6 />
      <TableCell7 />
      <TableCell8 />
    </div>
  );
}

function ArrowDown3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow-down">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p14089660} id="Icon" stroke="var(--stroke-0, #A0ABC0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function TableHeader3() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Table header">
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#717d96] text-[12px] whitespace-nowrap" dir="auto">
        الوحده
      </p>
      <ArrowDown3 />
    </div>
  );
}

function TableHeaderCell3() {
  return (
    <div className="bg-white h-[44px] relative shrink-0 w-full" data-name="Table header cell">
      <div aria-hidden="true" className="absolute border-[#d4d8fa] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TableHeader3 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
        قيا مج العمليات الخاصة
      </p>
    </div>
  );
}

function TableCell9() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TextAndSupportingText />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
        قيا مج 145 صع
      </p>
    </div>
  );
}

function TableCell10() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TextAndSupportingText1 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
        سرية القيادة
      </p>
    </div>
  );
}

function TableCell11() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TextAndSupportingText2 />
        </div>
      </div>
    </div>
  );
}

function Column3() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0 w-[172px]" data-name="Column">
      <TableHeaderCell3 />
      <TableCell9 />
      <TableCell10 />
      <TableCell11 />
    </div>
  );
}

function ArrowDown4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow-down">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p14089660} id="Icon" stroke="var(--stroke-0, #A0ABC0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function TableHeader4() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Table header">
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#717d96] text-[12px] whitespace-nowrap" dir="auto">
        اسم
      </p>
      <ArrowDown4 />
    </div>
  );
}

function TableHeaderCell4() {
  return (
    <div className="bg-white h-[44px] relative shrink-0 w-full" data-name="Table header cell">
      <div aria-hidden="true" className="absolute border-[#d4d8fa] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TableHeader4 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
        اسلام مجدى عبدالستار السيد
      </p>
    </div>
  );
}

function TableCell12() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TextAndSupportingText3 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
        اسلام مجدى عبدالستار السيد
      </p>
    </div>
  );
}

function TableCell13() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TextAndSupportingText4 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
        اسلام مجدى عبدالستار السيد
      </p>
    </div>
  );
}

function TableCell14() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TextAndSupportingText5 />
        </div>
      </div>
    </div>
  );
}

function Column4() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0 w-[200px]" data-name="Column">
      <TableHeaderCell4 />
      <TableCell12 />
      <TableCell13 />
      <TableCell14 />
    </div>
  );
}

function ArrowDown5() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow-down">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p14089660} id="Icon" stroke="var(--stroke-0, #A0ABC0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function TableHeader5() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Table header">
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#717d96] text-[12px] whitespace-nowrap" dir="auto">
        درجة
      </p>
      <ArrowDown5 />
    </div>
  );
}

function TableHeaderCell5() {
  return (
    <div className="bg-white h-[44px] relative shrink-0 w-full" data-name="Table header cell">
      <div aria-hidden="true" className="absolute border-[#d4d8fa] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TableHeader5 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText6() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
        جندى
      </p>
    </div>
  );
}

function TableCell15() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TextAndSupportingText6 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText7() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
        جندى
      </p>
    </div>
  );
}

function TableCell16() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TextAndSupportingText7 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText8() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
        جندى
      </p>
    </div>
  );
}

function TableCell17() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TextAndSupportingText8 />
        </div>
      </div>
    </div>
  );
}

function Column5() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0 w-[80px]" data-name="Column">
      <TableHeaderCell5 />
      <TableCell15 />
      <TableCell16 />
      <TableCell17 />
    </div>
  );
}

function ArrowDown6() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow-down">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p14089660} id="Icon" stroke="var(--stroke-0, #A0ABC0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function TableHeader6() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Table header">
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#717d96] text-[12px] whitespace-nowrap" dir="auto">
        رقم عسكري
      </p>
      <ArrowDown6 />
    </div>
  );
}

function TableHeaderCell6() {
  return (
    <div className="bg-white h-[44px] relative shrink-0 w-full" data-name="Table header cell">
      <div aria-hidden="true" className="absolute border-[#d4d8fa] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TableHeader6 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText9() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
        2024427700265
      </p>
    </div>
  );
}

function TableCell18() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TextAndSupportingText9 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText10() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
        2024159308527
      </p>
    </div>
  );
}

function TableCell19() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TextAndSupportingText10 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText11() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
        2024964213580
      </p>
    </div>
  );
}

function TableCell20() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TextAndSupportingText11 />
        </div>
      </div>
    </div>
  );
}

function Column6() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0 w-[158px]" data-name="Column">
      <TableHeaderCell6 />
      <TableCell18 />
      <TableCell19 />
      <TableCell20 />
    </div>
  );
}

function ArrowDown7() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow-down">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p14089660} id="Icon" stroke="var(--stroke-0, #A0ABC0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function TableHeader7() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Table header">
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#717d96] text-[12px] whitespace-nowrap" dir="auto">
        م
      </p>
      <ArrowDown7 />
    </div>
  );
}

function TableHeaderCell7() {
  return (
    <div className="bg-white h-[44px] relative shrink-0 w-full" data-name="Table header cell">
      <div aria-hidden="true" className="absolute border-[#d4d8fa] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[24px] py-[12px] relative size-full">
          <TableHeader7 />
        </div>
      </div>
    </div>
  );
}

function TableCell21() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#ebedfd] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[4px] items-center justify-center px-[16px] py-[12px] relative size-full">
          <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
            1
          </p>
        </div>
      </div>
    </div>
  );
}

function TableCell22() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#e9f9ff] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[4px] items-center justify-center px-[16px] py-[12px] relative size-full">
          <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
            2
          </p>
        </div>
      </div>
    </div>
  );
}

function TableCell23() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#fce8f1] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[4px] items-center justify-center px-[16px] py-[12px] relative size-full">
          <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap" dir="auto">
            3
          </p>
        </div>
      </div>
    </div>
  );
}

function Column7() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0 w-[40px]" data-name="Column">
      <TableHeaderCell7 />
      <TableCell21 />
      <TableCell22 />
      <TableCell23 />
    </div>
  );
}

function Minus() {
  return (
    <div className="absolute inset-[15%]" data-name="minus">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="minus">
          <path d="M2.91602 7H11.0827" id="Icon" stroke="var(--stroke-0, #294DBB)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase6() {
  return (
    <div className="bg-[#ebedfd] relative rounded-[6px] shrink-0 size-[20px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <Minus />
      </div>
      <div aria-hidden="true" className="absolute border border-[#294dbb] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Checkbox6() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase6 />
    </div>
  );
}

function TableHeaderCell8() {
  return (
    <div className="bg-white h-[44px] relative shrink-0 w-full" data-name="Table header cell">
      <div aria-hidden="true" className="absolute border-[#d4d8fa] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[24px] py-[12px] relative size-full">
          <Checkbox6 />
        </div>
      </div>
    </div>
  );
}

function Check6() {
  return (
    <div className="absolute inset-[15%]" data-name="check">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="check">
          <path d={svgPaths.p24a494c0} id="Icon" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase7() {
  return (
    <div className="bg-[#294dbb] relative rounded-[6px] shrink-0 size-[20px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <Check6 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#294dbb] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Checkbox7() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase7 />
    </div>
  );
}

function Button6() {
  return (
    <div className="content-stretch flex items-center relative rounded-[8px] shrink-0" data-name="Button">
      <Checkbox7 />
    </div>
  );
}

function TableCell24() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#ebedfd] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[4px] items-center justify-center px-[16px] py-[12px] relative size-full">
          <Button6 />
        </div>
      </div>
    </div>
  );
}

function Check7() {
  return (
    <div className="absolute inset-[15%]" data-name="check">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="check">
          <path d={svgPaths.p24a494c0} id="Icon" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase8() {
  return (
    <div className="bg-[#294dbb] relative rounded-[6px] shrink-0 size-[20px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <Check7 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#294dbb] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Checkbox8() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase8 />
    </div>
  );
}

function Button7() {
  return (
    <div className="content-stretch flex items-center relative rounded-[8px] shrink-0" data-name="Button">
      <Checkbox8 />
    </div>
  );
}

function TableCell25() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#e9f9ff] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[4px] items-center justify-center px-[16px] py-[12px] relative size-full">
          <Button7 />
        </div>
      </div>
    </div>
  );
}

function Check8() {
  return (
    <div className="absolute inset-[15%]" data-name="check">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="check">
          <path d={svgPaths.p24a494c0} id="Icon" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase9() {
  return (
    <div className="bg-[#294dbb] relative rounded-[6px] shrink-0 size-[20px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <Check8 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#294dbb] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Checkbox9() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase9 />
    </div>
  );
}

function Button8() {
  return (
    <div className="content-stretch flex items-center relative rounded-[8px] shrink-0" data-name="Button">
      <Checkbox9 />
    </div>
  );
}

function TableCell26() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#fce8f1] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[4px] items-center justify-center px-[16px] py-[12px] relative size-full">
          <Button8 />
        </div>
      </div>
    </div>
  );
}

function Column8() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0 w-[68px]" data-name="Column">
      <TableHeaderCell8 />
      <TableCell24 />
      <TableCell25 />
      <TableCell26 />
    </div>
  );
}

function Content() {
  return (
    <div className="bg-white content-stretch flex h-[179px] items-start justify-end relative shrink-0 w-full" data-name="Content">
      <Column />
      <Column1 />
      <Column2 />
      <Column3 />
      <Column4 />
      <Column5 />
      <Column6 />
      <Column7 />
      <Column8 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-[0_0_-1px_0] pointer-events-none" />
      <div className="flex flex-col items-end size-full">
        <div className="content-stretch flex flex-col items-end px-[12px] py-[8px] relative w-full">
          <div className="bg-[#eaecf0] h-[6px] rounded-[12px] shrink-0 w-[407px]" />
        </div>
      </div>
    </div>
  );
}

function LeftIcon4() {
  return (
    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-name="Left Icon">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#2d3648] text-[14px] text-right whitespace-nowrap">
        <p className="leading-[1.4]">حفظ التعديلات</p>
      </div>
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex h-[44px] items-end p-[4px] relative shrink-0 w-[1112px]">
      <div className="flex flex-row items-end self-stretch">
        <div className="bg-[#ebedfd] h-full min-h-[36px] relative rounded-[8px] shrink-0 w-[120px]" data-name="Buttons">
          <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
            <div className="content-stretch flex gap-[2px] items-center justify-center min-h-[inherit] px-[12px] py-[8px] relative size-full">
              <LeftIcon4 />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Table() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Table">
      <div className="content-stretch flex flex-col items-end overflow-clip relative rounded-[inherit] w-full">
        <Content />
        <Frame6 />
        <Frame25 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#eaecf0] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Frame29() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      <Frame24 />
      <Table />
    </div>
  );
}

function Frame11() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-end size-full">
        <div className="content-stretch flex flex-col gap-[24px] items-end p-[24px] relative w-full">
          <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] min-w-full not-italic relative shrink-0 text-[#2d3648] text-[32px] text-center w-[min-content]" dir="auto">
            دفعات الرديف
          </p>
          <Frame23 />
          <Frame15 />
          <Frame29 />
        </div>
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start min-h-px min-w-px relative">
      <Header />
      <Frame11 />
    </div>
  );
}

function ExpandIcon() {
  return (
    <button className="bg-white content-stretch cursor-pointer flex items-center p-[4px] relative rounded-[99px] shrink-0" data-name="Expand icon">
      <div aria-hidden="true" className="absolute border border-[#e2e8f0] border-solid inset-[-1px] pointer-events-none rounded-[100px]" />
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Icon/Solid/chevron-left">
        <div className="absolute bottom-1/4 left-[35%] right-[35%] top-1/4" data-name="Icon">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.8 8">
            <path clipRule="evenodd" d={svgPaths.p1b4b4100} fill="var(--fill-0, #081021)" fillRule="evenodd" id="Icon" />
          </svg>
        </div>
      </div>
    </button>
  );
}

function Logo1() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Logo">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g clipPath="url(#clip0_48_2626)" id="Logo">
          <path clipRule="evenodd" d={svgPaths.pb82c00} fill="url(#paint0_linear_48_2626)" fillRule="evenodd" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p9a9cd00} fill="url(#paint1_linear_48_2626)" fillRule="evenodd" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_48_2626" x1="16" x2="16" y1="0" y2="32">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_48_2626" x1="8" x2="8" y1="0" y2="16">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <clipPath id="clip0_48_2626">
            <rect fill="white" height="32" width="32" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Logo() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center justify-end min-h-px min-w-px overflow-clip relative" data-name="Logo">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#081021] text-[24px] text-right whitespace-nowrap">
        <p className="leading-[1.5]" dir="auto">
          منظومة الخوارج
        </p>
      </div>
      <Logo1 />
    </div>
  );
}

function Top() {
  return (
    <div className="relative shrink-0 w-full z-[3]" data-name="Top">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[20px] py-[24px] relative w-full">
          <ExpandIcon />
          <Logo />
        </div>
      </div>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute inset-[4.17%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.3333 18.3333">
        <g id="Group">
          <path d={svgPaths.p31003200} fill="var(--fill-0, #717D96)" id="03 dashboard, layout, grid" />
        </g>
      </svg>
    </div>
  );
}

function Icon() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group4 />
      </div>
    </div>
  );
}

function Inner1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#717d96] text-[16px] text-right">
        <p className="leading-[1.5]">الموقف العام</p>
      </div>
      <Icon />
    </div>
  );
}

function Icon1() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.9999 20.0001">
          <g id="Group">
            <path d={svgPaths.p24b75b00} fill="var(--fill-0, #717D96)" id="Vector" />
            <path d={svgPaths.p3b62bd80} fill="var(--fill-0, #717D96)" id="Vector_2" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Inner2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#717d96] text-[16px] text-right">
        <p className="leading-[1.5]">الاستعلام عن فرد</p>
      </div>
      <Icon1 />
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute inset-[4.17%_4.17%_4.17%_12.5%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.6667 18.3333">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.padea100} fill="var(--fill-0, #717D96)" fillRule="evenodd" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Icon2() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group5 />
      </div>
    </div>
  );
}

function Inner3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#717d96] text-[16px] text-right">
        <p className="leading-[1.5]">اضافة قوة جديدة</p>
      </div>
      <Icon2 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[#64748b] text-[14px] text-right w-full">
        <p className="leading-[1.4]" dir="auto">
          الافراد
        </p>
      </div>
      <div className="h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
        <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
            <Inner2 />
          </div>
        </div>
      </div>
      <div className="h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
        <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
            <Inner3 />
          </div>
        </div>
      </div>
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute inset-[12.5%_6.27%_12.5%_6.25%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.4961 15.001">
        <g id="Group">
          <path d={svgPaths.p1fb46a80} fill="var(--fill-0, #717D96)" id="55 - folder opened" />
        </g>
      </svg>
    </div>
  );
}

function Icon3() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group6 />
      </div>
    </div>
  );
}

function Inner4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#717d96] text-[16px] text-right">
        <p className="leading-[1.5]">بيان الوحدات</p>
      </div>
      <Icon3 />
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute inset-[3.13%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.75 18.75">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p8cec1f0} fill="var(--fill-0, #717D96)" fillRule="evenodd" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Icon4() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group7 />
      </div>
    </div>
  );
}

function Inner5() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#717d96] text-[16px] text-right">
        <p className="leading-[1.5]">إصدار خطاب</p>
      </div>
      <Icon4 />
    </div>
  );
}

function Group8() {
  return (
    <div className="absolute inset-[0.1%_3.03%_-0.1%_3.03%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.7875 20">
        <g id="Group">
          <path d={svgPaths.p373ddfa0} fill="var(--fill-0, #717D96)" id="Vector" />
          <path d={svgPaths.p21b0d30} fill="var(--fill-0, #717D96)" id="Vector_2" />
          <path d={svgPaths.p21fcb600} fill="var(--fill-0, #717D96)" id="Vector_3" />
        </g>
      </svg>
    </div>
  );
}

function Icon5() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group8 />
      </div>
    </div>
  );
}

function Inner6() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#717d96] text-[16px] text-right">
        <p className="leading-[1.5]">سجل الخطابات</p>
      </div>
      <Icon5 />
    </div>
  );
}

function Group9() {
  return (
    <div className="absolute inset-[3.91%_10.94%]" data-name="Group">
      <div className="absolute inset-[-4.24%_-5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.1875 20">
          <g id="Group">
            <path d={svgPaths.p1e608e98} id="Vector" stroke="var(--stroke-0, #717D96)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5625" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Icon6() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group9 />
      </div>
    </div>
  );
}

function Inner7() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#717d96] text-[16px] text-right">
        <p className="leading-[1.5]">اليوميات</p>
      </div>
      <Icon6 />
    </div>
  );
}

function Group10() {
  return (
    <div className="absolute inset-[9.37%_9.38%_9.37%_13.54%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.4167 16.25">
        <g id="Group">
          <path d={svgPaths.p35053e00} fill="url(#paint0_linear_48_4775)" id="Vector" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_48_4775" x1="7.70833" x2="7.70833" y1="0" y2="16.25">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Icon7() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group10 />
      </div>
    </div>
  );
}

function Inner8() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#2d3648] text-[16px] text-right">
        <p className="leading-[1.5]">دفعات الرديف</p>
      </div>
      <Icon7 />
    </div>
  );
}

function Nav() {
  return (
    <div className="relative shrink-0 w-full" data-name="Nav">
      <div className="content-stretch flex flex-col gap-[4px] items-start px-[24px] relative w-full">
        <div className="h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
          <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
              <Inner1 />
            </div>
          </div>
        </div>
        <Frame4 />
        <div className="h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
          <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
              <Inner4 />
            </div>
          </div>
        </div>
        <div className="h-0 relative shrink-0 w-full">
          <div className="absolute inset-[-1px_0_0_0]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 232 1">
              <line id="Line 2" stroke="var(--stroke-0, #E2E8F0)" x2="232" y1="0.5" y2="0.5" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col font-['Almarai:Regular',sans-serif] h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[#64748b] text-[14px] text-right w-full">
          <p className="leading-[1.4]" dir="auto">
            الخطابات
          </p>
        </div>
        <div className="h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
          <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
              <Inner5 />
            </div>
          </div>
        </div>
        <div className="h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
          <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
              <Inner6 />
            </div>
          </div>
        </div>
        <div className="h-0 relative shrink-0 w-full">
          <div className="absolute inset-[-1px_0_0_0]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 232 1">
              <line id="Line 2" stroke="var(--stroke-0, #E2E8F0)" x2="232" y1="0.5" y2="0.5" />
            </svg>
          </div>
        </div>
        <div className="h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
          <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
              <Inner7 />
            </div>
          </div>
        </div>
        <div className="bg-[#ebedfd] h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
          <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
              <Inner8 />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group11() {
  return (
    <div className="absolute inset-[5.21%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9168 17.9167">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p26300b00} fill="var(--fill-0, #717D96)" fillRule="evenodd" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p1b011e80} fill="var(--fill-0, #717D96)" fillRule="evenodd" id="Vector_2" />
          <path d={svgPaths.p11c6ab80} fill="var(--fill-0, #717D96)" id="Vector_3" />
          <path clipRule="evenodd" d={svgPaths.p183b04b0} fill="var(--fill-0, #717D96)" fillRule="evenodd" id="Vector_4" />
        </g>
      </svg>
    </div>
  );
}

function Icon8() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group11 />
      </div>
    </div>
  );
}

function Inner9() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#717d96] text-[16px] text-right">
        <p className="leading-[1.5]">ادارة الوحدات</p>
      </div>
      <Icon8 />
    </div>
  );
}

function Group12() {
  return (
    <div className="absolute inset-[5.21%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9167 17.9167">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p824b00} fill="var(--fill-0, #717D96)" fillRule="evenodd" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p3ba51e00} fill="var(--fill-0, #717D96)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Icon9() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group12 />
      </div>
    </div>
  );
}

function Inner10() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#717d96] text-[16px] text-right">
        <p className="leading-[1.5]">ادارة المستخدمين</p>
      </div>
      <Icon9 />
    </div>
  );
}

function Group13() {
  return (
    <div className="absolute inset-[7.47%_1.23%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.5091 17.0113">
        <g id="Group">
          <path d={svgPaths.p2e8c3c00} fill="var(--fill-0, #717D96)" id="Vector" />
          <path d={svgPaths.p3f626600} fill="var(--fill-0, #717D96)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Icon10() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group13 />
      </div>
    </div>
  );
}

function Inner11() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#717d96] text-[16px] text-right">
        <p className="leading-[1.5]">النسخ الاحتياطي للبيانات</p>
      </div>
      <Icon10 />
    </div>
  );
}

function Group14() {
  return (
    <div className="absolute inset-[5.21%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9167 17.9167">
        <g id="Group">
          <path d={svgPaths.p399bca00} fill="var(--fill-0, #717D96)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Icon11() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group14 />
      </div>
    </div>
  );
}

function Inner12() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#717d96] text-[16px] text-right">
        <p className="leading-[1.5]">سجل العمليات</p>
      </div>
      <Icon11 />
    </div>
  );
}

function Nav1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Nav 2">
      <div className="content-stretch flex flex-col gap-[4px] items-start px-[24px] relative w-full">
        <div className="flex flex-col font-['Almarai:Regular',sans-serif] h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[#64748b] text-[14px] text-right w-full">
          <p className="leading-[1.4]" dir="auto">
            ادارة المنظومة
          </p>
        </div>
        <div className="h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
          <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
              <Inner9 />
            </div>
          </div>
        </div>
        <div className="h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
          <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
              <Inner10 />
            </div>
          </div>
        </div>
        <div className="h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
          <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
              <Inner11 />
            </div>
          </div>
        </div>
        <div className="h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
          <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
              <Inner12 />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Main() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full z-[2]" data-name="Main">
      <Nav />
      <div className="h-0 relative shrink-0 w-full">
        <div className="absolute inset-[-1px_0_0_0]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 280 1">
            <line id="Line 3" stroke="var(--stroke-0, #E2E8F0)" x2="280" y1="0.5" y2="0.5" />
          </svg>
        </div>
      </div>
      <Nav1 />
    </div>
  );
}

function TextGroup1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-h-px min-w-px not-italic relative text-right" data-name="Text group">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#64748b] text-[12px] w-full">مرحبا بك</p>
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.4] relative shrink-0 text-[#081021] text-[14px] w-full">جندي / اسلام مجدي</p>
    </div>
  );
}

function Avatar2() {
  return (
    <div className="bg-[#ffb31f] overflow-clip relative rounded-[99px] shrink-0 size-[40px]" data-name="Avatar">
      <div className="absolute inset-[-35%_-40%_-45%_-40%]" data-name="Big Shoes Avatar">
        <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" src={imgBigShoesAvatar} />
      </div>
    </div>
  );
}

function Inner13() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <TextGroup1 />
      <Avatar2 />
    </div>
  );
}

function Frame7() {
  return (
    <div className="absolute content-stretch flex h-[960px] items-start justify-end right-0 top-0 w-[1440px]">
      <Frame10 />
      <div className="bg-white content-stretch flex flex-col gap-[24px] h-[960px] isolate items-center rounded-bl-[16px] rounded-br-[16px] rounded-tr-[16px] shrink-0 sticky top-0 w-[280px]" data-name="Sidebar">
        <Top />
        <Main />
        <div className="relative shrink-0 w-full z-[1]" data-name="Avatar">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex gap-[12px] items-center p-[24px] relative w-full">
              <div className="flex items-center justify-center relative shrink-0">
                <div className="-scale-y-100 flex-none rotate-180">
                  <div className="overflow-clip relative size-[20px]" data-name="Caret">
                    <div className="absolute bottom-1/4 left-[35%] right-[35%] top-1/4" data-name="Icon">
                      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 10">
                        <path clipRule="evenodd" d={svgPaths.p28321340} fill="var(--fill-0, #081021)" fillRule="evenodd" id="Icon" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <Inner13 />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Component() {
  return (
    <div className="bg-[#f7f9fc] relative size-full" data-name="دفعات الرديف">
      <Frame7 />
    </div>
  );
}