import soldiersImg from "figma:asset/loginVector.png";
import { LoginForm } from "../components/LoginForm";
import { BackgroundPattern } from "../components/BackgroundPattern";
import saqaLogo from "../../assets/waterMark.png";
/**
 * لوحة الصورة: صورة الصاعقة بطبقة أخضر داكن، والاسم في الأسفل.
 * لو القص مش مضبوط على الصورة عدّل قيمة FOCUS (x% y%) و ZOOM.
 */
const FOCUS = "50% 0%";
const ZOOM = .80;

function HeroPanel() {
  return (
    <div className="relative h-44 overflow-hidden bg-[#1c2b20] sm:h-64 md:h-auto md:min-h-[660px]">
      <img
        src={soldiersImg}
        alt="قوات الصاعقة المصرية"
        className="absolute inset-0 h-full w-full max-w-none object-cover"
        style={{
          objectPosition: FOCUS,
          transform: `scale(${ZOOM})`,
          transformOrigin: FOCUS,
          opacity: 0.4, 
        }}
        draggable={false}
      />

      {/* طبقة اللون */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(16,26,20,0.92) 0%, rgba(28,43,32,0.45) 45%, rgba(28,43,32,0.12) 100%)",
        }}
      />

      {/* الاسم */}
      <div
        dir="rtl"
        className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6 md:p-10"
        style={{ fontFamily: "'Almarai', sans-serif" }}
      >
        <div className="mb-3 h-[3px] w-10 rounded-full bg-[#c9ac6a] sm:mb-4 sm:w-12" />

        <p className="text-[17px] font-extrabold leading-snug sm:text-[20px] md:text-[28px]">
          فرع التنظيم والإدارة
        </p>
        <p className="mt-1 text-[13px] font-bold text-white/80 sm:text-[15px] md:text-[18px]">
          لقوات الصاعقة
        </p>
      </div>
    </div>
  );
}

export function LoginPage() {
  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden bg-[#eef2ee]"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      <BackgroundPattern />

      {/* العلامة المائية: اللوجو مقطوع من حافة الشاشة تحت يسار */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          src={saqaLogo}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute -bottom-30 -right-50 w-[420px] max-w-none select-none sm:w-[560px] md:w-[680px]"
          style={{ opacity: 0.1 }}
        />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-3 py-5 sm:px-4 md:py-10">
        {/* بطاقة واحدة: صورة + نموذج (نسخة واحدة فقط من LoginForm) */}
        <div className="grid w-full max-w-[1120px] grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-[0_40px_90px_-30px_rgba(28,43,32,0.35)] ring-1 ring-[#1c2b20]/5 sm:rounded-[28px] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <HeroPanel />

          <section className="flex items-center px-5 py-7 sm:px-8 sm:py-9 md:px-12 md:py-14">
            <div className="mx-auto w-full max-w-[400px]">
              <LoginForm />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}