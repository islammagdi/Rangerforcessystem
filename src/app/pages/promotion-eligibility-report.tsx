import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Users, AlertTriangle, PlusCircle, CalendarClock, Undo2 } from "lucide-react";
import { confirmOfficerTransfer } from "../../lib/officerTransfers";
import {
  fetchEligiblePersonnelReport,
  fetchRanksOrdered,
  getNextRank,
  type EligiblePersonnelRow,
  type RankOrderInfo,
} from "../../lib/promotionEligibility";
import {
  fetchBulletinByPeriod,
  createBulletin,
  addBulletinItem,
  bulletinLabel,
} from "../../lib/promotionBulletins";
import { usePermissions } from "../../lib/usePermissions";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

const OVERRIDES_KEY = "promotion_bulletin_overrides_v1";

type BulletinOverride = { month: number; year: number; reason: string };

function loadOverrides(): Record<string, BulletinOverride> {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// النشرات نصف سنوية: يناير (1) ويوليو (7)
function periodIndex(month: number, year: number): number {
  return year * 2 + (month === 7 ? 1 : 0);
}

function periodFromIndex(idx: number): { month: number; year: number } {
  return { year: Math.floor(idx / 2), month: idx % 2 === 1 ? 7 : 1 };
}

// تاريخ الاستحقاق الجديد دايمًا أول يوم في شهر النشرة (1/1 أو 1/7)
function periodStartDate(month: number, year: number): Date {
  return new Date(year, month - 1, 1);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

export function PromotionEligibilityReportPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canView = hasPermission("promotion_notifications:view");
  const canEdit = hasPermission("promotion_bulletin:edit");

  const [rows, setRows] = useState<EligiblePersonnelRow[]>([]);
  const [ranks, setRanks] = useState<RankOrderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busyKey, setBusyKey] = useState<string | null>(null); // شغال دلوقتي: إما id فرد أو مفتاح مجموعة
const [transferTarget, setTransferTarget] = useState<EligiblePersonnelRow | null>(null);
const [transferDecisionNumber, setTransferDecisionNumber] = useState("");
const [transferNotes, setTransferNotes] = useState("");
const [confirmingTransfer, setConfirmingTransfer] = useState(false);
  // مودال طلب رقم القرار لما النشرة تكون مش موجودة أصلاً
  const [pendingAction, setPendingAction] = useState<{
    month: number;
    year: number;
    onConfirm: (bulletinId: string) => Promise<void>;
  } | null>(null);
  const [decisionNumberInput, setDecisionNumberInput] = useState("");
  const [creatingBulletin, setCreatingBulletin] = useState(false);

  // نقل فرد لنشرة سابقة/قادمة بسبب عذر
  const [overrides, setOverrides] = useState<Record<string, BulletinOverride>>(loadOverrides);
  const [moveTarget, setMoveTarget] = useState<EligiblePersonnelRow | null>(null);
  const [movePeriod, setMovePeriod] = useState("");
  const [moveReason, setMoveReason] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    } catch {
      /* تجاهل */
    }
  }, [overrides]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [data, ranksData] = await Promise.all([
        fetchEligiblePersonnelReport(),
        fetchRanksOrdered(),
      ]);
      setRows(data);
      setRanks(ranksData);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل التقرير");
    } finally {
      setLoading(false);
    }
  }

  const today = useMemo(() => new Date(), []);

  // الصفوف بعد تطبيق النقل اليدوي (تاريخ ونشرة جديدة)
  const effectiveRows = useMemo(
    () =>
      rows.map((r) => {
        const o = overrides[r.personnel_id];
        if (!o || r.eligibility.kind !== "promotion") return r;
        return {
          ...r,
          eligibility: {
            ...r.eligibility,
            bulletinMonth: o.month,
            bulletinYear: o.year,
            eligibleDate: periodStartDate(o.month, o.year),
          },
        } as EligiblePersonnelRow;
      }),
    [rows, overrides]
  );

  // النشرات المتاحة للنقل: ٤ سابقة و٤ قادمة حول النشرة الأصلية
  const moveOptions = useMemo(() => {
    if (!moveTarget) return [];
    const orig = rows.find((r) => r.personnel_id === moveTarget.personnel_id) ?? moveTarget;
    const base = periodIndex(orig.eligibility.bulletinMonth, orig.eligibility.bulletinYear);
    const cur = periodIndex(moveTarget.eligibility.bulletinMonth, moveTarget.eligibility.bulletinYear);
    const list: { value: string; month: number; year: number; isOriginal: boolean }[] = [];
    for (let o = -4; o <= 4; o++) {
      const idx = base + o;
      if (idx === cur) continue;
      const p = periodFromIndex(idx);
      list.push({ value: `${p.month}-${p.year}`, ...p, isOriginal: idx === base });
    }
    return list;
  }, [moveTarget, rows]);

  function openMove(row: EligiblePersonnelRow) {
    setMoveTarget(row);
    setMovePeriod("");
    setMoveReason("");
    setError("");
  }

  function handleConfirmMove() {
    if (!moveTarget) return;
    if (!movePeriod) {
      setError("اختر النشرة الجديدة");
      return;
    }
    if (!moveReason.trim()) {
      setError("سبب النقل (العذر) مطلوب");
      return;
    }
    const [month, year] = movePeriod.split("-").map(Number);
    setOverrides((prev) => ({
      ...prev,
      [moveTarget.personnel_id]: { month, year, reason: moveReason.trim() },
    }));
    setMoveTarget(null);
    setError("");
  }

  function handleResetMove(personnelId: string) {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[personnelId];
      return next;
    });
  }

  const promotionRows = useMemo(
    () =>
      effectiveRows
        .filter((r) => r.eligibility.kind === "promotion")
        .sort((a, b) => a.eligibility.eligibleDate.getTime() - b.eligibility.eligibleDate.getTime()),
    [effectiveRows]
  );

  const exitRows = useMemo(
    () =>
      rows
        .filter((r) => r.eligibility.kind === "exit_to_officers")
        .sort((a, b) => a.eligibility.eligibleDate.getTime() - b.eligibility.eligibleDate.getTime()),
    [rows]
  );

  const groupedPromotions = useMemo(() => {
    const groups = new Map<string, EligiblePersonnelRow[]>();

    promotionRows.forEach((row) => {
      const key = `${row.eligibility.bulletinMonth}-${row.eligibility.bulletinYear}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    });

    return Array.from(groups.entries())
      .map(([key, items]) => {
        const [month, year] = key.split("-").map(Number);
        return { month, year, label: `نشرة ${month === 7 ? "يوليو" : "يناير"} ${year}`, items };
      })
      .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
  }, [promotionRows]);

  /** يدوّر على النشرة أو يطلب إنشاءها (بمودال رقم القرار) قبل ما ينفذ الإجراء المطلوب */
  async function ensureBulletinThenRun(
    month: number,
    year: number,
    action: (bulletinId: string) => Promise<void>
  ) {
    setError("");

    const existing = await fetchBulletinByPeriod(month, year);

    if (existing && existing.status === "published") {
      setError(`${bulletinLabel(month, year)} منشورة بالفعل، لا يمكن إضافة أفراد جدد إليها`);
      return;
    }

    if (existing) {
      await action(existing.id);
      return;
    }

    // النشرة مش موجودة — نطلب رقم القرار قبل الإنشاء
    setDecisionNumberInput("");
    setPendingAction({ month, year, onConfirm: action });
  }

  async function handleConfirmCreateBulletin() {
    if (!pendingAction) return;

    if (!decisionNumberInput.trim()) {
      setError("رقم قرار النشرة مطلوب");
      return;
    }

    setCreatingBulletin(true);
    setError("");

    try {
      const newId = await createBulletin({
        bulletin_month: pendingAction.month,
        bulletin_year: pendingAction.year,
        decision_number: decisionNumberInput.trim(),
      });

      await pendingAction.onConfirm(newId);
      setPendingAction(null);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إنشاء النشرة");
    } finally {
      setCreatingBulletin(false);
    }
  }
async function handleConfirmTransfer() {
  if (!transferTarget) return;

  if (!transferDecisionNumber.trim()) {
    setError("رقم قرار الخروج مطلوب");
    return;
  }

  setConfirmingTransfer(true);
  setError("");

  try {
    await confirmOfficerTransfer({
      personnel_id: transferTarget.personnel_id,
      decision_number: transferDecisionNumber.trim(),
      notes: transferNotes.trim() || null,
    });

    setTransferTarget(null);
    setTransferDecisionNumber("");
    setTransferNotes("");
    await load(); // الفرد هيختفي تلقائيًا من التقرير بعد ما يبقى is_active = false
  } catch (err: any) {
    setError(err?.message || "حدث خطأ أثناء تنفيذ إجراء الخروج");
  } finally {
    setConfirmingTransfer(false);
  }
}
  async function addSingleToBulletin(row: EligiblePersonnelRow, bulletinId: string) {
    const nextRank = getNextRank(ranks, row.current_rank_sort_order);
    if (!nextRank) return;

    try {
      await addBulletinItem({
        bulletin_id: bulletinId,
        personnel_id: row.personnel_id,
        old_rank_id: row.current_rank_id,
        old_unit_id: row.unit_id,
        new_rank_id: nextRank.id,
        new_unit_id: null,
      });
    } catch (err: any) {
      // لو الفرد مضاف بالفعل في النشرة، نتجاهل الخطأ بهدوء ونكمل
      if (!String(err?.message ?? "").includes("duplicate")) throw err;
    }
  }

  async function handleAddOne(row: EligiblePersonnelRow) {
    setBusyKey(row.personnel_id);
    setError("");

    try {
      const { bulletinMonth, bulletinYear } = row.eligibility;
      await ensureBulletinThenRun(bulletinMonth, bulletinYear, async (bulletinId) => {
        await addSingleToBulletin(row, bulletinId);
        navigate(`/dashboard/promotion-notifications/${bulletinId}`);
      });
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء الإضافة للنشرة");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleAddGroup(month: number, year: number, items: EligiblePersonnelRow[]) {
    const key = `group-${month}-${year}`;
    setBusyKey(key);
    setError("");

    try {
      await ensureBulletinThenRun(month, year, async (bulletinId) => {
        for (const row of items) {
          await addSingleToBulletin(row, bulletinId);
        }
        navigate(`/dashboard/promotion-notifications/${bulletinId}`);
      });
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إضافة المجموعة للنشرة");
    } finally {
      setBusyKey(null);
    }
  }

  const inputClass =
    "h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white";

  if (!canView) {
    return (
      <div className="flex items-center justify-center w-full min-h-[400px]" dir="rtl">
        <span style={{ ...F, fontSize: 16, color: "#e34040" }}>ليس لديك صلاحية عرض هذا التقرير</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <h1 style={{ ...F, fontWeight: 700, fontSize: "clamp(20px,3.5vw,28px)", color: "#2d3648" }}>
        الأفراد المستحقين للترقية
      </h1>

      <div
        className="w-full rounded-[10px] px-5 py-4"
        style={{ background: "#eef2ff", border: "1px solid #c7d2fe", ...F, fontSize: 13, color: "#3730a3" }}
      >
        هذا التقرير يعرض تقديرًا آليًا. يُرجى مراجعة كل حالة قبل الإضافة للنشرة، خاصة الحالات ذات الظروف الاستثنائية.
      </div>

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", ...F, fontSize: 14 }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ ...F, fontSize: 14, color: "#717d96" }}>جاري تحميل التقرير...</p>
      ) : (
        <>
          {groupedPromotions.length === 0 ? (
            <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>لا يوجد أفراد مستحقين للترقية حاليًا</p>
          ) : (
            groupedPromotions.map((group) => {
              const groupKey = `group-${group.month}-${group.year}`;
              return (
                <section
                  key={groupKey}
                  className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-[#e2e7f0] flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Users size={18} color="#00522e" />
                      <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>
                        {group.label} ({group.items.length})
                      </span>
                    </div>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleAddGroup(group.month, group.year, group.items)}
                        disabled={busyKey === groupKey}
                        className="flex items-center gap-1.5 h-[36px] px-4 rounded-[8px] disabled:opacity-50"
                        style={{ background: "#DCF4DF", ...F, fontSize: 13, color: "#2d3648" }}
                      >
                        <PlusCircle size={14} />
                        {busyKey === groupKey ? "جاري الإضافة..." : "إضافة الكل لهذه النشرة"}
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                            <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الرقم العسكري</span>
                          </th>
                          <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                            <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الاسم</span>
                          </th>
                          <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                            <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الرتبة الحالية</span>
                          </th>
                          <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                            <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الوحدة</span>
                          </th>
                          <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                            <span style={{ ...F, fontSize: 12, color: "#717d96" }}>تاريخ الاستحقاق</span>
                          </th>
                          {canEdit && <th className="px-4 py-2.5 border-b border-[#e2e7f0] bg-[#f7f9fc]" />}
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((row) => {
                          const isOverdue = row.eligibility.eligibleDate < today;
                          return (
                            <tr key={row.personnel_id} className="hover:bg-[#fafbff]">
                              <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                                <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                                  {row.military_number ?? "-"}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                                <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                                  {row.full_name}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                                <span style={{ ...F, fontSize: 13, color: "#717d96" }}>{row.current_rank_name}</span>
                              </td>
                              <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                                <span style={{ ...F, fontSize: 13, color: "#717d96" }}>{row.unit_name ?? "-"}</span>
                              </td>
                              <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                                <div className="flex items-center gap-1.5">
                                  <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                                    {formatDate(row.eligibility.eligibleDate)}
                                  </span>
                                  {overrides[row.personnel_id] && (
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                                      title={`سبب النقل: ${overrides[row.personnel_id].reason}`}
                                      style={{ background: "#e0f2fe", ...F, fontSize: 11, fontWeight: 700, color: "#075985" }}
                                    >
                                      <CalendarClock size={11} />
                                      منقول
                                    </span>
                                  )}
                                  {isOverdue && (
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                                      style={{ background: "#fef3c7", ...F, fontSize: 11, fontWeight: 700, color: "#92400e" }}
                                    >
                                      <AlertTriangle size={11} />
                                      متأخر
                                    </span>
                                  )}
                                </div>
                              </td>
                              {canEdit && (
                                <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleAddOne(row)}
                                      disabled={busyKey === row.personnel_id}
                                      className="h-[32px] px-3 rounded-[8px] disabled:opacity-50"
                                      style={{ background: "#eef2ff", ...F, fontSize: 12, color: "#3730a3" }}
                                    >
                                      {busyKey === row.personnel_id ? "جاري..." : `إضافة لـ ${group.label}`}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openMove(row)}
                                      disabled={busyKey === row.personnel_id}
                                      className="h-[32px] px-3 rounded-[8px] disabled:opacity-50 flex items-center gap-1"
                                      style={{ background: "#fef3c7", ...F, fontSize: 12, color: "#92400e" }}
                                    >
                                      <CalendarClock size={13} />
                                      نقل لنشرة أخرى
                                    </button>

                                    {overrides[row.personnel_id] && (
                                      <button
                                        type="button"
                                        onClick={() => handleResetMove(row.personnel_id)}
                                        title="إرجاع للنشرة الأصلية"
                                        className="h-[32px] px-2 rounded-[8px] border border-[#e2e7f0] flex items-center"
                                        style={{ color: "#717d96" }}
                                      >
                                        <Undo2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })
          )}

   {exitRows.length > 0 && (
  <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
    <div className="px-6 py-4 border-b border-[#e2e7f0] flex items-center gap-2">
      <AlertTriangle size={18} color="#92400e" />
      <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>
        مستحقين الخروج لمنظومة شئون الضباط ({exitRows.length})
      </span>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
              <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الرقم العسكري</span>
            </th>
            <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
              <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الاسم</span>
            </th>
            <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
              <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الوحدة</span>
            </th>
            <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
              <span style={{ ...F, fontSize: 12, color: "#717d96" }}>تاريخ الاستحقاق</span>
            </th>
            {canEdit && <th className="px-4 py-2.5 border-b border-[#e2e7f0] bg-[#f7f9fc]" />}
          </tr>
        </thead>
        <tbody>
          {exitRows.map((row) => {
            const isReady = row.eligibility.eligibleDate <= today;
            return (
              <tr key={row.personnel_id} className="hover:bg-[#fafbff]">
                <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                  <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{row.military_number ?? "-"}</span>
                </td>
                <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                  <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{row.full_name}</span>
                </td>
                <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                  <span style={{ ...F, fontSize: 13, color: "#717d96" }}>{row.unit_name ?? "-"}</span>
                </td>
                <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                  <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                    {formatDate(row.eligibility.eligibleDate)}
                  </span>
                </td>
                {canEdit && (
                  <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                    <button
                      type="button"
                      onClick={() => {
                        setTransferTarget(row);
                        setTransferDecisionNumber("");
                        setTransferNotes("");
                      }}
                      disabled={!isReady}
                      title={isReady ? "" : `يتفعل هذا الإجراء بدءًا من ${formatDate(row.eligibility.eligibleDate)}`}
                      className="h-[32px] px-3 rounded-[8px] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: isReady ? "#fce8f1" : "#f7f9fc", ...F, fontSize: 12, color: isReady ? "#9d2e15" : "#a1aebe" }}
                    >
                      تأكيد الخروج
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
)}
        </>
      )}

      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          dir="rtl"
        >
          <div className="bg-white rounded-[16px] p-6 w-full max-w-[400px] flex flex-col gap-4">
            <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>
              إنشاء {bulletinLabel(pendingAction.month, pendingAction.year)}
            </span>
            <p style={{ ...F, fontSize: 13, color: "#717d96" }}>
              هذه النشرة غير موجودة بعد. أدخل رقم قرار النشرة لإنشائها والمتابعة.
            </p>

            <div className="flex flex-col gap-1.5">
              <label style={{ ...F, fontSize: 13, color: "#717d96" }}>رقم قرار النشرة</label>
              <input
                type="text"
                value={decisionNumberInput}
                onChange={(e) => setDecisionNumberInput(e.target.value)}
                dir="rtl"
                className={inputClass}
                style={F}
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmCreateBulletin}
                disabled={creatingBulletin}
                className="flex-1 h-[42px] rounded-[8px] disabled:opacity-50"
                style={{ background: "linear-gradient(to bottom,#00b867,#00522e)", ...F, fontSize: 14, color: "#fff" }}
              >
                {creatingBulletin ? "جاري الإنشاء..." : "إنشاء ومتابعة"}
              </button>

              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="flex-1 h-[42px] rounded-[8px] border border-[#e2e7f0]"
                style={{ ...F, fontSize: 14, color: "#717d96" }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      {moveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          dir="rtl"
        >
          <div className="bg-white rounded-[16px] p-6 w-full max-w-[420px] flex flex-col gap-4">
            <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>
              نقل {moveTarget.full_name} لنشرة أخرى
            </span>
            <p style={{ ...F, fontSize: 13, color: "#717d96" }}>
              النشرة الحالية: {bulletinLabel(moveTarget.eligibility.bulletinMonth, moveTarget.eligibility.bulletinYear)}.
              تاريخ الاستحقاق الجديد سيكون أول يوم في شهر النشرة المختارة.
            </p>

            {error && (
              <div style={{ ...F, fontSize: 13, color: "#991b1b" }}>{error}</div>
            )}

            <div className="flex flex-col gap-1.5">
              <label style={{ ...F, fontSize: 13, color: "#717d96" }}>النشرة الجديدة</label>
              <select
                value={movePeriod}
                onChange={(e) => setMovePeriod(e.target.value)}
                className={inputClass}
                style={F}
              >
                <option value="">اختر النشرة...</option>
                {moveOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {bulletinLabel(o.month, o.year)} — {formatDate(periodStartDate(o.month, o.year))}
                    {o.isOriginal ? " (الأصلية)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{ ...F, fontSize: 13, color: "#717d96" }}>سبب النقل (العذر)</label>
              <textarea
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
                rows={2}
                dir="rtl"
                className="rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867] bg-white"
                style={F}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmMove}
                className="flex-1 h-[42px] rounded-[8px]"
                style={{ background: "linear-gradient(to bottom,#00b867,#00522e)", ...F, fontSize: 14, color: "#fff" }}
              >
                تأكيد النقل
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoveTarget(null);
                  setError("");
                }}
                className="flex-1 h-[42px] rounded-[8px] border border-[#e2e7f0]"
                style={{ ...F, fontSize: 14, color: "#717d96" }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {transferTarget && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.4)" }}
    dir="rtl"
  >
    <div className="bg-white rounded-[16px] p-6 w-full max-w-[420px] flex flex-col gap-4">
      <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>
        تأكيد خروج {transferTarget.full_name} لمنظومة شئون الضباط
      </span>
      <p style={{ ...F, fontSize: 13, color: "#717d96" }}>
        سيتم ترقية الفرد لرتبة "ملازم شرف" وتسجيلها في سجله الاجتماعي، وتعطيل حالته في منظومة الأفراد. هذا الإجراء نهائي.
      </p>

      <div className="flex flex-col gap-1.5">
        <label style={{ ...F, fontSize: 13, color: "#717d96" }}>رقم قرار الخروج</label>
        <input
          type="text"
          value={transferDecisionNumber}
          onChange={(e) => setTransferDecisionNumber(e.target.value)}
          dir="rtl"
          className={inputClass}
          style={F}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label style={{ ...F, fontSize: 13, color: "#717d96" }}>ملاحظات (اختياري)</label>
        <textarea
          value={transferNotes}
          onChange={(e) => setTransferNotes(e.target.value)}
          rows={2}
          dir="rtl"
          className="rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867] bg-white"
          style={F}
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={handleConfirmTransfer}
          disabled={confirmingTransfer}
          className="flex-1 h-[42px] rounded-[8px] disabled:opacity-50"
          style={{ background: "linear-gradient(to bottom,#e3282c,#9d2e15)", ...F, fontSize: 14, color: "#fff" }}
        >
          {confirmingTransfer ? "جاري التنفيذ..." : "تأكيد الخروج"}
        </button>

        <button
          type="button"
          onClick={() => setTransferTarget(null)}
          className="flex-1 h-[42px] rounded-[8px] border border-[#e2e7f0]"
          style={{ ...F, fontSize: 14, color: "#717d96" }}
        >
          إلغاء
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}