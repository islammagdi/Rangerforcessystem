import soldiersImg from "figma:asset/fc16e28f31627a0e4570da4c1c6ef4d6f58124ce.png";
import { LoginForm } from "../components/LoginForm";
import { BackgroundPattern } from "../components/BackgroundPattern";

function SoldiersIllustration({
  variant,
}: {
  variant: "desktop" | "mobile";
}) {
  if (variant === "mobile") {
    return (
      <div
        className="w-full rounded-2xl overflow-hidden shadow-sm"
        style={{ height: "200px" }}
      >
        <img
          src={soldiersImg}
          alt="قوات الصاعقة المصرية"
          className="w-full h-full object-cover"
          style={{ objectPosition: "50% 28%" }}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className="w-full relative overflow-hidden rounded-2xl"
      style={{ aspectRatio: "1264 / 870" }}
    >
      <img
        src={soldiersImg}
        alt="قوات الصاعقة المصرية"
        className="absolute max-w-none"
        style={{
          width: "187.82%",
          height: "205.33%",
          left: "-87.82%",
          top: "-62.95%",
        }}
        draggable={false}
      />
    </div>
  );
}

export function LoginPage() {
  return (
    <div
      className="relative min-h-screen w-full bg-[#f7f9fc] overflow-x-hidden"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      <BackgroundPattern />

      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[1280px]">

          {/* Desktop */}
          <div className="hidden md:flex flex-row items-center gap-8 lg:gap-16">
            <div className="flex-1 min-w-0">
              <SoldiersIllustration variant="desktop" />
            </div>

            <div className="flex-none w-[540px] xl:w-[600px]">
              <LoginForm />
            </div>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden flex-col gap-8">
            <SoldiersIllustration variant="mobile" />

            <LoginForm />
          </div>

        </div>
      </main>
    </div>
  );
}