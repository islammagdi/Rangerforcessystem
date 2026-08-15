import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";

import { Sidebar } from "../components/dashboard/Sidebar";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { SessionManager } from "../components/auth/SessionManager";
import { supabase } from "../../lib/supabase";
import { UnauthorizedPage } from "./UnauthorizedPage";
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
};
// ============================================================
// صلاحيات الوصول لكل مسار — نفس الأدوار المستخدمة في Sidebar
// ============================================================

type RoleCode =
  | "ADMIN"
  | "PERSONNEL_OFFICER"
  | "ARCHIVE_OFFICER"
  | "USER"
  | null;

const ALL_ROLES: RoleCode[] = [
  "ADMIN",
  "PERSONNEL_OFFICER",
  "ARCHIVE_OFFICER",
  "USER",
];

const PATH_ROLE_MAP: { prefix: string; roles: RoleCode[] }[] = [
  { prefix: "/dashboard/individual-query", roles: ALL_ROLES },
  { prefix: "/dashboard/units-report", roles: ALL_ROLES },
  { prefix: "/dashboard/daily-reports", roles: ALL_ROLES },

  { prefix: "/dashboard/add-soldier", roles: ["ADMIN", "PERSONNEL_OFFICER"] },
  { prefix: "/dashboard/issue-letter", roles: ["ADMIN", "PERSONNEL_OFFICER"] },

  { prefix: "/dashboard/letters-archive", roles: ["ADMIN", "ARCHIVE_OFFICER"] },
  { prefix: "/dashboard/reserve-batches", roles: ["ADMIN", "ARCHIVE_OFFICER"] },

  { prefix: "/dashboard/manage-units", roles: ["ADMIN"] },
  { prefix: "/dashboard/manage-users", roles: ["ADMIN"] },
  { prefix: "/dashboard/data-backup", roles: ["ADMIN"] },
  { prefix: "/dashboard/activity-log", roles: ["ADMIN"] },
  { prefix: "/dashboard/manage-branch-heads", roles: ["ADMIN"] },
  {
  prefix: "/dashboard/manage-reserve-batches",
  roles: ["ADMIN"],
},
];

function isPathAllowed(pathname: string, role: RoleCode): boolean {
  // الصفحة الرئيسية /dashboard متاحة للجميع
  if (pathname === "/dashboard") {
    return true;
  }

  const rule = PATH_ROLE_MAP.find((r) => pathname.startsWith(r.prefix));

  // لو المسار مش موجود في الخريطة، نمنعه افتراضيًا (Fail closed) بدل ما نسمح بيه بالغلط
  if (!rule) {
    return false;
  }

  return role !== null && rule.roles.includes(role);
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
  if (
    pathname.match(
      /\/dashboard\/units-report\/\d+\/soldiers/
    )
  ) {
    return "بيان الوحدات / بيانات الوحدة / افراد الوحده";
  }

  // تفاصيل الوحدة
  if (
    pathname.match(
      /\/dashboard\/units-report\/\d+/
    )
  ) {
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
  if (pathname.includes("/activity-log")) {
  return "سجل العمليات";
}
if (pathname.includes("/data-backup")) {
  return "النسخ الاحتياطي للبيانات";
}
if (pathname.includes("/manage-reserve-batches")) {
  return "إدارة دفعات الرديف";
}

  // القيمة الافتراضية
  return "الموقف العام";
}

// ============================================================
// Dashboard Layout
// ============================================================

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [roleCode, setRoleCode] = useState<RoleCode>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = resolvePageTitle(
    location.pathname
  );

  // ==========================================================
  // جلب دور المستخدم الحالي — مطلوب لحماية المسارات فعليًا
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadRole() {
      setRoleLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) {
          setRoleCode(null);
          setRoleLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          role_id,
          roles (
            id,
            name,
            code
          )
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("LOAD ROLE ERROR (guard):", error);
      }

      const role = Array.isArray(data?.roles)
        ? data?.roles[0]
        : data?.roles;

      if (mounted) {
        setRoleCode((role?.code as RoleCode) ?? null);
        setRoleLoading(false);
      }
    }

    loadRole();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // التحقق من صلاحية الوصول للمسار الحالي
  // ==========================================================


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
    } else if (label === "سجل العمليات") {
      navigate("/dashboard/activity-log");
    }
    else if (label === "النسخ الاحتياطي للبيانات") {
  navigate("/dashboard/data-backup");
}
  else if (label === "رؤساء فرع التنظيم") {
  navigate("/dashboard/manage-branch-heads");
}
else if (label === "إدارة دفعات الرديف") {
  navigate("/dashboard/manage-reserve-batches");
}
  }

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#f7f9fc]"
      dir="rtl"
      style={{
        fontFamily: "'Almarai', sans-serif",
      }}
    >
      {/* ======================================================
          Session Manager
          
          مهم:
          هذا المكون مسؤول عن مراقبة الـ Session
          وعدم وجود تفاعل لمدة 5 دقائق.
          
          يفضل وضعه داخل الـ Dashboard وليس داخل Login.
          ====================================================== */}

      <SessionManager />

      {/* ======================================================
          Sidebar
          ====================================================== */}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() =>
          setSidebarCollapsed((previous) => !previous)
        }
        onNavSelect={handleNavSelect}
        activePath={location.pathname}
      />

      {/* ======================================================
          Main Content
          ====================================================== */}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}

        <DashboardHeader
          pageTitle={pageTitle}
        />

        {/* ====================================================
            Page Content
            ==================================================== */}

<main className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 p-6">
            {roleLoading ? (
              <div className="flex items-center justify-center py-20">
                <span style={{ fontFamily: "'Almarai', sans-serif", fontSize: 16, color: "#717d96" }}>
                  جاري التحقق من الصلاحيات...
                </span>
              </div>
            ) : isPathAllowed(location.pathname, roleCode) ? (
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