import svgPaths from "./svg-aa53ap9d99";
import imgBigShoesAvatar from "./8b9f86452ff0e90495bf9daf1494dd6920ad538a.png";
import imgFrame1261155625 from "./0b415e099a9a0d48863970a33cf2c018036bb031.png";

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

function Frame9() {
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
      <Frame9 />
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
              <p className="leading-[1.5]">اضافة قوة جديدة</p>
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

function Icon() {
  return (
    <div className="absolute left-0 size-[32px] top-0" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g clipPath="url(#clip0_3_6290)" id="Icon">
          <circle cx="16" cy="16" fill="url(#paint0_linear_3_6290)" id="Circle" r="15" stroke="url(#paint1_linear_3_6290)" strokeWidth="2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_3_6290" x1="16" x2="16" y1="0" y2="32">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_3_6290" x1="16" x2="16" y1="0" y2="32">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <clipPath id="clip0_3_6290">
            <rect fill="white" height="32" width="32" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function IconActionCheck() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%-0.5px)] size-[24px] top-1/2" data-name="Icon/Action/check">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon/Action/check">
          <path d={svgPaths.p3d614b00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute left-0 size-[32px] top-0" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g clipPath="url(#clip0_3_6290)" id="Icon">
          <circle cx="16" cy="16" fill="url(#paint0_linear_3_6290)" id="Circle" r="15" stroke="url(#paint1_linear_3_6290)" strokeWidth="2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_3_6290" x1="16" x2="16" y1="0" y2="32">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_3_6290" x1="16" x2="16" y1="0" y2="32">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <clipPath id="clip0_3_6290">
            <rect fill="white" height="32" width="32" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function IconActionCheck1() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%-0.5px)] size-[24px] top-1/2" data-name="Icon/Action/check">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon/Action/check">
          <path d={svgPaths.p3d614b00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Icon2() {
  return (
    <div className="absolute left-0 size-[32px] top-0" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g clipPath="url(#clip0_3_6290)" id="Icon">
          <circle cx="16" cy="16" fill="url(#paint0_linear_3_6290)" id="Circle" r="15" stroke="url(#paint1_linear_3_6290)" strokeWidth="2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_3_6290" x1="16" x2="16" y1="0" y2="32">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_3_6290" x1="16" x2="16" y1="0" y2="32">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <clipPath id="clip0_3_6290">
            <rect fill="white" height="32" width="32" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function IconActionCheck2() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%-0.5px)] size-[24px] top-1/2" data-name="Icon/Action/check">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon/Action/check">
          <path d={svgPaths.p3d614b00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function StepperHorizontal() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-name="Stepper Horizontal">
      <div className="h-[58px] relative shrink-0 w-[32px]" data-name="Step Text - Horizontal">
        <div className="absolute left-0 size-[32px] top-0" data-name="Step Symbol">
          <Icon />
          <IconActionCheck />
        </div>
        <p className="-translate-x-1/2 absolute bg-clip-text bg-gradient-to-b font-['Almarai:Bold',sans-serif] from-[#00b867] leading-[1.4] left-[16px] not-italic text-[14px] text-[transparent] text-center to-[#00522e] top-[42px] whitespace-nowrap">الحفظ النهائي</p>
      </div>
      <div className="content-stretch flex gap-[3px] h-[32px] items-center overflow-clip relative shrink-0 w-[80px]" data-name="Step Trail">
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
      </div>
      <div className="h-[58px] relative shrink-0 w-[32px]" data-name="Step Text - Horizontal">
        <div className="absolute left-0 size-[32px] top-0" data-name="Step Symbol">
          <Icon1 />
          <IconActionCheck1 />
        </div>
        <p className="-translate-x-1/2 absolute bg-clip-text bg-gradient-to-b font-['Almarai:Bold',sans-serif] from-[#00b867] leading-[1.4] left-[16px] not-italic text-[14px] text-[transparent] text-center to-[#00522e] top-[42px] whitespace-nowrap">المراجعة</p>
      </div>
      <div className="content-stretch flex gap-[3px] h-[32px] items-center overflow-clip relative shrink-0 w-[80px]" data-name="Step Trail">
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
        <div className="relative shrink-0 size-[3px]" data-name="circle">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
            <circle cx="1.5" cy="1.5" fill="var(--fill-0, #2D3648)" id="circle" r="1.5" />
          </svg>
        </div>
      </div>
      <div className="h-[58px] relative shrink-0 w-[32px]" data-name="Step Text - Horizontal">
        <div className="absolute left-0 size-[32px] top-0" data-name="Step Symbol">
          <Icon2 />
          <IconActionCheck2 />
        </div>
        <p className="-translate-x-1/2 absolute bg-clip-text bg-gradient-to-b font-['Almarai:Bold',sans-serif] from-[#00b867] leading-[1.4] left-[16px] not-italic text-[14px] text-[transparent] text-center to-[#00522e] top-[42px] whitespace-nowrap">رفع البيانات</p>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[3.13%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 90 90">
        <g id="Group">
          <path d={svgPaths.p1bae7800} fill="url(#paint0_linear_3_6730)" id="Vector" />
          <path d={svgPaths.p37dfa000} fill="var(--fill-0, #FFFCEE)" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_3_6730" x1="45" x2="45" y1="0" y2="90">
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

function Frame17() {
  return (
    <div className="content-stretch flex h-[200px] items-end justify-center relative shrink-0 w-[270px]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[103.47%] left-0 max-w-none top-0 w-full" src={imgFrame1261155625} />
      </div>
      <Frame />
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute inset-[28.77%_28.34%_27.9%_28.33%] overflow-clip" data-name="Frame">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 12.9999">
        <g id="Group">
          <path d={svgPaths.p385865c0} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents inset-[3.13%]" data-name="Group">
      <div className="absolute inset-[3.13%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28.125 28.125">
          <path d={svgPaths.p38f04c00} fill="var(--fill-0, #29BBD4)" id="Vector" />
        </svg>
      </div>
      <Frame2 />
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

function SmallGraph() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-end leading-[0] min-h-px min-w-px not-italic relative text-right" data-name="Small Graph">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center min-w-full relative shrink-0 text-[#146d7c] text-[20px] w-[min-content]">
        <p className="leading-[1.5]">20</p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          بيانات تم تحديثها
        </p>
      </div>
    </div>
  );
}

function Frame15() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[16px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-end px-[24px] py-[12px] relative w-full">
          <Frame1 />
          <SmallGraph />
        </div>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute inset-[3.13%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28.125 28.125">
        <g id="Group">
          <path d={svgPaths.p38f04c00} fill="url(#paint0_linear_4_9420)" id="Vector" />
          <path d={svgPaths.pdad2100} fill="var(--fill-0, #FFFCEE)" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_4_9420" x1="14.0625" x2="14.0625" y1="0" y2="28.125">
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
      <Group2 />
    </div>
  );
}

function SmallGraph1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-end leading-[0] min-h-px min-w-px not-italic relative text-right" data-name="Small Graph">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center min-w-full relative shrink-0 text-[#2d3648] text-[20px] w-[min-content]">
        <p className="leading-[1.5]">180</p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          أفراد تمت اضافتهم
        </p>
      </div>
    </div>
  );
}

function Frame13() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[16px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-end px-[24px] py-[12px] relative w-full">
          <Frame3 />
          <SmallGraph1 />
        </div>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute inset-[12.5%_0]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 22.5">
        <g id="Group">
          <path d={svgPaths.p24391d00} fill="var(--fill-0, #2D3648)" id="Vector" />
          <path d={svgPaths.p2f932980} fill="var(--fill-0, #2D3648)" id="Vector_2" />
          <path d={svgPaths.p3a06cf00} fill="var(--fill-0, #2D3648)" id="Vector_3" />
          <path d={svgPaths.p23b55080} fill="var(--fill-0, #2D3648)" id="Vector_4" />
          <path d={svgPaths.p4eff300} fill="var(--fill-0, #2D3648)" id="Vector_5" />
          <path d={svgPaths.p32f2a500} fill="var(--fill-0, #2D3648)" id="Vector_6" />
        </g>
      </svg>
    </div>
  );
}

function Frame4() {
  return (
    <div className="overflow-clip relative shrink-0 size-[30px]" data-name="Frame">
      <Group3 />
    </div>
  );
}

function SmallGraph2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-end leading-[0] min-h-px min-w-px not-italic relative text-right" data-name="Small Graph">
      <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center min-w-full relative shrink-0 text-[#2d3648] text-[20px] w-[min-content]">
        <p className="leading-[1.5]">200</p>
      </div>
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center relative shrink-0 text-[#717d96] text-[14px] whitespace-nowrap">
        <p className="leading-[1.4]" dir="auto">
          اجمالي الافراد بالكشف
        </p>
      </div>
    </div>
  );
}

function Frame14() {
  return (
    <div className="bg-white flex-[1_0_0] min-h-px min-w-px relative rounded-[16px]">
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-end px-[24px] py-[12px] relative w-full">
          <Frame4 />
          <SmallGraph2 />
        </div>
      </div>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <Frame15 />
      <Frame13 />
      <Frame14 />
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#4a5468] text-[14px] text-right whitespace-nowrap" dir="auto">
        10 : 30 ص
      </p>
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Calendar / Clock">
        <div className="absolute inset-[8.33%]" data-name="Vector (Stroke)">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <path clipRule="evenodd" d={svgPaths.p1859a80} fill="var(--fill-0, #A0ABC0)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#4a5468] text-[14px] text-right whitespace-nowrap" dir="auto">
        2025 - 08 - 20
      </p>
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Calendar / Calendar_Days">
        <div className="absolute inset-[4.17%_12.5%_12.5%_12.5%]" data-name="Vector (Stroke)">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 20">
            <path clipRule="evenodd" d={svgPaths.p17b2f700} fill="var(--fill-0, #A0ABC0)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <p className="blur-[7px] font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#4a5468] text-[14px] text-right whitespace-nowrap" dir="auto">
        جندي / اسلام مجدى عبدالستار
      </p>
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="User / User_02">
        <div className="absolute inset-[8.33%_12.5%]" data-name="Vector (Stroke)">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 20">
            <path clipRule="evenodd" d={svgPaths.p15ee0d00} fill="var(--fill-0, #A0ABC0)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame21() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[12px]">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[10px] h-full items-center p-[12px] relative">
          <Frame20 />
          <div className="flex h-[12px] items-center justify-center relative shrink-0 w-0" style={{ "--transform-inner-width": "1185", "--transform-inner-height": "21" } as React.CSSProperties}>
            <div className="flex-none rotate-90">
              <div className="h-0 relative w-[12px]">
                <div className="absolute inset-[-1px_0_0_0]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 1">
                    <line id="Line 7" stroke="var(--stroke-0, #CBD2E0)" x2="12" y1="0.5" y2="0.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <Frame19 />
          <div className="flex h-[12px] items-center justify-center relative shrink-0 w-0" style={{ "--transform-inner-width": "1185", "--transform-inner-height": "21" } as React.CSSProperties}>
            <div className="flex-none rotate-90">
              <div className="h-0 relative w-[12px]">
                <div className="absolute inset-[-1px_0_0_0]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 1">
                    <line id="Line 7" stroke="var(--stroke-0, #CBD2E0)" x2="12" y1="0.5" y2="0.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <Frame18 />
        </div>
      </div>
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-end min-h-px min-w-px relative">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#4a5468] text-[14px] text-right whitespace-nowrap" dir="auto">
        المستخدم الحالي
      </p>
      <Frame21 />
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start leading-[1.5] min-h-px min-w-px not-italic relative text-[12px] text-right" data-name="text">
      <p className="blur-[7px] font-['Almarai:Bold',sans-serif] relative shrink-0 text-[#2d3648] w-full" dir="auto">
        س 145 اشارة .xlsx
      </p>
      <p className="font-['Almarai:Regular',sans-serif] relative shrink-0 text-[#a0abc0] w-full">5.3MB</p>
    </div>
  );
}

function Layer() {
  return (
    <div className="absolute contents inset-0" data-name="Layer 2">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27.8982 35">
        <g id="Microsoft Excel file">
          <path d={svgPaths.p34bff180} fill="var(--fill-0, #00A649)" id="Vector" />
          <path d={svgPaths.pc0e6a80} fill="var(--fill-0, #05DB5C)" id="Vector_2" />
          <path d={svgPaths.p29c74180} fill="var(--fill-0, #E7E7E9)" id="Vector_3" />
          <path d={svgPaths.p2198aa00} fill="var(--fill-0, #A3A2A3)" id="Vector_4" />
          <path d={svgPaths.pf49c300} fill="var(--fill-0, #E7E7E9)" id="Vector_5" />
          <g id="Group">
            <path d={svgPaths.p2f546e00} fill="var(--fill-0, white)" id="Vector_6" />
            <path d={svgPaths.p2f710400} fill="var(--fill-0, white)" id="Vector_7" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents inset-0" data-name="Group">
      <Layer />
    </div>
  );
}

function Frame6() {
  return (
    <div className="h-[35px] overflow-clip relative shrink-0 w-[27.9px]" data-name="Frame">
      <Group4 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
      <p className="bg-clip-text bg-gradient-to-b font-['Almarai:Regular',sans-serif] from-[#00b867] leading-[1.5] not-italic relative shrink-0 text-[16px] text-[transparent] to-[#00522e] whitespace-nowrap" dir="auto">
        تحميل الملف
      </p>
      <Text />
      <Frame6 />
    </div>
  );
}

function UploadUploadUrl() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start p-[16px] relative rounded-[12px] shrink-0 w-[350px]" data-name="upload: upload URL">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Frame5 />
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-end min-h-px min-w-px relative">
      <p className="font-['Almarai:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#4a5468] text-[14px] text-right whitespace-nowrap" dir="auto">
        الملف المعتمد
      </p>
      <UploadUploadUrl />
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex gap-[16px] h-[98px] items-center justify-end relative shrink-0 w-full">
      <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
        <Frame24 />
      </div>
      <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
        <Frame25 />
      </div>
    </div>
  );
}

