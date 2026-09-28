import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Search, Building2, Users, Printer } from "lucide-react";
import logoImg from "../../assets/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";
import { toArabicDigits } from "../../lib/normalizeDigits";
import {
  fetchSocialRecordUnitStats,
  searchPersonnelByMilitaryNumber,
  type SocialRecordUnitStat,
} from "../../lib/socialRecords";
import { sortByUnitHierarchy } from "../../lib/unitOrder";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

export function SocialRecordPage() {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [units, setUnits] = useState<SocialRecordUnitStat[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [unitsError, setUnitsError] = useState("");
  const [unitSearchText, setUnitSearchText] = useState("");

  useEffect(() => {
    loadUnits();
  }, []);

  async function loadUnits() {
    setLoadingUnits(true);
    setUnitsError("");

    try {
      const data = await fetchSocialRecordUnitStats();
      setUnits(data);
    } catch (err: any) {
      setUnitsError(err?.message || "حدث خطأ أثناء تحميل إحصائيات الوحدات");
    } finally {
      setLoadingUnits(false);
    }
  }

  const sortedUnits = useMemo(() => sortByUnitHierarchy(units), [units]);

  const filteredUnits = useMemo(() => {
    const trimmed = unitSearchText.trim();
    if (!trimmed) return sortedUnits;

    return sortedUnits.filter((unit) => unit.unit_name.includes(trimmed));
  }, [sortedUnits, unitSearchText]);

  const overallStats = useMemo(() => {
    return units.reduce(
      (acc, unit) => {
        acc.total += unit.total_count;
        acc.complete += unit.complete_count;
        acc.incomplete += unit.incomplete_count;
        acc.without += unit.without_record_count;
        return acc;
      },
      { total: 0, complete: 0, incomplete: 0, without: 0 }
    );
  }, [units]);

  async function handleSearch() {
    const trimmed = searchText.trim();

    if (!trimmed) return;

    setSearching(true);
    setSearchError("");

    try {
      const found = await searchPersonnelByMilitaryNumber(trimmed);

      if (!found) {
        setSearchError("لا يوجد فرد بهذا الرقم العسكري");
        return;
      }

      navigate(`/dashboard/social-record/personnel/${found.id}`);
    } catch (err: any) {
      setSearchError(err?.message || "حدث خطأ أثناء البحث");
    } finally {
      setSearching(false);
    }
  }

  function handlePrintUnitsReport() {
    const printWindow = window.open("", "_blank", "width=1000,height=1200");

    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    const ar = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined || value === "") return "-";
      return toArabicDigits(String(value));
    };

    const sortedForPrint = sortByUnitHierarchy(units);

    const rowsHtml = sortedForPrint.length
      ? sortedForPrint
          .map(
            (u) => `
        <tr>
          <td>${u.unit_name}</td>
          <td>${ar(u.total_count)}</td>
          <td>${ar(u.complete_count)}</td>
          <td>${ar(u.incomplete_count)}</td>
          <td>${ar(u.without_record_count)}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="5" class="empty-row">لا يوجد وحدات</td></tr>`;

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>تقرير إحصائيات الوحدات</title>

          <style>
            @page {
              size: A4;
              margin: 8mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: 'Almarai', Arial, sans-serif;
              direction: rtl;
              color: #2d3648;
            }

            .page {
              border: 2px solid #cbd2e0;
              border-radius: 10px;
              padding: 18px 24px;
              min-height: 100%;
            }
            .header {
              position: relative;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid #cbd2e0;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }

            .header-text {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }

            .header-title {
              font-size: 18px;
              font-weight: 700;
            }

            .header-subtitle {
              font-size: 14px;
              font-weight: 700;
            }

            .header-system {
              font-size: 12px;
              color: #717d96;
            }

            .header-logo {
              width: 64px;
              height: 64px;
              object-fit: contain;
            }

            .header-title-box {
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);

              border-radius: 6px;
              padding: 6px 18px;
              font-size: 18px;
              font-weight: 700;
              text-decoration: underline;
              white-space: nowrap;
            }

            .section-title {
              font-size: 15px;
              font-weight: 700;
              background: #f7f9fc;
              padding: 6px 10px;
              border-radius: 6px;
              margin-top: 16px;
              margin-bottom: 8px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-top: 4px;
            }

            th, td {
              border: 1px solid #e2e7f0;
              padding: 6px 8px;
              text-align: center;
            }

            th {
              background: #f7f9fc;
              font-weight: 700;
            }

            .empty-row {
              color: #a1aebe;
              padding: 12px;
            }

            .total-row td {
              font-weight: 700;
              background: #f7f9fc;
            }
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

              <div class="header-title-box">تقرير إحصائيات الوحدات</div>

              <img src="${logoImg}" class="header-logo" />
            </div>

            <div class="section-title">إحصائيات الوحدات للسجل الاجتماعي</div>
            <table>
              <thead>
                <tr>
                  <th>اسم الوحدة</th>
                  <th>اجمالي الافراد</th>
                  <th>له سجل</th>
                  <th>غير مكتمل</th>
                  <th>بدون سجل</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr class="total-row">
                  <td>الإجمالي العام</td>
                  <td>${ar(overallStats.total)}</td>
                  <td>${ar(overallStats.complete)}</td>
                  <td>${ar(overallStats.incomplete)}</td>
                  <td>${ar(overallStats.without)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    const doPrint = () => {
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };

    if (printWindow.document.readyState === "complete") {
      doPrint();
    } else {
      printWindow.onload = doPrint;
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1
          style={{
            ...F,
            fontWeight: 700,
            fontSize: "clamp(22px,4vw,32px)",
            color: "#2d3648",
          }}
        >
          السجل الاجتماعي
        </h1>

        <button
          type="button"
          onClick={handlePrintUnitsReport}
          className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px]"
          style={{ background: "#DCF4DF" }}
        >
          <Printer size={15} color="#2d3648" />
          <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>طباعة تقرير الوحدات</span>
        </button>
      </div>

      <section className="bg-white rounded-[20px] border border-[#eff0f6] p-6">
        <div className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[52px]" dir="rtl">
          <input
            type="text"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setSearchError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="ابحث بالرقم العسكري"
            className="flex-1 bg-transparent outline-none text-right"
            style={{ ...F, fontSize: 15, color: "#2d3648" }}
            dir="rtl"
          />

          <button type="button" onClick={handleSearch} disabled={searching}>
            <Search size={18} className="shrink-0 text-[#2d3648]" />
          </button>
        </div>

        {searchError && (
          <p className="mt-2" style={{ ...F, fontSize: 13, color: "#e3282c" }}>
            {searchError}
          </p>
        )}
      </section>

      {!loadingUnits && units.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#eef2ff" }}>
              <Users size={18} color="#3730a3" />
            </div>
            <div className="flex flex-col">
              <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#2d3648" }}>{overallStats.total}</span>
              <span style={{ ...F, fontSize: 12, color: "#717d96" }}>إجمالي الأفراد</span>
            </div>
          </div>

          <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#dcfce7" }}>
              <Users size={18} color="#166534" />
            </div>
            <div className="flex flex-col">
              <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#166534" }}>{overallStats.complete}</span>
              <span style={{ ...F, fontSize: 12, color: "#717d96" }}>له سجل</span>
            </div>
          </div>

          <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#fef3c7" }}>
              <Users size={18} color="#92400e" />
            </div>
            <div className="flex flex-col">
              <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#92400e" }}>{overallStats.incomplete}</span>
              <span style={{ ...F, fontSize: 12, color: "#717d96" }}>غير مكتمل</span>
            </div>
          </div>

          <div className="bg-white rounded-[16px] border border-[#eff0f6] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#fce9ea" }}>
              <Users size={18} color="#9d2e15" />
            </div>
            <div className="flex flex-col">
              <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#9d2e15" }}>{overallStats.without}</span>
              <span style={{ ...F, fontSize: 12, color: "#717d96" }}>بدون سجل</span>
            </div>
          </div>
        </div>
      )}

      <h2 style={{ ...F, fontWeight: 700, fontSize: 18, color: "#2d3648" }}>
        الوحدات
      </h2>

      {unitsError && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", ...F, fontSize: 14 }}
        >
          {unitsError}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div
          className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[42px] w-full sm:w-[260px]"
          dir="rtl"
        >
          <Search size={16} className="shrink-0 text-[#a1aebe]" />
          <input
            type="text"
            value={unitSearchText}
            onChange={(e) => setUnitSearchText(e.target.value)}
            placeholder="ابحث باسم الوحدة"
            className="flex-1 bg-transparent outline-none text-right"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
            dir="rtl"
          />
        </div>
      </div>

      {loadingUnits ? (
        <p style={{ ...F, fontSize: 14, color: "#717d96" }}>جاري تحميل الوحدات...</p>
      ) : units.length === 0 ? (
        <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>لا توجد وحدات بها أفراد نشطون</p>
      ) : filteredUnits.length === 0 ? (
        <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>لا توجد وحدة مطابقة للبحث</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => (
            <button
              key={unit.unit_id}
              type="button"
              onClick={() => navigate(`/dashboard/social-record/unit/${unit.unit_id}`)}
              className="bg-white rounded-[16px] border border-[#eff0f6] p-5 flex flex-col gap-3 text-right hover:border-[#00b867] transition-colors"
            >
<div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-[10px] bg-[#DCF4DF] flex items-center justify-center shrink-0">
    <Building2 size={18} color="#00522e" />
  </div>

  <div className="flex flex-col">
    <span style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>
      {unit.unit_name}
    </span>
    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
      اجمالي الافراد: {unit.total_count}
    </span>
  </div>
</div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#eff0f6]">


                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ background: "#dcfce7", ...F, fontSize: 12, fontWeight: 700, color: "#166534" }}
                  >
                    {unit.complete_count} له سجل
                  </span>

                  {unit.incomplete_count > 0 && (
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: "#fef3c7", ...F, fontSize: 12, fontWeight: 700, color: "#92400e" }}
                    >
                      {unit.incomplete_count} غير مكتمل
                    </span>
                  )}

                  {unit.without_record_count > 0 && (
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: "#fce9ea", ...F, fontSize: 12, fontWeight: 700, color: "#9d2e15" }}
                    >
                      {unit.without_record_count} بدون سجل
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}