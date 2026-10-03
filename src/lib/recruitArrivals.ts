import { supabase } from "./supabase";

// =====================================================
// Types & Constants
// =====================================================

export type RecruitCategory = "commando" | "special_infantry";
export type RecruitLevel = "high" | "above_average" | "average" | "regular";
export type RecruitPhaseStatus = "ongoing" | "arrived";

export const PHASE_STATUS_LABELS: Record<RecruitPhaseStatus, string> = {
  ongoing: "جارية",
  arrived: "تم الوصول",
};
export const RECRUIT_CATEGORIES: { key: RecruitCategory; label: string }[] = [
  { key: "commando", label: "صاعقة" },
  { key: "special_infantry", label: "مشاه شروط خاصة" },
];

export const RECRUIT_LEVELS: { key: RecruitLevel; label: string }[] = [
  { key: "high", label: "عليا" },
  { key: "above_average", label: "فوق متوسطة" },
  { key: "average", label: "متوسطة" },
  { key: "regular", label: "عادة" },
];

export interface RecruitPhase {
  id: string;
  name: string;
  has_commando: boolean;
  has_special_infantry: boolean;
  notes: string | null;
  status: RecruitPhaseStatus;
  created_at: string;
}

export interface RecruitTarget {
  id: string;
  phase_id: string;
  category: RecruitCategory;
  level: RecruitLevel;
  total: number;
}

export interface RecruitArrival {
  id: string;
  phase_id: string;
  arrival_date: string; // YYYY-MM-DD
  category: RecruitCategory;
  level: RecruitLevel;
  count: number;
}
export interface PhaseSummary extends RecruitPhase {
  targetTotal: number;
  arrivedTotal: number;
}

export interface DashboardLevelStats {
  level: RecruitLevel;
  label: string;
  target: number;
  arrived: number;
  today: number;
}

export interface DashboardCategoryStats {
  category: RecruitCategory;
  label: string;
  target: number;
  arrived: number;
  today: number;
  levels: DashboardLevelStats[];
}

export interface DashboardPhaseStats {
  phase: RecruitPhase;
  categories: DashboardCategoryStats[];
  targetTotal: number;
  arrivedTotal: number;
  todayTotal: number;
}

// =====================================================
// Helpers
// =====================================================

export function cellKey(category: RecruitCategory, level: RecruitLevel): string {
  return `${category}:${level}`;
}

export function phaseCategories(phase: RecruitPhase): RecruitCategory[] {
  const list: RecruitCategory[] = [];
  if (phase.has_commando) list.push("commando");
  if (phase.has_special_infantry) list.push("special_infantry");
  return list;
}

// Supabase بيرجّع 1000 صف كحد أقصى في الطلب الواحد، فبنجيب على صفحات
async function fetchAll<T>(
  table: string,
  columns: string,
  phaseId?: string
): Promise<T[]> {
  const pageSize = 1000;
  const out: T[] = [];

  for (let from = 0; ; from += pageSize) {
    let query = supabase.from(table).select(columns).order("id");
    if (phaseId) query = query.eq("phase_id", phaseId);

    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw error;

    const rows = (data ?? []) as unknown as T[];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }

  return out;
}

// =====================================================
// Queries
// =====================================================

export async function fetchPhaseSummaries(): Promise<PhaseSummary[]> {
  const { data: phases, error } = await supabase
    .from("recruit_phases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const [targets, arrivals] = await Promise.all([
    fetchAll<{ phase_id: string; total: number }>("recruit_phase_targets", "id, phase_id, total"),
    fetchAll<{ phase_id: string; count: number }>("recruit_arrivals", "id, phase_id, count"),
  ]);

  const targetSum = new Map<string, number>();
  targets.forEach((t) =>
    targetSum.set(t.phase_id, (targetSum.get(t.phase_id) ?? 0) + t.total)
  );

  const arrivedSum = new Map<string, number>();
  arrivals.forEach((a) =>
    arrivedSum.set(a.phase_id, (arrivedSum.get(a.phase_id) ?? 0) + a.count)
  );

  return ((phases ?? []) as RecruitPhase[]).map((p) => ({
    ...p,
    targetTotal: targetSum.get(p.id) ?? 0,
    arrivedTotal: arrivedSum.get(p.id) ?? 0,
  }));
}