function LeftIcon() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Left Icon">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#172e78] text-[16px] whitespace-nowrap">
        <p className="decoration-solid leading-[1.5] underline">اصدار خطاب</p>
      </div>
    </div>
  );
}

function LeftIcon1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Left Icon">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#2d3648] text-[16px] whitespace-nowrap">
        <p className="leading-[1.5]">العودة إلى لوحة المتابعة</p>
      </div>
    </div>
  );
}

function LeftIcon2() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Left Icon">
      <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f5f5f5] text-[16px] whitespace-nowrap">
        <p className="leading-[1.5]">قيد كشف جديد</p>
      </div>
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex gap-[4px] items-center justify-center min-h-[44px] px-[16px] py-[8px] relative rounded-[8px] shrink-0" data-name="Buttons">
        <LeftIcon />
      </div>
      <div className="bg-[#ebedfd] content-stretch flex gap-[4px] items-center justify-center min-h-[44px] px-[16px] py-[8px] relative rounded-[8px] shrink-0" data-name="Buttons">
        <LeftIcon1 />
      </div>
      <div className="bg-gradient-to-b content-stretch flex from-[#00b867] gap-[4px] items-center justify-center min-h-[44px] px-[16px] py-[8px] relative rounded-[8px] shrink-0 to-[#00522e]" data-name="Buttons">
        <LeftIcon2 />
      </div>
    </div>
  );
}

