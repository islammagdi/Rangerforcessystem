import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";

import { Sidebar } from "../components/dashboard/Sidebar";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { SessionManager } from "../components/auth/SessionManager";

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
};

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

  // القيمة الافتراضية
  return "الموقف العام";
}

// ============================================================
// Dashboard Layout
// ============================================================

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = resolvePageTitle(
    location.pathname
  );

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
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}