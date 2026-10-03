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
  original_received_by_id: string | null;
  original_received_at: string | null;
  handed_over_by_name: string | null;
  handed_over_at: string | null;
    branch_head_confirmed_by_name: string | null;
  branch_head_confirmed_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;

  mail_offices?: {
    name: string;
  } | null;

  mail_outgoing_destinations?: {
    destination_entity: string;
  }[];
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
   توليد رقم الفاكس التالي (مشتركة بين الصادر والوارد)
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
  faxSummary?: string;
  destinationEntity?: string;
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
      original_received_by_id,
      original_received_at,
      handed_over_by_name,
      handed_over_at,
      branch_head_confirmed_by_name,
      branch_head_confirmed_at,
      created_by,
      created_by_name,
      created_at,
      updated_at,
      mail_offices ( name ),
      mail_outgoing_destinations ( destination_entity )
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

  if (filters.faxSummary) {
    query = query.ilike("fax_summary", `%${filters.faxSummary}%`);
  }

  // الجهة الصادر لها متخزنة في جدول فرعي (فاكس واحد ممكن
  // يكون ليه أكتر من جهة)، فبنجيب أولًا الـ fax_id بتاعة
  // الجهات المطابقة للبحث، وبعدين بنفلتر الفاكسات على أساسها
  if (filters.destinationEntity) {
    const { data: destRows, error: destErr } = await supabase
      .from("mail_outgoing_destinations")
      .select("fax_id")
      .ilike("destination_entity", `%${filters.destinationEntity}%`);

    if (destErr) throw destErr;

    const matchingIds = Array.from(
      new Set((destRows ?? []).map((r) => r.fax_id))
    );

    if (matchingIds.length === 0) {
      return [];
    }

    query = query.in("id", matchingIds);
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
      original_received_by_id,
      original_received_at,
      handed_over_by_name,
      handed_over_at,
      branch_head_confirmed_by_name,
      branch_head_confirmed_at,
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
   Types — الوارد
========================================================= */

export interface IncomingMailScan {
  id: string;
  fax_id: string;
  file_path: string;
  label: string | null;
  created_at: string;
}

export interface IncomingMailOffice {
  office_id: string;
  office_name: string;
}

export interface IncomingMailReceipt {
  office_id: string;
  office_name: string;
  received_by: string | null;
  received_by_name: string | null;
  received_at: string | null;
}

export interface IncomingMailNote {
  id: string;
  fax_id: string;
  note_text: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

// إجراء كل مكتب مختص على حِدة (بدل حقل action_taken الواحد
// اللي كان بيتشارك فيه كل المكاتب المختصة بنفس الفاكس)
export interface IncomingMailOfficeAction {
  office_id: string;
  office_name: string;
  action_text: string | null;
  action_by: string | null;
  action_by_name: string | null;
  action_at: string | null;
}
export interface IncomingMail {
  id: string;
  fax_number: number;
  fax_year: number;
  fax_date: string;
  source_entity: string;
  fax_summary: string | null;
  branch_head_decision: string | null;
  branch_head_decision_by_name: string | null;
  branch_head_decision_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  is_copy_distributed?: boolean; // محسوبة من mail_incoming_receipts، مش عمود فعلي
  office_names?: string[]; // أسماء كل المكاتب المختصة (فاكس واحد ممكن يكون له أكتر من مكتب)
}
export interface IncomingMailFull extends IncomingMail {
  scans: IncomingMailScan[];
  offices: IncomingMailOffice[];
  receipts: IncomingMailReceipt[];
  notes: IncomingMailNote[];
  officeActions: IncomingMailOfficeAction[];
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
  faxSummary?: string;
  sourceEntity?: string;
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
      fax_summary,
      branch_head_decision,
      branch_head_decision_by_name,
      branch_head_decision_at,
      created_by,
      created_by_name,
      created_at,
      updated_at
    `
    )
    .order("fax_date", { ascending: false })
    .order("fax_number", { ascending: false });

  if (filters.faxNumber) {
    query = query.eq("fax_number", Number(filters.faxNumber));
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

  if (filters.faxSummary) {
    query = query.ilike("fax_summary", `%${filters.faxSummary}%`);
  }

  if (filters.sourceEntity) {
    query = query.ilike("source_entity", `%${filters.sourceEntity}%`);
  }

  if (filters.officeId) {
    const { data: officeRows, error: officeErr } = await supabase
      .from("mail_incoming_offices")
      .select("fax_id")
      .eq("office_id", filters.officeId);

    if (officeErr) throw officeErr;

    const matchingIds = Array.from(new Set((officeRows ?? []).map((r) => r.fax_id)));

    if (matchingIds.length === 0) {
      return [];
    }

    query = query.in("id", matchingIds);
  }

  const { data, error } = await query;

  if (error) throw error;

  const mails = (data ?? []) as unknown as IncomingMail[];

  if (mails.length === 0) return mails;

  const mailIds = mails.map((m) => m.id);

  // حالة "تم التوزيع" بقت متحسبة من mail_incoming_receipts
  // بدل عمود is_copy_distributed القديم (اتلغى)
  const [statusResult, officesResult] = await Promise.all([
    supabase.rpc("get_incoming_mail_receipt_status", { p_fax_ids: mailIds }),
    supabase
      .from("mail_incoming_offices")
      .select("fax_id, mail_offices ( name )")
      .in("fax_id", mailIds),
  ]);

  if (statusResult.error) throw statusResult.error;
  if (officesResult.error) throw officesResult.error;

  const statusMap = new Map<string, boolean>();
  (statusResult.data ?? []).forEach((row: any) => {
    statusMap.set(row.fax_id, row.is_fully_received);
  });

  // فاكس واحد ممكن يكون له أكتر من مكتب مختص، فبنجمّع الأسماء
  const officesMap = new Map<string, string[]>();
  (officesResult.data ?? []).forEach((row: any) => {
    const officeName = row.mail_offices?.name;
    if (!officeName) return;

    const existing = officesMap.get(row.fax_id) ?? [];
    existing.push(officeName);
    officesMap.set(row.fax_id, existing);
  });

  return mails.map((m) => ({
    ...m,
    is_copy_distributed: statusMap.get(m.id) ?? false,
    office_names: officesMap.get(m.id) ?? [],
  }));
}
/* =========================================================
   الوارد — قراءة فاكس واحد بكل تفاصيله
========================================================= */

export async function fetchIncomingMailById(id: string): Promise<IncomingMailFull> {
  const [
    mailResult,
    scansResult,
    officesResult,
    receiptsResult,
    notesResult,
    actionsResult,
  ] = await Promise.all([
    supabase
      .from("mail_incoming")
      .select(
        `
        id,
        fax_number,
        fax_year,
        fax_date,
        source_entity,
        fax_summary,
        branch_head_decision,
        branch_head_decision_by_name,
        branch_head_decision_at,
        created_by,
        created_by_name,
        created_at,
        updated_at
      `
      )
      .eq("id", id)
      .single(),

    supabase
      .from("mail_incoming_scans")
      .select("id, fax_id, file_path, label, created_at")
      .eq("fax_id", id)
      .order("created_at", { ascending: true }),

    supabase
      .from("mail_incoming_offices")
      .select("office_id, mail_offices ( name )")
      .eq("fax_id", id),

    supabase
      .from("mail_incoming_receipts")
      .select("office_id, received_by, received_by_name, received_at")
      .eq("fax_id", id),

    supabase
      .from("mail_incoming_notes")
      .select("id, fax_id, note_text, created_by, created_by_name, created_at")
      .eq("fax_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("mail_incoming_office_actions")
      .select("office_id, action_text, action_by, action_by_name, action_at")
      .eq("fax_id", id),
  ]);

  if (mailResult.error) throw mailResult.error;
  if (scansResult.error) throw scansResult.error;
  if (officesResult.error) throw officesResult.error;
  if (receiptsResult.error) throw receiptsResult.error;
  if (notesResult.error) throw notesResult.error;
  if (actionsResult.error) throw actionsResult.error;

  const offices: IncomingMailOffice[] = (officesResult.data ?? []).map((row: any) => ({
    office_id: row.office_id,
    office_name: row.mail_offices?.name ?? "-",
  }));

  const receiptByOffice = new Map<string, any>();
  (receiptsResult.data ?? []).forEach((row: any) => {
    receiptByOffice.set(row.office_id, row);
  });

  const receipts: IncomingMailReceipt[] = offices.map((office) => {
    const r = receiptByOffice.get(office.office_id);
    return {
      office_id: office.office_id,
      office_name: office.office_name,
      received_by: r?.received_by ?? null,
      received_by_name: r?.received_by_name ?? null,
      received_at: r?.received_at ?? null,
    };
  });

  const actionByOffice = new Map<string, any>();
  (actionsResult.data ?? []).forEach((row: any) => {
    actionByOffice.set(row.office_id, row);
  });

  // بنبني صف لكل مكتب مختص بالفاكس حتى لو لسه معملش أي إجراء،
  // عشان الواجهة تعرف تعرض حقل فاضي قابل للتعديل لصاحب الاختصاص
  const officeActions: IncomingMailOfficeAction[] = offices.map((office) => {
    const a = actionByOffice.get(office.office_id);
    return {
      office_id: office.office_id,
      office_name: office.office_name,
      action_text: a?.action_text ?? null,
      action_by: a?.action_by ?? null,
      action_by_name: a?.action_by_name ?? null,
      action_at: a?.action_at ?? null,
    };
  });

  return {
    ...(mailResult.data as unknown as IncomingMail),
    scans: scansResult.data ?? [],
    offices,
    receipts,
    notes: notesResult.data ?? [],
    officeActions,
  };
}

/* =========================================================
   الوارد — إنشاء فاكس جديد
========================================================= */

export interface CreateIncomingMailInput {
  fax_date: string;
  source_entity: string;
  office_ids: string[];
  fax_summary: string; // بقى إجباري
  initial_note: string | null;
  created_by: string | null;
  created_by_name: string | null;
}

export interface CreateIncomingMailResult {
  id: string;
  fax_number: number;
  fax_year: number;
}

export async function createIncomingMail(
  input: CreateIncomingMailInput
): Promise<CreateIncomingMailResult> {
  // إضافة فاكس وارد جديد متاحة لمستخدمي الأرشيف فقط — بنتأكد
  // من الصلاحية هنا كخط دفاع تاني حتى لو الواجهة مخفية الزرار
  const isArchive = await fetchIsArchiveUser();

  if (!isArchive) {
    throw new Error("إضافة فاكس وارد جديد متاحة لمستخدمي الأرشيف فقط");
  }

  if (!input.fax_summary || !input.fax_summary.trim()) {
    throw new Error("ملخص الفاكس مطلوب");
  }

  const year = new Date(input.fax_date).getFullYear();

  const faxNumber = await getNextMailNumber("IN", year);

  const { data: newMail, error: insertError } = await supabase
    .from("mail_incoming")
    .insert({
      fax_number: faxNumber,
      fax_year: year,
      fax_date: input.fax_date,
      source_entity: input.source_entity,
      fax_summary: input.fax_summary.trim(),
      created_by: input.created_by,
      created_by_name: input.created_by_name,
    })
    .select("id, fax_number, fax_year")
    .single();

  if (insertError) throw insertError;

  const faxId = newMail.id as string;

  if (input.office_ids.length > 0) {
    const { error: officesError } = await supabase.from("mail_incoming_offices").insert(
      input.office_ids.map((officeId) => ({
        fax_id: faxId,
        office_id: officeId,
      }))
    );

    if (officesError) throw officesError;
  }

  if (input.initial_note && input.initial_note.trim()) {
    const { error: noteError } = await supabase.from("mail_incoming_notes").insert({
      fax_id: faxId,
      note_text: input.initial_note.trim(),
      created_by: input.created_by,
      created_by_name: input.created_by_name,
    });

    if (noteError) throw noteError;
  }

  return {
    id: faxId,
    fax_number: newMail.fax_number as number,
    fax_year: newMail.fax_year as number,
  };
}

/* =========================================================
   الوارد — تحديث الحقول القابلة للتعديل
   (ملخص الفاكس: أرشيف فقط / قرار رئيس الفرع: رئيس الفرع فقط)
========================================================= */

export async function updateIncomingMail(
  id: string,
  updates: Partial<{
    fax_summary: string | null;
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
   الوارد — إجراء كل مكتب مختص (upsert لصف المكتب بس)
========================================================= */

export async function upsertIncomingMailOfficeAction(
  faxId: string,
  officeId: string,
  actionText: string,
  createdBy: string | null,
  createdByName: string | null
): Promise<void> {
  const { error } = await supabase.from("mail_incoming_office_actions").upsert(
    {
      fax_id: faxId,
      office_id: officeId,
      action_text: actionText.trim() || null,
      action_by: createdBy,
      action_by_name: createdByName,
      action_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "fax_id,office_id" }
  );

  if (error) throw error;
}

/* =========================================================
   الوارد — الملاحظات (متاحة لكل الأدوار)
========================================================= */

export async function addIncomingMailNote(
  faxId: string,
  noteText: string,
  createdBy: string | null,
  createdByName: string | null
): Promise<void> {
  const { error } = await supabase.from("mail_incoming_notes").insert({
    fax_id: faxId,
    note_text: noteText.trim(),
    created_by: createdBy,
    created_by_name: createdByName,
  });

  if (error) throw error;
}

/* =========================================================
   الوارد — رفع صورة ضوئية
========================================================= */

export async function uploadIncomingScanFile(faxId: string, file: File): Promise<string> {
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
  const { error } = await supabase.from("mail_incoming_scans").insert({
    fax_id: faxId,
    file_path: filePath,
    label,
  });

  if (error) throw error;
}

/* =========================================================
   الوارد — الأدوار والمكاتب (ربط المختص بالمكتب)
========================================================= */

export interface OfficeRoleLink {
  id: string;
  office_id: string;
  role_id: string;
}

export async function fetchAllOfficeRoleLinks(): Promise<OfficeRoleLink[]> {
  const { data, error } = await supabase.from("office_roles").select("id, office_id, role_id");

  if (error) throw error;

  return data ?? [];
}

export async function setOfficeRoleLink(
  roleId: string,
  officeId: string | null
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("office_roles")
    .delete()
    .eq("role_id", roleId);

  if (deleteError) throw deleteError;

  if (officeId) {
    const { error: insertError } = await supabase
      .from("office_roles")
      .insert({ office_id: officeId, role_id: roleId });

    if (insertError) throw insertError;
  }
}

/* =========================================================
   الوارد — تسجيل استلام المختص للفاكس (تلقائي عند الفتح)
========================================================= */

export async function markIncomingMailReceived(faxId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_incoming_mail_received", {
    p_mail_id: faxId,
  });

  if (error) throw error;
}

/* =========================================================
   الوارد — أدوار المستخدم الحالي (مساعدة داخلية)
========================================================= */

async function fetchCurrentUserRoleInfo(): Promise<{
  userId: string | null;
  roleIds: string[];
  roleCodes: string[];
  permissionCodes: Set<string>;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, roleIds: [], roleCodes: [], permissionCodes: new Set() };
  }

  const { data: userRolesData, error: userRolesError } = await supabase
    .from("user_roles")
    .select("role_id, roles ( code )")
    .eq("user_id", user.id);

  if (userRolesError) throw userRolesError;

  const roleIds = (userRolesData ?? []).map((r: any) => r.role_id as string);
  const roleCodes = (userRolesData ?? [])
    .map((r: any) => r.roles?.code as string | undefined)
    .filter((c): c is string => Boolean(c));

  let permissionCodes = new Set<string>();

  if (roleIds.length > 0) {
    const { data: permsData, error: permsError } = await supabase
      .from("role_permissions")
      .select("permissions ( module, action )")
      .in("role_id", roleIds);

    if (permsError) throw permsError;

    (permsData ?? []).forEach((row: any) => {
      const perm = Array.isArray(row.permissions) ? row.permissions[0] : row.permissions;
      if (perm) permissionCodes.add(`${perm.module}:${perm.action}`);
    });
  }

  return { userId: user.id, roleIds, roleCodes, permissionCodes };
}

// هل المستخدم الحالي عنده صلاحية "إضافة فاكس وارد"؟ — دي شرط
// إضافة فاكس وارد جديد، وكمان شرط التعديل على ملخص الفاكس.
// الأدمن دايمًا يقدر (نفس منطق hasPermission في الفرونت إند)
export async function fetchIsArchiveUser(): Promise<boolean> {
  const { roleCodes, permissionCodes } = await fetchCurrentUserRoleInfo();
  return roleCodes.includes("ADMIN") || permissionCodes.has("archive_incoming:create");
}

/* =========================================================
   الصادر — صلاحيات المستخدم الحالي بالنسبة لفاكس صادر معين
   (تُستخدم لتوسيع دائرة "مين يقدر يضيف ملاحظة" فوق canEdit
   العادية، لتشمل رئيس الفرع ومسؤول المكتب المُصدر للفاكس)
========================================================= */

export interface OutgoingMailPermissions {
  isBranchHead: boolean;
  isOfficeSpecialist: boolean;
}

export async function fetchOutgoingMailPermissions(
  issuingOfficeId: string | null
): Promise<OutgoingMailPermissions> {
  const { userId, roleIds, roleCodes } = await fetchCurrentUserRoleInfo();

  if (!userId) {
    return { isBranchHead: false, isOfficeSpecialist: false };
  }

  const isBranchHead = roleCodes.includes("BRANCH_HEAD");

  let isOfficeSpecialist = false;

  if (issuingOfficeId && roleIds.length > 0) {
    // المكتب ممكن يكون مربوط بأكتر من دور
    const { data: officeRoles, error } = await supabase
      .from("office_roles")
      .select("role_id")
      .eq("office_id", issuingOfficeId);

    if (error) throw error;

    isOfficeSpecialist = (officeRoles ?? []).some((or: any) => roleIds.includes(or.role_id));
  }

  return { isBranchHead, isOfficeSpecialist };
}

/* =========================================================
   الوارد — صلاحيات المستخدم الحالي بالنسبة لفاكس معين
========================================================= */

export interface IncomingMailPermissions {
  isArchive: boolean;
  isBranchHead: boolean;
  // المكاتب (من ضمن مكاتب الفاكس ده تحديدًا) اللي المستخدم
  // الحالي مسموح له يعدل حقل "ما تم حياله" الخاص بيها
  editableOfficeIds: string[];
}

export async function fetchIncomingMailPermissions(
  officeIds: string[]
): Promise<IncomingMailPermissions> {
const { userId, roleIds, roleCodes, permissionCodes } = await fetchCurrentUserRoleInfo();
  if (!userId) {
    return { isArchive: false, isBranchHead: false, editableOfficeIds: [] };
  }

  const isArchive = roleCodes.includes("ADMIN") || permissionCodes.has("archive_incoming:create");
  const isBranchHead = roleCodes.includes("BRANCH_HEAD");

  let editableOfficeIds: string[] = [];

  if (officeIds.length > 0 && roleIds.length > 0) {
    const { data: officeRoles, error: officeRolesError } = await supabase
      .from("office_roles")
      .select("office_id, role_id")
      .in("office_id", officeIds);

    if (officeRolesError) throw officeRolesError;

    editableOfficeIds = Array.from(
      new Set(
        (officeRoles ?? [])
          .filter((or: any) => roleIds.includes(or.role_id))
          .map((or: any) => or.office_id as string)
      )
    );
  }

  return { isArchive, isBranchHead, editableOfficeIds };
}

/* =========================================================
   الوارد — إشعار المختصين بفاكس جديد (لكل المكاتب المختارة)
========================================================= */

export async function notifyOfficesAboutNewIncomingMail(params: {
  officeIds: string[];
  faxId: string;
  faxDisplayNumber: string;
  summary: string | null;
  createdBy: string | null;
  createdByName: string | null;
}): Promise<void> {
  if (params.officeIds.length === 0) return;

  const { data: officeRoles, error } = await supabase
    .from("office_roles")
    .select("office_id, role_id")
    .in("office_id", params.officeIds);

  if (error) throw error;

  const roleIds = Array.from(new Set((officeRoles ?? []).map((r: any) => r.role_id as string)));

  if (roleIds.length === 0) return;

  const rows = roleIds.map((roleId) => ({
    title: `فاكس وارد جديد رقم ${params.faxDisplayNumber}`,
    body: params.summary?.trim() || "فاكس وارد جديد يخص مكتبكم، برجاء المراجعة.",
    type: "info",
    entity_type: "mail_incoming",
    entity_id: params.faxId,
    target_role_id: roleId,
    created_by: params.createdBy,
    created_by_name: params.createdByName,
  }));

  const { error: insertError } = await supabase.from("notifications").insert(rows);

  if (insertError) throw insertError;
}
export async function markOutgoingMailOriginalReceived(
  faxId: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "mark_outgoing_mail_original_received",
    { p_fax_id: faxId }
  );

  if (error) throw error;
}

/* =========================================================
   الصادر — تسجيل تسليم الأرشيف للنسخة الأصلية (قبل ما يقدر
   المختص يأكد استلامه — تسلسل حيازة حقيقي)
========================================================= */

export async function markOutgoingMailHandedOver(
  faxId: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "mark_outgoing_mail_handed_over",
    { p_fax_id: faxId }
  );

  if (error) throw error;
}

/* =========================================================
   الصادر — اعتماد رئيس الفرع النهائي (الخطوة الثالثة والأخيرة
   في تسلسل الحيازة، بعد استلام المكتب المختص)
========================================================= */

export async function markOutgoingMailBranchHeadConfirmed(
  faxId: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "mark_outgoing_mail_branch_head_confirmed",
    { p_fax_id: faxId }
  );

  if (error) throw error;
}
export interface OfficeMailAlert {
  office_id: string;
  office_name: string;
  incoming_count: number;
  outgoing_count: number;
}

export async function fetchTodayMailAlerts(): Promise<OfficeMailAlert[]> {
  const { data, error } = await supabase.rpc("get_today_mail_alerts");

  if (error) throw error;

  return (data ?? []) as OfficeMailAlert[];
}
export type PendingMailTaskType =
  | "incoming_not_opened"
  | "incoming_action_needed"
  | "incoming_branch_decision"
  | "outgoing_receipt_needed"
  | "outgoing_recipients_needed"
  | "outgoing_handover_needed";

export interface PendingMailTask {
  task_type: PendingMailTaskType;
  fax_id: string;
  fax_number: number;
  fax_year: number;
  reference_date: string;
}

export async function fetchPendingMailTasks(): Promise<PendingMailTask[]> {
  const { data, error } = await supabase.rpc("get_pending_mail_tasks");

  if (error) throw error;

  return (data ?? []) as PendingMailTask[];
}
export interface PendingLetterTask {
  letter_id: string;
  letter_number: number;
  reference_date: string;
}

export async function fetchPendingLetterTasks(): Promise<PendingLetterTask[]> {
  const { data, error } = await supabase.rpc("get_pending_letter_tasks");

  if (error) throw error;

  return (data ?? []) as PendingLetterTask[];
}
export async function fetchTodayLettersCount(): Promise<number> {
  const { data, error } = await supabase.rpc("get_today_letters_count");

  if (error) throw error;

  return (data ?? 0) as number;
}
// ربط مكتب بدور (الدور ممكن يكون له أكثر من مكتب)
export async function addOfficeRoleLink(roleId: string, officeId: string) {
  const { error } = await supabase
    .from("office_roles")
    .insert({ role_id: roleId, office_id: officeId });

  if (error) throw error;
}

// فك ربط مكتب من دور
export async function removeOfficeRoleLink(roleId: string, officeId: string) {
  const { error } = await supabase
    .from("office_roles")
    .delete()
    .eq("role_id", roleId)
    .eq("office_id", officeId);

  if (error) throw error;
}