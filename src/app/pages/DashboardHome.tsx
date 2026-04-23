import { StatCard } from "../components/dashboard/StatCard";
import { ProgressCard } from "../components/dashboard/ProgressCard";
import { DonutChart } from "../components/dashboard/DonutChart";
import { UnitBarChart } from "../components/dashboard/UnitBarChart";
import {
  RankIcon,
  SoldiersIcon,
  PeopleIcon,
  CalendarIcon,
  IdCardIcon,
  PersonCheckIcon,
} from "../components/dashboard/DashboardIcons";

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p
      className="text-right w-full"
      style={{
        color: "#2d3648",
        fontFamily: "'Almarai', sans-serif",
        fontWeight: 700,
        fontSize: "24px",
        lineHeight: 1.5,
      }}
    >
      {children}
    </p>
  );
}

export function DashboardHome() {
  return (
    <>
      {/* ── 1. الموقف العام للقوة ─────────────────────────────────── */}
      <SectionTitle>الموقف العام للقوة الحالية </SectionTitle>

      <div className="flex gap-4 flex-wrap">
        <StatCard
          icon={<RankIcon />}
          value="500"
          label="عدد ضباط الصف"
        />
        <StatCard
          icon={<SoldiersIcon />}
          value="4,000"
          label="عدد الجنود"
        />
        <StatCard
          icon={<PeopleIcon />}
          value="4,500"
          label="القوة الفعلية"
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        <StatCard
          icon={<RankIcon />}
          value="40"
          label="خوارج ضباط الصف"
          valueColor="#2D3648"
        />
        <StatCard
          icon={<SoldiersIcon />}
          value="200"
          label="خوارج الجنود"
          valueColor="#2D3648"
        />
        <StatCard
          icon={<PeopleIcon />}
          value="240"
          label="اجمالي الخوارج"
          valueColor="#2D3648"
        />
      </div>

      {/* ── 2. تحليل موقف الخوارج ─────────────────────────────────── */}
      <SectionTitle>تحليل موقف الخوارج</SectionTitle>

      <div className="flex gap-4 items-start flex-wrap lg:flex-nowrap">
        <div className="w-full lg:w-[280px] shrink-0">
          <DonutChart />
        </div>
        <div className="flex-1 min-w-0 w-full">
          <UnitBarChart />
        </div>
      </div>

      {/* ── 3. موقف دفعات الرديف ─────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p
          style={{
            color: "#2d3648",
            fontFamily: "'Almarai', sans-serif",
            fontSize: "14px",
          }}
        >
          اخر تحديث: 30-3-2026
        </p>
        <SectionTitle>موقف دفعة الرديف</SectionTitle>
      </div>

      <div className="flex gap-4 flex-wrap">
        <StatCard
          icon={<PeopleIcon />}
          value="1,850"
          label="عدد المستحقين للتسريح"
        />
        <StatCard
          icon={<CalendarIcon />}
          value="1 مارس 2026"
          label="تاريخ الدفعة التالية"
        />
      </div>

      <div className="flex gap-4 flex-wrap pb-6">
        <ProgressCard
          icon={<IdCardIcon />}
          value="38"
          subValue="من 120"
          label="عدد مسلِّمي رخصة القيادة"
          percentage={50}
          percentLabel="50%"
        />
        <ProgressCard
          icon={<PersonCheckIcon />}
          value="978"
          subValue="من 1,850"
          label="عدد مسلِّمي تحقيق الشخصية"
          percentage={53}
          percentLabel="50%"
        />
      </div>
    </>
  );
}