import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Download, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase, fetchAllRows } from "../../lib/supabase";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

interface Job {
  id: string;
  name: string;
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

// ─────────────────────────────────────────────────────────
// تطبيع الاسم لغرض المقارنة فقط (الاسم المخزّن فعليًا بيفضل
// زي ما المستخدم كتبه بالظبط — التطبيع ده بيُستخدم بس عشان
// نكتشف التكرار حتى لو الفرق بينهم حرف شكله شبه التاني)
// ─────────────────────────────────────────────────────────
function normalizeForComparison(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    // توحيد الألف بأشكالها المختلفة
    .replace(/[إأآا]/g, "ا")
    // توحيد الألف المقصورة مع الياء
    .replace(/ى/g, "ي")
    // توحيد التاء المربوطة مع الهاء
    .replace(/ة/g, "ه")
    // توحيد الهمزات على الواو والياء
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    // إزالة علامات التشكيل (الفتحة، الضمة، الكسرة، إلخ) لو موجودة
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .toLowerCase();
}

export function JobsManagementPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const { data, error: jobsError } = await supabase
        .from("jobs")
        .select("id, name")
        .order("name", { ascending: true });

      if (jobsError) throw jobsError;

      setJobs((data ?? []) as Job[]);

      // عدد الأفراد المرتبطين بكل وظيفة
      const rows = await fetchAllRows<any>((from, to) =>
        supabase
          .from("personnel")
          .select("job_id")
          .not("job_id", "is", null)
          .range(from, to)
      );

      const map: Record<string, number> = {};

      rows.forEach((row: { job_id: string }) => {
        map[row.job_id] = (map[row.job_id] ?? 0) + 1;
      });

