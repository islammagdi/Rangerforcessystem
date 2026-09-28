  import { useEffect, useRef, useState } from "react";
  import { createPortal } from "react-dom";
  import { useLocation } from "react-router";
  import { AlertTriangle } from "lucide-react";
  import { supabase } from "../../../lib/supabase";
  import { useUnsavedChanges } from "../../../lib/unsavedChanges";

  const F: React.CSSProperties = {
    fontFamily: "'Almarai', sans-serif",
  };

// المدة الكلية قبل تسجيل الخروج
const INACTIVITY_TIME = 5 * 60 * 1000; // دقيقتين

// قد إيه قبل نهاية المدة يظهر التحذير (فقط للعمليات الحساسة)
const WARNING_DURATION = 10 * 1000; // 15 ثانية فقط

export function SessionManager() {
  const location = useLocation();
  const { isDirty, isPerformingSensitiveOperation } =
    useUnsavedChanges();
  // بنمسك isDirty في ref عشان نقدر نقرأه وقت اللحظة الفعلية
  // (مش وقت تسجيل الـ listener)، بنفس أسلوب loggingOutRef الموجود
  const isDirtyRef = useRef(isDirty);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // نفس الطريقة: نمسك حالة العملية الحساسة في ref
  const isPerformingSensitiveOperationRef = useRef(
    isPerformingSensitiveOperation
  );
  useEffect(() => {
    isPerformingSensitiveOperationRef.current =
      isPerformingSensitiveOperation;
  }, [isPerformingSensitiveOperation]);

    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
      null
    );
    const loggingOutRef = useRef(false);
    const warningVisibleRef = useRef(false);

    const [showWarning, setShowWarning] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(WARNING_DURATION / 1000);

    function clearAllTimers() {
      if (warningTimerRef.current !== null) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }

      if (countdownIntervalRef.current !== null) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    function hideWarning() {
      warningVisibleRef.current = false;
      setShowWarning(false);

      if (countdownIntervalRef.current !== null) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    // تسجيل الخروج بسبب عدم النشاط
    async function forceLogout() {
      if (loggingOutRef.current) {
        return;
      }

      loggingOutRef.current = true;

      clearAllTimers();
      hideWarning();

      try {
        await supabase.auth.signOut({ scope: "local" });
      } finally {
        // مسح بيانات المستخدم المؤقتة
        sessionStorage.clear();

        // نفس طريقة تسجيل الخروج اليدوي الموجودة عندك
        window.location.replace("/");
      }
    }

  // بداية العد التنازلي: بيظهر البوب اب فقط للعمليات الحساسة
  // ويبدأ ينزل ثانية بثانية، ولو وصل صفر بيسجل خروج فعليًا
  // (الأمان أولوية حتى لو فيه بيانات غير محفوظة — لكن بعد ما اتحذّر المستخدم بوضوح)
  function triggerWarning() {
    if (loggingOutRef.current) {
      return;
    }

    // التحذير يظهر فقط لو كان في عملية حساسة جارية
    // لو العملية عادية (استعلام مثلاً)، نسجل خروج مباشرة بدون تحذير
    if (!isPerformingSensitiveOperationRef.current) {
      forceLogout();
      return;
    }

    warningVisibleRef.current = true;
    setSecondsLeft(WARNING_DURATION / 1000);
    setShowWarning(true);

      countdownIntervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current !== null) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }

            forceLogout();
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    }

    // جدولة ظهور التحذير بعد (المدة الكلية - مدة التحذير)
    function scheduleWarning() {
      clearAllTimers();

      warningTimerRef.current = setTimeout(() => {
        triggerWarning();
      }, INACTIVITY_TIME - WARNING_DURATION);
    }

    // المستخدم ضغط "أنا هنا، تابع العمل" — ضغطة فعلية حقيقية،
    // فبنأكد استمرار الجلسة ونرجّع العداد لأول مرحلة تاني بالكامل
    function handleContinueSession() {
      hideWarning();
      scheduleWarning();
    }

    const activityThrottleRef = useRef<number>(0);

    function handleActivity() {
      if (loggingOutRef.current) {
        return;
      }

      // طول ما التحذير ظاهر، تحريك الماوس أو أي تفاعل سلبي تاني
      // مبيقفلوش التحذير تلقائيًا — لازم ضغطة صريحة على الزرار،
      // عشان نضمن إن الجلسة فعلاً استمرت لمستخدم موجود بالفعل
      if (warningVisibleRef.current) {
        return;
      }

      const now = Date.now();

      // منع mousemove من إعادة تشغيل المؤقت باستمرار
      if (now - activityThrottleRef.current < 1000) {
        return;
      }

      activityThrottleRef.current = now;

      scheduleWarning();
    }

    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          return;
        }

        const session = data.session;

        // لا توجد Session
        if (!session) {
          clearAllTimers();
          hideWarning();

          // لو مش في صفحة تسجيل الدخول نرجعه للصفحة الرئيسية
          if (location.pathname !== "/") {
            window.location.replace("/");
          }

          return;
        }

        // لو المستخدم فتح رابط Login وهو مسجل دخول
        if (location.pathname === "/") {
          window.location.replace("/dashboard");
          return;
        }

        // المستخدم داخل النظام، نبدأ عداد الخمول
        scheduleWarning();
      } catch {
        // تجاهل الخطأ بصمت
      }
    }

    useEffect(() => {
      checkSession();

      const events = [
        "click",
        "mousedown",
        "keydown",
        "keyup",
        "input",
        "change",
        "focusin",
        "touchstart",
        "scroll",
        "wheel",
        "mousemove",
        "pointermove",
      ];

      events.forEach((event) => {
        window.addEventListener(event, handleActivity, {
          passive: true,
          capture: true,
        });
      });

      // مراقبة تغير Session
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          // المستخدم خرج
          if (!session) {
            clearAllTimers();
            hideWarning();

            if (location.pathname !== "/") {
              window.location.replace("/");
            }

            return;
          }

          // Session موجودة
          if (location.pathname === "/") {
            window.location.replace("/dashboard");
            return;
          }

          // إعادة تشغيل عداد الخمول
          scheduleWarning();
        }
      );

      return () => {
        clearAllTimers();

        events.forEach((event) => {
          window.removeEventListener(event, handleActivity, { capture: true });
        });

        authListener.subscription.unsubscribe();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    if (!showWarning) {
      return null;
    }

    return createPortal(
      <div
        className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4"
        dir="rtl"
      >
        <div className="bg-white rounded-[16px] p-6 w-full max-w-sm flex flex-col gap-5 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "#fff7ed" }}
            >
              <AlertTriangle size={18} style={{ color: "#c2680d" }} />
            </div>

            <p style={{ ...F, fontWeight: 700, fontSize: 18, color: "#2d3648" }}>
              جلستك على وشك الانتهاء
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p
              className="text-right"
              style={{ ...F, fontSize: 14, color: "#717d96", lineHeight: 1.8 }}
            >
              بسبب عدم النشاط، سيتم تسجيل خروجك تلقائيًا خلال{" "}
              <strong style={{ color: "#c2680d" }}>{secondsLeft}</strong>{" "}
              ثانية.
            </p>

            {isDirtyRef.current && (
              <p
                className="text-right rounded-[8px] px-3 py-2.5"
                style={{
                  ...F,
                  fontSize: 13,
                  color: "#9d2e15",
                  lineHeight: 1.7,
                  background: "#fce8f1",
                }}
              >
                ⚠️ لديك تعديلات لم تُحفظ في هذه الصفحة، وستفقدها إذا انتهت
                الجلسة الآن.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 justify-start flex-row-reverse">
            <button
              type="button"
              onClick={handleContinueSession}
              autoFocus
              className="px-5 py-2.5 rounded-[8px] flex-1 sm:flex-initial"
              style={{
                background: "linear-gradient(to bottom, #00b867, #00522e)",
                ...F,
                fontSize: 14,
                color: "#fff",
              }}
            >
              أنا هنا، تابع العمل
            </button>

            <button
              type="button"
              onClick={() => void forceLogout()}
              className="px-5 py-2.5 rounded-[8px] border flex-1 sm:flex-initial"
              style={{
                borderColor: "#e2e7f0",
                ...F,
                fontSize: 14,
                color: "#717d96",
              }}
            >
              تسجيل الخروج الآن
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }