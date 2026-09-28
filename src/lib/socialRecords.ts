import { supabase } from "./supabase";
import { REQUIRED_FIELD_LABELS } from "./socialConstants";
/* =========================================================
   Types
========================================================= */

export interface MaritalStatus {
  id: string;
  code: string;
  name: string;
}

export interface SocialRecordUnitStat {
  unit_id: string;
  unit_name: string;
  total_count: number;
  complete_count: number;
  incomplete_count: number;
  without_record_count: number;
}

export type SocialRecordStatus = "complete" | "incomplete" | "none";

export interface UnitPersonnelRow {
  id: string;
  military_number: string | null;
  full_name: string;
  rank_name: string | null;
  record_status: SocialRecordStatus;
  missing_fields: string[];
}

export interface SocialRecordFamilyMember {
  id: string;
  social_record_id: string;
  relation: string;
  full_name: string;
  national_id: string | null;
  birth_date: string | null;
  education_stage: string | null;
  notes: string | null;
}

export interface PersonnelBasicInfo {
  id: string;
  military_number: string | null;
  full_name: string;
  rank_name: string | null;
  unit_name: string | null;
  job_name: string | null;
  education_level_name: string | null;
  administration_name: string | null;
}

export interface SocialRecord {
  id: string;
  personnel_id: string;
  national_id: string | null;
  address: string | null;
  phone_number: string | null;
  marital_status: string | null;
  service_join_date: string | null;
  birth_date: string | null;
  photo_path: string | null;
  notes: string | null;
  updated_by_name: string | null;
  updated_at: string;

  religion: string | null;
  blood_type: string | null;
  health_status: string | null;

  birth_governorate_id: string | null;
  birth_district_id: string | null;

  address_governorate_id: string | null;
  address_district_id: string | null;
  address_detail: string | null;

  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
}

export interface SocialRecordFull {
  personnel: PersonnelBasicInfo;
  record: SocialRecord | null;
  familyMembers: SocialRecordFamilyMember[];
}

export interface Governorate {
  id: string;
  name: string;
}

export interface District {
  id: string;
  governorate_id: string;
  name: string;
}

export interface SocialRecordInjury {
  id: string;
  social_record_id: string;
  injury_date: string;
  injury_type: string;
  disability_percentage: number | null;
  notes: string | null;
}

export interface SocialRecordDocument {
  id: string;
  social_record_id: string;
  document_name: string;
  file_path: string;
  created_at: string;
}

/* =========================================================
   القيم الثابتة للحالة الاجتماعية
========================================================= */

