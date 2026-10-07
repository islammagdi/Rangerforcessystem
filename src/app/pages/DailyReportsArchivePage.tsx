import { useEffect, useState } from "react";
import { Search, Loader2, X, Eye, Printer, ChevronRight, ChevronLeft, FolderArchive, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { logActivity } from "../../lib/logActivity";
import { DAILY_ARCHIVE_BUCKET, openArchivedReport } from "../../lib/dailyReportArchive";

const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

const PAGE_SIZE = 25;

type ArchiveRow = {
  id: string;
  report_title: string;
  unit_name: string | null;
  category: string | null;
  exclude_batch: boolean;
  discharge_date: string | null;
  file_path: string;
  printed_at: string;
  printer_name: string | null;
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(date: string | null): string {
  if (!date) return "-";
  const [y, m, d] = date.split("-");
  return `${d}-${m}-${y}`;
}

// بنشيل الرموز اللي بتكسر فلتر or() بتاع PostgREST
function cleanSearch(value: string): string {
  return value.replace(/[,()%*\\]/g, " ").trim();
}

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export function DailyReportsArchivePage() {
  const [rows, setRows] = useState<ArchiveRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState<string | null>(null);

  // الحذف
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission("daily_reports_archive:delete");
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, fromDate, toDate]);

  useEffect(() => {
    setSelected([]);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, fromDate, toDate, page]);

  async function load() {
    setLoading(true);
    setError("");

    const q = cleanSearch(debouncedSearch);
    const from = page * PAGE_SIZE;

    let query = supabase
      .from("daily_report_archive")
      .select(
        `id, report_title, unit_name, category, exclude_batch, discharge_date, file_path, printed_at,
         printer:profiles!printed_by(username, full_name)`,
        { count: "exact" }
      );

    if (q) query = query.or(`report_title.ilike.%${q}%,unit_name.ilike.%${q}%`);
    if (fromDate) query = query.gte("printed_at", `${fromDate}T00:00:00`);
    if (toDate) query = query.lte("printed_at", `${toDate}T23:59:59.999`);

    const { data, error: loadError, count } = await query
      .order("printed_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (loadError) {
      setError("تعذر تحميل الأرشيف: " + loadError.message);
      setLoading(false);
      return;
    }

    setRows(
      (data ?? []).map((r: any) => {
        const printer = Array.isArray(r.printer) ? r.printer[0] : r.printer;
        return {
          id: r.id,
          report_title: r.report_title,
          unit_name: r.unit_name,
          category: r.category,
          exclude_batch: r.exclude_batch,
          discharge_date: r.discharge_date,
          file_path: r.file_path,
          printed_at: r.printed_at,
          printer_name: printer?.full_name ?? printer?.username ?? null,
        };
      })
    );
    setTotal(count ?? 0);
    setLoading(false);
  }

  async function open(row: ArchiveRow, print: boolean) {
    setOpening(row.id + (print ? "-p" : "-v"));
    setError("");

    try {
      await openArchivedReport(row.file_path, print);
    } catch (err: any) {
      setError(err?.message ?? "تعذر فتح اليومية");
    } finally {
      setOpening(null);
    }
  }

  async function deleteReports(target: ArchiveRow[]) {
    if (target.length === 0) return;

    const message =
      target.length === 1
        ? `حذف "${target[0].report_title}" المطبوعة ${formatDateTime(target[0].printed_at)} من الأرشيف نهائيًا؟`
        : `حذف ${target.length} يومية من الأرشيف نهائيًا؟`;

    if (!window.confirm(message)) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      // ١) حذف الصفوف (الدالة بترجع مسارات الملفات)
      const { data, error: rpcError } = await supabase.rpc("delete_daily_report_archives", {
        p_ids: target.map((r) => r.id),
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      // ٢) حذف الملفات نفسها من التخزين
      const paths = ((data ?? []) as any[]).map((x) => x.file_path).filter(Boolean);

      if (paths.length > 0) {
        await supabase.storage.from(DAILY_ARCHIVE_BUCKET).remove(paths);
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { data: profile } = user
          ? await supabase.from("profiles").select("username, full_name").eq("id", user.id).maybeSingle()
          : { data: null };

        await logActivity({
          userId: user?.id ?? null,
          userName: profile?.full_name ?? profile?.username ?? "غير معروف",
          actionType: "DELETE",
          action: "حذف يوميات من الأرشيف",
          entity: "أرشيف اليوميات",
          details: target
            .map((r) => `- ${r.report_title} (${r.unit_name || "-"}) - ${formatDateTime(r.printed_at)}`)
            .join("\n"),
        } as any);
      } catch {
        // التسجيل مش لازم يوقف العملية
      }

      setSuccess(target.length === 1 ? "تم حذف اليومية من الأرشيف." : `تم حذف ${target.length} يومية من الأرشيف.`);
      setSelected([]);

      // لو الصفحة الحالية فضيت نرجع للي قبلها
      if (target.length >= rows.length && page > 0) setPage((p) => p - 1);
      else await load();
    } finally {
      setDeleting(false);
    }
  }

  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  function toggleAll() {
    setSelected(allSelected ? [] : rows.map((r) => r.id));
  }

  function toggleOne(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtersActive = Boolean(debouncedSearch || fromDate || toDate);

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl" style={F}>
      {/* الفلاتر */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-4 flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم اليومية أو الوحدة"
            className="w-full h-[42px] rounded-lg border border-[#cbd5e1] pr-9 pl-3 outline-none focus:border-[#00B867]"
            style={{ fontSize: 14 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "#717d96", display: "block", marginBottom: 4 }}>من تاريخ</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]"
            style={{ fontSize: 14 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "#717d96", display: "block", marginBottom: 4 }}>إلى تاريخ</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]"
            style={{ fontSize: 14 }}
          />
        </div>

        {filtersActive && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFromDate("");
              setToDate("");
            }}
            className="h-[42px] px-4 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-gray-50"
            style={{ fontSize: 14 }}
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl px-5 py-3 bg-[#fef2f2] border border-[#fecaca] flex items-center justify-between">
          <span style={{ color: "#991b1b", fontSize: 14, fontWeight: 700 }}>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-[#991b1b]">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="rounded-xl px-5 py-3 bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-between">
          <span style={{ color: "#166534", fontSize: 14, fontWeight: 700 }}>{success}</span>
          <button type="button" onClick={() => setSuccess("")} className="text-[#166534]">
            <X size={16} />
          </button>
        </div>
      )}

      {canDelete && selected.length > 0 && (
        <div className="rounded-xl px-5 py-3 bg-white border border-[#fecaca] flex items-center justify-between gap-3 flex-wrap">
          <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
            تم اختيار {selected.length} يومية
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected([])}
              disabled={deleting}
              className="h-9 px-4 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-gray-50"
              style={{ fontSize: 13 }}
            >
              إلغاء الاختيار
            </button>
            <button
              type="button"
              onClick={() => void deleteReports(rows.filter((r) => selected.includes(r.id)))}
              disabled={deleting}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#991b1b] text-white hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              حذف المحدد
            </button>
          </div>
        </div>
      )}

      {/* القائمة */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-[#00B867]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-[#717d96]">
            <FolderArchive size={28} className="text-[#cbd5e1]" />
            <span style={{ fontSize: 14 }}>
              {filtersActive
                ? "مفيش يوميات مطابقة للبحث."
                : "لسه مفيش يوميات في الأرشيف. أي يومية بتتطبع بتتحفظ هنا تلقائيًا."}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                  {canDelete && (
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        title="اختيار الكل"
                        className="w-4 h-4 accent-[#00b867]"
                      />
                    </th>
                  )}
                  <th className="text-right px-4 py-3">اليومية</th>
                  <th className="text-right px-4 py-3">الوحدة</th>
                  <th className="text-right px-4 py-3">الفئة</th>
                  <th className="text-right px-4 py-3">استثناء دفعة رديف</th>
                  <th className="text-right px-4 py-3">طُبعت بواسطة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                                  <tr key={r.id} className="border-t border-[#eff0f6] hover:bg-[#fafbff] align-top">
                    {canDelete && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(r.id)}
                          onChange={() => toggleOne(r.id)}
                          className="w-4 h-4 accent-[#00b867]"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3" style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                      {r.report_title}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                      {r.unit_name || "-"}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                      {r.category || "-"}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                      {r.exclude_batch ? `يوجد - ${formatDay(r.discharge_date)}` : "لا يوجد"}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                      <div className="flex flex-col">
                        <span>{r.printer_name ?? "-"}</span>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatDateTime(r.printed_at)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => void open(r, false)}
                          disabled={opening !== null}
                          className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#DCF4DF] text-[#00522E] hover:opacity-80 disabled:opacity-50 whitespace-nowrap"
                          style={{ fontSize: 12, fontWeight: 700 }}
                        >
                          {opening === r.id + "-v" ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                          عرض
                        </button>
                        <button
                          type="button"
                          onClick={() => void open(r, true)}
                          disabled={opening !== null}
                          className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                          style={{ fontSize: 12, fontWeight: 700 }}
                        >
                          {opening === r.id + "-p" ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Printer size={13} />
                          )}
                          طباعة
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => void deleteReports([r])}
                            disabled={deleting}
                            title="حذف من الأرشيف"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#991b1b] hover:bg-[#fef2f2] disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-[#eff0f6] flex items-center justify-between gap-3">
            <span style={{ fontSize: 13, color: "#717d96" }}>
              صفحة {page + 1} من {pageCount} ({total} يومية)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 h-9 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50 disabled:opacity-40"
                style={{ fontSize: 13 }}
              >
                <ChevronRight size={14} />
                السابق
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                className="flex items-center gap-1 px-3 h-9 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50 disabled:opacity-40"
                style={{ fontSize: 13 }}
              >
                التالي
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}