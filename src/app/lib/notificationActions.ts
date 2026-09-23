import type { NavigateFunction } from "react-router";
import { supabase } from "../../lib/supabase";
interface NotificationLike {
  entity_type: string | null;
  entity_id: string | null;
}

// بيرجع true لو فعلاً عمل انتقال لمكان تاني، وfalse لو مفيش أكشن مناسب
export async function handleNotificationAction(
  notification: NotificationLike,
  navigate: NavigateFunction
): Promise<boolean> {
  const { entity_type, entity_id } = notification;

  if (!entity_type || !entity_id) {
    return false;
  }

  if (entity_type === "personnel") {
    navigate(`/dashboard/individual-query/soldier/${entity_id}`);
    return true;
  }

  if (entity_type === "letter") {
    navigate(`/dashboard/letters-archive/${entity_id}`);
    return true;
  }

  if (entity_type === "reserve_batch") {
    // entity_id هنا هو id بتاع الدفعة، فمحتاجين نجيب تاريخها
    // عشان نفتح صفحة دفعات الرديف بنفس أسلوب "الأفراد المتجاوزين"
    const { data, error } = await supabase
      .from("reserve_batches")
      .select("batch_date")
      .eq("id", entity_id)
      .maybeSingle();

    if (error || !data) {

      navigate("/dashboard/reserve-batches");
      return true;
    }

    navigate("/dashboard/reserve-batches", {
      state: { batchDate: data.batch_date },
    });

    return true;
  }

  return false;
}