import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Database,
  Download,
  RefreshCw,
  AlertCircle,
  History,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// الجداول التي سيتم تضمينها في كل نسخة احتياطية
const BACKUP_TABLES = [
  "personnel",
  "letters",
  "letter_personnel",
  "reserve_batches",
  "reserve_batch_documents",
  "branch_heads",
  "letter_types",
  "letter_officer_ranks",
  "profiles",
  "units",
];

type BackupLog = {
  id: string;
  created_at: string;
  created_by_name: string | null;
  file_path: string;
  file_size_bytes: number | null;
  records_count: number | null;
  status: string;
};

// =========================================================
// الحصول على بيانات المستخدم الحالي
// =========================================================

async function getCurrentUserInfo(): Promise<{
  userId: string | null;
  userName: string;
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return {
      userId: null,
      userName: "غير معروف",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", session.user.id)
    .maybeSingle();

  return {
    userId: session.user.id,
    userName: profile?.username ?? "غير معروف",
  };
}

// =========================================================
// تنسيق حجم الملف
// =========================================================

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "-";

  if (bytes < 1024) {
    return `${bytes} بايت`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} كيلوبايت`;
  }

  const mb = kb / 1024;

  return `${mb.toFixed(2)} ميجابايت`;
}

// =========================================================
// تنسيق التاريخ
// =========================================================

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// =========================================================
// الصفحة
// =========================================================

export function DataBackupPage() {
  // =========================================================
  // Backup States
  // =========================================================

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [progressLabel, setProgressLabel] = useState("");

  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState("");

  const [downloadingId, setDownloadingId] = useState<string | null>(
    null
  );

  const [exportingExcel, setExportingExcel] = useState(false);

  // =========================================================
  // Reset States
  // =========================================================

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  const RESET_CONFIRM_PHRASE = "حذف جميع البيانات";

  // =========================================================
  // تحميل سجل النسخ الاحتياطية
  // =========================================================

  async function loadBackupLogs() {
    setLoadingLogs(true);
    setLogsError("");

    const { data, error: fetchError } = await supabase
      .from("backup_logs")
      .select(
        "id, created_at, created_by_name, file_path, file_size_bytes, records_count, status"
      )
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Load backup logs error:", fetchError);

      setLogsError(
        `حدث خطأ أثناء تحميل سجل النسخ: ${fetchError.message}`
      );

      setLoadingLogs(false);
      return;
    }

    setLogs(data ?? []);
    setLoadingLogs(false);
  }

  useEffect(() => {
    loadBackupLogs();
  }, []);

  // =========================================================
  // إنشاء نسخة احتياطية
  // =========================================================

  async function handleCreateBackup() {
    setCreating(true);
    setError("");
    setSuccessMsg("");
    setProgressLabel("");

    try {
      const backupData: Record<string, any[]> = {};
      let totalRecords = 0;

      for (const table of BACKUP_TABLES) {
        setProgressLabel(`جاري جلب بيانات: ${table}...`);

        const { data, error: fetchError } = await supabase
          .from(table)
          .select("*");

        if (fetchError) {
          throw new Error(
            `فشل جلب بيانات جدول ${table}: ${fetchError.message}`
          );
        }

        backupData[table] = data ?? [];
        totalRecords += data?.length ?? 0;
      }

      setProgressLabel("جاري تجهيز الملف...");

      const backupPayload = {
        created_at: new Date().toISOString(),
        tables: backupData,
      };

      const jsonString = JSON.stringify(
        backupPayload,
        null,
        2
      );

      const blob = new Blob([jsonString], {
        type: "application/json",
      });

      const now = new Date();

      const dateFolder = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`;

      const timeLabel = `${String(now.getHours()).padStart(
        2,
        "0"
      )}${String(now.getMinutes()).padStart(
        2,
        "0"
      )}${String(now.getSeconds()).padStart(
        2,
        "0"
      )}`;

      const filePath = `${dateFolder}/backup-${timeLabel}.json`;

      setProgressLabel("جاري رفع النسخة الاحتياطية...");

      const { error: uploadError } = await supabase.storage
        .from("backups")
        .upload(filePath, blob, {
          contentType: "application/json",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          `فشل رفع الملف: ${uploadError.message}`
        );
      }

      const { userId, userName } =
        await getCurrentUserInfo();

      const { error: logError } = await supabase
        .from("backup_logs")
        .insert({
          created_by: userId,
          created_by_name: userName,
          file_path: filePath,
          file_size_bytes: blob.size,
          tables_included: BACKUP_TABLES,
          records_count: totalRecords,
          status: "SUCCESS",
        });

      if (logError) {
        console.error(
          "Backup log error:",
          logError
        );
      }

      setSuccessMsg(
        `تم إنشاء النسخة الاحتياطية بنجاح (${totalRecords} سجل)`
      );

      await loadBackupLogs();
    } catch (err: any) {
      console.error(
        "Backup creation error:",
        err
      );

      setError(
        err?.message ||
          "حدث خطأ أثناء إنشاء النسخة الاحتياطية"
      );
    } finally {
      setCreating(false);
      setProgressLabel("");
    }
  }

  // =========================================================
  // تصدير Excel
  // =========================================================

  async function handleExportExcel() {
    setExportingExcel(true);
    setError("");
    setSuccessMsg("");

    try {
      const workbook = XLSX.utils.book_new();

      for (const table of BACKUP_TABLES) {
        const { data, error: fetchError } =
          await supabase
            .from(table)
            .select("*");

        if (fetchError) {
          throw new Error(
            `فشل جلب بيانات جدول ${table}: ${fetchError.message}`
          );
        }

        const sheet = XLSX.utils.json_to_sheet(
          data ?? []
        );

        const sheetName = table.substring(0, 31);

        XLSX.utils.book_append_sheet(
          workbook,
          sheet,
          sheetName
        );
      }

      const now = new Date();

      const dateLabel = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`;

      XLSX.writeFile(
        workbook,
        `نسخة-احتياطية-${dateLabel}.xlsx`
      );

      setSuccessMsg(
        "تم تصدير النسخة الاحتياطية كملف Excel بنجاح"
      );
    } catch (err: any) {
      console.error(
        "Excel export error:",
        err
      );

      setError(
        err?.message ||
          "حدث خطأ أثناء تصدير ملف Excel"
      );
    } finally {
      setExportingExcel(false);
    }
  }

  // =========================================================
  // تحميل نسخة احتياطية
  // =========================================================

  async function handleDownload(log: BackupLog) {
    setDownloadingId(log.id);
    setLogsError("");

    try {
      const { data, error: downloadError } =
        await supabase.storage
          .from("backups")
          .download(log.file_path);

      if (downloadError) {
        throw new Error(
          `فشل تحميل الملف: ${downloadError.message}`
        );
      }

      if (!data) {
        throw new Error(
          "الملف غير موجود على السيرفر"
        );
      }

      const url = URL.createObjectURL(data);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        log.file_path.split("/").pop() ||
        "backup.json";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(
        "Download backup error:",
        err
      );

      setLogsError(
        err?.message ||
          "حدث خطأ أثناء تحميل النسخة الاحتياطية"
      );
    } finally {
      setDownloadingId(null);
    }
  }

  // =========================================================
  // Reset System
  // =========================================================

  function openResetModal() {
    setResetConfirmText("");
    setResetError("");
    setShowResetModal(true);
  }

  function closeResetModal() {
    if (resetting) return;

    setShowResetModal(false);
    setResetConfirmText("");
    setResetError("");
  }

  async function handleResetSystem() {
    if (
      resetConfirmText.trim() !==
      RESET_CONFIRM_PHRASE
    ) {
      setResetError(
        `يرجى كتابة العبارة "${RESET_CONFIRM_PHRASE}" بالضبط للتأكيد`
      );

      return;
    }

    setResetting(true);
    setResetError("");
    setError("");
    setSuccessMsg("");

    try {
      const { error: rpcError } =
        await supabase.rpc(
          "reset_system_data"
        );

      if (rpcError) {
        throw new Error(
          rpcError.message
        );
      }

      setShowResetModal(false);
      setResetConfirmText("");

      setSuccessMsg(
        "تم حذف جميع بيانات النظام (الأفراد والخطابات) بنجاح، ماعدا حساب الأدمن."
      );

      await loadBackupLogs();
    } catch (err: any) {
      console.error(
        "Reset system data error:",
        err
      );

      setResetError(
        err?.message ||
          "حدث خطأ أثناء تنفيذ عملية إعادة تعيين النظام"
      );
    } finally {
      setResetting(false);
    }
  }

  // =========================================================
  // JSX
  // =========================================================

  return (
    <div
      className="flex flex-col gap-6 w-full pb-10"
      dir="rtl"
    >
      {/* =================================================
          العنوان
      ================================================= */}

      <h1
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(22px,4vw,32px)",
          color: "#2d3648",
        }}
      >
        النسخ الاحتياطي للبيانات
      </h1>

      {/* =================================================
          Error
      ================================================= */}

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4 flex items-start gap-2"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          <AlertCircle
            size={18}
            className="shrink-0 mt-0.5"
          />

          <span
            style={{
              ...F,
              fontSize: 14,
            }}
          >
            {error}
          </span>
        </div>
      )}

      {/* =================================================
          Success
      ================================================= */}

      {successMsg && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{
            background: "#dcfce7",
            color: "#166534",
            ...F,
            fontSize: 14,
          }}
        >
          {successMsg}
        </div>
      )}

      {/* =================================================
          إنشاء نسخة احتياطية
      ================================================= */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] p-6 flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: "#dcfce7",
          }}
        >
          <Database
            size={28}
            color="#00522E"
          />
        </div>

        <p
          style={{
            ...F,
            fontSize: 16,
            color: "#4a5468",
            textAlign: "center",
            lineHeight: 1.8,
          }}
        >
          إنشاء نسخة احتياطية فورية من جميع
          بيانات النظام
          <br />
          (الأفراد، الخطابات، دفعات الرديف،
          سجل العمليات)
        </p>

        <button
          type="button"
          disabled={creating}
          onClick={handleCreateBackup}
          className="h-[54px] px-8 rounded-[8px] flex items-center gap-2 disabled:opacity-60"
          style={{
            background:
              "linear-gradient(to bottom,#00b867,#00522e)",
          }}
        >
          <RefreshCw
            size={18}
            color="#fff"
            className={
              creating
                ? "animate-spin"
                : ""
            }
          />

          <span
            style={{
              ...F,
              fontSize: 16,
              color: "#fff",
            }}
          >
            {creating
              ? progressLabel ||
                "جاري الإنشاء..."
              : "إنشاء نسخة احتياطية الآن"}
          </span>
        </button>

        <button
          type="button"
          disabled={exportingExcel}
          onClick={handleExportExcel}
          className="h-[54px] px-8 rounded-[8px] flex items-center gap-2 border border-[#00522E] disabled:opacity-60"
          style={{
            background: "#fff",
          }}
        >
          <FileSpreadsheet
            size={18}
            color="#00522E"
            className={
              exportingExcel
                ? "animate-pulse"
                : ""
            }
          />

          <span
            style={{
              ...F,
              fontSize: 16,
              color: "#00522E",
            }}
          >
            {exportingExcel
              ? "جاري التصدير..."
              : "تصدير كملف Excel"}
          </span>
        </button>
      </section>

      {/* =================================================
          سجل النسخ الاحتياطية
      ================================================= */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History
              size={18}
              className="text-[#4a5468]"
            />

            <span
              style={{
                ...F,
                fontSize: 16,
                color: "#4a5468",
              }}
            >
              سجل النسخ الاحتياطية
            </span>
          </div>

          <button
            type="button"
            onClick={loadBackupLogs}
            disabled={loadingLogs}
            className="flex items-center gap-2 text-[#00522E] disabled:opacity-50"
            style={{
              ...F,
              fontSize: 14,
            }}
          >
            <RefreshCw
              size={14}
              className={
                loadingLogs
                  ? "animate-spin"
                  : ""
              }
            />

            تحديث
          </button>
        </div>

        {logsError && (
          <div
            className="mx-6 mt-4 rounded-[10px] px-4 py-3"
            style={{
              background: "#fef2f2",
              color: "#991b1b",
              ...F,
              fontSize: 13,
            }}
          >
            {logsError}
          </div>
        )}

        {loadingLogs ? (
          <div className="py-12 text-center">
            <RefreshCw
              size={24}
              className="mx-auto mb-2 text-[#00b867] animate-spin"
            />

            <p
              style={{
                ...F,
                fontSize: 14,
                color: "#717d96",
              }}
            >
              جاري تحميل السجل...
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <Database
              size={28}
              className="mx-auto mb-2 text-[#a1aebe]"
            />

            <p
              style={{
                ...F,
                fontSize: 14,
                color: "#a1aebe",
              }}
            >
              لا توجد نسخ احتياطية مسجلة بعد
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f7f9fc]">
                <tr>
                  <th
                    className="px-5 py-3 text-right"
                    style={{
                      ...F,
                      fontSize: 13,
                      color: "#717d96",
                    }}
                  >
                    التاريخ
                  </th>

                  <th
                    className="px-5 py-3 text-right"
                    style={{
                      ...F,
                      fontSize: 13,
                      color: "#717d96",
                    }}
                  >
                    المستخدم
                  </th>

                  <th
                    className="px-5 py-3 text-right"
                    style={{
                      ...F,
                      fontSize: 13,
                      color: "#717d96",
                    }}
                  >
                    عدد السجلات
                  </th>

                  <th
                    className="px-5 py-3 text-right"
                    style={{
                      ...F,
                      fontSize: 13,
                      color: "#717d96",
                    }}
                  >
                    حجم الملف
                  </th>

                  <th
                    className="px-5 py-3 text-right"
                    style={{
                      ...F,
                      fontSize: 13,
                      color: "#717d96",
                    }}
                  >
                    تحميل
                  </th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-[#e2e7f0]"
                  >
                    <td
                      className="px-5 py-3 whitespace-nowrap"
                      style={{
                        ...F,
                        fontSize: 13,
                        color: "#2d3648",
                      }}
                    >
                      {formatDate(
                        log.created_at
                      )}
                    </td>

                    <td
                      className="px-5 py-3 whitespace-nowrap"
                      style={{
                        ...F,
                        fontSize: 13,
                        color: "#2d3648",
                      }}
                    >
                      {log.created_by_name ||
                        "-"}
                    </td>

                    <td
                      className="px-5 py-3 whitespace-nowrap"
                      style={{
                        ...F,
                        fontSize: 13,
                        color: "#2d3648",
                      }}
                    >
                      {log.records_count ??
                        "-"}
                    </td>

                    <td
                      className="px-5 py-3 whitespace-nowrap"
                      style={{
                        ...F,
                        fontSize: 13,
                        color: "#2d3648",
                      }}
                    >
                      {formatFileSize(
                        log.file_size_bytes
                      )}
                    </td>

                    <td className="px-5 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(log)
                        }
                        disabled={
                          downloadingId ===
                          log.id
                        }
                        className="flex items-center gap-1.5 text-[#00522E] disabled:opacity-50"
                        style={{
                          ...F,
                          fontSize: 13,
                        }}
                      >
                        <Download size={14} />

                        {downloadingId ===
                        log.id
                          ? "جاري التحميل..."
                          : "تحميل"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =================================================
          منطقة الخطر
      ================================================= */}

      <section
        className="rounded-[20px] p-6 flex flex-col items-center gap-4"
        style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: "#fee2e2",
          }}
        >
          <AlertTriangle
            size={28}
            color="#dc2626"
          />
        </div>

        <p
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 17,
            color: "#991b1b",
            textAlign: "center",
          }}
        >
          منطقة خطر: إعادة تعيين النظام بالكامل
        </p>

        <p
          style={{
            ...F,
            fontSize: 14,
            color: "#7f1d1d",
            textAlign: "center",
            lineHeight: 1.8,
          }}
        >
          هذا الإجراء سيحذف نهائيًا جميع
          الخطابات وجميع الأفراد المسجلين
          وحساباتهم، ولا يمكن التراجع عنه بعد
          التنفيذ. يُنصح بشدة بإنشاء نسخة
          احتياطية قبل المتابعة.
        </p>

        <button
          type="button"
          onClick={openResetModal}
          className="h-[54px] px-8 rounded-[8px] flex items-center gap-2"
          style={{
            background:
              "linear-gradient(to bottom,#e3282c,#991b1b)",
          }}
        >
          <Trash2
            size={18}
            color="#fff"
          />

          <span
            style={{
              ...F,
              fontSize: 16,
              color: "#fff",
            }}
          >
            حذف جميع بيانات النظام
          </span>
        </button>
      </section>

      {/* =================================================
          Reset Confirmation Modal
      ================================================= */}

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            dir="rtl"
          >
            {/* Header */}

            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e7f0]">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={20}
                  className="text-[#dc2626]"
                />

                <span
                  style={{
                    ...F,
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#2d3648",
                  }}
                >
                  تأكيد حذف جميع البيانات
                </span>
              </div>

              <button
                type="button"
                onClick={closeResetModal}
                disabled={resetting}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            {/* Body */}

            <div className="p-6 flex flex-col gap-4">
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                style={{
                  ...F,
                  fontSize: 13,
                  color: "#991b1b",
                  lineHeight: 1.8,
                }}
              >
                ⚠️ هذا الإجراء سيحذف نهائيًا:

                <br />

                • جميع الخطابات ومرفقاتها

                <br />

                • جميع الأفراد المسجلين (ماعدا
                حساب الأدمن)

                <br />

                • جميع الحسابات المرتبطة بهم

                <br />
                <br />

                <strong>
                  لا يمكن التراجع عن هذا الإجراء
                  بعد التنفيذ.
                </strong>
              </div>

              {resetError && (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                  style={{
                    ...F,
                    fontSize: 13,
                    color: "#b91c1c",
                  }}
                >
                  {resetError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="reset-confirm"
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#2d3648",
                  }}
                >
                  للتأكيد، اكتب العبارة التالية
                  بالضبط:
                  <strong className="mr-1">
                    {RESET_CONFIRM_PHRASE}
                  </strong>
                </label>

                <input
                  id="reset-confirm"
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) =>
                    setResetConfirmText(
                      e.target.value
                    )
                  }
                  dir="rtl"
                  disabled={resetting}
                  className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#dc2626] disabled:opacity-60"
                  style={{
                    ...F,
                    fontSize: 15,
                    color: "#2d3648",
                  }}
                />
              </div>
            </div>

            {/* Footer */}

            <div className="px-6 py-4 border-t border-[#e2e7f0] flex items-center gap-3">
              <button
                type="button"
                onClick={closeResetModal}
                disabled={resetting}
                className="px-5 h-11 rounded-xl border border-[#cbd5e1] text-[#475569] hover:bg-gray-50 disabled:opacity-50"
                style={{
                  ...F,
                  fontSize: 14,
                }}
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleResetSystem}
                disabled={
                  resetting ||
                  resetConfirmText.trim() !==
                    RESET_CONFIRM_PHRASE
                }
                className="px-6 h-11 rounded-xl text-white flex items-center gap-2 disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(to bottom,#e3282c,#991b1b)",
                  ...F,
                  fontSize: 14,
                }}
              >
                {resetting && (
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />
                )}

                {resetting
                  ? "جاري الحذف..."
                  : "تأكيد الحذف النهائي"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}