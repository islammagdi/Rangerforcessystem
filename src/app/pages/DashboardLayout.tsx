import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";

import { Sidebar } from "../components/dashboard/Sidebar";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { SessionManager } from "../components/auth/SessionManager";
import { UnauthorizedPage } from "./UnauthorizedPage";
import { usePermissions } from "../../lib/usePermissions";

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

  // القيمة الافتراضية
  return "الموقف العام";
}

// ============================================================
// Dashboard Layout
// ============================================================

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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
    </div>
  );
}