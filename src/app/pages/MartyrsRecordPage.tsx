import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Search, Plus, Printer } from "lucide-react";
import logoImg from "../../assets/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";
import { usePermissions } from "../../lib/usePermissions";
import { fetchAllRankOptions, fetchAllUnitOptions, type RankOption, type UnitOption } from "../../lib/socialRecords";
import {
  MARTYRDOM_TYPES,
  fetchMartyrs,
  createMartyr,
  type MartyrListRow,
} from "../../lib/martyrsRecords";
import { ar, buildPrintHtml, printHtml, val } from "../../lib/martyrsPrint";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

const emptyForm = {
  full_name: "",
  military_number: "",
  rank_id: "",
  unit_id: "",
  martyrdom_date: "",
  martyrdom_type: "",
  martyrdom_place: "",
};

export function MartyrsRecordPage() {
  const navigate = useNavigate();
  const { loading: checkingAccess, hasPermission } = usePermissions();
  const canEdit = hasPermission("martyrs_record:edit");

  const [rows, setRows] = useState<MartyrListRow[]>([]);
  const [ranks, setRanks] = useState<RankOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [martyrs, rankOptions, unitOptions] = await Promise.all([
        fetchMartyrs(),
        fetchAllRankOptions(),
        fetchAllUnitOptions(),
      ]);

      setRows(martyrs);
      setRanks(rankOptions);
      setUnits(unitOptions);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل سجل الشهداء");
    } finally {
      setLoading(false);
    }
  }

  const years = useMemo(
    () => Array.from(new Set(rows.map((r) => r.martyrdom_date.slice(0, 4)))).sort((a, b) => b.localeCompare(a)),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((r) => {
      if (q && !r.full_name.toLowerCase().includes(q) && !(r.military_number ?? "").toLowerCase().includes(q)) {
        return false;
      }
      if (yearFilter && r.martyrdom_date.slice(0, 4) !== yearFilter) return false;
      if (unitFilter && r.unit_id !== unitFilter) return false;
      if (typeFilter && r.martyrdom_type !== typeFilter) return false;
      return true;
    });
  }, [rows, search, yearFilter, unitFilter, typeFilter]);

  const typeCounts = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const key = r.martyrdom_type ?? "غير محدد";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [rows]);

  async function handleAdd() {
    if (!form.full_name.trim()) {
      setError("اسم الشهيد مطلوب");
      return;
    }

    if (!form.martyrdom_date) {
      setError("تاريخ الاستشهاد مطلوب");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const id = await createMartyr({
        full_name: form.full_name.trim(),
        military_number: form.military_number.trim() || null,
        rank_id: form.rank_id || null,
        unit_id: form.unit_id || null,
        martyrdom_date: form.martyrdom_date,
        martyrdom_type: form.martyrdom_type || null,
        martyrdom_place: form.martyrdom_place.trim() || null,
      });

      setForm(emptyForm);
      setShowAdd(false);
      navigate(`/dashboard/martyrs-record/${id}`);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إضافة الشهيد");
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    const rowsHtml = filtered.length
      ? filtered
          .map(
            (r, i) => `
        <tr>
          <td>${ar(i + 1)}</td>
          <td>${ar(r.military_number)}</td>
          <td>${val(r.full_name)}</td>
          <td>${val(r.rank_name)}</td>
          <td>${val(r.unit_name)}</td>
          <td>${ar(r.martyrdom_date)}</td>
          <td>${val(r.martyrdom_type)}</td>
          <td>${val(r.martyrdom_place)}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="8" class="empty-row">لا يوجد شهداء</td></tr>`;

    const body = `
      <div class="section-title">إجمالي الشهداء: ${ar(filtered.length)}</div>
      <table>
        <thead>
          <tr>
            <th>م</th>
            <th>الرقم العسكري</th>
            <th>الاسم</th>
            <th>الدرجة</th>
            <th>الوحدة</th>
            <th>تاريخ الاستشهاد</th>
            <th>نوع الاستشهاد</th>
            <th>المكان</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;

    printHtml(
      buildPrintHtml({
        title: "كشف الشهداء",
        boxTitle: "كشف الشهداء",
        logo: logoImg,
        body,
      })
    );
  }

  const inputClass =
    "h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white";

  if (loading || checkingAccess) {
    return (
      <div className="flex items-center justify-center w-full min-h-[400px]" dir="rtl">
        <span style={{ ...F, fontSize: 16, color: "#717d96" }}>جاري تحميل سجل الشهداء...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 style={{ ...F, fontWeight: 700, fontSize: "clamp(20px,3.5vw,28px)", color: "#2d3648" }}>سجل الشهداء</h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px]"
            style={{ background: "#DCF4DF" }}
          >
            <Printer size={15} color="#2d3648" />
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>طباعة الكشف</span>
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px]"
              style={{ background: "#DCF4DF" }}
            >
              <Plus size={15} color="#2d3648" />
              <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>إضافة شهيد</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", ...F, fontSize: 14 }}
        >
          {error}
        </div>
      )}

      {/* الإحصائيات */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-white rounded-[16px] border border-[#eff0f6] px-6 py-4 flex flex-col gap-1 min-w-[140px]">
          <span style={{ ...F, fontSize: 12, color: "#717d96" }}>إجمالي الشهداء</span>
          <span style={{ ...F, fontSize: 24, fontWeight: 700, color: "#2d3648" }}>{rows.length}</span>
        </div>

        {typeCounts.map(([type, count]) => (
          <div
            key={type}
            className="bg-white rounded-[16px] border border-[#eff0f6] px-6 py-4 flex flex-col gap-1 min-w-[140px]"
          >
            <span style={{ ...F, fontSize: 12, color: "#717d96" }}>{type}</span>
            <span style={{ ...F, fontSize: 24, fontWeight: 700, color: "#2d3648" }}>{count}</span>
          </div>
        ))}
      </div>

      {/* نموذج الإضافة */}
      {showAdd && canEdit && (
        <section className="bg-white rounded-[20px] border border-[#eff0f6] p-6 flex flex-col gap-4">
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>إضافة شهيد</span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>الاسم *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                dir="rtl"
                className={inputClass}
                style={F}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>الرقم العسكري</label>
              <input
                type="text"
                value={form.military_number}
                onChange={(e) => setForm({ ...form, military_number: e.target.value })}
                dir="rtl"
                className={inputClass}
                style={F}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>الدرجة وقت الاستشهاد</label>
              <select
                value={form.rank_id}
                onChange={(e) => setForm({ ...form, rank_id: e.target.value })}
                dir="rtl"
                className={inputClass}
                style={F}
              >
                <option value="">اختر الدرجة</option>
                {ranks.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>الوحدة</label>
              <select
                value={form.unit_id}
                onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
                dir="rtl"
                className={inputClass}
                style={F}
              >
                <option value="">اختر الوحدة</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>تاريخ الاستشهاد *</label>
              <input
                type="date"
                value={form.martyrdom_date}
                onChange={(e) => setForm({ ...form, martyrdom_date: e.target.value })}
                className={inputClass}
                style={F}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>نوع الاستشهاد</label>
              <select
                value={form.martyrdom_type}
                onChange={(e) => setForm({ ...form, martyrdom_type: e.target.value })}
                dir="rtl"
                className={inputClass}
                style={F}
              >
                <option value="">اختر النوع</option>
                {MARTYRDOM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 sm:col-span-3">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>مكان الاستشهاد</label>
              <input
                type="text"
                value={form.martyrdom_place}
                onChange={(e) => setForm({ ...form, martyrdom_place: e.target.value })}
                dir="rtl"
                className={inputClass}
                style={F}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="h-[42px] px-5 rounded-[8px] disabled:opacity-50"
              style={{ background: "#DCF4DF", ...F, fontSize: 14, color: "#2d3648" }}
            >
              {saving ? "جاري الحفظ..." : "حفظ وفتح السجل"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setForm(emptyForm);
              }}
              style={{ ...F, fontSize: 13, color: "#717d96" }}
            >
              إلغاء
            </button>
          </div>
        </section>
      )}

      {/* البحث والفلاتر */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[42px] flex-1 min-w-[220px]">
          <Search size={16} className="shrink-0 text-[#717d96]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الرقم العسكري"
            className="flex-1 bg-transparent outline-none text-right"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
            dir="rtl"
          />
        </div>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          dir="rtl"
          className={inputClass}
          style={F}
        >
          <option value="">كل السنوات</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          dir="rtl"
          className={inputClass}
          style={F}
        >
          <option value="">كل الوحدات</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          dir="rtl"
          className={inputClass}
          style={F}
        >
          <option value="">كل الأنواع</option>
          {MARTYRDOM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* الجدول */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>
            الشهداء ({filtered.length})
          </span>
        </div>

        <div className="p-6">
          {filtered.length === 0 ? (
            <div className="rounded-[8px] py-4 text-center" style={{ background: "#f7f9fc" }}>
              <span style={{ ...F, fontSize: 13, color: "#a1aebe" }}>لا يوجد شهداء مطابقين</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {["الرقم العسكري", "الاسم", "الدرجة", "الوحدة", "تاريخ الاستشهاد", "النوع", "المكان"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                        <span style={{ ...F, fontSize: 12, color: "#717d96" }}>{h}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/dashboard/martyrs-record/${r.id}`)}
                      className="hover:bg-[#fafbff] cursor-pointer"
                    >
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{r.military_number ?? "-"}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{r.full_name}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>{r.rank_name ?? "-"}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>{r.unit_name ?? "-"}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{r.martyrdom_date}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>{r.martyrdom_type ?? "-"}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>{r.martyrdom_place ?? "-"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}