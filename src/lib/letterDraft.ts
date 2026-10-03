import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import {
  mapLetterTypeRow,
  checkEligibility,
  extractAdministrationCode,
  type LetterTypeConfig,
} from "./letterTypeEngine";

export const DRAFT_TTL_DAYS = 7;

export type DraftSoldier = {
  id: string;
  militaryId: string;
  name: string;
  rank: string;
  rankId: string;
  unit: string;
  unitId: string;
  attachmentUnit: string;
  attachmentUnitId: string | null;
  dischargeDate: string | null;
  isManual?: boolean;
};

export type LetterDraftState = {
  draftId: string | null;
  draftUpdatedAt: string | null;
  savedSignature: string | null;
  letterTypeId: string | null;
  letterTypeCode: string | null;
  letterTypeName: string | null;
  soldiers: DraftSoldier[];
  destination: string;
  destinationId: string;
  letterFieldValues: Record<string, string>;
  soldierFieldGeneralValues: Record<string, string>;
  soldierFieldOverrides: Record<string, Record<string, string>>;
  // سبب عدم أهلية كل فرد (بعد إعادة الفحص وقت استكمال مسودة)
  soldierProblems: Record<string, string>;
  currentStep: 2 | 3;
};

const EMPTY: LetterDraftState = {
  draftId: null,
  draftUpdatedAt: null,
  savedSignature: null,
  letterTypeId: null,
  letterTypeCode: null,
  letterTypeName: null,
  soldiers: [],
  destination: "",
  destinationId: "",
  letterFieldValues: {},
  soldierFieldGeneralValues: {},
  soldierFieldOverrides: {},
  soldierProblems: {},
  currentStep: 2,
};

/* =========================================================
   Store (module-level، من غير Provider)
========================================================= */

let state: LetterDraftState = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLetterDraft(): LetterDraftState {
  return state;
}

export function useLetterDraft(): LetterDraftState {
  return useSyncExternalStore(subscribe, getLetterDraft, getLetterDraft);
}

export function patchLetterDraft(patch: Partial<LetterDraftState>) {
  state = { ...state, ...patch };
  emit();
}

export function resetLetterDraft() {
  state = EMPTY;
  emit();
}

// بداية خطاب: لو النوع اتغيّر عن اللي في الـ store، كل حاجة بتتصفّر
export function startLetterDraft(type: {
  id: string;
  code: string;
  name: string;
}) {
  if (state.letterTypeId !== type.id) {
    state = {
      ...EMPTY,
      letterTypeId: type.id,
      letterTypeCode: type.code,
      letterTypeName: type.name,
    };
    emit();
  }
}

/* =========================================================
   Dirty tracking (بيقارن الحالة الحالية بآخر حالة اتحفظت)
========================================================= */

function pruneOverrides(s: LetterDraftState) {
  const ids = new Set(s.soldiers.map((x) => x.id));
  const result: Record<string, Record<string, string>> = {};

  for (const [fieldKey, perSoldier] of Object.entries(
    s.soldierFieldOverrides
  )) {
    const kept = Object.fromEntries(
      Object.entries(perSoldier).filter(([soldierId]) => ids.has(soldierId))
    );
    if (Object.keys(kept).length > 0) result[fieldKey] = kept;
  }

  return result;
}

function sortedJson(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
            a.localeCompare(b)
          )
        )
      : v
  );
}

export function draftSignature(s: LetterDraftState): string {
  return sortedJson({
    ids: s.soldiers.map((x) => x.id),
    destination: s.destination,
    destinationId: s.destinationId,
    letterFieldValues: s.letterFieldValues,
    general: s.soldierFieldGeneralValues,
    overrides: pruneOverrides(s),
  });
}

export function isLetterDraftDirty(s: LetterDraftState): boolean {
  return s.soldiers.length > 0 && draftSignature(s) !== s.savedSignature;
}

/* =========================================================
   Save
========================================================= */