function Frame12() {
  return (
    <div className="bg-white relative rounded-[20px] shrink-0 w-full">
      <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[24px] items-center px-[24px] py-[16px] relative w-full">
          <Frame17 />
          <Frame16 />
          <Frame22 />
          <Frame23 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#eff0f6] border-solid inset-0 pointer-events-none rounded-[20px]" />
    </div>
  );
}

function Frame11() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[16px] items-center p-[24px] relative w-full">
          <p className="bg-clip-text bg-gradient-to-b font-['Almarai:Bold',sans-serif] from-[#00b867] leading-[1.5] min-w-full not-italic relative shrink-0 text-[32px] text-[transparent] text-center to-[#00522e] w-[min-content]" dir="auto">
            تم اعتماد القيد بنجاح
          </p>
          <StepperHorizontal />
          <Frame12 />
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
        <g clipPath="url(#clip0_3_3549)" id="Logo">
          <path clipRule="evenodd" d={svgPaths.pb82c00} fill="url(#paint0_linear_3_3549)" fillRule="evenodd" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p9a9cd00} fill="url(#paint1_linear_3_3549)" fillRule="evenodd" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_3_3549" x1="16" x2="16" y1="0" y2="32">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_3_3549" x1="8" x2="8" y1="0" y2="16">
            <stop stopColor="#00B867" />
            <stop offset="1" stopColor="#00522E" />
          </linearGradient>
          <clipPath id="clip0_3_3549">
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

