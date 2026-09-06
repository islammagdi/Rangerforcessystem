import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, RefreshCw, Upload, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/logActivity";

// ============================================================
// إعدادات ثابتة — نفس الـ bucket والمسار المستخدمين في صفحة
// "اضافة قوة جديدة" (EXCEL_TEMPLATE_URL)
// ============================================================

const BUCKET_NAME = "files";
const FILE_PATH = "Data.xlsx";

// ============================================================
// Style
// ============================================================

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ============================================================
// Types
// ============================================================

interface UploadedFile {
  name: string;
  size: string;
  raw: File;
}

interface CurrentFileInfo {
  name: string;
  size: string;
  updatedAt: string | null;
  signedUrl: string | null;
}

// ============================================================
// Helpers
// ============================================================

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)}KB`;
  }

  return `${bytes}B`;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "غير معروف";
  }

  try {
    return new Date(value).toLocaleString("ar-EG");
  } catch {
    return "غير معروف";
  }
}

// ============================================================
// Excel Icon (نفس المستخدم في صفحة اضافة قوة جديدة)
// ============================================================

function ExcelIcon({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: "#217346",
        borderRadius: 5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 800,
        fontSize: size * 0.42,
        fontFamily: "Arial",
      }}
    >
      X
    </div>
  );
}

// ============================================================
// Confirm Modal
// ============================================================

function ConfirmReplaceModal({
  fileName,
  onConfirm,
  onCancel,
  loading,
}: {
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      dir="rtl"
    >
      <div className="bg-white rounded-[16px] w-full max-w-[440px] p-6 flex flex-col gap-4">
        <p
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 18,
            color: "#2d3648",
          }}
        >
          تأكيد استبدال ملف القيد الموحّد
        </p>

        <p
          style={{
            ...F,
            fontSize: 14,
            color: "#4a5468",
            lineHeight: 1.7,
          }}
        >
          سيتم استبدال الملف الحالي فورًا بالملف{" "}
          <span style={{ fontWeight: 700 }}>{fileName}</span>. هذا الملف هو
          نفسه اللي بيتحمّله كل المستخدمين من صفحة "اضافة قوة جديدة"، وده
          إجراء لا يمكن التراجع عنه إلا برفع نسخة قديمة يدويًا مرة أخرى.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-[42px] px-5 rounded-[8px] border border-[#e2e7f0] hover:bg-[#f7f9fc] transition-colors disabled:opacity-50"
          >
            <span style={{ ...F, fontSize: 14, color: "#4a5468" }}>
              إلغاء
            </span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-[42px] px-5 rounded-[8px] flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(to bottom, #00b867, #00522e)",
            }}
          >
            <span style={{ ...F, fontSize: 14, color: "white" }}>
              {loading ? "جاري الاستبدال..." : "تأكيد الاستبدال"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export function ManageUnifiedRegistryPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const [currentFile, setCurrentFile] = useState<CurrentFileInfo | null>(
    null
  );
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [replacing, setReplacing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ----------------------------------------------------------
  // تحميل بيانات الملف الحالي (الاسم، الحجم، آخر تحديث، لينك تحميل)
  // ----------------------------------------------------------

  const loadCurrentFileInfo = useCallback(async () => {
    try {
      setLoadingInfo(true);

      const { data: listData, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list("", { search: FILE_PATH });

      if (listError) {
        throw listError;
      }

      const fileMeta = (listData ?? []).find(
        (item) => item.name === FILE_PATH
      );

      const { data: signedData, error: signedError } =
        await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(FILE_PATH, 60 * 60);

      if (signedError) {
        console.error("Signed URL error:", signedError);
      }

      setCurrentFile({
        name: FILE_PATH,
        size: fileMeta?.metadata?.size
          ? formatSize(Number(fileMeta.metadata.size))
          : "غير معروف",
        updatedAt: fileMeta?.updated_at ?? null,
        signedUrl: signedData?.signedUrl ?? null,
      });
    } catch (error) {
      console.error("Error loading current file info:", error);

      setFeedback({
        type: "error",
        message: "تعذر تحميل بيانات الملف الحالي من قاعدة التخزين",
      });
    } finally {
      setLoadingInfo(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentFileInfo();
  }, [loadCurrentFileInfo]);

  // ----------------------------------------------------------
  // اختيار الملف
  // ----------------------------------------------------------

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (!["xls", "xlsx"].includes(ext ?? "")) {
      setFeedback({
        type: "error",
        message: "الملفات المدعومة فقط هي ملفات الإكسيل (.xls, .xlsx)",
      });
      return;
    }

    setFeedback(null);

    setUploadedFile({
      name: file.name,
      size: formatSize(file.size),
      raw: file,
    });
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (file) {
      handleFile(file);
    }

    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  }

  // ----------------------------------------------------------
  // استبدال الملف في Supabase Storage (upsert على نفس المسار)
  // ----------------------------------------------------------

  async function handleConfirmReplace() {
    if (!uploadedFile) {
      return;
    }

    try {
      setReplacing(true);
      setFeedback(null);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(FILE_PATH, uploadedFile.raw, {
          upsert: true,
          cacheControl: "3600",
          contentType:
            uploadedFile.raw.type ||
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

      if (uploadError) {
        throw uploadError;
      }

      // تسجيل العملية في سجل الأنشطة
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .maybeSingle();

          const currentUserName =
            profile?.username ??
            sessionStorage.getItem("username") ??
            "مستخدم غير معروف";

          await logActivity({
            userId: user.id,
            userName: currentUserName,
            actionType: "UPDATE",
            action: "تحديث ملف القيد الموحّد",
            entity: "ملف القيد الموحّد",
            details: `تم استبدال ملف القيد الموحّد بواسطة ${currentUserName} — الملف الجديد: ${uploadedFile.name} (${uploadedFile.size})`,
          });
        }
      } catch (logError) {
        // فشل تسجيل النشاط لا يجب أن يوقف نجاح العملية نفسها
        console.error("Activity log error:", logError);
      }

      setFeedback({
        type: "success",
        message: "تم استبدال ملف القيد الموحّد بنجاح",
      });

      setUploadedFile(null);
      setShowConfirm(false);

      await loadCurrentFileInfo();
    } catch (error) {
      console.error("Error replacing file:", error);

      setFeedback({
        type: "error",
        message: "حدث خطأ أثناء استبدال الملف. حاول مرة أخرى",
      });
    } finally {
      setReplacing(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      {showConfirm && uploadedFile && (
        <ConfirmReplaceModal
          fileName={uploadedFile.name}
          loading={replacing}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirmReplace}
        />
      )}

      {/* Title */}

      <h1
        className="text-right w-full"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(24px, 4vw, 32px)",
          color: "#2d3648",
        }}
      >
        إدارة ملف القيد الموحّد
      </h1>

      {/* Feedback */}

      {feedback && (
        <div
          className={[
            "rounded-[12px] px-4 py-3 border",
            feedback.type === "success"
              ? "bg-[#ebfaea] border-[#bfe8bc]"
              : "bg-[#fff3f3] border-[#f4c4c4]",
          ].join(" ")}
        >
          <span
            style={{
              ...F,
              fontSize: 14,
              color: feedback.type === "success" ? "#26861d" : "#9a1010",
            }}
          >
            {feedback.message}
          </span>
        </div>
      )}

      {/* Current file card */}

      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full">
        <div className="flex flex-col gap-5 px-6 py-5">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#cbd2e0]">
            <span
              style={{
                ...F,
                fontWeight: 700,
                fontSize: 18,
                color: "#2d3648",
              }}
            >
              الملف الحالي المعتمد في المنظومة
            </span>

            <button
              type="button"
              onClick={loadCurrentFileInfo}
              disabled={loadingInfo}
              className="flex items-center gap-1.5 text-[#717d96] hover:text-[#2d3648] transition-colors disabled:opacity-50"
              title="تحديث"
            >
              <RefreshCw
                size={16}
                className={loadingInfo ? "animate-spin" : ""}
              />

              <span style={{ ...F, fontSize: 13 }}>تحديث</span>
            </button>
          </div>

          {loadingInfo ? (
            <p style={{ ...F, fontSize: 14, color: "#a0abc0" }}>
              جاري تحميل بيانات الملف...
            </p>
          ) : (
            <div className="flex items-center gap-3 bg-[#fafbff] border border-[#e7e7e7] rounded-[12px] px-4 py-3 w-full flex-wrap">
              <div className="shrink-0">
                <ExcelIcon size={32} />
              </div>

              <div className="flex flex-col items-start flex-1 min-w-[180px] gap-0.5">
                <p
                  style={{
                    ...F,
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#2d3648",
                  }}
                >
                  {currentFile?.name ?? "Data.xlsx"}
                </p>

                <p style={{ ...F, fontSize: 12, color: "#a0abc0" }}>
                  الحجم: {currentFile?.size ?? "غير معروف"} — آخر تحديث:{" "}
                  {formatDateTime(currentFile?.updatedAt ?? null)}
                </p>
              </div>

              {currentFile?.signedUrl && (
                <a
                  href={currentFile.signedUrl}
                  download="Data.xlsx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 shrink-0 group"
                >
                  <Download size={16} style={{ color: "#00b867" }} />

                  <span
                    className="group-hover:opacity-80 transition-opacity"
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#00522e",
                    }}
                  >
                    تحميل الملف الحالي
                  </span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload / replace card */}

      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full">
        <div className="flex flex-col gap-5 px-6 py-5">
          <div className="flex flex-col gap-1 items-start">
            <p
              style={{
                ...F,
                fontWeight: 700,
                fontSize: 18,
                color: "#2d3648",
              }}
            >
              رفع نسخة جديدة من ملف القيد الموحّد
            </p>

            <p
              style={{
                ...F,
                fontSize: 14,
                color: "#717d96",
                lineHeight: 1.6,
                textAlign: "right",
              }}
            >
              الملف الجديد هيستبدل الملف الحالي فورًا، وهيبقى هو نفسه اللي
              يظهر لكل المستخدمين لما يحمّلوا نموذج القيد الموحّد من صفحة
              "اضافة قوة جديدة".
            </p>
          </div>

          <div className="w-full h-px bg-[#efefef]" />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={[
              "flex flex-col items-center justify-center gap-4 py-10 px-6 rounded-[12px]",
              "border-2 border-dashed transition-colors cursor-default",
              dragOver
                ? "border-[#415844] bg-[#f0f3ff]"
                : "border-[#cbd2e0] bg-transparent",
            ].join(" ")}
          >
            <Upload size={42} strokeWidth={1.5} className="text-[#415844]" />

            <div className="flex flex-col items-center gap-3 w-full">
              <p style={{ ...F, fontSize: 14, color: "#5B795F" }}>
                اسحب ملف Excel هنا أو تصفح
              </p>

              <div className="flex items-center gap-3 w-[200px]">
                <div className="flex-1 h-px bg-[#e7e7e7]" />
                <span style={{ ...F, fontSize: 12, color: "#717d96" }}>
                  أو
                </span>
                <div className="flex-1 h-px bg-[#e7e7e7]" />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#f7f9fc] border border-[#415844] rounded-[8px] px-3 py-1.5 transition-colors hover:bg-[#eef1fd] active:opacity-80"
              >
                <span
                  style={{
                    ...F,
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#415844",
                  }}
                >
                  تصفح الملفات
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
          </div>

          <p style={{ ...F, fontSize: 12, color: "#717d96" }}>
            الملفات المدعومة فقط هي ملفات الإكسيل (.xls, .xlsx)
          </p>

          {uploadedFile && (
            <div className="flex items-center gap-3 bg-white border border-[#e7e7e7] rounded-[12px] px-4 py-3 w-full">
              <div className="shrink-0">
                <FileSpreadsheet size={28} className="text-[#217346]" />
              </div>

              <div className="flex flex-col items-end flex-1 min-w-0 gap-0.5">
                <p
                  className="w-full text-right truncate"
                  style={{ ...F, fontWeight: 700, fontSize: 12, color: "#2d3648" }}
                >
                  {uploadedFile.name}
                </p>

                <p
                  className="w-full text-right"
                  style={{ ...F, fontSize: 12, color: "#a0abc0" }}
                >
                  {uploadedFile.size}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setUploadedFile(null)}
                className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full hover:bg-[#f5f5f5] transition-colors"
              >
                <X size={16} className="text-[#717d96]" />
              </button>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={!uploadedFile || replacing}
              className="h-[44px] px-6 rounded-[8px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(to bottom, #00b867, #00522e)",
              }}
            >
              <span style={{ ...F, fontSize: 16, color: "#f5f5f5" }}>
                استبدال الملف الحالي
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}