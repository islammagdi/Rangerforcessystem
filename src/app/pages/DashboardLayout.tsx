import { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";

import { Sidebar } from "../components/dashboard/Sidebar";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { SessionManager } from "../components/auth/SessionManager";
import { ForceChangePasswordModal } from "../components/auth/ForceChangePasswordModal";
import { UnauthorizedPage } from "./UnauthorizedPage";
import { usePermissions } from "../../lib/usePermissions";
import { supabase } from "../../lib/supabase";

// ============================================================
// عناوين الصفحات
// ============================================================

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "الموقف العام",

  "/dashboard/individual-query": "الاستعلام عن فرد",

  "/dashboard/add-soldier": "اضافة قوة جديدة",
  "/dashboard/add-soldier/review": "اضافة قوة جديدة",
  "/dashboard/add-soldier/group-review": "اضافة قوة جديدة",
  "/dashboard/add-soldier/success": "اضافة قوة جديدة",
  "/dashboard/add-soldier/group-success": "اضافة قوة جديدة",

  "/dashboard/units-report": "بيان الوحدات",

  "/dashboard/issue-letter": "إصدار خطاب",
  "/dashboard/issue-letter/soldiers": "إصدار خطاب",
  "/dashboard/issue-letter/letter-data": "إصدار خطاب",
  "/dashboard/issue-letter/review": "إصدار خطاب",

  "/dashboard/letters-archive": "سجل الخطابات",

  "/dashboard/daily-reports": "اليوميات",

  "/dashboard/reserve-batches": "دفعات الرديف",

  "/dashboard/manage-units": "ادارة الوحدات",

  "/dashboard/manage-users": "ادارة المستخدمين",
  "/dashboard/activity-log": "سجل العمليات",
  "/dashboard/data-backup": "النسخ الاحتياطي للبيانات",
  "/dashboard/manage-reserve-batches": "إدارة دفعات الرديف",
  "/dashboard/notifications": "جميع الإشعارات",
  "/dashboard/user-guide": "دليل استخدام المنظومة",
  "/dashboard/archive/outgoing": "الأرشيف / صادر",
  "/dashboard/archive/incoming": "الأرشيف / وارد",
  "/dashboard/manage-unified-registry": "إدارة ملف القيد الموحّد",
  "/dashboard/manage-roles": "إدارة الأدوار",
  "/dashboard/manage-branch-heads": "رؤساء فرع التنظيم",
  "/dashboard/manage-external-administrations": "الإدارات الخارجية",
};

// ============================================================
// صلاحيات الوصول لكل مسار (بدل الأدوار الثابتة)
// ============================================================
//
// كل مسار مرتبط بصلاحية "view" بتاعة الـ module المسؤول عنه.
// أي مستخدم عنده الصلاحية دي (من أي دور) هيدخل الصفحة، وأي حد
// من غيرها هيتحول لصفحة "غير مصرح". محدش محتاج يتعدل هنا لما
// نضيف دور جديد من صفحة "إدارة الأدوار" - الدور الجديد هيرث
// نفس المنطق تلقائيًا حسب الصلاحيات المعطاة له.

const PATH_PERMISSION_MAP: { prefix: string; permission: string }[] = [
  { prefix: "/dashboard/individual-query", permission: "individual_query:view" },
  { prefix: "/dashboard/units-report", permission: "units_report:view" },
  { prefix: "/dashboard/daily-reports", permission: "daily_reports:view" },

  { prefix: "/dashboard/add-soldier", permission: "add_soldier:view" },
  { prefix: "/dashboard/issue-letter", permission: "issue_letter:view" },

  { prefix: "/dashboard/letters-archive", permission: "letters_archive:view" },
  { prefix: "/dashboard/reserve-batches", permission: "reserve_batches:view" },

  { prefix: "/dashboard/manage-units", permission: "manage_units:view" },
  { prefix: "/dashboard/manage-users", permission: "manage_users:view" },
  { prefix: "/dashboard/manage-roles", permission: "manage_roles:view" },
  { prefix: "/dashboard/data-backup", permission: "data_backup:view" },
  { prefix: "/dashboard/activity-log", permission: "activity_log:view" },
  { prefix: "/dashboard/manage-branch-heads", permission: "manage_branch_heads:view" },
  { prefix: "/dashboard/manage-reserve-batches", permission: "manage_reserve_batches:view" },
  { prefix: "/dashboard/manage-external-administrations", permission: "external_administrations:view" },

  { prefix: "/dashboard/archive", permission: "archive_outgoing:view" },

  // الفورم (إضافة/تعديل) يطلب صلاحية "create" - لازم يتحقق قبل
  // القاعدة العامة الأقصر بتاعة "view"، وبما إن isPathAllowed
  // بتختار أطول prefix متطابق تلقائيًا، وضعه هنا كافي
  { prefix: "/dashboard/training-recommendations/", permission: "training_recommendations:create" },
  { prefix: "/dashboard/training-recommendations", permission: "training_recommendations:view" },

  { prefix: "/dashboard/manage-unified-registry", permission: "manage_unified_registry:view" },
  // صفحات متاحة لأي مستخدم مسجل دخول (مفيش صلاحية module خاصة بيها)
  { prefix: "/dashboard/notifications", permission: "general_status:view" },
  { prefix: "/dashboard/user-guide", permission: "general_status:view" },
];

