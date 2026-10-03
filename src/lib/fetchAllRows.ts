// =====================================================
// Supabase بيرجّع أقصى ١٠٠٠ صف في الطلب الواحد من غير أي خطأ.
// الدوال دي بتجيب "كل" الصفوف على صفحات.
// =====================================================

type PageResult<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

/**
 * يجيب كل الصفوف على صفحات.
 * مهم: الاستعلام لازم يكون ليه ترتيب ثابت (order) وينتهي بـ .range(from, to)
 */
export async function fetchAllRows<T = any>(
  buildPage: (from: number, to: number) => PageResult<T>,
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildPage(from, from + pageSize - 1);
    if (error) throw error;

    const rows = data ?? [];
    all.push(...rows);

    if (rows.length < pageSize) break;
  }

  return all;
}

/**
 * لاستعلامات .in() على قائمة IDs كبيرة:
 * بيقسّم الـ IDs على دفعات (علشان طول الرابط)، وكل دفعة بتتجاب كاملة على صفحات.
 */
export async function fetchByIdsInChunks<T = any>(
  ids: string[],
  buildPage: (chunk: string[], from: number, to: number) => PageResult<T>,
  chunkSize = 150
): Promise<T[]> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const all: T[] = [];

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const rows = await fetchAllRows<T>((from, to) => buildPage(chunk, from, to));
    all.push(...rows);
  }

  return all;
}