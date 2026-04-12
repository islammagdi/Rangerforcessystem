import { useEffect } from "react";

interface LoadingOverlayProps {
  onDone: () => void;
  durationMs?: number;
}

export function LoadingOverlay({ onDone, durationMs = 5000 }: LoadingOverlayProps) {
  useEffect(() => {
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [onDone, durationMs]);

  return (
    /* Full-screen semi-transparent backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      dir="rtl"
    >
      {/* White card */}
      <div
        className="bg-white rounded-[24px] flex flex-col items-center justify-center overflow-hidden"
        style={{ width: "min(480px, 90vw)", padding: "60px 40px" }}
      >
        {/* ── Animated three green dots ────────────────────────────── */}
        <div className="flex items-center gap-5 mb-10">
          <Dot delay="0s" />
          <Dot delay="0.25s" />
          <Dot delay="0.5s" />
        </div>

        {/* ── Text ─────────────────────────────────────────────────── */}
        <p
          className="text-center"
          style={{
            fontFamily: "'Almarai', sans-serif",
            fontWeight: 700,
            fontSize: 36,
            color: "#122b16",
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          يرجي الانتظار
        </p>
        <p
          className="text-center"
          style={{
            fontFamily: "'Almarai', sans-serif",
            fontWeight: 700,
            fontSize: 24,
            color: "#404040",
            lineHeight: 1.5,
          }}
        >
          يتم قيد الافراد الجدد الان
        </p>
      </div>

      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1; }
        }
        .dot-bounce {
          animation: dotBounce 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="dot-bounce block rounded-full shrink-0"
      style={{
        width: 18,
        height: 18,
        background: "linear-gradient(to bottom, #00b867, #00522e)",
        animationDelay: delay,
      }}
    />
  );
}
