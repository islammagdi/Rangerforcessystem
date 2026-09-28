import { supabase } from "./supabase";

/* =========================================================
   ثوابت
========================================================= */

export const MARTYRDOM_TYPES = ["عملية", "تدريب", "حادث أثناء الخدمة", "أخرى"] as const;
export const ENTITLEMENT_TYPES = ["معاش", "تعويض", "وحدة سكنية", "منحة تعليمية", "رعاية صحية", "أخرى"] as const;
export const ENTITLEMENT_STATUSES = ["لم يتم", "جاري", "تم"] as const;
export const FOLLOWUP_TYPES = ["زيارة", "اتصال", "طلب", "شكوى"] as const;
export const FOLLOWUP_STATUSES = ["مفتوح", "مغلق"] as const;

const DOCUMENTS_BUCKET = "martyrs-documents";
const PHOTOS_BUCKET = "martyrs-photos";

/* =========================================================
   Types
========================================================= */

export interface MartyrListRow {
  id: string;
  military_number: string | null;
  full_name: string;
  martyrdom_date: string;
  martyrdom_place: string | null;
  martyrdom_type: string | null;
  unit_id: string | null;
  rank_name: string | null;
  unit_name: string | null;
}

export interface MartyrRecord {
  id: string;
  military_number: string | null;
  full_name: string;
  national_id: string | null;
  rank_id: string | null;
  rank_name: string | null;
  unit_id: string | null;
  unit_name: string | null;
  job_id: string | null;
  job_name: string | null;
  photo_path: string | null;
  birth_date: string | null;
  birth_governorate_id: string | null;
  birth_district_id: string | null;
  religion: string | null;
  marital_status: string | null;
  address_governorate_id: string | null;
  address_district_id: string | null;
  address_detail: string | null;
  service_join_date: string | null;
  martyrdom_date: string;
  martyrdom_place: string | null;
  martyrdom_type: string | null;
  circumstances: string | null;
  decision_number: string | null;
  decision_date: string | null;
  decision_issuer: string | null;
  notes: string | null;
  updated_by_name: string | null;
}

export type MartyrInput = Partial<Omit<MartyrRecord, "id" | "rank_name" | "unit_name" | "job_name">>;

export interface JobOption {
  id: string;
  name: string;
}
export interface MartyrHeir {
  id: string;
  martyr_id: string;
  relation: string;
  full_name: string;
  national_id: string | null;
  birth_date: string | null;
  phone_number: string | null;
  education_stage: string | null;
  is_pension_beneficiary: boolean;
  notes: string | null;
}

export interface MartyrEntitlement {
  id: string;
  martyr_id: string;
  entitlement_type: string;
  status: string;
  status_date: string | null;
  decision_number: string | null;
  notes: string | null;
}

export interface MartyrHonor {
  id: string;
  martyr_id: string;
  honor_type: string;
  honor_date: string | null;
  issuer: string | null;
  notes: string | null;
}

export interface MartyrFollowup {
  id: string;
  martyr_id: string;
  followup_date: string;
  followup_type: string;
  done_by: string | null;
  details: string | null;
  status: string;
}

export interface MartyrDocument {
  id: string;
  martyr_id: string;
  document_name: string;
  file_path: string;
}

export interface MartyrUnitHistoryRow {
  id: string;
  martyr_id: string;
  unit_id: string | null;
  unit_name_free: string | null;
  unit_name_resolved: string;
  rank_id: string | null;
  rank_name: string | null;
  joined_at: string;
  transferred_at: string | null;
}

export interface MartyrPromotion {
  id: string;
  martyr_id: string;
  rank_id: string;
  rank_name: string | null;
  promotion_date: string;
  decision_number: string;
}

/* =========================================================
   Helpers
========================================================= */

const one = (v: any) => (Array.isArray(v) ? v[0] : v);

async function getCurrentUserInfo() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null as string | null, userName: "غير معروف" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, userName: (profile?.username as string | undefined) ?? "غير معروف" };
}

async function fetchChildren<T>(table: string, martyrId: string, orderCol: string, ascending = false): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("martyr_id", martyrId)
    .order(orderCol, { ascending });

  if (error) throw error;
  return (data ?? []) as T[];
}