      setCounts(map);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل الوظائف");
    } finally {
      setLoading(false);
    }
  }

  const visibleJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs
      .filter(
        (job) => !query || job.name.toLowerCase().includes(query)
      )
      .sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [jobs, search]);

  // ─────────────────────────────────────────────────────────
  // تنبيه استباقي (غير مانع): بيدوّر على وظائف مشابهة أثناء
  // الكتابة نفسها، بمطابقة جزئية في الاتجاهين (الوظيفة المكتوبة
  // جزء من اسم موجود، أو العكس) — بيستبعد التطابق التام لأن ده
  // بيتمنع أصلاً وقت الحفظ برسالة منفصلة
  // ─────────────────────────────────────────────────────────
  function findSimilarJobs(query: string, ignoreId?: string): Job[] {
    const trimmed = query.trim();

    // أقل من حرفين هيدّي نتايج كتير مالهاش معنى، فمنعرضش حاجة
    if (trimmed.length < 2) return [];

    const normalizedQuery = normalizeForComparison(trimmed);

    return jobs.filter((job) => {
      if (job.id === ignoreId) return false;

      const normalizedJobName = normalizeForComparison(job.name);

      // التطابق التام مش هنا؛ ده بيتمسك في findDuplicateJob وقت الحفظ
      if (normalizedJobName === normalizedQuery) return false;

      return (
        normalizedJobName.includes(normalizedQuery) ||
        normalizedQuery.includes(normalizedJobName)
      );
    });
  }

  const similarJobsForNew = useMemo(
    () => findSimilarJobs(newName),
    [newName, jobs]
  );

  const similarJobsForEdit = useMemo(
    () => (editingId ? findSimilarJobs(editingName, editingId) : []),
    [editingName, editingId, jobs]
  );

  // بيرجع الوظيفة المطابقة (لو موجودة) بدل true/false بس، عشان
  // نقدر نوضح للمستخدم اسم الوظيفة المتكررة بالظبط في الرسالة
  function findDuplicateJob(name: string, ignoreId?: string): Job | undefined {
    const target = normalizeForComparison(name);

    return jobs.find(
      (job) =>
        job.id !== ignoreId &&
        normalizeForComparison(job.name) === target
    );
  }

  async function handleAdd() {
    const name = normalizeName(newName);

    if (!name) {
      alert("برجاء كتابة اسم الوظيفة");
      return;
    }

    const duplicate = findDuplicateJob(name);

    if (duplicate) {
      alert(
        `هذه الوظيفة موجودة بالفعل باسم "${duplicate.name}"، برجاء اختيار اسم مختلف`
      );
      return;
    }

    try {
      setSaving(true);

      const { error: insertError } = await supabase
        .from("jobs")
        .insert({ name });

      if (insertError) throw insertError;

      setNewName("");
      await loadData();
    } catch (err: any) {
      alert(err?.message || "حدث خطأ أثناء إضافة الوظيفة");
    } finally {
      setSaving(false);
    }
  }

  function handleStartEdit(job: Job) {
    setEditingId(job.id);
    setEditingName(job.name);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function handleSaveEdit(job: Job) {
    const name = normalizeName(editingName);

    if (!name) {
      alert("برجاء كتابة اسم الوظيفة");
      return;
    }

    const duplicate = findDuplicateJob(name, job.id);

    if (duplicate) {
      alert(
        `هذه الوظيفة موجودة بالفعل باسم "${duplicate.name}"، برجاء اختيار اسم مختلف`
      );
      return;
    }

    if (name === job.name) {
      handleCancelEdit();
      return;
    }

    try {
      setSaving(true);

      const { error: updateError } = await supabase
        .from("jobs")
        .update({ name })
        .eq("id", job.id);

      if (updateError) throw updateError;

      handleCancelEdit();
      await loadData();
    } catch (err: any) {
      alert(err?.message || "حدث خطأ أثناء تعديل الوظيفة");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(job: Job) {
    const used = counts[job.id] ?? 0;

    if (used > 0) {
      alert(
        `لا يمكن حذف "${job.name}" لأنها مرتبطة بـ ${used} فرد. غيّر وظيفة هؤلاء الأفراد أولًا.`
      );
      return;
    }

    if (!window.confirm(`هل تريد حذف الوظيفة "${job.name}"؟`)) {
      return;
    }

    try {
      setSaving(true);

      const { error: deleteError } = await supabase
        .from("jobs")
        .delete()
        .eq("id", job.id);

      if (deleteError) throw deleteError;

      await loadData();
    } catch (err: any) {
      alert(err?.message || "حدث خطأ أثناء حذف الوظيفة");
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // تصدير جميع الوظائف إلى Excel
  //
  // بنصدّر كل الوظائف الموجودة في الجدول (مش المفلترة بالبحث)،
  // مرتبة أبجديًا، مع عدد الأفراد المرتبطين بكل وظيفة.
  // ==========================================================

  function handleExport() {
    if (jobs.length === 0) {
      alert("لا توجد وظائف للتصدير");
      return;
    }

    try {
      const sorted = [...jobs].sort((a, b) =>
        a.name.localeCompare(b.name, "ar")
      );

      const sheetRows = sorted.map((job, index) => ({
        "م": index + 1,
        "اسم الوظيفة": job.name,
        "عدد الأفراد": counts[job.id] ?? 0,
      }));

      // صف الإجمالي
      sheetRows.push({
        "م": "" as unknown as number,
        "اسم الوظيفة": "الإجمالي",
        "عدد الأفراد": sorted.reduce(
          (sum, job) => sum + (counts[job.id] ?? 0),
          0
        ),
      });

      const worksheet = XLSX.utils.json_to_sheet(sheetRows);

      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 35 },
        { wch: 14 },
      ];

      const workbook = XLSX.utils.book_new();

      // اتجاه الورقة من اليمين لليسار
      workbook.Workbook = { Views: [{ RTL: true }] };

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "الوظائف"
      );

      const today = new Date();

      const stamp = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-");

      XLSX.writeFile(workbook, `الوظائف-${stamp}.xlsx`);
    } catch (err: any) {
      alert(err?.message || "حدث خطأ أثناء تصدير الوظائف");
    }
  }
  if (loading) {
    return (
      <div
        className="flex items-center justify-center w-full min-h-[400px]"
        dir="rtl"
      >
        <span style={{ ...F, fontSize: 18, color: "#4a5468" }}>
          جاري تحميل الوظائف...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full min-h-[400px] gap-4"
        dir="rtl"
      >
        <span
          style={{
            ...F,
            fontSize: 17,
            color: "#e34040",
            textAlign: "center",
          }}
        >
          {error}
        </span>

        <button
          type="button"
          onClick={loadData}
          className="bg-[#DCF4DF] rounded-[8px] px-4 py-2"
          style={{ ...F, fontSize: 14, color: "#2d3648" }}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <h1
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(22px,4vw,32px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        إدارة الوظائف
      </h1>

      {/* إضافة وظيفة */}
      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full max-w-3xl mx-auto p-5 flex flex-col gap-3">
        <label
          style={{
            ...F,
            fontSize: 15,
            fontWeight: 700,
            color: "#2d3648",
          }}
        >
          إضافة وظيفة جديدة
        </label>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleAdd();
            }}
            placeholder="اسم الوظيفة"
            className="flex-1 h-[48px] px-3 rounded-[8px] border border-[#e2e7f0] outline-none focus:border-[#00b867]"
            style={{ ...F, fontSize: 15, color: "#2d3648" }}
          />

          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="h-[48px] px-5 rounded-[8px] flex items-center gap-2 disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(to bottom, #00b867, #00522e)",
            }}
          >
            <Plus size={18} color="#fff" />
            <span style={{ ...F, fontSize: 15, color: "#fff" }}>
              إضافة
            </span>
          </button>
        </div>

        {similarJobsForNew.length > 0 && (
          <div
            className="flex items-start gap-2.5 rounded-[10px] px-3.5 py-3"
            style={{ background: "#fff8e8", border: "1px solid #f4d58d" }}
          >
            <AlertTriangle size={16} className="text-[#8a6500] shrink-0 mt-0.5" />

            <p style={{ ...F, fontSize: 13, color: "#8a6500", lineHeight: 1.8 }}>
              فيه وظيفة مشابهة مسجّلة بالفعل:{" "}
              <strong>
                {similarJobsForNew.map((job) => job.name).join("، ")}
              </strong>
              . تأكد إنها مش نفس الوظيفة قبل ما تضيف.
            </p>
          </div>
        )}
      </div>

      {/* قائمة الوظائف */}
      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full max-w-3xl mx-auto overflow-hidden">
        <div className="p-4 border-b border-[#eff0f6] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span style={{ ...F, fontSize: 14, color: "#717d96" }}>
              عدد الوظائف: {jobs.length}
            </span>

            <button
              type="button"
              onClick={handleExport}
              disabled={jobs.length === 0}
              className="h-[40px] px-4 rounded-[8px] flex items-center gap-2 border border-[#00b867] bg-white disabled:opacity-50 transition-colors hover:bg-[#f0fbf3]"
              title="تصدير جميع الوظائف إلى Excel"
            >
              <Download size={16} color="#00b867" />
              <span
                style={{
                  ...F,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#00522e",
                }}
              >
                تصدير Excel
              </span>
            </button>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="w-[220px] h-[40px] px-3 rounded-[8px] border border-[#e2e7f0] outline-none focus:border-[#00b867]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              <tr>
                {["م", "اسم الوظيفة", "عدد الأفراد", "إجراءات"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-center border border-[#dde3ef] bg-[#f7f9fc]"
                      style={{ ...F, fontSize: 14, color: "#717d96" }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {visibleJobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-8 border border-[#dde3ef]"
                    style={{ ...F, fontSize: 14, color: "#2d3648" }}
                  >
                    لا توجد وظائف
                  </td>
                </tr>
              ) : (
                visibleJobs.map((job, index) => {
                  const isEditing = editingId === job.id;

                  return (
                    <tr key={job.id}>
                      <td
                        className="px-5 py-3 text-center border border-[#dde3ef]"
                        style={{ ...F, fontSize: 14, color: "#2d3648" }}
                      >
                        {index + 1}
                      </td>

                      <td className="px-5 py-3 text-center border border-[#dde3ef]">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5">
                            <input
                              autoFocus
                              type="text"
                              value={editingName}
                              onChange={(e) =>
                                setEditingName(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  void handleSaveEdit(job);
                                }
                                if (e.key === "Escape") {
                                  handleCancelEdit();
                                }
                              }}
                              className="w-full h-[38px] px-3 rounded-[8px] border border-[#e2e7f0] outline-none focus:border-[#00b867]"
                              style={{
                                ...F,
                                fontSize: 14,
                                color: "#2d3648",
                              }}
                            />

                            {similarJobsForEdit.length > 0 && (
                              <p
                                className="text-right"
                                style={{
                                  ...F,
                                  fontSize: 11,
                                  color: "#8a6500",
                                  lineHeight: 1.6,
                                }}
                              >
                                ⚠ مشابهة لـ:{" "}
                                {similarJobsForEdit
                                  .map((j) => j.name)
                                  .join("، ")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span
                            style={{
                              ...F,
                              fontSize: 14,
                              color: "#2d3648",
                            }}
                          >
                            {job.name}
                          </span>
                        )}
                      </td>

                      <td
                        className="px-5 py-3 text-center border border-[#dde3ef]"
                        style={{ ...F, fontSize: 14, color: "#2d3648" }}
                      >
                        {counts[job.id] ?? 0}
                      </td>

                      <td className="px-5 py-3 border border-[#dde3ef]">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(job)}
                                disabled={saving}
                                className="w-9 h-9 rounded-[8px] flex items-center justify-center bg-[#DCF4DF]"
                                title="حفظ"
                              >
                                <Check size={16} color="#00b867" />
                              </button>

                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="w-9 h-9 rounded-[8px] flex items-center justify-center bg-[#eef0fb]"
                                title="إلغاء"
                              >
                                <X size={16} color="#2d3648" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(job)}
                                className="w-9 h-9 rounded-[8px] flex items-center justify-center bg-[#eef0fb]"
                                title="تعديل"
                              >
                                <Pencil size={16} color="#2d3648" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(job)}
                                disabled={saving}
                                className="w-9 h-9 rounded-[8px] flex items-center justify-center bg-[#fde8ec]"
                                title="حذف"
                              >
                                <Trash2 size={16} color="#e34040" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}