import { cloneElement, useMemo, useState } from "react";
import { logActivity } from "../../../lib/logActivity";
import {
  LayoutDashboard,
  Search,
  UserPlus,
  FolderOpen,
  Mail,
  BookOpen,
  Users,
  Building2,
  UserCog,
  DatabaseBackup,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileSpreadsheet,
  ShieldCheck,
  Landmark,
  ClipboardList,
   GraduationCap,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../../lib/supabase";
import { FileText } from "lucide-react";
import { FileDown } from "lucide-react";
import { FileUp } from "lucide-react";
import { usePermissions } from "../../../lib/usePermissions";

// =====================================================
// Types
// =====================================================

interface NavItemProps {
  icon: React.ReactElement;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

interface NavDef {
  icon: React.ReactNode;
  label: string;
  section: string;
  // صلاحية الـ "view" المطلوبة عشان يظهر العنصر ده في القائمة.
  // null = يظهر لأي مستخدم مسجل دخول (زي "الموقف العام")
  permission: string | null;
}

// =====================================================
// Label → Route Path Map
// =====================================================

const LABEL_TO_PATH: Record<string, string> = {
  "الموقف العام": "/dashboard",
  "الاستعلام عن فرد": "/dashboard/individual-query",
  "اضافة قوة جديدة": "/dashboard/add-soldier",
  "بيان الوحدات": "/dashboard/units-report",
  "إصدار خطاب": "/dashboard/issue-letter",
  "سجل الخطابات": "/dashboard/letters-archive",
  "اليوميات": "/dashboard/daily-reports",
  "دفعات الرديف": "/dashboard/reserve-batches",
  "ادارة الوحدات": "/dashboard/manage-units",
  "إدارة دفعات الرديف": "/dashboard/manage-reserve-batches",
  "ادارة المستخدمين": "/dashboard/manage-users",
  "النسخ الاحتياطي للبيانات": "/dashboard/data-backup",
  "سجل العمليات": "/dashboard/activity-log",
  "رؤساء فرع التنظيم": "/dashboard/manage-branch-heads",
  "الفاكسات - الصادر": "/dashboard/archive/outgoing",
  "الفاكسات - الوارد": "/dashboard/archive/incoming",
  "كشوف التوصيات": "/dashboard/training-recommendations",
  "إدارة ملف القيد الموحّد": "/dashboard/manage-unified-registry",
  "إدارة الأدوار": "/dashboard/manage-roles",
  "الإدارات الخارجية": "/dashboard/manage-external-administrations",
  "كشوفات": "/dashboard/sheets",
  "المستويات التعليمية": "/dashboard/manage-education-levels",
};

// =====================================================
// Logo
// =====================================================

function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient
          id="sidebarLogoGrad1"
          x1="16"
          y1="0"
          x2="16"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>

        <linearGradient
          id="sidebarLogoGrad2"
          x1="8"
          y1="0"
          x2="8"
          y2="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
      </defs>

      <circle cx="16" cy="16" r="14" fill="url(#sidebarLogoGrad1)" />
      <circle cx="10" cy="10" r="6" fill="url(#sidebarLogoGrad2)" opacity="0.5" />
      <circle cx="22" cy="10" r="4" fill="white" opacity="0.3" />
    </svg>
  );
}

// =====================================================
// Nav Item
// =====================================================

function NavItem({ icon, label, active = false, onClick }: NavItemProps) {
  const styledIcon = active
    ? cloneElement(icon, { stroke: "url(#navActiveGrad)" } as object)
    : icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full h-[44px] rounded-[99px]",
        "flex items-center px-4 gap-3",
        "transition-colors text-right",
        active
          ? "bg-[#DCF4DF]"
          : "text-[#717d96] hover:bg-[#f5f6fb] hover:text-[#2d3648]",
      ].join(" ")}
      style={{
        fontFamily: "'Almarai', sans-serif",
        fontSize: "16px",
        color: active ? "#344736" : undefined,
      }}
    >
      <span className="flex-1 text-right">{label}</span>
      <span className="shrink-0">{styledIcon}</span>
    </button>
  );
}

