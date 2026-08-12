import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Activity,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string;
  action_type: string;
  action: string;
  entity: string | null;
  details: string | null;
  created_at: string;
}

function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLogs() {
    try {
      setLoading(true);
      setError("");

      const {
        data,
        error: fetchError,
      } = await supabase
        .from("audit_logs")
        .select(
          "id, user_id, user_name, action_type, action, entity, details, created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (fetchError) {
        console.error(
          "GET ACTIVITY LOG ERROR:",
          fetchError
        );

        setError(
          `حدث خطأ أثناء تحميل سجل العمليات: ${fetchError.message}`
        );

        return;
      }

      setLogs(data ?? []);
    } catch (err) {
      console.error(
        "ACTIVITY LOG EXCEPTION:",
        err
      );

      setError(
        "حدث خطأ غير متوقع أثناء تحميل سجل العمليات"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  // =====================================================
  // تنسيق التفاصيل
  // =====================================================

  function formatDetails(details: string | null) {
  if (!details) return "-";

  try {
    const parsed = JSON.parse(details);

    return (
      <div className="space-y-1 text-sm leading-6">
        {parsed.queryBasis && (
          <div>
            <span className="font-bold">أساس الاستعلام:</span>{" "}
            {parsed.queryBasis}
          </div>
        )}

        {parsed.queryValue && (
          <div>
            <span className="font-bold">قيمة البحث:</span>{" "}
            {parsed.queryValue}
          </div>
        )}

        {parsed.category && (
          <div>
            <span className="font-bold">الفئة:</span>{" "}
            {parsed.category}
          </div>
        )}

        {parsed.resultsCount !== undefined && (
          <div>
            <span className="font-bold">عدد النتائج:</span>{" "}
            {parsed.resultsCount}
          </div>
        )}
{parsed.militaryNumbers?.length > 0 && (
  <div>
    <span className="font-bold">الأرقام العسكرية:</span>{" "}
    {parsed.militaryNumbers.join("، ")}
  </div>
)}
        {parsed.personnelIds?.length > 0 && (
          <div>
            <span className="font-bold">عدد الأفراد:</span>{" "}
            {parsed.personnelIds.length}
          </div>
        )}

        {parsed.personnelId && (
          <div>
            <span className="font-bold">معرف الفرد:</span>{" "}
            {parsed.personnelId}
          </div>
        )}

        {parsed.militaryNumber && (
          <div>
            <span className="font-bold">الرقم العسكري:</span>{" "}
            {parsed.militaryNumber}
          </div>
        )}

        {parsed.fullName && (
          <div>
            <span className="font-bold">الاسم:</span>{" "}
            {parsed.fullName}
          </div>
        )}
      </div>
    );
  } catch {
    return (
      <span className="whitespace-pre-wrap">
        {details}
      </span>
    );
  }
}

  // =====================================================
  // لون نوع العملية
  // =====================================================

  function getActionTypeStyle(
    actionType: string
  ) {
    switch (actionType) {
      case "CREATE":
        return "bg-green-100 text-green-700";

      case "UPDATE":
        return "bg-blue-100 text-blue-700";

      case "DELETE":
        return "bg-red-100 text-red-700";

      case "QUERY":
        return "bg-purple-100 text-purple-700";

      case "LOGIN":
        return "bg-emerald-100 text-emerald-700";

      case "LOGOUT":
        return "bg-orange-100 text-orange-700";
        case "PRINT":
  return "bg-sky-100 text-sky-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  return (
    <div
      dir="rtl"
      className="w-full"
      style={{
        fontFamily: "'Almarai', sans-serif",
      }}
    >
      {/* =================================================
          Header
      ================================================= */}

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#DCF4DF] flex items-center justify-center">
              <Activity
                size={22}
                className="text-[#00522E]"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#081021]">
                سجل العمليات
              </h1>

              <p className="text-sm text-[#64748b] mt-1">
                عرض جميع العمليات المسجلة داخل المنظومة
              </p>
            </div>
          </div>
        </div>

        {/* زر تحديث */}

        <button
          type="button"
          onClick={loadLogs}
          disabled={loading}
          className="
            flex items-center gap-2
            px-4 py-2.5
            rounded-xl
            border border-[#e2e8f0]
            bg-white
            text-[#334155]
            hover:bg-[#f8fafc]
            transition-colors
            disabled:opacity-50
          "
        >
          <RefreshCw
            size={17}
            className={
              loading ? "animate-spin" : ""
            }
          />

          تحديث
        </button>
      </div>

      {/* =================================================
          عدد العمليات
      ================================================= */}

      {!loading && !error && (
        <div className="mb-4">
          <span className="text-sm text-[#64748b]">
            إجمالي العمليات:{" "}
          </span>

          <span className="font-bold text-[#081021]">
            {logs.length}
          </span>
        </div>
      )}

      {/* =================================================
          Loading
      ================================================= */}

      {loading && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] py-16 text-center">
          <RefreshCw
            size={28}
            className="mx-auto mb-3 text-[#00B867] animate-spin"
          />

          <p className="text-[#64748b]">
            جاري تحميل سجل العمليات...
          </p>
        </div>
      )}

      {/* =================================================
          Error
      ================================================= */}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="shrink-0 mt-0.5"
            />

            <div>
              <p className="font-bold mb-1">
                تعذر تحميل سجل العمليات
              </p>

              <p className="text-sm">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          Table
      ================================================= */}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-5 py-4 text-right font-bold text-[#334155]">
                    المستخدم
                  </th>

                  <th className="px-5 py-4 text-right font-bold text-[#334155]">
                    نوع العملية
                  </th>

                  <th className="px-5 py-4 text-right font-bold text-[#334155]">
                    العملية
                  </th>

                  <th className="px-5 py-4 text-right font-bold text-[#334155]">
                    الكيان
                  </th>

                  <th className="px-5 py-4 text-right font-bold text-[#334155]">
                    التفاصيل
                  </th>

                  <th className="px-5 py-4 text-right font-bold text-[#334155]">
                    التاريخ
                  </th>
                </tr>
              </thead>

              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-16 text-center text-[#64748b]"
                    >
                      <Activity
                        size={32}
                        className="mx-auto mb-3 opacity-40"
                      />

                      لا توجد عمليات مسجلة
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="
                        border-t border-[#e2e8f0]
                        hover:bg-[#f8fafc]
                        transition-colors
                      "
                    >
                      {/* المستخدم */}

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-medium text-[#081021]">
                          {log.user_name || "-"}
                        </div>
                      </td>

                      {/* نوع العملية */}

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`
                            inline-flex
                            items-center
                            px-3 py-1
                            rounded-full
                            text-xs
                            font-bold
                            ${getActionTypeStyle(
                              log.action_type
                            )}
                          `}
                        >
                          {log.action_type || "-"}
                        </span>
                      </td>

                      {/* العملية */}

                      <td className="px-5 py-4 whitespace-nowrap font-medium text-[#334155]">
                        {log.action || "-"}
                      </td>

                      {/* الكيان */}

                      <td className="px-5 py-4 min-w-[180px]">
                        <span className="text-[#475569]">
                          {log.entity || "-"}
                        </span>
                      </td>

                      {/* التفاصيل */}

                      <td className="px-5 py-4 min-w-[350px] max-w-[500px]">
                        <div className="bg-[#f8fafc] rounded-lg p-3 border border-[#e2e8f0]">
                          {formatDetails(
                            log.details
                          )}
                        </div>
                      </td>

                      {/* التاريخ */}

                      <td className="px-5 py-4 whitespace-nowrap text-[#64748b]">
                        {log.created_at
                          ? new Date(
                              log.created_at
                            ).toLocaleString(
                              "ar-EG",
                              {
                                dateStyle:
                                  "short",
                                timeStyle:
                                  "short",
                              }
                            )
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
export default ActivityLogPage;