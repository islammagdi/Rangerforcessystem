import { supabase } from "./supabase";

/* =========================================================
   الرتب المؤهلة للترقية التلقائية (ضباط الصف فقط)
   sort_order في جدول ranks: 1=جندى، 2=عريف، 3=رقيب،
   4=رقيب اول، 5=مساعد، 6=مساعد اول
========================================================= */

export interface RankOrderInfo {
  id: string;
  name: string;
  code: string;
  sort_order: number;
}

export async function fetchRanksOrdered(): Promise<RankOrderInfo[]> {
  const { data, error } = await supabase
    .from("ranks")
    .select("id, name, code, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

/** الرتبة التالية مباشرة في التسلسل، أو null لو مفيش (زي بعد مساعد اول) */
export function getNextRank(ranks: RankOrderInfo[], currentSortOrder: number): RankOrderInfo | null {
  return ranks.find((r) => r.sort_order === currentSortOrder + 1) ?? null;
}

/* =========================================================
   استخلاص سنة الالتحاق بالمعهد من الرقم العسكري
========================================================= */

export function extractEnrollmentYear(militaryNumber: string | null): number | null {
  if (!militaryNumber) return null;

  const trimmed = militaryNumber.trim();
  if (trimmed.length < 4) return null;

  const year = Number(trimmed.slice(0, 4));

  if (!Number.isInteger(year)) return null;
  if (year < 1970 || year > 2100) return null;

  return year;
}

/* =========================================================
   التاريخ النظري للحصول على رتبة معينة
========================================================= */

function theoreticalRankDate(graduationYear: number, sortOrder: number): Date | null {
  switch (sortOrder) {
    case 2: return new Date(graduationYear, 8, 30);
    case 3: return new Date(graduationYear + 6, 0, 1);
    case 4: return new Date(graduationYear + 11, 6, 1);
    case 5: return new Date(graduationYear + 17, 0, 1);
    case 6: return new Date(graduationYear + 22, 6, 1);
    default: return null;
  }
}

/* =========================================================
   حساب استحقاق الترقية القادمة لفرد
========================================================= */

export type EligibilityKind = "promotion" | "exit_to_officers";

export interface PromotionEligibilityResult {
  kind: EligibilityKind;
  eligibleDate: Date;
  bulletinMonth: 1 | 7;
  bulletinYear: number;
  bulletinLabelText: string;
}

export function calculatePromotionEligibility(params: {
  militaryNumber: string | null;
  currentRankSortOrder: number | null;
  lastPromotionDate: string | null;
}): PromotionEligibilityResult | null {
  const { militaryNumber, currentRankSortOrder, lastPromotionDate } = params;

  if (
    currentRankSortOrder === null ||
    currentRankSortOrder < 2 ||
    currentRankSortOrder > 6
  ) {
    return null;
  }

  let startDate: Date | null;

  if (lastPromotionDate) {
    startDate = new Date(lastPromotionDate);
  } else {
    const enrollmentYear = extractEnrollmentYear(militaryNumber);
    if (enrollmentYear === null) return null;

    const graduationYear = enrollmentYear + 2;
    startDate = theoreticalRankDate(graduationYear, currentRankSortOrder);
  }

  if (!startDate || isNaN(startDate.getTime())) return null;

  const eligibleDate = new Date(startDate);
  eligibleDate.setFullYear(eligibleDate.getFullYear() + 5);

  const month = eligibleDate.getMonth() + 1;
  const kind: EligibilityKind = currentRankSortOrder === 6 ? "exit_to_officers" : "promotion";

  let bulletinMonth: 1 | 7;
  let bulletinYear: number;

  if (month >= 7) {
    bulletinMonth = 1;
    bulletinYear = eligibleDate.getFullYear() + 1;
  } else {
    bulletinMonth = 7;
    bulletinYear = eligibleDate.getFullYear();
  }

  const bulletinLabelText =
    kind === "exit_to_officers"
      ? `مستحق الخروج لمنظومة شئون الضباط (${bulletinMonth === 7 ? "يوليو" : "يناير"} ${bulletinYear})`
      : `نشرة ${bulletinMonth === 7 ? "يوليو" : "يناير"} ${bulletinYear}`;

  return { kind, eligibleDate, bulletinMonth, bulletinYear, bulletinLabelText };
}

/* =========================================================
   جلب آخر تاريخ ترقية فعلي لكل فرد
========================================================= */

export async function fetchLastPromotionDates(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("social_record_promotions")
    .select("social_record_id, promotion_date")
    .order("promotion_date", { ascending: true });

  if (error) throw error;

  const map = new Map<string, string>();
  (data ?? []).forEach((row: any) => {
    map.set(row.social_record_id, row.promotion_date);
  });

  return map;
}

/* =========================================================
   تقرير الأفراد المستحقين
========================================================= */

export interface EligiblePersonnelRow {
  personnel_id: string;
  social_record_id: string | null;
  military_number: string | null;
  full_name: string;
  current_rank_id: string;
  current_rank_name: string;
  current_rank_sort_order: number;
  unit_id: string | null;
  unit_name: string | null;
  eligibility: PromotionEligibilityResult;
}

export async function fetchEligiblePersonnelReport(): Promise<EligiblePersonnelRow[]> {
  const [ranks, lastPromotions] = await Promise.all([
    fetchRanksOrdered(),
    fetchLastPromotionDates(),
  ]);

  const rankById = new Map(ranks.map((r) => [r.id, r]));

  const { data: socialRecords, error: socialError } = await supabase
    .from("social_records")
    .select("id, personnel_id");

  if (socialError) throw socialError;

  const socialRecordByPersonnelId = new Map(
    (socialRecords ?? []).map((s: any) => [s.personnel_id, s.id])
  );

  const { data: personnel, error: personnelError } = await supabase
    .from("personnel")
    .select("id, military_number, full_name, rank_id, primary_unit_id, primary_unit:units!primary_unit_id ( name )")
    .eq("is_active", true);

  if (personnelError) throw personnelError;

  const rows: EligiblePersonnelRow[] = [];

  (personnel ?? []).forEach((p: any) => {
    const rank = rankById.get(p.rank_id);
    if (!rank || rank.sort_order < 2 || rank.sort_order > 6) return;

    const socialRecordId = socialRecordByPersonnelId.get(p.id) ?? null;
    const lastPromotionDate = socialRecordId ? lastPromotions.get(socialRecordId) ?? null : null;

    const eligibility = calculatePromotionEligibility({
      militaryNumber: p.military_number,
      currentRankSortOrder: rank.sort_order,
      lastPromotionDate,
    });

    if (!eligibility) return;

    const unit = Array.isArray(p.primary_unit) ? p.primary_unit[0] : p.primary_unit;

    rows.push({
      personnel_id: p.id,
      social_record_id: socialRecordId,
      military_number: p.military_number,
      full_name: p.full_name,
      current_rank_id: rank.id,
      current_rank_name: rank.name,
      current_rank_sort_order: rank.sort_order,
      unit_id: p.primary_unit_id ?? null,
      unit_name: unit?.name ?? null,
      eligibility,
    });
  });

  return rows;
}