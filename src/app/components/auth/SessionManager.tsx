import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { supabase } from "../../../lib/supabase";

const INACTIVITY_TIME = 60 * 60 * 1000; // 5 دقائق

export function SessionManager() {
  const location = useLocation();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activityThrottleRef = useRef<number>(0);
  const loggingOutRef = useRef(false);

  // ============================================
  // إلغاء المؤقت
  // ============================================

  function clearInactivityTimer() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  // ============================================
  // تسجيل الخروج بسبب عدم النشاط
  // ============================================

  async function forceLogout() {
    if (loggingOutRef.current) {
      return;
    }

    loggingOutRef.current = true;

    console.log(
      "تم تسجيل الخروج بسبب عدم النشاط لمدة 5 دقائق"
    );

    clearInactivityTimer();

    try {
      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) {
        console.error(
          "AUTO LOGOUT ERROR:",
          error
        );
      }
    } catch (error) {
      console.error(
        "AUTO LOGOUT EXCEPTION:",
        error
      );
    } finally {
      // مسح بيانات المستخدم المؤقتة
      sessionStorage.clear();

      // نفس طريقة تسجيل الخروج اليدوي الموجودة عندك
      window.location.replace("/");
    }
  }

  // ============================================
  // بدء مؤقت عدم النشاط
  // ============================================

  function startInactivityTimer() {
    clearInactivityTimer();

    timerRef.current = setTimeout(() => {
      forceLogout();
    }, INACTIVITY_TIME);

    console.log(
      "بدأ عداد عدم النشاط: 5 دقائق"
    );
  }

  // ============================================
  // عند حدوث نشاط من المستخدم
  // ============================================

  function handleActivity() {
    if (loggingOutRef.current) {
      return;
    }

    const now = Date.now();

    // منع mousemove من إعادة تشغيل المؤقت باستمرار
    if (
      now - activityThrottleRef.current < 1000
    ) {
      return;
    }

    activityThrottleRef.current = now;

    startInactivityTimer();
  }

  // ============================================
  // فحص Session
  // ============================================

  async function checkSession() {
    try {
      const {
        data,
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(
          "GET SESSION ERROR:",
          error
        );

        return;
      }

      const session = data.session;

      // ==========================================
      // لا توجد Session
      // ==========================================

      if (!session) {
        clearInactivityTimer();

        // لو مش في صفحة تسجيل الدخول
        // نرجعه للصفحة الرئيسية
        if (location.pathname !== "/") {
          window.location.replace("/");
        }

        return;
      }

      // ==========================================
      // توجد Session
      // ==========================================

      console.log(
        "Session موجودة:",
        session.user.id
      );

      // ==========================================
      // لو المستخدم فتح رابط Login وهو مسجل دخول
      // ==========================================

      if (location.pathname === "/") {
        window.location.replace("/dashboard");
        return;
      }

      // ==========================================
      // المستخدم داخل النظام
      // نبدأ عداد الـ 5 دقائق
      // ==========================================

      startInactivityTimer();

    } catch (error) {
      console.error(
        "CHECK SESSION ERROR:",
        error
      );
    }
  }

  // ============================================
  // تشغيل Session Manager
  // ============================================

  useEffect(() => {
    checkSession();

    const events = [
      "click",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "mousemove",
    ];

    events.forEach((event) => {
      window.addEventListener(
        event,
        handleActivity,
        {
          passive: true,
        }
      );
    });

    // ==========================================
    // مراقبة تغير Session
    // ==========================================

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log(
            "AUTH EVENT:",
            event
          );

          // ========================================
          // المستخدم خرج
          // ========================================

          if (!session) {
            clearInactivityTimer();

            if (location.pathname !== "/") {
              window.location.replace("/");
            }

            return;
          }

          // ========================================
          // Session موجودة
          // ========================================

          if (location.pathname === "/") {
            window.location.replace("/dashboard");
            return;
          }

          // إعادة تشغيل عداد الخمول
          startInactivityTimer();
        }
      );

    // ============================================
    // Cleanup
    // ============================================

    return () => {
      clearInactivityTimer();

      events.forEach((event) => {
        window.removeEventListener(
          event,
          handleActivity
        );
      });

      authListener.subscription.unsubscribe();
    };
  }, [location.pathname]);

  return null;
}