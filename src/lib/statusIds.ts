import { supabase } from "./supabase";

const cache = new Map<string, string | null>();

/** بيرجّع id حالة الخدمة من الكود (DISCHARGED / ATTACHED / UNIT_FORCE ...) */
export async function getServiceStatusId(code: string): Promise<string | null> {
  if (cache.has(code)) return cache.get(code)!;

  const { data } = await supabase
    .from("service_statuses")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  const id = data?.id ?? null;
  cache.set(code, id);
  return id;
}

export const getDischargedStatusId = () => getServiceStatusId("DISCHARGED");