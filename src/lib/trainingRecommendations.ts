  import { supabase } from "./supabase";

  /* =========================================================
    Types
  ========================================================= */

  export type ListType =
    | "COMMANDER"
    | "CHIEF_OF_STAFF"
    | "BRANCH_HEAD"
    | "OTHER";

  export const LIST_TYPE_LABELS: Record<ListType, string> = {
    COMMANDER: "كشف القائد",
    CHIEF_OF_STAFF: "كشف رئيس الأركان",
    BRANCH_HEAD: "كشف رئيس الفرع",
    OTHER: "أخرى",
  };

  export const STAGE_MONTHS = [
    { value: 1, label: "يناير" },
    { value: 4, label: "أبريل" },
    { value: 7, label: "يوليو" },
    { value: 10, label: "أكتوبر" },
  ];

  export const RECRUITMENT_AREAS = [
    "القاهرة",
    "الجيزة",
    "الزقازيق",
    "طنطا",
    "أسيوط",
    "المنصورة",
    "قنا",
    "إسكندرية",
    "المنيا",
  ];

  export interface TrainingRecommendation {
    id: string;

    stage_month: number;
    stage_year: number;

    list_type: ListType;
    list_type_other: string | null;

    full_name: string;
    recommender: string;
    recruitment_area: string;

    national_id: string | null;
    triple_number: string | null;
    qualification: string | null;

    required_weapon: string | null;
    current_weapon: string | null;

    required_unit: string | null;
    current_unit: string | null;

    created_by: string | null;
    created_by_name: string | null;

    created_at: string;
    updated_at: string;
  }

  /* =========================================================
    Helpers
  ========================================================= */

  export function getListTypeLabel(
    listType: ListType,
    listTypeOther: string | null
  ): string {
    if (listType === "OTHER") {
      return listTypeOther || "أخرى";
    }

    return LIST_TYPE_LABELS[listType];
  }

  export function getStageLabel(
    stageMonth: number,
    stageYear: number
  ): string {
    const monthLabel =
      STAGE_MONTHS.find((m) => m.value === stageMonth)?.label ?? "";

    return `${monthLabel} ${stageYear}`;
  }

  /* =========================================================
    قراءة التوصيات (مرحلة + نوع كشف محددين)
  ========================================================= */

  export interface RecommendationsFilter {
    stageMonth: number;
    stageYear: number;
    listType: ListType;
  }

  export async function fetchRecommendations(
    filter: RecommendationsFilter
  ): Promise<TrainingRecommendation[]> {
    const { data, error } = await supabase
      .from("training_recommendations")
      .select("*")
      .eq("stage_month", filter.stageMonth)
      .eq("stage_year", filter.stageYear)
      .eq("list_type", filter.listType)
      .order("full_name", { ascending: true });

    if (error) throw error;

    return data ?? [];
  }

  /* =========================================================
    قراءة توصية واحدة
  ========================================================= */

  export async function fetchRecommendationById(
    id: string
  ): Promise<TrainingRecommendation> {
    const { data, error } = await supabase
      .from("training_recommendations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return data;
  }

  /* =========================================================
    التحقق من تكرار محتمل لنفس الفرد فى نفس المرحلة
    (تحذير Soft فقط، مش منع صارم)
  ========================================================= */

  export interface PossibleDuplicate {
    id: string;
    full_name: string;
    list_type: ListType;
    list_type_other: string | null;
  }

  export async function findPossibleDuplicates(
    stageMonth: number,
    stageYear: number,
    fullName: string,
    nationalId: string | null,
    tripleNumber: string | null,
    excludeId?: string
  ): Promise<PossibleDuplicate[]> {
    const orConditions: string[] = [
      `full_name.eq.${fullName.trim()}`,
    ];

    if (nationalId?.trim()) {
      orConditions.push(`national_id.eq.${nationalId.trim()}`);
    }

    if (tripleNumber?.trim()) {
      orConditions.push(`triple_number.eq.${tripleNumber.trim()}`);
    }

    let query = supabase
      .from("training_recommendations")
      .select("id, full_name, list_type, list_type_other")
      .eq("stage_month", stageMonth)
      .eq("stage_year", stageYear)
      .or(orConditions.join(","));

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data ?? [];
  }

  /* =========================================================
    إنشاء توصية جديدة
  ========================================================= */

  export interface CreateRecommendationInput {
    stage_month: number;
    stage_year: number;
    list_type: ListType;
    list_type_other: string | null;
    full_name: string;
    recommender: string;
    recruitment_area: string;
    national_id: string | null;
    triple_number: string | null;
    qualification: string | null;
    required_weapon: string | null;
    current_weapon: string | null;
    required_unit: string | null;
    current_unit: string | null;
    created_by: string | null;
    created_by_name: string | null;
  }

  export async function createRecommendation(
    input: CreateRecommendationInput
  ): Promise<string> {
    const { data, error } = await supabase
      .from("training_recommendations")
      .insert(input)
      .select("id")
      .single();

    if (error) throw error;

    return data.id as string;
  }

  /* =========================================================
    تحديث توصية
  ========================================================= */

  export type UpdateRecommendationInput = Partial<
    Omit<
      CreateRecommendationInput,
      "created_by" | "created_by_name"
    >
  >;

  export async function updateRecommendation(
    id: string,
    updates: UpdateRecommendationInput
  ): Promise<void> {
    const { error } = await supabase
      .from("training_recommendations")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  }

  /* =========================================================
    حذف توصية
  ========================================================= */

  export async function deleteRecommendation(
    id: string
  ): Promise<void> {
    const { error } = await supabase
      .from("training_recommendations")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
  export const FIELD_LABELS: Record<string, string> = {
    stage_year: "السنة",
    stage_month: "المرحلة التجنيدية",
    list_type: "نوع الكشف",
    list_type_other: "اسم نوع الكشف",
    full_name: "اسم الفرد",
    recommender: "الموصي",
    recruitment_area: "المنطقة التجنيدية",
    national_id: "الرقم القومي",
    triple_number: "الرقم الثلاثي",
    qualification: "المؤهل",
    required_weapon: "السلاح المطلوب",
    current_weapon: "السلاح الحالي",
    required_unit: "الوحدة المطلوبة",
    current_unit: "الوحدة الحالية",
  };

  export type RecommendationLog = {
    id: string;
    recommendation_id: string;
    user_name: string;
    full_name: string;
    action_type: "اضافة" | "تعديل" | "مسح";
    field_label: string | null;
    message: string;
    created_at: string;
  };

  function formatArabicDateTime(date: Date) {
    return date.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
  }

  export async function logRecommendationCreated(
    recommendationId: string,
    userName: string,
    fullName: string
  ) {
    const now = new Date();
    const message = `قام ${userName} بإضافة توصية ${fullName} بتاريخ: ${formatArabicDateTime(now)}`;

    const { error } = await supabase.from("training_recommendation_logs").insert({
      recommendation_id: recommendationId,
      user_name: userName,
      full_name: fullName,
      action_type: "اضافة",
      field_label: null,
      message,
    });

    if (error) console.error("Log create error:", error);
  }

  export async function logRecommendationChanges(
    recommendationId: string,
    userName: string,
    fullName: string,
    oldData: Record<string, any>,
    newData: Record<string, any>
  ) {
    const now = new Date();
    const entries: any[] = [];

    for (const key of Object.keys(FIELD_LABELS)) {
      const oldVal = oldData[key] ?? null;
      const newVal = newData[key] ?? null;

      const oldEmpty = oldVal === null || oldVal === "" || oldVal === undefined;
      const newEmpty = newVal === null || newVal === "" || newVal === undefined;

      if (oldEmpty && newEmpty) continue;
      if (String(oldVal) === String(newVal)) continue;

      let action: "تعديل" | "مسح" | "اضافة";
      if (oldEmpty && !newEmpty) action = "اضافة";
      else if (!oldEmpty && newEmpty) action = "مسح";
      else action = "تعديل";

      const fieldLabel = FIELD_LABELS[key];
      const message = `قام ${userName} بتعديل توصية ${fullName}: ${action} ${fieldLabel} الى "${newVal}" بتاريخ: ${formatArabicDateTime(now)}`;
      entries.push({
        recommendation_id: recommendationId,
        user_name: userName,
        full_name: fullName,
        action_type: action,
        field_label: fieldLabel,
        message,
      });
    }

    if (entries.length === 0) return;

    const { error } = await supabase.from("training_recommendation_logs").insert(entries);
    if (error) console.error("Log changes error:", error);
  }

  export async function fetchRecommendationLogs(
    recommendationId: string
  ): Promise<RecommendationLog[]> {
    const { data, error } = await supabase
      .from("training_recommendation_logs")
      .select("*")
      .eq("recommendation_id", recommendationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }