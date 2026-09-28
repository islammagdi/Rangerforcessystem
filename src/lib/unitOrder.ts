export const UNIT_HIERARCHY_ORDER: string[] = [
  "سريه القياده",
  "كتيبة القيادة",
  "سرية الإيجلا",
  "كتيبة التأمين الفني",
  "ميس 4",
  "سرية 279 نقل",
  "فصيلة 121 شرطة عسكرية",
  "سرية 680 إشارة",
  "مدرسة الصاعقة",
  "فرقة الموسيقى",
  "السرية الزراعية",
  "كتيبة 49 مدفعية",
  "قيادة المجموعة 127 صاعقة",
  "كتيبة 33 صاعقة",
  "كتيبة 43 صاعقة",
  "كتيبة 53 صاعقة",
  "كتيبة 103 صاعقة",
  "قيادة المجموعة 129 صاعقة",
  "كتيبة 13 صاعقة",
  "كتيبة 23 صاعقة",
  "كتيبة 83 صاعقة",
  "كتيبة 113 صاعقة",
  "قيادة المجموعة 145 صاعقة",
  "كتيبة 63 صاعقة",
  "كتيبة 93 صاعقة",
  "كتيبة 73 صاعقة",
  "كتيبة 143 صاعقة",
  "قيادة المجموعة 101 صاعقة",
  "كتيبة 11 صاعقة",
  "كتيبة 21 صاعقة",
  "كتيبة 31 صاعقة",
  "كتيبة 41 صاعقة",
  "قياده مجموعه العمليات الخاصه",
  "الوحدة 777 قتال",
  "الوحدة 999 قتال",
  "كتيبة 50 صاعقة",
  "سرية العائمات",
  "فصيلة شئون مظلات",
];

function normalizeUnitName(name: string): string {
  return name
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F\u0640]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sortByUnitHierarchy<T extends { unit_name: string }>(items: T[]): T[] {
  const orderMap = new Map(
    UNIT_HIERARCHY_ORDER.map((name, index) => [normalizeUnitName(name), index])
  );

  const getIndex = (unitName: string) => {
    const key = normalizeUnitName(unitName);
    return orderMap.has(key) ? orderMap.get(key)! : Infinity;
  };

  return [...items].sort((a, b) => {
    const indexA = getIndex(a.unit_name);
    const indexB = getIndex(b.unit_name);

    if (indexA !== indexB) return indexA - indexB;

    return a.unit_name.localeCompare(b.unit_name, "ar");
  });
}