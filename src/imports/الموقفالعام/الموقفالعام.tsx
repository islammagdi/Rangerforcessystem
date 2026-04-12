import svgPaths from "./svg-mvyseyn5e6";
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

function Frame16() {
  return (
    <div className="content-stretch flex gap-[10px] items-end relative shrink-0 w-[148px]">
      <div className="flex items-center justify-center relative shrink-0 size-[20px]" style={{ "--transform-inner-width": "1185", "--transform-inner-height": "21" } as React.CSSProperties}>
        <div className="-scale-y-100 flex-none rotate-90">
          <div className="overflow-clip relative size-[20px]" data-name="Caret">
            <div className="absolute bottom-1/4 left-[35%] right-[35%] top-1/4" data-name="Icon">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 10">
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
      <Frame16 />
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
              <p className="leading-[1.5]">الموقف العام</p>
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

function Group() {
  return (
    <div className="absolute inset-[11.5%_17.8%_11.47%_16.8%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.62 23.1075">
        <g id="Group">
          <path d={svgPaths.p8118600} fill="url(#paint0_linear_1_5153)" id="Vector" />
          <path d={svgPaths.p14328e00} fill="url(#paint1_linear_1_5153)" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_5153" x1="9.81" x2="9.81" y1="6.21" y2="16.0275">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_5153" x1="9.81" x2="9.81" y1="0" y2="23.1075">
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
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] h-[27px] justify-center min-w-full relative shrink-0 text-[#2d3648] text-[24px] w-[min-content]">
        <p className="leading-[1.5]">500</p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          عدد ضباط الصف
        </p>
      </div>
    </div>
  );
}

function Frame20() {
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
    <div className="absolute inset-[0_6.69%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.9877 30">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p1528f680} fill="url(#paint0_linear_1_5181)" fillRule="evenodd" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p1681e00} fill="url(#paint1_linear_1_5181)" fillRule="evenodd" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_5181" x1="12.9938" x2="12.9938" y1="0" y2="24.9314">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_5181" x1="10.5369" x2="10.5369" y1="14.655" y2="30">
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
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] h-[27px] justify-center min-w-full relative shrink-0 text-[#2d3648] text-[24px] w-[min-content]">
        <p className="leading-[1.5]" dir="auto">
          4,000
        </p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          عدد الجنود
        </p>
      </div>
    </div>
  );
}

