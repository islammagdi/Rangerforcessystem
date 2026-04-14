import svgPaths from "./svg-1uteyihgns";

function Title() {
  return (
    <div className="relative shrink-0 w-full" data-name="Title">
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-center px-[30px] relative size-full">
          <div className="overflow-clip relative shrink-0 size-[40px]" data-name="File / Note_Edit">
            <div className="absolute inset-[4.17%_4.17%_12.5%_12.5%]" data-name="Vector (Stroke)">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 33.3333 33.3333">
                <path clipRule="evenodd" d={svgPaths.p36fa7e00} fill="url(#paint0_linear_55_4138)" fillRule="evenodd" id="Vector (Stroke)" />
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_55_4138" x1="16.6667" x2="16.6667" y1="2.6077e-08" y2="33.3333">
                    <stop stopColor="#00B867" />
                    <stop offset="1" stopColor="#00522E" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <p className="font-['Almarai:Bold',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#122b16] text-[20px] text-center whitespace-nowrap" dir="auto">
            تعديل وحده
          </p>
        </div>
      </div>
    </div>
  );
}

function Label() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-[327px]" data-name="Label">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Bold',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#2d3648] text-[16px] text-right">
        <p className="leading-[1.5]">اسم الوحدة</p>
      </div>
    </div>
  );
}

function LeftContent() {
  return (
    <div className="flex-[1_0_0] min-h-[27px] min-w-px relative" data-name="Left Content">
      <div className="flex flex-row items-center min-h-[inherit] size-full">
        <div className="content-stretch flex gap-[12px] items-center min-h-[inherit] pr-[2px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] min-h-[30px] min-w-px not-italic relative text-[#4a5468] text-[18px] text-right">
            <p className="leading-[1.5]">ك 143 صع</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return <div className="content-stretch flex gap-[12px] h-[27px] items-center justify-end min-h-[27px] shrink-0 w-0" />;
}

function Frame() {
  return (
    <div className="content-stretch flex items-start min-h-[27px] relative shrink-0 w-full">
      <LeftContent />
      <Frame4 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-end min-h-px min-w-px relative">
      <Label />
      <Frame />
    </div>
  );
}

function Frame7() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="content-stretch flex gap-[6px] items-start px-[6px] relative size-full">
        <Frame6 />
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#e2e7f0] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="content-stretch flex flex-col items-start px-[8px] py-[6px] relative size-full">
        <Frame7 />
      </div>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full">
      <Input />
    </div>
  );
}

function Label1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[327px]" data-name="Label">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Bold',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#2d3648] text-[16px] text-right">
        <p className="leading-[1.5]">تقسيمة الوحده</p>
      </div>
    </div>
  );
}

function LeftContent1() {
  return (
    <div className="flex-[1_0_0] min-h-[27px] min-w-px relative" data-name="Left Content">
      <div className="flex flex-row items-center min-h-[inherit] size-full">
        <div className="content-stretch flex gap-[12px] items-center min-h-[inherit] pr-[2px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] min-h-[30px] min-w-px not-italic relative text-[#4a5468] text-[18px] text-right">
            <p className="leading-[1.5]">وحدة اساسية</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return <div className="content-stretch flex gap-[12px] h-[27px] items-center justify-end min-h-[27px] shrink-0 w-0" />;
}

function Frame1() {
  return (
    <div className="content-stretch flex items-start min-h-[27px] relative shrink-0 w-full">
      <LeftContent1 />
      <Frame5 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-end min-h-px min-w-px relative">
      <Label1 />
      <Frame1 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[6px] items-center justify-end px-[6px] relative size-full">
          <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Arrow / Chevron_Down">
            <div className="absolute inset-[33.33%_16.67%_29.17%_16.67%]" data-name="Vector (Stroke)">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 6">
                <path clipRule="evenodd" d={svgPaths.p2d196500} fill="var(--fill-0, #2D3648)" fillRule="evenodd" id="Vector (Stroke)" />
              </svg>
            </div>
          </div>
          <Frame9 />
        </div>
      </div>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#e2e7f0] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col items-end size-full">
        <div className="content-stretch flex flex-col items-end px-[8px] py-[6px] relative size-full">
          <Frame8 />
        </div>
      </div>
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-end relative shrink-0 w-full">
      <Input1 />
    </div>
  );
}

function Label2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Label">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Bold',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#2d3648] text-[16px] text-right">
        <p className="leading-[1.5]">الوحده التابعه لها</p>
      </div>
    </div>
  );
}

