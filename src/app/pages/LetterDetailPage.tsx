import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Trash2,
  Printer,
  Upload,
  FileText,
  X,
  Loader2,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};
const toArabicDigits = (value: string | number): string => {
  return String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
};

/* =========================================================
   TYPES
========================================================= */

type LetterStatus = "موثق" | "غير موثق";

type Soldier = {
  militaryId: string;
  rank: string;
  name: string;
  unit: string;
  attachmentUnit: string;
};

type LetterView = {
  id: string;
  type: string;
  letterNumber: string;
  destination: string;
  date: string;
  soldiersCount: number;
  soldiers: Soldier[];
  status: LetterStatus;
};

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: LetterStatus;
}) {
  const isVerified = status === "موثق";

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
      style={{
        background: isVerified ? "#dcfce7" : "#fce9ea",
        ...F,
        fontSize: 12,
        fontWeight: 700,
        color: isVerified ? "#166534" : "#9d2e15",
        whiteSpace: "nowrap",
      }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{
          background: isVerified ? "#16a34a" : "#E37032",
        }}
      />
      {status}
    </span>
  );
}

/* =========================================================
   SORT ICON
========================================================= */

function SortIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 3v10M8 13l-3-3M8 13l3-3"
        stroke="#A0ABC0"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   INFO PAIR
========================================================= */

function InfoPair({
  label,
  value,
  badge,
}: {
  label: string;
  value?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-2 justify-start"
      dir="rtl"
    >
      <span
        style={{
          ...F,
          fontSize: 16,
          color: "#717d96",
          minWidth: 100,
          textAlign: "right",
        }}
      >
        {label}
      </span>

      <span
        style={{
          ...F,
          fontSize: 16,
          color: "#172e78",
        }}
      >
        :
      </span>

      {badge ?? (
        <span
          style={{
            ...F,
            fontSize: 16,
            color: "#2d3648",
          }}
        >
          {value || "-"}
        </span>
      )}
    </div>
  );
}

/* =========================================================
   SIGNED FILE PREVIEW
========================================================= */

