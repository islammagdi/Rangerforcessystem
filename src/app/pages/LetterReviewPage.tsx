import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Download, Printer } from "lucide-react";
import type { CSSProperties } from "react";
import html2canvas from "html2canvas-pro";
import { createNotification } from "../../lib/createNotification";
import { supabase } from "../../lib/supabase";
import imgEagle from "figma:asset/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";

/* =========================================================
   Fonts
========================================================= */

const F: CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

const PF: CSSProperties = {
  fontFamily: "'Times New Roman', Times, serif",
};

/* =========================================================
   Constants
========================================================= */

const BLANK_SPACE = "ــــــــــــ";

const ATTACH_STATUS_ID =
  "d443b755-802a-4e5d-8a1b-0c372c5f94dd";

const DETACH_STATUS_ID =
  "b64822a7-38e3-4c98-b738-0f0f077bb6f2";

/* =========================================================
   Helpers
========================================================= */

const toArabicDigits = (
  value: string | number | null | undefined
): string => {
  if (value === null || value === undefined) return "";

  return String(value).replace(/\d/g, (digit) => {
    return "٠١٢٣٤٥٦٧٨٩"[Number(digit)];
  });
};
const renderTextWithDates = (
  text: string
): React.ReactNode[] => {
  const parts = text.split(
    /(\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4})/g
  );

  return parts.map((part, index) => {
    const isDate =
      /^\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4}$/.test(part);

    if (isDate) {
      return (
        <span
          key={index}
          style={{
            direction: "ltr",
            unicodeBidi: "isolate",
            display: "inline-block",
          }}
        >
          {toArabicDigits(part)}
        </span>
      );
    }

    return (
      <span key={index}>
        {toArabicDigits(part)}
      </span>
    );
  });
};
const getRelationObject = <T,>(
  value: T | T[] | null | undefined
): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
};

/* =========================================================
   Types
========================================================= */

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
  notes?: string; // ✅ جديد
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
   Preview Upload
========================================================= */

async function generateAndUploadPreview(
  letterId: string
): Promise<PreviewResult> {
  console.log(
    "[PREVIEW] Starting preview generation:",
    letterId
  );

  const previewElement = document.querySelector(
    ".letter-preview"
  ) as HTMLElement | null;

  if (!previewElement) {
    console.warn(
      "[PREVIEW] .letter-preview not found"
    );

    return {
      ok: false,
      reason: "no-preview-element",
    };
  }

  const images = Array.from(
    previewElement.querySelectorAll("img")
  );

  await Promise.all(
    images.map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        img.onload = () => resolve();

        img.onerror = () => {
          console.warn(
            "[PREVIEW] Image failed:",
            img.src
          );

          resolve();
        };
      });
    })
  );

  let canvas: HTMLCanvasElement;

  try {
    canvas = await html2canvas(previewElement, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: false,
      logging: false,
    });
  } catch (error) {
    console.error(
      "[PREVIEW] html2canvas failed:",
      error
    );

    return {
      ok: false,
      reason: "capture-failed",
    };
  }

  let blob: Blob | null = null;

  try {
    blob = await new Promise<Blob | null>(
      (resolve, reject) => {
        try {
          canvas.toBlob(
            (result) => resolve(result),
            "image/png"
          );
        } catch (error) {
          reject(error);
        }
      }
    );
  } catch (error) {
    console.error(
      "[PREVIEW] Canvas is probably tainted:",
      error
    );

    return {
      ok: false,
      reason: "tainted-canvas",
    };
  }

  if (!blob) {
    return {
      ok: false,
      reason: "empty-blob",
    };
  }

  const previewPath = `${letterId}/preview.png`;

  const { error: uploadError } =
    await supabase.storage
      .from("letter-attachments")
      .upload(previewPath, blob, {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/png",
      });

  if (uploadError) {
    console.error(
      "[PREVIEW] Upload failed:",
      uploadError
    );

    return {
      ok: false,
      reason: "upload-failed",
    };
  }

  const { error: updateError } =
    await supabase
      .from("letters")
      .update({
        preview_image_path: previewPath,
      })
      .eq("id", letterId);

  if (updateError) {
    console.error(
      "[PREVIEW] DB update failed:",
      updateError
    );

    return {
      ok: false,
      reason: "db-update-failed",
    };
  }

  return { ok: true };
}