function LeftContent2() {
  return (
    <div className="flex-[1_0_0] min-h-[27px] min-w-px relative" data-name="Left Content">
      <div className="flex flex-row items-center min-h-[inherit] size-full">
        <div className="content-stretch flex gap-[12px] items-center min-h-[inherit] pr-[2px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] min-h-[30px] min-w-px not-italic relative text-[#4a5468] text-[18px] text-right">
            <p className="leading-[1.5]">مج 145 صع</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame12() {
  return <div className="content-stretch flex gap-[12px] h-[27px] items-center justify-end min-h-[27px] shrink-0 w-0" />;
}

function Frame2() {
  return (
    <div className="content-stretch flex items-start min-h-[27px] relative shrink-0 w-full">
      <LeftContent2 />
      <Frame12 />
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-h-px min-w-px relative">
      <Label2 />
      <Frame2 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex gap-[6px] items-center justify-end px-[6px] relative size-full">
          <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Arrow / Chevron_Down">
            <div className="absolute inset-[33.33%_16.67%_29.17%_16.67%]" data-name="Vector (Stroke)">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 6">
                <path clipRule="evenodd" d={svgPaths.p2d196500} fill="var(--fill-0, #2D3648)" fillRule="evenodd" id="Vector (Stroke)" />
              </svg>
            </div>
          </div>
          <Frame11 />
        </div>
      </div>
    </div>
  );
}

function Input2() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#e2e7f0] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="content-stretch flex flex-col items-start px-[8px] py-[6px] relative size-full">
        <Frame10 />
      </div>
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full">
      <Input2 />
    </div>
  );
}

function Label3() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Label">
      <div className="flex flex-[1_0_0] flex-col font-['Almarai:Bold',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#2d3648] text-[16px] text-right">
        <p className="leading-[1.5]">نوع الوحده</p>
      </div>
    </div>
  );
}

function LeftContent3() {
  return (
    <div className="flex-[1_0_0] min-h-[27px] min-w-px relative" data-name="Left Content">
      <div className="flex flex-row items-center min-h-[inherit] size-full">
        <div className="content-stretch flex gap-[12px] items-center min-h-[inherit] pr-[2px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] min-h-[30px] min-w-px not-italic relative text-[#4a5468] text-[18px] text-right">
            <p className="leading-[1.5]">كتيبة</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame15() {
  return <div className="content-stretch flex gap-[12px] h-[27px] items-center justify-end min-h-[27px] shrink-0 w-0" />;
}

function Frame3() {
  return (
    <div className="content-stretch flex items-start min-h-[27px] relative shrink-0 w-full">
      <LeftContent3 />
      <Frame15 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-h-px min-w-px relative">
      <Label3 />
      <Frame3 />
    </div>
  );
}

function Frame13() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[6px] items-center px-[6px] relative size-full">
          <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Arrow / Chevron_Down">
            <div className="absolute inset-[33.33%_16.67%_29.17%_16.67%]" data-name="Vector (Stroke)">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 6">
                <path clipRule="evenodd" d={svgPaths.p2d196500} fill="var(--fill-0, #2D3648)" fillRule="evenodd" id="Vector (Stroke)" />
              </svg>
            </div>
          </div>
          <Frame14 />
        </div>
      </div>
    </div>
  );
}

function Input3() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#e2e7f0] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="content-stretch flex flex-col items-start px-[8px] py-[6px] relative size-full">
        <Frame13 />
      </div>
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full">
      <Input3 />
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Text Field Input Opition">
        <Frame19 />
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Text Field Input Opition">
        <Frame20 />
      </div>
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Text Field Input Opition">
        <Frame17 />
      </div>
      <div className="content-stretch flex flex-col items-end relative shrink-0 w-full" data-name="Text Field Input Opition">
        <Frame18 />
      </div>
      <Frame22 />
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

export default function Frame16() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[24px] items-center overflow-clip p-[24px] relative rounded-[24px] size-full">
      <Title />
      <Frame21 />
      <div className="bg-gradient-to-b from-[#00b867] min-h-[52px] relative rounded-[8px] shrink-0 to-[#00522e] w-full" data-name="Buttons">
        <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
          <div className="content-stretch flex gap-[4px] items-center justify-center min-h-[inherit] px-[20px] py-[12px] relative size-full">
            <LeftIcon />
          </div>
        </div>
      </div>
    </div>
  );
}