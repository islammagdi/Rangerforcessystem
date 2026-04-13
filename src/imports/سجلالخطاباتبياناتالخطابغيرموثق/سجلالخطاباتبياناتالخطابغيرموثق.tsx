import svgPaths from "./svg-4fthbft47l";
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

function Frame4() {
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
      <Frame4 />
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
          <div className="content-center flex flex-wrap gap-[4px] items-center not-italic relative rounded-[12px] shrink-0 whitespace-nowrap" data-name="Text">
            <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#2d3648] text-[18px] text-center">
              <p className="leading-[1.5]">بيانات الخطاب</p>
            </div>
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#717d96] text-[14px]" style={{ fontFeatureSettings: "'ss01', 'cv01'" }}>
              /
            </p>
            <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#717d96] text-[18px]">سجل الخطابات</p>
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

function Frame19() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <div className="bg-[#fce8f1] content-stretch flex gap-[2px] items-center justify-center min-h-[36px] px-[12px] py-[8px] relative rounded-[8px] shrink-0" data-name="Buttons">
        <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Interface / Trash_Empty">
          <div className="absolute inset-[8.33%_12.5%]" data-name="Vector (Stroke)">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 13.3333">
              <path clipRule="evenodd" d={svgPaths.p17a18880} fill="var(--fill-0, #E3282C)" fillRule="evenodd" id="Vector (Stroke)" />
            </svg>
          </div>
        </div>
      </div>
      <div className="bg-[#ebedfd] content-stretch flex gap-[2px] items-center justify-center min-h-[36px] px-[12px] py-[8px] relative rounded-[8px] shrink-0" data-name="Buttons">
        <div className="overflow-clip relative shrink-0 size-[16px]" data-name="System / Printer">
          <div className="absolute inset-[8.33%]" data-name="Vector (Stroke)">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3333 13.3333">
              <path clipRule="evenodd" d={svgPaths.pfd2e80} fill="var(--fill-0, #2D3648)" fillRule="evenodd" id="Vector (Stroke)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0 w-full">
      <Frame19 />
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#2d3648] text-[18px] text-right">
        <p className="leading-[1.5]" dir="auto">
          بيانات الخطاب
        </p>
      </div>
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-end justify-center relative shrink-0 w-full">
      <Frame25 />
      <div className="flex items-center justify-center relative shrink-0 w-full">
        <div className="flex-none rotate-180 w-full">
          <div className="h-0 relative w-full">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1064 1">
                <line id="Line 5" stroke="var(--stroke-0, #CBD2E0)" x2="1064" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-start justify-end min-h-px min-w-px relative">
      <div className="flex flex-col justify-center relative shrink-0 text-[#2d3648] whitespace-nowrap">
        <p className="leading-[1.5]" dir="auto">
          25184
        </p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#172e78] whitespace-nowrap">
        <p className="leading-[1.5]" dir="auto">
          :
        </p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#717d96] w-[120px]">
        <p className="leading-[1.5]" dir="auto">
          رقم الخطاب
        </p>
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-start justify-end min-h-px min-w-px relative">
      <div className="flex flex-col justify-center relative shrink-0 text-[#2d3648] whitespace-nowrap">
        <p className="leading-[1.5]" dir="auto">
          إلحاق فرد
        </p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#172e78] whitespace-nowrap">
        <p className="leading-[1.5]" dir="auto">
          :
        </p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#717d96] w-[120px]">
        <p className="leading-[1.5]" dir="auto">
          نوع الخطاب
        </p>
      </div>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex font-['Almarai:Regular',sans-serif] gap-[10px] items-start leading-[0] not-italic relative shrink-0 text-[18px] text-right w-full">
      <Frame11 />
      <Frame10 />
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-start justify-end min-h-px min-w-px relative">
      <div className="flex flex-col justify-center relative shrink-0 text-[#2d3648] whitespace-nowrap">
        <p className="leading-[1.5]" dir="auto">
          سرية القيادة
        </p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#172e78] whitespace-nowrap">
        <p className="leading-[1.5]" dir="auto">
          :
        </p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#717d96] w-[120px]">
        <p className="leading-[1.5]" dir="auto">
          جهة الخطاب
        </p>
      </div>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-start justify-end min-h-px min-w-px relative">
      <div className="flex flex-col justify-center relative shrink-0 text-[#2d3648] whitespace-nowrap">
        <p className="leading-[1.5]" dir="auto">
          2026 - 02 - 23
        </p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#172e78] whitespace-nowrap">
        <p className="leading-[1.5]" dir="auto">
          :
        </p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#717d96] w-[120px]">
        <p className="leading-[1.5]" dir="auto">
          تاريخ الخطاب
        </p>
      </div>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex font-['Almarai:Regular',sans-serif] gap-[10px] items-start leading-[0] not-italic relative shrink-0 text-[18px] text-right w-full">
      <Frame12 />
      <Frame9 />
    </div>
  );
}