function Frame21() {
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

function Group2() {
  return (
    <div className="absolute inset-[12.5%_0]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 22.5">
        <g id="Group">
          <path d={svgPaths.p24391d00} fill="url(#paint0_linear_1_5157)" id="Vector" />
          <path d={svgPaths.p2f932980} fill="url(#paint1_linear_1_5157)" id="Vector_2" />
          <path d={svgPaths.p3a06cf00} fill="url(#paint2_linear_1_5157)" id="Vector_3" />
          <path d={svgPaths.p23b55080} fill="url(#paint3_linear_1_5157)" id="Vector_4" />
          <path d={svgPaths.p4eff300} fill="url(#paint4_linear_1_5157)" id="Vector_5" />
          <path d={svgPaths.p32f2a500} fill="url(#paint5_linear_1_5157)" id="Vector_6" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_5157" x1="5" x2="5" y1="0" y2="7.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_5157" x1="4.55625" x2="4.55625" y1="8.75" y2="17.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint2_linear_1_5157" x1="25" x2="25" y1="0" y2="7.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint3_linear_1_5157" x1="25.4437" x2="25.4437" y1="8.75" y2="17.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint4_linear_1_5157" x1="15" x2="15" y1="0" y2="10">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint5_linear_1_5157" x1="15" x2="15" y1="11.25" y2="22.5">
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
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] h-[27px] justify-center min-w-full relative shrink-0 text-[#2d3648] text-[24px] w-[min-content]">
        <p className="leading-[1.5]" dir="auto">
          4,500
        </p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          القوة الفعلية
        </p>
      </div>
    </div>
  );
}

function Frame17() {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[20px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-end px-[24px] py-[16px] relative size-full">
          <Frame2 />
          <SmallGraph2 />
        </div>
      </div>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-center min-h-px min-w-px relative w-full">
      <Frame20 />
      <Frame21 />
      <Frame17 />
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute inset-[11.5%_17.8%_11.47%_16.8%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.62 23.1075">
        <g id="Group">
          <path d={svgPaths.p8118600} fill="url(#paint0_linear_1_5153)" id="Vector" />
          <path d={svgPaths.p14328e00} fill="url(#paint1_linear_1_5153)" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_5153" x1="9.81" x2="9.81" y1="6.21" y2="16.0275">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_5153" x1="9.81" x2="9.81" y1="0" y2="23.1075">
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
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] h-[27px] justify-center min-w-full relative shrink-0 text-[#172e78] text-[24px] w-[min-content]">
        <p className="leading-[1.5]">40</p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          خوارج ضباط الصف
        </p>
      </div>
    </div>
  );
}

function Frame22() {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[20px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-end px-[24px] py-[16px] relative size-full">
          <Frame3 />
          <SmallGraph3 />
        </div>
      </div>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute inset-[0_6.69%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.9877 30">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p1528f680} fill="url(#paint0_linear_1_5181)" fillRule="evenodd" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p1681e00} fill="url(#paint1_linear_1_5181)" fillRule="evenodd" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_5181" x1="12.9938" x2="12.9938" y1="0" y2="24.9314">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_5181" x1="10.5369" x2="10.5369" y1="14.655" y2="30">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Frame4() {
  return (
    <div className="overflow-clip relative shrink-0 size-[30px]" data-name="Frame">
      <Group4 />
    </div>
  );
}

function SmallGraph4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-end leading-[0] min-h-px min-w-px not-italic relative text-right" data-name="Small Graph">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] h-[27px] justify-center min-w-full relative shrink-0 text-[#172e78] text-[24px] w-[min-content]">
        <p className="leading-[1.5]">200</p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          خوارج الجنود
        </p>
      </div>
    </div>
  );
}

function Frame23() {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[20px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-end px-[24px] py-[16px] relative size-full">
          <Frame4 />
          <SmallGraph4 />
        </div>
      </div>
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute inset-[12.5%_0]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 22.5">
        <g id="Group">
          <path d={svgPaths.p24391d00} fill="url(#paint0_linear_1_5157)" id="Vector" />
          <path d={svgPaths.p2f932980} fill="url(#paint1_linear_1_5157)" id="Vector_2" />
          <path d={svgPaths.p3a06cf00} fill="url(#paint2_linear_1_5157)" id="Vector_3" />
          <path d={svgPaths.p23b55080} fill="url(#paint3_linear_1_5157)" id="Vector_4" />
          <path d={svgPaths.p4eff300} fill="url(#paint4_linear_1_5157)" id="Vector_5" />
          <path d={svgPaths.p32f2a500} fill="url(#paint5_linear_1_5157)" id="Vector_6" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_5157" x1="5" x2="5" y1="0" y2="7.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_5157" x1="4.55625" x2="4.55625" y1="8.75" y2="17.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint2_linear_1_5157" x1="25" x2="25" y1="0" y2="7.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint3_linear_1_5157" x1="25.4437" x2="25.4437" y1="8.75" y2="17.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint4_linear_1_5157" x1="15" x2="15" y1="0" y2="10">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint5_linear_1_5157" x1="15" x2="15" y1="11.25" y2="22.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Frame5() {
  return (
    <div className="overflow-clip relative shrink-0 size-[30px]" data-name="Frame">
      <Group5 />
    </div>
  );
}

function SmallGraph5() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-end leading-[0] min-h-px min-w-px not-italic relative text-right" data-name="Small Graph">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] h-[27px] justify-center min-w-full relative shrink-0 text-[#172e78] text-[24px] w-[min-content]">
        <p className="leading-[1.5]">240</p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          اجمالي الخوارج
        </p>
      </div>
    </div>
  );
}

function Frame24() {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[20px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-end px-[24px] py-[16px] relative size-full">
          <Frame5 />
          <SmallGraph5 />
        </div>
      </div>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-center min-h-px min-w-px relative w-full">
      <Frame22 />
      <Frame23 />
      <Frame24 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] h-[224px] items-start relative shrink-0 w-full">
      <Frame11 />
      <Frame13 />
    </div>
  );
}

function TotalContainer() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] h-full items-center justify-center min-h-px min-w-px mr-[-999px] not-italic relative text-center whitespace-nowrap" data-name="Total-container">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] relative shrink-0 text-[#717d96] text-[14px]">الخوارج/القوة</p>
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] relative shrink-0 text-[#2d3648] text-[32px]">25%</p>
    </div>
  );
}