export async function fetchMaritalStatuses(): Promise<MaritalStatus[]> {
  const { data, error } = await supabase
    .from("marital_statuses")
    .select("id, code, name")
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

/* =========================================================
   المحافظات والمراكز/الأقسام
========================================================= */

export async function fetchAllGovernorates(): Promise<Governorate[]> {
  const { data, error } = await supabase
    .from("governorates")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function fetchDistrictsByGovernorate(governorateId: string): Promise<District[]> {
  const { data, error } = await supabase
    .from("districts")
    .select("id, governorate_id, name")
    .eq("governorate_id", governorateId)
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

/* =========================================================
   إحصائيات الوحدات (الصفحة الرئيسية)
========================================================= */

export async function fetchSocialRecordUnitStats(): Promise<SocialRecordUnitStat[]> {
  const { data, error } = await supabase.rpc("get_social_record_unit_stats");

  if (error) throw error;

  return (data ?? []) as SocialRecordUnitStat[];
}

/* =========================================================
   البحث برقم عسكري
========================================================= */

export async function searchPersonnelByMilitaryNumber(
  militaryNumber: string
): Promise<{ id: string; full_name: string } | null> {
  const { data, error } = await supabase
    .from("personnel")
    .select("id, full_name")
    .eq("military_number", militaryNumber.trim())
    .maybeSingle();

  if (error) throw error;

  return data;
}

/* =========================================================
   أفراد وحدة معيّنة (مع حالة السجل: مكتمل / غير مكتمل / بدون سجل)
========================================================= */

const REQUIRED_SOCIAL_RECORD_FIELDS = [
  "national_id",
  "phone_number",
  "marital_status",
  "service_join_date",
  "birth_date",
  "religion",
  "blood_type",
  "health_status",
  "birth_governorate_id",
  "birth_district_id",
  "address_governorate_id",
  "address_district_id",
  "address_detail",
  "emergency_contact_name",
  "emergency_contact_phone",
  "emergency_contact_relation",
] as const;

type RequiredFieldsRecord = Record<(typeof REQUIRED_SOCIAL_RECORD_FIELDS)[number], string | null>;

function getRecordCompletionInfo(
  record: RequiredFieldsRecord | null | undefined
): { status: SocialRecordStatus; missing_fields: string[] } {
  if (!record) {
    return { status: "none", missing_fields: ["لا يوجد سجل مضاف"] };
  }

  const missingFields = REQUIRED_SOCIAL_RECORD_FIELDS.filter((field) => !record[field]).map(
    (field) => REQUIRED_FIELD_LABELS[field]
  );

  return {
    status: missingFields.length === 0 ? "complete" : "incomplete",
    missing_fields: missingFields,
  };
}

export async function fetchUnitPersonnelWithStatus(
  unitId: string
): Promise<UnitPersonnelRow[]> {
  const { data: personnel, error: personnelError } = await supabase
    .from("personnel")
    .select("id, military_number, full_name, rank:ranks!rank_id ( name )")
    .eq("primary_unit_id", unitId)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (personnelError) throw personnelError;

  const personnelRows = personnel ?? [];

  if (personnelRows.length === 0) return [];

  const { data: records, error: recordsError } = await supabase
    .from("social_records")
    .select(`personnel_id, ${REQUIRED_SOCIAL_RECORD_FIELDS.join(", ")}`)
    .in(
      "personnel_id",
      personnelRows.map((p) => p.id)
    );

  if (recordsError) throw recordsError;

  const recordsByPersonnelId = new Map<string, any>(
    (records ?? []).map((r: any) => [r.personnel_id, r])
  );

  return personnelRows.map((p: any) => {
    const rank = Array.isArray(p.rank) ? p.rank[0] : p.rank;
    const record = recordsByPersonnelId.get(p.id);

    const { status, missing_fields } = getRecordCompletionInfo(record);

    return {
      id: p.id,
      military_number: p.military_number,
      full_name: p.full_name,
      rank_name: rank?.name ?? null,
      record_status: status,
      missing_fields,
    };
  });
}

export async function fetchUnitName(unitId: string): Promise<string> {
  const { data, error } = await supabase
    .from("units")
    .select("name")
    .eq("id", unitId)
    .single();

  if (error) throw error;

  return data.name;
}

/* =========================================================
   السجل الاجتماعي الكامل لفرد معيّن
========================================================= */

export async function fetchSocialRecordByPersonnelId(
  personnelId: string
): Promise<SocialRecordFull> {
  const [personnelResult, recordResult] = await Promise.all([
    supabase
      .from("personnel")
      .select(
        `
        id,
        military_number,
        full_name,
        rank:ranks!rank_id ( name ),
        primary_unit:units!primary_unit_id ( name ),
        job:jobs!job_id ( name ),
        education_level:education_levels!education_level_id ( name ),
        administration:external_administrations!administration_id ( name )
      `
      )
      .eq("id", personnelId)
      .single(),

    supabase
      .from("social_records")
      .select(
        `
        id, personnel_id, national_id, address, phone_number, marital_status,
        service_join_date, birth_date, photo_path, notes, updated_by_name, updated_at,
        religion, blood_type, health_status,
        birth_governorate_id, birth_district_id,
        address_governorate_id, address_district_id, address_detail,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation
      `
      )
      .eq("personnel_id", personnelId)
      .maybeSingle(),
  ]);

  if (personnelResult.error) throw personnelResult.error;
  if (recordResult.error) throw recordResult.error;

  const rank = Array.isArray(personnelResult.data.rank)
    ? personnelResult.data.rank[0]
    : personnelResult.data.rank;

  const unit = Array.isArray(personnelResult.data.primary_unit)
    ? personnelResult.data.primary_unit[0]
    : personnelResult.data.primary_unit;

  const job = Array.isArray((personnelResult.data as any).job)
    ? (personnelResult.data as any).job[0]
    : (personnelResult.data as any).job;

  const educationLevel = Array.isArray((personnelResult.data as any).education_level)
    ? (personnelResult.data as any).education_level[0]
    : (personnelResult.data as any).education_level;

  const administration = Array.isArray((personnelResult.data as any).administration)
    ? (personnelResult.data as any).administration[0]
    : (personnelResult.data as any).administration;

  const personnel: PersonnelBasicInfo = {
    id: personnelResult.data.id,
    military_number: personnelResult.data.military_number,
    full_name: personnelResult.data.full_name,
    rank_name: (rank as any)?.name ?? null,
    unit_name: (unit as any)?.name ?? null,
    job_name: (job as any)?.name ?? null,
    education_level_name: (educationLevel as any)?.name ?? null,
    administration_name: (administration as any)?.name ?? null,
  };

  let familyMembers: SocialRecordFamilyMember[] = [];

  if (recordResult.data) {
    const { data: familyData, error: familyError } = await supabase
      .from("social_record_family_members")
      .select("id, social_record_id, relation, full_name, national_id, birth_date, education_stage, notes")
      .eq("social_record_id", recordResult.data.id)
      .order("created_at", { ascending: true });

    if (familyError) throw familyError;

    familyMembers = familyData ?? [];
  }

  return {
    personnel,
    record: recordResult.data,
    familyMembers,
  };
}

/* =========================================================
   إنشاء/تحديث السجل (upsert بمفتاح personnel_id)
========================================================= */

export interface UpsertSocialRecordInput {
  personnel_id: string;
  national_id: string | null;
  address: string | null;
  phone_number: string | null;
  marital_status: string | null;
  service_join_date: string | null;
  birth_date: string | null;
  notes: string | null;
  updated_by: string | null;
  updated_by_name: string | null;

  religion: string | null;
  blood_type: string | null;
  health_status: string | null;

  birth_governorate_id: string | null;
  birth_district_id: string | null;

  address_governorate_id: string | null;
  address_district_id: string | null;
  address_detail: string | null;

  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
}

export async function upsertSocialRecord(
  input: UpsertSocialRecordInput
): Promise<string> {
  const { data, error } = await supabase
    .from("social_records")
    .upsert(
      {
        ...input,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "personnel_id" }
    )
    .select("id")
    .single();

  if (error) throw error;

  return data.id;
}

/* =========================================================
   أفراد الأسرة
========================================================= */

export async function addFamilyMember(input: {
  social_record_id: string;
  relation: string;
  full_name: string;
  national_id: string | null;
  birth_date: string | null;
  education_stage: string | null;
  notes: string | null;
}): Promise<void> {
  const { error } = await supabase.from("social_record_family_members").insert(input);

  if (error) throw error;
}

export async function deleteFamilyMember(id: string): Promise<void> {
  const { error } = await supabase.from("social_record_family_members").delete().eq("id", id);

  if (error) throw error;
}

/* =========================================================
   الصورة الشخصية
========================================================= */

export async function uploadSocialPhoto(personnelId: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop() || "jpg";
  const filePath = `${personnelId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("social-records-photos")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  return filePath;
}

export async function getSocialPhotoSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("social-records-photos")
    .createSignedUrl(filePath, 60 * 60);

  if (error) throw error;

  return data.signedUrl;
}

/* =========================================================
   المستندات المرفقة
========================================================= */

export async function fetchDocuments(socialRecordId: string): Promise<SocialRecordDocument[]> {
  const { data, error } = await supabase
    .from("social_record_documents")
    .select("id, social_record_id, document_name, file_path, created_at")
    .eq("social_record_id", socialRecordId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function uploadDocument(
  socialRecordId: string,
  documentName: string,
  file: File
): Promise<void> {
  const extension = file.name.split(".").pop() || "pdf";
  const filePath = `${socialRecordId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("social-records-documents")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from("social_record_documents").insert({
    social_record_id: socialRecordId,
    document_name: documentName,
    file_path: filePath,
  });

  if (insertError) throw insertError;
}

export async function getDocumentSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("social-records-documents")
    .createSignedUrl(filePath, 60 * 60);

  if (error) throw error;

  return data.signedUrl;
}

export async function deleteDocument(id: string, filePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from("social-records-documents")
    .remove([filePath]);

  if (storageError) throw storageError;

  const { error } = await supabase.from("social_record_documents").delete().eq("id", id);

  if (error) throw error;
}

/* =========================================================
   سجل الإصابات
========================================================= */

export async function fetchInjuries(socialRecordId: string): Promise<SocialRecordInjury[]> {
  const { data, error } = await supabase
    .from("social_record_injuries")
    .select("id, social_record_id, injury_date, injury_type, disability_percentage, notes")
    .eq("social_record_id", socialRecordId)
    .order("injury_date", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function addInjury(input: {
  social_record_id: string;
  injury_date: string;
  injury_type: string;
  disability_percentage: number | null;
  notes: string | null;
}): Promise<void> {
  const { error } = await supabase.from("social_record_injuries").insert(input);

  if (error) throw error;
}

export async function deleteInjury(id: string): Promise<void> {
  const { error } = await supabase.from("social_record_injuries").delete().eq("id", id);

  if (error) throw error;
}

/* =========================================================
   سجل الوحدات (تاريخي)
========================================================= */

export interface UnitOption {
  id: string;
  name: string;
}

export interface RankOption {
  id: string;
  name: string;
}

export interface UnitHistoryRow {
  id: string;
  social_record_id: string;
  unit_id: string | null;
  unit_name_free: string | null;
  unit_name_resolved: string;
  rank_id: string | null;
  rank_name: string | null;
  joined_at: string;
  transferred_at: string | null;
  conduct_grade: string | null;
}

export const CONDUCT_GRADES = ["قدوه حسنه", "جيده جدا", "جيده", "رديئه"] as const;

export async function fetchAllUnitOptions(): Promise<UnitOption[]> {
  const { data, error } = await supabase
    .from("units")
    .select("id, name")
    .eq("unit_type", "MAIN")
    .eq("is_active", true)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function fetchAllRankOptions(): Promise<RankOption[]> {
  const { data, error } = await supabase
    .from("ranks")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function fetchUnitHistory(socialRecordId: string): Promise<UnitHistoryRow[]> {
  const { data, error } = await supabase
    .from("social_record_unit_history")
    .select(
      `
      id,
      social_record_id,
      unit_id,
      unit_name_free,
      rank_id,
      joined_at,
      transferred_at,
      conduct_grade,
      units ( name ),
      ranks ( name )
    `
    )
    .eq("social_record_id", socialRecordId)
    .order("joined_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const unit = Array.isArray(row.units) ? row.units[0] : row.units;
    const rank = Array.isArray(row.ranks) ? row.ranks[0] : row.ranks;

    return {
      id: row.id,
      social_record_id: row.social_record_id,
      unit_id: row.unit_id,
      unit_name_free: row.unit_name_free,
      unit_name_resolved: row.unit_name_free ?? unit?.name ?? "-",
      rank_id: row.rank_id,
      rank_name: rank?.name ?? null,
      joined_at: row.joined_at,
      transferred_at: row.transferred_at,
      conduct_grade: row.conduct_grade,
    };
  });
}

export interface AddUnitHistoryInput {
  social_record_id: string;
  unit_id: string | null;
  unit_name_free: string | null;
  rank_id: string | null;
  joined_at: string;
  transferred_at: string | null;
  conduct_grade: string | null;
}

export async function addUnitHistory(input: AddUnitHistoryInput): Promise<void> {
  const { error } = await supabase.from("social_record_unit_history").insert(input);

  if (error) throw error;
}

export async function deleteUnitHistory(id: string): Promise<void> {
  const { error } = await supabase.from("social_record_unit_history").delete().eq("id", id);

  if (error) throw error;
}

export async function updateUnitHistoryTransferDate(
  id: string,
  transferredAt: string | null
): Promise<void> {
  const { data, error } = await supabase
    .from("social_record_unit_history")
    .update({ transferred_at: transferredAt })
    .eq("id", id)
    .select("id");

  if (error) throw error;

  if (!data || data.length === 0) {
    throw new Error("لم يتم تحديث السجل، تأكد من الصلاحيات");
  }
}

/* =========================================================
   حساب مدة الخدمة (يوم/شهر/سنة) بين تاريخين
========================================================= */

export function calculateServiceDuration(
  joinedAt: string,
  transferredAt: string | null
): string {
  const start = new Date(joinedAt);
  const end = transferredAt ? new Date(transferredAt) : new Date();

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} سنة`);
  if (months > 0) parts.push(`${months} شهر`);
  if (days > 0 || parts.length === 0) parts.push(`${days} يوم`);

  return parts.join(" و");
}