function Dot() {
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

function BadgeBase() {
  return (
    <div className="bg-[#fce9ea] content-stretch flex gap-[6px] items-center justify-center pl-[6px] pr-[8px] py-[2px] relative rounded-[16px] shrink-0" data-name="_Badge base">
      <Dot />
      <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#9d2e15] text-[12px] text-center whitespace-nowrap" dir="auto">
        غير موثق
      </p>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-center justify-end min-h-px min-w-px relative">
      <BadgeBase />
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#172e78] text-[18px] text-right whitespace-nowrap">
        <p className="leading-[1.5]" dir="auto">
          :
        </p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#717d96] text-[18px] text-right w-[120px]">
        <p className="leading-[1.5]" dir="auto">
          حالة الخطاب
        </p>
      </div>
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex flex-[1_0_0] font-['Almarai:Regular',sans-serif] gap-[10px] items-start justify-end leading-[0] min-h-px min-w-px not-italic relative text-[18px] text-right">
      <div className="flex flex-col justify-center relative shrink-0 text-[#2d3648] whitespace-nowrap">
        <p className="leading-[1.5]" dir="auto">
          5
        </p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#172e78] whitespace-nowrap">
        <p className="leading-[1.5]" dir="auto">
          :
        </p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#717d96] w-[120px]">
        <p className="leading-[1.5]" dir="auto">
          عدد الافراد
        </p>
      </div>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <Frame13 />
      <Frame14 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-white relative rounded-[20px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-col items-end justify-center size-full">
        <div className="content-stretch flex flex-col gap-[10px] items-end justify-center px-[24px] py-[16px] relative w-full">
          <Frame15 />
          <Frame16 />
          <Frame17 />
        </div>
      </div>
    </div>
  );
}

function Frame8() {
  return (
    <div className="bg-white relative rounded-[20px] shrink-0 w-full">
      <div className="flex flex-col items-end overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[24px] items-end px-[24px] py-[16px] relative w-full">
          <Frame18 />
          <Frame5 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-end justify-center relative shrink-0 w-full">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#2d3648] text-[18px] text-right w-full">
        <p className="leading-[1.5]" dir="auto">
          بيانات الافراد
        </p>
      </div>
      <div className="flex items-center justify-center relative shrink-0 w-full">
        <div className="flex-none rotate-180 w-full">
          <div className="h-0 relative w-full">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1064 1">
                <line id="Line 5" stroke="var(--stroke-0, #CBD2E0)" x2="1064" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
        </div>
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
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#717d96] text-[18px] text-right whitespace-nowrap" dir="auto">
        وحدة الالحاق
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

function TextAndSupportingText() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[16px] text-right whitespace-nowrap" dir="auto">
        ك ١١٣ صع
      </p>
    </div>
  );
}

function TableCell() {
  return (
    <div className="relative shrink-0 w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative w-full">
          <TextAndSupportingText />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[16px] text-right whitespace-nowrap" dir="auto">
        مج العمليات الخاصة
      </p>
    </div>
  );
}

function TableCell1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative w-full">
          <TextAndSupportingText1 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[16px] text-right whitespace-nowrap" dir="auto">
        س ١٤٥ اشارة
      </p>
    </div>
  );
}

function TableCell2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative w-full">
          <TextAndSupportingText2 />
        </div>
      </div>
    </div>
  );
}

function Column() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[170px]" data-name="Column">
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
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#717d96] text-[18px] text-right whitespace-nowrap" dir="auto">
        الوحدة
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
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TableHeader1 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[16px] text-right whitespace-nowrap" dir="auto">
        ك ١١٣ صع
      </p>
    </div>
  );
}

function TableCell3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative w-full">
          <TextAndSupportingText3 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[16px] text-right whitespace-nowrap" dir="auto">
        مج العمليات الخاصة
      </p>
    </div>
  );
}

function TableCell4() {
  return (
    <div className="relative shrink-0 w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative w-full">
          <TextAndSupportingText4 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[16px] text-right whitespace-nowrap" dir="auto">
        س ١٤٥ اشارة
      </p>
    </div>
  );
}

function TableCell5() {
  return (
    <div className="relative shrink-0 w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative w-full">
          <TextAndSupportingText5 />
        </div>
      </div>
    </div>
  );
}

