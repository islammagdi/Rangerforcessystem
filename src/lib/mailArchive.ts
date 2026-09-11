import { supabase } from "./supabase";

/* =========================================================
   Types — الصادر
========================================================= */

export interface MailOffice {
  id: string;
  name: string;
  is_active: boolean;
}

export interface OutgoingMail {
  id: string;
  fax_number: number;
  fax_year: number;
  fax_date: string;
  issuing_office_id: string | null;
  fax_summary: string | null;
  is_original_received: boolean;
  original_received_by: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;

  mail_offices?: {
    name: string;
  } | null;
}

export interface OutgoingMailDestination {
  id: string;
  fax_id: string;
  destination_entity: string;
  created_at: string;
}

export interface OutgoingMailNote {
  id: string;
  fax_id: string;
  note_text: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface OutgoingMailScan {
  id: string;
  fax_id: string;
  file_path: string;
  label: string | null;
  created_at: string;
}

export interface OutgoingMailRecipient {
  id: string;
  fax_id: string;
  recipient_name: string;
  recipient_entity: string | null;
  created_at: string;
}

// الفاكس الصادر بكل تفاصيله المرتبطة (تُستخدم في شاشة التفاصيل)
export interface OutgoingMailFull extends OutgoingMail {
  destinations: OutgoingMailDestination[];
  notes: OutgoingMailNote[];
  scans: OutgoingMailScan[];
  recipients: OutgoingMailRecipient[];
}

/* =========================================================
   Types — الوارد
========================================================= */
export interface IncomingMail {
  id: string;
  fax_number: number;
  fax_year: number;
  fax_date: string;
  source_entity: string;
  receiving_office_id: string | null;
  fax_summary: string | null;
  notes: string | null;
  is_copy_distributed: boolean;
  distributed_to_name: string | null;
  action_taken: string | null;
  branch_head_decision: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;