export async function fetchPhaseDetail(phaseId: string): Promise<{
  phase: RecruitPhase;
  targets: RecruitTarget[];
  arrivals: RecruitArrival[];
}> {
  const { data: phase, error } = await supabase
    .from("recruit_phases")
    .select("*")
    .eq("id", phaseId)
    .single();

  if (error) throw error;

  const [targets, arrivals] = await Promise.all([
    fetchAll<RecruitTarget>("recruit_phase_targets", "*", phaseId),
    fetchAll<RecruitArrival>("recruit_arrivals", "*", phaseId),
  ]);

  return { phase: phase as RecruitPhase, targets, arrivals };
}

// =====================================================
// Mutations
// =====================================================

export async function createPhase(input: {
  name: string;
  notes?: string;
  categories: RecruitCategory[];
  targets: Record<string, number>; // مفتاحها cellKey(category, level)
}): Promise<RecruitPhase> {
  const ongoing = await findOngoingPhase();
  if (ongoing) {
    throw new Error(
      `توجد دفعة جارية بالفعل ("${ongoing.name}"). أنهِها (تم الوصول) أولًا قبل إنشاء دفعة جديدة.`
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: phase, error } = await supabase
    .from("recruit_phases")
    .insert({
      name: input.name.trim(),
      notes: input.notes?.trim() || null,
      has_commando: input.categories.includes("commando"),
      has_special_infantry: input.categories.includes("special_infantry"),
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("توجد دفعة جارية بالفعل. أنهِها (تم الوصول) أولًا قبل إنشاء دفعة جديدة.");
    }
    throw error;
  }

  const rows = input.categories.flatMap((category) =>
    RECRUIT_LEVELS.map((level) => ({
      phase_id: phase.id,
      category,
      level: level.key,
      total: Math.max(0, Math.floor(input.targets[cellKey(category, level.key)] || 0)),
    }))
  );

  const { error: targetsError } = await supabase
    .from("recruit_phase_targets")
    .insert(rows);

  if (targetsError) {
    // نمسح المرحلة لو الأهداف فشلت عشان مفيش مرحلة نص نص
    await supabase.from("recruit_phases").delete().eq("id", phase.id);
    throw targetsError;
  }

  return phase as RecruitPhase;
}

// الدفعة الجارية (مع إمكانية استبعاد دفعة بعينها)
async function findOngoingPhase(excludeId?: string): Promise<RecruitPhase | null> {
  let query = supabase.from("recruit_phases").select("*").eq("status", "ongoing");
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;

  return (data as RecruitPhase | null) ?? null;
}

// إحصائيات الداشبورد: الدفعة الجارية، ولو مفيش فآخر دفعة تم إنشاؤها
export async function fetchDashboardPhaseStats(
  todayISO: string
): Promise<DashboardPhaseStats | null> {
  let phase = await findOngoingPhase();

  if (!phase) {
    const { data, error } = await supabase
      .from("recruit_phases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    phase = (data as RecruitPhase | null) ?? null;
  }

  if (!phase) return null;

  const [targets, arrivals] = await Promise.all([
    fetchAll<RecruitTarget>("recruit_phase_targets", "*", phase.id),
    fetchAll<RecruitArrival>("recruit_arrivals", "*", phase.id),
  ]);

  const targetMap = new Map<string, number>();
  targets.forEach((t) => targetMap.set(cellKey(t.category, t.level), t.total));

  const arrivedMap = new Map<string, number>();
  const todayMap = new Map<string, number>();

  arrivals.forEach((a) => {
    const ck = cellKey(a.category, a.level);
    arrivedMap.set(ck, (arrivedMap.get(ck) ?? 0) + a.count);
    if (a.arrival_date === todayISO) {
      todayMap.set(ck, (todayMap.get(ck) ?? 0) + a.count);
    }
  });

  const categories: DashboardCategoryStats[] = phaseCategories(phase).map((category) => {
    const levels: DashboardLevelStats[] = RECRUIT_LEVELS.map((level) => {
      const ck = cellKey(category, level.key);
      return {
        level: level.key,
        label: level.label,
        target: targetMap.get(ck) ?? 0,
        arrived: arrivedMap.get(ck) ?? 0,
        today: todayMap.get(ck) ?? 0,
      };
    });

    return {
      category,
      label: RECRUIT_CATEGORIES.find((c) => c.key === category)?.label ?? category,
      target: levels.reduce((s, l) => s + l.target, 0),
      arrived: levels.reduce((s, l) => s + l.arrived, 0),
      today: levels.reduce((s, l) => s + l.today, 0),
      levels,
    };
  });

  return {
    phase,
    categories,
    targetTotal: categories.reduce((s, c) => s + c.target, 0),
    arrivedTotal: categories.reduce((s, c) => s + c.arrived, 0),
    todayTotal: categories.reduce((s, c) => s + c.today, 0),
  };
}

export async function updatePhaseInfo(
  phaseId: string,
  info: { name: string; notes?: string }
): Promise<void> {
  const { error } = await supabase
    .from("recruit_phases")
    .update({ name: info.name.trim(), notes: info.notes?.trim() || null })
    .eq("id", phaseId);

  if (error) throw error;
}

export async function updatePhaseStatus(
  phaseId: string,
  status: RecruitPhaseStatus
): Promise<void> {
  if (status === "ongoing") {
    const other = await findOngoingPhase(phaseId);
    if (other) {
      throw new Error(
        `توجد دفعة جارية بالفعل ("${other.name}"). أنهِها (تم الوصول) أولًا.`
      );
    }
  }

  const { error } = await supabase
    .from("recruit_phases")
    .update({ status })
    .eq("id", phaseId);

  if (error) {
    if (error.code === "23505") {
      throw new Error("توجد دفعة جارية بالفعل. أنهِها (تم الوصول) أولًا.");
    }
    throw error;
  }
}

export async function saveTargets(
  phaseId: string,
  rows: { category: RecruitCategory; level: RecruitLevel; total: number }[]
): Promise<void> {
  const payload = rows.map((r) => ({
    phase_id: phaseId,
    category: r.category,
    level: r.level,
    total: Math.max(0, Math.floor(r.total || 0)),
  }));

  const { error } = await supabase
    .from("recruit_phase_targets")
    .upsert(payload, { onConflict: "phase_id,category,level" });

  if (error) throw error;
}

// إضافة يوم جديد: بيعمل صفوف بصفر لكل فئة ومستوى، ومبيلمسش يوم موجود
export async function addDay(
  phaseId: string,
  date: string,
  categories: RecruitCategory[]
): Promise<void> {
  const rows = categories.flatMap((category) =>
    RECRUIT_LEVELS.map((level) => ({
      phase_id: phaseId,
      arrival_date: date,
      category,
      level: level.key,
      count: 0,
    }))
  );

  const { error } = await supabase
    .from("recruit_arrivals")
    .upsert(rows, {
      onConflict: "phase_id,arrival_date,category,level",
      ignoreDuplicates: true,
    });

  if (error) throw error;
}

export async function saveArrivals(
  phaseId: string,
  rows: {
    arrival_date: string;
    category: RecruitCategory;
    level: RecruitLevel;
    count: number;
  }[]
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date().toISOString();

  const payload = rows.map((r) => ({
    phase_id: phaseId,
    arrival_date: r.arrival_date,
    category: r.category,
    level: r.level,
    count: Math.max(0, Math.floor(r.count || 0)),
    updated_by: user?.id ?? null,
    updated_at: now,
  }));

  const { error } = await supabase
    .from("recruit_arrivals")
    .upsert(payload, { onConflict: "phase_id,arrival_date,category,level" });

  if (error) throw error;
}

export async function deleteDay(phaseId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from("recruit_arrivals")
    .delete()
    .eq("phase_id", phaseId)
    .eq("arrival_date", date);

  if (error) throw error;
}

export async function deletePhase(phaseId: string): Promise<void> {
  const { error } = await supabase.from("recruit_phases").delete().eq("id", phaseId);
  if (error) throw error;
}
