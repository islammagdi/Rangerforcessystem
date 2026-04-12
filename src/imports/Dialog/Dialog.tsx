import svgPaths from "./svg-9zh1r77ffa";

export default function Dialog() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[15px] items-start p-[20px] relative rounded-[16px] size-full" data-name="Dialog">
      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Header">
        <div className="overflow-clip relative shrink-0 size-[24px]" data-name="icon / Modal / Close">
          <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%-0.05px)] size-[14px] top-[calc(50%+0.04px)]" data-name="Vector">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
              <path d={svgPaths.p355e8580} fill="var(--fill-0, #CCCCCC)" id="Vector" />
            </svg>
          </div>
        </div>
        <div className="flex flex-[1_0_0] flex-col font-['Almarai:Bold',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#333] text-[18px] text-right">
          <p className="leading-[1.5]">تحذير</p>
        </div>
        <div className="relative shrink-0 size-[20px]" data-name="icon / Modal / Alert">
          <div className="absolute inset-[8.33%_4.22%_12.49%_4.17%]" data-name="Vector">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.322 15.8357">
              <path d={svgPaths.p3b6a0f40} fill="var(--fill-0, #D44848)" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Main Content">
        <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#333] text-[16px] text-right w-full">
          <p className="leading-[1.5]">هل انت متأكد من حذف الفرد من قاعدة البيانات؟</p>
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Footer">
        <div className="bg-white content-stretch flex gap-[8px] items-start relative shrink-0" data-name="Button">
          <div className="content-stretch cursor-pointer flex h-[42px] items-center justify-center px-[16px] py-[8px] relative rounded-[42px] shrink-0" data-name="Button">
            <div className="flex flex-col font-['Almarai:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#888] text-[16px] whitespace-nowrap">
              <p className="leading-[1.5]">الغاء</p>
            </div>
          </div>
          <div className="bg-[#e3282c] content-stretch flex gap-[4px] items-center justify-center min-h-[44px] px-[16px] py-[8px] relative rounded-[8px] shrink-0" data-name="Buttons">
            <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Left Icon">
              <div className="flex flex-col font-['Almarai:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f5f5f5] text-[16px] whitespace-nowrap">
                <p className="leading-[1.5]">حذف الفرد</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}