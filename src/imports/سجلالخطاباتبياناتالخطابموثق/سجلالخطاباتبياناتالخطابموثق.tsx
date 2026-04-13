import svgPaths from "./svg-xqtl0c29ab";
import imgBigShoesAvatar from "./8b9f86452ff0e90495bf9daf1494dd6920ad538a.png";
import imgImage1 from "./af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";

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

function Frame3() {
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
      <Frame3 />
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

function Frame17() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-end justify-center relative shrink-0 w-full">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#2d3648] text-[18px] text-right w-full">
        <p className="leading-[1.5]" dir="auto">
          بيانات الخطاب
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

function Frame10() {
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

function Frame9() {
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

function Frame14() {
  return (
    <div className="content-stretch flex font-['Almarai:Regular',sans-serif] gap-[10px] items-start leading-[0] not-italic relative shrink-0 text-[18px] text-right w-full">
      <Frame10 />
      <Frame9 />
    </div>
  );
}

function Frame11() {
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

function Frame8() {
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

function Frame15() {
  return (
    <div className="content-stretch flex font-['Almarai:Regular',sans-serif] gap-[10px] items-start leading-[0] not-italic relative shrink-0 text-[18px] text-right w-full">
      <Frame11 />
      <Frame8 />
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
        موثق
      </p>
    </div>
  );
}

function Frame12() {
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

function Frame13() {
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

function Frame16() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <Frame12 />
      <Frame13 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-white relative rounded-[20px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <div className="flex flex-col items-end justify-center size-full">
        <div className="content-stretch flex flex-col gap-[10px] items-end justify-center px-[24px] py-[16px] relative w-full">
          <Frame14 />
          <Frame15 />
          <Frame16 />
        </div>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-white relative rounded-[20px] shrink-0 w-full">
      <div className="flex flex-col items-end overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[24px] items-end px-[24px] py-[16px] relative w-full">
          <Frame17 />
          <Frame4 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
    </div>
  );
}

function Frame18() {
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

function Frame1() {
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
        <Frame1 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#eaecf0] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Frame20() {
  return (
    <div className="bg-white relative rounded-[20px] shrink-0 w-full">
      <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[24px] items-center px-[24px] py-[16px] relative w-full">
          <Frame18 />
          <Table />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
    </div>
  );
}

function Frame19() {
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

function Frame30() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <div className="h-[87px] relative shrink-0 w-[70px]" data-name="image 1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[122.24%] left-[-26.64%] max-w-none top-[-17.66%] w-[152.22%]" src={imgImage1} />
        </div>
      </div>
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.6]" dir="auto">
          قيادة قوات الصاعقـــــــة
          <br aria-hidden="true" />
          فرع التنظيــــــم والإدارة
          <br aria-hidden="true" />
          التاريخ: ٢٠٢٦/٠٢/٢٦
        </p>
      </div>
    </div>
  );
}

function Frame31() {
  return (
    <div className="content-stretch flex flex-col font-['Arial:Bold',sans-serif] gap-[8px] items-center leading-[0] not-italic relative shrink-0 text-black w-full">
      <div className="flex flex-col justify-center relative shrink-0 text-[18px] text-center w-full">
        <p className="[text-decoration-skip-ink:none] decoration-[15%] decoration-solid leading-[1.6] underline" dir="auto">
          إلي / مج العمليات الخاصة
        </p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[16px] text-right w-full">
        <p className="leading-[1.6]" dir="auto">
          قادم لكم اليوم ٢٠٢٦/٠٢/٢٦ الافراد المذكور اسمائهم بعد بمهماتهم وملبوساتهم الأميرية وذلك دعم للعمل (مأمورية تدريبية) بالاماكن الموضحة قرين كلا منهم وذلك بناءً علي أوامر رئيس الأركان وبياناتهم كالأتي:
        </p>
      </div>
    </div>
  );
}

function Frame26() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div aria-hidden="true" className="absolute border border-black border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative w-full">
          <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
            <p className="leading-[1.2]" dir="auto">
              ملاحظات
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[120px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          الوحده
        </p>
      </div>
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[200px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          الاسم
        </p>
      </div>
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[56px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          درجة
        </p>
      </div>
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[25px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center w-full">
        <p className="leading-[1.2]" dir="auto">
          م
        </p>
      </div>
    </div>
  );
}

function Frame27() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
      <Frame26 />
      <Frame25 />
      <Frame24 />
      <Frame23 />
      <Frame22 />
    </div>
  );
}

function Frame29() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div aria-hidden="true" className="absolute border border-black border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative w-full">
          <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[transparent] text-right whitespace-nowrap">
            <p className="leading-[1.2]" dir="auto">
              ملاحظات
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame32() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[120px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          فرع التنظيم والإدارة
        </p>
      </div>
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[200px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          اسلام مجدي عبدالستار السيد
        </p>
      </div>
    </div>
  );
}

function Frame37() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[56px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          مساعد أ
        </p>
      </div>
    </div>
  );
}

function Frame40() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[25px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          ٠١
        </p>
      </div>
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
      <Frame29 />
      <Frame32 />
      <Frame33 />
      <Frame37 />
      <Frame40 />
    </div>
  );
}

function Frame42() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div aria-hidden="true" className="absolute border border-black border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative w-full">
          <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[transparent] text-right whitespace-nowrap">
            <p className="leading-[1.2]" dir="auto">
              ملاحظات
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame43() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[120px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          فرع التنظيم والإدارة
        </p>
      </div>
    </div>
  );
}

function Frame44() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[200px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          اسلام مجدي عبدالستار السيد
        </p>
      </div>
    </div>
  );
}

function Frame45() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[56px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          مساعد أ
        </p>
      </div>
    </div>
  );
}

