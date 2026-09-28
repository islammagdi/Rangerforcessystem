export const RANK_HIERARCHY_ORDER: string[] = [
  "مساعد اول",
  "مساعد",
  "رقيب اول",
  "رقيب",
  "عريف",
  "جندى",
];

export function sortByRankHierarchy<T extends { rank_name: string | null }>(items: T[]): T[] {
  const orderMap = new Map(RANK_HIERARCHY_ORDER.map((name, index) => [name, index]));

  return [...items].sort((a, b) => {
    const indexA = a.rank_name && orderMap.has(a.rank_name) ? orderMap.get(a.rank_name)! : -1;
    const indexB = b.rank_name && orderMap.has(b.rank_name) ? orderMap.get(b.rank_name)! : -1;

    if (indexA !== indexB) return indexA - indexB;

    return (a.rank_name ?? "").localeCompare(b.rank_name ?? "", "ar");
  });
}