  mail_offices?: {
    name: string;
  } | null;
}

export interface IncomingMailScan {
  id: string;
  fax_id: string;
  file_path: string;
  label: string | null;
  created_at: string;
}

export interface IncomingMailFull extends IncomingMail {
  scans: IncomingMailScan[];
}

/* =========================================================
   المكاتب
========================================================= */

export async function fetchMailOffices(): Promise<MailOffice[]> {
  const { data, error } = await supabase
    .from("mail_offices")
    .select("id, name, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

/* =========================================================
   توليد رقم الفاكس التالي
========================================================= */

export async function getNextMailNumber(
  mailType: "OUT" | "IN",
  year: number
): Promise<number> {
  const { data, error } = await supabase.rpc(
    "get_next_mail_number",
    {
      p_mail_type: mailType,
      p_fax_year: year,
    }
  );

  if (error) throw error;

  return data as number;
}

/* =========================================================
   الصادر — قراءة القائمة (مع فلاتر)
========================================================= */

export interface OutgoingMailFilters {
  faxNumber?: string;
  faxYear?: string;
  dateFrom?: string;
  dateTo?: string;
  officeId?: string;
}
export async function fetchOutgoingMails(
  filters: OutgoingMailFilters = {}
): Promise<OutgoingMail[]> {
  let query = supabase
    .from("mail_outgoing")
    .select(
      `
      id,
      fax_number,
      fax_year,
      fax_date,
      issuing_office_id,
      fax_summary,
      is_original_received,
      original_received_by,
      created_by,
      created_by_name,
      created_at,
      updated_at,
      mail_offices ( name )
    `
    )
    .order("fax_date", { ascending: false })
    .order("fax_number", { ascending: false });

  if (filters.faxNumber) {
    query = query.eq(
      "fax_number",
      Number(filters.faxNumber)
    );
  }

  if (filters.faxYear) {
    query = query.eq("fax_year", Number(filters.faxYear));
  }

  if (filters.dateFrom) {
    query = query.gte("fax_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("fax_date", filters.dateTo);
  }

  if (filters.officeId) {
    query = query.eq("issuing_office_id", filters.officeId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as unknown as OutgoingMail[];
}

/* =========================================================
   الصادر — قراءة فاكس واحد بكل تفاصيله
========================================================= */

export async function fetchOutgoingMailById(
  id: string
): Promise<OutgoingMailFull> {
  const [
    mailResult,
    destinationsResult,
    notesResult,
    scansResult,
    recipientsResult,
  ] = await Promise.all([
       supabase
      .from("mail_outgoing")
      .select(
        `
        id,
        fax_number,
        fax_year,
        fax_date,
        issuing_office_id,
        fax_summary,
        is_original_received,
        original_received_by,
        created_by,
        created_by_name,
        created_at,
        updated_at,
        mail_offices ( name )
      `
      )
      .eq("id", id)
      .single(),

    supabase
      .from("mail_outgoing_destinations")
      .select("id, fax_id, destination_entity, created_at")
      .eq("fax_id", id)
      .order("created_at", { ascending: true }),

    supabase
      .from("mail_outgoing_notes")
      .select(
        "id, fax_id, note_text, created_by, created_by_name, created_at"
      )
      .eq("fax_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("mail_outgoing_scans")
      .select("id, fax_id, file_path, label, created_at")
      .eq("fax_id", id)
      .order("created_at", { ascending: true }),

    supabase
      .from("mail_outgoing_recipients")
      .select(
        "id, fax_id, recipient_name, recipient_entity, created_at"
      )
      .eq("fax_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (mailResult.error) throw mailResult.error;
  if (destinationsResult.error) throw destinationsResult.error;
  if (notesResult.error) throw notesResult.error;
  if (scansResult.error) throw scansResult.error;
  if (recipientsResult.error) throw recipientsResult.error;

  return {
    ...(mailResult.data as unknown as OutgoingMail),
    destinations: destinationsResult.data ?? [],
    notes: notesResult.data ?? [],
    scans: scansResult.data ?? [],
    recipients: recipientsResult.data ?? [],
  };
}

/* =========================================================
   الصادر — إنشاء فاكس جديد (البيانات الأساسية + البنود
   المتعددة دفعة واحدة)
========================================================= */

export interface CreateOutgoingMailInput {
  fax_date: string;
  issuing_office_id: string | null;
  fax_summary: string | null;
  destinations: string[]; // نصوص حرة، صف لكل جهة
  notes: string[]; // ملاحظات أولية اختيارية
  recipients: { name: string; entity: string | null }[];
  is_original_received: boolean;
  original_received_by: string | null;
  created_by: string | null;
  created_by_name: string | null;
}

// نتيجة الإنشاء: بترجع الـ id (للاستخدام الداخلي زي الرفع
// والتنقل) بالإضافة إلى fax_number و fax_year (للعرض والتسجيل
// في سجل العمليات بدل الاعتماد على الـ UUID الداخلي)
export interface CreateOutgoingMailResult {
  id: string;
  fax_number: number;
  fax_year: number;
}

export async function createOutgoingMail(
  input: CreateOutgoingMailInput
): Promise<CreateOutgoingMailResult> {
  const year = new Date(input.fax_date).getFullYear();

  const faxNumber = await getNextMailNumber("OUT", year);

  const { data: newMail, error: insertError } = await supabase
    .from("mail_outgoing")
    .insert({
      fax_number: faxNumber,
      fax_year: year,
      fax_date: input.fax_date,
      issuing_office_id: input.issuing_office_id,
      fax_summary: input.fax_summary,
      is_original_received: input.is_original_received,
      original_received_by: input.original_received_by,
      created_by: input.created_by,
      created_by_name: input.created_by_name,
    })
    .select("id, fax_number, fax_year")
    .single();

  if (insertError) throw insertError;

  const faxId = newMail.id as string;

  // إدخال الجهات
  if (input.destinations.length > 0) {
    const { error } = await supabase
      .from("mail_outgoing_destinations")
      .insert(
        input.destinations
          .filter((d) => d.trim())
          .map((d) => ({
            fax_id: faxId,
            destination_entity: d.trim(),
          }))
      );

    if (error) throw error;
  }

  // إدخال الملاحظات الأولية (لو موجودة)
  if (input.notes.length > 0) {
    const { error } = await supabase
      .from("mail_outgoing_notes")
      .insert(
        input.notes
          .filter((n) => n.trim())
          .map((n) => ({
            fax_id: faxId,
            note_text: n.trim(),
            created_by: input.created_by,
            created_by_name: input.created_by_name,
          }))
      );

    if (error) throw error;
  }

  // إدخال المستلمين
  if (input.recipients.length > 0) {
    const { error } = await supabase
      .from("mail_outgoing_recipients")
      .insert(
        input.recipients
          .filter((r) => r.name.trim())
          .map((r) => ({
            fax_id: faxId,
            recipient_name: r.name.trim(),
            recipient_entity: r.entity?.trim() || null,
          }))
      );

    if (error) throw error;
  }

  return {
    id: faxId,
    fax_number: newMail.fax_number as number,
    fax_year: newMail.fax_year as number,
  };
}

/* =========================================================
   الصادر — تحديث البيانات الأساسية
========================================================= */

export async function updateOutgoingMail(
  id: string,
  updates: Partial<{
    fax_summary: string | null;
    is_original_received: boolean;
    original_received_by: string | null;
  }>
): Promise<void> {
  const { error } = await supabase
    .from("mail_outgoing")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

/* =========================================================
   الصادر — إضافة عناصر بعد الحفظ (ملاحظة / صورة / مستلم)
========================================================= */

export async function addOutgoingMailNote(
  faxId: string,
  noteText: string,
  createdBy: string | null,
  createdByName: string | null
): Promise<void> {
  const { error } = await supabase
    .from("mail_outgoing_notes")
    .insert({
      fax_id: faxId,
      note_text: noteText.trim(),
      created_by: createdBy,
      created_by_name: createdByName,
    });

  if (error) throw error;
}

export async function addOutgoingMailScan(
  faxId: string,
  filePath: string,
  label: string | null
): Promise<void> {
  const { error } = await supabase
    .from("mail_outgoing_scans")
    .insert({
      fax_id: faxId,
      file_path: filePath,
      label,
    });

  if (error) throw error;
}

export async function addOutgoingMailRecipient(
  faxId: string,
  name: string,
  entity: string | null
): Promise<void> {
  const { error } = await supabase
    .from("mail_outgoing_recipients")
    .insert({
      fax_id: faxId,
      recipient_name: name.trim(),
      recipient_entity: entity?.trim() || null,
    });

  if (error) throw error;
}

/* =========================================================
   الصادر — رفع صورة ضوئية إلى Storage
========================================================= */

export async function uploadOutgoingScanFile(
  faxId: string,
  file: File
): Promise<string> {
  const extension = file.name.split(".").pop() || "jpg";
  const filePath = `outgoing/${faxId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("mail-archive-scans")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  return filePath;
}

export async function getScanSignedUrl(
  filePath: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("mail-archive-scans")
    .createSignedUrl(filePath, 60 * 60);

  if (error) throw error;

  return data.signedUrl;
}

/* =========================================================
   الوارد — قراءة القائمة (مع فلاتر)
========================================================= */

export interface IncomingMailFilters {
  faxNumber?: string;
  faxYear?: string;
  dateFrom?: string;
  dateTo?: string;
  officeId?: string;
}
export async function fetchIncomingMails(
  filters: IncomingMailFilters = {}
): Promise<IncomingMail[]> {
  let query = supabase
    .from("mail_incoming")
    .select(
      `
      id,
      fax_number,
      fax_year,
      fax_date,
      source_entity,
      receiving_office_id,
      fax_summary,
      notes,
      is_copy_distributed,
      distributed_to_name,
      action_taken,
      branch_head_decision,
      created_by,
      created_by_name,
      created_at,
      updated_at,
      mail_offices ( name )
    `
    )
    .order("fax_date", { ascending: false })
    .order("fax_number", { ascending: false });

  if (filters.faxNumber) {
    query = query.eq(
      "fax_number",
      Number(filters.faxNumber)
    );
  }

  if (filters.faxYear) {
    query = query.eq("fax_year", Number(filters.faxYear));
  }

  if (filters.dateFrom) {
    query = query.gte("fax_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("fax_date", filters.dateTo);
  }

  if (filters.officeId) {
    query = query.eq("receiving_office_id", filters.officeId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as unknown as IncomingMail[];
}

/* =========================================================
   الوارد — قراءة فاكس واحد بكل تفاصيله
========================================================= */

export async function fetchIncomingMailById(
  id: string
): Promise<IncomingMailFull> {
  const [mailResult, scansResult] = await Promise.all([
    supabase
      .from("mail_incoming")
      .select(
        `
        id,
        fax_number,
        fax_year,
        fax_date,
        source_entity,
        receiving_office_id,
        fax_summary,
        notes,
        is_copy_distributed,
        distributed_to_name,
        action_taken,
        branch_head_decision,
        created_by,
        created_by_name,
        created_at,
        updated_at,
        mail_offices ( name )
      `
      )
      .eq("id", id)
      .single(),
    supabase
      .from("mail_incoming_scans")
      .select("id, fax_id, file_path, label, created_at")
      .eq("fax_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (mailResult.error) throw mailResult.error;
  if (scansResult.error) throw scansResult.error;

  return {
    ...(mailResult.data as unknown as IncomingMail),
    scans: scansResult.data ?? [],
  };
}

/* =========================================================
   الوارد — إنشاء فاكس جديد
========================================================= */
export interface CreateIncomingMailInput {
  fax_date: string;
  source_entity: string;
  receiving_office_id: string | null;
  fax_summary: string | null;
  notes: string | null;
  is_copy_distributed: boolean;
  distributed_to_name: string | null;
  action_taken: string | null;
  branch_head_decision: string | null;
  created_by: string | null;
  created_by_name: string | null;
}

// نتيجة الإنشاء: بترجع id (للاستخدام الداخلي) بالإضافة إلى
// fax_number و fax_year (للعرض والتسجيل في سجل العمليات)
export interface CreateIncomingMailResult {
  id: string;
  fax_number: number;
  fax_year: number;
}

export async function createIncomingMail(
  input: CreateIncomingMailInput
): Promise<CreateIncomingMailResult> {
  const year = new Date(input.fax_date).getFullYear();

  const faxNumber = await getNextMailNumber("IN", year);

  const { data: newMail, error: insertError } = await supabase
    .from("mail_incoming")
    .insert({
      fax_number: faxNumber,
      fax_year: year,
      fax_date: input.fax_date,
      source_entity: input.source_entity,
      receiving_office_id: input.receiving_office_id,
      fax_summary: input.fax_summary,
      notes: input.notes,
      is_copy_distributed: input.is_copy_distributed,
      distributed_to_name: input.distributed_to_name,
      action_taken: input.action_taken,
      branch_head_decision: input.branch_head_decision,
      created_by: input.created_by,
      created_by_name: input.created_by_name,
    })
    .select("id, fax_number, fax_year")
    .single();

  if (insertError) throw insertError;

  return {
    id: newMail.id as string,
    fax_number: newMail.fax_number as number,
    fax_year: newMail.fax_year as number,
  };
}

/* =========================================================
   الوارد — تحديث البيانات
========================================================= */

export async function updateIncomingMail(
  id: string,
  updates: Partial<{
    fax_summary: string | null;
    notes: string | null;
    is_copy_distributed: boolean;
    distributed_to_name: string | null;
    action_taken: string | null;
    branch_head_decision: string | null;
  }>
): Promise<void> {
  const { error } = await supabase
    .from("mail_incoming")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

/* =========================================================
   الوارد — رفع صورة ضوئية
========================================================= */

export async function uploadIncomingScanFile(
  faxId: string,
  file: File
): Promise<string> {
  const extension = file.name.split(".").pop() || "jpg";
  const filePath = `incoming/${faxId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("mail-archive-scans")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  return filePath;
}

export async function addIncomingMailScan(
  faxId: string,
  filePath: string,
  label: string | null
): Promise<void> {
  const { error } = await supabase
    .from("mail_incoming_scans")
    .insert({
      fax_id: faxId,
      file_path: filePath,
      label,
    });

  if (error) throw error;
}