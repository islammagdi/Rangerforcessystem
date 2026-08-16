import { supabase } from "./supabase";

type NotificationType = "info" | "success" | "warning" | "critical";

interface CreateNotificationParams {
  title: string;
  body: string;
  type?: NotificationType;
  entityType?: string;
  entityId?: string;
  userName: string;
}

export async function createNotification({
  title,
  body,
  type = "info",
  entityType,
  entityId,
  userName,
}: CreateNotificationParams) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("notifications").insert({
    title,
    body,
    type,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    created_by: user?.id ?? null,
    created_by_name: userName,
  });

  if (error) {
    console.error("createNotification error:", error);
  }
}