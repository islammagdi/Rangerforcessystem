import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  ChevronDown,
  KeyRound,
  ImagePlus,
  X,
  BookOpen,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import imgAvatar from "../../../assets/avatar.png";
import { Breadcrumbs } from "./Breadcrumbs";
import { NotificationBell } from "./NotificationBell";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── Change Password Modal ────────────────────────────────────────────────
function ChangePasswordModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate() {
    const e: Record<string, string> = {};

    if (!form.current) {
      e.current = "كلمة المرور الحالية مطلوبة";
    }

    if (!form.next) {
      e.next = "كلمة المرور الجديدة مطلوبة";
    } else if (form.next.length < 6) {
      e.next = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
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

      // التأكد أن هناك مستخدم مسجل الدخول
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

      // =====================================================
      // التحقق من كلمة المرور الحالية
      // =====================================================

      const email = user.email;

      if (!email) {
        throw new Error(
          "لا يوجد بريد إلكتروني مرتبط بهذا الحساب"
        );
      }

      const {
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email,
        password: form.current,
      });

      if (signInError) {
        setErrors({
          current: "كلمة المرور الحالية غير صحيحة",
        });
        return;
      }

      // =====================================================
      // تغيير كلمة المرور في Supabase Auth
      // =====================================================

      const {
        error: updateError,
      } = await supabase.auth.updateUser({
        password: form.next,
      });

      if (updateError) {
        throw updateError;
      }

      // =====================================================
      // نجاح
      // =====================================================

      setErrors({});
      setSuccess(true);

      setForm({
        current: "",
        next: "",
        confirm: "",
      });

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );

      setErrors({
        general:
          error?.message ||
          "حدث خطأ أثناء تغيير كلمة المرور",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      dir="rtl"
    >
      <div className="bg-white rounded-[20px] p-6 w-[90%] max-w-sm flex flex-col gap-5 shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: "#DCF4DF",
              }}
            >
              <KeyRound
                size={16}
                style={{
                  color: "#5B795F",
                }}
              />
            </div>

            <span
              style={{
                ...F,
                fontSize: 18,
                color: "#2d3648",
                fontWeight: 700,
              }}
            >
              تغيير كلمة المرور
            </span>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-[#a1aebe] hover:text-[#2d3648] disabled:opacity-40"
          >
            <X size={20} />
          </button>

        </div>

        {/* Success */}
        {success ? (

          <div
            className="py-5"
            style={{
              ...F,
              fontSize: 15,
              color: "#166534",
              textAlign: "center",
            }}
          >
            تم تغيير كلمة المرور بنجاح ✓
          </div>

        ) : (

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >

            {/* General Error */}
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

            {/* Current Password */}
            <div className="flex flex-col gap-1">

              <label
                style={{
                  ...F,
                  fontSize: 13,
                  color: "#717d96",
                }}
              >
                كلمة المرور الحالية
              </label>

              <input
                type="password"
                value={form.current}
                disabled={loading}
                autoComplete="current-password"
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    current: e.target.value,
                  }))
                }
                className={`h-[44px] w-full rounded-[8px] border px-3 text-right outline-none ${
                  errors.current
                    ? "border-red-500"
                    : "border-[#e2e7f0]"
                } disabled:bg-gray-100`}
                style={{
                  ...F,
                  fontSize: 14,
                  color: "#2d3648",
                }}
              />

              {errors.current && (
                <span
                  style={{
                    ...F,
                    fontSize: 12,
                    color: "#e3282c",
                  }}
                >
                  {errors.current}
                </span>
              )}

            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1">

              <label
                style={{
                  ...F,
                  fontSize: 13,
                  color: "#717d96",
                }}
              >
                كلمة المرور الجديدة
              </label>

              <input
                type="password"
                value={form.next}
                disabled={loading}
                autoComplete="new-password"
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    next: e.target.value,
                  }))
                }
                className={`h-[44px] w-full rounded-[8px] border px-3 text-right outline-none ${
                  errors.next
                    ? "border-red-500"
                    : "border-[#e2e7f0]"
                } disabled:bg-gray-100`}
                style={{
                  ...F,
                  fontSize: 14,
                  color: "#2d3648",
                }}
              />

              {errors.next && (
                <span
                  style={{
                    ...F,
                    fontSize: 12,
                    color: "#e3282c",
                  }}
                >
                  {errors.next}
                </span>
              )}

            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1">

              <label
                style={{
                  ...F,
                  fontSize: 13,
                  color: "#717d96",
                }}
              >
                تأكيد كلمة المرور
              </label>

              <input
                type="password"
                value={form.confirm}
                disabled={loading}
                autoComplete="new-password"
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    confirm: e.target.value,
                  }))
                }
                className={`h-[44px] w-full rounded-[8px] border px-3 text-right outline-none ${
                  errors.confirm
                    ? "border-red-500"
                    : "border-[#e2e7f0]"
                } disabled:bg-gray-100`}
                style={{
                  ...F,
                  fontSize: 14,
                  color: "#2d3648",
                }}
              />

              {errors.confirm && (
                <span
                  style={{
                    ...F,
                    fontSize: 12,
                    color: "#e3282c",
                  }}
                >
                  {errors.confirm}
                </span>
              )}

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-[48px] rounded-[8px] flex items-center justify-center mt-1 hover:opacity-90 disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
              }}
            >

              <span
                style={{
                  ...F,
                  fontSize: 15,
                  color: "#fff",
                }}
              >
                {loading
                  ? "جاري تغيير كلمة المرور..."
                  : "حفظ كلمة المرور"}
              </span>

            </button>

          </form>
        )}

      </div>
    </div>
  );
}

