import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router";
import saqaLogo from "../../assets/Sa'ka_Forces_logo.png";
import { LoginInput } from "./LoginInput";
import { LoginButton } from "./LoginButton";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/logActivity";

interface FormErrors {
  username?: string;
  password?: string;
}

interface ForgotStatus {
  type: "error" | "success";
  text: string;
}

function validate(username: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (!username.trim()) {
    errors.username = "اسم المستخدم مطلوب";
  }

  if (!password.trim()) {
    errors.password = "كلمة المرور مطلوبة";
  } else if (password.length < 4) {
    errors.password = "كلمة المرور قصيرة جداً";
  }

  return errors;
}

const FONT = { fontFamily: "'Almarai', sans-serif" } as const;

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // نسيت كلمة المرور
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<ForgotStatus | null>(null);

  // مهم: نمنع ظهور LoginForm لحظياً أثناء فحص الـ Session
  const [checkingSession, setCheckingSession] = useState(true);

  const navigate = useNavigate();

  // =====================================================
  // Check Existing Session
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("CHECK SESSION ERROR:", error);
          return;
        }

        // يوجد Session بالفعل
        if (session) {
          if (mounted) {
            navigate("/dashboard", { replace: true });
          }
          return;
        }
      } catch (error) {
        console.error("SESSION CHECK EXCEPTION:", error);
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // =====================================================
  // Close forgot-password modal with Escape
  // =====================================================

  useEffect(() => {
    if (!showForgotPassword) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowForgotPassword(false);
        setForgotEmail("");
        setForgotStatus(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showForgotPassword]);

  const closeForgot = () => {
    setShowForgotPassword(false);
    setForgotEmail("");
    setForgotStatus(null);
  };

  // =====================================================
  // Login
  // =====================================================

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const errs = validate(username, password);

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // ============================================
      // 1. Login Supabase Auth
      // ============================================

      const email = username.trim().includes("@")
        ? username.trim().toLowerCase()
        : `${username.trim().toLowerCase()}@auth.local`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("LOGIN ERROR:", error);

        setErrors({
          username: "بيانات تسجيل الدخول غير صحيحة",
        });

        return;
      }

      if (!data.user) {
        setErrors({
          username: "تعذر تسجيل الدخول",
        });

        return;
      }

      // ============================================
      // 2. Check Session
      // ============================================

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error("SESSION ERROR:", sessionError);
      }

      if (!sessionData.session) {
        setErrors({
          username: "تم تسجيل الدخول ولكن لم يتم إنشاء جلسة للمستخدم",
        });

        return;
      }

      // ============================================
      // 3. Get Profile
      // ============================================

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
            id,
            username,
            is_active
          `
        )
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);

        await supabase.auth.signOut();

        setErrors({
          username: "حدث خطأ أثناء تحميل بيانات المستخدم",
        });

        return;
      }

      if (!profile) {
        await supabase.auth.signOut();

        setErrors({
          username: "الحساب غير مرتبط بملف مستخدم في النظام",
        });

        return;
      }

      // ============================================
      // 4. Check Active
      // ============================================

      if (profile.is_active !== true) {
        await supabase.auth.signOut();

        setErrors({
          username: "تم ايقاف حسابك, الرجاء الرجوع لمدير النظام",
        });

        return;
      }

      // ============================================
      // 5. Get Role
      // ============================================

      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select(
          `
            role_id,
            roles (
              id,
              name,
              code
            )
          `
        )
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (roleError) {
        console.error("ROLE ERROR:", roleError);

        await supabase.auth.signOut();

        setErrors({
          username: "حدث خطأ أثناء تحميل صلاحيات المستخدم",
        });

        return;
      }

      if (!userRole) {
        await supabase.auth.signOut();

        setErrors({
          username: "المستخدم غير مرتبط بدور في النظام",
        });

        return;
      }

      // ============================================
      // 6. Extract Role
      // ============================================

      const role = Array.isArray(userRole.roles)
        ? userRole.roles[0]
        : userRole.roles;

      const roleCode = (role as any)?.code;
      const roleName = (role as any)?.name;

      // ============================================
      // 7. Save User Data
      // ============================================

      sessionStorage.setItem("user_role", roleCode ?? "");
      sessionStorage.setItem("user_role_name", roleName ?? "");
      sessionStorage.setItem("user_id", data.user.id);
      sessionStorage.setItem("username", profile.username);

      // ============================================
      // 8. تسجيل عملية الدخول في سجل العمليات
      // ============================================

      await logActivity({
        userId: data.user.id,
        userName: profile.username,
        actionType: "LOGIN",
        action: "تسجيل دخول",
        entity: "النظام",
        details: `تم تسجيل الدخول إلى المنظومة بواسطة ${profile.username}`,
      });

      // ============================================
      // 9. Login Success
      // ============================================

      setSubmitted(true);

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 600);
    } catch (error) {
      console.error("LOGIN EXCEPTION:", error);

      setErrors({
        username: "حدث خطأ أثناء تسجيل الدخول",
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // Forgot Password
  // =====================================================

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotStatus({ type: "error", text: "يرجى إدخال اسم المستخدم" });
      return;
    }

    setSendingRequest(true);
    setForgotStatus(null);

    try {
      const email = forgotEmail.trim().includes("@")
        ? forgotEmail.trim().toLowerCase()
        : `${forgotEmail.trim().toLowerCase()}@auth.local`;

      const { error } = await supabase.functions.invoke("hyper-action", {
        body: { email },
      });

      if (error) throw error;

      setForgotEmail("");
      setForgotStatus({
        type: "success",
        text: "تم إرسال طلب إعادة تعيين كلمة المرور إلى مدير النظام.",
      });
    } catch (err: any) {
      setForgotStatus({
        type: "error",
        text: err?.message ?? "حدث خطأ أثناء إرسال الطلب",
      });
    } finally {
      setSendingRequest(false);
    }
  };

  // =====================================================
  // أثناء فحص Session
  // =====================================================

  if (checkingSession) {
    return (
      <div
        dir="rtl"
        role="status"
        className="flex w-full items-center justify-center gap-3 py-20 text-[14px] text-[#5b6b5f]"
        style={FONT}
      >
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-[#dbe3dc] border-t-[#067647]"
          aria-hidden="true"
        />
        جاري التحقق من الجلسة...
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div dir="rtl" className="flex w-full flex-col gap-6 sm:gap-8" style={FONT}>
      {/* ───────────── Forgot password modal ───────────── */}
      {showForgotPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#14201a]/55 px-4 backdrop-blur-sm"
          onClick={closeForgot}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-title"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_30px_80px_-20px_rgba(20,32,26,0.45)] sm:p-7"
          >
            <h2
              id="forgot-title"
              className="text-[18px] font-extrabold text-[#1c2b20] sm:text-[20px]"
              style={FONT}
            >
              نسيت كلمة المرور؟
            </h2>

            <p
              className="mt-2 text-[13px] leading-6 text-[#5b6b5f] sm:text-[14px]"
              style={FONT}
            >
              اكتب اسم المستخدم وسيصل طلب إعادة التعيين إلى مدير النظام.
            </p>

            {forgotStatus?.type === "success" ? (
              <div className="mt-5 flex flex-col gap-5">
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-xl border border-[#cfe6d6] bg-[#f0f8f2] p-4 text-[14px] leading-6 text-[#0b5c36]"
                  style={FONT}
                >
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    width={20}
                    height={20}
                    stroke="#067647"
                    strokeWidth={2.2}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  <span>{forgotStatus.text}</span>
                </div>

                <button
                  type="button"
                  onClick={closeForgot}
                  className="h-12 rounded-xl bg-[#067647] font-bold text-white transition-colors hover:bg-[#055d39] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#067647]/25"
                  style={FONT}
                >
                  تم
                </button>
              </div>
            ) : (
              <form
                className="mt-5 flex flex-col gap-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleForgotPassword();
                }}
                noValidate
              >
                <LoginInput
                  id="forgot-username"
                  label="اسم المستخدم"
                  placeholder="اكتب اسم المستخدم فقط"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (forgotStatus) setForgotStatus(null);
                  }}
                  icon="user"
                  autoComplete="username"
                  autoFocus
                  disabled={sendingRequest}
                  error={
                    forgotStatus?.type === "error"
                      ? forgotStatus.text
                      : undefined
                  }
                />

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
                  <button
                    type="button"
                    onClick={closeForgot}
                    className="h-12 flex-1 rounded-xl border border-[#dbe3dc] font-bold text-[#1c2b20] transition-colors hover:bg-[#f3f6f3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1c2b20]/10"
                    style={FONT}
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={sendingRequest}
                    className="h-12 flex-1 rounded-xl bg-[#067647] font-bold text-white transition-colors hover:bg-[#055d39] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#067647]/25 disabled:cursor-not-allowed disabled:opacity-60"
                    style={FONT}
                  >
                    {sendingRequest ? "جارٍ الإرسال..." : "إرسال الطلب"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ───────────── Header ───────────── */}
      <header className="flex flex-col items-start gap-4 sm:gap-5">
        <img
          src={saqaLogo}
          alt="شعار قوات الصاعقة"
          className="h-16 w-auto object-contain sm:h-20"
          draggable={false}
        />

        <div className="flex flex-col gap-2">
          <h1
            className="text-[#1c2b20]"
            style={{
              ...FONT,
              fontWeight: 800,
              fontSize: "clamp(22px, 5.5vw, 32px)",
              lineHeight: 1.25,
            }}
          >
            منظومة الخوارج الداخلية
          </h1>

          <p
            className="text-[13px] leading-6 text-[#5b6b5f] sm:text-[14px]"
            style={{ ...FONT, fontWeight: 400 }}
          >
            سجّل دخولك باستخدام الرقم العسكري للمتابعة.
          </p>
        </div>
      </header>

      {/* ───────────── Form / Success ───────────── */}
      {submitted ? (
        <SuccessMessage />
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex w-full flex-col gap-5 sm:gap-6"
        >
          <div className="flex flex-col gap-4 sm:gap-5">
            <LoginInput
              id="username"
              label="اسم المستخدم"
              placeholder="اكتب الرقم العسكري"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);

                if (errors.username) {
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }
              }}
              icon="user"
              autoComplete="username"
              error={errors.username}
              hint=''
              disabled={loading}
            />

            <div className="flex flex-col gap-2">
              <LoginInput
                id="password"
                label="كلمة المرور"
                placeholder="اكتب كلمة المرور"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);

                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                icon="lock"
                autoComplete="current-password"
                error={errors.password}
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="self-end rounded-md px-1 text-[13px] font-bold text-[#067647] underline-offset-4 transition-colors hover:text-[#055d39] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#067647]/40"
                style={FONT}
              >
                نسيت كلمة المرور؟
              </button>
            </div>
          </div>

          <LoginButton type="submit" loading={loading} disabled={loading}>
            تسجيل الدخول
          </LoginButton>
        </form>
      )}
    </div>
  );
}

// =====================================================
// Success Message
// =====================================================

function SuccessMessage() {
  return (
    <div
      className="flex w-full flex-col items-center gap-3 rounded-2xl border border-[#cfe6d6] bg-[#f0f8f2] p-5 text-center sm:p-6"
      role="status"
      style={FONT}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d9eee1]">
        <svg
          fill="none"
          viewBox="0 0 24 24"
          width={24}
          height={24}
          stroke="#067647"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      </div>

      <p className="text-[15px] font-bold text-[#0b5c36] sm:text-[16px]">
        تم تسجيل الدخول بنجاح
      </p>

      <p className="text-[13px] text-[#3f7a58] sm:text-[14px]">
        مرحباً بك في منظومة الخوارج الداخلية
      </p>
    </div>
  );
}