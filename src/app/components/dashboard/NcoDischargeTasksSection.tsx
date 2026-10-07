import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, ClipboardList, UserMinus } from "lucide-react";
import { StatCard } from "./StatCard";
import {
  DISCHARGE_LIST_ROUTE,
  DISCHARGE_TASK_META,
  daysOpen,
  dischargeCaseRoute,
  fetchDischargeTasks,
  isDischargeTaskOverdue,
  type ActiveDischargeStatus,
  type DischargeTask,
} from "../../../lib/ncoDischargeTasks";

const FONT: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };
const MAX_VISIBLE_BADGES = 10;
const fmt = (n: number) => n.toLocaleString("en-US");

interface Props {
  // كارت "انتهت خدمتهم اليوم" بيفتح مودال discharged الموجود في DashboardHome
  dischargedTodayCount?: number;
  onDischargedTodayClick?: () => void;
}

export function NcoDischargeTasksSection({ dischargedTodayCount, onDischargedTodayClick }: Props) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DischargeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchDischargeTasks();
        if (active) setTasks(data);
      } catch (error) {
        console.error("خطأ في تحميل مهام إنهاء الخدمة:", error);
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const byStatus = useMemo(() => {
    const map = new Map<ActiveDischargeStatus, DischargeTask[]>();
    tasks.forEach((t) => {
      const list = map.get(t.status) ?? [];
      list.push(t);
      map.set(t.status, list);
    });
    return map;
  }, [tasks]);

  const overdueCount = useMemo(() => tasks.filter(isDischargeTaskOverdue).length, [tasks]);

  return (
    <>
      <p
        className="text-right w-full"
        style={{
          ...FONT,
          color: "#2d3648",
          fontWeight: 700,
          fontSize: "clamp(18px, 3vw, 24px)",
          lineHeight: 1.5,
        }}
      >
        مهام إنهاء الخدمة
      </p>

      {loading ? (
        <div className="text-right text-gray-500 py-4" style={FONT}>
          جاري تحميل مهام إنهاء الخدمة...
        </div>
      ) : failed ? (
        <div className="text-right py-4" style={{ ...FONT, color: "#991b1b" }}>
          تعذر تحميل ملفات إنهاء الخدمة. حدّث الصفحة، ولو استمرت المشكلة راجع مسؤول النظام.
        </div>
      ) : (
        <>
          <div className="flex gap-3 sm:gap-4 flex-wrap">
            <StatCard
              icon={<ClipboardList size={20} />}
              value={fmt(tasks.length)}
              label="ملفات إنهاء خدمة مفتوحة"
              onClick={() => navigate(DISCHARGE_LIST_ROUTE)}
            />

            <StatCard
              icon={<AlertTriangle size={20} color={overdueCount > 0 ? "#e3282c" : "#717d96"} />}
              value={fmt(overdueCount)}
              label="ملفات متأخرة"
              valueColor={overdueCount > 0 ? "#e3282c" : undefined}
            />

            {dischargedTodayCount !== undefined && (
              <StatCard
                icon={<UserMinus size={20} />}
                value={fmt(dischargedTodayCount)}
                label="انتهت خدمتهم اليوم"
                onClick={onDischargedTodayClick}
                disabled={dischargedTodayCount === 0}
              />
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="text-right text-gray-400 py-2" style={FONT}>
              لا توجد ملفات إنهاء خدمة مفتوحة حاليًا
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full">
              {(Object.keys(DISCHARGE_TASK_META) as ActiveDischargeStatus[]).map((status) => {
                const list = byStatus.get(status);
                if (!list || list.length === 0) return null;

                const meta = DISCHARGE_TASK_META[status];
                const late = list.filter(isDischargeTaskOverdue).length;

                return (
                  <div key={status} className="bg-white rounded-2xl border border-[#eff0f6] p-4" dir="rtl">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <span style={{ ...FONT, fontWeight: 700, fontSize: 14, color: "#2d3648" }}>
                        {meta.label}
                      </span>

                      <div className="flex items-center gap-2">
                        {late > 0 && (
                          <span
                            className="px-2 py-0.5 rounded-full"
                            style={{ ...FONT, fontSize: 12, fontWeight: 700, background: "#fef2f2", color: "#991b1b" }}
                            title={`أكثر من ${meta.overdueAfterDays} يوم من فتح الملف`}
                          >
                            متأخر {fmt(late)}
                          </span>
                        )}
                        <span
                          className="px-2 py-0.5 rounded-full bg-[#f7f9fc]"
                          style={{ ...FONT, fontSize: 12, color: "#717d96" }}
                        >
                          {fmt(list.length)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {list.slice(0, MAX_VISIBLE_BADGES).map((task) => {
                        const overdue = isDischargeTaskOverdue(task);
                        return (
                          <button
                            key={task.case_id}
                            type="button"
                            onClick={() => navigate(dischargeCaseRoute(task.case_id))}
                            title={`ملف ${task.case_seq}/${task.case_year} - ${task.reason_name} - مفتوح منذ ${daysOpen(task)} يوم`}
                            className="px-3 py-1.5 rounded-full border transition-colors"
                            style={{
                              ...FONT,
                              fontSize: 13,
                              background: overdue ? "#fef2f2" : "#f7f9fc",
                              borderColor: overdue ? "#fecaca" : "#eff0f6",
                              color: overdue ? "#991b1b" : "#2d3648",
                            }}
                          >
                            {task.person_rank ? `${task.person_rank} / ` : ""}
                            {task.person_name}
                          </button>
                        );
                      })}

                      {list.length > MAX_VISIBLE_BADGES && (
                        <button
                          type="button"
                          onClick={() => navigate(DISCHARGE_LIST_ROUTE)}
                          className="px-3 py-1.5 rounded-full border transition-colors"
                          style={{
                            ...FONT,
                            fontSize: 13,
                            fontWeight: 700,
                            background: "#f0f2fd",
                            borderColor: "#dbe0fb",
                            color: "#1f3d97",
                          }}
                        >
                          و{fmt(list.length - MAX_VISIBLE_BADGES)} أخرى
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}