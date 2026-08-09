import {
  useState,
  useEffect,
  FormEvent,
} from "react";
import { useNavigate } from "react-router";
import { EgyptEmblem } from "./EgyptEmblem";
import { LoginInput } from "./LoginInput";
import { LoginButton } from "./LoginButton";
import { supabase } from "../../lib/supabase";

interface FormErrors {
  username?: string;
  password?: string;
}

function validate(
  username: string,
  password: string
): FormErrors {
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

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [loading, setLoading] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  // مهم: نمنع ظهور LoginForm لحظياً
  // أثناء فحص الـ Session
  const [checkingSession, setCheckingSession] =
    useState(true);

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
          console.error(
            "CHECK SESSION ERROR:",
            error
          );

          return;
        }

        // ===============================================
        // يوجد Session بالفعل
        // ===============================================

        if (session) {
          console.log(
            "Existing session found:",
            session.user.id
          );

          // تأكد أن بيانات الـ role القديمة
          // لا تسبب مشكلة
          // لأن LoginForm سبق وخزنها في sessionStorage

          if (mounted) {
            navigate("/dashboard", {
              replace: true,
            });
          }

          return;
        }

        // ===============================================
        // لا توجد Session
        // ===============================================

        console.log(
          "No existing session"
        );
      } catch (error) {
        console.error(
          "SESSION CHECK EXCEPTION:",
          error
        );
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
  // Login
  // =====================================================

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    const errs = validate(
      username,
      password
    );

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

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: username.trim(),
          password,
        });

      if (error) {
        console.error(
          "LOGIN ERROR:",
          error
        );

        setErrors({
          username:
            "بيانات تسجيل الدخول غير صحيحة",
        });

        return;
      }

      if (!data.user) {
        setErrors({
          username:
            "تعذر تسجيل الدخول",
        });

        return;
      }

      // ============================================
      // 2. Check Session
      // ============================================

      const {
        data: sessionData,
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          "SESSION ERROR:",
          sessionError
        );
      }

      if (!sessionData.session) {
        setErrors({
          username:
            "تم تسجيل الدخول ولكن لم يتم إنشاء جلسة للمستخدم",
        });

        return;
      }

      // ============================================
      // 3. Get Profile
      // ============================================

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          is_active
        `)
        .eq(
          "id",
          data.user.id
        )
        .maybeSingle();

      if (profileError) {
        console.error(
          "PROFILE ERROR:",
          profileError
        );

        await supabase.auth.signOut();

        setErrors({
          username:
            "حدث خطأ أثناء تحميل بيانات المستخدم",
        });

        return;
      }

      if (!profile) {
        await supabase.auth.signOut();

        setErrors({
          username:
            "الحساب غير مرتبط بملف مستخدم في النظام",
        });

        return;
      }

      // ============================================
      // 4. Check Active
      // ============================================

      if (profile.is_active !== true) {
        await supabase.auth.signOut();

        setErrors({
          username:
            "تم ايقاف حسابك, الرجاء الرجوع لمدير النظام",
        });

        return;
      }

      // ============================================
      // 5. Get Role
      // ============================================

      const {
        data: userRole,
        error: roleError,
      } = await supabase
        .from("user_roles")
        .select(`
          role_id,
          roles (
            id,
            name,
            code
          )
        `)
        .eq(
          "user_id",
          data.user.id
        )
        .maybeSingle();

      if (roleError) {
        console.error(
          "ROLE ERROR:",
          roleError
        );

        await supabase.auth.signOut();

        setErrors({
          username:
            "حدث خطأ أثناء تحميل صلاحيات المستخدم",
        });

        return;
      }

      if (!userRole) {
        await supabase.auth.signOut();

        setErrors({
          username:
            "المستخدم غير مرتبط بدور في النظام",
        });

        return;
      }

      // ============================================
      // 6. Extract Role
      // ============================================

      const role =
        Array.isArray(userRole.roles)
          ? userRole.roles[0]
          : userRole.roles;

      const roleCode =
        (role as any)?.code;

      const roleName =
        (role as any)?.name;

      // ============================================
      // 7. Save User Data
      // ============================================

      sessionStorage.setItem(
        "user_role",
        roleCode ?? ""
      );

      sessionStorage.setItem(
        "user_role_name",
        roleName ?? ""
      );

      sessionStorage.setItem(
        "user_id",
        data.user.id
      );

      sessionStorage.setItem(
        "username",
        profile.username
      );

      // ============================================
      // 8. Login Success
      // ============================================

      setSubmitted(true);

      setTimeout(() => {
        navigate("/dashboard", {
          replace: true,
        });
      }, 600);

    } catch (error) {
      console.error(
        "LOGIN EXCEPTION:",
        error
      );

      setErrors({
        username:
          "حدث خطأ أثناء تسجيل الدخول",
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // أثناء فحص Session
  // =====================================================

  if (checkingSession) {
    return (
      <div
        dir="rtl"
        className="w-full flex items-center justify-center py-20"
        style={{
          fontFamily:
            "'Almarai', sans-serif",
        }}
      >
        جاري التحقق من الجلسة...
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      dir="rtl"
      className="w-full flex flex-col items-center gap-8"
    >
      <div className="flex flex-col items-center gap-5 w-full">
        <EgyptEmblem />

        <h1
          className="text-center text-[#344736]"
          style={{
            fontFamily:
              "'Almarai', sans-serif",
            fontWeight: 800,
            fontSize:
              "clamp(28px, 4vw, 44px)",
            lineHeight: 1.2,
          }}
        >
          منظومة الخوارج الداخلية
        </h1>

        <p
          className="text-center text-[#344736]"
          style={{
            fontFamily:
              "'Almarai', sans-serif",
            fontWeight: 700,
            fontSize:
              "clamp(18px, 2.5vw, 28px)",
            lineHeight: 1.2,
          }}
        >
          فرع التنظيم والادارة لقوات الصاعقة
        </p>
      </div>

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

                if (errors.username) {
                  setErrors((prev) => ({
                    ...prev,
                    username: undefined,
                  }));
                }
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

                if (errors.password) {
                  setErrors((prev) => ({
                    ...prev,
                    password: undefined,
                  }));
                }
              }}
              icon="lock"
              autoComplete="current-password"
              error={errors.password}
              disabled={loading}
            />

          </div>

          <LoginButton
            type="submit"
            loading={loading}
            disabled={loading}
          >
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
      className="w-full max-w-[400px] bg-green-50 border border-green-200 rounded-[8px] p-6 flex flex-col items-center gap-3 text-center"
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
        <svg
          fill="none"
          viewBox="0 0 24 24"
          width={24}
          height={24}
          stroke="#00b867"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      </div>

      <p
        className="text-green-800"
        style={{
          fontFamily:
            "'Almarai', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
        }}
      >
        تم تسجيل الدخول بنجاح
      </p>

      <p
        className="text-green-600"
        style={{
          fontFamily:
            "'Almarai', sans-serif",
          fontSize: "14px",
        }}
      >
        مرحباً بك في منظومة الخوارج الداخلية
      </p>
    </div>
  );
}