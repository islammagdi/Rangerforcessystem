import { useEffect, useState } from "react";
import { fetchPendingMailTasks } from "../lib/mailArchive";

export function usePendingMailTasksCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchPendingMailTasks()
      .then((tasks) => {
        if (mounted) setCount(tasks.length);
      })
      .catch((err) => {
        console.error("خطأ في تحميل عدد المهام المعلقة:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { count, loading };
}