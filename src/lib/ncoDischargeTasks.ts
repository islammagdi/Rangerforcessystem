import { supabase } from "./supabase";

// ============================================================
// مهام إنهاء الخدمة المعلقة (قسم في الموقف العام)
// ============================================================
// المصدر: nco_discharge_cases بالحالات النشطة فقط
// (نفس ACTIVE_STATUSES في NcoDischargesPage)

export type ActiveDischargeStatus = "awaiting_notification" | "in_progress" | "submitted";

export interface DischargeTask {
  case_id: string;
  case_seq: number;
  case_year: number;
  status: ActiveDischargeStatus;
  created_at: string;
  reason_name: string;
  person_name: string;
  person_rank: string | null;
  military_number: string;
}

// ترتيب العرض + الحد اللي بعده الملف يعتبر متأخر (بالأيام من فتح الملف)
export const DISCHARGE_TASK_META: Record<
  ActiveDischargeStatus,
  { label: string; overdueAfterDays: number }
> = {
  awaiting_notification: { label: "ملفات بانتظار إخطار الوحدة", overdueAfterDays: 3 },
  in_progress: { label: "ملفات جاري استيفاء إجراءاتها", overdueAfterDays: 14 },
  submitted: { label: "ملفات مرفوعة بانتظار شهادة إنهاء الخدمة", overdueAfterDays: 30 },
};

export const DISCHARGE_LIST_ROUTE = "/dashboard/nco-discharges";
export const dischargeCaseRoute = (caseId: string) => `/dashboard/nco-discharges/${caseId}`;

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysOpen(task: DischargeTask) {
  return Math.floor((Date.now() - new Date(task.created_at).getTime()) / DAY_MS);
}

export function isDischargeTaskOverdue(task: DischargeTask) {
  return daysOpen(task) > DISCHARGE_TASK_META[task.status].overdueAfterDays;
}

const pickOne = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

export async function fetchDischargeTasks(): Promise<DischargeTask[]> {
  const { data, error } = await supabase
    .from("nco_discharge_cases")
    .select(
      `id, case_year, case_seq, status, created_at,
       reason:reason_id(name),
       personnel:personnel_id(full_name, military_number, rank:ranks(name))`
    )
    .in("status", Object.keys(DISCHARGE_TASK_META))
    .order("created_at", { ascending: true });

  if (error) throw error;

  const tasks: DischargeTask[] = (data ?? []).map((row: any) => {
    const person = pickOne<any>(row.personnel);
    return {
      case_id: row.id,
      case_seq: row.case_seq,
      case_year: row.case_year,
      status: row.status,
      created_at: row.created_at,
      reason_name: pickOne<any>(row.reason)?.name ?? "-",
      person_name: person?.full_name ?? "-",
      person_rank: pickOne<any>(person?.rank)?.name ?? null,
      military_number: person?.military_number ?? "",
    };
  });

  // المتأخر الأول، وجوه كل مجموعة الأقدم فالأحدث (الاستعلام مرتب بالفعل)
  return tasks.sort(
    (a, b) => Number(isDischargeTaskOverdue(b)) - Number(isDischargeTaskOverdue(a))
  );
}