function Container() {
  return (
    <div className="flex-[1_0_0] h-full min-h-px min-w-px mr-[-999px] relative" data-name="Container">
      <div className="absolute inset-[-0.33%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 202 202">
          <g id="Container">
            <path d={svgPaths.p1b443b00} fill="url(#paint0_linear_1_5122)" id="Ellipse" stroke="var(--stroke-0, white)" strokeWidth="2" />
            <path d={svgPaths.p11ba7000} fill="var(--fill-0, #476AE9)" id="Ellipse_2" stroke="var(--stroke-0, white)" strokeWidth="2" />
          </g>
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_5122" x1="101" x2="101" y1="1" y2="201">
              <stop stopColor="#00B867" />
              <stop offset="1" stopColor="#00522E" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Spine() {
  return <div className="h-0 w-full" data-name="Spine" />;
}

function Component21FixedRatio() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative shrink-0 w-full" data-name="2:1-fixed-ratio">
      <div className="flex h-[150px] items-center justify-center relative shrink-0 w-full" style={{ "--transform-inner-width": "1185", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="-rotate-30 flex-none w-full">
          <Spine />
        </div>
      </div>
    </div>
  );
}

function Spine1() {
  return <div className="h-0 w-full" data-name="Spine" />;
}

function Component21FixedRatio1() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative shrink-0 w-full" data-name="2:1-fixed-ratio">
      <div className="flex h-[150px] items-center justify-center relative shrink-0 w-full" style={{ "--transform-inner-width": "1185", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="-rotate-30 flex-none w-full">
          <Spine1 />
        </div>
      </div>
    </div>
  );
}

function SquareFixedRatio() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px mr-[-999px] relative" data-name="Square-fixed-ratio">
      <Component21FixedRatio />
      <Component21FixedRatio1 />
    </div>
  );
}

function ChartContainer() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px pr-[999px] relative" data-name="Chart-container">
      <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
        <TotalContainer />
      </div>
      <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
        <Container />
      </div>
      <SquareFixedRatio />
    </div>
  );
}

function Frame27() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#717d96] text-[14px] text-center whitespace-nowrap" dir="auto">
        اجمالي القوة
      </p>
      <div className="flex flex-row items-center self-stretch">
        <div className="aspect-[16/16] bg-gradient-to-b from-[#00b867] h-full rounded-[4px] shrink-0 to-[#00522e]" />
      </div>
    </div>
  );
}

function Frame29() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#717d96] text-[14px] text-center whitespace-nowrap" dir="auto">
        اجمالي الخوارج
      </p>
      <div className="flex flex-row items-center self-stretch">
        <div className="aspect-[16/16] bg-[#476ae9] h-full rounded-[4px] shrink-0" />
      </div>
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex flex-col gap-[11px] h-[51px] items-end relative shrink-0 w-[105px]">
      <Frame27 />
      <Frame29 />
    </div>
  );
}

