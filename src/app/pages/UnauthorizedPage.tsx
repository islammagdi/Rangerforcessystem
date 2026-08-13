import { useNavigate } from "react-router";
import { ShieldAlert } from "lucide-react";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col items-center justify-center gap-5 w-full py-24"
      dir="rtl"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "#fce9ea" }}
      >
        <ShieldAlert size={36} style={{ color: "#e3282c" }} />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <p
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 24,
            color: "#2d3648",
          }}
        >
          غير مسموح لك بالدخول لهذه الصفحة
        </p>

        <p
          style={{
            ...F,
            fontSize: 15,
            color: "#717d96",
            maxWidth: 420,
          }}
        >
          ليس لديك الصلاحية الكافية للوصول إلى هذا الجزء من المنظومة. برجاء
          التواصل مع مدير النظام إذا كنت تعتقد أن هذا خطأ.
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="h-[46px] px-6 rounded-[8px] flex items-center justify-center"
        style={{
          background: "linear-gradient(to bottom, #00b867, #00522e)",
        }}
      >
        <span style={{ ...F, fontSize: 15, color: "#fff" }}>
          العودة للموقف العام
        </span>
      </button>
    </div>
  );
}