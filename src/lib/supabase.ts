import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)
/**
 * تجلب كل صفوف الجدول بدون التوقف عند حد الـ 1000 صف الافتراضي في PostgREST.
 * بتستدعي buildQuery بشكل متكرر مع range مختلف لحد ما ترجع صفحة أصغر من pageSize.
 */
export async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  pageSize = 1000
): Promise<T[]> {
  let all: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await buildQuery(from, to);

    if (error) throw error;

    const rows = data ?? [];
    all = all.concat(rows);

    if (rows.length < pageSize) break; // وصلنا لآخر صفحة
    from += pageSize;
  }

  return all;
}