function Frame26() {
  return (
    <div className="bg-white flex-[1_0_0] min-h-px min-w-px relative rounded-[20px] self-stretch">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-col items-end size-full">
        <div className="content-stretch flex flex-col gap-[32px] items-end px-[12px] py-[30px] relative size-full">
          <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] min-w-full not-italic relative shrink-0 text-[#2d3648] text-[20px] text-right w-[min-content]" dir="auto">
            نسبة الخوارج من القوة
          </p>
          <div className="aspect-[386/386] content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="Donut Chart">
            <ChartContainer />
          </div>
          <Frame28 />
        </div>
      </div>
    </div>
  );
}

function Days() {
  return (
    <div className="col-1 font-['Almarai:Regular',sans-serif] grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[46px] mt-[362.72px] not-italic place-items-start relative row-1 text-[#615e83] text-[14px] text-center whitespace-nowrap" data-name="Days">
      <p className="col-1 leading-[1.4] ml-0 mt-0 relative row-1" dir="auto">
        س 680 اشارة
      </p>
      <p className="col-1 leading-[1.4] ml-[119px] mt-0 relative row-1" dir="auto">
        ميس 4
      </p>
      <p className="col-1 leading-[1.4] ml-[213.03px] mt-0 relative row-1" dir="auto">
        س 145 اشارة
      </p>
      <p className="col-1 leading-[1.4] ml-[312.83px] mt-0 relative row-1" dir="auto">
        مج عمليات خاصة
      </p>
      <p className="col-1 leading-[1.4] ml-[446.75px] mt-0 relative row-1" dir="auto">
        كـ 50 صع
      </p>
      <p className="col-1 leading-[1.4] ml-[544.07px] mt-0 relative row-1" dir="auto">
        كـ 23 صع
      </p>
      <p className="col-1 leading-[1.4] ml-[641.2px] mt-0 relative row-1" dir="auto">
        كـ 143 صع
      </p>
    </div>
  );
}

function ChartLines() {
  return (
    <div className="col-1 h-[188.924px] ml-[59px] mt-[161.08px] relative row-1 w-[731px]" data-name="Chart Lines">
      <div className="absolute inset-[-0.79%_0_0_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 731 190.424">
          <g id="Chart Lines">
            <g id="Line 4">
              <line stroke="var(--stroke-0, #E5E5EF)" strokeLinecap="round" strokeWidth="1.5" x1="0.75" x2="730.25" y1="189.673" y2="189.674" />
              <line stroke="var(--stroke-1, #EFF0F6)" strokeLinecap="round" strokeWidth="1.5" x1="0.75" x2="730.25" y1="189.673" y2="189.674" />
            </g>
            <g id="Line 3">
              <line stroke="var(--stroke-0, #E5E5EF)" strokeDasharray="4 7" strokeLinecap="round" strokeWidth="1.5" x1="0.75" x2="730.25" y1="120.75" y2="120.75" />
              <line stroke="var(--stroke-1, #EFF0F6)" strokeDasharray="4 7" strokeLinecap="round" strokeWidth="1.5" x1="0.75" x2="730.25" y1="120.75" y2="120.75" />
            </g>
            <g id="Line 2">
              <line stroke="var(--stroke-0, #E5E5EF)" strokeDasharray="4 7" strokeLinecap="round" strokeWidth="1.5" x1="0.75" x2="730.25" y1="60.75" y2="60.75" />
              <line stroke="var(--stroke-1, #EFF0F6)" strokeDasharray="4 7" strokeLinecap="round" strokeWidth="1.5" x1="0.75" x2="730.25" y1="60.75" y2="60.75" />
            </g>
            <g id="Line 1">
              <line stroke="var(--stroke-0, #E5E5EF)" strokeDasharray="4 7" strokeLinecap="round" strokeWidth="1.5" x1="0.75" x2="730.25" y1="0.75" y2="0.75" />
              <line stroke="var(--stroke-1, #EFF0F6)" strokeDasharray="4 7" strokeLinecap="round" strokeWidth="1.5" x1="0.75" x2="730.25" y1="0.75" y2="0.75" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

function Bars() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0" data-name="Bars">
      <div className="bg-[#abb5f5] col-1 h-[94.252px] ml-[636.52px] mt-[56.82px] rounded-tl-[7px] rounded-tr-[7px] row-1 w-[44.617px]" data-name="Disabled Bar" />
      <div className="bg-[#abb5f5] col-1 h-[35.767px] ml-[530.44px] mt-[115.31px] rounded-tl-[7px] rounded-tr-[7px] row-1 w-[44.617px]" data-name="Disabled Bar" />
      <div className="bg-gradient-to-b col-1 from-[#00b867] h-[151.077px] ml-[424.35px] mt-0 rounded-tl-[7px] rounded-tr-[7px] row-1 to-[#00522e] w-[44.617px]" data-name="Active Bar" />
      <div className="bg-[#abb5f5] col-1 h-[65.541px] ml-[318.26px] mt-[85.54px] rounded-tl-[7px] rounded-tr-[7px] row-1 w-[44.617px]" data-name="Disabled Bar" />
      <div className="bg-[#abb5f5] col-1 h-[109.139px] ml-[212.17px] mt-[41.94px] rounded-tl-[7px] rounded-tr-[7px] row-1 w-[44.617px]" data-name="Disabled Bar" />
      <div className="bg-[#abb5f5] col-1 h-[45.869px] ml-[106.09px] mt-[105.21px] rounded-tl-[7px] rounded-tr-[7px] row-1 w-[44.617px]" data-name="Disabled Bar" />
      <div className="bg-[#abb5f5] col-1 h-[103.004px] ml-0 mt-[48.07px] rounded-tl-[7px] rounded-tr-[7px] row-1 w-[44.617px]" data-name="Disabled Bar" />
    </div>
  );
}

