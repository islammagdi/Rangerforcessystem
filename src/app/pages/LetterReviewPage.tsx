import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Download, Printer } from "lucide-react";
import type { CSSProperties } from "react";
import html2canvas from "html2canvas-pro";


import { supabase } from "../../lib/supabase";
import imgEagle from "figma:asset/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";


const F: CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};


// خط خاص بمعاينة/طباعة الخطاب فقط
const PF: CSSProperties = {
  fontFamily: "'Times New Roman', Times, serif",
};


/* =========================================================
   تحويل الأرقام الإنجليزية إلى أرقام عربية
========================================================= */


const toArabicDigits = (
  value: string | number | null | undefined
): string => {
  if (value === null || value === undefined) return "";


  return String(value).replace(/\d/g, (digit) => {
    return "٠١٢٣٤٥٦٧٨٩"[Number(digit)];
  });
};


type Soldier = {
  id: string;
  militaryId: string;
  name: string;
  rank: string;
  rankId: string;
  unit: string;
  unitId: string;
  attachmentUnit: string;
  attachmentUnitId: string | null;
  dischargeDate: string | null;
};


type LetterData = {
  destination: string;
  attachmentPlace: string;
  reason: string;
  issuingUnitId?: string;
  attachmentUnitId?: string;
};


type PageState = {
  letterType?: "attachment" | "end-attachment";
  letterTypeId?: string;
  letterTypeCode?: string;
  letterTypeName?: string;
  soldiers?: Soldier[];
  letterData?: LetterData;
};


/* =========================================================
   نتيجة عملية إنشاء ورفع المعاينة المؤقتة — تُستخدم للتشخيص
   ولمعرفة سبب الفشل بدقة بدل الاكتفاء بتسجيل الخطأ فقط.
========================================================= */


type PreviewResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "no-preview-element"
        | "capture-failed"
        | "tainted-canvas"
        | "empty-blob"
        | "upload-failed"
        | "db-update-failed";
    };


/* =========================================================
   تحويل عنصر الـ HTML الخاص بمعاينة الخطاب إلى PNG ورفعه
   كصورة مؤقتة لحين رفع النسخة الموقعة رسميًا.


   هذه الدالة "Best effort": أي فشل هنا لا يوقف عملية حفظ
   الخطاب نفسها، فقط يتم تسجيل الخطأ بالتفصيل في الـ console
   حتى يسهل تشخيص أي مشكلة مستقبلية (CORS / RLS / عمود مفقود...).
========================================================= */


async function generateAndUploadPreview(
  letterId: string
): Promise<PreviewResult> {
  console.log(
    "[PREVIEW] بدء إنشاء المعاينة المؤقتة لـ letterId:",
    letterId
  );


  const previewElement = document.querySelector(
    ".letter-preview"
  ) as HTMLElement | null;


  if (!previewElement) {
    console.warn(
      "[PREVIEW] لم يتم العثور على عنصر .letter-preview في الـ DOM — تخطي إنشاء المعاينة المؤقتة"
    );
    return { ok: false, reason: "no-preview-element" };
  }


  // -----------------------------------------------------
  // ✅ التأكد إن كل الصور جوه العنصر خلصت تحميل قبل الالتقاط
  // (خصوصًا شعار الجمهورية) — تفادي التقاط الصورة وهي لسه
  // بتتحمل، وهو سبب شائع لصور فاضية أو مقطوعة في النتيجة.
  // -----------------------------------------------------


  const images = Array.from(
    previewElement.querySelectorAll("img")
  );


  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();


      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(
            "[PREVIEW] فشل تحميل صورة داخل المعاينة:",
            img.src
          );
          resolve(); // نكمل حتى لو صورة واحدة فشلت تحميلها
        };
      });
    })
  );


  console.log(
    "[PREVIEW] كل الصور جاهزة، جاري الالتقاط بـ html2canvas..."
  );


  let canvas: HTMLCanvasElement;


  try {
    canvas = await html2canvas(previewElement, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: false,
      logging: true, // يطبع تفاصيل html2canvas الداخلية في الكونسول للتشخيص
    });
  } catch (captureError) {
    console.error(
      "[PREVIEW] فشل html2canvas أثناء الالتقاط:",
      captureError
    );
    return { ok: false, reason: "capture-failed" };
  }


  console.log(
    "[PREVIEW] تم الالتقاط بنجاح. أبعاد الـ canvas:",
    canvas.width,
    "x",
    canvas.height
  );


  let blob: Blob | null = null;


  try {
    blob = await new Promise<Blob | null>((resolve, reject) => {
      try {
        canvas.toBlob((b) => resolve(b), "image/png");
      } catch (taintedError) {
        // canvas.toBlob بيرمي SecurityError مباشرة لو الـ canvas
        // "tainted" بسبب صورة cross-origin بدون CORS headers صحيحة
        reject(taintedError);
      }
    });
  } catch (blobError) {
    console.error(
      "[PREVIEW] ⚠️ فشل تحويل الـ canvas إلى Blob — على الأرجح الـ canvas أصبح tainted بسبب صورة الشعار (imgEagle) التي لا تدعم CORS بشكل صحيح:",
      blobError
    );
    return { ok: false, reason: "tainted-canvas" };
  }


  if (!blob) {
    console.warn(
      "[PREVIEW] canvas.toBlob رجّع null بدون سبب واضح — تخطي رفع المعاينة المؤقتة"
    );
    return { ok: false, reason: "empty-blob" };
  }


  console.log(
    "[PREVIEW] تم إنشاء الـ Blob بنجاح. الحجم بالبايت:",
    blob.size
  );


  const previewPath = `${letterId}/preview.png`;


  console.log(
    "[PREVIEW] جاري رفع الملف إلى Storage على المسار:",
    previewPath
  );


  const { error: uploadError } = await supabase.storage
    .from("letter-attachments")
    .upload(previewPath, blob, {
      cacheControl: "3600",
      upsert: true,
      contentType: "image/png",
    });


  if (uploadError) {
    console.error(
      "[PREVIEW] ❌ فشل رفع الملف إلى Storage:",
      uploadError.message,
      uploadError
    );
    return { ok: false, reason: "upload-failed" };
  }


  console.log(
    "[PREVIEW] ✅ تم رفع الملف بنجاح، جاري تحديث جدول letters..."
  );


  const {
    error: updateError,
    data: updateData,
  } = await supabase
    .from("letters")
    .update({ preview_image_path: previewPath })
    .eq("id", letterId)
    .select("id, preview_image_path");


  if (updateError) {
    console.error(
      "[PREVIEW] ❌ فشل تحديث عمود preview_image_path — تحقق من وجود العمود في جدول letters وصلاحيات RLS للـ UPDATE:",
      updateError.message,
      updateError
    );
    return { ok: false, reason: "db-update-failed" };
  }


  console.log(
    "[PREVIEW] ✅ تم تحديث preview_image_path بنجاح:",
    updateData
  );


  return { ok: true };
}


