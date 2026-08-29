import { cloneElement, useEffect, useMemo, useState } from "react";
import { logActivity } from "../../../lib/logActivity";
import {
  LayoutDashboard,
  Search,
  UserPlus,
  FolderOpen,
  Mail,
  BookOpen,
  CalendarDays,
  Users,
  Building2,
  UserCog,
  DatabaseBackup,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../../lib/supabase";


// =====================================================
// Types
// =====================================================

type RoleCode =
  | "ADMIN"
  | "PERSONNEL_OFFICER"
  | "ARCHIVE_OFFICER"
  | "USER"
  | null;

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
  roles: RoleCode[];
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
"الأرشيف - صادر": "/dashboard/archive/outgoing",
"الأرشيف - وارد": "/dashboard/archive/incoming",
};
// =====================================================
// Logo
// =====================================================

function LogoIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
    >
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

      <circle
        cx="16"
        cy="16"
        r="14"
        fill="url(#sidebarLogoGrad1)"
      />

      <circle
        cx="10"
        cy="10"
        r="6"
        fill="url(#sidebarLogoGrad2)"
        opacity="0.5"
      />

      <circle
        cx="22"
        cy="10"
        r="4"
        fill="white"
        opacity="0.3"
      />
    </svg>
  );
}


// =====================================================
// Nav Item
// =====================================================

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: NavItemProps) {
  const styledIcon = active
    ? cloneElement(icon, {
        stroke: "url(#navActiveGrad)",
      } as object)
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
      <span className="flex-1 text-right">
        {label}
      </span>

      <span className="shrink-0">
        {styledIcon}
      </span>
    </button>
  );
}


// =====================================================
// Section Label
// =====================================================

