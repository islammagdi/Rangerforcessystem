export interface BreadcrumbStep {
  label: string;
  path: string | null; // null = الخطوة الحالية (مش قابلة للنقر)
}

// كل مسار بيرجع سلسلة الخطوات من الجذر لحد الصفحة الحالية
const BREADCRUMB_RULES: {
  test: (pathname: string) => boolean;
  build: (pathname: string) => BreadcrumbStep[];
}[] = [
  // ── الموقف العام ──────────────────────────────────
  {
    test: (p) => p === "/dashboard",
    build: () => [{ label: "الموقف العام", path: null }],
  },

  // ── الاستعلام عن فرد ───────────────────────────────
  {
    test: (p) => p === "/dashboard/individual-query",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "الاستعلام عن فرد", path: null },
    ],
  },
  {
    test: (p) =>
      /^\/dashboard\/individual-query\/soldier\/[^/]+\/edit$/.test(p),
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      {
        label: "الاستعلام عن فرد",
        path: "/dashboard/individual-query",
      },
      { label: "بيانات الفرد", path: null },
    ],
  },
  {
    test: (p) =>
      /^\/dashboard\/individual-query\/soldier\/[^/]+$/.test(p),
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      {
        label: "الاستعلام عن فرد",
        path: "/dashboard/individual-query",
      },
      { label: "بيانات الفرد", path: null },
    ],
  },

  // ── اضافة قوة جديدة ────────────────────────────────
  {
    test: (p) => p === "/dashboard/add-soldier",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "اضافة قوة جديدة", path: null },
    ],
  },
  {
    test: (p) =>
      [
        "/dashboard/add-soldier/review",
        "/dashboard/add-soldier/group-review",
        "/dashboard/add-soldier/success",
        "/dashboard/add-soldier/group-success",
      ].includes(p),
    build: (p) => [
      { label: "الموقف العام", path: "/dashboard" },
      {
        label: "اضافة قوة جديدة",
        path: "/dashboard/add-soldier",
      },
      {
        label: p.includes("group") ? "مراجعة الكشف" : "المراجعة",
        path: null,
      },
    ],
  },

  // ── بيان الوحدات ───────────────────────────────────
  {
    test: (p) => p === "/dashboard/units-report",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "بيان الوحدات", path: null },
    ],
  },
  {
    test: (p) => /^\/dashboard\/units-report\/[^/]+\/soldiers$/.test(p),
    build: (p) => {
      const unitId = p.split("/")[3];
      return [
        { label: "الموقف العام", path: "/dashboard" },
        { label: "بيان الوحدات", path: "/dashboard/units-report" },
        {
          label: "بيانات الوحدة",
          path: `/dashboard/units-report/${unitId}`,
        },
        { label: "افراد الوحدة", path: null },
      ];
    },
  },
  {
    test: (p) => /^\/dashboard\/units-report\/[^/]+$/.test(p),
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "بيان الوحدات", path: "/dashboard/units-report" },
      { label: "بيانات الوحدة", path: null },
    ],
  },

  // ── إصدار خطاب ─────────────────────────────────────
  {
    test: (p) => p === "/dashboard/issue-letter",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "إصدار خطاب", path: null },
    ],
  },
  {
    test: (p) =>
      [
        "/dashboard/issue-letter/soldiers",
        "/dashboard/issue-letter/letter-data",
        "/dashboard/issue-letter/review",
      ].includes(p),
    build: (p) => {
      const stepLabel =
        p.endsWith("/soldiers")
          ? "تحديد الأفراد"
          : p.endsWith("/letter-data")
            ? "بيانات الخطاب"
            : "المراجعة والتصديق";

      return [
        { label: "الموقف العام", path: "/dashboard" },
        { label: "إصدار خطاب", path: "/dashboard/issue-letter" },
        { label: stepLabel, path: null },
      ];
    },
  },

  // ── سجل الخطابات ───────────────────────────────────
  {
    test: (p) => p === "/dashboard/letters-archive",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "سجل الخطابات", path: null },
    ],
  },
  {
    test: (p) => /^\/dashboard\/letters-archive\/[^/]+$/.test(p),
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "سجل الخطابات", path: "/dashboard/letters-archive" },
      { label: "بيانات الخطاب", path: null },
    ],
  },

  // ── اليوميات ────────────────────────────────────────
  {
    test: (p) => p === "/dashboard/daily-reports",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "اليوميات", path: null },
    ],
  },

  // ── دفعات الرديف ───────────────────────────────────
  {
    test: (p) => p === "/dashboard/reserve-batches",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "دفعات الرديف", path: null },
    ],
  },

  // ── ادارة الوحدات ──────────────────────────────────
  {
    test: (p) => p === "/dashboard/manage-units",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "ادارة الوحدات", path: null },
    ],
  },
  {
    test: (p) => /^\/dashboard\/manage-units\/[^/]+\/tree$/.test(p),
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "ادارة الوحدات", path: "/dashboard/manage-units" },
      { label: "شجرة الوحدة", path: null },
    ],
  },

  // ── ادارة المستخدمين ───────────────────────────────
  {
    test: (p) => p === "/dashboard/manage-users",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "ادارة المستخدمين", path: null },
    ],
  },

  // ── سجل العمليات ───────────────────────────────────
  {
    test: (p) => p === "/dashboard/activity-log",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "سجل العمليات", path: null },
    ],
  },

  // ── النسخ الاحتياطي ────────────────────────────────
  {
    test: (p) => p === "/dashboard/data-backup",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "النسخ الاحتياطي للبيانات", path: null },
    ],
  },

  // ── كشوف التوصيات ──────────────────────────────────
  {
    test: (p) => p === "/dashboard/training-recommendations",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "كشوف التوصيات", path: null },
    ],
  },
  {
    test: (p) => p === "/dashboard/training-recommendations/new",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      {
        label: "كشوف التوصيات",
        path: "/dashboard/training-recommendations",
      },
      { label: "إضافة توصية", path: null },
    ],
  },
  {
    test: (p) =>
      /^\/dashboard\/training-recommendations\/[^/]+$/.test(p) &&
      !p.endsWith("/new"),
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      {
        label: "كشوف التوصيات",
        path: "/dashboard/training-recommendations",
      },
      { label: "تعديل توصية", path: null },
    ],
  },

  // ── الفاكسات - الصادر ──────────────────────────────
  {
    test: (p) => p === "/dashboard/archive/outgoing",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "الفاكسات - الصادر", path: null },
    ],
  },
  {
    test: (p) => p === "/dashboard/archive/outgoing/new",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "الفاكسات - الصادر", path: "/dashboard/archive/outgoing" },
      { label: "إضافة فاكس صادر", path: null },
    ],
  },
  {
    test: (p) =>
      /^\/dashboard\/archive\/outgoing\/[^/]+$/.test(p) &&
      !p.endsWith("/new"),
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "الفاكسات - الصادر", path: "/dashboard/archive/outgoing" },
      { label: "بيانات الفاكس", path: null },
    ],
  },

  // ── الفاكسات - الوارد ──────────────────────────────
  {
    test: (p) => p === "/dashboard/archive/incoming",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "الفاكسات - الوارد", path: null },
    ],
  },
  {
    test: (p) => p === "/dashboard/archive/incoming/new",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "الفاكسات - الوارد", path: "/dashboard/archive/incoming" },
      { label: "إضافة فاكس وارد", path: null },
    ],
  },
  {
    test: (p) =>
      /^\/dashboard\/archive\/incoming\/[^/]+$/.test(p) &&
      !p.endsWith("/new"),
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "الفاكسات - الوارد", path: "/dashboard/archive/incoming" },
      { label: "بيانات الفاكس", path: null },
    ],
  },

  // ── رؤساء فرع التنظيم والإدارة ──────────────────────
  {
    test: (p) => p === "/dashboard/manage-branch-heads",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "رؤساء فرع التنظيم والإدارة", path: null },
    ],
  },

  // ── إدارة دفعات الرديف ──────────────────────────────
  {
    test: (p) => p === "/dashboard/manage-reserve-batches",
    build: () => [
      { label: "الموقف العام", path: "/dashboard" },
      { label: "إدارة دفعات الرديف", path: null },
    ],
  },
];

export function getBreadcrumbs(pathname: string): BreadcrumbStep[] {
  const rule = BREADCRUMB_RULES.find((r) => r.test(pathname));

  if (rule) {
    return rule.build(pathname);
  }

  // fallback: مجرد "الموقف العام" لو المسار غير معروف
  return [{ label: "الموقف العام", path: "/dashboard" }];
}