/* =========================================================
   Loading Modal
========================================================= */


function LoadingModal() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,.45)" }}
    >
      <div
        className="bg-white rounded-[24px] flex flex-col items-center justify-center"
        style={{
          width: "clamp(320px,50vw,560px)",
          padding: "70px 40px",
        }}
        dir="rtl"
      >
        <div className="flex items-center gap-5">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="w-4 h-4 rounded-full"
              style={{
                background:
                  "linear-gradient(to bottom,#00B867,#00522E)",
                animation: `reviewBounce 1.2s ease-in-out ${
                  item * 0.2
                }s infinite`,
              }}
            />
          ))}
        </div>


        <p
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 32,
            color: "#122b16",
            marginTop: 30,
          }}
        >
          يرجى الانتظار
        </p>


        <p
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 20,
            color: "#404040",
            marginTop: 12,
          }}
        >
          يتم حفظ الجواب وتحديث بيانات الأفراد الآن
        </p>
      </div>


      <style>
        {`
          @keyframes reviewBounce {
            0%, 80%, 100% {
              transform: translateY(0);
              opacity: 1;
            }


            40% {
              transform: translateY(-14px);
              opacity: .7;
            }
          }
        `}
      </style>
    </div>
  );
}


/* =========================================================
   Success Modal
========================================================= */


function SuccessModal({
  letterNumber,
}: {
  letterNumber: number | null;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,.45)" }}
    >
      <div
        className="bg-white rounded-[24px] flex flex-col items-center justify-center text-center"
        style={{
          width: "clamp(320px,50vw,560px)",
          padding: "60px 40px",
        }}
        dir="rtl"
      >
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background:
              "linear-gradient(to bottom,#00B867,#00522E)",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: 50,
              fontWeight: 700,
            }}
          >
            ✓
          </span>
        </div>


        <p
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 32,
            color: "#122b16",
            marginTop: 30,
          }}
        >
          عملية ناجحة!
        </p>


        <p
          style={{
            ...F,
            fontWeight: 700,
            fontSize: 20,
            color: "#404040",
            marginTop: 15,
          }}
        >
          تم حفظ الخطاب وتحديث بيانات الأفراد بنجاح
        </p>


        {letterNumber !== null && (
          <p
            style={{
              ...F,
              fontWeight: 700,
              fontSize: 18,
              color: "#00522E",
              marginTop: 10,
            }}
          >
            رقم الخطاب: {toArabicDigits(letterNumber)}
          </p>
        )}


        <p
          style={{
            ...F,
            fontSize: 14,
            color: "#717d96",
            marginTop: 15,
          }}
        >
          جاري توجيهك للصفحة الرئيسية...
        </p>
      </div>
    </div>
  );
}


/* =========================================================
   Step Bubble
========================================================= */


