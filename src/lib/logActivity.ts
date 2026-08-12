import { supabase } from "./supabase";

interface LogActivityParams {
  userId?: string | null;
  userName: string;
  actionType: string;
  action: string;
  entity?: string;
  details?: string;
}

export async function logActivity({
  userId = null,
  userName,
  actionType,
  action,
  entity = "",
  details = "",
}: LogActivityParams) {
  const { error } = await supabase
    .from("audit_logs")
    .insert({
      user_id: userId,
      user_name: userName,
      action_type: actionType,
      action,
      entity,
      details,
    });

  if (error) {
    console.error("Audit log error:", error);
  }
}