function Frame46() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[25px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          ٠٢
        </p>
      </div>
    </div>
  );
}

function Frame41() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-black border-solid inset-0 pointer-events-none" />
      <Frame42 />
      <Frame43 />
      <Frame44 />
      <Frame45 />
      <Frame46 />
    </div>
  );
}

function Frame38() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame27 />
      <Frame28 />
      <Frame41 />
    </div>
  );
}

function Frame47() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-center whitespace-nowrap">
        <p className="leading-[1.6]" dir="auto">
          مع وافر التحية ،،،
        </p>
      </div>
    </div>
  );
}

function Frame48() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.6] whitespace-pre" dir="auto">
          {`التوقيع (                   )`}
          <br aria-hidden="true" />
          عقيد/محمد سمير عبدالغني
          <br aria-hidden="true" />
          رئيس فرع التنظيم والإدارة
        </p>
      </div>
    </div>
  );
}

function Frame39() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <Frame31 />
      <Frame38 />
      <Frame47 />
      <Frame48 />
    </div>
  );
}

function Frame36() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <Frame30 />
      <Frame39 />
    </div>
  );
}

function Frame50() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <div className="h-[87px] relative shrink-0 w-[70px]" data-name="image 1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[122.24%] left-[-26.64%] max-w-none top-[-17.66%] w-[152.22%]" src={imgImage1} />
        </div>
      </div>
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.6]" dir="auto">
          قيادة قوات الصاعقـــــــة
          <br aria-hidden="true" />
          فرع التنظيــــــم والإدارة
          <br aria-hidden="true" />
          التاريخ: ٢٠٢٦/٠٢/٢٦
        </p>
      </div>
    </div>
  );
}

function Frame52() {
  return (
    <div className="content-stretch flex flex-col font-['Arial:Bold',sans-serif] gap-[8px] items-center leading-[0] not-italic relative shrink-0 text-black w-full">
      <div className="flex flex-col justify-center relative shrink-0 text-[18px] text-center w-full">
        <p className="[text-decoration-skip-ink:none] decoration-[15%] decoration-solid leading-[1.6] underline" dir="auto">
          إلي / مج العمليات الخاصة
        </p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[16px] text-right w-full">
        <p className="leading-[1.6]" dir="auto">
          قادم لكم اليوم ٢٠٢٦/٠٢/٢٦ الافراد المذكور اسمائهم بعد بمهماتهم وملبوساتهم الأميرية وذلك دعم للعمل (مأمورية تدريبية) بالاماكن الموضحة قرين كلا منهم وذلك بناءً علي أوامر رئيس الأركان وبياناتهم كالأتي:
        </p>
      </div>
    </div>
  );
}

function Frame55() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div aria-hidden="true" className="absolute border border-black border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative w-full">
          <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
            <p className="leading-[1.2]" dir="auto">
              ملاحظات
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame56() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[120px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          الوحده
        </p>
      </div>
    </div>
  );
}

function Frame57() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[200px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          الاسم
        </p>
      </div>
    </div>
  );
}

function Frame58() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[56px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          درجة
        </p>
      </div>
    </div>
  );
}

function Frame59() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[25px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center w-full">
        <p className="leading-[1.2]" dir="auto">
          م
        </p>
      </div>
    </div>
  );
}

function Frame54() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
      <Frame55 />
      <Frame56 />
      <Frame57 />
      <Frame58 />
      <Frame59 />
    </div>
  );
}

function Frame61() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div aria-hidden="true" className="absolute border border-black border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative w-full">
          <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[transparent] text-right whitespace-nowrap">
            <p className="leading-[1.2]" dir="auto">
              ملاحظات
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame62() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[120px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          فرع التنظيم والإدارة
        </p>
      </div>
    </div>
  );
}

function Frame63() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[200px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          اسلام مجدي عبدالستار السيد
        </p>
      </div>
    </div>
  );
}

