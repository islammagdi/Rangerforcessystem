import { useState, FormEvent } from "react";
import { useNavigate } from "react-router";
import { EgyptEmblem } from "./EgyptEmblem";
import { LoginInput } from "./LoginInput";
import { LoginButton } from "./LoginButton";

interface FormErrors {
  username?: string;
  password?: string;
}

/** Minimal client-side validation */
function validate(username: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!username.trim()) errors.username = "اسم المستخدم مطلوب";
  if (!password.trim()) errors.password = "كلمة المرور مطلوبة";
  else if (password.length < 4) errors.password = "كلمة المرور قصيرة جداً";
  return errors;
}

/**
 * LoginForm — the right-side panel containing the emblem, titles and form fields.
 */
export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(username, password);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    // Simulate an async login request
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    // Navigate to dashboard after short delay
    setTimeout(() => navigate("/dashboard"), 600);
  };

  return (
    <div
      dir="rtl"
      className="w-full flex flex-col items-center gap-8"
    >
      {/* ── Header: emblem + titles ────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-5 w-full">
        <EgyptEmblem />

        <h1
          className="text-center text-[#1f3d97]"
          style={{
            fontFamily: "'Almarai', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 44px)",
            lineHeight: 1.2,
          }}
        >
          منظومة الخوارج الداخلية
        </h1>

        <p
          className="text-center text-[#1f3d97]"
          style={{
            fontFamily: "'Almarai', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(18px, 2.5vw, 28px)",
            lineHeight: 1.2,
          }}
        >
          قوات الصاعقة المصرية
        </p>
      </div>

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      {submitted ? (
        <SuccessMessage />
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-[400px] flex flex-col gap-6"
        >
          <div className="flex flex-col gap-4">
            <LoginInput
              id="username"
              label="اسم المستخدم"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) setErrors((p) => ({ ...p, username: undefined }));
              }}
              icon="user"
              autoComplete="username"
              error={errors.username}
              disabled={loading}
            />

            <LoginInput
              id="password"
              label="كلمه المرور"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              icon="lock"
              autoComplete="current-password"
              error={errors.password}
              disabled={loading}
            />
          </div>

          <LoginButton type="submit" loading={loading} disabled={loading}>
            تسجيل الدخول
          </LoginButton>
        </form>
      )}
    </div>
  );
}

function SuccessMessage() {
  return (
    <div
      className="w-full max-w-[400px] bg-green-50 border border-green-200 rounded-[8px] p-6 flex flex-col items-center gap-3 text-center"
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
        <svg fill="none" viewBox="0 0 24 24" width={24} height={24} stroke="#00b867" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <p
        className="text-green-800"
        style={{ fontFamily: "'Almarai', sans-serif", fontWeight: 700, fontSize: "16px" }}
      >
        تم تسجيل الدخول بنجاح
      </p>
      <p
        className="text-green-600"
        style={{ fontFamily: "'Almarai', sans-serif", fontSize: "14px" }}
      >
        مرحباً بك في منظومة الخوارج الداخلية
      </p>
    </div>
  );
}