function isPathAllowed(
  pathname: string,
  hasPermission: (code: string) => boolean
): boolean {
  // الصفحة الرئيسية /dashboard متاحة لأي مستخدم مسجل دخول
  if (pathname === "/dashboard") {
    return true;
  }

  // أطول تطابق بادئة (prefix) عشان نتجنب تصادم مسارات متشابهة
  const rule = [...PATH_PERMISSION_MAP]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((r) => pathname.startsWith(r.prefix));

  // لو المسار مش موجود في الخريطة، نمنعه افتراضيًا (Fail closed)
  if (!rule) {
    return false;
  }

  return hasPermission(rule.permission);
}

// ============================================================
// تحديد عنوان الصفحة الحالية
// ============================================================

function resolvePageTitle(pathname: string): string {
  // العناوين المباشرة
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  // تعديل بيانات الفرد
  if (pathname.endsWith("/edit")) {
    return "الاستعلام عن فرد / بيانات الفرد";
  }

  // تفاصيل الفرد
  if (pathname.includes("/individual-query/soldier/")) {
    return "الاستعلام عن فرد / بيانات الفرد";
  }

  // أفراد الوحدة
  if (pathname.match(/\/dashboard\/units-report\/\d+\/soldiers/)) {
    return "بيان الوحدات / بيانات الوحدة / افراد الوحده";
  }

  // تفاصيل الوحدة
  if (pathname.match(/\/dashboard\/units-report\/\d+/)) {
    return "بيان الوحدات / بيانات الوحدة";
  }

  // إصدار خطاب
  if (pathname.includes("/issue-letter")) {
    return "إصدار خطاب";
  }

  // سجل الخطابات
  if (pathname.includes("/letters-archive")) {
    return "سجل الخطابات";
  }

  // اليوميات
  if (pathname.includes("/daily-reports")) {
    return "اليوميات";
  }

  // دفعات الرديف
  if (pathname.includes("/reserve-batches")) {
    return "دفعات الرديف";
  }

  // إدارة الوحدات
  if (pathname.includes("/manage-units")) {
    return "ادارة الوحدات";
  }

  // إدارة المستخدمين
  if (pathname.includes("/manage-users")) {
    return "ادارة المستخدمين";
  }

  if (pathname.includes("/manage-roles")) {
    return "إدارة الأدوار";
  }

  if (pathname.includes("/activity-log")) {
    return "سجل العمليات";
  }

  if (pathname.includes("/data-backup")) {
    return "النسخ الاحتياطي للبيانات";
  }

  if (pathname.includes("/manage-reserve-batches")) {
    return "إدارة دفعات الرديف";
  }

  if (pathname.includes("/archive/outgoing")) {
    return "الأرشيف / صادر";
  }

  if (pathname.includes("/archive/incoming")) {
    return "الأرشيف / وارد";
  }

  if (pathname.includes("/manage-external-administrations")) {
    return "الإدارات الخارجية";
  }

  // القيمة الافتراضية
  return "الموقف العام";
}

