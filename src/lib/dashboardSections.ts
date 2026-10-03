import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

// لازم تطابق عمود key في جدول dashboard_sections
export type DashboardSectionKey =
  | "current_user"
  | "system_alerts"
  | "branch_duty"
  | "upcoming_visits"
  | "pending_tasks"
  | "mail_alerts"
  | "social_record_stats"
  | "recruit_arrivals"
  | "force_status"
  | "outside_analysis"
  | "reserve_batch";

export function useDashboardSections() {
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase.rpc("get_my_dashboard_sections");

      if (!mounted) return;

      if (error) {
        console.error("خطأ في تحميل أقسام الموقف العام:", error);
      }

      setKeys(new Set((data ?? []).map((row: any) => row.section_key as string)));
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const canSee = useCallback((key: DashboardSectionKey) => keys.has(key), [keys]);

  return { loading, canSee };
}