// ─── Change Picture Modal ─────────────────────────────────────────────────
function ChangePictureModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);

    const f = e.dataTransfer.files[0];

    if (f) {
      handleFile(f);
    }
  }

  function handleSave() {
    setSaved(true);
    setTimeout(onClose, 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      dir="rtl"
    >
      <div className="bg-white rounded-[20px] p-6 w-[90%] max-w-sm flex flex-col gap-5 shadow-xl">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#DCF4DF" }}
            >
              <ImagePlus
                size={16}
                style={{ color: "#5B795F" }}
              />
            </div>

            <span
              style={{
                ...F,
                fontSize: 18,
                color: "#2d3648",
                fontWeight: 700,
              }}
            >
              تغيير الصورة الشخصية
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#a1aebe] hover:text-[#2d3648]"
          >
            <X size={20} />
          </button>
        </div>

        {saved ? (
          <p
            style={{
              ...F,
              fontSize: 15,
              color: "#166534",
              textAlign: "center",
            }}
          >
            تم تحديث الصورة بنجاح ✓
          </p>
        ) : (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-[12px] flex flex-col items-center justify-center gap-3 py-8 px-4 cursor-pointer"
              style={{
                border: `2px dashed ${
                  dragging ? "#5B795F" : "#cbd2e0"
                }`,
                background: dragging ? "#f0f4ff" : "#ffffff",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];

                  if (f) {
                    handleFile(f);
                  }
                }}
              />

              {preview ? (
                <img
                  src={preview}
                  alt="معاينة"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#5B795F]"
                />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#DCF4DF] flex items-center justify-center">
                    <ImagePlus
                      size={28}
                      style={{ color: "#5B795F" }}
                    />
                  </div>

                  <p
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#4a5468",
                      textAlign: "center",
                    }}
                  >
                    اسحب الصورة هنا أو انقر للاختيار
                  </p>

                  <p
                    style={{
                      ...F,
                      fontSize: 12,
                      color: "#a1aebe",
                    }}
                  >
                    PNG, JPG مسموح بهما
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={!preview}
              className="h-[48px] rounded-[8px] flex items-center justify-center hover:opacity-90 disabled:opacity-40"
              style={{
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
              }}
            >
              <span
                style={{
                  ...F,
                  fontSize: 15,
                  color: "#fff",
                }}
              >
                حفظ الصورة
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────
interface DashboardHeaderProps {
  pageTitle?: string;
}

export function DashboardHeader({
  pageTitle = "الموقف العام",
}: DashboardHeaderProps) {

  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [modal, setModal] = useState<
    "password" | "picture" | null
  >(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // جلب بيانات المستخدم الحالي من Supabase
  // ============================================================

  useEffect(() => {
    loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    try {
      setLoadingUser(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(
          "خطأ في Auth:",
          authError
        );
        return;
      }

      if (!user) {
        console.log(
          "لا يوجد مستخدم مسجل الدخول"
        );
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          personnel:personnel_id (
            full_name,
            rank:ranks (
              id,
              name
            )
          )
        `)
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(
          "خطأ في جلب بيانات المستخدم:",
          error
        );
        return;
      }

      console.log(
        "بيانات المستخدم في الهيدر:",
        data
      );

      setCurrentUser(data);

    } catch (error) {
      console.error(
        "خطأ غير متوقع:",
        error
      );
    } finally {
      setLoadingUser(false);
    }
  }

  // ============================================================
  // أول اسمين فقط
  // ============================================================

  function getFirstTwoNames(
    fullName: string | null | undefined
  ) {
    if (!fullName) {
      return "غير محدد";
    }

    const names = fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return names.slice(0, 2).join(" ");
  }

  // ============================================================
  // إغلاق القائمة عند الضغط خارجها
  // ============================================================

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          e.target as Node
        )
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  // ============================================================
  // بيانات العرض
  // ============================================================

  const fullName =
    currentUser?.personnel?.full_name;

  const displayName =
    getFirstTwoNames(fullName);

  const rankName =
    currentUser?.personnel?.rank?.name ||
    "غير محدد";

  return (
    <>
      <header
        className="bg-white h-[100px] w-full border-b border-[#eff0f6] flex items-center justify-between px-7 shrink-0"
      >

        {/* ======================================================
            Right: Page title
        ====================================================== */}

        {/* ======================================================
            Right: Breadcrumbs
        ====================================================== */}

        <div className="flex items-center">
          <Breadcrumbs pathname={location.pathname} />
        </div>

        {/* ======================================================
            Left: User info + avatar
        ====================================================== */}

        <div className="flex items-center gap-3">
          <NotificationBell />
          {/* Avatar + dropdown */}

          <div
            className="flex items-center gap-3 relative shrink-0"
            ref={dropdownRef}
          >

            <button
              type="button"
              onClick={() =>
                setDropdownOpen(
                  (o) => !o
                )
              }
              className="bg-[#93C199] w-10 h-10 rounded-full overflow-hidden relative focus:outline-none ring-offset-1 transition-shadow hover:ring-2 hover:ring-[#DCF4DF]/60"
              aria-label="قائمة المستخدم"
            >
              <img
                src={imgAvatar}
                alt="الصورة الشخصية"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
              />
            </button>

            {/* Dropdown menu */}

            {dropdownOpen && (
              <div
                className="absolute left-0 top-[calc(100%+8px)] z-50 bg-white rounded-[12px] border border-[#eff0f6] shadow-lg overflow-hidden min-w-[180px]"
                dir="rtl"
              >

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setModal("password");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6fb] transition-colors text-right"
                >
                  <KeyRound
                    size={16}
                    style={{
                      color: "#5B795F",
                    }}
                    className="shrink-0"
                  />

                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                    }}
                  >
                    تغيير كلمة المرور
                  </span>
                </button>
<div className="h-px bg-[#eff0f6]" />

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/dashboard/user-guide");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6fb] transition-colors text-right"
                >
                  <BookOpen
                    size={16}
                    style={{ color: "#5B795F" }}
                    className="shrink-0"
                  />

                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                    }}
                  >
                    دليل استخدام المنظومة
                  </span>
                </button>
                <div className="h-px bg-[#eff0f6]" />

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setModal("picture");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6fb] transition-colors text-right"
                >
                  <ImagePlus
                    size={16}
                    style={{
                      color: "#5B795F",
                    }}
                    className="shrink-0"
                  />

                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                    }}
                  >
                    تغيير الصورة الشخصية
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* ====================================================
              بيانات المستخدم من Supabase
          ==================================================== */}

          <div className="flex items-center gap-2.5">

            <div className="flex flex-col items-start gap-0.5">

              <span
                style={{
                  color: "#64748b",
                  fontFamily: "'Almarai', sans-serif",
                  fontSize: "12px",
                }}
              >
                مرحبا بك
              </span>

              <span
                style={{
                  color: "#081021",
                  fontFamily: "'Almarai', sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                {loadingUser
                  ? "جاري التحميل..."
                  : `${rankName} / ${displayName}`}
              </span>

            </div>

          </div>

          <ChevronDown
            size={18}
            className="text-[#081021]"
          />

        </div>
      </header>

      {/* ========================================================
          Modals
      ======================================================== */}

      {modal === "password" && (
        <ChangePasswordModal
          onClose={() =>
            setModal(null)
          }
        />
      )}

      {modal === "picture" && (
        <ChangePictureModal
          onClose={() =>
            setModal(null)
          }
        />
      )}
    </>
  );
}