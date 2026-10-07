import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Search, Loader2, X, Pencil, HeartHandshake, ChevronRight, ChevronLeft, CheckCircle2, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { toAr, toEnglishDigits } from "./NcoDischargesPage";

// =====================================================
// إعدادات
// =====================================================

const PAGE_SIZE = 25;

type IssueGroup = "military" | "conflict" | "social";

type IssueMeta = {
  label: string;
  group: IssueGroup;
  // الصفحة اللي بيتصلح منها
  fix: "edit" | "social";
};

// ⚠️ لو زودت فحص جديد في الدالة _personnel_data_issues ضيف كوده هنا
const ISSUES: Record<string, IssueMeta> = {
  MISSING_CATEGORY: { label: "من غير فئة", group: "military", fix: "edit" },
  MISSING_UNIT: { label: "من غير وحدة أساسية", group: "military", fix: "edit" },
  MISSING_STATUS: { label: "من غير موقف خدمي", group: "military", fix: "edit" },
  ATTACHED_NO_UNIT: { label: "ملحق من غير جهة إلحاق", group: "military", fix: "edit" },
  CONSCRIPT_NO_DISCHARGE_DATE: { label: "مجند من غير تاريخ تسريح", group: "military", fix: "edit" },
  MISSING_ADMINISTRATION: { label: "من غير إدارة", group: "military", fix: "edit" },
  MISSING_EDUCATION: { label: "من غير مستوى تعليمي", group: "military", fix: "edit" },

  INVALID_MILITARY_NUMBER: { label: "رقم عسكري مش ١٣ رقم", group: "conflict", fix: "edit" },
  EDUCATION_MISMATCH: { label: "المستوى التعليمي مخالف للرقم العسكري", group: "conflict", fix: "edit" },
  RANK_CATEGORY_MISMATCH: { label: "الدرجة مش مناسبة للفئة", group: "conflict", fix: "edit" },
  CONSCRIPT_DISCHARGE_PASSED: { label: "مجند عدّى تاريخ تسريحه", group: "conflict", fix: "edit" },

  MISSING_SOCIAL_RECORD: { label: "مالوش سجل اجتماعي", group: "social", fix: "social" },
  MISSING_PHOTO: { label: "من غير صورة", group: "social", fix: "social" },
  MISSING_NATIONAL_ID: { label: "من غير رقم قومي", group: "social", fix: "social" },
  INVALID_NATIONAL_ID: { label: "رقم قومي مش ١٤ رقم", group: "social", fix: "social" },
  MISSING_BIRTH_DATE: { label: "من غير تاريخ ميلاد", group: "social", fix: "social" },
  MISSING_PHONE: { label: "من غير رقم هاتف", group: "social", fix: "social" },
};

const GROUPS: { id: IssueGroup; label: string; bg: string; color: string }[] = [
  { id: "military", label: "بيانات عسكرية ناقصة", bg: "#fff8e8", color: "#8a6500" },
  { id: "conflict", label: "بيانات متعارضة", bg: "#fef2f2", color: "#991b1b" },
  { id: "social", label: "السجل الاجتماعي", bg: "#e8f0fe", color: "#172e78" },
];

const groupStyle = (code: string) => GROUPS.find((g) => g.id === ISSUES[code]?.group) ?? GROUPS[0];

// =====================================================
// Types
// =====================================================

type Option = { id: string; name: string };

type PersonRow = {
  personnel_id: string;
  full_name: string;
  military_number: string;
  rank_name: string | null;
  unit_name: string | null;
  category_name: string | null;
  issues: string[];
};

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

// =====================================================
// الصفحة
// =====================================================