function Amounts() {
  return (
    <div className="font-['Almarai:Regular',sans-serif] grid-cols-[max-content] grid-rows-[max-content] inline-grid not-italic place-items-start relative shrink-0 text-[#615e83] text-[14px] text-right" data-name="Amounts">
      <p className="col-1 leading-[1.4] ml-[22.05px] mt-[177.12px] relative row-1 w-[24.808px]">0</p>
      <p className="col-1 leading-[1.4] ml-[3.9px] mt-[118.09px] relative row-1 w-[41.916px]">200</p>
      <p className="col-1 leading-[1.4] ml-0 mt-[59.04px] relative row-1 w-[46.86px]">400</p>
      <p className="col-1 leading-[1.4] ml-0 mt-0 relative row-1 w-[46.86px]">800</p>
    </div>
  );
}

function Frame30() {
  return (
    <div className="col-1 content-stretch flex gap-[48px] items-end ml-[57px] mt-[153px] relative row-1 w-[776px]">
      <Bars />
      <Amounts />
    </div>
  );
}

function HoverStat() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[468px] mt-[143.13px] place-items-start relative row-1" data-name="Hover Stat">
      <div className="col-1 h-[42.391px] ml-0 mt-0 relative row-1 w-[72px]" data-name="Container">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 72 42.3909">
          <path d={svgPaths.p43e8400} fill="var(--fill-0, #294DBB)" id="Container" />
        </svg>
      </div>
      <p className="col-1 font-['Almarai:Regular',sans-serif] leading-[1.5] ml-[0.09px] mt-[8.35px] not-italic relative row-1 text-[#f5f5f5] text-[16px] text-center w-[71.812px]">2,313</p>
    </div>
  );
}

function CardInfo() {
  return (
    <div className="col-1 content-stretch flex flex-col items-end ml-[547px] mt-[32.11px] relative row-1 w-[270.149px]" data-name="Card Info.">
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[24px] text-right w-full" dir="auto">
        توزيع الخوارج على الوحدات
      </p>
    </div>
  );
}