function SignedFilePreview({
  url,
  fileType,
}: {
  url: string;
  fileType?: string;
}) {
  if (!url) return null;

  const isPdf =
    fileType === "application/pdf" ||
    url.toLowerCase().includes(".pdf");

  if (isPdf) {
    return (
      <div className="w-full rounded-[12px] overflow-hidden border border-[#e2e7f0] bg-white">
        <iframe
          src={url}
          title="الخطاب الموقع"
          className="w-full"
          style={{
            height: "700px",
            border: "none",
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <img
        src={url}
        alt="صورة الخطاب الموقع"
        className="max-w-full rounded-[12px] border border-[#e2e7f0]"
        style={{
          maxHeight: "700px",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

/* =========================================================
   UPLOAD AREA
========================================================= */

function UploadArea({
  letterId,
  onSave,
}: {
  letterId: string;
  onSave: (fileUrl: string, fileType: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleFile(f: File) {
    setError("");

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      'application/pdf'
    ];

    if (!allowedTypes.includes(f.type)) {
      setError(
        "نوع الملف غير مدعوم. يرجى اختيار PDF أو JPG أو PNG."
      );
      return;
    }

    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  }

  async function handleSave() {
    if (!file) {
      setError("يرجى اختيار صورة الخطاب الموقع أولاً.");
      return;
    }

    if (!letterId) {
      setError("معرف الخطاب غير موجود.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      /* =====================================================
         1. CURRENT USER
      ===================================================== */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("يجب تسجيل الدخول أولاً.");
      }

      /* =====================================================
         2. GET LETTER
         مهم: نجيب letter_number لاستخدامه في Audit Log
      ===================================================== */

      const {
        data: existingLetter,
        error: existingLetterError,
      } = await supabase
        .from("letters")
        .select("id,status,letter_number")
        .eq("id", letterId)
        .maybeSingle();

      if (existingLetterError) {
        throw new Error(
          `فشل قراءة الخطاب: ${existingLetterError.message}`
        );
      }

      if (!existingLetter) {
        throw new Error(
          "لم يتم العثور على الخطاب في قاعدة البيانات."
        );
      }

      /* =====================================================
         3. FILE PATH
      ===================================================== */

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "file";

      const filePath =
        `${letterId}/signed-${Date.now()}.${extension}`;

      /* =====================================================
         4. STORAGE UPLOAD
      ===================================================== */

      const { error: uploadError } =
        await supabase.storage
          .from("letter-attachments")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

      if (uploadError) {
        throw new Error(
          `فشل رفع الملف: ${uploadError.message}`
        );
      }

      /* =====================================================
         5. SAVE ATTACHMENT
      ===================================================== */

      const { error: attachmentError } =
        await supabase
          .from("letter_attachments")
          .insert({
            letter_id: letterId,
            file_path: filePath,
            file_name: file.name,
            file_type: file.type,
            uploaded_by: user.id,
          });

      if (attachmentError) {
        // حذف الملف من Storage إذا فشل حفظ بيانات المرفق
        await supabase.storage
          .from("letter-attachments")
          .remove([filePath]);

        throw new Error(
          `فشل حفظ بيانات الصورة: ${attachmentError.message}`
        );
      }

      /* =====================================================
         6. UPDATE LETTER STATUS
         تحويل حالة الخطاب إلى موثق
      ===================================================== */

      const { error: updateError } =
        await supabase
          .from("letters")
          .update({
            status: "DOCUMENTED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", letterId);

      if (updateError) {
        throw new Error(
          `تم رفع الصورة ولكن فشل تحديث حالة الخطاب: ${updateError.message}`
        );
      }

      /* =====================================================
         7. AUDIT LOG
         تسجيل عملية توثيق الخطاب
      ===================================================== */

      const auditUserName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "مستخدم غير معروف";

      const letterNumber =
        existingLetter.letter_number != null
          ? String(existingLetter.letter_number)
          : letterId;

      const auditDetails =
        `تم رفع النسخة الموثقة للخطاب رقم ${letterNumber} ` +
        `وتحويل حالة الخطاب إلى موثق. ` +
        `اسم الملف: ${file.name}`;

      const { error: auditError } =
        await supabase
          .from("audit_logs")
          .insert({
            user_id: user.id,
            user_name: auditUserName,
            action_type: "UPDATE",
            action: "توثيق خطاب",
            entity: "letters",
            details: auditDetails,
          });

      /*
       * مهم:
       * فشل الـ Audit لا يلغي عملية التوثيق،
       * لأن الخطاب بالفعل تم رفعه وتحويل حالته إلى موثق.
       */
      if (auditError) {
        console.error(
          "AUDIT LOG ERROR:",
          auditError
        );
      }

      /* =====================================================
         8. CREATE SIGNED URL
      ===================================================== */

      const {
        data: signedUrlData,
        error: signedUrlError,
      } = await supabase.storage
        .from("letter-attachments")
        .createSignedUrl(
          filePath,
          60 * 60 * 24
        );

      if (signedUrlError) {
        throw new Error(
          `تم حفظ الخطاب ولكن فشل إنشاء رابط الصورة: ${signedUrlError.message}`
        );
      }

      if (!signedUrlData?.signedUrl) {
        throw new Error(
          "تم حفظ الخطاب ولكن لم يتم الحصول على رابط الصورة."
        );
      }

      /* =====================================================
         9. SUCCESS
      ===================================================== */

      onSave(
        signedUrlData.signedUrl,
        file.type
      );

      setFile(null);

    } catch (err) {
      console.error(
        "LETTER SAVE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ غير متوقع أثناء حفظ الخطاب."
      );

    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* =====================================================
          MESSAGE
      ===================================================== */}

      <div
        className="text-center"
        dir="rtl"
      >
        <p
          style={{
            ...F,
            fontSize: 16,
            color: "#1a1a1a",
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          هذا الخطاب غير موثق حتى الآن.
        </p>

        <p
          style={{
            ...F,
            fontSize: 16,
            color: "#1a1a1a",
            fontWeight: 700,
          }}
        >
          يرجى رفع النسخة المصدق عليها لاستكمال الإجراءات.
        </p>
      </div>

      {/* =====================================================
          UPLOAD AREA
      ===================================================== */}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => {
          setDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => {
          if (!saving) {
            inputRef.current?.click();
          }
        }}
        className="w-full rounded-[12px] flex flex-col items-center justify-center gap-3 py-8 px-4 cursor-pointer transition-colors"
        style={{
          border: `2px dashed ${
            dragging ? "#395945" : "#cbd2e0"
          }`,
          background: dragging
            ? "#f0f4ff"
            : "#fff",
        }}
      >

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          hidden
          onChange={(e) => {
            const selectedFile =
              e.target.files?.[0];

            if (selectedFile) {
              handleFile(selectedFile);
            }
          }}
        />

        {file ? (
          <div
            className="flex items-center gap-3"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <FileText
              size={24}
              style={{
                color: "#395945",
              }}
            />

            <span
              style={{
                ...F,
                fontSize: 14,
                color: "#2d3648",
              }}
            >
              {file.name}
            </span>

            <button
              type="button"
              disabled={saving}
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
            >
              <X
                size={16}
                style={{
                  color: "#ef4444",
                }}
              />
            </button>
          </div>
        ) : (
          <>
            <Upload
              size={28}
              style={{
                color: "#395945",
              }}
            />

            <p
              style={{
                ...F,
                fontSize: 14,
                color: "#4a5468",
                textAlign: "center",
              }}
            >
              اسحب الملف هنا أو تصفح
            </p>

            <p
              style={{
                ...F,
                fontSize: 12,
                color: "#a1aebe",
              }}
            >
              أو
            </p>

            <button
              type="button"
              className="px-4 py-1.5 rounded-[6px] border border-[#395945]"
              style={{
                ...F,
                fontSize: 14,
                color: "#395945",
              }}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              تصفح الملفات
            </button>
          </>
        )}
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          dir="rtl"
          className="w-full rounded-[8px] px-4 py-3"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            ...F,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* =====================================================
          SAVE BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !file}
        className="w-full h-[52px] rounded-[8px] flex items-center justify-center gap-2"
        style={{
          background:
            saving || !file
              ? "#9ca3af"
              : "linear-gradient(to bottom, #00b867, #00522e)",
          cursor:
            saving || !file
              ? "not-allowed"
              : "pointer",
        }}
      >
        {saving && (
          <Loader2
            size={18}
            className="animate-spin"
            style={{
              color: "#fff",
            }}
          />
        )}

        <span
          style={{
            ...F,
            fontSize: 16,
            color: "#fff",
          }}
        >
          {saving
            ? "جاري حفظ الخطاب..."
            : "حفظ التعديلات"}
        </span>
      </button>

    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export function LetterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [letter, setLetter] =
    useState<LetterView | null>(null);

  const [saved, setSaved] = useState(false);

  const [signedFileUrl, setSignedFileUrl] =
    useState("");

  const [signedFileType, setSignedFileType] =
    useState("");

  // ✅ رابط صورة المعاينة المؤقتة (PNG) الناتجة عن تحويل معاينة
  // الخطاب وقت الحفظ، وتُستخدم للطباعة لحين رفع النسخة الموقعة.
  const [previewImageUrl, setPreviewImageUrl] =
    useState("");

  /* =======================================================
     LOAD LETTER
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadLetterData() {
      if (!id) {
        setLoadError("معرف الخطاب غير موجود.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError("");

        /* =================================================
           1. LETTER
        ================================================= */

        const {
          data: dbLetter,
          error: letterError,
        } = await supabase
          .from("letters")
          .select(`
            id,
            letter_number,
            letter_type_id,
            letter_date,
            issuing_unit_id,
            attachment_unit_id,
            personnel_count,
            status,
            reason,
            branch_head_id,
            branch_head_name,
            branch_head_rank,
            preview_image_path
          `)
          .eq("id", id)
          .maybeSingle();

        if (letterError) {
          throw new Error(
            `فشل قراءة الخطاب: ${letterError.message}`
          );
        }

        if (!dbLetter) {
          throw new Error(
            "لم يتم العثور على الخطاب في قاعدة البيانات."
          );
        }

        /* =================================================
           2. LETTER TYPE
        ================================================= */

        const {
          data: letterType,
          error: letterTypeError,
        } = await supabase
          .from("letter_types")
          .select("id,name,code")
          .eq("id", dbLetter.letter_type_id)
          .maybeSingle();

        if (letterTypeError) {
          throw new Error(
            `فشل قراءة نوع الخطاب: ${letterTypeError.message}`
          );
        }

        /* =================================================
           3. ISSUING UNIT
        ================================================= */

        let destination = "";

        if (dbLetter.issuing_unit_id) {
          const {
            data: issuingUnit,
            error: issuingUnitError,
          } = await supabase
            .from("units")
            .select("id,name,code")
            .eq("id", dbLetter.issuing_unit_id)
            .maybeSingle();

          if (issuingUnitError) {
            throw new Error(
              `فشل قراءة جهة الخطاب: ${issuingUnitError.message}`
            );
          }

          destination =
            issuingUnit?.name ||
            issuingUnit?.code ||
            "";
        }

        /* =================================================
           4. LETTER PERSONNEL
        ================================================= */

        const {
          data: letterPersonnel,
          error: letterPersonnelError,
        } = await supabase
          .from("letter_personnel")
          .select("personnel_id,created_at")
          .eq("letter_id", id)
          .order("created_at", {
            ascending: true,
          });

        if (letterPersonnelError) {
          throw new Error(
            `فشل قراءة أفراد الخطاب: ${letterPersonnelError.message}`
          );
        }

        const personnelIds =
          (letterPersonnel || [])
            .map((item) => item.personnel_id)
            .filter(Boolean);

        /* =================================================
           5. PERSONNEL
        ================================================= */

        let personnelRows: any[] = [];

        if (personnelIds.length > 0) {
          const {
            data,
            error,
          } = await supabase
            .from("personnel")
            .select(`
              id,
              full_name,
              military_number,
              rank_id,
              primary_unit_id,
              attachment_unit_id
            `)
            .in("id", personnelIds);

          if (error) {
            throw new Error(
              `فشل قراءة بيانات الأفراد: ${error.message}`
            );
          }

          personnelRows = data || [];
        }

        /* =================================================
           6. RANKS
        ================================================= */

        const rankIds = [
          ...new Set(
            personnelRows
              .map((person) => person.rank_id)
              .filter(Boolean)
          ),
        ];

        let rankRows: any[] = [];

        if (rankIds.length > 0) {
          const {
            data,
            error,
          } = await supabase
            .from("ranks")
            .select("id,name,code")
            .in("id", rankIds);

          if (error) {
            throw new Error(
              `فشل قراءة الرتب: ${error.message}`
            );
          }

          rankRows = data || [];
        }

        /* =================================================
           7. UNITS
        ================================================= */

        const unitIds = [
          ...new Set(
            personnelRows
              .flatMap((person) => [
                person.primary_unit_id,
                person.attachment_unit_id,
              ])
              .filter(Boolean)
          ),
        ];

        let unitRows: any[] = [];

        if (unitIds.length > 0) {
          const {
            data,
            error,
          } = await supabase
            .from("units")
            .select("id,name,code")
            .in("id", unitIds);

          if (error) {
            throw new Error(
              `فشل قراءة الوحدات: ${error.message}`
            );
          }

          unitRows = data || [];
        }

        /* =================================================
           8. MAP LOOKUPS
        ================================================= */

        const rankMap = new Map(
          rankRows.map((rank) => [
            rank.id,
            rank.name || rank.code || "",
          ])
        );

        const unitMap = new Map(
          unitRows.map((unit) => [
            unit.id,
            unit.name || unit.code || "",
          ])
        );

        const personnelMap = new Map(
          personnelRows.map((person) => [
            person.id,
            person,
          ])
        );

        /* =================================================
           9. BUILD SOLDIERS
        ================================================= */

      const soldiers: Soldier[] =
  personnelIds
    .map((personnelId) => {
      const person =
        personnelMap.get(personnelId);

      if (!person) return null;

      return {
        militaryId:
          person.military_number || "-",

        rank:
          rankMap.get(person.rank_id) || "-",

        name:
          person.full_name || "-",

        unit:
          unitMap.get(
            person.primary_unit_id
          ) || "-",

        attachmentUnit:
          unitMap.get(
            person.attachment_unit_id
          ) || "-",
      };
    })
    .filter(Boolean) as Soldier[];

        /* =================================================
           10. LATEST ATTACHMENT
        ================================================= */

        const {
          data: attachment,
          error: attachmentError,
        } = await supabase
          .from("letter_attachments")
          .select(`
            id,
            file_path,
            file_name,
            file_type,
            uploaded_at
          `)
          .eq("letter_id", id)
          .order("uploaded_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (attachmentError) {
          throw new Error(
            `فشل قراءة مرفق الخطاب: ${attachmentError.message}`
          );
        }

        /* =================================================
           11. SIGNED URL (النسخة الموقعة الرسمية)
        ================================================= */

        let attachmentUrl = "";

        if (attachment?.file_path) {
          const {
            data: signedData,
            error: signedError,
          } = await supabase.storage
            .from("letter-attachments")
            .createSignedUrl(
              attachment.file_path,
              60 * 60 * 24
            );

          if (signedError) {
            console.error(
              "SIGNED URL ERROR:",
              signedError
            );
          } else {
            attachmentUrl =
              signedData?.signedUrl || "";
          }
        }

        /* =================================================
           11.b SIGNED URL (المعاينة المؤقتة PNG)
        ================================================= */

        let previewUrl = "";

        if (dbLetter.preview_image_path) {
          const {
            data: previewSignedData,
            error: previewSignedError,
          } = await supabase.storage
            .from("letter-attachments")
            .createSignedUrl(
              dbLetter.preview_image_path,
              60 * 60 * 24
            );

          if (previewSignedError) {
            console.error(
              "PREVIEW SIGNED URL ERROR:",
              previewSignedError
            );
          } else {
            previewUrl =
              previewSignedData?.signedUrl || "";
          }
        }

        /* =================================================
           12. STATUS
        ================================================= */

        const documented =
          dbLetter.status === "DOCUMENTED";

        /* =================================================
           13. BUILD VIEW MODEL
        ================================================= */

        const viewLetter: LetterView = {
          id: dbLetter.id,

          type:
            letterType?.name ||
            letterType?.code ||
            "-",

          letterNumber:
            String(dbLetter.letter_number),

          destination:
            destination || "-",

          date:
            dbLetter.letter_date || "-",

          soldiersCount:
            dbLetter.personnel_count ??
            soldiers.length,

          soldiers,

          status:
            documented
              ? "موثق"
              : "غير موثق",
        };

        if (!mounted) return;

        setLetter(viewLetter);
        setSaved(documented);

        setSignedFileUrl(
          attachmentUrl
        );

        setSignedFileType(
          attachment?.file_type || ""
        );

        setPreviewImageUrl(previewUrl);

      } catch (error) {
        console.error(
          "LOAD LETTER DATA ERROR:",
          error
        );

        if (mounted) {
          setLetter(null);
          setSaved(false);
          setSignedFileUrl("");
          setSignedFileType("");
          setPreviewImageUrl("");

          setLoadError(
            error instanceof Error
              ? error.message
              : "حدث خطأ أثناء تحميل بيانات الخطاب."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadLetterData();

    return () => {
      mounted = false;
    };
  }, [id]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-20"
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          <Loader2
            size={24}
            className="animate-spin"
            style={{
              color: "#395945",
            }}
          />

          <span
            style={{
              ...F,
              fontSize: 16,
              color: "#4a5468",
            }}
          >
            جاري تحميل بيانات الخطاب...
          </span>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (!letter) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-4"
        dir="rtl"
      >
        <FileText
          size={45}
          style={{
            color: "#395945",
          }}
        />

        <p
          style={{
            ...F,
            fontSize: 18,
            color: "#717d96",
            textAlign: "center",
          }}
        >
          {loadError ||
            "لم يتم العثور على الخطاب."}
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/dashboard/letters-archive"
            )
          }
          className="px-6 py-2 rounded-[8px] border border-[#395945]"
          style={{
            ...F,
            fontSize: 15,
            color: "#1f3d97",
          }}
        >
          العودة لسجل الخطابات
        </button>
      </div>
    );
  }

  /* =======================================================
     STATUS
  ======================================================= */

  const isVerified =
    saved || letter.status === "موثق";

  const thClass =
    "px-4 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]";

  const tdClass =
    "px-4 py-3 text-right border-b border-[#e2e7f0]";

  /* =======================================================
     TOP PRINT BUTTON (بجانب الحذف)
     ✅ لو الخطاب موثق ويوجد ملف موقع → يطبع الملف الموقع.
     ✅ لو غير موثق ويوجد معاينة مؤقتة (PNG) → يطبع المعاينة.
     ✅ غير كده → يطبع الصفحة كاملة كـ fallback أخير.
  ======================================================= */
/* =========================================================
   قياس ارتفاع الصورة (بالمليمتر) لو اتطبعت بعرض ورقة A4
   الفعلي، عشان نقرر: نسختين في ورقة واحدة، ولا كل نسخة في
   ورقة كاملة منفصلة.
========================================================= */

function measureImageHeightMM(url: string): Promise<number> {
  // عرض منطقة الطباعة: A4 = 210مم، ناقص هامشين 5مم (حسب
  // @page margin: 5mm المستخدم في الطباعة هنا)
  const CONTENT_WIDTH_MM = 200;

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        resolve(0);
        return;
      }

      const ratio = img.naturalHeight / img.naturalWidth;
      resolve(ratio * CONTENT_WIDTH_MM);
    };

    img.onerror = () => {
      // لو فشل تحميل الصورة لأي سبب، نرجّع 0 عشان الكود
      // يكمل عادي بوضع "نسختين في ورقة واحدة" الافتراضي
      resolve(0);
    };

    img.src = url;
  });
}
   async function handleTopPrint() {
    const printUrl = isVerified
      ? signedFileUrl
      : previewImageUrl;

    const pdfTitle = `خطاب ${letter.type} ${toArabicDigits(
      letter.letterNumber
    )} ${letter.destination}`.trim();

    if (!printUrl) {
      const originalTitle = document.title;
      document.title = pdfTitle;
      window.print();
      document.title = originalTitle;
      return;
    }

    // ⚠️ لازم نفتح النافذة فورًا هنا (قبل أي await)، وإلا
    // متصفحات زي Safari هتمنع النافذة باعتبارها popup غير
    // مرتبط مباشرة بضغطة المستخدم
    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=1200"
    );

    if (!printWindow) {
      alert(
        "يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة."
      );
      return;
    }

    const isPdf =
      (isVerified &&
        signedFileType === "application/pdf") ||
      printUrl.toLowerCase().includes(".pdf");

    // ---------------------------------------------------
    // نبني محتوى الطباعة حسب الحالة
    // ---------------------------------------------------

    let printBody = "";

    if (isPdf) {
      printBody = `<iframe src="${printUrl}"></iframe>`;
    } else if (!isVerified) {
      // ✅ الخطاب غير موثق (معاينة مؤقتة PNG) — نقيس الصورة
      // الأول قبل ما نقرر شكل الطباعة
      const heightMM = await measureImageHeightMM(printUrl);

      // المساحة المتاحة لكل نسخة في وضع "نسختين بورقة واحدة"
      // تقريبًا 143مم (287مم متاحة ÷ 2)، وبنستخدم سقف أقل
      // كهامش أمان قبل التحويل لوضع "ورقة لكل نسخة"
      const MAX_HEIGHT_FOR_TWO_PER_PAGE_MM = 130;

      const fitsTwoPerPage =
        heightMM > 0 &&
        heightMM <=
          MAX_HEIGHT_FOR_TWO_PER_PAGE_MM;

      printBody = fitsTwoPerPage
        ? `
            <div class="page">
              <div class="copy">
                <img src="${printUrl}" alt="نسخة 1" />
              </div>

              <div class="cut-line"></div>

              <div class="copy">
                <img src="${printUrl}" alt="نسخة 2" />
              </div>
            </div>
          `
        : `
            <div class="full-page-copy">
              <img src="${printUrl}" alt="نسخة 1" />
            </div>

            <div class="page-break"></div>

            <div class="full-page-copy">
              <img src="${printUrl}" alt="نسخة 2" />
            </div>
          `;
    } else {
      printBody = `<img src="${printUrl}" alt="الخطاب الموثق" />`;
    }

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>${pdfTitle}</title>

          <style>
            @page {
              size: A4;
              margin: 5mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              background: #fff;
            }

            /* وضع "نسختين في ورقة واحدة" */

            .page {
              width: 100%;
              height: calc(297mm - 10mm);
              display: flex;
              flex-direction: column;
            }

            .copy {
              flex: 1;
              display: flex;
              justify-content: center;
              align-items: center;
              overflow: hidden;
            }

            .copy img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }

            .cut-line {
              border-top: 2px solid #fff;
              margin: 2mm 0;
            }

            /* وضع "ورقة كاملة لكل نسخة" */

            .full-page-copy {
              width: 100%;
              height: calc(297mm - 10mm);
              display: flex;
              justify-content: center;
              align-items: center;
              overflow: hidden;
            }

            .full-page-copy img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }

            .page-break {
              page-break-before: always;
              break-before: page;
              height: 0;
            }

            body {
              direction: rtl;
            }

            img {
              display: block;
              width: 100%;
              height: auto;
            }

            iframe {
              width: 100%;
              height: 100vh;
              border: none;
            }
          </style>
        </head>

        <body>
          ${printBody}
        </body>
      </html>
    `);

    printWindow.document.close();

    const doPrint = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };

    if (
      printWindow.document.readyState ===
      "complete"
    ) {
      doPrint();
    } else {
      printWindow.onload = doPrint;
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="flex flex-col gap-6 w-full pb-10"
      dir="rtl"
    >

      {/* ===================================================
          TITLE
      =================================================== */}

      <h1
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(22px,4vw,32px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        بيانات الخطاب
      </h1>

      {/* ===================================================
          LETTER DATA
      =================================================== */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">

        <div
          className="flex items-center justify-between px-5 py-4 border-b border-[#e2e7f0]"
          dir="rtl"
        >
          <span
            style={{
              ...F,
              fontSize: 16,
              color: "#4a5468",
            }}
          >
            بيانات الخطاب
          </span>

          <div className="flex items-center gap-3">

            <button
              type="button"
              title="طباعة"
              onClick={handleTopPrint}
              className="w-9 h-9 rounded-[8px] flex items-center justify-center"
              style={{
                backgroundColor: "#ebedfd",
              }}
            >
              <Printer
                size={15}
                style={{
                  color: "#2d3648",
                }}
              />
            </button>

            <button
              type="button"
              title="حذف"
              onClick={() =>
                navigate(
                  "/dashboard/letters-archive"
                )
              }
              className="w-9 h-9 rounded-[8px] flex items-center justify-center"
              style={{
                backgroundColor: "#fce8f1",
              }}
            >
              <Trash2
                size={15}
                style={{
                  color: "#e3282c",
                }}
              />
            </button>

          </div>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 px-6 py-5"
          dir="rtl"
        >

          <InfoPair
            label="نوع الخطاب"
            value={letter.type}
          />

          <InfoPair
            label="رقم الخطاب"
            value={letter.letterNumber}
          />

          <InfoPair
            label="جهة الخطاب"
            value={letter.destination}
          />

          <InfoPair
            label="تاريخ الخطاب"
            value={letter.date}
          />

          <InfoPair
            label="حالة الخطاب"
            badge={
              <StatusBadge
                status={
                  isVerified
                    ? "موثق"
                    : "غير موثق"
                }
              />
            }
          />

          <InfoPair
            label="عدد الأفراد"
            value={String(
              letter.soldiersCount
            )}
          />

        </div>
      </section>

      {/* ===================================================
          PERSONNEL
      =================================================== */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">

        <div className="flex items-center justify-start px-5 py-4 border-b border-[#e2e7f0]">
          <span
            style={{
              ...F,
              fontSize: 16,
              color: "#4a5468",
            }}
          >
            بيانات الأفراد
          </span>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[450px] border-collapse">

            <thead>
              <tr>

                {[
                  "م",
                  "درجة",
                    "رقم عسكري",
                  "اسم",
                  "الوحدة",
                  "وحدة الإلحاق",
                ].map((h) => (
                  <th
                    key={h}
                    className={thClass}
                  >
                    <div className="flex items-start gap-1 justify-start">

                      <span
                        style={{
                          ...F,
                          fontSize: 14,
                          color: "#717d96",
                        }}
                      >
                        {h}
                      </span>

                      <SortIcon />

                    </div>
                  </th>
                ))}

              </tr>
            </thead>

            <tbody>

             {letter.soldiers.length > 0 ? (
  letter.soldiers.map(
    (soldier, idx) => (
      <tr
        key={idx}
        className="hover:bg-[#fafbff]"
      >

        <td className={tdClass}>
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#2d3648",
            }}
          >
            {toArabicDigits(idx + 1)}
          </span>
        </td>

        <td className={tdClass}>
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#2d3648",
            }}
          >
            {toArabicDigits(soldier.militaryId)}
          </span>
        </td>

        <td className={tdClass}>
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#2d3648",
            }}
          >
            {soldier.rank}
          </span>
        </td>

                      <td className={tdClass}>
                        <span
                          style={{
                            ...F,
                            fontSize: 14,
                            color: "#2d3648",
                          }}
                        >
                          {soldier.name}
                        </span>
                      </td>

                      <td className={tdClass}>
                        <span
                          style={{
                            ...F,
                            fontSize: 14,
                            color: "#2d3648",
                          }}
                        >
                          {soldier.unit}
                        </span>
                      </td>

                      <td className={tdClass}>
                        <span
                          style={{
                            ...F,
                            fontSize: 14,
                            color: "#2d3648",
                          }}
                        >
                          {soldier.attachmentUnit}
                        </span>
                      </td>

                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center"
                  >
                    <span
                      style={{
                        ...F,
                        fontSize: 14,
                        color: "#717d96",
                      }}
                    >
                      لا يوجد أفراد مرتبطون بهذا الخطاب.
                    </span>
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>
      </section>

      {/* ===================================================
          SIGNED LETTER
      =================================================== */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">

        <div className="flex items-center justify-start px-5 py-4 border-b border-[#e2e7f0]">

          <span
            style={{
              ...F,
              fontSize: 16,
              color: "#4a5468",
            }}
          >
            صورة الخطاب
          </span>

        </div>

        <div className="px-6 py-6 flex flex-col gap-5">

          {isVerified ? (

            <>

              {signedFileUrl ? (
                <SignedFilePreview
                  url={signedFileUrl}
                  fileType={signedFileType}
                />
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-10"
                  dir="rtl"
                >
                  <FileText
                    size={45}
                    style={{
                      color: "#395945",
                    }}
                  />

                  <p
                    style={{
                      ...F,
                      marginTop: 12,
                      fontSize: 15,
                      color: "#4a5468",
                    }}
                  >
                    الخطاب موثق ولكن لم يتم العثور على المرفق.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleTopPrint}
                className="w-full h-[52px] rounded-[8px] flex items-center justify-center gap-2"
                style={{
                  background:
                    "linear-gradient(to bottom, #00b867, #00522e)",
                }}
              >
                <Printer
                  size={18}
                  style={{
                    color: "#fff",
                  }}
                />

                <span
                  style={{
                    ...F,
                    fontSize: 16,
                    color: "#fff",
                  }}
                >
                  طباعة نسخة الخطاب
                </span>

              </button>

            </>

          ) : (

            <>

              {/* ===========================================
                  معاينة مؤقتة (PNG) لحين رفع النسخة الموقعة
              =========================================== */}

              {previewImageUrl && (
                <div className="flex flex-col gap-3">

                  <div
                    className="w-full rounded-[10px] px-4 py-2.5"
                    dir="rtl"
                    style={{
                      background: "#fff8e8",
                      border: "1px solid #f4d58d",
                    }}
                  >
                    <span
                      style={{
                        ...F,
                        fontSize: 13,
                        color: "#8a6500",
                      }}
                    >
                      معاينة مؤقتة للخطاب — سيتم استبدالها
                      بالنسخة الموقعة بعد رفعها.
                    </span>
                  </div>

                  <div className="w-full flex justify-center">
                    <img
                      src={previewImageUrl}
                      alt="معاينة مؤقتة للخطاب"
                      className="max-w-full rounded-[12px] border border-[#e2e7f0]"
                      style={{
                        maxHeight: "500px",
                        objectFit: "contain",
                      }}
                    />
                  </div>

                </div>
              )}

              <UploadArea
                letterId={id ?? ""}
                onSave={(
                  fileUrl,
                  fileType
                ) => {

                  setSignedFileUrl(
                    fileUrl
                  );

                  setSignedFileType(
                    fileType
                  );

                  setSaved(true);

                  setLetter(
                    (previous) =>
                      previous
                        ? {
                            ...previous,
                            status: "موثق",
                          }
                        : previous
                  );
                }}
              />

            </>

          )}

        </div>
      </section>

    </div>
  );
}