async function insertRow(table: string, row: Record<string, any>): Promise<void> {
  const { error } = await supabase.from(table).insert(row);
  if (error) throw error;
}

async function updateRow(table: string, id: string, patch: Record<string, any>): Promise<void> {
  const { error } = await supabase.from(table).update(patch).eq("id", id);
  if (error) throw error;
}

async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

function safeFileName(file: File): string {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.replace(/[^a-zA-Z0-9]/g, "") : "";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext ? "." + ext : ""}`;
}

/* =========================================================
   الشهداء (القائمة + التفاصيل)
========================================================= */

export async function fetchMartyrs(): Promise<MartyrListRow[]> {
  const { data, error } = await supabase
    .from("martyrs")
    .select(
      `
      id,
      military_number,
      full_name,
      martyrdom_date,
      martyrdom_place,
      martyrdom_type,
      unit_id,
      rank:ranks!rank_id ( name ),
      unit:units!unit_id ( name )
    `
    )
    .order("martyrdom_date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    military_number: row.military_number,
    full_name: row.full_name,
    martyrdom_date: row.martyrdom_date,
    martyrdom_place: row.martyrdom_place,
    martyrdom_type: row.martyrdom_type,
    unit_id: row.unit_id,
    rank_name: one(row.rank)?.name ?? null,
    unit_name: one(row.unit)?.name ?? null,
  }));
}

export async function fetchMartyrById(id: string): Promise<MartyrRecord> {
  const { data, error } = await supabase
    .from("martyrs")
    .select("*, rank:ranks!rank_id ( name ), unit:units!unit_id ( name ), job:jobs!job_id ( name )")
    .eq("id", id)
    .single();

  if (error) throw error;

  const { rank, unit, job, ...rest } = data as any;

  return {
    ...rest,
    rank_name: one(rank)?.name ?? null,
    unit_name: one(unit)?.name ?? null,
    job_name: one(job)?.name ?? null,
  } as MartyrRecord;
}

export async function fetchAllJobOptions(): Promise<JobOption[]> {
  const { data, error } = await supabase.from("jobs").select("id, name").order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as JobOption[];
}
export async function createMartyr(input: MartyrInput & { full_name: string; martyrdom_date: string }): Promise<string> {
  const { userId, userName } = await getCurrentUserInfo();

  const { data, error } = await supabase
    .from("martyrs")
    .insert({ ...input, created_by: userId, updated_by: userId, updated_by_name: userName })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function updateMartyr(id: string, patch: MartyrInput): Promise<void> {
  const { userId, userName } = await getCurrentUserInfo();
  await updateRow("martyrs", id, { ...patch, updated_by: userId, updated_by_name: userName });
}

export async function deleteMartyr(id: string): Promise<void> {
  const docs = await fetchChildren<MartyrDocument>("martyr_documents", id, "created_at");
  const { data: martyr } = await supabase.from("martyrs").select("photo_path").eq("id", id).maybeSingle();

  const { error } = await supabase.from("martyrs").delete().eq("id", id);
  if (error) throw error;

  // تنظيف الملفات بعد نجاح الحذف (فشل التنظيف لا يمنع الحذف)
  if (docs.length > 0) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove(docs.map((d) => d.file_path));
  }
  if (martyr?.photo_path) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([martyr.photo_path as string]);
  }
}

/* =========================================================
   الصورة
========================================================= */

export async function uploadMartyrPhoto(martyrId: string, file: File): Promise<string> {
  const path = `${martyrId}/${safeFileName(file)}`;

  const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;

  return path;
}

export async function getMartyrPhotoSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(PHOTOS_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

/* =========================================================
   الورثة
========================================================= */

export const fetchHeirs = (martyrId: string) => fetchChildren<MartyrHeir>("martyr_heirs", martyrId, "created_at", true);
export const addHeir = (row: Omit<MartyrHeir, "id">) => insertRow("martyr_heirs", row);
export const deleteHeir = (id: string) => deleteRow("martyr_heirs", id);

/* =========================================================
   الحقوق والمستحقات
========================================================= */

export const fetchEntitlements = (martyrId: string) =>
  fetchChildren<MartyrEntitlement>("martyr_entitlements", martyrId, "created_at", true);
export const addEntitlement = (row: Omit<MartyrEntitlement, "id">) => insertRow("martyr_entitlements", row);
export const updateEntitlement = (id: string, patch: Partial<Omit<MartyrEntitlement, "id" | "martyr_id">>) =>
  updateRow("martyr_entitlements", id, patch);
export const deleteEntitlement = (id: string) => deleteRow("martyr_entitlements", id);

/* =========================================================
   التكريمات
========================================================= */

export const fetchHonors = (martyrId: string) => fetchChildren<MartyrHonor>("martyr_honors", martyrId, "honor_date");
export const addHonor = (row: Omit<MartyrHonor, "id">) => insertRow("martyr_honors", row);
export const deleteHonor = (id: string) => deleteRow("martyr_honors", id);

/* =========================================================
   المتابعة
========================================================= */

export const fetchFollowups = (martyrId: string) =>
  fetchChildren<MartyrFollowup>("martyr_followups", martyrId, "followup_date");
export const addFollowup = (row: Omit<MartyrFollowup, "id">) => insertRow("martyr_followups", row);
export const updateFollowup = (id: string, patch: Partial<Pick<MartyrFollowup, "status">>) =>
  updateRow("martyr_followups", id, patch);
export const deleteFollowup = (id: string) => deleteRow("martyr_followups", id);

/* =========================================================
   المستندات
========================================================= */

export const fetchMartyrDocuments = (martyrId: string) =>
  fetchChildren<MartyrDocument>("martyr_documents", martyrId, "created_at", true);

export async function uploadMartyrDocument(martyrId: string, documentName: string, file: File): Promise<void> {
  const path = `${martyrId}/${safeFileName(file)}`;

  const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, { upsert: false });
  if (uploadError) throw uploadError;

  const { error } = await supabase
    .from("martyr_documents")
    .insert({ martyr_id: martyrId, document_name: documentName, file_path: path });

  if (error) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
    throw error;
  }
}

export async function getMartyrDocumentSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteMartyrDocument(id: string, path: string): Promise<void> {
  await deleteRow("martyr_documents", id);
  await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
}

/* =========================================================
   سجل الوحدات (قبل الاستشهاد)
========================================================= */

export async function fetchMartyrUnitHistory(martyrId: string): Promise<MartyrUnitHistoryRow[]> {
  const { data, error } = await supabase
    .from("martyr_unit_history")
    .select(
      `
      id, martyr_id, unit_id, unit_name_free, rank_id, joined_at, transferred_at,
      unit:units!unit_id ( name ),
      rank:ranks!rank_id ( name )
    `
    )
    .eq("martyr_id", martyrId)
    .order("joined_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    martyr_id: row.martyr_id,
    unit_id: row.unit_id,
    unit_name_free: row.unit_name_free,
    unit_name_resolved: one(row.unit)?.name ?? row.unit_name_free ?? "-",
    rank_id: row.rank_id,
    rank_name: one(row.rank)?.name ?? null,
    joined_at: row.joined_at,
    transferred_at: row.transferred_at,
  }));
}

export const addMartyrUnitHistory = (row: {
  martyr_id: string;
  unit_id: string | null;
  unit_name_free: string | null;
  rank_id: string | null;
  joined_at: string;
  transferred_at: string | null;
}) => insertRow("martyr_unit_history", row);

export const deleteMartyrUnitHistory = (id: string) => deleteRow("martyr_unit_history", id);

/* =========================================================
   الترقيات
========================================================= */

export async function fetchMartyrPromotions(martyrId: string): Promise<MartyrPromotion[]> {
  const { data, error } = await supabase
    .from("martyr_promotions")
    .select("id, martyr_id, rank_id, promotion_date, decision_number, rank:ranks!rank_id ( name )")
    .eq("martyr_id", martyrId)
    .order("promotion_date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    martyr_id: row.martyr_id,
    rank_id: row.rank_id,
    rank_name: one(row.rank)?.name ?? null,
    promotion_date: row.promotion_date,
    decision_number: row.decision_number,
  }));
}

export const addMartyrPromotion = (row: {
  martyr_id: string;
  rank_id: string;
  promotion_date: string;
  decision_number: string;
}) => insertRow("martyr_promotions", row);

export const deleteMartyrPromotion = (id: string) => deleteRow("martyr_promotions", id);