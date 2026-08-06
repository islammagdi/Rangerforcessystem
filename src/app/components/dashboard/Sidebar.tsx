import { cloneElement, useState } from "react";
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
import { supabase } from "../../../lib/supabase";

// ─── Logo Icon ────────────────────────────────────────────────────────────────
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

// ─── Nav Item ────────────────────────────────────────────────────────────────
interface NavItemProps {
  icon: React.ReactElement;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

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
        "w-full h-[44px] rounded-[99px] flex items-center px-4 gap-3 transition-colors text-right",
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

// ─── Section Header ──────────────────────────────────────────────────────────
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

function Divider() {
  return (
    <div className="w-full h-px bg-[#e2e8f0] my-1" />
  );
}

// ─── Nav Definitions ─────────────────────────────────────────────────────────
interface NavDef {
  icon: React.ReactNode;
  label: string;
  path?: string;
}

const PATH_TO_LABEL: Record<string, string> = {
  "/dashboard": "الموقف العام",
  "/dashboard/individual-query": "الاستعلام عن فرد",
  "/dashboard/add-soldier": "اضافة قوة جديدة",
  "/dashboard/units-report": "بيان الوحدات",
  "/dashboard/issue-letter": "إصدار خطاب",
};

// ─── Sidebar Props ───────────────────────────────────────────────────────────
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavSelect?: (label: string) => void;
  activePath?: string;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export function Sidebar({
  collapsed,
  onToggle,
  onNavSelect,
  activePath,
}: SidebarProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  // ─── Active Navigation ─────────────────────────────────────────────────────
  const activeLabel =
    (activePath &&
      (PATH_TO_LABEL[activePath] ??
        (activePath.includes("/individual-query")
          ? "الاستعلام عن فرد"
          : undefined) ??
        (activePath.includes("/units-report")
          ? "بيان الوحدات"
          : undefined) ??
        (activePath.includes("/add-soldier")
          ? "اضافة قوة جديدة"
          : undefined) ??
        (activePath.includes("/issue-letter")
          ? "إصدار خطاب"
          : undefined) ??
        (activePath.includes("/letters-archive")
          ? "سجل الخطابات"
          : undefined) ??
        (activePath.includes("/daily-reports")
          ? "اليوميات"
          : undefined) ??
        (activePath.includes("/reserve-batches")
          ? "دفعات الرديف"
          : undefined) ??
        (activePath.includes("/manage-units")
          ? "ادارة الوحدات"
          : undefined))) ??
    "الموقف العام";

  // ─── Navigation Click ──────────────────────────────────────────────────────
  function handleClick(label: string) {
    onNavSelect?.(label);
  }

  // ─── Secure Logout ─────────────────────────────────────────────────────────
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) {
        console.error("Logout error:", error);
        setLoggingOut(false);
        return;
      }

