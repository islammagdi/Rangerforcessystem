import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Search, X, Loader2, User, FileText, Inbox, Send } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { usePermissions } from "../../../lib/usePermissions";
import { useUnsavedChanges } from "../../../lib/unsavedChanges";

// =====================================================
// Types & constants
// =====================================================

const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

const LIMIT = 6; // أقصى عدد نتايج لكل مجموعة
const MIN_LENGTH = 2;
const DEBOUNCE_MS = 300;

type GroupKey = "personnel" | "letters" | "incoming" | "outgoing";

type SearchItem = {
  key: string;
  title: string;
  subtitle: string;
  path: string;
};

type SearchGroup = {
  key: GroupKey;
  title: string;
  items: SearchItem[];
};

type Allowed = Record<GroupKey, boolean>;

const GROUP_META: Record<GroupKey, { title: string; icon: React.ReactNode }> = {
  personnel: { title: "الأفراد", icon: <User size={16} /> },
  letters: { title: "الخطابات", icon: <FileText size={16} /> },
  incoming: { title: "الفاكسات الواردة", icon: <Inbox size={16} /> },
  outgoing: { title: "الفاكسات الصادرة", icon: <Send size={16} /> },
};

// =====================================================
// Helpers
// =====================================================

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

// يشيل الرموز اللي بتكسر فلاتر البحث (والـ _ لأنها بتعمل wildcard في LIKE)
function cleanTerm(value: string): string {
  return normalizeDigits(value)
    .replace(/[,()*%\\"'_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// البحث يتجاهل اختلاف الهمزات والياء والتاء المربوطة، والمسافة تقبل أي كلمات في النص
function fuzzyPattern(term: string): string {
  const fuzzy = term
    .replace(/[أإآا]/g, "_")
    .replace(/[يى]/g, "_")
    .replace(/[ةه]/g, "_")
    .replace(/ /g, "*");

  return `*${fuzzy}*`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return d && m && y ? `${d}/${m}/${y}` : "";
}

function truncate(text: string | null | undefined, max: number): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// =====================================================
// الاستعلامات (كل مصدر لوحده، والـ RLS بيتطبق على المستخدم الحالي)
// =====================================================

async function searchPersonnel(pattern: string): Promise<SearchItem[]> {
  const { data, error } = await supabase
    .from("personnel")
    .select("id, full_name, military_number, is_active, ranks(name)")
    .is("deleted_at", null)
    .or(`full_name.ilike.${pattern},military_number.ilike.${pattern}`)
    .order("full_name", { ascending: true })
    .limit(LIMIT);

  if (error) throw error;

  return (data ?? []).map((p: any) => {
    const rank = Array.isArray(p.ranks) ? p.ranks[0]?.name : p.ranks?.name;

    return {
      key: `personnel-${p.id}`,
      title: [rank, p.full_name].filter(Boolean).join(" "),
      subtitle: [
        p.military_number ? `الرقم العسكري: ${p.military_number}` : "",
        p.is_active === false ? "غير فعّال" : "",
      ]
        .filter(Boolean)
        .join(" • "),
      path: `/dashboard/individual-query/soldier/${p.id}`,
    };
  });
}

async function searchLetters(term: string, pattern: string): Promise<SearchItem[]> {
  const filters = [`destination_name.ilike.${pattern}`];

  if (/^\d{1,15}$/.test(term)) {
    filters.push(`letter_number.eq.${term}`);
  }

  const { data, error } = await supabase
    .from("letters")
    .select("id, letter_number, letter_date, destination_name, status")
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  if (error) throw error;

  return (data ?? []).map((l: any) => ({
    key: `letter-${l.id}`,
    title: `خطاب رقم ${l.letter_number}`,
    subtitle: [
      l.destination_name ? `إلى: ${l.destination_name}` : "",
      formatDate(l.letter_date),
      l.status === "UNDOCUMENTED" ? "غير موثق" : "",
    ]
      .filter(Boolean)
      .join(" • "),
    path: `/dashboard/letters-archive/${l.id}`,
  }));
}

async function searchFaxes(
  kind: "incoming" | "outgoing",
  term: string,
  pattern: string
): Promise<SearchItem[]> {
  const table = kind === "incoming" ? "mail_incoming" : "mail_outgoing";

  const columns =
    kind === "incoming"
      ? "id, fax_number, fax_year, fax_date, source_entity, fax_summary"
      : "id, fax_number, fax_year, fax_date, fax_summary";

  const textFilters =
    kind === "incoming"
      ? [`source_entity.ilike.${pattern}`, `fax_summary.ilike.${pattern}`]
      : [`fax_summary.ilike.${pattern}`];

  const slash = term.match(/^(\d{1,9})\s*[\/\-]\s*(\d{4})$/);
  const isNumber = /^\d{1,9}$/.test(term) && Number(term) <= 2147483647;

  let query: any = supabase.from(table).select(columns);

  if (slash) {
    // صيغة رقم/سنة، مثال: 12/2026
    query = query.eq("fax_number", Number(slash[1])).eq("fax_year", Number(slash[2]));
  } else if (isNumber) {
    query = query.or([`fax_number.eq.${term}`, `fax_year.eq.${term}`, ...textFilters].join(","));
  } else {
    query = query.or(textFilters.join(","));
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  if (error) throw error;

  return ((data ?? []) as any[]).map((f) => ({
    key: `${kind}-${f.id}`,
    title: `${f.fax_number}/${f.fax_year}`,
    subtitle: [
      kind === "incoming" ? f.source_entity : "",
      truncate(f.fax_summary, 60),
      formatDate(f.fax_date),
    ]
      .filter(Boolean)
      .join(" • "),
    path: `/dashboard/archive/${kind}/${f.id}`,
  }));
}

async function runSearch(term: string, allowed: Allowed): Promise<SearchGroup[]> {
  const pattern = fuzzyPattern(term);

  const tasks: { key: GroupKey; run: () => Promise<SearchItem[]> }[] = [];

  if (allowed.personnel) tasks.push({ key: "personnel", run: () => searchPersonnel(pattern) });
  if (allowed.letters) tasks.push({ key: "letters", run: () => searchLetters(term, pattern) });
  if (allowed.incoming) tasks.push({ key: "incoming", run: () => searchFaxes("incoming", term, pattern) });
  if (allowed.outgoing) tasks.push({ key: "outgoing", run: () => searchFaxes("outgoing", term, pattern) });

  // لو مصدر فشل ما نوقفش باقي المصادر
  const settled = await Promise.allSettled(tasks.map((t) => t.run()));

  const groups: SearchGroup[] = [];
  let failures = 0;

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      if (result.value.length > 0) {
        groups.push({
          key: tasks[index].key,
          title: GROUP_META[tasks[index].key].title,
          items: result.value,
        });
      }
    } else {
      failures += 1;
      console.error(`خطأ في البحث (${tasks[index].key}):`, result.reason);
    }
  });

  if (tasks.length > 0 && failures === tasks.length) {
    throw new Error("تعذر تنفيذ البحث");
  }

  return groups;
}

// =====================================================
// المكوّن
// =====================================================

export function GlobalSearch() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { guardNavigation } = useUnsavedChanges();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

  const allowed: Allowed = {
    personnel: hasPermission("individual_query:view"),
    letters: hasPermission("letters_archive:view"),
    incoming: hasPermission("archive_incoming:view"),
    outgoing: hasPermission("archive_outgoing:view"),
  };

  const allowedKey = Object.values(allowed).join(",");
  const hasAny = Object.values(allowed).some(Boolean);
  const term = cleanTerm(query);

  // البحث بعد التوقف عن الكتابة، وأي نتيجة قديمة بتتجاهل
  useEffect(() => {
    if (term.length < MIN_LENGTH) {
      requestRef.current += 1;
      setGroups([]);
      setLoading(false);
      setError("");
      return;
    }

    const requestId = ++requestRef.current;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const result = await runSearch(term, allowed);

        if (requestId !== requestRef.current) return;

        setGroups(result);
        setError("");
        setActiveIndex(0);
      } catch (err) {
        if (requestId !== requestRef.current) return;

        console.error("خطأ في البحث الشامل:", err);
        setGroups([]);
        setError("تعذر تنفيذ البحث، حاول مرة أخرى.");
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, allowedKey]);

  // قفل القائمة عند الضغط خارجها (على الديسكتوب)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  if (!hasAny) return null;

  function closeAll() {
    setOpen(false);
    setMobileOpen(false);
  }

  function openItem(item: SearchItem) {
    closeAll();
    setQuery("");
    guardNavigation(() => navigate(item.path));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      closeAll();
      return;
    }

    if (flat.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      openItem(flat[activeIndex] ?? flat[0]);
    }
  }

  // نتايج البحث (بتتستخدم في القائمة المنسدلة وفي شاشة الموبايل)
  function renderResults() {
    if (term.length < MIN_LENGTH) {
      return (
        <p className="px-4 py-5 text-center" style={{ ...F, fontSize: 13, color: "#94a3b8" }}>
          اكتب حرفين على الأقل للبحث
        </p>
      );
    }

    if (loading && flat.length === 0) {
      return (
        <div className="flex items-center justify-center gap-2 px-4 py-6">
          <Loader2 size={16} className="animate-spin text-[#00B867]" />
          <span style={{ ...F, fontSize: 13, color: "#717d96" }}>جاري البحث...</span>
        </div>
      );
    }

    if (error) {
      return (
        <p className="px-4 py-5 text-center" style={{ ...F, fontSize: 13, color: "#991b1b" }}>
          {error}
        </p>
      );
    }

    if (flat.length === 0) {
      return (
        <p className="px-4 py-5 text-center" style={{ ...F, fontSize: 13, color: "#717d96" }}>
          لا توجد نتائج لـ «{term}»
        </p>
      );
    }

    let index = -1;

    return groups.map((group) => (
      <div key={group.key} className="pb-1">
        <p
          className="px-4 pt-3 pb-1"
          style={{ ...F, fontSize: 12, fontWeight: 700, color: "#64748b" }}
        >
          {group.title}
        </p>

        {group.items.map((item) => {
          index += 1;
          const itemIndex = index;
          const active = itemIndex === activeIndex;

          return (
            <button
              key={item.key}
              type="button"
              onMouseEnter={() => setActiveIndex(itemIndex)}
              onClick={() => openItem(item)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors"
              style={{ background: active ? "#f5f6fb" : undefined }}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#DCF4DF", color: "#00522E" }}
              >
                {GROUP_META[group.key].icon}
              </span>

              <span className="flex flex-col min-w-0 flex-1">
                <span
                  className="truncate"
                  style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}
                >
                  {item.title}
                </span>

                {item.subtitle && (
                  <span className="truncate" style={{ ...F, fontSize: 12, color: "#717d96" }}>
                    {item.subtitle}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    ));
  }

  return (
    <>
      {/* ديسكتوب: خانة بحث ثابتة في الهيدر */}
      <div ref={containerRef} className="relative hidden lg:block">
        <div className="relative">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"
          />

          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="ابحث عن فرد أو خطاب أو فاكس..."
            aria-label="بحث شامل"
            className="h-10 w-[240px] xl:w-[320px] rounded-full border border-[#e2e7f0] bg-[#f7f9fc] pr-9 pl-9 outline-none focus:border-[#00B867] focus:bg-white"
            style={{ ...F, fontSize: 13, color: "#2d3648" }}
          />

          {loading ? (
            <Loader2
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-[#94a3b8]"
            />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="مسح البحث"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#2d3648]"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>

        {open && query.trim().length > 0 && (
          <div
            dir="rtl"
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[420px] max-w-[90vw] max-h-[70vh] overflow-y-auto bg-white rounded-[12px] border border-[#eff0f6] shadow-lg"
          >
            {renderResults()}
          </div>
        )}
      </div>

      {/* موبايل وشاشات صغيرة: أيقونة تفتح شاشة بحث كاملة */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="بحث"
        className="flex lg:hidden items-center justify-center w-9 h-9 rounded-full hover:bg-[#f5f6fb] text-[#2d3648] shrink-0"
      >
        <Search size={20} />
      </button>

      {mobileOpen && (
        <div dir="rtl" className="fixed inset-0 z-[60] bg-white flex flex-col lg:hidden">
          <div className="flex items-center gap-2 px-3 py-3 border-b border-[#eff0f6]">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"
              />

              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ابحث عن فرد أو خطاب أو فاكس..."
                aria-label="بحث شامل"
                className="h-11 w-full rounded-full border border-[#e2e7f0] bg-[#f7f9fc] pr-9 pl-9 outline-none focus:border-[#00B867] focus:bg-white"
                style={{ ...F, fontSize: 14, color: "#2d3648" }}
              />

              {loading && (
                <Loader2
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-[#94a3b8]"
                />
              )}
            </div>

            <button
              type="button"
              onClick={closeAll}
              className="px-3 h-11"
              style={{ ...F, fontSize: 14, color: "#172e78" }}
            >
              إغلاق
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">{renderResults()}</div>
        </div>
      )}
    </>
  );
}