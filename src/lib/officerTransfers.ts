import { supabase } from "./supabase";

export async function confirmOfficerTransfer(input: {
  personnel_id: string;
  decision_number: string;
  notes?: string | null;
}): Promise<void> {
  const { error } = await supabase.rpc("transfer_personnel_to_officers", {
    p_personnel_id: input.personnel_id,
    p_decision_number: input.decision_number,
    p_notes: input.notes ?? null,
  });

  if (error) throw error;
}