/* =========================================================
   Loading Modal
========================================================= */

function LoadingModal() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,.45)",
      }}
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
      style={{
        background: "rgba(0,0,0,.45)",
      }}
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
        <div
          key={step}
          className="flex items-start"
        >
          <StepBubble
            number={`0${index + 1}`}
            label={step}
            done={index < 3}
            active={index === 3}
          />

          {index < 3 && (
            <div className="flex items-center gap-[3px] mt-4 mx-2">
              {Array.from({ length: 16 }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="w-[3px] h-[3px] rounded-full"
                    style={{
                      background: "#1A202C",
                    }}
                  />
                )
              )}
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
   Date Blank
========================================================= */

function DateBlank({
  month,
  year,
}: {
  month: number;
  year: number;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        direction: "rtl",
        unicodeBidi: "isolate",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ display: "inline-block", width: "25px" }}>
        &nbsp;
      </span>

      <span>/</span>

      <span>{toArabicDigits(month)}</span>

      <span>/</span>

      <span>{toArabicDigits(year)}</span>
    </span>
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
   notes,
  letterType,
  branchHeadName,
  branchHeadRank,
}: {
  soldiers: Soldier[];
  destination: string;
  attachmentPlace: string;
  reason: string;
  notes?: string;
  letterType: string;
  branchHeadName: string;
  branchHeadRank: string;
}) {
  const now = new Date();
const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = now.getFullYear();

  const isDetach =
    letterType === "end-attachment";

  return (
    <>
      <div
        className="bg-white border border-[#ddd] rounded-[4px] p-8 w-full max-w-[680px] mx-auto shadow-sm letter-preview"
        dir="rtl"
      >
        {/* Header */}
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
              }}
            >
              قيـــــادة قـــوات الصـاعقـــة
            </p>

            <p
              style={{
                ...PF,
                fontSize: 14,
                margin: "3px 0",
              }}
            >
              فــــــرع التنظيــــــم والإدارة
            </p>

            <p
              style={{
                ...PF,
                fontSize: 14,
                margin: 0,
              }}
            >
              التاريــخ :{" "}
              <DateBlank
                month={currentMonth}
                year={currentYear}
              />
            </p>
          </div>

          <div
            className="print-logo"
            style={{
              flexShrink: 0,
            }}
          >
            <img
              src={imgEagle}
              alt="شعار الجمهورية"
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        </div>

        {/* Destination */}
        <p
          style={{
            ...PF,
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 14,
            textAlign: "center",
            textDecoration: "underline",
          }}
        >
          إلى /{" "}
          {toArabicDigits(destination || "...")}
        </p>

        {/* Body */}
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
          {soldiers.length === 1 ? (
            isDetach ? (
              <>
                قادم لكم اليوم{" "}
                <DateBlank
                  month={currentMonth}
                  year={currentYear}
                />{" "}
                الفرد المذكور اسمه بعد بمهامته
                وملبوساته الأميرية وذلك بعد انتهاء
                عمله (مأمورية تدريبية){" "}
                {renderTextWithDates(reason || "أوامر قيادة")}{" "}
                وبياناته كالتالي:
              </>
            ) : (
              <>
                قادم لكم اليوم{" "}
                <DateBlank
                  month={currentMonth}
                  year={currentYear}
                />{" "}
                الفرد المذكور اسمه بعد بمهامته
                وملبوساته الأميرية وذلك للعمل
                (مأمورية تدريبية) طرفكم{" "}
                {renderTextWithDates(reason || "أوامر قيادة")}{" "}
                بالمكان الموضح قرينه وبياناته
                كالتالي:
              </>
            )
          ) : isDetach ? (
            <>
              قادم لكم اليوم{" "}
              <DateBlank
                month={currentMonth}
                year={currentYear}
              />{" "}
              الأفراد المذكورة أسمائهم بعد
              بمهامتهم وملبوساتهم الأميرية وذلك
              بعد انتهاء عملهم (مأمورية تدريبية){" "}
              {renderTextWithDates(reason || "أوامر قيادة")}{" "}
              وبياناتهم كالتالي:
            </>
          ) : (
            <>
              قادم لكم اليوم{" "}
              <DateBlank
                month={currentMonth}
                year={currentYear}
              />{" "}
              الأفراد المذكورة أسمائهم بعد
              بمهامتهم وملبوساتهم الأميرية وذلك
              للعمل (مأمورية تدريبية) طرفكم{" "}
              {renderTextWithDates(reason || "أوامر قيادة")}{" "}
              بالأماكن الموضحة قرين كلا منهم
              وبياناتهم كالتالي:
            </>
          )}
        </p>

        {/* Table */}
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
                isDetach ? "ملاحظات" : "وحدة الإلحاق",
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
                <td
                  style={{
                    padding: "5px",
                    border: "1px solid #eee",
                    textAlign: "center",
                  }}
                >
                  {toArabicDigits(index + 1)}
                </td>

                <td
                  style={{
                    padding: "5px",
                    border: "1px solid #eee",
                    textAlign: "center",
                  }}
                >
                  {toArabicDigits(soldier.rank)}
                </td>

                <td
                  style={{
                    padding: "5px",
                    border: "1px solid #eee",
                    textAlign: "center",
                  }}
                >
                  {toArabicDigits(soldier.name)}
                </td>

                <td
                  style={{
                    padding: "5px",
                    border: "1px solid #eee",
                    textAlign: "center",
                  }}
                >
                  {toArabicDigits(soldier.unit)}
                </td>

                              <td
                  style={{
                    padding: "5px",
                    border: "1px solid #eee",
                    textAlign: "center",
                  }}
                >
                  {isDetach
                    ? "\u00A0" /* عمود ملاحظات فارغ في حالة إنهاء الإلحاق */
                    : toArabicDigits(
                        soldier.attachmentUnit ||
                          attachmentPlace ||
                          "-"
                      )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Greeting */}
        <p
          style={{
            ...PF,
            fontSize: 14,
            marginTop: 20,
            textAlign: "center",
          }}
        >
          مع وافر التحية ،،،
        </p>
{notes && notes.trim() && (
  <div
    style={{
      marginTop: 16,
    }}
    dir="rtl"
  >
    <p
      style={{
        ...PF,
        fontSize: 14,
        margin: 0,
        textAlign: "right",
        fontWeight: 800,
        color: "#333",
      }}
    >
      ملاحظات:
    </p>

    <p
      style={{
        ...PF,
        fontSize: 14,
        margin: 0,
        marginTop: 4,
        textAlign: "right",
        fontWeight: 500,
        color: "#333",
      }}
    >
      {toArabicDigits(notes)}
    </p>
  </div>
)}

       {/* Signature */}
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
    textAlignLast: "justify",   // كانت "right"
  }}