export function DataQualityPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEditPerson = hasPermission("individual_query:edit");
  const canOpenSocial = hasPermission("social_record:view");

  const [units, setUnits] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [unitFilter, setUnitFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [issueFilter, setIssueFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [page, setPage] = useState(0);

  const [summary, setSummary] = useState<Record<string, number>>({});
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingRows, setLoadingRows] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const unitParam = unitFilter === "all" ? null : unitFilter;
  const categoryParam = categoryFilter === "all" ? null : categoryFilter;

  // ---------------------------------------------------
  // القوائم
  // ---------------------------------------------------

  useEffect(() => {
    void (async () => {
      const [unitsRes, categoriesRes] = await Promise.all([
        supabase.from("units").select("id, name, unit_type").eq("is_active", true).order("name"),
        supabase.from("personnel_categories").select("id, name").order("name"),
      ]);

      setUnits(
        ((unitsRes.data ?? []) as any[])
          .filter((u) => u.unit_type?.trim().toUpperCase() === "MAIN")
          .map((u) => ({ id: u.id, name: u.name }))
      );
      setCategories((categoriesRes.data ?? []) as Option[]);
    })();
  }, []);

  // ---------------------------------------------------
  // الملخص (بيتغير مع الوحدة والفئة بس)
  // ---------------------------------------------------

  useEffect(() => {
    void (async () => {
      setLoadingSummary(true);

      const { data, error: rpcError } = await supabase.rpc("get_data_issue_summary", {
        p_unit_id: unitParam,
        p_category_id: categoryParam,
      });

      if (rpcError) {
        setError("تعذر تحميل الملخص: " + rpcError.message);
        setLoadingSummary(false);
        return;
      }

      const map: Record<string, number> = {};
      ((data ?? []) as any[]).forEach((r) => (map[r.issue_code] = Number(r.issue_count)));
      setSummary(map);
      setLoadingSummary(false);
    })();
  }, [unitParam, categoryParam, reloadKey]);

  // أي تغيير في الفلاتر يرجعنا لأول صفحة
  useEffect(() => {
    setPage(0);
  }, [unitParam, categoryParam, issueFilter, debouncedSearch]);

  // ---------------------------------------------------
  // الأفراد
  // ---------------------------------------------------

  useEffect(() => {
    void (async () => {
      setLoadingRows(true);
      setError("");

      const { data, error: rpcError } = await supabase.rpc("get_data_issue_personnel", {
        p_issue_code: issueFilter,
        p_unit_id: unitParam,
        p_category_id: categoryParam,
        p_search: toEnglishDigits(debouncedSearch).trim() || null,
        p_limit: PAGE_SIZE,
        p_offset: page * PAGE_SIZE,
      });

      if (rpcError) {
        setError("تعذر تحميل الأفراد: " + rpcError.message);
        setLoadingRows(false);
        return;
      }

      const list = (data ?? []) as any[];

      setRows(
        list.map((r) => ({
          personnel_id: r.personnel_id,
          full_name: r.full_name,
          military_number: r.military_number,
          rank_name: r.rank_name,
          unit_name: r.unit_name,
          category_name: r.category_name,
          issues: r.issues ?? [],
        }))
      );
      setTotal(list.length > 0 ? Number(list[0].total_count) : 0);
      setLoadingRows(false);
    })();
  }, [issueFilter, unitParam, categoryParam, debouncedSearch, page, reloadKey]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const affected = summary.__ALL__ ?? 0;

  // ---------------------------------------------------
  // Render
  // ---------------------------------------------------

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl" style={{ fontFamily: "'Almarai', sans-serif" }}>
      {/* الفلاتر */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
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

        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="h-[42px] min-w-[170px] rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none focus:border-[#00B867]"
          style={{ fontSize: 14 }}
        >
          <option value="all">كل الوحدات</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-[42px] min-w-[150px] rounded-lg border border-[#cbd5e1] bg-white px-3 outline-none focus:border-[#00B867]"
          style={{ fontSize: 14 }}
        >
          <option value="all">كل الفئات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          title="إعادة الفحص"
          className="flex items-center gap-1.5 px-4 h-[42px] rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50"
          style={{ fontSize: 14, fontWeight: 700 }}
        >
          <RefreshCw size={15} />
          إعادة الفحص
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-5 py-3 bg-[#fef2f2] border border-[#fecaca] flex items-center justify-between">
          <span style={{ color: "#991b1b", fontSize: 14, fontWeight: 700 }}>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-[#991b1b]">
            <X size={16} />
          </button>
        </div>
      )}

      {/* الملخص */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-4">
        {loadingSummary ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={22} className="animate-spin text-[#00B867]" />
          </div>
        ) : affected === 0 ? (
          <div className="flex items-center gap-3 py-2">
            <CheckCircle2 size={22} className="text-[#00B867]" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#00522E" }}>
              كل الأفراد في القوة بياناتهم مكتملة.
            </span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIssueFilter(null)}
              className={[
                "flex items-center gap-2 w-fit px-4 h-10 rounded-xl transition-colors",
                issueFilter === null ? "bg-[#DCF4DF] text-[#00522E]" : "text-[#717d96] hover:bg-[#f5f6fb]",
              ].join(" ")}
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              كل الأفراد اللي عندهم نقص
              <span className="px-2 py-0.5 rounded-full bg-white" style={{ fontSize: 12, color: "#717d96" }}>
                {toAr(affected)}
              </span>
            </button>

            {GROUPS.map((g) => {
              const codes = Object.keys(ISSUES).filter(
                (code) => ISSUES[code].group === g.id && (summary[code] ?? 0) > 0
              );

              if (codes.length === 0) return null;

              return (
                <div key={g.id} className="flex flex-col gap-2">
                  <p style={{ fontSize: 13, fontWeight: 700, color: g.color }}>{g.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {codes.map((code) => {
                      const active = issueFilter === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setIssueFilter(active ? null : code)}
                          className="flex items-center gap-2 px-3 h-9 rounded-lg border transition-colors"
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            background: active ? g.color : g.bg,
                            color: active ? "#fff" : g.color,
                            borderColor: active ? g.color : "transparent",
                          }}
                        >
                          {ISSUES[code].label}
                          <span
                            className="px-1.5 rounded-full"
                            style={{
                              fontSize: 12,
                              background: active ? "rgba(255,255,255,.2)" : "#fff",
                              color: active ? "#fff" : g.color,
                            }}
                          >
                            {toAr(summary[code])}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* الأفراد */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
        {loadingRows ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin text-[#00B867]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-[#717d96]">
            <CheckCircle2 size={28} className="text-[#cbd5e1]" />
            <span style={{ fontSize: 14 }}>
              {debouncedSearch ? "مفيش أفراد مطابقين للبحث." : "مفيش أفراد بالنقص ده."}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                  <th className="text-right px-4 py-3">الفرد</th>
                  <th className="text-right px-4 py-3">الوحدة</th>
                  <th className="text-right px-4 py-3">البيانات الناقصة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const needsEdit = r.issues.some((c) => ISSUES[c]?.fix === "edit");
                  const needsSocial = r.issues.some((c) => ISSUES[c]?.fix === "social");

                  return (
                    <tr key={r.personnel_id} className="border-t border-[#eff0f6] align-top">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                            {r.rank_name ? `${r.rank_name} / ` : ""}
                            {r.full_name}
                          </span>
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>
                            {r.military_number}
                            {r.category_name ? ` • ${r.category_name}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 13, color: "#334155" }}>
                        {r.unit_name ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {r.issues.map((code) => {
                            const g = groupStyle(code);
                            return (
                              <span
                                key={code}
                                className="px-2 py-0.5 rounded-full"
                                style={{ fontSize: 11, fontWeight: 700, background: g.bg, color: g.color }}
                              >
                                {ISSUES[code]?.label ?? code}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {needsEdit && canEditPerson && (
                            <button
                              type="button"
                              onClick={() => navigate(`/dashboard/individual-query/soldier/${r.personnel_id}/edit`)}
                              className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50 whitespace-nowrap"
                              style={{ fontSize: 12, fontWeight: 700 }}
                            >
                              <Pencil size={13} />
                              تعديل البيانات
                            </button>
                          )}
                          {needsSocial && canOpenSocial && (
                            <button
                              type="button"
                              onClick={() => navigate(`/dashboard/social-record/personnel/${r.personnel_id}`)}
                              className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#DCF4DF] text-[#00522E] hover:opacity-80 whitespace-nowrap"
                              style={{ fontSize: 12, fontWeight: 700 }}
                            >
                              <HeartHandshake size={13} />
                              السجل الاجتماعي
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loadingRows && total > PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-[#eff0f6] flex items-center justify-between gap-3">
            <span style={{ fontSize: 13, color: "#717d96" }}>
              صفحة {toAr(page + 1)} من {toAr(pageCount)} ({toAr(total)} فرد)
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