function Frame64() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[56px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          مساعد أ
        </p>
      </div>
    </div>
  );
}

function Frame65() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[25px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          ٠١
        </p>
      </div>
    </div>
  );
}

function Frame60() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
      <Frame61 />
      <Frame62 />
      <Frame63 />
      <Frame64 />
      <Frame65 />
    </div>
  );
}

function Frame67() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div aria-hidden="true" className="absolute border border-black border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative w-full">
          <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[transparent] text-right whitespace-nowrap">
            <p className="leading-[1.2]" dir="auto">
              ملاحظات
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame68() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[120px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          فرع التنظيم والإدارة
        </p>
      </div>
    </div>
  );
}

function Frame69() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[200px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          اسلام مجدي عبدالستار السيد
        </p>
      </div>
    </div>
  );
}

function Frame70() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[56px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          مساعد أ
        </p>
      </div>
    </div>
  );
}

function Frame71() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center px-[8px] py-[4px] relative shrink-0 w-[25px]">
      <div aria-hidden="true" className="absolute border-b border-black border-r border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center whitespace-nowrap">
        <p className="leading-[1.2]" dir="auto">
          ٠٢
        </p>
      </div>
    </div>
  );
}

function Frame66() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-black border-solid inset-0 pointer-events-none" />
      <Frame67 />
      <Frame68 />
      <Frame69 />
      <Frame70 />
      <Frame71 />
    </div>
  );
}

function Frame53() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame54 />
      <Frame60 />
      <Frame66 />
    </div>
  );
}

function Frame72() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-center whitespace-nowrap">
        <p className="leading-[1.6]" dir="auto">
          مع وافر التحية ،،،
        </p>
      </div>
    </div>
  );
}

function Frame73() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <div className="flex flex-col font-['Arial:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-right whitespace-nowrap">
        <p className="leading-[1.6] whitespace-pre" dir="auto">
          {`التوقيع (                   )`}
          <br aria-hidden="true" />
          عقيد/محمد سمير عبدالغني
          <br aria-hidden="true" />
          رئيس فرع التنظيم والإدارة
        </p>
      </div>
    </div>
  );
}

function Frame51() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <Frame52 />
      <Frame53 />
      <Frame72 />
      <Frame73 />
    </div>
  );
}

function Frame49() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <Frame50 />
      <Frame51 />
    </div>
  );
}

function Frame35() {
  return (
    <div className="h-[810px] relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-black border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col items-end size-full">
        <div className="content-stretch flex flex-col gap-[7px] items-end p-[12px] relative size-full">
          <Frame36 />
          <div className="h-0 relative shrink-0 w-full">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 539 1">
                <line id="Line 13" stroke="var(--stroke-0, black)" x2="539" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
          <Frame49 />
        </div>
      </div>
    </div>
  );
}

function Frame34() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex flex-col h-[842px] items-end left-1/2 p-[16px] top-0 w-[595px]">
      <Frame35 />
    </div>
  );
}

function A() {
  return (
    <div className="bg-white h-[842px] overflow-clip relative shrink-0 w-[595px]" data-name="A4 - 1">
      <Frame34 />
    </div>
  );
}

function LeftIcon() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Left Icon">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f5f5f5] text-[16px] text-right whitespace-nowrap">
        <p className="leading-[1.5]">طباعة نسخة الخطاب</p>
      </div>
    </div>
  );
}

function Frame74() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full">
      <div className="bg-gradient-to-b content-stretch flex from-[#00b867] gap-[4px] items-center justify-center min-h-[52px] px-[20px] py-[12px] relative rounded-[8px] shrink-0 to-[#00522e] w-[450px]" data-name="Buttons">
        <LeftIcon />
      </div>
    </div>
  );
}

function Frame21() {
  return (
    <div className="bg-white relative rounded-[20px] shrink-0 w-full">
      <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[24px] items-center px-[24px] py-[16px] relative w-full">
          <Frame19 />
          <A />
          <Frame74 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
    </div>
  );
}

function Frame6() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-end size-full">
        <div className="content-stretch flex flex-col gap-[24px] items-end p-[24px] relative w-full">
          <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#2d3648] text-[32px] text-center w-full" dir="auto">
            بيانات الخطاب
          </p>
          <Frame7 />
          <Frame20 />
          <Frame21 />
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative">
      <Header />
      <Frame6 />
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

function Frame() {
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
        <Frame />
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

function Frame2() {
  return (
    <div className="absolute content-stretch flex items-start justify-end right-0 top-0 w-[1440px]">
      <Frame5 />
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
    <div className="bg-[#f7f9fc] relative size-full" data-name="سجل الخطابات (بيانات الخطاب - موثق)">
      <Frame2 />
    </div>
  );
}