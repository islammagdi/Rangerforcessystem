import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";


export interface DischargedPersonRow {
  id: string;
  full_name: string;
  military_number: string | null;
}

export interface LetterRow {
  id: string;
  letter_number: number;
  reason: string | null;
  letter_type_name: string | null;
}

export interface DashboardStats {
  dischargedToday: number;
  lettersToday: number;
  activitiesToday: number;
  dischargedList: DischargedPersonRow[];
  lettersList: LetterRow[];
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    dischargedToday: 0,
    lettersToday: 0,
    activitiesToday: 0,
    dischargedList: [],
    lettersList: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startIso = startOfDay.toISOString();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      

      const [dischargedResult, lettersResult, activitiesResult] =
        await Promise.all([
          // بدل count بس: بنجيب الصفوف نفسها (id + اسم + رقم عسكري)
          supabase
            .from("personnel")
            .select("id, full_name, military_number")
            .gte("discharged_at", startIso),

          // بدل count بس: بنجيب الخطابات نفسها مع نوع الخطاب
          supabase
            .from("letters")
            .select("id, letter_number, reason, letter_type:letter_types(name)")
            .gte("created_at", startIso)
            .order("letter_number", { ascending: false }),

          user
            ? supabase
                .from("audit_logs")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user.id)
                .gte("created_at", startIso)
            : Promise.resolve({ count: 0, error: null }),
        ]);

      const dischargedList: DischargedPersonRow[] =
        dischargedResult.data ?? [];

      const lettersList: LetterRow[] = (lettersResult.data ?? []).map(
        (row: any) => ({
          id: row.id,
          letter_number: row.letter_number,
          reason: row.reason,
          letter_type_name: Array.isArray(row.letter_type)
            ? row.letter_type[0]?.name ?? null
            : row.letter_type?.name ?? null,
        })
      );

      setStats({
        dischargedToday: dischargedList.length,
        lettersToday: lettersList.length,
        activitiesToday: activitiesResult.count ?? 0,
        dischargedList,
        lettersList,
      });

      setLoading(false);
    }

    load();
  }, []);

  return { stats, loading };
}