function StepBubble({
  number,
  label,
  done,
  active,
}: {
  number: string;
  label: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center border-2"
        style={{
          borderColor: done
            ? "#00a85a"
            : active
              ? "#2d3648"
              : "#a1aebe",
          background: done ? "#00a85a" : "#fff",
        }}
      >
        <span
          style={{
            ...F,
            fontSize: 13,
            color: done ? "#fff" : "#2d3648",
          }}
        >
          {done ? "✓" : number}
        </span>
      </div>


      <span
        style={{
          ...F,
          fontSize: 14,
          color: done
            ? "#00864d"
            : active
              ? "#2d3648"
              : "#465668",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}


/* =========================================================
   Stepper
========================================================= */


function Stepper() {
  const steps = [
    "تحديد نوع الخطاب",
    "تحديد الأفراد",
    "بيانات الخطاب",
    "المراجعة والتصديق",
  ];


  return (
    <div
      className="flex items-start justify-center flex-wrap"
      dir="rtl"
    >
      {steps.map((step, index) => (
        <div key={step} className="flex items-start">
          <StepBubble
            number={`0${index + 1}`}
            label={step}
            done={index < 3}
            active={index === 3}
          />


          {index < 3 && (
            <div className="flex items-center gap-[3px] mt-4 mx-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[3px] h-[3px] rounded-full"
                  style={{ background: "#1A202C" }}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


/* =========================================================
   Info Pair
========================================================= */


function InfoPair({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          ...F,
          fontSize: 15,
          color: "#717d96",
        }}
      >
        {label}
      </span>


      <span
        style={{
          ...F,
          fontSize: 15,
          color: "#172e78",
        }}
      >
        :
      </span>


      <span
        style={{
          ...F,
          fontSize: 15,
          color: "#2d3648",
        }}
      >
        {value || "-"}
      </span>
    </div>
  );
}


/* =========================================================
   Letter Preview
========================================================= */


function LetterPreview({
  soldiers,
  destination,
  attachmentPlace,
  reason,
  letterType,
  branchHeadName,
  branchHeadRank,
}: {
  soldiers: Soldier[];
  destination: string;
  attachmentPlace: string;
  reason: string;
  letterType: string;
  branchHeadName: string;
  branchHeadRank: string;
}) {
  /* =======================================================
     التاريخ بالأرقام العربية
  ======================================================= */


  const today = toArabicDigits(
    new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  );


  return (
    <>
      <div
        className="bg-white border border-[#ddd] rounded-[4px] p-8 w-full max-w-[680px] mx-auto shadow-sm letter-preview"
        dir="rtl"
      >
        {/* رأس الخطاب */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            paddingBottom: 16,
            marginBottom: 16,
            borderBottom: "1px solid #ddd",
            width: "100%",
          }}
        >
          <div
            style={{
              ...PF,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <p
              style={{
                ...PF,
                fontSize: 14,
                fontWeight: 700,
                margin: 0,
                textAlign: "center",
              }}
            >
              قيادة قـــوات الصاعقــة
            </p>


            <p
              style={{
                ...PF,
                fontSize: 14,
                margin: "3px 0",
                textAlign: "center",
              }}
            >
              فــرع التنظيـــم والإدارة
            </p>


            <p
              style={{
                ...PF,
                fontSize: 14,
                margin: 0,
                textAlign: "center",
              }}
            >
              التاريخ : {today}
            </p>
          </div>


          {/* اللوجو */}
          <div className="print-logo" style={{ flexShrink: 0 }}>
            <img
              src={imgEagle}
              alt="شعار الجمهورية"
              crossOrigin="anonymous"
              style={{
                width: "200%",
                height: "200%",
                objectFit: "contain",
              }}
            />
          </div>
        </div>


        {/* =================================================
            الجهة
        ================================================= */}


        <p
          style={{
            ...PF,
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 14,
            textAlign: "center",
            width: "100%",
          }}
        >
          إلى / {toArabicDigits(destination || "...")}
        </p>


        {/* =================================================
            نص الخطاب
        ================================================= */}


        <p
          style={{
            ...PF,
            fontSize: 14,
            color: "#333",
            lineHeight: 1.8,
            marginBottom: 12,
            textAlign: "right",
          }}
        >
          {letterType === "end-attachment" ? (
            <>
              قادم لكم اليوم الفرد/الأفراد المذكور أسمائهم وذلك بعد انتهاء
              عملهم (مأمورية تدريبية) بناءً على{" "}
              {toArabicDigits(reason || "أوامر قيادة")} وبياناتهم كالتالي:
            </>
          ) : (
            <>
              قادم لكم اليوم الفرد/الأفراد المذكور أسمائهم وذلك للعمل
              (مأمورية تدريبية) طرفكم بناءً على{" "}
              {toArabicDigits(reason || "أوامر قيادة")} بالأماكن الموضحة
              قرين كلا منهم وبياناتهم كالتالي:
            </>
          )}
        </p>


        {/* =================================================
            الجدول
        ================================================= */}


        <table
          className="w-full border-collapse mb-4"
          style={{
            ...PF,
            fontSize: 14,
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f5f5f5",
                textAlign: "center",
              }}
            >
              {[
                "م",
                "الدرجة",
                "الاسم",
                "الوحدة",
                "وحدة الإلحاق",
              ].map((header) => (
                <th
                  key={header}
                  style={{
                    padding: "5px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>


          <tbody>
            {soldiers.map((soldier, index) => (
              <tr key={soldier.id}>
                {/* رقم */}
                <td
                  style={{
                    padding: "5px",
                    border: "1px solid #eee",
                    textAlign: "center",
                  }}
                >
                  {toArabicDigits(index + 1)}
                </td>


                {/* الدرجة */}
                <td
                  style={{
                    padding: "5px",
                    border: "1px solid #eee",
                    textAlign: "center",
                  }}
                >
                  {toArabicDigits(soldier.rank)}
                </td>


                {/* الاسم */}
                <td
                  style={{
                    padding: "5px",
                    textAlign: "center",
                    border: "1px solid #eee",
                  }}
                >
                  {toArabicDigits(soldier.name)}
                </td>


                {/* الوحدة */}
                <td
                  style={{
                    padding: "5px",
                    border: "1px solid #eee",
                    textAlign: "center",
                  }}
                >
                  {toArabicDigits(soldier.unit)}
                </td>


                {/* وحدة الإلحاق */}
                <td
                  style={{
                    padding: "5px",
                    textAlign: "center",
                    border: "1px solid #eee",
                  }}
                >
                  {toArabicDigits(
                    soldier.attachmentUnit ||
                      attachmentPlace ||
                      "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>


        {/* التحية */}
        <p
          style={{
            ...PF,
            fontSize: 14,
            marginTop: 20,
            textAlign: "center",
            width: "100%",
          }}
        >
          مع وافر التحية ،،،
        </p>


        {/* التوقيع */}
        <div
          className="signature-block"
          style={{
            ...PF,
            fontSize: 14,
            marginTop: 28,
            width: "fit-content",
            maxWidth: "100%",
            marginLeft: 0,
            marginRight: "auto",
            direction: "rtl",
            textAlign: "justify",
            textAlignLast: "right",
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              whiteSpace: "pre",
            }}
          >
            {"التوقيع (                                  )"}
          </p>


          <p
            style={{
              margin: "6px 0 0",
              fontWeight: 700,
            }}
          >
            {toArabicDigits(branchHeadRank || "جاري تحميل الرتبة")} /{" "}
            {toArabicDigits(branchHeadName || "جاري تحميل الاسم")}
          </p>


          <p
            style={{
              margin: "4px 0 0",
              fontWeight: 700,
            }}
          >
            رئيس فرع التنظيــــم والاداره
          </p>
        </div>
      </div>


      {/* =================================================
          CSS الخاص بالخطاب
      ================================================= */}


      <style>
        {`
          .print-logo {
            width: 80px;
            height: 80px;


            display: flex;
            align-items: center;
            justify-content: center;


            flex-shrink: 0;
          }


          .print-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }


          @media print {
            .print-logo {
              width: 32px !important;
              height: 32px !important;


              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }


            .print-logo img {
              width: 32px !important;
              height: 32px !important;


              max-width: 32px !important;
              max-height: 32px !important;


              object-fit: contain !important;
            }


            .letter-preview {
              box-shadow: none !important;
              border: 1.5px solid #000 !important;
              margin: 0 !important;
              max-width: none !important;
              padding: 16px !important;
            }


            body {
              background: #fff !important;
            }


            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }


          @page {
            size: A4;
            margin: 12mm;
          }
        `}
      </style>
    </>
  );
}


/* =========================================================
   Main Page
========================================================= */


export function LetterReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();


  const state = location.state as PageState | null;


  const letterType =
    state?.letterType === "end-attachment"
      ? "end-attachment"
      : "attachment";


  const soldiers = state?.soldiers ?? [];


  const letterData: LetterData =
    state?.letterData ?? {
      destination: "",
      attachmentPlace:
        soldiers[0]?.attachmentUnit ?? "",
      reason: "",
      issuingUnitId: soldiers[0]?.unitId,
      attachmentUnitId:
        soldiers[0]?.attachmentUnitId ?? undefined,
    };


  const [letterNumber, setLetterNumber] =
    useState<number | null>(null);


  const [branchHeadName, setBranchHeadName] =
    useState("");


  const [branchHeadRank, setBranchHeadRank] =
    useState("");


  const [saving, setSaving] = useState(false);


  const [success, setSuccess] = useState(false);


  const [error, setError] = useState("");


  // ✅ تنبيه غير حاجب (non-blocking) يظهر للمستخدم لو فشل حفظ
  // المعاينة المؤقتة فقط، دون التأثير على نجاح حفظ الخطاب نفسه.
  const [previewWarning, setPreviewWarning] =
    useState("");


  /* =======================================================
     Check Session
  ======================================================= */


  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();


      if (sessionError) {
        console.error(sessionError);


        setError(
          "حدث خطأ أثناء التحقق من جلسة الدخول."
        );


        return;
      }


      if (!session?.user) {
        setError(
          "لا توجد جلسة دخول فعالة. برجاء تسجيل الدخول مرة أخرى."
        );
      }
    };


    void checkSession();
  }, []);


  /* =======================================================
     Load Branch Head
  ======================================================= */


  useEffect(() => {
    const loadBranchHead = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();


      if (!session?.user) return;


      const { data, error } = await supabase
        .from("branch_heads")
        .select(`
          id,
          full_name,
          rank_id,
          rank:letter_officer_ranks!branch_heads_rank_id_fkey(
            name
          )
        `)
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();


      if (error) {
        console.error("Branch head error:", error);
        return;
      }


      if (!data) return;


      const rank = Array.isArray(data.rank)
        ? data.rank[0]
        : data.rank;


      setBranchHeadName(data.full_name ?? "");
      setBranchHeadRank(rank?.name ?? "");
    };


    void loadBranchHead();
  }, []);


  /* =======================================================
     Save Letter
  ======================================================= */


  const saveLetter = useCallback(async () => {
    if (saving) return;


    if (!soldiers.length) {
      setError("لا يوجد أفراد في الخطاب.");
      return;
    }


    if (!state?.letterTypeId) {
      setError(
        "نوع الخطاب غير موجود. ارجع واختر نوع الخطاب مرة أخرى."
      );
      return;
    }


    setSaving(true);
    setError("");
    setPreviewWarning("");


    let createdLetterId: string | null = null;


    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();


      if (sessionError) {
        throw new Error(
          `خطأ في جلسة الدخول: ${sessionError.message}`
        );
      }


      if (!session?.user) {
        throw new Error(
          "جلسة تسجيل الدخول غير موجودة. من فضلك سجل الدخول مرة أخرى."
        );
      }


      const userId = session.user.id;


      const {
        data: letterTypeRow,
        error: typeError,
      } = await supabase
        .from("letter_types")
        .select("id,name,code")
        .eq("id", state.letterTypeId)
        .maybeSingle();


      if (typeError) {
        throw new Error(
          `خطأ في نوع الخطاب: ${typeError.message}`
        );
      }


      if (!letterTypeRow) {
        throw new Error(
          "نوع الخطاب غير موجود في قاعدة البيانات."
        );
      }


      const isAttach =
        letterTypeRow.code === "ATTACH";


      const isDetach =
        letterTypeRow.code === "DEATTACH";


      if (!isAttach && !isDetach) {
        throw new Error(
          `نوع الخطاب غير مدعوم: ${letterTypeRow.code}`
        );
      }


      const issuingUnitId =
        letterData.issuingUnitId ??
        soldiers[0]?.unitId;


      if (!issuingUnitId) {
        throw new Error(
          "لم يتم تحديد الوحدة الأساسية."
        );
      }


      const attachmentUnitId =
        letterData.attachmentUnitId ??
        soldiers[0]?.attachmentUnitId ??
        null;


      if (isAttach && !attachmentUnitId) {
        throw new Error(
          "خطاب الإلحاق يحتاج إلى تحديد وحدة الإلحاق."
        );
      }


      const finalAttachmentUnitId =
        isDetach ? null : attachmentUnitId;


      const newServiceStatusId = isAttach
        ? "d443b755-802a-4e5d-8a1b-0c372c5f94dd"
        : "b64822a7-38e3-4c98-b738-0f0f077bb6f2";


      const {
        data: branchHead,
        error: branchError,
      } = await supabase
        .from("branch_heads")
        .select(`
          id,
          full_name,
          rank_id,
          rank:letter_officer_ranks!branch_heads_rank_id_fkey(name)
        `)
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();


      if (branchError) {
        throw new Error(
          `خطأ في تحميل رئيس الفرع: ${branchError.message}`
        );
      }


      if (!branchHead) {
        throw new Error(
          "لا يوجد رئيس فرع نشط في قاعدة البيانات."
        );
      }


      const branchRank = Array.isArray(
        branchHead.rank
      )
        ? branchHead.rank[0]
        : branchHead.rank;


      const letterInsert = {
        letter_type_id: letterTypeRow.id,


       


        issuing_unit_id: issuingUnitId,


        attachment_unit_id:
          finalAttachmentUnitId,


        reason:
          letterData.reason ||
          "أوامر قيادة",


        personnel_count: soldiers.length,


        branch_head_id: branchHead.id,


        branch_head_name:
          branchHead.full_name,


        branch_head_rank:
          branchRank?.name ?? "",


        status: "UNDOCUMENTED",


        created_by: userId,
      };


      const {
        data: newLetter,
        error: insertLetterError,
      } = await supabase
        .from("letters")
        .insert(letterInsert)
        .select("id, letter_number")
        .single();


      if (insertLetterError) {
        throw new Error(
          `خطأ في حفظ الخطاب: ${insertLetterError.message}`
        );
      }


      if (!newLetter) {
        throw new Error(
          "تعذر إنشاء الخطاب."
        );
      }


      createdLetterId = newLetter.id;


      const personnelRows = soldiers.map(
        (soldier) => ({
          letter_id: newLetter.id,
          personnel_id: soldier.id,
        })
      );


      const {
        error: personnelError,
      } = await supabase
        .from("letter_personnel")
        .insert(personnelRows);


      if (personnelError) {
        throw new Error(
          `تم إنشاء الخطاب ولكن فشل ربط الأفراد: ${personnelError.message}`
        );
      }


     const personnelIds = soldiers.map(
  (soldier) => soldier.id
);

// ✅ كل فرد له تحديث منفصل: نستخدم وحدة الإلحاق الخاصة به
// (لو اتعدّلت من الجدول) بدل ما نطبّق قيمة واحدة عامة على الجميع.
const updateResults = await Promise.all(
  soldiers.map((soldier) => {
    const soldierAttachmentId = isDetach
      ? null
      : soldier.attachmentUnitId ?? finalAttachmentUnitId;

    return supabase
      .from("personnel")
      .update({
        service_status_id: newServiceStatusId,
        attachment_unit_id: soldierAttachmentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", soldier.id);
  })
);

const updatePersonnelError = updateResults.find(
  (result) => result.error
)?.error;

if (updatePersonnelError) {
  throw new Error(
    `تم حفظ الخطاب وربط الأفراد، ولكن فشل تحديث حالة الأفراد: ${updatePersonnelError.message}`
  );
}


     const {
  data: updatedPersonnel,
  error: verifyPersonnelError,
} = await supabase
  .from("personnel")
  .select(
    "id, service_status_id, attachment_unit_id"
  )
  .in("id", personnelIds);

if (verifyPersonnelError) {
  throw new Error(
    `تعذر التحقق من تحديث بيانات الأفراد: ${verifyPersonnelError.message}`
  );
}

if (
  !updatedPersonnel ||
  updatedPersonnel.length !==
    personnelIds.length
) {
  throw new Error(
    "لم يتم تحديث جميع الأفراد المحددين."
  );
}

// ✅ نبني خريطة توقعات لكل فرد بقيمته الخاصة بدل قيمة واحدة عامة
const expectedAttachmentBySoldierId = new Map(
  soldiers.map((soldier) => [
    soldier.id,
    isDetach ? null : soldier.attachmentUnitId ?? finalAttachmentUnitId,
  ])
);

const invalidPersonnel = updatedPersonnel.filter((person) => {
  const expectedAttachment = expectedAttachmentBySoldierId.get(person.id);

  return (
    person.service_status_id !== newServiceStatusId ||
    person.attachment_unit_id !== expectedAttachment
  );
});

if (invalidPersonnel.length > 0) {
  throw new Error(
    "فشل التحقق من تحديث حالة أو جهة إلحاق بعض الأفراد."
  );
}
      // =====================================================
// تسجيل إصدار الخطاب في سجل العمليات
// يتم التسجيل بعد نجاح:
// 1. إنشاء الخطاب
// 2. ربط الأفراد
// 3. تحديث حالات الأفراد
// 4. التحقق من التحديث
// =====================================================


const { data: profile, error: profileError } =
  await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();


if (profileError) {
  console.warn(
    "AUDIT PROFILE WARNING:",
    profileError.message
  );
}


const auditDetails =
  `رقم الخطاب: ${newLetter.letter_number} — ` +
  `نوع الخطاب: ${letterTypeRow.name} — ` +
  `عدد الأفراد: ${soldiers.length}`;


const { error: auditError } = await supabase
  .from("audit_logs")
  .insert({
    user_id: userId,


    user_name:
      profile?.username ??
      "غير معروف",


    action_type: "CREATE",


    action: "إصدار خطاب",


    entity: "letters",


    details: auditDetails,
  });


if (auditError) {
  // فشل تسجيل الـ Audit لا يمنع نجاح إصدار الخطاب
  console.error(
    "AUDIT LOG ERROR:",
    auditError
  );
}


// =====================================================
// نجاح العملية
// =====================================================


setLetterNumber(
  newLetter.letter_number
);


setBranchHeadName(
  branchHead.full_name ?? ""
);


setBranchHeadRank(
  branchRank?.name ?? ""
);


setSaving(false);
setSuccess(true);


      // =====================================================
      // ✅ إنشاء صورة PNG من معاينة الخطاب ورفعها مؤقتًا
      //
      // هذه خطوة "Best effort": أي فشل هنا لا يجب أن يوقف نجاح
      // حفظ الخطاب، لذلك تم عزلها في try/catch منفصل. لكن على
      // عكس النسخة السابقة، هنا بنعرض تحذير غير حاجب للمستخدم
      // ولوج مفصّل في الكونسول لتسهيل التشخيص.
      // =====================================================


      try {
        const previewResult =
          await generateAndUploadPreview(
            newLetter.id
          );


        if (!previewResult.ok) {
          console.warn(
            "[SAVE LETTER] المعاينة المؤقتة لم تُحفظ — السبب:",
            previewResult.reason
          );


          setPreviewWarning(
            "تم حفظ الخطاب بنجاح، لكن تعذّر إنشاء نسخة المعاينة المؤقتة. يمكنك رفع النسخة الموقعة مباشرة من صفحة تفاصيل الخطاب."
          );
        }
      } catch (previewError) {
        console.error(
          "PREVIEW GENERATION ERROR:",
          previewError
        );


        setPreviewWarning(
          "تم حفظ الخطاب بنجاح، لكن تعذّر إنشاء نسخة المعاينة المؤقتة. يمكنك رفع النسخة الموقعة مباشرة من صفحة تفاصيل الخطاب."
        );
      }


      setLetterNumber(
        newLetter.letter_number
      );


      setBranchHeadName(
        branchHead.full_name ?? ""
      );


      setBranchHeadRank(
        branchRank?.name ?? ""
      );


      setSaving(false);
      setSuccess(true);
    } catch (err) {
      console.error(
        "SAVE LETTER ERROR:",
        err
      );


      if (createdLetterId) {
        try {
          await supabase
            .from("letter_personnel")
            .delete()
            .eq(
              "letter_id",
              createdLetterId
            );


          await supabase
            .from("letters")
            .delete()
            .eq(
              "id",
              createdLetterId
            );
        } catch (rollbackError) {
          console.error(
            "ROLLBACK ERROR:",
            rollbackError
          );
        }
      }


      setSaving(false);


      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حفظ الخطاب."
      );
    }
  }, [
    saving,
    soldiers,
    state,
    letterData,
  ]);


  /* =======================================================
     Redirect After Success
  ======================================================= */


  useEffect(() => {
    if (!success) return;


    const timer = window.setTimeout(() => {
      navigate("/dashboard");
    }, 3000);


    return () => {
      window.clearTimeout(timer);
    };
  }, [success, navigate]);


  /* =======================================================
     Page Title
  ======================================================= */


  const pageTitle =
    letterType === "end-attachment"
      ? "اصدار خطاب إنهاء إلحاق"
      : "اصدار خطاب إلحاق";


  /* =======================================================
     PRINT ONLY LETTER
  ======================================================= */


  const handlePrintLetter = () => {
    const letterElement =
      document.querySelector(
        ".letter-preview"
      ) as HTMLElement | null;


    if (!letterElement) {
      alert("تعذر العثور على الخطاب.");
      return;
    }


    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=1200"
    );


    if (!printWindow) {
      alert(
        "يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم المعاينة."
      );
      return;
    }


    const letterHtml = letterElement.outerHTML;


    printWindow.document.open();

const letterTypeLabel =
  state?.letterTypeName ||
  (letterType === "end-attachment" ? "إنهاء إلحاق" : "إلحاق");

const letterNumberLabel =
  letterNumber !== null ? toArabicDigits(letterNumber) : "";

const pdfTitle = `خطاب ${letterTypeLabel} ${letterNumberLabel} ${
  letterData.destination || ""
}`.trim();
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
              margin: 10mm;
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
              min-height: 100%;


              background: #fff;
            }


            body {
              direction: rtl;


              font-family:
                'Times New Roman',
                Times,
                serif;
            }


            .print-page {
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              gap: 6mm;


              width: 100%;
              height: 277mm;
            }


            .print-copy {
              flex: 1 1 50%;
              overflow: hidden;


              transform: scale(0.94);
              transform-origin: top center;


              page-break-inside: avoid;
            }


            .letter-preview {
              display: block !important;


              width: 100% !important;
              max-width: none !important;


              margin: 0 !important;


              padding: 10px !important;


              border: 1.5px solid #000 !important;
              border-radius: 0 !important;


              box-shadow: none !important;


              background: #fff !important;
            }


            .print-logo {
              width: 32px !important;
              height: 32px !important;


              display: flex !important;


              align-items: center !important;
              justify-content: center !important;


              flex-shrink: 0 !important;
            }


            .print-logo img {
              width: 32px !important;
              height: 32px !important;


              max-width: 32px !important;
              max-height: 32px !important;


              object-fit: contain !important;
            }


            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }


            th,
            td {
              border: 1px solid #ddd;
            }


            img {
              display: block;
            }


            @media print {
              html,
              body {
                width: 100%;
                min-height: 100%;


                overflow: visible !important;
              }


              .print-page {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>


        <body>
          <div class="print-page">
            <div class="print-copy">${letterHtml}</div>
            <div class="print-copy">${letterHtml}</div>
          </div>
        </body>
      </html>
    `);


    printWindow.document.close();


    const doPrint = () => {
      setTimeout(() => {
        printWindow.focus();


        printWindow.print();


        setTimeout(() => {
          printWindow.close();
        }, 500);
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
  };


  /* =======================================================
     Render
  ======================================================= */


  return (
    <div
      className="flex flex-col gap-6 w-full pb-10"
      dir="rtl"
    >
      {/* عنوان الصفحة */}


      <h1
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(22px,4vw,32px)",
          color: "#2d3648",
        }}
      >
        {pageTitle}
      </h1>


      {/* Stepper */}


      <div className="flex justify-center">
        <Stepper />
      </div>


      {/* Error */}


      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{
            ...F,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            whiteSpace: "pre-line",
          }}
        >
          {error}
        </div>
      )}


      {/* Preview Warning (تحذير غير حاجب) */}


      {previewWarning && !error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{
            ...F,
            background: "#fff8e8",
            border: "1px solid #f4d58d",
            color: "#8a6500",
            whiteSpace: "pre-line",
          }}
        >
          {previewWarning}
        </div>
      )}


      {/* =================================================
          Letter Information
      ================================================= */}


      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span
            style={{
              ...F,
              fontSize: 16,
              color: "#4a5468",
            }}
          >
            بيانات الخطاب
          </span>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-6 py-5">
          <InfoPair
            label="نوع الخطاب"
            value={
              state?.letterTypeName ||
              (letterType === "end-attachment"
                ? "إنهاء إلحاق"
                : "إلحاق")
            }
          />


          <InfoPair
            label="رقم الخطاب"
            value={
              letterNumber !== null
                ? toArabicDigits(letterNumber)
                : "سيتم توليده عند الحفظ"
            }
          />


          <InfoPair
            label="جهة الخطاب"
            value={toArabicDigits(
              letterData.destination
            )}
          />


          <InfoPair
            label="تاريخ الخطاب"
            value={toArabicDigits(
              new Date().toLocaleDateString(
                "en-GB"
              )
            )}
          />


          <InfoPair
            label="الوحدة الأساسية"
            value={toArabicDigits(
              soldiers[0]?.unit ?? ""
            )}
          />


          <InfoPair
            label="عدد الأفراد"
            value={toArabicDigits(
              soldiers.length
            )}
          />


          <InfoPair
            label="وحدة الإلحاق"
            value={
              letterType === "end-attachment"
                ? "سيتم إنهاء الإلحاق"
                : toArabicDigits(
                    letterData.attachmentPlace ||
                      soldiers[0]?.attachmentUnit ||
                      "لا يوجد"
                  )
            }
          />


          <InfoPair
            label="رئيس الفرع"
            value={toArabicDigits(
              branchHeadName ||
                "جاري التحميل"
            )}
          />
        </div>
      </section>


      {/* =================================================
          Personnel
      ================================================= */}


      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
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
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="bg-[#f7f9fc]">
                {[
                  "درجة",
                  "اسم",
                  "الوحدة",
                  "وحدة الإلحاق",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-right border-b"
                  >
                    <span
                      style={{
                        ...F,
                        fontSize: 14,
                        color: "#717d96",
                      }}
                    >
                      {header}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>


            <tbody>
              {soldiers.map((soldier) => (
                <tr key={soldier.id}>
                  <td className="px-4 py-3 border-b">
                    {toArabicDigits(
                      soldier.rank
                    )}
                  </td>


                  <td className="px-4 py-3 border-b">
                    {toArabicDigits(
                      soldier.name
                    )}
                  </td>


                  <td className="px-4 py-3 border-b">
                    {toArabicDigits(
                      soldier.unit
                    )}
                  </td>


                  <td className="px-4 py-3 border-b">
                    {letterType ===
                    "end-attachment"
                      ? "لا يوجد"
                      : toArabicDigits(
                          soldier.attachmentUnit ||
                            letterData.attachmentPlace ||
                            "لا يوجد"
                        )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>


      {/* =================================================
          Letter Preview
      ================================================= */}


      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span
            style={{
              ...F,
              fontSize: 16,
              color: "#4a5468",
            }}
          >
            معاينة الخطاب
          </span>
        </div>


        <div className="p-6 bg-[#f7f9fc]">
          <LetterPreview
            soldiers={soldiers}
            destination={
              letterData.destination
            }
            attachmentPlace={
              letterData.attachmentPlace
            }
            reason={letterData.reason}
            letterType={letterType}
            branchHeadName={
              branchHeadName
            }
            branchHeadRank={
              branchHeadRank
            }
          />
        </div>
      </section>


      {/* =================================================
          Buttons
      ================================================= */}


      <div className="flex flex-wrap items-center gap-4">
        {/* حفظ الخطاب */}


        <button
          type="button"
          disabled={saving || success}
          onClick={() =>
            void saveLetter()
          }
          className="flex items-center gap-2 min-h-[48px] px-6 rounded-[8px]"
          style={{
            background:
              "linear-gradient(to bottom,#00b867,#00522e)",
            opacity:
              saving || success
                ? 0.6
                : 1,
          }}
        >
          <Printer
            size={16}
            color="#fff"
          />


          <span
            style={{
              ...F,
              fontSize: 15,
              color: "#fff",
            }}
          >
            {saving
              ? "جاري الحفظ..."
              : "تأكيد وحفظ الخطاب"}
          </span>
        </button>


        {/* طباعة / معاينة */}


        <button
          type="button"
          onClick={handlePrintLetter}
          className="flex items-center gap-2 min-h-[48px] px-6 rounded-[8px] border border-[#2d3648] bg-white"
        >
          <Download
            size={16}
            color="#2d3648"
          />


          <span
            style={{
              ...F,
              fontSize: 15,
              color: "#2d3648",
            }}
          >
            طباعة / تحميل المعاينة
          </span>
        </button>


        {/* إلغاء */}


        <button
          type="button"
          disabled={saving}
          onClick={() =>
            navigate("/dashboard")
          }
          className="min-h-[48px] px-4"
        >
          <span
            style={{
              ...F,
              fontSize: 15,
              color: "#172e78",
              textDecoration: "underline",
            }}
          >
            إلغاء
          </span>
        </button>
      </div>


      {/* =================================================
          Modals
      ================================================= */}


      {saving && <LoadingModal />}


      {success && (
        <SuccessModal
          letterNumber={letterNumber}
        />
      )}
    </div>
  );
}
