import { supabase } from "./supabase";
function normalizeRankName(name: string | null): string {
  return (name ?? "").trim().replace(/ى/g, "ي");
}
export type BulletinStatus = "draft" | "published";

export interface PromotionBulletin {
  id: string;
  bulletin_month: number;
  bulletin_year: number;
  decision_number: string;
  status: BulletinStatus;
  published_at: string | null;
  item_count: number;
}

export interface BulletinPersonnelOption {
  id: string;
  military_number: string | null;
  full_name: string;
  rank_id: string | null;
  rank_name: string | null;
  unit_id: string | null;
  unit_name: string | null;
}

export interface PromotionBulletinItem {
  id: string;
  bulletin_id: string;
  personnel_id: string;
  military_number: string | null;
  full_name: string;
  old_rank_id: string | null;
  old_rank_name: string | null;
  old_unit_id: string | null;
  old_unit_name: string | null;
  new_rank_id: string;
  new_rank_name: string | null;
  new_unit_id: string | null;
  new_unit_name: string | null;
}

export function bulletinLabel(month: number, year: number): string {
  return `نشرة ${month === 7 ? "يوليو" : "يناير"} ${year}`;
}

/* =========================================================
   قائمة النشرات
========================================================= */

export async function fetchBulletins(): Promise<PromotionBulletin[]> {
  const { data: bulletins, error } = await supabase
    .from("promotion_bulletins")
    .select("id, bulletin_month, bulletin_year, decision_number, status, published_at")
    .order("bulletin_year", { ascending: false })
    .order("bulletin_month", { ascending: false });

  if (error) throw error;

  const { data: items, error: itemsError } = await supabase
    .from("promotion_bulletin_items")
    .select("bulletin_id");

  if (itemsError) throw itemsError;

  const counts = new Map<string, number>();
  (items ?? []).forEach((i: any) => counts.set(i.bulletin_id, (counts.get(i.bulletin_id) ?? 0) + 1));

  return (bulletins ?? []).map((b: any) => ({
    ...b,
    item_count: counts.get(b.id) ?? 0,
  }));
}

export async function createBulletin(input: {
  bulletin_month: number;
  bulletin_year: number;
  decision_number: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("promotion_bulletins")
    .insert(input)
    .select("id")
    .single();

  if (error) throw error;

  return data.id;
}

export async function deleteBulletin(id: string): Promise<void> {
  const { error } = await supabase.from("promotion_bulletins").delete().eq("id", id);

  if (error) throw error;
}

/* =========================================================
   تفاصيل نشرة واحدة
========================================================= */

export async function fetchBulletinById(id: string): Promise<PromotionBulletin> {
  const { data, error } = await supabase
    .from("promotion_bulletins")
    .select("id, bulletin_month, bulletin_year, decision_number, status, published_at")
    .eq("id", id)
    .single();

  if (error) throw error;

  return { ...data, item_count: 0 };
}
export async function fetchBulletinByPeriod(
  month: number,
  year: number
): Promise<PromotionBulletin | null> {
  const { data, error } = await supabase
    .from("promotion_bulletins")
    .select("id, bulletin_month, bulletin_year, decision_number, status, published_at")
    .eq("bulletin_month", month)
    .eq("bulletin_year", year)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return { ...data, item_count: 0 };
}
export async function fetchBulletinItems(bulletinId: string): Promise<PromotionBulletinItem[]> {
  const { data, error } = await supabase
    .from("promotion_bulletin_items")
    .select(
      `
      id,
      bulletin_id,
      personnel_id,
      old_rank_id,
      old_unit_id,
      new_rank_id,
      new_unit_id,
      personnel:personnel!personnel_id ( military_number, full_name ),
      old_rank:ranks!old_rank_id ( name ),
      old_unit:units!old_unit_id ( name ),
      new_rank:ranks!new_rank_id ( name ),
      new_unit:units!new_unit_id ( name )
    `
    )
    .eq("bulletin_id", bulletinId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const personnel = Array.isArray(row.personnel) ? row.personnel[0] : row.personnel;
    const oldRank = Array.isArray(row.old_rank) ? row.old_rank[0] : row.old_rank;
    const oldUnit = Array.isArray(row.old_unit) ? row.old_unit[0] : row.old_unit;
    const newRank = Array.isArray(row.new_rank) ? row.new_rank[0] : row.new_rank;
    const newUnit = Array.isArray(row.new_unit) ? row.new_unit[0] : row.new_unit;

    return {
      id: row.id,
      bulletin_id: row.bulletin_id,
      personnel_id: row.personnel_id,
      military_number: personnel?.military_number ?? null,
      full_name: personnel?.full_name ?? "-",
      old_rank_id: row.old_rank_id,
      old_rank_name: oldRank?.name ?? null,
      old_unit_id: row.old_unit_id,
      old_unit_name: oldUnit?.name ?? null,
      new_rank_id: row.new_rank_id,
      new_rank_name: newRank?.name ?? null,
      new_unit_id: row.new_unit_id,
      new_unit_name: newUnit?.name ?? null,
    };
  });
}