function Column1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[170px]" data-name="Column">
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
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#717d96] text-[18px] text-right whitespace-nowrap" dir="auto">
        اسم
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
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative size-full">
          <TableHeader2 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText6() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[16px] text-right whitespace-nowrap" dir="auto">
        اسلام مجدى عبدالستار
      </p>
    </div>
  );
}

function TableCell6() {
  return (
    <div className="relative shrink-0 w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative w-full">
          <TextAndSupportingText6 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText7() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[16px] text-right whitespace-nowrap" dir="auto">
        احمد عادل عبدالستار
      </p>
    </div>
  );
}

function TableCell7() {
  return (
    <div className="relative shrink-0 w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative w-full">
          <TextAndSupportingText7 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText8() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[16px] text-right whitespace-nowrap" dir="auto">
        محمود اسلام عبدالله
      </p>
    </div>
  );
}

function TableCell8() {
  return (
    <div className="relative shrink-0 w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative w-full">
          <TextAndSupportingText8 />
        </div>
      </div>
    </div>
  );
}

function Column2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[184px]" data-name="Column">
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
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#717d96] text-[18px] text-right whitespace-nowrap" dir="auto">
        درجة
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

function TextAndSupportingText9() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[16px] text-right whitespace-nowrap" dir="auto">
        جندي
      </p>
    </div>
  );
}

function TableCell9() {
  return (
    <div className="relative shrink-0 w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative w-full">
          <TextAndSupportingText9 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText10() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[16px] text-right whitespace-nowrap" dir="auto">
        جندي
      </p>
    </div>
  );
}

function TableCell10() {
  return (
    <div className="relative shrink-0 w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative w-full">
          <TextAndSupportingText10 />
        </div>
      </div>
    </div>
  );
}

function TextAndSupportingText11() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text and supporting text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[16px] text-right whitespace-nowrap" dir="auto">
        مساعد أ
      </p>
    </div>
  );
}

function TableCell11() {
  return (
    <div className="relative shrink-0 w-full" data-name="Table cell">
      <div aria-hidden="true" className="absolute border-[#eaecf0] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[24px] py-[12px] relative w-full">
          <TextAndSupportingText11 />
        </div>
      </div>
    </div>
  );
}

function Column3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[102px]" data-name="Column">
      <TableHeaderCell3 />
      <TableCell9 />
      <TableCell10 />
      <TableCell11 />
    </div>
  );
}

function Content() {
  return (
    <div className="bg-white content-stretch flex items-start relative shrink-0 w-full" data-name="Content">
      <Column />
      <Column1 />
      <Column2 />
      <Column3 />
    </div>
  );
}