function Group5() {
  return (
    <div className="absolute inset-[4.17%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.3333 18.3333">
        <g id="Group">
          <path d={svgPaths.p31003200} fill="var(--fill-0, #717D96)" id="03 dashboard, layout, grid" />
        </g>
      </svg>
    </div>
  );
}

function Icon3() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group5 />
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
      <Icon3 />
    </div>
  );
}

function Icon4() {
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
      <Icon4 />
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute inset-[4.17%_4.17%_4.17%_12.5%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.6667 18.3333">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.padea100} fill="url(#paint0_linear_3_5916)" fillRule="evenodd" id="Vector" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_3_5916" x1="8.33333" x2="8.33333" y1="0" y2="18.3333">
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
        <Group6 />
      </div>
    </div>
  );
}

function Inner3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Inner">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] h-full justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#2d3648] text-[16px] text-right">
        <p className="leading-[1.5]">اضافة قوة جديدة</p>
      </div>
      <Icon5 />
    </div>
  );
}

function Frame7() {
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
      <div className="bg-[#ebedfd] h-[44px] relative rounded-[99px] shrink-0 w-full" data-name="Nav item">
        <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
            <Inner3 />
          </div>
        </div>
      </div>
    </div>
  );
}

function Group7() {
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

function Icon6() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group7 />
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
      <Icon6 />
    </div>
  );
}

function Group8() {
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

function Icon7() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group8 />
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
      <Icon7 />
    </div>
  );
}

function Group9() {
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

function Icon8() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group9 />
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
      <Icon8 />
    </div>
  );
}

function Group10() {
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

function Icon9() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group10 />
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
      <Icon9 />
    </div>
  );
}

function Group11() {
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

function Icon10() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group11 />
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
      <Icon10 />
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
        <Frame7 />
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

function Group12() {
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

function Icon11() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group12 />
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
      <Icon11 />
    </div>
  );
}

function Group13() {
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

function Icon12() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group13 />
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
      <Icon12 />
    </div>
  );
}

function Group14() {
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

function Icon13() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group14 />
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
      <Icon13 />
    </div>
  );
}

function Group15() {
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

function Icon14() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Icon">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icon">
        <Group15 />
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
      <Icon14 />
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

function Frame8() {
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
    <div className="bg-[#f7f9fc] relative size-full" data-name="قيد قوة جديدة (مجموعة-اعتماد)">
      <Frame8 />
    </div>
  );
}