export type SaveDraftResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveLetterDraft(): Promise<SaveDraftResult> {
  const s = state;

  if (!s.letterTypeId) {
    return { ok: false, error: "نوع الخطاب غير محدد." };
  }

  if (s.soldiers.length === 0) {
    return {
      ok: false,
      error: "أضف فردًا واحدًا على الأقل قبل الحفظ كمسودة.",
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return {
      ok: false,
      error: "جلسة تسجيل الدخول غير موجودة. سجّل الدخول مرة أخرى.",
    };
  }

  const userId = session.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  const userName = profile?.username ?? "غير معروف";

  const payload = {
    letterTypeCode: s.letterTypeCode,
    letterTypeName: s.letterTypeName,
    soldiers: s.soldiers,
    destination: s.destination,
    destinationId: s.destinationId,
    letterFieldValues: s.letterFieldValues,
    soldierFieldGeneralValues: s.soldierFieldGeneralValues,
    soldierFieldOverrides: pruneOverrides(s),
  };

  const base = {
    letter_type_id: s.letterTypeId,
    current_step: s.currentStep,
    personnel_count: s.soldiers.length,
    payload,
    updated_by: userId,
    updated_by_name: userName,
  };

  let draftId: string;
  let updatedAt: string;

  if (s.draftId) {
    let query = supabase
      .from("letter_drafts")
      .update(base)
      .eq("id", s.draftId);

    // حماية من الكتابة فوق تعديل مستخدم تاني
    if (s.draftUpdatedAt) query = query.eq("updated_at", s.draftUpdatedAt);

    const { data, error } = await query.select("id, updated_at");

    if (error) {
      return { ok: false, error: `تعذر حفظ المسودة: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return {
        ok: false,
        error:
          "تعذر الحفظ: المسودة اتعدلت أو اتحذفت من مستخدم آخر. افتحها من السجل مرة أخرى.",
      };
    }

    draftId = data[0].id;
    updatedAt = data[0].updated_at;
  } else {
    const { data, error } = await supabase
      .from("letter_drafts")
      .insert({ ...base, created_by: userId, created_by_name: userName })
      .select("id, updated_at")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: `تعذر حفظ المسودة: ${error?.message ?? "خطأ غير معروف"}`,
      };
    }

    draftId = data.id;
    updatedAt = data.updated_at;
  }

  const next: LetterDraftState = {
    ...state,
    draftId,
    draftUpdatedAt: updatedAt,
  };

  state = { ...next, savedSignature: draftSignature(next) };
  emit();

  return { ok: true, id: draftId };
}

/* =========================================================
   List / Delete
========================================================= */

export type DraftListItem = {
  id: string;
  letterTypeName: string;
  personnelCount: number;
  currentStep: number;
  createdByName: string;
  updatedByName: string;
  updatedAt: string;
  expiresAt: string;
};

export async function listLetterDrafts(): Promise<
  { ok: true; items: DraftListItem[] } | { ok: false; error: string }
> {
  // تنظيف المنتهي (RLS بيخفيه أصلًا من القراءة، لكن نحذفه فعليًا)
  await supabase
    .from("letter_drafts")
    .delete()
    .lt("expires_at", new Date().toISOString());

  const { data, error } = await supabase
    .from("letter_drafts")
    .select(
      `id, current_step, personnel_count, created_by_name, updated_by_name,
       updated_at, expires_at,
       letter_type:letter_types!letter_drafts_letter_type_id_fkey(name)`
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return { ok: false, error: `تعذر تحميل المسودات: ${error.message}` };
  }

  const items = (data ?? []).map((row: any) => {
    const type = Array.isArray(row.letter_type)
      ? row.letter_type[0]
      : row.letter_type;

    return {
      id: row.id,
      letterTypeName: type?.name ?? "—",
      personnelCount: row.personnel_count ?? 0,
      currentStep: row.current_step,
      createdByName: row.created_by_name ?? "—",
      updatedByName: row.updated_by_name ?? row.created_by_name ?? "—",
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
    } satisfies DraftListItem;
  });

  return { ok: true, items };
}
export async function countLetterDrafts(): Promise<number> {
  const { count, error } = await supabase
    .from("letter_drafts")
    .select("id", { count: "exact", head: true })
    .gt("expires_at", new Date().toISOString());

  if (error) {
    console.error("[DRAFT] count failed:", error);
    return 0;
  }

  return count ?? 0;
}
export async function deleteLetterDraft(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("letter_drafts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[DRAFT] delete failed:", error);
    return { ok: false, error: error.message };
  }

  if (state.draftId === id) {
    state = { ...state, draftId: null, draftUpdatedAt: null, savedSignature: null };
    emit();
  }

  return { ok: true };
}

/* =========================================================
   Open (تحميل + إعادة فحص الأهلية لكل فرد)
========================================================= */

const PERSONNEL_SELECT = `
  id, military_number, full_name, rank_id, discharge_date, is_active,
  rank:ranks!personnel_rank_id_fkey(id, name),
  category:personnel_categories!personnel_personnel_category_id_fkey(id, name, code),
  primary_unit:units!personnel_primary_unit_id_fkey(id, name),
  attachment_unit:units!personnel_attachment_unit_id_fkey(id, name),
  service_status:service_statuses!personnel_service_status_id_fkey(id, name, code)
`;

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

async function refreshDraftSoldiers(
  saved: DraftSoldier[],
  config: LetterTypeConfig
) {
  const problems: Record<string, string> = {};

  const soldiers = await Promise.all(
    saved.map(async (soldier): Promise<DraftSoldier> => {
      if (soldier.isManual) return soldier;

      const { data, error } = await supabase
        .from("personnel")
        .select(PERSONNEL_SELECT)
        .eq("id", soldier.id)
        .maybeSingle();

      if (error) {
        problems[soldier.id] = "تعذر التحقق من بيانات الفرد.";
        return soldier;
      }

      const row: any = data;

      if (!row || row.is_active === false) {
        problems[soldier.id] = "الفرد لم يعد موجودًا أو أصبح غير نشط.";
        return soldier;
      }

      const rank = one<any>(row.rank);
      const category = one<any>(row.category);
      const status = one<any>(row.service_status);
      const primaryUnit = one<any>(row.primary_unit);
      const attachmentUnit = one<any>(row.attachment_unit);

      const eligibility = await checkEligibility(
        config.eligibilityRules,
        {
          id: row.id,
          serviceStatusCode: status?.code ?? null,
          categoryCode: category?.code ?? null,
          administrationCode: extractAdministrationCode(
            row.military_number ?? ""
          ),
          primaryUnitId: primaryUnit?.id ?? null,
        },
        supabase
      );

      if (!eligibility.ok) {
        problems[soldier.id] = eligibility.relatedLetterNumber
          ? `${eligibility.errorMessage} (رقم الخطاب: ${eligibility.relatedLetterNumber})`
          : eligibility.errorMessage;
      }

      // نحدّث بيانات الفرد المعروضة بأحدث نسخة من قاعدة البيانات
      return {
        ...soldier,
        militaryId: row.military_number ?? soldier.militaryId,
        name: row.full_name ?? soldier.name,
        rank: rank?.name ?? soldier.rank,
        rankId: row.rank_id ?? soldier.rankId,
        unit: primaryUnit?.name ?? soldier.unit,
        unitId: primaryUnit?.id ?? soldier.unitId,
        attachmentUnit: attachmentUnit?.name ?? "",
        attachmentUnitId: attachmentUnit?.id ?? null,
        dischargeDate: row.discharge_date ?? null,
      };
    })
  );

  return { soldiers, problems };
}

export type OpenDraftResult =
  | {
      ok: true;
      route: string;
      navState: {
        letterTypeId: string;
        letterTypeCode: string;
        letterTypeName: string;
        resumed: true;
      };
    }
  | { ok: false; error: string };

export async function openLetterDraft(id: string): Promise<OpenDraftResult> {
  const { data, error } = await supabase
    .from("letter_drafts")
    .select("id, letter_type_id, current_step, payload, updated_at, expires_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { ok: false, error: `تعذر فتح المسودة: ${error.message}` };
  }

  if (!data) {
    return { ok: false, error: "المسودة غير موجودة (ربما اتحذفت أو انتهت مدتها)." };
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "انتهت مدة هذه المسودة." };
  }

  const { data: typeRow, error: typeError } = await supabase
    .from("letter_types")
    .select(
      "id, name, code, is_active, body_template_singular, body_template_plural, extra_fields, personnel_effect, eligibility_rules, allow_manual_soldier_entry"
    )
    .eq("id", data.letter_type_id)
    .maybeSingle();

  if (typeError || !typeRow) {
    return { ok: false, error: "نوع الخطاب الخاص بالمسودة غير موجود." };
  }

  if (typeRow.is_active === false) {
    return { ok: false, error: "نوع الخطاب ده لم يعد متاحًا للإصدار." };
  }

  const config = mapLetterTypeRow(typeRow);
  const payload: any = data.payload ?? {};

  const { soldiers, problems } = await refreshDraftSoldiers(
    (payload.soldiers ?? []) as DraftSoldier[],
    config
  );

  const step: 2 | 3 = data.current_step === 3 ? 3 : 2;

  const next: LetterDraftState = {
    draftId: data.id,
    draftUpdatedAt: data.updated_at,
    savedSignature: null,
    letterTypeId: config.id,
    letterTypeCode: config.code,
    letterTypeName: config.name,
    soldiers,
    destination: payload.destination ?? "",
    destinationId: payload.destinationId ?? "",
    letterFieldValues: payload.letterFieldValues ?? {},
    soldierFieldGeneralValues: payload.soldierFieldGeneralValues ?? {},
    soldierFieldOverrides: payload.soldierFieldOverrides ?? {},
    soldierProblems: problems,
    currentStep: step,
  };

  state = { ...next, savedSignature: draftSignature(next) };
  emit();

  return {
    ok: true,
    route:
      step === 3
        ? "/dashboard/issue-letter/letter-data"
        : "/dashboard/issue-letter/soldiers",
    navState: {
      letterTypeId: config.id,
      letterTypeCode: config.code,
      letterTypeName: config.name,
      resumed: true,
    },
  };
}