import { useState } from "react";
import { KeyRound } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

export function ForceChangePasswordModal({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};

    if (!form.current) {
      e.current = "كلمة المرور الحالية مطلوبة";
    }

    const hasLetter = /[a-zA-Z]/.test(form.next);
    const hasNumber = /[0-9]/.test(form.next);

    if (!form.next) {
      e.next = "كلمة المرور الجديدة مطلوبة";
    } else if (form.next.length < 6) {
      e.next = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    } else if (!hasLetter || !hasNumber) {
      e.next = "كلمة المرور يجب أن تحتوي على حروف وأرقام معاً";
    } else if (form.current && form.next === form.current) {
      e.next = "لا يمكن استخدام نفس كلمة المرور الافتراضية";
    }

    if (!form.confirm) {
      e.confirm = "يرجى تأكيد كلمة المرور";
    } else if (form.next !== form.confirm) {
      e.confirm = "كلمتا المرور غير متطابقتين";
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("لا يوجد مستخدم مسجل الدخول");
      }

      const email = user.email;

      if (!email) {
        throw new Error("لا يوجد بريد إلكتروني مرتبط بهذا الحساب");
      }

      // التحقق من كلمة المرور الحالية

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password: form.current,
        });

      if (signInError) {
        setErrors({ current: "كلمة المرور الحالية غير صحيحة" });
        return;
      }

      // تحديث كلمة المرور

      const { error: updateError } = await supabase.auth.updateUser({
        password: form.next,
      });

      if (updateError) {
        throw updateError;
      }

      // إلغاء علامة "لازم يغيّر كلمة المرور"

      const { data: updatedRows, error: flagError } = await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", user.id)
        .select("id, must_change_password");

      if (flagError) {
        throw flagError;
      }

      // لو الـ update رجع من غير error لكن من غير ما يعدل أي صف
      // (بسبب RLS أو اختلاف اسم العمود) هنكتشف المشكلة هنا بدل ما تفشل بصمت
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error(
          "تم تغيير كلمة المرور، لكن تعذّر تحديث حالة الحساب. يرجى مراجعة صلاحيات الجدول (RLS)."
        );
      }

      onSuccess();
    } catch (error: any) {
      setErrors({
        general:
          error?.message || "حدث خطأ أثناء تغيير كلمة المرور",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60"
      dir="rtl"
    >
      <div className="bg-white rounded-[20px] p-6 w-[90%] max-w-sm flex flex-col gap-5 shadow-xl">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#DCF4DF" }}
          >
            <KeyRound size={16} style={{ color: "#5B795F" }} />
          </div>

          <span
            style={{
              ...F,
              fontSize: 18,
              color: "#2d3648",
              fontWeight: 700,
            }}
          >
            يجب تغيير كلمة المرور
          </span>
        </div>

        <p
          style={{
            ...F,
            fontSize: 13,
            color: "#717d96",
            lineHeight: 1.6,
          }}
        >
          هذا الحساب لا يزال يستخدم كلمة المرور الافتراضية. يرجى تعيين
          كلمة مرور جديدة قبل المتابعة.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errors.general && (
            <div
              className="rounded-[8px] px-3 py-2"
              style={{
                ...F,
                fontSize: 13,
                color: "#b91c1c",
                background: "#fef2f2",
                border: "1px solid #fecaca",
              }}
            >
              {errors.general}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>
              كلمة المرور الحالية (الافتراضية)
            </label>

            <input
              type="password"
              value={form.current}
              disabled={loading}
              autoComplete="current-password"
              onChange={(e) =>
                setForm((p) => ({ ...p, current: e.target.value }))
              }
              className={`h-[44px] w-full rounded-[8px] border px-3 text-right outline-none ${
                errors.current ? "border-red-500" : "border-[#e2e7f0]"
              } disabled:bg-gray-100`}
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />

            {errors.current && (
              <span style={{ ...F, fontSize: 12, color: "#e3282c" }}>
                {errors.current}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>
              كلمة المرور الجديدة
            </label>

            <input
              type="password"
              value={form.next}
              disabled={loading}
              autoComplete="new-password"
              onChange={(e) =>
                setForm((p) => ({ ...p, next: e.target.value }))
              }
              className={`h-[44px] w-full rounded-[8px] border px-3 text-right outline-none ${
                errors.next ? "border-red-500" : "border-[#e2e7f0]"
              } disabled:bg-gray-100`}
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />

            {errors.next ? (
              <span style={{ ...F, fontSize: 12, color: "#e3282c" }}>
                {errors.next}
              </span>
            ) : (
              <span style={{ ...F, fontSize: 11, color: "#a0abc0" }}>
                6 أحرف على الأقل، وتحتوي على حروف وأرقام معاً
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>
              تأكيد كلمة المرور
            </label>

            <input
              type="password"
              value={form.confirm}
              disabled={loading}
              autoComplete="new-password"
              onChange={(e) =>
                setForm((p) => ({ ...p, confirm: e.target.value }))
              }
              className={`h-[44px] w-full rounded-[8px] border px-3 text-right outline-none ${
                errors.confirm ? "border-red-500" : "border-[#e2e7f0]"
              } disabled:bg-gray-100`}
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />

            {errors.confirm && (
              <span style={{ ...F, fontSize: 12, color: "#e3282c" }}>
                {errors.confirm}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-[48px] rounded-[8px] flex items-center justify-center mt-1 hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(to bottom, #00b867, #00522e)",
            }}
          >
            <span style={{ ...F, fontSize: 15, color: "#fff" }}>
              {loading ? "جاري الحفظ..." : "حفظ كلمة المرور والمتابعة"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}