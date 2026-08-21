import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Plus,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Users,
  Clock,
  History,
  Layers,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { createNotification } from "../../lib/createNotification";
const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

/* =========================================================
   Types
========================================================= */

type ReserveBatch = {
  id: string;
  batch_date: string; // "YYYY-MM-DD"
  name: string | null;
  is_active: boolean;
  created_at: string;
};

/* =========================================================
   Helpers
========================================================= */

function formatBatchDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function getBatchLabel(batch: ReserveBatch): string {
  return batch.name || formatBatchDate(batch.batch_date);
}

// منتصف اليوم الحالي — نقارن بيه التواريخ بدون التأثر بالوقت
function getTodayMidnight(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function parseBatchDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const ALLOWED_MONTHS = [
  { value: 2, label: "فبراير-2" },
  { value: 3, label: "مارس-3" },
  { value: 5, label: "مايو-5" },
  { value: 6, label: "يونيو-6" },
  { value: 8, label: "أغسطس-8" },
  { value: 9, label: "سبتمبر-9" },
  { value: 11, label: "نوفمبر-11" },
  { value: 12, label: "ديسمبر-12" },
];

/* =========================================================
   Stat Card
========================================================= */

function StatCard({
  icon,
  label,
  value,
  accent = "#00b867",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      className="bg-white flex-1 min-w-[200px] rounded-[20px] border border-[#eff0f6] px-5 py-4 flex items-center gap-3"
      dir="rtl"
    >
      <div className="flex flex-col gap-1 items-start flex-1">
        <p
          style={{
            ...F,
            fontSize: 24,
            color: "#2d3648",
            fontWeight: 700,
          }}
        >
          {value}
        </p>

        <p style={{ ...F, fontSize: 13, color: "#717d96" }}>{label}</p>
      </div>

      <div
        className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
        style={{ background: `${accent}1a` }}
      >
        {icon}
      </div>
    </div>
  );
}

/* =========================================================
   Add Batch Modal
   ✅ التاريخ مقيّد بأول يوم في الشهر فقط — بنستخدم Dropdown
   للسنة والشهر بدل input[type=date] العادي، فمفيش احتمال
   يختار المستخدم يوم غير اليوم الأول إطلاقًا.
========================================================= */

function AddBatchModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const currentYear = new Date().getFullYear();

  const yearOptions = Array.from(
    { length: 7 },
    (_, i) => currentYear  + i
  );

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(ALLOWED_MONTHS[0].value);
  const [name, setName] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const batchDate = `${year}-${String(month).padStart(2, "0")}-01`;

      const { data: insertedBatch, error: insertError } = await supabase
        .from("reserve_batches")
        .insert({
          batch_date: batchDate,
          name: name.trim() || null,
          is_active: true,
        })
        .select("id")
        .single();

      if (insertError) {
        // خطأ التكرار الشائع لو فيه unique constraint على batch_date
        if (insertError.code === "23505") {
          throw new Error("توجد دفعة بنفس هذا التاريخ بالفعل.");
        }

        throw new Error(insertError.message);
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const monthLabel =
        ALLOWED_MONTHS.find((m) => m.value === month)?.label ?? "";

      await createNotification({
        title: "تم إنشاء دفعة رديف جديدة",
        body: `تم إنشاء دفعة ${name.trim() || `${monthLabel} ${year}`}`,
        type: "success",
        entityType: "reserve_batch",
        entityId: insertedBatch?.id,
        userName: user?.email ?? "مستخدم",
      });
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Add reserve batch error:", err);
      setError(err?.message || "حدث خطأ أثناء إضافة الدفعة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        dir="rtl"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e7f0]">
          <span
            style={{ ...F, fontWeight: 700, fontSize: 18, color: "#2d3648" }}
          >
            إضافة دفعة رديف جديدة
          </span>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              style={{ ...F, fontSize: 13, color: "#b91c1c" }}
            >
              {error}
            </div>
          )}

          <p
            style={{
              ...F,
              fontSize: 13,
              color: "#717d96",
              lineHeight: 1.7,
            }}
          >
            دفعات الرديف تُحدَّد دائمًا في أول يوم من الشهر. اختر السنة
            والشهر فقط.
          </p>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                السنة
              </label>

              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                dir="rtl"
                className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
                style={{ ...F, fontSize: 15, color: "#2d3648" }}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                الشهر
              </label>

              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                dir="rtl"
                className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
                style={{ ...F, fontSize: 15, color: "#2d3648" }}
              >
                {ALLOWED_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              اسم الدفعة (اختياري)
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              dir="rtl"
              placeholder={`دفعة ${
                ALLOWED_MONTHS.find((m) => m.value === month)?.label
              } ${year}`}
              className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 15, color: "#2d3648" }}
            />
          </div>

          <div
            className="flex items-center gap-2 rounded-[8px] px-3 py-2.5"
            style={{ background: "#f0f2fd" }}
          >
            <Calendar size={16} className="text-[#1f3d97] shrink-0" />
            <span style={{ ...F, fontSize: 13, color: "#1f3d97" }}>
              تاريخ الدفعة: 1/{String(month).padStart(2, "0")}/{year}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#e2e7f0] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 h-11 rounded-xl border border-[#cbd5e1] text-[#475569] hover:bg-gray-50 disabled:opacity-50"
            style={{ ...F, fontSize: 14 }}
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 h-11 rounded-xl text-white flex items-center gap-2 disabled:opacity-50"
            style={{
              background: "linear-gradient(to bottom,#00b867,#00522e)",
              ...F,
              fontSize: 14,
            }}
          >
            {saving && <RefreshCw size={16} className="animate-spin" />}
            {saving ? "جاري الحفظ..." : "حفظ الدفعة"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Page
========================================================= */

export function ReserveBatchesOverviewPage() {
  const [batches, setBatches] = useState<ReserveBatch[]>([]);
  const [soldierCounts, setSoldierCounts] = useState<Record<string, number>>(
    {}
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ✅ فلاتر جدول الدفعات
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [countSort, setCountSort] = useState<"none" | "desc" | "asc">(
    "none"
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      // ---------------------------------------------------
      // 1) الدفعات نفسها
      // ---------------------------------------------------

      const { data: batchesData, error: batchesError } = await supabase
        .from("reserve_batches")
        .select("id, batch_date, name, is_active, created_at")
        .order("batch_date", { ascending: true });

      if (batchesError) throw batchesError;

      const loadedBatches: ReserveBatch[] = batchesData ?? [];
      setBatches(loadedBatches);

      // ---------------------------------------------------
      // 2) فئة "مجند" — عدد الجنود بيتحسب من الأفراد اللي
      // discharge_date بتاعهم بيساوي تاريخ الدفعة، وفئتهم مجند،
      // وهم لسه بالخدمة (is_active = true)
      // ---------------------------------------------------

      const { data: conscriptCategory, error: categoryError } =
        await supabase
          .from("personnel_categories")
          .select("id")
          .eq("code", "CONSCRIPT")
          .maybeSingle();

      if (categoryError) throw categoryError;

      if (conscriptCategory && loadedBatches.length > 0) {
        const { data: personnelData, error: personnelError } =
          await supabase
            .from("personnel")
            .select("discharge_date")
            .eq("personnel_category_id", conscriptCategory.id)
            .eq("is_active", true)
            .not("discharge_date", "is", null);

        if (personnelError) throw personnelError;

        const counts: Record<string, number> = {};

        (personnelData ?? []).forEach((p: { discharge_date: string }) => {
          counts[p.discharge_date] = (counts[p.discharge_date] ?? 0) + 1;
        });

        setSoldierCounts(counts);
      } else {
        setSoldierCounts({});
      }
      console.table(batchesData);
    } catch (err: any) {
      console.error("Load reserve batches error:", err);
      setError(err?.message || "حدث خطأ أثناء تحميل بيانات دفعات الرديف");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // الإحصائيات المحسوبة
  // ---------------------------------------------------------

  const stats = useMemo(() => {
    const today = getTodayMidnight();

    const upcoming = batches.filter(
      (b) => parseBatchDate(b.batch_date) >= today
    );

    const past = batches.filter(
      (b) => parseBatchDate(b.batch_date) < today
    );

    // الدفعة القادمة = أقرب دفعة تاريخها >= اليوم (upcoming مرتبة تصاعديًا بالفعل)
    const nextBatch = upcoming.length > 0 ? upcoming[0] : null;

    return {
      total: batches.length,
      upcomingCount: upcoming.length,
      pastCount: past.length,
      nextBatch,
    };
  }, [batches]);

  // ---------------------------------------------------------
  // ✅ الدفعات بعد تطبيق الفلاتر الثلاثة (الدفعة المحددة، الحالة،
  // ترتيب عدد الجنود) — كل فلتر شغال بشكل مستقل ويقدر يتجمع مع
  // الباقي في نفس الوقت
  // ---------------------------------------------------------

  const filteredBatches = useMemo(() => {
    let list = batches;

    if (batchFilter !== "all") {
      list = list.filter((b) => b.id === batchFilter);
    }

    if (statusFilter !== "all") {
      list = list.filter((b) =>
        statusFilter === "active" ? b.is_active : !b.is_active
      );
    }

    if (countSort !== "none") {
      list = [...list].sort((a, b) => {
        const countA = soldierCounts[a.batch_date] ?? 0;
        const countB = soldierCounts[b.batch_date] ?? 0;

        return countSort === "desc"
          ? countB - countA
          : countA - countB;
      });
    }

    return list;
  }, [batches, soldierCounts, batchFilter, statusFilter, countSort]);

  // ---------------------------------------------------------
  // تفعيل / إلغاء تفعيل دفعة
  // ---------------------------------------------------------

  async function handleToggleActive(batch: ReserveBatch) {
    const action = batch.is_active ? "إلغاء تفعيل" : "إعادة تنشيط";

    const confirmed = window.confirm(
      `هل تريد ${action} دفعة "${getBatchLabel(batch)}"؟`
    );

    if (!confirmed) return;

    setTogglingId(batch.id);
    setError("");

    try {
      const { data, error } = await supabase
        .from("reserve_batches")
        .update({
          is_active: !batch.is_active,
        })
        .eq("id", batch.id)
        .select();

      console.log("========== UPDATE RESULT ==========");
      console.log("Before:", batch);
      console.log("Updated Data:", data);
      console.log("Error:", error);

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "لم يتم تحديث أي سجل. غالباً توجد RLS Policy أو Trigger يمنع التعديل."
        );
      }

      // تحديث الواجهة مباشرة
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batch.id
            ? {
                ...b,
                is_active: !b.is_active,
              }
            : b
        )
      );

      setSuccessMsg(
        `تم ${action} دفعة "${getBatchLabel(batch)}" بنجاح`
      );

      setTimeout(() => setSuccessMsg(""), 3000);

      // إعادة تحميل البيانات من قاعدة البيانات للتأكد
      await loadData();
    } catch (err: any) {
      console.error("Toggle batch active error:", err);
      setError(err?.message || "حدث خطأ أثناء تحديث حالة الدفعة");
    } finally {
      setTogglingId(null);
    }
  }

  const thClass =
    "px-5 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]";
  const tdClass = "px-5 py-3 text-right border-b border-[#e2e7f0]";

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between w-full flex-wrap gap-3">
        <h1
          style={{
            ...F,
            fontWeight: 700,
            fontSize: "clamp(22px,4vw,32px)",
            color: "#2d3648",
          }}
        >
          دفعات الرديف
        </h1>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 h-[46px] px-5 rounded-[8px]"
          style={{
            background: "linear-gradient(to bottom,#00b867,#00522e)",
          }}
        >
          <Plus size={18} color="#fff" />
          <span style={{ ...F, fontSize: 15, color: "#fff" }}>
            إضافة دفعة جديدة
          </span>
        </button>
      </div>

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            ...F,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{
            background: "#dcfce7",
            color: "#166534",
            ...F,
            fontSize: 14,
          }}
        >
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw
            size={28}
            className="mx-auto mb-2 text-[#00b867] animate-spin"
          />
          <p style={{ ...F, fontSize: 14, color: "#717d96" }}>
            جاري تحميل البيانات...
          </p>
        </div>
      ) : (
        <>
          {/* =============================================
              الإحصائيات
          ============================================= */}

          <div className="flex flex-wrap gap-4 w-full">
            <StatCard
              icon={<Layers size={20} color="#00b867" />}
              label="إجمالي عدد الدفعات"
              value={stats.total.toLocaleString("ar-EG")}
              accent="#00b867"
            />

            <StatCard
              icon={<Clock size={20} color="#1f3d97" />}
              label="عدد الدفعات القادمة"
              value={stats.upcomingCount.toLocaleString("ar-EG")}
              accent="#1f3d97"
            />

            <StatCard
              icon={<History size={20} color="#a1aebe" />}
              label="عدد الدفعات السابقة"
              value={stats.pastCount.toLocaleString("ar-EG")}
              accent="#717d96"
            />
          </div>

          {/* =============================================
              الدفعة القادمة (بارزة)
          ============================================= */}

          <div
            className="w-full rounded-[20px] p-6 flex items-center gap-4 flex-wrap"
            style={{
              background: "linear-gradient(to left, #00b867, #00522e)",
            }}
          >
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Calendar size={26} color="#fff" />
            </div>

            <div className="flex flex-col gap-1">
              <span style={{ ...F, fontSize: 14, color: "#dcfce7" }}>
                الدفعة القادمة
              </span>

              <span
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 22,
                  color: "#fff",
                }}
              >
                {stats.nextBatch
                  ? getBatchLabel(stats.nextBatch)
                  : "لا توجد دفعات قادمة"}
              </span>
            </div>
          </div>

          {/* =============================================
              جدول الدفعات
          ============================================= */}

          <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2e7f0] flex items-center gap-2">
              <Users size={18} className="text-[#4a5468]" />
              <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
                جميع دفعات الرديف
              </span>
            </div>

            {/* =============================================
                الفلاتر
            ============================================= */}

            {batches.length > 0 && (
              <div className="flex flex-wrap items-end gap-3 px-6 py-4 border-b border-[#e2e7f0]">
                {/* فلتر الدفعة */}

                <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                  <label
                    style={{ ...F, fontSize: 13, color: "#717d96" }}
                  >
                    الدفعة
                  </label>

                  <select
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    dir="rtl"
                    className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
                    style={{ ...F, fontSize: 14, color: "#2d3648" }}
                  >
                    <option value="all">كل الدفعات</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {getBatchLabel(b)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* فلتر الحالة */}

                <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                  <label
                    style={{ ...F, fontSize: 13, color: "#717d96" }}
                  >
                    الحالة
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as "all" | "active" | "inactive"
                      )
                    }
                    dir="rtl"
                    className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
                    style={{ ...F, fontSize: 14, color: "#2d3648" }}
                  >
                    <option value="all">الكل</option>
                    <option value="active">نشطة</option>
                    <option value="inactive">غير نشطة</option>
                  </select>
                </div>

                {/* فلتر عدد الجنود */}

                <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                  <label
                    style={{ ...F, fontSize: 13, color: "#717d96" }}
                  >
                    ترتيب حسب عدد الجنود
                  </label>

                  <select
                    value={countSort}
                    onChange={(e) =>
                      setCountSort(
                        e.target.value as "none" | "desc" | "asc"
                      )
                    }
                    dir="rtl"
                    className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
                    style={{ ...F, fontSize: 14, color: "#2d3648" }}
                  >
                    <option value="none">الكل (بدون ترتيب)</option>
                    <option value="desc">الأكثر عددًا أولاً</option>
                    <option value="asc">الأقل عددًا أولاً</option>
                  </select>
                </div>

                {/* عدد النتائج بعد الفلترة */}

                <div className="flex items-center h-[44px] px-1" dir="rtl">
                  <span
                    style={{ ...F, fontSize: 13, color: "#717d96" }}
                  >
                    عدد النتائج:{" "}
                    {filteredBatches.length.toLocaleString("ar-EG")}
                  </span>
                </div>
              </div>
            )}

            {batches.length === 0 ? (
              <div className="py-16 text-center">
                <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
                  لا توجد دفعات رديف مسجلة بعد
                </p>
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="py-16 text-center">
                <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
                  لا توجد دفعات مطابقة للفلاتر المحددة
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={thClass}>
                        <span
                          style={{ ...F, fontSize: 13, color: "#717d96" }}
                        >
                          م
                        </span>
                      </th>

                      <th className={thClass}>
                        <span
                          style={{ ...F, fontSize: 13, color: "#717d96" }}
                        >
                          الدفعة
                        </span>
                      </th>

                      <th className={thClass}>
                        <span
                          style={{ ...F, fontSize: 13, color: "#717d96" }}
                        >
                          عدد الجنود
                        </span>
                      </th>

                      <th className={thClass}>
                        <span
                          style={{ ...F, fontSize: 13, color: "#717d96" }}
                        >
                          الحالة
                        </span>
                      </th>

                      <th className={thClass}>
                        <span
                          style={{ ...F, fontSize: 13, color: "#717d96" }}
                        >
                          الإجراء
                        </span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBatches.map((batch, idx) => {
                      const isPast =
                        parseBatchDate(batch.batch_date) <
                        getTodayMidnight();

                      const isNext =
                        stats.nextBatch?.id === batch.id;
                      console.log(
                        batch.id,
                        batch.is_active,
                        typeof batch.is_active
                      );
                      return (
                        <tr
                          key={batch.id}
                          style={{
                            background: isNext
                              ? "#f0fdf4"
                              : "transparent",
                          }}
                        >
                          <td className={tdClass}>
                            <span
                              style={{
                                ...F,
                                fontSize: 14,
                                color: "#2d3648",
                              }}
                            >
                              {idx + 1}
                            </span>
                          </td>

                          <td className={tdClass}>
                            <div className="flex items-center gap-2">
                              <span
                                style={{
                                  ...F,
                                  fontSize: 14,
                                  color: "#2d3648",
                                  fontWeight: isNext ? 700 : 400,
                                }}
                              >
                                {getBatchLabel(batch)}
                              </span>

                              {isNext && (
                                <span
                                  className="px-2 py-0.5 rounded-full"
                                  style={{
                                    background: "#dcfce7",
                                    ...F,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#166534",
                                  }}
                                >
                                  القادمة
                                </span>
                              )}
                            </div>
                          </td>

                          <td className={tdClass}>
                            <span
                              style={{
                                ...F,
                                fontSize: 14,
                                color: "#2d3648",
                              }}
                            >
                              {(
                                soldierCounts[batch.batch_date] ?? 0
                              ).toLocaleString("ar-EG")}{" "}
                              جندي
                            </span>
                          </td>

                          <td className={tdClass}>
                            {batch.is_active ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
                                style={{
                                  background: "#dcfce7",
                                  ...F,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#166534",
                                }}
                              >
                                <CheckCircle2 size={12} />
                                نشطة
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
                                style={{
                                  background: "#fce9ea",
                                  ...F,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#9d2e15",
                                }}
                              >
                                <XCircle size={12} />
                                غير نشطة
                              </span>
                            )}
                          </td>

                          <td className={tdClass}>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(batch)}
                              disabled={togglingId === batch.id}
                              className="flex items-center gap-1.5 disabled:opacity-50"
                              style={{
                                ...F,
                                fontSize: 13,
                                color: batch.is_active
                                  ? "#9d2e15"
                                  : "#00522E",
                              }}
                            >
                              {togglingId === batch.id ? (
                                <RefreshCw
                                  size={13}
                                  className="animate-spin"
                                />
                              ) : batch.is_active ? (
                                <XCircle size={13} />
                              ) : (
                                <CheckCircle2 size={13} />
                              )}

                              {togglingId === batch.id
                                ? "جاري التحديث..."
                                : batch.is_active
                                ? "إلغاء تفعيل"
                                : "إعادة تنشيط"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {showAddModal && (
        <AddBatchModal
          onClose={() => setShowAddModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}