function Chart() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-name="Chart 3">
      <div className="bg-white border border-[#eff0f6] border-solid col-1 h-[410px] ml-0 mt-0 rounded-[20px] row-1 w-[872px]" data-name="Container" />
      <Days />
      <ChartLines />
      <Frame30 />
      <HoverStat />
      <div className="col-1 h-0 ml-[57.04px] mt-[106.11px] relative row-1 w-[757.921px]" data-name="Divider">
        <div className="absolute inset-[-1px_0_0_0]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 757.921 1">
            <g id="Divider">
              <line stroke="var(--stroke-0, #E5E5EF)" x2="757.921" y1="0.5" y2="0.5" />
              <line stroke="var(--stroke-1, #EFF0F6)" x2="757.921" y1="0.5" y2="0.5" />
            </g>
          </svg>
        </div>
      </div>
      <CardInfo />
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex gap-[16px] items-start justify-end relative shrink-0 w-full">
      <Frame26 />
      <Chart />
    </div>
  );
}

function Frame43() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center not-italic relative shrink-0 text-[#2d3648] w-full">
      <p className="flex-[1_0_0] font-['Almarai:Regular',sans-serif] leading-[1.4] min-h-px min-w-px relative text-[14px]" dir="auto">
        اخر تحديث: 30-3-2026
      </p>
      <p className="flex-[1_0_0] font-['Almarai:Bold',sans-serif] leading-[1.5] min-h-px min-w-px relative text-[24px] text-right" dir="auto">
        موقف دفعات الرديف
      </p>
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute inset-[12.5%_0]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 22.5">
        <g id="Group">
          <path d={svgPaths.p24391d00} fill="url(#paint0_linear_1_5157)" id="Vector" />
          <path d={svgPaths.p2f932980} fill="url(#paint1_linear_1_5157)" id="Vector_2" />
          <path d={svgPaths.p3a06cf00} fill="url(#paint2_linear_1_5157)" id="Vector_3" />
          <path d={svgPaths.p23b55080} fill="url(#paint3_linear_1_5157)" id="Vector_4" />
          <path d={svgPaths.p4eff300} fill="url(#paint4_linear_1_5157)" id="Vector_5" />
          <path d={svgPaths.p32f2a500} fill="url(#paint5_linear_1_5157)" id="Vector_6" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_5157" x1="5" x2="5" y1="0" y2="7.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_5157" x1="4.55625" x2="4.55625" y1="8.75" y2="17.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint2_linear_1_5157" x1="25" x2="25" y1="0" y2="7.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint3_linear_1_5157" x1="25.4437" x2="25.4437" y1="8.75" y2="17.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint4_linear_1_5157" x1="15" x2="15" y1="0" y2="10">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint5_linear_1_5157" x1="15" x2="15" y1="11.25" y2="22.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Frame6() {
  return (
    <div className="overflow-clip relative shrink-0 size-[30px]" data-name="Frame">
      <Group6 />
    </div>
  );
}

function SmallGraph6() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-end leading-[0] min-h-px min-w-px not-italic relative text-right" data-name="Small Graph">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center min-w-full relative shrink-0 text-[#2d3648] text-[24px] w-[min-content]">
        <p className="leading-[1.5]">1,850</p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          عدد المستحقين للتسريح
        </p>
      </div>
    </div>
  );
}

