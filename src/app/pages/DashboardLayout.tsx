import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Sidebar } from "../components/dashboard/Sidebar";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";

// Map route paths → breadcrumb titles
const PAGE_TITLES: Record<string, string> = {
  "/dashboard":                           "الموقف العام",
  "/dashboard/individual-query":          "الاستعلام عن فرد",
  "/dashboard/add-soldier":               "اضافة قوة جديدة",
  "/dashboard/add-soldier/review":        "اضافة قوة جديدة",
  "/dashboard/add-soldier/group-review":  "اضافة قوة جديدة",
  "/dashboard/add-soldier/success":       "اضافة قوة جديدة",
  "/dashboard/add-soldier/group-success": "اضافة قوة جديدة",
  "/dashboard/units-report":              "بيان الوحدات",
  "/dashboard/issue-letter":              "إصدار خطاب",
  "/dashboard/issue-letter/soldiers":     "إصدار خطاب",
  "/dashboard/issue-letter/letter-data":  "إصدار خطاب",
  "/dashboard/letters-archive":           "سجل الخطابات",
};

function resolvePageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.endsWith("/edit")) return "الاستعلام عن فرد / بيانات الفرد";
  if (pathname.includes("/individual-query/soldier/")) return "الاستعلام عن فرد / بيانات الفرد";
  if (pathname.match(/\/dashboard\/units-report\/\d+\/soldiers/)) return "بيان الوحدات / بيانات الوحدة / افراد الوحده";
  if (pathname.match(/\/dashboard\/units-report\/\d+/)) return "بيان الوحدات / بيانات الوحدة";
  if (pathname.includes("/issue-letter")) return "إصدار خطاب";
  if (pathname.includes("/letters-archive")) return "سجل الخطابات";
  return "الموقف العام";
}

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const pageTitle = resolvePageTitle(location.pathname);

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
    }
    // other items can be wired up later
  }

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#f7f9fc]"
      dir="rtl"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
        onNavSelect={handleNavSelect}
        activePath={location.pathname}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader pageTitle={pageTitle} />

        <main className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}