import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Search, Plus, Calendar } from "lucide-react";
import {
  fetchMailOffices,
  fetchOutgoingMails,
  type MailOffice,
  type OutgoingMail,
} from "../../lib/mailArchive";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

/* =========================================================
   Helpers
========================================================= */

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

/* =========================================================
   Page
========================================================= */

export function ArchiveOutgoingPage() {
  const navigate = useNavigate();

  const [mails, setMails] = useState<OutgoingMail[]>([]);
  const [offices, setOffices] = useState<MailOffice[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // فلاتر
  const [faxNumberFilter, setFaxNumberFilter] = useState("");
  const [faxYearFilter, setFaxYearFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [officeFilter, setOfficeFilter] = useState("");

  // قائمة السنوات المتاحة في الفلتر (آخر 6 سنوات بما فيها الحالية)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  }, []);

  useEffect(() => {
    loadOffices();
  }, []);

  // ✅ البحث بيشتغل تلقائيًا كل ما أي فلتر يتغيّر، بدون الحاجة
  // لزرار بحث. عملنا debounce بسيط (300ms) عشان لو المستخدم بيكتب
  // في حقل رقم الفاكس، الاستعلام ميتبعتش مع كل حرف على حدة.
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadMails();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    faxNumberFilter,
    faxYearFilter,
    dateFromFilter,
    dateToFilter,
    officeFilter,
  ]);

  async function loadOffices() {
    try {
      const data = await fetchMailOffices();
      setOffices(data);
    } catch (err: any) {
      console.error("Load offices error:", err);
    }
  }

  async function loadMails() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchOutgoingMails({
        faxNumber: faxNumberFilter || undefined,
        faxYear: faxYearFilter || undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
        officeId: officeFilter || undefined,
      });

      setMails(data);
    } catch (err: any) {
      console.error("Load outgoing mails error:", err);
      setError(
        err?.message || "حدث خطأ أثناء تحميل بيانات الفاكسات الصادرة"
      );
    } finally {
      setLoading(false);
    }
  }
  function handleResetFilters() {
    setFaxNumberFilter("");
    setFaxYearFilter("");
    setDateFromFilter("");
    setDateToFilter("");
    setOfficeFilter("");
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
          أرشيف الصادر
        </h1>

        <button
          type="button"
          onClick={() =>
            navigate("/dashboard/archive/outgoing/new")
          }
          className="flex items-center gap-2 h-[46px] px-5 rounded-[8px]"
          style={{
            background: "linear-gradient(to bottom,#00b867,#00522e)",
          }}
        >
          <Plus size={18} color="#fff" />
          <span style={{ ...F, fontSize: 15, color: "#fff" }}>
            إضافة فاكس جديد
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

      {/* =================================================
          الفلاتر
      ================================================= */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] p-5">
        <div className="flex flex-wrap items-end gap-3 w-full">
          {/* رقم الفاكس */}

          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>
              رقم الفاكس
            </label>

            <div
              className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[44px]"
              dir="rtl"
            >
              <input
                type="text"
                value={faxNumberFilter}
                onChange={(e) =>
                  setFaxNumberFilter(
                    e.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="مثال: 45"
                className="flex-1 bg-transparent outline-none text-right"
                style={{ ...F, fontSize: 14, color: "#2d3648" }}
              />

              <Search size={16} className="text-[#a1aebe]" />
            </div>
          </div>

          {/* من تاريخ */}

          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>
              من تاريخ
            </label>

            <div
              className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[44px]"
              dir="rtl"
            >
              <Calendar size={16} className="text-[#a1aebe] shrink-0" />

              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) =>
                  setDateFromFilter(e.target.value)
                }
                className="flex-1 bg-transparent outline-none text-right"
                style={{ ...F, fontSize: 14, color: "#2d3648" }}
              />
            </div>
          </div>

          {/* إلى تاريخ */}

          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>
              إلى تاريخ
            </label>

            <div
              className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[44px]"
              dir="rtl"
            >
              <Calendar size={16} className="text-[#a1aebe] shrink-0" />

              <input
                type="date"
                value={dateToFilter}
                onChange={(e) =>
                  setDateToFilter(e.target.value)
                }
                className="flex-1 bg-transparent outline-none text-right"
                style={{ ...F, fontSize: 14, color: "#2d3648" }}
              />
            </div>
          </div>

                    {/* السنة */}

          <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>
              السنة
            </label>

            <select
              value={faxYearFilter}
              onChange={(e) => setFaxYearFilter(e.target.value)}
              dir="rtl"
              className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              <option value="">كل السنوات</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* المكتب */}

          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>
              مكتب الإصدار
            </label>

            <select
              value={officeFilter}
              onChange={(e) => setOfficeFilter(e.target.value)}
              dir="rtl"
              className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              <option value="">كل المكاتب</option>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>

          {/* إعادة تعيين */}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-[44px] px-5 rounded-[8px] border border-[#e2e7f0] bg-white"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              إعادة تعيين
            </button>
          </div>
        </div>
      </section>

      {/* =================================================
          الجدول
      ================================================= */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <p style={{ ...F, fontSize: 14, color: "#717d96" }}>
              جاري تحميل البيانات...
            </p>
          </div>
        ) : mails.length === 0 ? (
          <div className="py-16 text-center">
            <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
              لا توجد فاكسات صادرة مطابقة
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={thClass}>
                    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                      رقم الفاكس
                    </span>
                  </th>

                  <th className={thClass}>
                    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                      تاريخ الفاكس
                    </span>
                  </th>
                  <th className={thClass}>
                    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                      مكتب الإصدار
                    </span>
                  </th>

                  <th className={thClass}>
                    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                      ملخص الفاكس
                    </span>
                  </th>

                  <th className={thClass}>
                    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                      استلام الأصل
                    </span>
                  </th>

                  <th className={thClass}>
                    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                      الإجراء
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {mails.map((mail) => (
                  <tr key={mail.id} className="hover:bg-[#fafbff]">
                    <td className={tdClass}>
                      <span
                        style={{
                          ...F,
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#2d3648",
                        }}
                      >
                        {mail.fax_number}/{mail.fax_year}
                      </span>
                    </td>

                    <td className={tdClass}>
                      <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                        {formatDate(mail.fax_date)}
                      </span>
                    </td>

                                       <td className={tdClass}>
                      <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                        {mail.mail_offices?.name ?? "-"}
                      </span>
                    </td>

                    <td className={tdClass}>
                      <span
                        style={{
                          ...F,
                          fontSize: 13,
                          color: "#4a5468",
                          maxWidth: 220,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {mail.fax_summary || "-"}
                      </span>
                    </td>

                    <td className={tdClass}>
                      {mail.is_original_received ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                          style={{
                            background: "#dcfce7",
                            ...F,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#166534",
                          }}
                        >
                          تم الاستلام
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                          style={{
                            background: "#fce9ea",
                            ...F,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#9d2e15",
                          }}
                        >
                          لم يُستلم بعد
                        </span>
                      )}
                    </td>

                    <td className={tdClass}>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/archive/outgoing/${mail.id}`
                          )
                        }
                        className="text-[#1f3d97]"
                        style={{ ...F, fontSize: 13 }}
                      >
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}