>
  <p
    style={{
      margin: 0,
      fontWeight: 700,
      whiteSpace: "pre",
    }}
  >
    {"التوقيع (                             )"}
  </p>

  <p
    style={{
      margin: "6px 0 0",
      fontWeight: 700,
    }}
  >
    {toArabicDigits(
      branchHeadRank || "جاري تحميل الرتبة"
    )}{" "}
    /{" "}
    {toArabicDigits(
      branchHeadName || "جاري تحميل الاسم"
    )}
  </p>

  <p
    style={{
      margin: "4px 0 0",
      fontWeight: 700,
    }}
  >
    رئيــــس فــــرع التنظيــــم والاداره
  </p>
</div>
      </div>

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
            }

            .print-logo img {
              width: 32px !important;
              height: 32px !important;
              max-width: 32px !important;
              max-height: 32px !important;
            }

            .letter-preview {
              box-shadow: none !important;
             border: none !important;
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

  const state =
    location.state as PageState | null;

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
        soldiers[0]?.attachmentUnitId ??
        undefined,
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

  const [previewWarning, setPreviewWarning] =
    useState("");

  /* =======================================================
     Session
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (sessionError) {
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

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     Load Branch Head
  ======================================================= */

  useEffect(() => {
    let mounted = true;

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

      if (!mounted) return;

      if (error) {
        console.error(
          "Branch head error:",
          error
        );
        return;
      }

      if (!data) return;

      const rank = getRelationObject(
        data.rank
      ) as { name?: string } | null;

      setBranchHeadName(
        data.full_name ?? ""
      );

      setBranchHeadRank(
        rank?.name ?? ""
      );
    };

    void loadBranchHead();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     Save Letter
  ======================================================= */

  const saveLetter = useCallback(async () => {
    if (saving || success) return;

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

    // ✅ التحقق الجديد: لو الخطاب "إلحاق" (مش إنهاء إلحاق)، نتأكد إن
    // مفيش فرد وحدة إلحاقه المختارة هي نفسها وحدته الأساسية —
    // لأن ده منطقيًا غير مسموح (الفرد أصلاً موجود في وحدته دي).
    if (letterType !== "end-attachment") {
      const invalidSoldiers = soldiers.filter((soldier) => {
        const chosenAttachmentUnitId =
          soldier.attachmentUnitId ??
          letterData.attachmentUnitId;

        return (
          chosenAttachmentUnitId &&
          chosenAttachmentUnitId === soldier.unitId
        );
      });

      if (invalidSoldiers.length > 0) {
        const names = invalidSoldiers
          .map((s) => s.name)
          .join("، ");

        setError(
          `لا يمكن إلحاق الفرد بنفس وحدته الأساسية. يرجى تعديل جهة الإلحاق للأفراد التاليين: ${names}`
        );
        return;
      }
    }

    setSaving(true);
    setError("");
    setPreviewWarning("");
    setSaving(true);
    setError("");
    setPreviewWarning("");

    let createdLetterId: string | null = null;

    try {
      /* -----------------------------------------------
         Session
      ----------------------------------------------- */

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

      /* -----------------------------------------------
         Letter Type
      ----------------------------------------------- */

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

      /* -----------------------------------------------
         Units
      ----------------------------------------------- */

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
        ? ATTACH_STATUS_ID
        : DETACH_STATUS_ID;

      /* -----------------------------------------------
         Branch Head
      ----------------------------------------------- */

      const {
        data: branchHead,
        error: branchError,
      } = await supabase
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

      const branchRank = getRelationObject(
        branchHead.rank
      ) as { name?: string } | null;

      /* -----------------------------------------------
         Insert Letter
      ----------------------------------------------- */

      const letterInsert = {
        letter_type_id: letterTypeRow.id,
        issuing_unit_id: issuingUnitId,
        attachment_unit_id: finalAttachmentUnitId,
        reason:
          letterData.reason || "أوامر قيادة",
        personnel_count: soldiers.length,
        branch_head_id: branchHead.id,
        branch_head_name:
          branchHead.full_name ?? "",
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

      /* -----------------------------------------------
         Link Personnel
      ----------------------------------------------- */

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

      /* -----------------------------------------------
         Update Personnel
      ----------------------------------------------- */

      const updateResults =
        await Promise.all(
          soldiers.map(async (soldier) => {
            const soldierAttachmentId =
              isDetach
                ? null
                : soldier.attachmentUnitId ??
                  finalAttachmentUnitId;

            return supabase
              .from("personnel")
              .update({
                service_status_id:
                  newServiceStatusId,
                attachment_unit_id:
                  soldierAttachmentId,
                updated_at:
                  new Date().toISOString(),
              })
              .eq("id", soldier.id);
          })
        );

      const updatePersonnelError =
        updateResults.find(
          (result) => result.error
        )?.error;

      if (updatePersonnelError) {
        throw new Error(
          `تم حفظ الخطاب وربط الأفراد، ولكن فشل تحديث حالة الأفراد: ${updatePersonnelError.message}`
        );
      }

      /* -----------------------------------------------
         Verify Personnel
      ----------------------------------------------- */

      const personnelIds = soldiers.map(
        (soldier) => soldier.id
      );

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

      const expectedAttachmentBySoldierId =
        new Map(
          soldiers.map((soldier) => [
            soldier.id,
            isDetach
              ? null
              : soldier.attachmentUnitId ??
                finalAttachmentUnitId,
          ])
        );

      const invalidPersonnel =
        updatedPersonnel.filter((person) => {
          const expectedAttachment =
            expectedAttachmentBySoldierId.get(
              person.id
            );

          return (
            person.service_status_id !==
              newServiceStatusId ||
            person.attachment_unit_id !==
              expectedAttachment
          );
        });

      if (invalidPersonnel.length) {
        throw new Error(
          "فشل التحقق من تحديث حالة أو جهة إلحاق بعض الأفراد."
        );
      }

      /* -----------------------------------------------
         Audit Log
      ----------------------------------------------- */

      const {
        data: profile,
        error: profileError,
      } = await supabase
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

      const { error: auditError } =
        await supabase
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
        console.error(
          "AUDIT LOG ERROR:",
          auditError
        );
      }
      /* -----------------------------------------------
         Notification (جديد)
      ----------------------------------------------- */

      await createNotification({
        title: "تم إصدار خطاب",
        body: `تم إصدار خطاب ${letterTypeRow.name} رقم ${newLetter.letter_number}`,
        type: "success",
        entityType: "letter",
        entityId: newLetter.id,
        userName: profile?.username ?? "غير معروف",
      });

      /* -----------------------------------------------
         Preview
      ----------------------------------------------- */

      try {
        const previewResult =
          await generateAndUploadPreview(
            newLetter.id
          );

        if (!previewResult.ok) {
          console.warn(
            "[PREVIEW] Failed:",
            previewResult.reason
          );

          setPreviewWarning(
            "تم حفظ الخطاب بنجاح، لكن تعذّر إنشاء نسخة المعاينة المؤقتة. يمكنك رفع النسخة الموقعة مباشرة من صفحة تفاصيل الخطاب."
          );
        }
      } catch (previewError) {
        console.error(
          "[PREVIEW] Unexpected error:",
          previewError
        );

        setPreviewWarning(
          "تم حفظ الخطاب بنجاح، لكن تعذّر إنشاء نسخة المعاينة المؤقتة. يمكنك رفع النسخة الموقعة مباشرة من صفحة تفاصيل الخطاب."
        );
      }

      /* -----------------------------------------------
         Success
      ----------------------------------------------- */

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

      /*
       * Rollback للخطاب والروابط.
       *
       * ملاحظة:
       * استرجاع personnel نفسه بشكل آمن يحتاج حفظ القيم
       * القديمة لكل فرد قبل التحديث أو تنفيذ العملية داخل
       * PostgreSQL RPC/Transaction.
       */

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
    success,
    soldiers,
    state,
    letterData,
  ]);

  /* =======================================================
     Redirect
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
     Print
     ---------------------------------------------------
     المطلوب: طباعة نسختين من الخطاب.

     - لو الخطاب قصير (عدد أفراد قليل) → نسختين مصغّرتين فوق
       بعض في نفس ورقة A4 واحدة (زي الأول بالظبط).

     - لو الخطاب طويل (عدد أفراد كبير وهيقرب من ورقة كاملة) →
       نسختين، كل واحدة في ورقة A4 كاملة منفصلة (صفحتين ورق)،
       من غير أي تصغير أو قص، عشان الجدول والتوقيع ميتقصوش.

     بنحدد أي الحالتين عن طريق قياس الارتفاع الحقيقي للخطاب لو
     اتطبع بعرض ورقة A4 الفعلي (مش عرضه الظاهر على الشاشة).
  ======================================================= */

  function measureLetterHeightMM(
    letterElement: HTMLElement
  ): number {
    // عرض منطقة الطباعة الفعلي: A4 = 210مم، ناقص هامشين 10مم
    // من كل جانب (حسب @page margin: 10mm المستخدم في الطباعة)
    const PRINT_CONTENT_WIDTH_MM = 190;
    const PX_PER_MM = 96 / 25.4; // ≈ 3.7795

    const clone = letterElement.cloneNode(
      true
    ) as HTMLElement;

    // نخفي النسخة تمامًا عن الشاشة، لكن لازم تفضل جوه الـ DOM
    // عشان المتصفح يقدر يحسب لها ارتفاع حقيقي
    clone.style.position = "fixed";
    clone.style.top = "-99999px";
    clone.style.left = "-99999px";
    clone.style.margin = "0";
    clone.style.maxWidth = "none";
    clone.style.width = `${
      PRINT_CONTENT_WIDTH_MM * PX_PER_MM
    }px`;

    document.body.appendChild(clone);

    const heightPx =
      clone.getBoundingClientRect().height;

    document.body.removeChild(clone);

    return heightPx / PX_PER_MM;
  }

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

    const letterHtml =
      letterElement.outerHTML;

    const letterTypeLabel =
      state?.letterTypeName ||
      (letterType === "end-attachment"
        ? "إنهاء إلحاق"
        : "إلحاق");

    const letterNumberLabel =
      letterNumber !== null
        ? toArabicDigits(letterNumber)
        : "";

    const pdfTitle =
      `خطاب ${letterTypeLabel} ${letterNumberLabel} ${
        letterData.destination || ""
      }`.trim();

    // ---------------------------------------------------
    // نحدد هل الخطاب "قصير" (تدخل نسختين مصغّرتين في ورقة
    // واحدة براحة) ولا "طويل" (محتاج ورقة كاملة لكل نسخة)
    // ---------------------------------------------------

    const heightMM =
      measureLetterHeightMM(letterElement);

    // المساحة المتاحة لكل نسخة في وضع "نسختين بورقة واحدة"
    // تقريبًا 135مم (277مم متاحة ÷ 2)، وبنستخدم سقف أقل من
    // كده كهامش أمان قبل ما نضطر ننتقل لوضع "ورقة لكل نسخة"
    const MAX_HEIGHT_FOR_TWO_PER_PAGE_MM = 125;

    const fitsTwoPerPage =
      heightMM <=
      MAX_HEIGHT_FOR_TWO_PER_PAGE_MM;

    // ---------------------------------------------------
    // القالب المشترك (CSS عام يستخدم في الحالتين)
    // ---------------------------------------------------

    const sharedStyles = `
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
        font-family: 'Times New Roman', Times, serif;
      }

       .letter-preview {
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 10px !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: #fff !important;
      }

      /* بلوك التوقيع دايمًا يتلزق في آخر الإطار/الصفحة، مهما
         كان طول المحتوى اللي فوقه — margin-top: auto بتاخد كل
         المسافة الفاضية فوقيها وتدفع البلوك لتحت */
      .signature-block {
        margin-top: auto !important;
      }

      .print-logo {
        width: 55px !important;
        height: 55px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-shrink: 0 !important;
      }

      .print-logo img {
        width: 55px !important;
        height: 55px !important;
        max-width: 55px !important;
        max-height: 55px !important;
        object-fit: contain !important;
      }

      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }

      th,
      td {
        border: 1px solid #ddd !important;
      }

      img {
        display: block;
      }
    `;

    // ---------------------------------------------------
    // الحالة 1: خطاب قصير → نسختين مصغّرتين في ورقة واحدة
    // (نفس الأسلوب القديم)
    // ---------------------------------------------------

    const twoPerPageBody = `
      <div class="print-page">
        <div class="print-frame">
          <div class="print-copy">
            ${letterHtml}
          </div>
        </div>

        <div class="print-frame">
          <div class="print-copy">
            ${letterHtml}
          </div>
        </div>
      </div>
    `;

    const twoPerPageStyles = `
      ${sharedStyles}

      .print-page {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 277mm;
        gap: 4mm;
      }

      /* الفريم الرمادي الخفيف — ارتفاع ثابت بالمليمتر بالظبط
         (مش نسبة مئوية) عشان نضمن تساوي النسختين 100% بغض
         النظر عن أي فروق في حساب المتصفح وقت الطباعة الفعلية */
      .print-frame {
        height: 136.5mm;
        width: 100%;
        border: 1px solid #ddd;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        page-break-inside: avoid;
      }

      .print-copy {
        width: 100%;
        height: 100%;
        flex: 1;
        transform: scale(0.94);
        transform-origin: top center;
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
    `;

    // ---------------------------------------------------
    // الحالة 2: خطاب طويل → كل نسخة في ورقة A4 كاملة منفصلة
    // من غير أي تصغير أو قص، مع فاصل صفحة إجباري بين النسختين
    // ---------------------------------------------------
    const twoFullPagesBody = `
      <div class="print-frame-full">
        <div class="print-copy-full">
          ${letterHtml}
        </div>
      </div>

      <div class="page-break"></div>

      <div class="print-frame-full">
        <div class="print-copy-full">
          ${letterHtml}
        </div>
      </div>
    `;

    const twoFullPagesStyles = `
      ${sharedStyles}

      .print-frame-full {
        min-height: 277mm;
        width: 100%;
        border: 1px solid #ddd;
        box-sizing: border-box;
        padding: 6mm;
        display: flex;
        flex-direction: column;
      }

      .print-copy-full {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .page-break {
        page-break-before: always;
        break-before: page;
        height: 0;
      }

      tr {
        page-break-inside: avoid;
      }
    `;

    const finalBody = fitsTwoPerPage
      ? twoPerPageBody
      : twoFullPagesBody;

    const finalStyles = fitsTwoPerPage
      ? twoPerPageStyles
      : twoFullPagesStyles;

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
            ${finalStyles}
          </style>
        </head>

        <body>
          ${finalBody}
        </body>
      </html>
    `);

    printWindow.document.close();

    const doPrint = () => {
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();

        window.setTimeout(() => {
          printWindow.close();
        }, 500);
      }, 700);
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
     Page Title
  ======================================================= */

  const pageTitle =
    letterType === "end-attachment"
      ? "اصدار خطاب إنهاء إلحاق"
      : "اصدار خطاب إلحاق";

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div
      className="flex flex-col gap-6 w-full pb-10"
      dir="rtl"
    >
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

      <div className="flex justify-center">
        <Stepper />
      </div>

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

      {/* Letter Information */}
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
              (letterType ===
              "end-attachment"
                ? "إنهاء إلحاق"
                : "إلحاق")
            }
          />

          <InfoPair
            label="رقم الخطاب"
            value={
              letterNumber !== null
                ? toArabicDigits(
                    letterNumber
                  )
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
              letterType ===
              "end-attachment"
                ? "سيتم إنهاء الإلحاق"
                : toArabicDigits(
                    letterData.attachmentPlace ||
                      soldiers[0]
                        ?.attachmentUnit ||
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

      {/* Personnel */}
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

      {/* Preview */}
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
            notes={letterData.notes}
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

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-4">
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
              saving || success ? 0.6 : 1,
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

        <button
          type="button"
          disabled={saving}
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

      {/* Modals */}
      {saving && <LoadingModal />}

      {success && (
        <SuccessModal
          letterNumber={letterNumber}
        />
      )}
    </div>
  );
}