function Frame32() {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[20px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-end px-[24px] py-[16px] relative size-full">
          <Frame6 />
          <SmallGraph6 />
        </div>
      </div>
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute inset-[9.38%_6.25%_0_6.25%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26.25 27.1877">
        <g id="Group">
          <path d={svgPaths.pd6f5300} fill="url(#paint0_linear_1_5171)" id="Vector" />
          <path d={svgPaths.p3f12080} fill="url(#paint1_linear_1_5171)" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_5171" x1="13.125" x2="13.125" y1="0.937346" y2="27.1877">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_5171" x1="13.125" x2="13.125" y1="0" y2="3.75">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Frame7() {
  return (
    <div className="overflow-clip relative shrink-0 size-[30px]" data-name="Frame">
      <Group7 />
    </div>
  );
}

function SmallGraph7() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-end leading-[0] min-h-px min-w-px not-italic relative text-right" data-name="Small Graph">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center min-w-full relative shrink-0 text-[#2d3648] text-[24px] w-[min-content]">
        <p className="leading-[1.5]" dir="auto">
          1 مارس 2026
        </p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          تاريخ الدفعة التالية
        </p>
      </div>
    </div>
  );
}

function Frame33() {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[20px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-end px-[24px] py-[16px] relative size-full">
          <Frame7 />
          <SmallGraph7 />
        </div>
      </div>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex gap-[16px] h-[104px] items-center relative shrink-0 w-full">
      <Frame32 />
      <Frame33 />
    </div>
  );
}

function Group8() {
  return (
    <div className="absolute inset-[16.89%_0]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 19.8633">
        <g id="Group">
          <path d={svgPaths.p38fa9980} fill="url(#paint0_linear_1_5177)" id="Vector" />
          <path d={svgPaths.p38e29900} fill="url(#paint1_linear_1_5177)" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_5177" x1="8.20313" x2="8.20313" y1="8.85779" y2="14.4517">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_5177" x1="15" x2="15" y1="0" y2="19.8633">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Frame8() {
  return (
    <div className="overflow-clip relative shrink-0 size-[30px]" data-name="Frame">
      <Group8 />
    </div>
  );
}

function SmallGraph8() {
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
          عدد مسلِّمي رخصة القيادة
        </p>
      </div>
    </div>
  );
}

function Frame36() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Frame8 />
      <SmallGraph8 />
    </div>
  );
}

function Frame38() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex flex-col h-[15px] items-end justify-between relative rounded-[999px] shrink-0 w-full">
      <div className="bg-gradient-to-b from-[#00b867] h-[15px] rounded-[999px] shrink-0 to-[#00522e] w-[150px]" />
    </div>
  );
}

function Frame37() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#717d96] text-[12px] w-full">
        <p className="leading-[1.5]" dir="auto">
          50%
        </p>
      </div>
      <Frame38 />
    </div>
  );
}

function Frame35() {
  return (
    <div className="bg-white flex-[1_0_0] min-h-px min-w-px relative rounded-[20px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-col items-end justify-center size-full">
        <div className="content-stretch flex flex-col gap-[10px] items-end justify-center px-[24px] py-[16px] relative w-full">
          <Frame36 />
          <Frame37 />
        </div>
      </div>
    </div>
  );
}

function Group9() {
  return (
    <div className="absolute inset-[13.33%_0_11.67%_0]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 22.5">
        <g id="Group">
          <path d={svgPaths.p24800200} fill="url(#paint0_linear_1_5126)" id="Vector" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_5126" x1="15" x2="15" y1="0" y2="22.5">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Frame9() {
  return (
    <div className="overflow-clip relative shrink-0 size-[30px]" data-name="Frame">
      <Group9 />
    </div>
  );
}

function SmallGraph9() {
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
          عدد مسلِّمي تحقيق الشخصية
        </p>
      </div>
    </div>
  );
}

function Frame40() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Frame9 />
      <SmallGraph9 />
    </div>
  );
}

function Frame42() {
  return (
    <div className="bg-[#f5f5f5] content-stretch flex flex-col h-[15px] items-end justify-between relative rounded-[999px] shrink-0 w-full">
      <div className="bg-gradient-to-b from-[#00b867] h-[15px] rounded-[999px] shrink-0 to-[#00522e] w-[260px]" />
    </div>
  );
}

function Frame41() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#717d96] text-[12px] w-full">
        <p className="leading-[1.5]" dir="auto">
          50%
        </p>
      </div>
      <Frame42 />
    </div>
  );
}

function Frame39() {
  return (
    <div className="bg-white flex-[1_0_0] min-h-px min-w-px relative rounded-[20px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-col items-end justify-center size-full">
        <div className="content-stretch flex flex-col gap-[10px] items-end justify-center px-[24px] py-[16px] relative w-full">
          <Frame40 />
          <Frame41 />
        </div>
      </div>
    </div>
  );
}

function Frame34() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
      <Frame35 />
      <Frame39 />
    </div>
  );
}

function Frame31() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame12 />
      <Frame34 />
    </div>
  );
}

