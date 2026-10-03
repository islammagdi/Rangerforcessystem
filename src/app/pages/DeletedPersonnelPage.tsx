import { useEffect, useMemo, useState } from "react";
import { ArchiveRestore, Loader2, Search, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";

const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

type DeletedRow = {
  id: string;
  military_number: string;
  full_name: string;
  rank_name: string | null;
  unit_name: string | null;
  category_name: string | null;
  deleted_at: string;
  deleted_by_name: string | null;
  delete_reason: string | null;
};

export function DeletedPersonnelPage() {
  const { hasPermission } = usePermissions();
  const canRestore = hasPermission("personnel:restore");

  const [rows, setRows] = useState<DeletedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("list_deleted_personnel");
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setRows((data ?? []) as DeletedRow[]);
  }

  async function restore(row: DeletedRow) {
    if (!window.confirm(`استرجاع ${row.full_name} (${row.military_number})؟ هيرجع للمنظومة زي ما كان.`)) return;

    setBusyId(row.id);
    setError("");

    const { error: rpcError } = await supabase.rpc("restore_personnel", { p_personnel_id: row.id });

    setBusyId(null);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setSuccess(`تم استرجاع ${row.full_name}.`);
    window.setTimeout(() => setSuccess(""), 4000);
  }

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return rows;
    return rows.filter((r) => r.military_number.includes(q) || r.full_name.includes(q));
  }, [rows, search]);

  return (
    <div className="flex flex-col gap-5 w-full" dir="rtl" style={F}>
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-1">
        <p style={{ fontSize: 18, fontWeight: 700, color: "#2d3648" }}>الأفراد المحذوفين</p>
        <p style={{ fontSize: 13, color: "#717d96" }}>
          الأفراد اللي اتحذفوا لأنهم اتسجلوا بالخطأ. بياناتهم محفوظة كاملة، والاسترجاع بيرجّعهم زي ما كانوا.
        </p>
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
        <div className="rounded-xl px-5 py-3 bg-[#f0fdf4] border border-[#bbf7d0]">
          <span style={{ color: "#166534", fontSize: 14, fontWeight: 700 }}>{success}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
        <div className="p-4 border-b border-[#eff0f6]">
          <div className="relative max-w-md">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الرقم العسكري"
              className="w-full h-[42px] rounded-lg border border-[#cbd5e1] pr-9 pl-3 outline-none focus:border-[#00B867]"
              style={{ fontSize: 14 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-[#00B867]" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center" style={{ fontSize: 14, color: "#94a3b8" }}>
            لا يوجد أفراد محذوفين.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                  <th className="text-right px-4 py-3">الرقم العسكري</th>
                  <th className="text-right px-4 py-3">الدرجة</th>
                  <th className="text-right px-4 py-3">الاسم</th>
                  <th className="text-right px-4 py-3">الفئة</th>
                  <th className="text-right px-4 py-3">الوحدة</th>
                  <th className="text-right px-4 py-3">سبب الحذف</th>
                  <th className="text-right px-4 py-3">حُذف بواسطة</th>
                  <th className="text-right px-4 py-3">تاريخ الحذف</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-[#eff0f6] hover:bg-[#fafbff]">
                    <td className="px-4 py-3" style={{ fontSize: 13 }}>{r.military_number}</td>
                    <td className="px-4 py-3" style={{ fontSize: 13 }}>{r.rank_name ?? "-"}</td>
                    <td className="px-4 py-3" style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{r.full_name}</td>
                    <td className="px-4 py-3" style={{ fontSize: 13 }}>{r.category_name ?? "-"}</td>
                    <td className="px-4 py-3" style={{ fontSize: 13 }}>{r.unit_name ?? "-"}</td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#717d96" }}>{r.delete_reason ?? "-"}</td>
                    <td className="px-4 py-3" style={{ fontSize: 13 }}>{r.deleted_by_name ?? "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ fontSize: 13 }}>
                      {new Date(r.deleted_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 text-left">
                      {canRestore && (
                        <button
                          type="button"
                          onClick={() => void restore(r)}
                          disabled={busyId === r.id}
                          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#DCF4DF] text-[#00522E] hover:opacity-80 disabled:opacity-50"
                          style={{ fontSize: 12, fontWeight: 700 }}
                        >
                          {busyId === r.id ? <Loader2 size={13} className="animate-spin" /> : <ArchiveRestore size={13} />}
                          استرجاع
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}