      // تسجيل الخروج تم بنجاح.
      // "/" هو المسار الخاص بـ LoginPage.tsx
      window.location.replace("/");
    } catch (error) {
      console.error("Unexpected logout error:", error);
      setLoggingOut(false);
    }
  }

  // ─── All Navigation Items ──────────────────────────────────────────────────
  const allNavItems: NavDef[] = [
    {
      icon: <LayoutDashboard size={18} />,
      label: "الموقف العام",
      path: "/dashboard",
    },
    {
      icon: <Search size={18} />,
      label: "الاستعلام عن فرد",
      path: "/dashboard/individual-query",
    },
    {
      icon: <UserPlus size={18} />,
      label: "اضافة قوة جديدة",
      path: "/dashboard/add-soldier",
    },
    {
      icon: <FolderOpen size={18} />,
      label: "بيان الوحدات",
    },
    {
      icon: <Mail size={18} />,
      label: "إصدار خطاب",
    },
    {
      icon: <BookOpen size={18} />,
      label: "سجل الخطابات",
    },
    {
      icon: <CalendarDays size={18} />,
      label: "اليوميات",
    },
    {
      icon: <Users size={18} />,
      label: "دفعات الرديف",
    },
    {
      icon: <Building2 size={18} />,
      label: "ادارة الوحدات",
    },
    {
      icon: <UserCog size={18} />,
      label: "ادارة المستخدمين",
    },
    {
      icon: <DatabaseBackup size={18} />,
      label: "النسخ الاحتياطي للبيانات",
    },
    {
      icon: <Activity size={18} />,
      label: "سجل العمليات",
    },
  ];

  return (
    <aside
      className={[
        "bg-white h-screen flex flex-col gap-6 border-l border-[#e2e8f0] sticky top-0 transition-all duration-300 overflow-y-auto overflow-x-hidden shrink-0",
        collapsed
          ? "w-[0px] opacity-0 pointer-events-none"
          : "w-[280px] opacity-100",
        "md:opacity-100 md:pointer-events-auto",
        collapsed
          ? "md:w-[68px]"
          : "md:w-[280px]",
      ].join(" ")}
      dir="rtl"
    >
      {/* ── Global Gradient ─────────────────────────────────────────────── */}
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

      {/* ── Top: Logo + Toggle ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-0 shrink-0 relative z-10">
        <button
          type="button"
          onClick={onToggle}
          className="bg-white border border-[#e2e8f0] rounded-full p-1 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
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
            <span
              className="whitespace-nowrap"
              style={{
                color: "#081021",
                fontFamily: "'Almarai', sans-serif",
                fontWeight: 700,
                fontSize: "22px",
              }}
            >
              منظومة الخوارج
            </span>

            <LogoIcon />
          </div>
        )}

        {collapsed && <LogoIcon />}
      </div>

      {/* ── Full Navigation ─────────────────────────────────────────────── */}
      {!collapsed && (
        <nav className="flex flex-col gap-1 px-6 flex-1 pb-4">
          {/* الافراد */}
          <SectionLabel label="الافراد" />

          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="الموقف العام"
            active={activeLabel === "الموقف العام"}
            onClick={() =>
              handleClick("الموقف العام")
            }
          />

          <NavItem
            icon={<Search size={18} />}
            label="الاستعلام عن فرد"
            active={activeLabel === "الاستعلام عن فرد"}
            onClick={() =>
              handleClick("الاستعلام عن فرد")
            }
          />

          <NavItem
            icon={<UserPlus size={18} />}
            label="اضافة قوة جديدة"
            active={activeLabel === "اضافة قوة جديدة"}
            onClick={() =>
              handleClick("اضافة قوة جديدة")
            }
          />

          <NavItem
            icon={<FolderOpen size={18} />}
            label="بيان الوحدات"
            active={activeLabel === "بيان الوحدات"}
            onClick={() =>
              handleClick("بيان الوحدات")
            }
          />

          <Divider />

          {/* الخطابات */}
          <SectionLabel label="الخطابات" />

          <NavItem
            icon={<Mail size={18} />}
            label="إصدار خطاب"
            active={activeLabel === "إصدار خطاب"}
            onClick={() =>
              handleClick("إصدار خطاب")
            }
          />

          <NavItem
            icon={<BookOpen size={18} />}
            label="سجل الخطابات"
            active={activeLabel === "سجل الخطابات"}
            onClick={() =>
              handleClick("سجل الخطابات")
            }
          />

          <Divider />

          {/* اليوميات */}
          <SectionLabel label="اليوميات" />

          <NavItem
            icon={<CalendarDays size={18} />}
            label="اليوميات"
            active={activeLabel === "اليوميات"}
            onClick={() =>
              handleClick("اليوميات")
            }
          />

          <NavItem
            icon={<Users size={18} />}
            label="دفعات الرديف"
            active={activeLabel === "دفعات الرديف"}
            onClick={() =>
              handleClick("دفعات الرديف")
            }
          />

          <Divider />

          {/* ادارة المنظومة */}
          <SectionLabel label="ادارة المنظومة" />

          <NavItem
            icon={<Building2 size={18} />}
            label="ادارة الوحدات"
            active={activeLabel === "ادارة الوحدات"}
            onClick={() =>
              handleClick("ادارة الوحدات")
            }
          />

          <NavItem
            icon={<UserCog size={18} />}
            label="ادارة المستخدمين"
            active={activeLabel === "ادارة المستخدمين"}
            onClick={() =>
              handleClick("ادارة المستخدمين")
            }
          />

          <NavItem
            icon={<DatabaseBackup size={18} />}
            label="النسخ الاحتياطي للبيانات"
            active={
              activeLabel ===
              "النسخ الاحتياطي للبيانات"
            }
            onClick={() =>
              handleClick(
                "النسخ الاحتياطي للبيانات"
              )
            }
          />

          <NavItem
            icon={<Activity size={18} />}
            label="سجل العمليات"
            active={activeLabel === "سجل العمليات"}
            onClick={() =>
              handleClick("سجل العمليات")
            }
          />
        </nav>
      )}

      {/* ── Collapsed Navigation ────────────────────────────────────────── */}
      {collapsed && (
        <nav className="flex flex-col items-center gap-2 px-2 flex-1 pb-4">
          {allNavItems.map(({ icon, label }) => {
            const isActive = activeLabel === label;

            const styledIcon = isActive
              ? cloneElement(
                  icon as React.ReactElement,
                  {
                    stroke: "url(#navActiveGrad)",
                  } as object
                )
              : icon;

            return (
              <button
                type="button"
                key={label}
                title={label}
                onClick={() =>
                  handleClick(label)
                }
                className={[
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  isActive
                    ? "bg-[#DCF4DF]"
                    : "text-[#717d96] hover:bg-[#f5f6fb]",
                ].join(" ")}
              >
                {styledIcon}
              </button>
            );
          })}
        </nav>
      )}

      {/* ── Bottom: Logout ──────────────────────────────────────────────── */}
      <div className="border-t border-[#e2e8f0] px-6 py-4 shrink-0">
        {!collapsed ? (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full h-[44px] rounded-[99px] flex items-center px-4 gap-3 transition-colors text-right text-[#717d96] hover:bg-[#f5f6fb] hover:text-[#2d3648] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontFamily: "'Almarai', sans-serif",
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
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors text-[#717d96] hover:bg-[#f5f6fb] disabled:opacity-50 disabled:cursor-not-allowed"
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