// =====================================================
// Section Label
// =====================================================

function SectionLabel({ label }: { label: string }) {
  return (
    <p
      className="text-right px-4 h-[24px] flex items-center w-full"
      style={{
        color: "#64748b",
        fontFamily: "'Almarai', sans-serif",
        fontSize: "14px",
      }}
    >
      {label}
    </p>
  );
}

// =====================================================
// Divider
// =====================================================

function Divider() {
  return <div className="w-full h-px bg-[#e2e8f0] my-1" />;
}

// =====================================================
// Props
// =====================================================

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavSelect?: (label: string) => void;
  activePath?: string;
}

// =====================================================
// Sidebar
// =====================================================
export function Sidebar({ collapsed, onToggle, onNavSelect, activePath }: SidebarProps) {
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);

  // ===================================================
  // صلاحيات المستخدم الحالي (بدل الاعتماد على اسم الدور)
  // ===================================================
  const { loading: permsLoading, hasPermission } = usePermissions();

  // ===================================================
  // Active Label
  // ===================================================

  function getActiveLabel(pathname?: string): string {
    if (!pathname) {
      return "الموقف العام";
    }

    const exactMatch = Object.entries(LABEL_TO_PATH).find(
      ([, path]) => path === pathname
    );

    if (exactMatch) {
      return exactMatch[0];
    }

    const partialMatches = Object.entries(LABEL_TO_PATH)
      .filter(([, path]) => path !== "/dashboard" && pathname.startsWith(path))
      .sort((a, b) => b[1].length - a[1].length);

    if (partialMatches.length > 0) {
      return partialMatches[0][0];
    }

    return "الموقف العام";
  }

  const activeLabel = getActiveLabel(activePath);

  function handleClick(label: string) {
    onNavSelect?.(label);

    const path = LABEL_TO_PATH[label];

    if (path) {
      navigate(path);
    }
  }

  // ===================================================
  // Logout
  // ===================================================

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        const currentUserName =
          profile?.username ?? sessionStorage.getItem("username") ?? "مستخدم غير معروف";

        await logActivity({
          userId: user.id,
          userName: currentUserName,
          actionType: "LOGOUT",
          action: "تسجيل خروج",
          entity: "النظام",
          details: `تم تسجيل خروج المستخدم بواسطة ${currentUserName} من المنظومة`,
        });
      }

      const { error } = await supabase.auth.signOut({ scope: "local" });

      if (error) {
        console.error("Logout error:", error);
        setLoggingOut(false);
        return;
      }

      window.location.replace("/");
    } catch (error) {
      console.error("Unexpected logout error:", error);
      setLoggingOut(false);
    }
  }

  // ===================================================
  // All Navigation Items + الصلاحية المطلوبة لكل عنصر
  // ===================================================

  const allNavItems: NavDef[] = useMemo(
    () => [
      // -------------------------------
      // الأفراد
      // -------------------------------
      {
        icon: <LayoutDashboard size={18} />,
        label: "الموقف العام",
        section: "الافراد",
        permission: "general_status:view",
      },
      {
        icon: <Search size={18} />,
        label: "الاستعلام عن فرد",
        section: "الافراد",
        permission: "individual_query:view",
      },
      {
        icon: <UserPlus size={18} />,
        label: "اضافة قوة جديدة",
        section: "الافراد",
        permission: "add_soldier:view",
      },
      {
        icon: <FolderOpen size={18} />,
        label: "بيان الوحدات",
        section: "الافراد",
        permission: "units_report:view",
      },

      // -------------------------------
      // الخطابات
      // -------------------------------
      {
        icon: <Mail size={18} />,
        label: "إصدار خطاب",
        section: "الخطابات",
        permission: "issue_letter:view",
      },
      {
        icon: <BookOpen size={18} />,
        label: "سجل الخطابات",
        section: "الخطابات",
        permission: "letters_archive:view",
      },
      {
        icon: <FileSpreadsheet size={18} />,
        label: "كشوف التوصيات",
        section: "الخطابات",
        permission: "training_recommendations:view",
      },
            {
        icon: <ClipboardList size={18} />,
        label: "كشوفات",
        section: "الخطابات",
        permission: "sheets:view",
      },

      // -------------------------------
      // اليوميات
      // -------------------------------
      {
        icon: <FileText size={18} />,
        label: "اليوميات",
        section: "اليوميات",
        permission: "daily_reports:view",
      },
      {
        icon: <Users size={18} />,
        label: "دفعات الرديف",
        section: "اليوميات",
        permission: "reserve_batches:view",
      },

      // -------------------------------
      // الأرشيف
      // -------------------------------
      {
        icon: <FileUp size={18} />,
        label: "الفاكسات - الصادر",
        section: "الأرشيف",
        permission: "archive_outgoing:view",
      },
      {
        icon: <FileDown size={18} />,
        label: "الفاكسات - الوارد",
        section: "الأرشيف",
        permission: "archive_incoming:view",
      },

      // -------------------------------
      // إدارة المنظومة
      // -------------------------------
      {
        icon: <Building2 size={18} />,
        label: "ادارة الوحدات",
        section: "ادارة المنظومة",
        permission: "manage_units:view",
      },
      {
        icon: <Users size={18} />,
        label: "إدارة دفعات الرديف",
        section: "ادارة المنظومة",
        permission: "manage_reserve_batches:view",
      },
      {
        icon: <UserCog size={18} />,
        label: "ادارة المستخدمين",
        section: "ادارة المنظومة",
        permission: "manage_users:view",
      },
      {
        icon: <ShieldCheck size={18} />,
        label: "إدارة الأدوار",
        section: "ادارة المنظومة",
        permission: "manage_roles:view",
      },
      {
        icon: <DatabaseBackup size={18} />,
        label: "النسخ الاحتياطي للبيانات",
        section: "ادارة المنظومة",
        permission: "data_backup:view",
      },
      {
        icon: <Activity size={18} />,
        label: "سجل العمليات",
        section: "ادارة المنظومة",
        permission: "activity_log:view",
      },
      {
        icon: <UserCog size={18} />,
        label: "رؤساء فرع التنظيم",
        section: "ادارة المنظومة",
        permission: "manage_branch_heads:view",
      },
      {
        icon: <FileSpreadsheet size={18} />,
        label: "إدارة ملف القيد الموحّد",
        section: "ادارة المنظومة",
        permission: "manage_unified_registry:view",
      },
      {
        icon: <Landmark size={18} />,
        label: "الإدارات الخارجية",
        section: "ادارة المنظومة",
        permission: "external_administrations:view",
      },
            {
        icon: <GraduationCap size={18} />,
        label: "المستويات التعليمية",
        section: "ادارة المنظومة",
        permission: "education_levels:view",
      },
    ],
    []
  );

  // ===================================================
  // Filter Items According To Permissions
  // ===================================================

  const visibleNavItems = useMemo(() => {
    return allNavItems.filter(
      (item) => item.permission === null || hasPermission(item.permission)
    );
  }, [allNavItems, hasPermission]);

  // ===================================================
  // Group By Section
  // ===================================================

  const sections = ["الافراد", "الخطابات", "الأرشيف", "اليوميات", "ادارة المنظومة"];

  function getSectionItems(section: string) {
    return visibleNavItems.filter((item) => item.section === section);
  }

  // ===================================================
  // Render
  // ===================================================

  return (
    <aside
      className={[
        "bg-white h-screen flex flex-col gap-6",
        "border-l border-[#e2e8f0]",
        "sticky top-0",
        "transition-all duration-300",
        "overflow-y-auto overflow-x-hidden",
        "shrink-0",
        collapsed ? "w-[68px]" : "w-[280px]",
      ].join(" ")}
      dir="rtl"
    >
      {/* Active Icon Gradient */}
      <svg width="0" height="0" style={{ position: "absolute", overflow: "hidden" }}>
        <defs>
          <linearGradient id="navActiveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00B867" />
            <stop offset="100%" stopColor="#00522E" />
          </linearGradient>
        </defs>
      </svg>

      {/* Logo + Toggle */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-0 shrink-0 relative z-10">
        <button
          type="button"
          onClick={onToggle}
          className={[
            "bg-white",
            "border border-[#e2e8f0]",
            "rounded-full",
            "p-1",
            "flex items-center justify-center",
            "hover:bg-gray-50",
            "transition-colors",
            "shrink-0",
          ].join(" ")}
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <ChevronLeft size={16} className="text-[#081021]" />
          ) : (
            <ChevronRight size={16} className="text-[#081021]" />
          )}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <Link
              to="/dashboard"
              className="whitespace-nowrap hover:opacity-80 transition-opacity"
              style={{
                color: "#081021",
                fontFamily: "'Almarai', sans-serif",
                fontWeight: 700,
                fontSize: "22px",
                textDecoration: "none",
              }}
            >
              منظومة الافراد
            </Link>
            <LogoIcon />
          </div>
        )}

        {collapsed && <LogoIcon />}
      </div>

      {/* Expanded Sidebar */}
      {!collapsed && (
        <nav className="flex flex-col gap-1 px-6 flex-1 pb-4">
          {permsLoading ? (
            <div
              className="text-center text-[#64748b] py-4"
              style={{ fontFamily: "'Almarai', sans-serif", fontSize: "14px" }}
            >
              جاري تحميل الصلاحيات...
            </div>
          ) : (
            sections.map((section, sectionIndex) => {
              const items = getSectionItems(section);

              if (items.length === 0) {
                return null;
              }

              return (
                <div key={section} className="contents">
                  {sectionIndex > 0 && <Divider />}
                  <SectionLabel label={section} />

                  {items.map(({ icon, label }) => (
                    <NavItem
                      key={label}
                      icon={icon as React.ReactElement}
                      label={label}
                      active={activeLabel === label}
                      onClick={() => handleClick(label)}
                    />
                  ))}
                </div>
              );
            })
          )}
        </nav>
      )}

      {/* Collapsed Sidebar */}
      {collapsed && (
        <nav className="flex flex-col items-center gap-2 px-2 flex-1 pb-4">
          {!permsLoading &&
            visibleNavItems.map(({ icon, label }) => {
              const isActive = activeLabel === label;

              const styledIcon = isActive
                ? cloneElement(icon as React.ReactElement, {
                    stroke: "url(#navActiveGrad)",
                  } as object)
                : icon;

              return (
                <button
                  type="button"
                  key={label}
                  title={label}
                  onClick={() => handleClick(label)}
                  className={[
                    "w-10 h-10",
                    "rounded-full",
                    "flex items-center justify-center",
                    "transition-colors",
                    isActive ? "bg-[#DCF4DF]" : "text-[#717d96] hover:bg-[#f5f6fb]",
                  ].join(" ")}
                >
                  {styledIcon}
                </button>
              );
            })}
        </nav>
      )}

      {/* Logout */}
      <div className="border-t border-[#e2e8f0] px-6 py-4 shrink-0">
        {!collapsed ? (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={[
              "w-full h-[44px]",
              "rounded-[99px]",
              "flex items-center px-4 gap-3",
              "transition-colors",
              "text-right",
              "text-[#717d96]",
              "hover:bg-[#f5f6fb]",
              "hover:text-[#2d3648]",
              "disabled:opacity-50",
              "disabled:cursor-not-allowed",
            ].join(" ")}
            style={{ fontFamily: "'Almarai', sans-serif", fontSize: "16px" }}
          >
            <span className="flex-1 text-right">
              {loggingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
            </span>

            <span className="shrink-0">
              <LogOut size={18} className={loggingOut ? "animate-pulse" : ""} />
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title={loggingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
            aria-label="تسجيل الخروج"
            className={[
              "w-10 h-10",
              "rounded-full",
              "flex items-center justify-center",
              "transition-colors",
              "text-[#717d96]",
              "hover:bg-[#f5f6fb]",
              "disabled:opacity-50",
              "disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <LogOut size={18} className={loggingOut ? "animate-pulse" : ""} />
          </button>
        )}
      </div>
    </aside>
  );
}