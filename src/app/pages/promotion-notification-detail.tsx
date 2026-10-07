import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowRight, Search, Trash2, Send, Printer } from "lucide-react";
import logoImg from "../../assets/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";
import { toArabicDigits } from "../../lib/normalizeDigits";
import {
  fetchBulletinById,
  fetchBulletinItems,
  searchEligiblePersonnel,
  addBulletinItem,
  updateBulletinItem,
  deleteBulletinItem,
  publishBulletin,
  bulletinLabel,
  type PromotionBulletin,
  type PromotionBulletinItem,
  type BulletinPersonnelOption,
} from "../../lib/promotionBulletins";
import { fetchAllRankOptions, fetchAllUnitOptions, type RankOption, type UnitOption } from "../../lib/socialRecords";
import { usePermissions } from "../../lib/usePermissions";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

export function PromotionNotificationDetailPage() {
  const { bulletinId } = useParams<{ bulletinId: string }>();
  const navigate = useNavigate();

  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("promotion_bulletin:edit");

  const [bulletin, setBulletin] = useState<PromotionBulletin | null>(null);
  const [items, setItems] = useState<PromotionBulletinItem[]>([]);
  const [ranks, setRanks] = useState<RankOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<BulletinPersonnelOption[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedPerson, setSelectedPerson] = useState<BulletinPersonnelOption | null>(null);
  const [pickNewRankId, setPickNewRankId] = useState("");
  const [pickNewUnitId, setPickNewUnitId] = useState("");
  const [adding, setAdding] = useState(false);
  const isDraft = bulletin?.status === "draft";
  const eligibleRanks = ranks.filter((r) => (r.name ?? "").trim().replace(/ى/g, "ي") !== "جندي");

  type UnitGroup = { unitName: string; items: PromotionBulletinItem[] };

  const unitGroups = useMemo<UnitGroup[]>(() => {
    const groups = new Map<string, UnitGroup>();

    items.forEach((it) => {
      const unitName = it.new_unit_name ?? it.old_unit_name ?? "بدون وحدة محددة";
      if (!groups.has(unitName)) {
        groups.set(unitName, { unitName, items: [] });
      }
      groups.get(unitName)!.items.push(it);
    });

    return Array.from(groups.values()).sort((a, b) => a.unitName.localeCompare(b.unitName, "ar"));
  }, [items]);
  useEffect(() => {
    if (bulletinId) load(bulletinId);
  }, [bulletinId]);

  async function load(id: string) {
    setLoading(true);
    setError("");

    try {
      const [b, itemRows, rankOptions, unitOptions] = await Promise.all([
        fetchBulletinById(id),
        fetchBulletinItems(id),
        fetchAllRankOptions(),
        fetchAllUnitOptions(),
      ]);

      setBulletin(b);
      setItems(itemRows);
      setRanks(rankOptions);
      setUnits(unitOptions);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل النشرة");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!bulletinId || !searchText.trim()) return;

    setSearching(true);
    setError("");

    try {
      const { results, conscripts, alreadyAdded } = await searchEligiblePersonnel(searchText, bulletinId);
      setSearchResults(results);

      if (results.length === 0) {
        if (conscripts.length > 0) {
          setError("هذا الفرد مجند (رتبة جندي) ولا يمكن إضافته إلى النشرة");
        } else if (alreadyAdded > 0) {
          setError("هذا الفرد مضاف بالفعل في هذه النشرة");
        } else {
          setError("لا توجد نتائج مطابقة للبحث");
        }
      } else if (conscripts.length > 0) {
        setError(`تم استبعاد ${conscripts.length} مجند من نتائج البحث لأنه لا يمكن إضافتهم إلى النشرة`);
      }
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء البحث");
    } finally {
      setSearching(false);
    }
  }

  function handlePickPerson(p: BulletinPersonnelOption) {
    setSelectedPerson(p);
    setPickNewRankId("");
    setPickNewUnitId("");
    setSearchResults([]);
    setSearchText("");
  }

  async function handleAddToBulletin() {
    if (!bulletinId || !selectedPerson) return;

    if (!pickNewRankId) {
      setError("اختر الدرجة الجديدة");
      return;
    }

    setAdding(true);
    setError("");

    try {
      await addBulletinItem({
        bulletin_id: bulletinId,
        personnel_id: selectedPerson.id,
        old_rank_id: selectedPerson.rank_id,
        old_unit_id: selectedPerson.unit_id,
        new_rank_id: pickNewRankId,
        new_unit_id: pickNewUnitId || null,
      });

      setSelectedPerson(null);
      setPickNewRankId("");
      setPickNewUnitId("");

      if (bulletinId) await load(bulletinId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إضافة الفرد");
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdateItemRank(itemId: string, rankId: string) {
    try {
      await updateBulletinItem(itemId, { new_rank_id: rankId });
      if (bulletinId) await load(bulletinId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء التحديث");
    }
  }

  async function handleUpdateItemUnit(itemId: string, unitId: string) {
    try {
      await updateBulletinItem(itemId, { new_unit_id: unitId || null });
      if (bulletinId) await load(bulletinId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء التحديث");
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!window.confirm("هل تريد حذف هذا الفرد من النشرة؟")) return;

    try {
      await deleteBulletinItem(itemId);
      if (bulletinId) await load(bulletinId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء الحذف");
    }
  }

  async function handlePublish() {
    if (!bulletinId) return;

    if (items.length === 0) {
      setError("لا يمكن نشر نشرة فارغة");
      return;
    }

    if (
      !window.confirm(
        "هل أنت متأكد من نشر النشرة؟ سيتم تحديث درجات ووحدات الأفراد فعليًا ولا يمكن التراجع بعد النشر."
      )
    ) {
      return;
    }

    setPublishing(true);
    setError("");

    try {
      await publishBulletin(bulletinId);
      await load(bulletinId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء نشر النشرة");
    } finally {
      setPublishing(false);
    }
  }

  function handlePrint() {
    if (!bulletin) return;

    const printWindow = window.open("", "_blank", "width=1000,height=1200");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    const ar = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined || value === "") return "-";
      return toArabicDigits(String(value));
    };

    const groupedForPrint = new Map<string, typeof items>();
    items.forEach((it) => {
      const unitName = it.new_unit_name ?? it.old_unit_name ?? "بدون وحدة محددة";
      if (!groupedForPrint.has(unitName)) groupedForPrint.set(unitName, []);
      groupedForPrint.get(unitName)!.push(it);
    });

    const unitSectionsHtml = items.length
      ? Array.from(groupedForPrint.entries())
          .sort((a, b) => a[0].localeCompare(b[0], "ar"))
          .map(([unitName, unitItems]) => {
            const rowsHtml = unitItems
              .map(
                (it) => `
              <tr>
                <td>${ar(it.military_number)}</td>
                <td>${it.full_name}</td>
                <td>${it.new_rank_name ?? "-"}</td>
                <td>${it.new_unit_name ?? "بدون نقل"}</td>
              </tr>`
              )
              .join("");

            return `
                  <div class="section-title">الوحدة: ${ar(unitName)}</div>
              <table>
                <thead>
                  <tr>
                    <th>الرقم العسكري</th>
                    <th>الاسم</th>
                    <th>الدرجة</th>
                    <th>الوحدة</th>
                  </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
              </table>`;
          })
          .join("")
      : `<div class="section-title">لا يوجد أفراد</div>`;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>${bulletinLabel(bulletin.bulletin_month, bulletin.bulletin_year)}</title>
          <style>
            @page { size: A4; margin: 8mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { margin: 0; padding: 0; font-family: 'Almarai', Arial, sans-serif; direction: rtl; color: #2d3648; }
            .page {
              border: 2px solid #cbd2e0;
              border-radius: 10px;
              padding: 18px 24px;
              box-decoration-break: clone;
              -webkit-box-decoration-break: clone;
            }
            .header { position: relative; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #cbd2e0; padding-bottom: 10px; margin-bottom: 10px; }
            .header-text { display: flex; flex-direction: column; gap: 2px; }
            .header-title { font-size: 18px; font-weight: 700; }
            .header-subtitle { font-size: 14px; font-weight: 700; }
            .header-system { font-size: 12px; color: #717d96; }
            .header-logo { width: 64px; height: 64px; object-fit: contain; }
            .header-title-box { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 6px; padding: 6px 18px; font-size: 18px; font-weight: 700; text-decoration: underline; white-space: nowrap; }
            .section-title {
              font-size: 15px;
              font-weight: 700;
              background: #f7f9fc;
              padding: 6px 10px;
              border-radius: 6px;
              margin-top: 16px;
              margin-bottom: 8px;
              page-break-after: avoid;
              break-after: avoid-page;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-top: 4px;
              page-break-inside: auto;
            }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; break-inside: avoid; }
            th, td { border: 1px solid #e2e7f0; padding: 6px 8px; text-align: center; }
            th { background: #f7f9fc; font-weight: 700; }
            .empty-row { color: #a1aebe; padding: 12px; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="header-text">
                <div class="header-title">قيادة قوات الصـاعقة</div>
                <div class="header-subtitle">فــــــرع التنظيــــم والإدارة</div>
                <div class="header-system"> المنظومـــة الالكترونيــــة للفرع</div>
              </div>
              <div class="header-title-box">${ar(bulletinLabel(bulletin.bulletin_month, bulletin.bulletin_year))}</div>
              <img src="${logoImg}" class="header-logo" />
            </div>

            <div class="section-title">رقم القرار: ${ar(bulletin.decision_number)}</div>

            ${unitSectionsHtml}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    const doPrint = () => {
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 400);
    };

    if (printWindow.document.readyState === "complete") doPrint();
    else printWindow.onload = doPrint;
  }

  const inputClass =
    "h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white";

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full min-h-[400px]" dir="rtl">
        <span style={{ ...F, fontSize: 16, color: "#717d96" }}>جاري تحميل النشرة...</span>
      </div>
    );
  }

  if (!bulletin) {
    return (
      <div className="flex items-center justify-center w-full min-h-[400px]" dir="rtl">
        <span style={{ ...F, fontSize: 16, color: "#e34040" }}>{error || "لم يتم العثور على النشرة"}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 style={{ ...F, fontWeight: 700, fontSize: "clamp(20px,3.5vw,28px)", color: "#2d3648" }}>
            {bulletinLabel(bulletin.bulletin_month, bulletin.bulletin_year)}
          </h1>

          {bulletin.status === "published" ? (
            <span
              className="px-2.5 py-1 rounded-full"
              style={{ background: "#dcfce7", ...F, fontSize: 12, fontWeight: 700, color: "#166534" }}
            >
              منشورة
            </span>
          ) : (
            <span
              className="px-2.5 py-1 rounded-full"
              style={{ background: "#fef3c7", ...F, fontSize: 12, fontWeight: 700, color: "#92400e" }}
            >
              مسودة
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px]"
            style={{ background: "#DCF4DF" }}
          >
            <Printer size={15} color="#2d3648" />
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>طباعة</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/promotion-notifications")}
            className="flex items-center gap-1.5"
            style={{ ...F, fontSize: 14, color: "#1f3d97" }}
          >
            <ArrowRight size={16} />
            العودة
          </button>
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

      <div className="bg-white rounded-[16px] border border-[#eff0f6] p-5">
        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>رقم قرار النشرة: </span>
        <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{bulletin.decision_number}</span>
      </div>

      {isDraft && canEdit && (
        <section className="bg-white rounded-[20px] border border-[#eff0f6] p-6 flex flex-col gap-4">
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>إضافة فرد للنشرة</span>

          {!selectedPerson ? (
            <>
              <div className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[46px]" dir="rtl">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="ابحث بالاسم أو الرقم العسكري"
                  className="flex-1 bg-transparent outline-none text-right"
                  style={{ ...F, fontSize: 14, color: "#2d3648" }}
                  dir="rtl"
                />
                <button type="button" onClick={handleSearch} disabled={searching}>
                  <Search size={18} className="shrink-0 text-[#2d3648]" />
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="flex flex-col gap-2">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePickPerson(p)}
                      className="flex items-center justify-between px-4 py-2.5 rounded-[8px] text-right"
                      style={{ background: "#f7f9fc" }}
                    >
                      <div className="flex flex-col">
                        <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{p.full_name}</span>
                        <span style={{ ...F, fontSize: 12, color: "#717d96" }}>
                          {p.military_number ?? "-"} · {p.rank_name ?? "-"} · {p.unit_name ?? "-"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-4 py-2.5 rounded-[8px]" style={{ background: "#f7f9fc" }}>
                <div className="flex flex-col">
                  <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{selectedPerson.full_name}</span>
                  <span style={{ ...F, fontSize: 12, color: "#717d96" }}>
                    الدرجة الحالية: {selectedPerson.rank_name ?? "-"} · الوحدة الحالية: {selectedPerson.unit_name ?? "-"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPerson(null)}
                  style={{ ...F, fontSize: 13, color: "#717d96" }}
                >
                  إلغاء
                </button>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                  <label style={{ ...F, fontSize: 12, color: "#717d96" }}>الدرجة الجديدة</label>
                  <select
                    value={pickNewRankId}
                    onChange={(e) => setPickNewRankId(e.target.value)}
                    dir="rtl"
                    className={inputClass}
                    style={F}
                  >
                    <option value="">اختر الدرجة</option>
                    {eligibleRanks.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                  <label style={{ ...F, fontSize: 12, color: "#717d96" }}>الوحدة الجديدة (اختياري - نقل)</label>
                  <select
                    value={pickNewUnitId}
                    onChange={(e) => setPickNewUnitId(e.target.value)}
                    dir="rtl"
                    className={inputClass}
                    style={F}
                  >
                    <option value="">بدون نقل</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddToBulletin}
                  disabled={adding}
                  className="h-[42px] px-5 rounded-[8px] shrink-0 disabled:opacity-50"
                  style={{ background: "#DCF4DF", ...F, fontSize: 14, color: "#2d3648" }}
                >
                  إضافة للنشرة
                </button>
              </div>
            </div>
          )}
        </section>
      )}

           <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>
            الأفراد المشمولين ({items.length})
          </span>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {items.length === 0 ? (
            <div className="rounded-[8px] py-4 text-center" style={{ background: "#f7f9fc" }}>
              <span style={{ ...F, fontSize: 13, color: "#a1aebe" }}>لا يوجد أفراد مضافين حاليًا</span>
            </div>
          ) : (
            unitGroups.map((group) => (
              <div key={group.unitName} className="flex flex-col gap-3">
                <div className="bg-white rounded-[16px] border border-[#eff0f6] p-5">
                  <span style={{ ...F, fontSize: 13, color: "#717d96" }}>الوحدة: </span>
                  <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{group.unitName}</span>
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
                          <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الدرجة الجديدة</span>
                        </th>
                        <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                          <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الوحدة الجديدة</span>
                        </th>
                        {isDraft && canEdit && <th className="px-4 py-2.5 border-b border-[#e2e7f0] bg-[#f7f9fc]" />}
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((it) => (
                        <tr key={it.id} className="hover:bg-[#fafbff]">
                          <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{it.military_number ?? "-"}</span>
                          </td>
                          <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                            <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{it.full_name}</span>
                          </td>
                          <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                            {isDraft && canEdit ? (
                              <select
                                value={it.new_rank_id}
                                onChange={(e) => handleUpdateItemRank(it.id, e.target.value)}
                                dir="rtl"
                                className="h-[38px] rounded-[8px] border border-[#e2e7f0] px-2 outline-none focus:border-[#00b867] bg-white"
                                style={{ ...F, fontSize: 13 }}
                              >
                                {eligibleRanks.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                                style={{ background: "#dcfce7", ...F, fontSize: 12, fontWeight: 700, color: "#166534" }}
                              >
                                {it.new_rank_name ?? "-"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                            {isDraft && canEdit ? (
                              <select
                                value={it.new_unit_id ?? ""}
                                onChange={(e) => handleUpdateItemUnit(it.id, e.target.value)}
                                dir="rtl"
                                className="h-[38px] rounded-[8px] border border-[#e2e7f0] px-2 outline-none focus:border-[#00b867] bg-white"
                                style={{ ...F, fontSize: 13 }}
                              >
                                <option value="">بدون نقل</option>
                                {units.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                                {it.new_unit_name ?? "بدون نقل"}
                              </span>
                            )}
                          </td>
                          {isDraft && canEdit && (
                            <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(it.id)}
                                className="w-8 h-8 rounded-[6px] flex items-center justify-center"
                                style={{ background: "#fce8f1" }}
                              >
                                <Trash2 size={14} color="#e3282c" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

        {isDraft && canEdit && (
          <div className="px-6 py-5 border-t border-[#e2e7f0] flex justify-end">
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-1.5 h-[46px] px-6 rounded-[8px] disabled:opacity-50"
              style={{ background: "linear-gradient(to bottom,#00b867,#00522e)", ...F, fontSize: 14, color: "#fff" }}
            >
              <Send size={15} />
              {publishing ? "جاري النشر..." : "نشر النشرة"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}