function Frame2() {
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

function Table() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-[626px]" data-name="Table">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <Content />
        <Frame2 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#eaecf0] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Frame22() {
  return (
    <div className="bg-white relative rounded-[20px] shrink-0 w-full">
      <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[24px] items-center px-[24px] py-[16px] relative w-full">
          <Frame20 />
          <Table />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-end justify-center relative shrink-0 w-full">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#2d3648] text-[18px] text-right w-full">
        <p className="leading-[1.5]" dir="auto">
          صورة الخطاب
        </p>
      </div>
      <div className="flex items-center justify-center relative shrink-0 w-full">
        <div className="flex-none rotate-180 w-full">
          <div className="h-0 relative w-full">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1064 1">
                <line id="Line 5" stroke="var(--stroke-0, #CBD2E0)" x2="1064" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UndrawNoDataIg() {
  return (
    <div className="h-[94px] overflow-clip relative shrink-0 w-[96px]" data-name="undraw_no-data_ig65 1">
      <div className="absolute inset-[4.46%_36.52%_11.56%_6.04%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 55.1419 78.94">
          <path d={svgPaths.p17efdec0} fill="var(--fill-0, #EBEDFD)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[0_30.54%_7.1%_0]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 66.679 87.324">
          <path d={svgPaths.p2927bb00} fill="var(--fill-0, #172E78)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[2.2%_52.5%_79.78%_15.56%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30.6569 16.9413">
          <path d={svgPaths.p31c24200} fill="url(#paint0_linear_46_5211)" id="Vector" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_46_5211" x1="15.3284" x2="15.3284" y1="-3.40834e-09" y2="16.9413">
              <stop stopColor="#00B867" />
              <stop offset="1" stopColor="#00522E" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute inset-[0.78%_67.55%_92.89%_26.27%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.92925 5.94773">
          <path d={svgPaths.p1601cd80} fill="url(#paint0_linear_46_5209)" id="Vector" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_46_5209" x1="2.96463" x2="2.96463" y1="0" y2="5.94773">
              <stop stopColor="#00B867" />
              <stop offset="1" stopColor="#00522E" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute inset-[1.94%_68.68%_94.05%_27.41%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.75459 3.76629">
          <path d={svgPaths.p3209ab00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[25.34%_5.64%_7.91%_39.55%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 52.6221 62.7486">
          <path d={svgPaths.p3c7b1200} fill="var(--fill-0, #EBEDFD)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[38.82%_10.92%_16.47%_45.4%] overflow-clip" data-name="Menu / Close_LG">
        <div className="absolute inset-[8.33%]" data-name="Vector (Stroke)">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 34.9426 35.0197">
            <path clipRule="evenodd" d={svgPaths.p19bf6a80} fill="url(#paint0_linear_46_5213)" fillRule="evenodd" id="Vector (Stroke)" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_46_5213" x1="17.4713" x2="17.4713" y1="2.23517e-08" y2="35.0197">
                <stop stopColor="#00B867" />
                <stop offset="1" stopColor="#00522E" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div className="absolute inset-[22.17%_0_0_33.91%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 63.443 73.1571">
          <path d={svgPaths.p1fd58200} fill="var(--fill-0, #172E78)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[19.33%_17.45%_70.87%_51.36%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 29.9427 9.21898">
          <path d={svgPaths.pc632600} fill="url(#paint0_linear_46_5223)" id="Vector" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_46_5223" x1="14.9714" x2="14.9714" y1="0" y2="9.21898">
              <stop stopColor="#00B867" />
              <stop offset="1" stopColor="#00522E" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute inset-[13.47%_29.96%_80.2%_63.87%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.92925 5.94773">
          <path d={svgPaths.p1601cd80} fill="url(#paint0_linear_46_5209)" id="Vector" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_46_5209" x1="2.96463" x2="2.96463" y1="0" y2="5.94773">
              <stop stopColor="#00B867" />
              <stop offset="1" stopColor="#00522E" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute inset-[14.71%_31.16%_81.44%_65.08%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.61147 3.62272">
          <path d={svgPaths.p18cf3e70} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Upload() {
  return (
    <div className="relative shrink-0 size-[42px]" data-name="upload">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 42 42">
        <g clipPath="url(#clip0_46_5191)" id="upload">
          <path d={svgPaths.p314c7100} fill="var(--fill-0, #EBEDFD)" id="Vector" />
          <path d={svgPaths.p35280000} fill="var(--fill-0, #1F3D97)" id="Vector_2" />
          <path d={svgPaths.p3df5b40} fill="var(--fill-0, #476AE9)" id="Vector_3" />
          <path d={svgPaths.p29f9a900} fill="var(--fill-0, #294DBB)" id="Vector_4" />
          <path d={svgPaths.pa5d1a00} fill="var(--fill-0, #D4D8FA)" id="Vector_5" />
          <path d={svgPaths.p1f5a2600} fill="var(--fill-0, #ABB5F5)" id="Vector_6" />
          <path d={svgPaths.p51e4400} fill="var(--fill-0, #7D8FF0)" id="Vector_7" />
          <path d={svgPaths.p27eafc00} fill="var(--fill-0, #476AE9)" id="Vector_8" />
        </g>
        <defs>
          <clipPath id="clip0_46_5191">
            <rect fill="white" height="42" width="42" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="text">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#2d3648] text-[14px] whitespace-nowrap">اسحب الملف هنا أو تصفح</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-full">
      <Text />
      <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[201px]" data-name="Divider">
        <div className="bg-[#e7e7e7] flex-[1_0_0] h-[0.971px] min-h-px min-w-px" data-name="line 1" />
        <p className="font-['Almarai:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#717d96] text-[12px] text-center whitespace-nowrap">أو</p>
        <div className="bg-[#e7e7e7] flex-[1_0_0] h-[0.971px] min-h-px min-w-px" data-name="line 2" />
      </div>
      <div className="content-stretch flex items-start relative shrink-0" data-name="button: rounded/ outline">
        <div className="bg-[#f7f9fc] content-stretch flex gap-[8px] items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-name="master/ outline button">
          <div aria-hidden="true" className="absolute border border-[#294dbb] border-solid inset-0 pointer-events-none rounded-[8px]" />
          <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#294dbb] text-[12px] whitespace-nowrap">
            <p className="leading-[1.5]">تصفح الملفات</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeftIcon() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Left Icon">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f5f5f5] text-[16px] text-right whitespace-nowrap">
        <p className="leading-[1.5]">حفظ التعديلات</p>
      </div>
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full">
      <div className="bg-gradient-to-b content-stretch flex from-[#00b867] gap-[4px] items-center justify-center min-h-[52px] px-[20px] py-[12px] relative rounded-[8px] shrink-0 to-[#00522e] w-[450px]" data-name="Buttons">
        <LeftIcon />
      </div>
    </div>
  );
}

function Frame23() {
  return (
    <div className="bg-white relative rounded-[20px] shrink-0 w-full">
      <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[24px] items-center px-[24px] py-[16px] relative w-full">
          <Frame21 />
          <UndrawNoDataIg />
          <div className="flex flex-col font-['Almarai:Bold','Noto_Sans:Bold',sans-serif] justify-center leading-[0] min-w-full relative shrink-0 text-[#2d3648] text-[24px] text-center w-[min-content] whitespace-pre-wrap" style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100, 'wght' 600" }}>
            <p className="leading-[1.5] mb-0" dir="auto">{`هذا الخطاب غير موثق حتى الآن. `}</p>
            <p className="leading-[1.5]" dir="auto">
              يرجى رفع النسخة المصدق عليها لاستكمال الإجراءات.
            </p>
          </div>
          <div className="bg-white content-stretch flex flex-col gap-[12px] items-center justify-center p-[24px] relative rounded-[8px] shrink-0 w-[450px]" data-name="upload: drag upload">
            <div aria-hidden="true" className="absolute border border-[#2d3648] border-dashed inset-0 pointer-events-none rounded-[8px]" />
            <Upload />
            <Frame />
          </div>
          <Frame24 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
    </div>
  );
}

function Frame7() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-end size-full">
        <div className="content-stretch flex flex-col gap-[24px] items-end p-[24px] relative w-full">
          <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[32px] text-center w-full" dir="auto">
            بيانات الخطاب
          </p>
          <Frame8 />
          <Frame22 />
          <Frame23 />
        </div>
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative">
      <Header />
      <Frame7 />
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
        <g clipPath="url(#clip0_46_3238)" id="Logo">
          <path clipRule="evenodd" d={svgPaths.pb82c00} fill="url(#paint0_linear_46_3238)" fillRule="evenodd" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p9a9cd00} fill="url(#paint1_linear_46_3238)" fillRule="evenodd" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_46_3238" x1="16" x2="16" y1="0" y2="32">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_46_3238" x1="8" x2="8" y1="0" y2="16">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <clipPath id="clip0_46_3238">
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

function Group() {
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
        <Group />
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

function Group1() {
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
        <Group1 />
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

function Frame1() {
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

function Group2() {
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
        <Group2 />
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

function Group3() {
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
        <Group3 />
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

function Group4() {
  return (
    <div className="absolute inset-[0.1%_3.03%_-0.1%_3.03%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.7875 20">
        <g id="Group">
          <path d={svgPaths.p373ddfa0} fill="url(#paint0_linear_46_3245)" id="Vector" />
          <path d={svgPaths.p21b0d30} fill="url(#paint1_linear_46_3245)" id="Vector_2" />
          <path d={svgPaths.p21fcb600} fill="var(--fill-0, #717D96)" id="Vector_3" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_46_3245" x1="8.79631" x2="8.79631" y1="0" y2="19.7747">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_46_3245" x1="11.2056" x2="11.2056" y1="5.20117" y2="20">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Icon5() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group4 />
      </div>
    </div>
  );
}

function Inner6() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#2d3648] text-[16px] text-right">
        <p className="leading-[1.5]">سجل الخطابات</p>
      </div>
      <Icon5 />
    </div>
  );
}

function Group5() {
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
        <Group5 />
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

function Group6() {
  return (
    <div className="absolute inset-[9.37%_9.38%_9.37%_13.54%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.4167 16.25">
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
        <Group6 />
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
        <div className="h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
          <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
              <Inner1 />
            </div>
          </div>
        </div>
        <Frame1 />
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
        <div className="bg-[#ebedfd] h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
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

function Group7() {
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
        <Group7 />
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

function Group8() {
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
        <Group8 />
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

function Group9() {
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
        <Group9 />
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

function Group10() {
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
        <Group10 />
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

function Frame3() {
  return (
    <div className="absolute content-stretch flex items-start justify-end right-0 top-0 w-[1440px]">
      <Frame6 />
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
    <div className="bg-[#f7f9fc] relative size-full" data-name="سجل الخطابات(بيانات الخطاب-غير موثق)">
      <Frame3 />
    </div>
  );
}