function SectionLabel({
  label,
}: {
  label: string;
}) {
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
  return (
    <div className="w-full h-px bg-[#e2e8f0] my-1" />
  );
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
export function Sidebar({
  collapsed,
  onToggle,
  onNavSelect,
  activePath,
}: SidebarProps) {
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [roleCode, setRoleCode] =
    useState<RoleCode>(null);

  const [roleLoading, setRoleLoading] =
    useState(true);


  // ===================================================
  // Get Current User Role
  // ===================================================

  useEffect(() => {
    let mounted = true;

    async function loadUserRole() {
      try {
        setRoleLoading(true);

        // 1. Get logged-in user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "GET USER ERROR:",
            userError
          );

          return;
        }

        if (!user) {
          console.log("No logged-in user");
          return;
        }

        console.log(
          "CURRENT USER ID:",
          user.id
        );


        // 2. Get role
        const { data, error } =
          await supabase
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
          console.error(
            "GET USER ROLE ERROR:",
            error
          );

          return;
        }


        console.log(
          "SIDEBAR USER ROLE:",
          data
        );


        // 3. Extract role code
        const role = Array.isArray(data?.roles)
          ? data?.roles[0]
          : data?.roles;


        const code =
          role?.code as RoleCode;


        console.log(
          "SIDEBAR ROLE CODE:",
          code
        );


        if (mounted) {
          setRoleCode(code ?? null);
        }
      } catch (error) {
        console.error(
          "LOAD ROLE EXCEPTION:",
          error
        );
      } finally {
        if (mounted) {
          setRoleLoading(false);
        }
      }
    }

    loadUserRole();

    return () => {
      mounted = false;
    };
  }, []);


  // ===================================================
  // Active Label
  // ===================================================

  function getActiveLabel(
    pathname?: string
  ): string {
    if (!pathname) {
      return "الموقف العام";
    }

    if (pathname === "/dashboard") {
      return "الموقف العام";
    }

    if (
      pathname.includes(
        "/individual-query"
      )
    ) {
      return "الاستعلام عن فرد";
    }

    if (
      pathname.includes("/add-soldier")
    ) {
      return "اضافة قوة جديدة";
    }

    if (
      pathname.includes("/units-report")
    ) {
      return "بيان الوحدات";
    }

    if (
      pathname.includes("/issue-letter")
    ) {
      return "إصدار خطاب";
    }

    if (
      pathname.includes(
        "/letters-archive"
      )
    ) {
      return "سجل الخطابات";
    }

    if (
      pathname.includes("/daily-reports")
    ) {
      return "اليوميات";
    }

    if (
      pathname.includes("/reserve-batches")
    ) {
      return "دفعات الرديف";
    }

    if (
      pathname.includes("/manage-units")
    ) {
      return "ادارة الوحدات";
    }

    if (
      pathname.includes("/manage-users")
    ) {
      return "ادارة المستخدمين";
    }

    if (
      pathname.includes("/backup")
    ) {
      return "النسخ الاحتياطي للبيانات";
    }

    if (
      pathname.includes("/activity-log")
    ) {
      return "سجل العمليات";
    }
    if (pathname.includes("/backup")) {
  return "النسخ الاحتياطي للبيانات";
}
if (pathname.includes("/manage-branch-heads")) {
  return "رؤساء فرع التنظيم";
}
if (pathname.includes("/reserve-batches-overview")) {
  return "إدارة دفعات الرديف";
}
if (pathname.includes("/archive/outgoing")) {
  return "الأرشيف - صادر";
}

if (pathname.includes("/archive/incoming")) {
  return "الأرشيف - وارد";
}

    return "الموقف العام";
  }


  const activeLabel =
    getActiveLabel(activePath);


  function handleClick(
    label: string
  ) {
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
        profile?.username ??
        sessionStorage.getItem("username") ??
        "مستخدم غير معروف";

      await logActivity({
        userId: user.id,
        userName: currentUserName,
        actionType: "LOGOUT",
        action: "تسجيل خروج",
        entity: "النظام",
        details: `تم تسجيل خروج المستخدم بواسطة ${currentUserName} من المنظومة`,
      });
    }

    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

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
  // All Navigation Items + Roles
  // ===================================================

  const allNavItems: NavDef[] =
    useMemo(
      () => [
        // -------------------------------
        // الأفراد
        // -------------------------------

        {
          icon: (
            <LayoutDashboard
              size={18}
            />
          ),
          label: "الموقف العام",
          section: "الافراد",
          roles: [
            "ADMIN",
            "PERSONNEL_OFFICER",
            "ARCHIVE_OFFICER",
            "USER",
          ],
        },

        {
          icon: (
            <Search size={18} />
          ),
          label: "الاستعلام عن فرد",
          section: "الافراد",
          roles: [
            "ADMIN",
            "PERSONNEL_OFFICER",
            "ARCHIVE_OFFICER",
            "USER",
          ],
        },

        {
          icon: (
            <UserPlus size={18} />
          ),
          label: "اضافة قوة جديدة",
          section: "الافراد",
          roles: [
            "ADMIN",
            "PERSONNEL_OFFICER",
          ],
        },

        {
          icon: (
            <FolderOpen
              size={18}
            />
          ),
          label: "بيان الوحدات",
          section: "الافراد",
          roles: [
            "ADMIN",
            "PERSONNEL_OFFICER",
            "ARCHIVE_OFFICER",
            "USER",
          ],
        },


        // -------------------------------
        // الخطابات
        // -------------------------------

        {
          icon: (
            <Mail size={18} />
          ),
          label: "إصدار خطاب",
          section: "الخطابات",
          roles: [
            "ADMIN",
            "PERSONNEL_OFFICER",
          ],
        },

        {
          icon: (
            <BookOpen
              size={18}
            />
          ),
          label: "سجل الخطابات",
          section: "الخطابات",
          roles: [
            "ADMIN",
            "ARCHIVE_OFFICER",
          ],
        },


        // -------------------------------
        // اليوميات
        // -------------------------------

        {
          icon: (
            <CalendarDays
              size={18}
            />
          ),
          label: "اليوميات",
          section: "اليوميات",
          roles: [
            "ADMIN",
            "PERSONNEL_OFFICER",
            "ARCHIVE_OFFICER",
            "USER",
          ],
        },

        {
          icon: (
            <Users size={18} />
          ),
          label: "دفعات الرديف",
          section: "اليوميات",
          roles: [
            "ADMIN",
            "ARCHIVE_OFFICER",
          ],
        },


        // -------------------------------
        // إدارة المنظومة
        // -------------------------------

        {
          icon: (
            <Building2
              size={18}
            />
          ),
          label: "ادارة الوحدات",
          section: "ادارة المنظومة",
          roles: [
            "ADMIN",
          ],
        },
        {
  icon: <Users size={18} />,
  label: "إدارة دفعات الرديف",
  section: "ادارة المنظومة",
  roles: ["ADMIN"],
},

        {
          icon: (
            <UserCog
              size={18}
            />
          ),
          label: "ادارة المستخدمين",
          section: "ادارة المنظومة",
          roles: [
            "ADMIN",
          ],
        },

        {
          icon: (
            <DatabaseBackup
              size={18}
            />
          ),
          label:
            "النسخ الاحتياطي للبيانات",
          section: "ادارة المنظومة",
          roles: [
            "ADMIN",
          ],
        },

        {
          icon: (
            <Activity
              size={18}
            />
          ),
          label: "سجل العمليات",
          section: "ادارة المنظومة",
          roles: [
            "ADMIN",
          ],
        },
        {
  icon: <UserCog size={18} />,
  label: "رؤساء فرع التنظيم",
  section: "ادارة المنظومة",
  roles: ["ADMIN"],
},
{
  icon: <FolderOpen size={18} />,
  label: "الأرشيف - صادر",
  section: "الأرشيف",
roles: ["ADMIN", "ARCHIVE_OFFICER",'USER'],
},

{
  icon: <FolderOpen size={18} />,
  label: "الأرشيف - وارد",
  section: "الأرشيف",
  roles: ["ADMIN", "ARCHIVE_OFFICER",'USER'],
},

      ],
      []
    );


  // ===================================================
  // Filter Items According To Role
  // ===================================================

  const visibleNavItems =
    useMemo(() => {
      if (!roleCode) {
        return [];
      }

      return allNavItems.filter(
        (item) =>
          item.roles.includes(
            roleCode
          )
      );
    }, [
      allNavItems,
      roleCode,
    ]);


  // ===================================================
  // Group By Section
  // ===================================================

 const sections = [
  "الافراد",
  "الخطابات",
  "الأرشيف",
  "اليوميات",
  "ادارة المنظومة",
];


  function getSectionItems(
    section: string
  ) {
    return visibleNavItems.filter(
      (item) =>
        item.section === section
    );
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
        collapsed
          ? "w-[68px]"
          : "w-[280px]",
      ].join(" ")}
      dir="rtl"
    >

      {/* ==============================================
          Active Icon Gradient
      =============================================== */}

      <svg
        width="0"
        height="0"
        style={{
          position: "absolute",
          overflow: "hidden",
        }}
      >
        <defs>
          <linearGradient
            id="navActiveGrad"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#00B867"
            />

            <stop
              offset="100%"
              stopColor="#00522E"
            />
          </linearGradient>
        </defs>
      </svg>


      {/* ==============================================
          Logo + Toggle
      =============================================== */}

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
            <ChevronLeft
              size={16}
              className="text-[#081021]"
            />
          ) : (
            <ChevronRight
              size={16}
              className="text-[#081021]"
            />
          )}
        </button>


        {!collapsed && (
  <div className="flex items-center gap-2 overflow-hidden flex-1">

    <Link
      to="/dashboard"
      className="whitespace-nowrap hover:opacity-80 transition-opacity"
      style={{
        color: "#081021",
        fontFamily:
          "'Almarai', sans-serif",
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


        {collapsed && (
          <LogoIcon />
        )}

      </div>


      {/* ==============================================
          Expanded Sidebar
      =============================================== */}

      {!collapsed && (
        <nav className="flex flex-col gap-1 px-6 flex-1 pb-4">

          {roleLoading ? (
            <div
              className="text-center text-[#64748b] py-4"
              style={{
                fontFamily:
                  "'Almarai', sans-serif",
                fontSize: "14px",
              }}
            >
              جاري تحميل الصلاحيات...
            </div>
          ) : (
            sections.map(
              (section, sectionIndex) => {

                const items =
                  getSectionItems(
                    section
                  );

                // Don't show empty section
                if (items.length === 0) {
                  return null;
                }

                return (
                  <div
                    key={section}
                    className="contents"
                  >

                    {sectionIndex > 0 && (
                      <Divider />
                    )}

                    <SectionLabel
                      label={section}
                    />


                    {items.map(
                      ({
                        icon,
                        label,
                      }) => (
                        <NavItem
                          key={label}
                          icon={
                            icon as React.ReactElement
                          }
                          label={label}
                          active={
                            activeLabel ===
                            label
                          }
                          onClick={() =>
                            handleClick(
                              label
                            )
                          }
                        />
                      )
                    )}

                  </div>
                );
              }
            )
          )}

        </nav>
      )}


      {/* ==============================================
          Collapsed Sidebar
      =============================================== */}

      {collapsed && (
        <nav className="flex flex-col items-center gap-2 px-2 flex-1 pb-4">

          {!roleLoading &&
            visibleNavItems.map(
              ({
                icon,
                label,
              }) => {

                const isActive =
                  activeLabel ===
                  label;

                const styledIcon =
                  isActive
                    ? cloneElement(
                        icon as React.ReactElement,
                        {
                          stroke:
                            "url(#navActiveGrad)",
                        } as object
                      )
                    : icon;

                return (
                  <button
                    type="button"
                    key={label}
                    title={label}
                    onClick={() =>
                      handleClick(
                        label
                      )
                    }
                    className={[
                      "w-10 h-10",
                      "rounded-full",
                      "flex items-center justify-center",
                      "transition-colors",
                      isActive
                        ? "bg-[#DCF4DF]"
                        : "text-[#717d96] hover:bg-[#f5f6fb]",
                    ].join(" ")}
                  >
                    {styledIcon}
                  </button>
                );
              }
            )}

        </nav>
      )}


      {/* ==============================================
          Logout
      =============================================== */}

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
            style={{
              fontFamily:
                "'Almarai', sans-serif",
              fontSize: "16px",
            }}
          >

            <span className="flex-1 text-right">
              {loggingOut
                ? "جاري تسجيل الخروج..."
                : "تسجيل الخروج"}
            </span>

            <span className="shrink-0">
              <LogOut
                size={18}
                className={
                  loggingOut
                    ? "animate-pulse"
                    : ""
                }
              />
            </span>

          </button>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title={
              loggingOut
                ? "جاري تسجيل الخروج..."
                : "تسجيل الخروج"
            }
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
            <LogOut
              size={18}
              className={
                loggingOut
                  ? "animate-pulse"
                  : ""
              }
            />
          </button>
        )}

      </div>

    </aside>
  );
}