// ============================================================
// Dashboard Layout
// ============================================================

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accountDisabled, setAccountDisabled] = useState(false);
  const [checkingPasswordFlag, setCheckingPasswordFlag] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // رقم نسخة لكل عملية فحص لحالة الحساب، عشان لو أكتر من فحص
  // اتنفذوا في نفس الوقت (مثلاً بسبب حدث SIGNED_IN)، نتجاهل أي
  // نتيجة قديمة توصل متأخرة بعد نتيجة أحدث منها.
  const checkIdRef = useRef(0);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    let intervalId: number | undefined;

    async function checkAccountStatus() {
      const currentCheckId = ++checkIdRef.current;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) setCheckingPasswordFlag(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("must_change_password, is_active")
          .eq("id", user.id)
          .maybeSingle();

        // لو فيه فحص أحدث اتشغّل بعد الفحص ده، نتجاهل النتيجة القديمة
        if (currentCheckId !== checkIdRef.current) {
          return;
        }

        if (error) {
          console.error("CHECK ACCOUNT STATUS ERROR:", error);
          if (mounted) setCheckingPasswordFlag(false);
          return;
        }

        if (!mounted) return;

        // ✅ لو الحساب اتقفل من صفحة إدارة المستخدمين، سجّل خروج فورًا
        if (data && data.is_active === false) {
          if (intervalId) window.clearInterval(intervalId);
          setAccountDisabled(true);

          await supabase.auth.signOut();

          // نستنى شوية عشان المستخدم يشوف الرسالة قبل التحويل
          window.setTimeout(() => {
            window.location.href = "/login";
          }, 2500);

          return;
        }

        setMustChangePassword(Boolean(data?.must_change_password));
      } catch (err) {
        console.error("CHECK ACCOUNT STATUS EXCEPTION:", err);
      } finally {
        if (mounted && currentCheckId === checkIdRef.current) {
          setCheckingPasswordFlag(false);
        }
      }
    }

    // تحقق فوري عند تحميل الصفحة
    checkAccountStatus();

    // تحقق دوري كل 30 ثانية طول ما المستخدم فاتح الصفحة
    intervalId = window.setInterval(checkAccountStatus, 30000);

    // تحقق فوري لما المستخدم يرجع للتبويب (بعد ما يكون سايبه شوية)
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkAccountStatus();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const pageTitle = resolvePageTitle(location.pathname);

  // ==========================================================
  // صلاحيات المستخدم الحالي - مصدر واحد للحقيقة يستخدمه
  // كل من الـ Sidebar وحماية المسارات هنا
  // ==========================================================

  const { loading: permsLoading, hasPermission } = usePermissions();

  // ==========================================================
  // التنقل من الـ Sidebar
  // ==========================================================

  function handleNavSelect(label: string) {
    if (label === "الاستعلام عن فرد") {
      navigate("/dashboard/individual-query");
    } else if (label === "الموقف العام") {
      navigate("/dashboard");
    } else if (label === "اضافة قوة جديدة") {
      navigate("/dashboard/add-soldier");
    } else if (label === "بيان الوحدات") {
      navigate("/dashboard/units-report");
    } else if (label === "إصدار خطاب") {
      navigate("/dashboard/issue-letter");
    } else if (label === "سجل الخطابات") {
      navigate("/dashboard/letters-archive");
    } else if (label === "اليوميات") {
      navigate("/dashboard/daily-reports");
    } else if (label === "دفعات الرديف") {
      navigate("/dashboard/reserve-batches");
    } else if (label === "ادارة الوحدات") {
      navigate("/dashboard/manage-units");
    } else if (label === "ادارة المستخدمين") {
      navigate("/dashboard/manage-users");
    } else if (label === "إدارة الأدوار") {
      navigate("/dashboard/manage-roles");
    } else if (label === "سجل العمليات") {
      navigate("/dashboard/activity-log");
    } else if (label === "النسخ الاحتياطي للبيانات") {
      navigate("/dashboard/data-backup");
    } else if (label === "رؤساء فرع التنظيم") {
      navigate("/dashboard/manage-branch-heads");
    } else if (label === "إدارة دفعات الرديف") {
      navigate("/dashboard/manage-reserve-batches");
    } else if (label === "الفاكسات - الصادر") {
      navigate("/dashboard/archive/outgoing");
    } else if (label === "الفاكسات - الوارد") {
      navigate("/dashboard/archive/incoming");
    } else if (label === "إدارة ملف القيد الموحّد") {
      navigate("/dashboard/manage-unified-registry");
    } else if (label === "كشوف التوصيات") {
      navigate("/dashboard/training-recommendations");
    } else if (label === "الإدارات الخارجية") {
      navigate("/dashboard/manage-external-administrations");
    }
  }

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#f7f9fc]"
      dir="rtl"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      <SessionManager />

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((previous) => !previous)}
        onNavSelect={handleNavSelect}
        activePath={location.pathname}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader pageTitle={pageTitle} />

        <main className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 p-6">
            {permsLoading ? (
              <div className="flex items-center justify-center py-20">
                <span
                  style={{
                    fontFamily: "'Almarai', sans-serif",
                    fontSize: 16,
                    color: "#717d96",
                  }}
                >
                  جاري التحقق من الصلاحيات...
                </span>
              </div>
            ) : isPathAllowed(location.pathname, hasPermission) ? (
              <Outlet />
            ) : (
              <UnauthorizedPage />
            )}
          </div>
        </main>
      </div>

      {!checkingPasswordFlag && mustChangePassword && (
        <ForceChangePasswordModal
          onSuccess={() => {
            // نلغي أي نتيجة فحص قديمة لسه في الطريق قبل ما نأكد النجاح محليًا
            checkIdRef.current++;
            setMustChangePassword(false);
          }}
        />
      )}

      {accountDisabled && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,.55)" }}
          dir="rtl"
        >
          <div
            className="bg-white rounded-[20px] flex flex-col items-center text-center"
            style={{
              width: "clamp(300px,45vw,480px)",
              padding: "48px 32px",
              fontFamily: "'Almarai', sans-serif",
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "#fce8e8" }}
            >
              <span style={{ color: "#e3282c", fontSize: 30, fontWeight: 700 }}>
                !
              </span>
            </div>

            <p
              style={{
                fontWeight: 700,
                fontSize: 22,
                color: "#2d3648",
                marginTop: 20,
              }}
            >
              تم إيقاف حسابك
            </p>

            <p
              style={{
                fontSize: 15,
                color: "#717d96",
                marginTop: 10,
              }}
            >
              تم إيقاف هذا الحساب من قبل الإدارة. سيتم تسجيل خروجك الآن.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}