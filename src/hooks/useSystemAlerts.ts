import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface SystemAlert {
  type: "critical" | "warning";
  text: string;
  key: "overdue" | "incomplete" | "undocumented-letters";
  batchDate?: string | null;
}

export function useSystemAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);

      // ✅ دلوقتي بنجيب أقدم تاريخ تسريح متجاوز (مش بس العدد)
      // عشان نعرف أنهي دفعة نفتحها أوتوماتيك لما المستخدم يدوس
      const overdueResult = await supabase
        .from("personnel")
        .select("discharge_date", { count: "exact" })
        .lt("discharge_date", today)
        .eq("is_active", true)
        .order("discharge_date", { ascending: true })
        .limit(1);

      const incompleteResult = await supabase
        .from("personnel")
        .select("id", { count: "exact", head: true })
        .or(
          "primary_unit_id.is.null,military_number.is.null,rank_id.is.null"
        );
      const undocumentedLettersResult = await supabase
        .from("letters")
        .select("id", { count: "exact", head: true })
        .eq("status", "UNDOCUMENTED");
      const result: SystemAlert[] = [];

      if (overdueResult.count) {
        result.push({
          type: "critical",
          text: `يوجد ${overdueResult.count} أفراد تجاوزوا موعد التسريح`,
          key: "overdue",
          batchDate: overdueResult.data?.[0]?.discharge_date ?? null,
        });
      }

      if (incompleteResult.count) {
        result.push({
          type: "critical",
          text: `يوجد ${incompleteResult.count} أفراد بياناتهم غير مكتملة`,
          key: "incomplete",
        });
      }
      if (undocumentedLettersResult.count) {
        result.push({
          type: "critical",
          text: `  يوجد ${undocumentedLettersResult.count} خطاب غير موثّق — يجب رفع النسخة الموقّعة --- يرجي توثيقهم خلال 48 ساعه من تاريخ الانشاء منعاً للالغاء التلقائي`,
          key: "undocumented-letters",
        });
      }
      setAlerts(result);
      setLoading(false);
    }

    load();
  }, []);

  return { alerts, loading };
}