/* =========================================================
   البحث عن أفراد مؤهلين (ضباط صف، مش مضافين في النشرة دي بالفعل)
   ملاحظة: بيستثني رتبة "جندي" لأنها خاصة بالمجندين مش ضباط الصف
========================================================= */

export interface EligibleSearchResult {
  results: BulletinPersonnelOption[];
  conscripts: BulletinPersonnelOption[];
  alreadyAdded: number;
}

export async function searchEligiblePersonnel(
  query: string,
  bulletinId: string
): Promise<EligibleSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) return { results: [], conscripts: [], alreadyAdded: 0 };

  const { data: existingItems, error: existingError } = await supabase
    .from("promotion_bulletin_items")
    .select("personnel_id")
    .eq("bulletin_id", bulletinId);

  if (existingError) throw existingError;

  const excludedIds = new Set((existingItems ?? []).map((i: any) => i.personnel_id));

  const { data, error } = await supabase
    .from("personnel")
    .select(
      "id, military_number, full_name, rank:ranks!rank_id ( id, name ), primary_unit:units!primary_unit_id ( id, name )"
    )
    .eq("is_active", true)
    .or(`full_name.ilike.%${trimmed}%,military_number.ilike.%${trimmed}%`)
    .limit(20);

  if (error) throw error;

  const allRows = data ?? [];

  const candidates: BulletinPersonnelOption[] = allRows
    .filter((p: any) => !excludedIds.has(p.id))
    .map((p: any) => {
      const rank = Array.isArray(p.rank) ? p.rank[0] : p.rank;
      const unit = Array.isArray(p.primary_unit) ? p.primary_unit[0] : p.primary_unit;

      return {
        id: p.id,
        military_number: p.military_number,
        full_name: p.full_name,
        rank_id: rank?.id ?? null,
        rank_name: rank?.name ?? null,
        unit_id: unit?.id ?? null,
        unit_name: unit?.name ?? null,
      };
    });

  const conscripts = candidates.filter((p) => normalizeRankName(p.rank_name) === "جندي");
  const results = candidates.filter((p) => normalizeRankName(p.rank_name) !== "جندي");
  const alreadyAdded = allRows.length - candidates.length;

  return { results, conscripts, alreadyAdded };
}

/* =========================================================
   إدارة الأفراد داخل النشرة (مسودة فقط)
========================================================= */

export async function addBulletinItem(input: {
  bulletin_id: string;
  personnel_id: string;
  old_rank_id: string | null;
  old_unit_id: string | null;
  new_rank_id: string;
  new_unit_id: string | null;
}): Promise<void> {
  const { error } = await supabase.from("promotion_bulletin_items").insert(input);

  if (error) throw error;
}

export async function updateBulletinItem(
  id: string,
  input: { new_rank_id?: string; new_unit_id?: string | null }
): Promise<void> {
  const { error } = await supabase.from("promotion_bulletin_items").update(input).eq("id", id);

  if (error) throw error;
}

export async function deleteBulletinItem(id: string): Promise<void> {
  const { error } = await supabase.from("promotion_bulletin_items").delete().eq("id", id);

  if (error) throw error;
}

/* =========================================================
   نشر النشرة (يستدعي الدالة في الداتا بيز)
========================================================= */

export async function publishBulletin(bulletinId: string): Promise<void> {
  const { error } = await supabase.rpc("publish_promotion_bulletin", {
    p_bulletin_id: bulletinId,
  });

  if (error) throw error;
}