function Frame19() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="content-stretch flex flex-col gap-[16px] items-start p-[24px] relative w-full">
        <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[24px] text-right w-full" dir="auto">
          الموقف العام للقوة
        </p>
        <Frame14 />
        <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[24px] text-right w-full" dir="auto">
          تحليل موقف الخوارج
        </p>
        <Frame25 />
        <Frame43 />
        <Frame31 />
      </div>
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative self-stretch">
      <Header />
      <Frame19 />
    </div>
  );
}

function ExpandIcon() {
  return (
    <button className="bg-white content-stretch cursor-pointer flex items-center p-[4px] relative rounded-[99px] shrink-0" data-name="Expand icon">
      <div aria-hidden="true" className="absolute border border-[#e2e8f0] border-solid inset-[-1px] pointer-events-none rounded-[100px]" />
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Icon/Solid/chevron-left">
        <div className="absolute bottom-1/4 left-[35%] right-[35%] top-1/4" data-name="Icon">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.8 8">
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
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g clipPath="url(#clip0_1_5188)" id="Logo">
          <path clipRule="evenodd" d={svgPaths.pb82c00} fill="url(#paint0_linear_1_5188)" fillRule="evenodd" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p9a9cd00} fill="url(#paint1_linear_1_5188)" fillRule="evenodd" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_5188" x1="16" x2="16" y1="0" y2="32">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_5188" x1="8" x2="8" y1="0" y2="16">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <clipPath id="clip0_1_5188">
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

function Group10() {
  return (
    <div className="absolute inset-[4.17%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.3333 18.3333">
        <g id="Group">
          <path d={svgPaths.p31003200} fill="url(#paint0_linear_1_5140)" id="03 dashboard, layout, grid" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_5140" x1="9.16667" x2="9.16667" y1="0" y2="18.3333">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Icon() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group10 />
      </div>
    </div>
  );
}

function Inner1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#1f3d97] text-[16px] text-right">
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
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.9999 20.0001">
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

function Group11() {
  return (
    <div className="absolute inset-[4.17%_4.17%_4.17%_12.5%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.6667 18.3333">
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
        <Group11 />
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

function Frame10() {
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

function Group12() {
  return (
    <div className="absolute inset-[12.5%_6.27%_12.5%_6.25%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.4961 15.001">
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
        <Group12 />
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

function Group13() {
  return (
    <div className="absolute inset-[3.13%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.75 18.75">
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
        <Group13 />
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

function Group14() {
  return (
    <div className="absolute inset-[0.1%_3.03%_-0.1%_3.03%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.7875 20">
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
        <Group14 />
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

function Group15() {
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
        <Group15 />
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

function Group16() {
  return (
    <div className="absolute inset-[9.37%_9.38%_9.37%_13.54%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.4167 16.25">
        <g id="Group">
          <path d={svgPaths.p35053e00} fill="var(--fill-0, #717D96)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Icon7() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group16 />
      </div>
    </div>
  );
}

function Inner8() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#717d96] text-[16px] text-right">
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
        <div className="bg-[#ebedfd] h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
          <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
              <Inner1 />
            </div>
          </div>
        </div>
        <Frame10 />
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
        <div className="h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
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

function Group17() {
  return (
    <div className="absolute inset-[5.21%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9168 17.9167">
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
        <Group17 />
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

function Group18() {
  return (
    <div className="absolute inset-[5.21%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9167 17.9167">
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
        <Group18 />
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

function Group19() {
  return (
    <div className="absolute inset-[7.47%_1.23%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.5091 17.0113">
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
        <Group19 />
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

function Group20() {
  return (
    <div className="absolute inset-[5.21%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9167 17.9167">
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
        <Group20 />
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

function Frame15() {
  return (
    <div className="absolute content-stretch flex items-start justify-end right-0 top-0 w-[1440px]">
      <Frame18 />
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
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 10">
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
    <div className="bg-[#f7f9fc] relative size-full" data-name="الموقف العام">
      <Frame15 />
    </div>
  );
}