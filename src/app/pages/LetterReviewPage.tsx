import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Download, Printer } from "lucide-react";
import type { CSSProperties } from "react";
import html2canvas from "html2canvas-pro";
import { createNotification } from "../../lib/createNotification";
import { supabase } from "../../lib/supabase";
import { STAGE_MONTHS } from "../../lib/trainingRecommendations";
import { useUnsavedChanges } from "../../lib/unsavedChanges";
import imgEagle from "figma:asset/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";
import {
  mapLetterTypeRow,
  renderLetterBody,
  applyPersonnelEffect,
  resolveSoldierFieldForTemplate,
  getLetterScopedFields,
  getSoldierScopedFields,
  getTableVisibleSoldierFields,
  DEFAULT_VISIBLE_SOLDIER_COLUMNS,
  DEFAULT_PRINT_VISIBLE_SOLDIER_COLUMNS,
  type LetterTypeConfig,
  type ExtraFieldDefinition,
  type AllowedPersonnelField,
  type BaseSoldierColumnKey,
} from "../../lib/letterTypeEngine";

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
   ثوابت طباعة الخطاب (نسختين في صفحة واحدة عند إمكانية ذلك)
========================================================= */

const PRINT_PAGE_HEIGHT_MM = 277; // ارتفاع A4 القابل للطباعة (297 - هامشين 10مم)
const PRINT_FRAME_GAP_MM = 4;
const PRINT_COPY_SCALE = 0.94;
const PRINT_SAFETY_MARGIN_MM = 3;

const PRINT_FRAME_HEIGHT_MM =
  (PRINT_PAGE_HEIGHT_MM - PRINT_FRAME_GAP_MM) / 2;

const MAX_HEIGHT_FOR_TWO_PER_PAGE_MM =
  PRINT_FRAME_HEIGHT_MM / PRINT_COPY_SCALE - PRINT_SAFETY_MARGIN_MM;

// ✅ سنترستخدمها كعلامة مؤقتة مكان التاريخ جوه النص، عشان
// نقدر نستبدلها بعد كده بعنصر <DateBlank/> الحقيقي (مش نص عادي)
const DATE_MARKER = "@@DATE@@";

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

const renderTextWithDates = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4})/g);

  return parts.map((part, index) => {
    const isDate = /^\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4}$/.test(part);

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

    return <span key={index}>{toArabicDigits(part)}</span>;
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
type SoldierWithExtraData = SoldierData & {
  extraData: Record<string, string>;
};

const BASE_COLUMN_RENDERERS: Record<
  BaseSoldierColumnKey,
  { header: string; render: (s: SoldierWithExtraData) => React.ReactNode }
> = {
  military_id: { header: "رقم عسكري", render: (s) => s.militaryId || "-" },
  rank: { header: "درجة", render: (s) => s.rank },
  name: { header: "اسم", render: (s) => s.name },
  unit: { header: "الوحدة", render: (s) => s.unit },
  attachment_unit: {
    header: "وحدة الإلحاق",
    render: (s) => s.attachmentUnit || "لا يوجد",
  },
};
type SoldierData = {
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
  isManual?: boolean;
};

type LetterDataState = {
  destination: string;
  destinationId: string;
  issuingUnitId: string;
  letterFieldValues: Record<string, string>;
};

type PageState = {
  letterTypeId?: string;
  letterTypeCode?: string;
  letterTypeName?: string;
  soldiers?: SoldierWithExtraData[];
  letterData?: LetterDataState;
};

interface Unit {
  id: string;
  name: string;
  code: string;
}

interface ExternalAdministration {
  id: string;
  name: string;
}

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
   عرض قيمة حقل بشكل نص مقروء (تحويل ID لاسم لو select_unit /
   select_administration، وإلا القيمة زي ما هي)
========================================================= */

function getFieldDisplayValue(
  field: ExtraFieldDefinition,
  rawValue: string | undefined,
  units: Unit[],
  administrations: ExternalAdministration[]
): string {
  if (!rawValue) return "";

  switch (field.type) {
    case "select_unit":
      return units.find((u) => u.id === rawValue)?.name ?? "";

    case "select_administration":
      return (
        administrations.find((a) => a.id === rawValue)?.name ?? ""
      );

    case "month":
      return (
        STAGE_MONTHS.find((m) => String(m.value) === String(rawValue))
          ?.label ?? rawValue
      );

    default:
      return rawValue;
  }
}

// ✅ حقل "stageLabel" مركّب من شهر + سنة المرحلة التجنيدية، متاح
// تلقائيًا لأي قالب نص يستخدمه، لو letterFieldValues فيها
// stage_month و stage_year
function computeStageLabel(letterFieldValues: Record<string, string>): string {
  const month = letterFieldValues["stage_month"];
  const year = letterFieldValues["stage_year"];

  if (!month || !year) return "";

  const monthLabel =
    STAGE_MONTHS.find((m) => String(m.value) === String(month))?.label ?? "";

  return `${monthLabel} ${toArabicDigits(year)}`;
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
        style={{ width: "clamp(320px,50vw,560px)", padding: "70px 40px" }}
        dir="rtl"
      >
        <div className="flex items-center gap-5">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="w-4 h-4 rounded-full"
              style={{
                background: "linear-gradient(to bottom,#00B867,#00522E)",
                animation: `reviewBounce 1.2s ease-in-out ${item * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        <p style={{ ...F, fontWeight: 700, fontSize: 32, color: "#122b16", marginTop: 30 }}>
          يرجى الانتظار
        </p>

        <p style={{ ...F, fontWeight: 700, fontSize: 20, color: "#404040", marginTop: 12 }}>
          يتم حفظ الخطاب وتحديث بيانات الأفراد الآن
        </p>
      </div>

      <style>
        {`
          @keyframes reviewBounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 1; }
            40% { transform: translateY(-14px); opacity: .7; }
          }
        `}
      </style>
    </div>
  );
}

/* =========================================================
   Success Modal
========================================================= */

function SuccessModal({ letterNumber }: { letterNumber: number | null }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,.45)" }}
    >
      <div
        className="bg-white rounded-[24px] flex flex-col items-center justify-center text-center"
        style={{ width: "clamp(320px,50vw,560px)", padding: "60px 40px" }}
        dir="rtl"
      >
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(to bottom,#00B867,#00522E)" }}
        >
          <span style={{ color: "#fff", fontSize: 50, fontWeight: 700 }}>✓</span>
        </div>

        <p style={{ ...F, fontWeight: 700, fontSize: 32, color: "#122b16", marginTop: 30 }}>
          عملية ناجحة!
        </p>

        <p style={{ ...F, fontWeight: 700, fontSize: 20, color: "#404040", marginTop: 15 }}>
          تم حفظ الخطاب وتحديث بيانات الأفراد بنجاح
        </p>

        {letterNumber !== null && (
          <p style={{ ...F, fontWeight: 700, fontSize: 18, color: "#00522E", marginTop: 10 }}>
            رقم الخطاب: {toArabicDigits(letterNumber)}
          </p>
        )}

        <p style={{ ...F, fontSize: 14, color: "#717d96", marginTop: 15 }}>
          جاري توجيهك للصفحة الرئيسية...
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   Stepper
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
          borderColor: done ? "#00a85a" : active ? "#2d3648" : "#a1aebe",
          background: done ? "#00a85a" : "#fff",
        }}
      >
        <span style={{ ...F, fontSize: 13, color: done ? "#fff" : "#2d3648" }}>
          {done ? "✓" : number}
        </span>
      </div>

      <span
        style={{
          ...F,
          fontSize: 14,
          color: done ? "#00864d" : active ? "#2d3648" : "#465668",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Stepper() {
  const steps = [
    "تحديد نوع الخطاب",
    "تحديد الأفراد",
    "بيانات الخطاب",
    "المراجعة والتصديق",
  ];

  return (
    <div className="flex items-start justify-center flex-wrap" dir="rtl">
      {steps.map((step, index) => (
        <div key={step} className="flex items-start">
          <StepBubble number={`0${index + 1}`} label={step} done={index < 3} active={index === 3} />

          {index < 3 && (
            <div className="flex items-center gap-[3px] mt-4 mx-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-[3px] h-[3px] rounded-full" style={{ background: "#1A202C" }} />
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

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ ...F, fontSize: 15, color: "#717d96" }}>{label}</span>
      <span style={{ ...F, fontSize: 15, color: "#172e78" }}>:</span>
      <span style={{ ...F, fontSize: 15, color: "#2d3648" }}>{value || "-"}</span>
    </div>
  );
}

/* =========================================================
   Date Blank
========================================================= */

function DateBlank({ month, year }: { month: string | number; year: number }) {
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
      <span style={{ display: "inline-block", width: "25px" }}>&nbsp;</span>
      <span>/</span>
      <span>{toArabicDigits(month)}</span>
      <span>/</span>
      <span>{toArabicDigits(year)}</span>
    </span>
  );
}

/* =========================================================
   Letter Preview (عام بالكامل، بيتبني من إعدادات نوع الخطاب)
========================================================= */

function LetterPreview({
  config,
  soldiers,
  destination,
  letterFieldValues,
  units,
  administrations,
  branchHeadName,
  branchHeadRank,
}: {
  config: LetterTypeConfig;
  soldiers: SoldierWithExtraData[];
  destination: string;
  letterFieldValues: Record<string, string>;
  units: Unit[];
  administrations: ExternalAdministration[];
  branchHeadName: string;
  branchHeadRank: string;
}) {
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = now.getFullYear();

  const isSingular = soldiers.length === 1;

  const letterFields = getLetterScopedFields(config);
  const soldierFields = getSoldierScopedFields(config);
  const tableSoldierFields = getTableVisibleSoldierFields(config);
  // ✅ بناء بيانات القالب: حقول الخطاب + الحقول الخاصة بالأفراد
  // (بقيمتها المشتركة لو كلهم متفقين، أو نص بديل لو مختلفين)
  const templateData: Record<string, string> = {
    date: DATE_MARKER,
    stageLabel: computeStageLabel(letterFieldValues),
  };

  letterFields.forEach((field) => {
    templateData[field.key] = getFieldDisplayValue(
      field,
      letterFieldValues[field.key],
      units,
      administrations
    );
  });

  soldierFields.forEach((field) => {
    const displayValues = soldiers.map((soldier) =>
      getFieldDisplayValue(field, soldier.extraData[field.key], units, administrations)
    );

    templateData[field.key] = resolveSoldierFieldForTemplate(
      field,
      displayValues
    );
  });

  const rawBody = renderLetterBody(config, isSingular, templateData);
  const bodySegments = rawBody.split(DATE_MARKER);

  const printBaseColumns =
    config.printVisibleSoldierColumns ?? DEFAULT_PRINT_VISIBLE_SOLDIER_COLUMNS;

  const tableHeaders = [
    "م",
    ...printBaseColumns.map((key) => BASE_COLUMN_RENDERERS[key].header),
    ...tableSoldierFields.map((f) => f.label),
  ];

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
          <div style={{ ...PF, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <p style={{ ...PF, fontSize: 14, fontWeight: 700, margin: 0 }}>
              قيـــــادة قـــوات الصـاعقـــة
            </p>

            <p style={{ ...PF, fontSize: 14, margin: "3px 0" }}>
              فــــــرع التنظيــــــم والإدارة
            </p>

            <p style={{ ...PF, fontSize: 14, margin: 0 }}>
              التاريــخ : <DateBlank month={currentMonth} year={currentYear} />
            </p>
          </div>

          <div className="print-logo" style={{ flexShrink: 0 }}>
            <img
              src={imgEagle}
              alt="شعار الجمهورية"
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
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
          إلى / {toArabicDigits(destination || "...")}
        </p>

        {/* Body — مبني من القالب العام + الفراغ الحقيقي للتاريخ */}
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
          {bodySegments.map((segment, index) => (
            <span key={index}>
              {renderTextWithDates(segment)}
              {index < bodySegments.length - 1 && (
                <DateBlank month={currentMonth} year={currentYear} />
              )}
            </span>
          ))}
        </p>

        {/* Table */}
        <table className="w-full border-collapse mb-4" style={{ ...PF, fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f5f5f5", textAlign: "center" }}>
              {tableHeaders.map((header) => (
                <th
                  key={header}
                  style={{ padding: "5px", border: "1px solid #ddd", textAlign: "center" }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {soldiers.map((soldier, index) => (
              <tr key={soldier.id}>
                <td style={{ padding: "5px", border: "1px solid #eee", textAlign: "center" }}>
                  {toArabicDigits(index + 1)}
                </td>

                {printBaseColumns.map((key) => (
                  <td
                    key={key}
                    style={{ padding: "5px", border: "1px solid #eee", textAlign: "center" }}
                  >
                    {toArabicDigits(BASE_COLUMN_RENDERERS[key].render(soldier) as string)}
                  </td>
                ))}

                {tableSoldierFields.map((field) => (
                  <td
                    key={field.key}
                    style={{ padding: "5px", border: "1px solid #eee", textAlign: "center" }}
                  >
                    {toArabicDigits(
                      getFieldDisplayValue(
                        field,
                        soldier.extraData[field.key],
                        units,
                        administrations
                      ) || "-"
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Greeting */}
        <p style={{ ...PF, fontSize: 14, marginTop: 20, textAlign: "center" }}>
          مع وافر التحية ،،،
        </p>

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
            textAlignLast: "justify",
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, whiteSpace: "pre" }}>
            {"التوقيع (                             )"}
          </p>

          <p style={{ margin: "6px 0 0", fontWeight: 700 }}>
            {toArabicDigits(branchHeadRank || "جاري تحميل الرتبة")} /{" "}
            {toArabicDigits(branchHeadName || "جاري تحميل الاسم")}
          </p>

          <p style={{ margin: "4px 0 0", fontWeight: 700 }}>
            رئيــــس فــــرع التنظيــــم والاداره
          </p>
        </div>
      </div>

      <style>
        {`
          .print-logo {
            width: 80px; height: 80px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          }

          .print-logo img { width: 100%; height: 100%; object-fit: contain; }

          @media print {
            .print-logo { width: 32px !important; height: 32px !important; }
            .print-logo img {
              width: 32px !important; height: 32px !important;
              max-width: 32px !important; max-height: 32px !important;
            }
            .letter-preview {
              box-shadow: none !important; border: none !important;
              margin: 0 !important; max-width: none !important; padding: 16px !important;
            }
            body { background: #fff !important; }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }

          @page { size: A4; margin: 12mm; }
        `}
      </style>
    </>
  );
}

/* =========================================================
   Preview Upload (نفس الآلية القديمة، عامة أصلًا)
========================================================= */

async function generateAndUploadPreview(letterId: string): Promise<PreviewResult> {
  const previewElement = document.querySelector(".letter-preview") as HTMLElement | null;

  if (!previewElement) {
    return { ok: false, reason: "no-preview-element" };
  }

  const images = Array.from(previewElement.querySelectorAll("img"));

  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();

      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
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
   
    return { ok: false, reason: "capture-failed" };
  }

  let blob: Blob | null = null;

  try {
    blob = await new Promise<Blob | null>((resolve, reject) => {
      try {
        canvas.toBlob((result) => resolve(result), "image/png");
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
   
    return { ok: false, reason: "tainted-canvas" };
  }

  if (!blob) {
    return { ok: false, reason: "empty-blob" };
  }

  const previewPath = `${letterId}/preview.png`;

  const { error: uploadError } = await supabase.storage
    .from("letter-attachments")
    .upload(previewPath, blob, {
      cacheControl: "3600",
      upsert: true,
      contentType: "image/png",
    });

  if (uploadError) {
   
    return { ok: false, reason: "upload-failed" };
  }

  const { error: updateError } = await supabase
    .from("letters")
    .update({ preview_image_path: previewPath })
    .eq("id", letterId);

  if (updateError) {

    return { ok: false, reason: "db-update-failed" };
  }

  return { ok: true };
}

/* =========================================================
   Main Page
========================================================= */

export function LetterReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as PageState | null;

  const soldiers = state?.soldiers ?? [];

  const letterData: LetterDataState =
    state?.letterData ?? {
      destination: "",
      destinationId: "",
      issuingUnitId: "",
      letterFieldValues: {},
    };

  const [units, setUnits] = useState<Unit[]>([]);
  const [administrations, setAdministrations] = useState<ExternalAdministration[]>([]);
  const [letterTypeConfig, setLetterTypeConfig] = useState<LetterTypeConfig | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [letterNumber, setLetterNumber] = useState<number | null>(null);
  const [branchHeadName, setBranchHeadName] = useState("");
  const [branchHeadRank, setBranchHeadRank] = useState("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [previewWarning, setPreviewWarning] = useState("");

  // ─────────────────────────────────────────────────────────
  // تتبّع التعديلات غير المحفوظة
  // ─────────────────────────────────────────────────────────
  // طول ما فيه أفراد محمّلين والخطاب لسه محصلش حفظ فعلي، يبقى
  // فيه عمل تم إنجازه (على مدار 3 خطوات) هيتفقد لو غادر الصفحة
  const { setDirty } = useUnsavedChanges();

  useEffect(() => {
    setDirty(soldiers.length > 0 && !success);
  }, [soldiers.length, success, setDirty]);

  useEffect(() => {
    return () => setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     Load reference data + letter type config + branch head
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      setLoadingData(true);
      setLoadError("");

      if (!state?.letterTypeId) {
        setLoadError("نوع الخطاب غير موجود. ارجع واختر نوع الخطاب مرة أخرى.");
        setLoadingData(false);
        return;
      }

      try {
        const [
          { data: unitsData, error: unitsError },
          { data: adminsData, error: adminsError },
          { data: typeRow, error: typeError },
          { data: branchHead, error: branchError },
        ] = await Promise.all([
          supabase.from("units").select("id,name,code").order("name"),
          supabase
            .from("external_administrations")
            .select("id,name")
            .eq("is_active", true)
            .order("name"),
          supabase
            .from("letter_types")
            .select(
              "id, name, code, body_template_singular, body_template_plural, extra_fields, personnel_effect, eligibility_rules, print_visible_soldier_columns"
            )
            .eq("id", state.letterTypeId)
            .maybeSingle(),
          supabase
            .from("branch_heads")
            .select(
              `id, full_name, rank_id, rank:letter_officer_ranks!branch_heads_rank_id_fkey(name)`
            )
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (!mounted) return;

        if (unitsError) throw new Error(`خطأ في تحميل الوحدات: ${unitsError.message}`);
        if (adminsError) throw new Error(`خطأ في تحميل الإدارات: ${adminsError.message}`);
        if (typeError) throw new Error(`خطأ في تحميل نوع الخطاب: ${typeError.message}`);
        if (!typeRow) throw new Error("نوع الخطاب غير موجود في قاعدة البيانات.");

        setUnits(unitsData ?? []);
        setAdministrations(adminsData ?? []);
        setLetterTypeConfig(mapLetterTypeRow(typeRow));

        if (!branchError && branchHead) {
          const rank = getRelationObject(branchHead.rank) as { name?: string } | null;
          setBranchHeadName(branchHead.full_name ?? "");
          setBranchHeadRank(rank?.name ?? "");
        }
      } catch (err) {
    

        if (mounted) {
          setLoadError(
            err instanceof Error ? err.message : "حدث خطأ أثناء تحميل البيانات"
          );
        }
      } finally {
        if (mounted) setLoadingData(false);
      }
    }

    loadAll();

    return () => {
      mounted = false;
    };
  }, [state?.letterTypeId]);

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
      setError("نوع الخطاب غير موجود. ارجع واختر نوع الخطاب مرة أخرى.");
      return;
    }

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
        throw new Error(`خطأ في جلسة الدخول: ${sessionError.message}`);
      }

      if (!session?.user) {
        throw new Error("جلسة تسجيل الدخول غير موجودة. من فضلك سجل الدخول مرة أخرى.");
      }

      const userId = session.user.id;

      /* -----------------------------------------------
         Letter Type (نجيبها fresh وقت الحفظ للأمان)
      ----------------------------------------------- */

      const { data: typeRow, error: typeError } = await supabase
        .from("letter_types")
        .select(
          "id, name, code, body_template_singular, body_template_plural, extra_fields, personnel_effect, eligibility_rules, print_visible_soldier_columns"
        )
        .eq("id", state.letterTypeId)
        .maybeSingle();

      if (typeError) {
        throw new Error(`خطأ في نوع الخطاب: ${typeError.message}`);
      }

      if (!typeRow) {
        throw new Error("نوع الخطاب غير موجود في قاعدة البيانات.");
      }

      const config = mapLetterTypeRow(typeRow);

      /* -----------------------------------------------
         Branch Head
      ----------------------------------------------- */

      const { data: branchHead, error: branchError } = await supabase
        .from("branch_heads")
        .select(
          `id, full_name, rank_id, rank:letter_officer_ranks!branch_heads_rank_id_fkey(name)`
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (branchError) {
        throw new Error(`خطأ في تحميل رئيس الفرع: ${branchError.message}`);
      }

      if (!branchHead) {
        throw new Error("لا يوجد رئيس فرع نشط في قاعدة البيانات.");
      }

      const branchRank = getRelationObject(branchHead.rank) as { name?: string } | null;

      /* -----------------------------------------------
         حساب تأثير كل فرد + قيمة letters.attachment_unit_id
         التقريبية (لو فيه قاعدة بتأثر على الحقل ده، بناءً على
         أول فرد في القائمة، لأغراض التوافق مع تقارير قديمة)
      ----------------------------------------------- */

      const perSoldierUpdates = soldiers.map((soldier) => {
        const formData: Record<string, string> = {
          ...letterData.letterFieldValues,
          ...soldier.extraData,
        };

        return {
          soldier,
          updates: applyPersonnelEffect(config.personnelEffect, formData),
        };
      });

      const firstRegisteredSoldierUpdate = perSoldierUpdates.find(
        ({ soldier }) => !soldier.isManual
      );

      const letterLevelAttachmentUnitId =
        firstRegisteredSoldierUpdate?.updates.attachment_unit_id ?? null;

      /* -----------------------------------------------
         Insert Letter
      ----------------------------------------------- */

      const letterInsert = {
        letter_type_id: config.id,
        issuing_unit_id: letterData.issuingUnitId || null,
        destination_name: letterData.destination?.trim() || null,
        attachment_unit_id: letterLevelAttachmentUnitId,
        personnel_count: soldiers.length,
        branch_head_id: branchHead.id,
        branch_head_name: branchHead.full_name ?? "",
        branch_head_rank: branchRank?.name ?? "",
        status: "UNDOCUMENTED",
        created_by: userId,
        extra_data: letterData.letterFieldValues,
      };

      const { data: newLetter, error: insertLetterError } = await supabase
        .from("letters")
        .insert(letterInsert)
        .select("id, letter_number")
        .single();

      if (insertLetterError) {
        throw new Error(`خطأ في حفظ الخطاب: ${insertLetterError.message}`);
      }

      if (!newLetter) {
        throw new Error("تعذر إنشاء الخطاب.");
      }

      createdLetterId = newLetter.id;

      /* -----------------------------------------------
         Link Personnel (extra_data عام لكل فرد)
      ----------------------------------------------- */

      const personnelRows = soldiers.map((soldier) => ({
        letter_id: newLetter.id,
        personnel_id: soldier.isManual ? null : soldier.id,
        manual_name: soldier.isManual ? soldier.name : null,
        manual_rank: soldier.isManual ? soldier.rank : null,
        manual_unit: soldier.isManual ? soldier.unit : null,
        extra_data: soldier.extraData,
      }));

      const { error: personnelError } = await supabase
        .from("letter_personnel")
        .insert(personnelRows);

      if (personnelError) {
        throw new Error(
          `تم إنشاء الخطاب ولكن فشل ربط الأفراد: ${personnelError.message}`
        );
      }

      /* -----------------------------------------------
         Update Personnel (لو الخطاب مش توثيقي، أي فرد بدون
         تحديثات هيتخطى تلقائيًا لأن updates هتكون فاضية)
      ----------------------------------------------- */

      const updateResults = await Promise.all(
        perSoldierUpdates.map(({ soldier, updates }) => {
          if (soldier.isManual) {
            // ✅ فرد مُدخَل يدويًا — مفيش سجل حقيقي في personnel
            // نقدر نحدّثه، فبنتخطاه دايمًا بغض النظر عن الإعدادات
            return Promise.resolve({ error: null });
          }

          if (Object.keys(updates).length === 0) {
            return Promise.resolve({ error: null });
          }

          return supabase
            .from("personnel")
            .update({
              ...(updates as Record<AllowedPersonnelField, string | null>),
              updated_at: new Date().toISOString(),
            })
            .eq("id", soldier.id);
        })
      );

      const updatePersonnelError = updateResults.find((r) => r.error)?.error;

      if (updatePersonnelError) {
        throw new Error(
          `تم حفظ الخطاب وربط الأفراد، ولكن فشل تحديث حالة الأفراد: ${updatePersonnelError.message}`
        );
      }

      /* -----------------------------------------------
         Audit Log
      ----------------------------------------------- */

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
      
      }

      const auditDetails =
        `رقم الخطاب: ${newLetter.letter_number} — ` +
        `نوع الخطاب: ${config.name} — ` +
        `عدد الأفراد: ${soldiers.length}`;

      const { error: auditError } = await supabase.from("audit_logs").insert({
        user_id: userId,
        user_name: profile?.username ?? "غير معروف",
        action_type: "CREATE",
        action: "إصدار خطاب",
        entity: "letters",
        details: auditDetails,
      });

      if (auditError) {
   
      }

      /* -----------------------------------------------
         Notification
      ----------------------------------------------- */

      await createNotification({
        title: "تم إصدار خطاب",
        body: `تم إصدار ${config.name} رقم ${newLetter.letter_number}`,
        type: "success",
        entityType: "letter",
        entityId: newLetter.id,
        userName: profile?.username ?? "غير معروف",
      });

      /* -----------------------------------------------
         Preview
      ----------------------------------------------- */

      try {
        const previewResult = await generateAndUploadPreview(newLetter.id);

        if (!previewResult.ok) {
   

          setPreviewWarning(
            "تم حفظ الخطاب بنجاح، لكن تعذّر إنشاء نسخة المعاينة المؤقتة. يمكنك رفع النسخة الموقعة مباشرة من صفحة تفاصيل الخطاب."
          );
        }
      } catch (previewError) {


        setPreviewWarning(
          "تم حفظ الخطاب بنجاح، لكن تعذّر إنشاء نسخة المعاينة المؤقتة. يمكنك رفع النسخة الموقعة مباشرة من صفحة تفاصيل الخطاب."
        );
      }

      /* -----------------------------------------------
         Success
      ----------------------------------------------- */

      setLetterNumber(newLetter.letter_number);
      setBranchHeadName(branchHead.full_name ?? "");
      setBranchHeadRank(branchRank?.name ?? "");
      setSaving(false);
      setSuccess(true);

      // ✅ الخطاب اتحفظ فعليًا في قاعدة البيانات، مفيش داعي
      // نحذّر المستخدم بعد كده (وهو أصلاً هيتحول تلقائيًا بعد 3 ثواني)
      setDirty(false);
    } catch (err) {


      if (createdLetterId) {
        try {
          await supabase.from("letter_personnel").delete().eq("letter_id", createdLetterId);
          await supabase.from("letters").delete().eq("id", createdLetterId);
        } catch (rollbackError) {

        }
      }

      setSaving(false);

      setError(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الخطاب.");
    }
  }, [saving, success, soldiers, state, letterData]);

  /* =======================================================
     Redirect
  ======================================================= */

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      navigate("/dashboard");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [success, navigate]);

  /* =======================================================
     Print
  ======================================================= */

  function measureLetterHeightMM(letterElement: HTMLElement): number {
    const PRINT_CONTENT_WIDTH_MM = 190;
    const PX_PER_MM = 96 / 25.4;

    const clone = letterElement.cloneNode(true) as HTMLElement;

    clone.style.display = "flex";
    clone.style.flexDirection = "column";
    clone.style.position = "fixed";
    clone.style.top = "-99999px";
    clone.style.left = "-99999px";
    clone.style.margin = "0";
    clone.style.maxWidth = "none";
    clone.style.border = "none";
    clone.style.borderRadius = "0";
    clone.style.boxShadow = "none";
    clone.style.padding = "10px";
    clone.style.width = `${PRINT_CONTENT_WIDTH_MM * PX_PER_MM}px`;
    clone.style.height = "auto";
    clone.className = "letter-preview";

    document.body.appendChild(clone);
    const heightPx = clone.getBoundingClientRect().height;
    document.body.removeChild(clone);

    return heightPx / PX_PER_MM;
  }

  const handlePrintLetter = () => {
    const letterElement = document.querySelector(".letter-preview") as HTMLElement | null;

    if (!letterElement) {
      alert("تعذر العثور على الخطاب.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=1200");

    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم المعاينة.");
      return;
    }

    const letterHtml = letterElement.outerHTML;

    const letterTypeLabel = state?.letterTypeName || "خطاب";
    const letterNumberLabel = letterNumber !== null ? toArabicDigits(letterNumber) : "";

    const pdfTitle = `${letterTypeLabel} ${letterNumberLabel} ${letterData.destination || ""}`.trim();

    const heightMM = measureLetterHeightMM(letterElement);
    const fitsTwoPerPage = heightMM <= MAX_HEIGHT_FOR_TWO_PER_PAGE_MM;

    const sharedStyles = `
      @page { size: A4; margin: 10mm; }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; background: #fff; }
      body { direction: rtl; font-family: 'Times New Roman', Times, serif; }
      .letter-preview {
        display: flex !important; flex-direction: column !important;
        width: 100% !important; height: 100% !important; max-width: none !important;
        margin: 0 !important; padding: 10px !important; border: none !important;
        border-radius: 0 !important; box-shadow: none !important; background: #fff !important;
      }
      .signature-block { margin-top: auto !important; }
      .print-logo {
        width: 55px !important; height: 55px !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
        flex-shrink: 0 !important;
      }
      .print-logo img {
        width: 55px !important; height: 55px !important;
        max-width: 55px !important; max-height: 55px !important; object-fit: contain !important;
      }
      table { width: 100% !important; border-collapse: collapse !important; }
      th, td { border: 1px solid #ddd !important; }
      img { display: block; }
    `;

    const twoPerPageBody = `
      <div class="print-page">
        <div class="print-frame"><div class="print-copy">${letterHtml}</div></div>
        <div class="print-frame"><div class="print-copy">${letterHtml}</div></div>
      </div>
    `;

    const twoPerPageStyles = `
      ${sharedStyles}
      .print-page {
        display: flex; flex-direction: column; width: 100%;
        height: ${PRINT_PAGE_HEIGHT_MM}mm; gap: ${PRINT_FRAME_GAP_MM}mm;
      }
      .print-frame {
        height: ${PRINT_FRAME_HEIGHT_MM}mm; width: 100%; border: 1px solid #ddd;
        box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column;
        page-break-inside: avoid;
      }
      .print-copy {
        width: 100%; height: 100%; flex: 1;
        transform: scale(${PRINT_COPY_SCALE}); transform-origin: top center;
      }
      @media print {
        html, body { width: 100%; min-height: 100%; overflow: visible !important; }
        .print-page { page-break-inside: avoid; }
      }
    `;

    const twoFullPagesBody = `
      <div class="print-frame-full"><div class="print-copy-full">${letterHtml}</div></div>
      <div class="page-break"></div>
      <div class="print-frame-full"><div class="print-copy-full">${letterHtml}</div></div>
    `;

    const twoFullPagesStyles = `
      ${sharedStyles}
      .print-frame-full {
        min-height: 277mm; width: 100%; border: 1px solid #ddd;
        box-sizing: border-box; padding: 6mm; display: flex; flex-direction: column;
      }
      .print-copy-full { width: 100%; flex: 1; display: flex; flex-direction: column; }
      .page-break { page-break-before: always; break-before: page; height: 0; }
      tr { page-break-inside: avoid; }
    `;

    const finalBody = fitsTwoPerPage ? twoPerPageBody : twoFullPagesBody;
    const finalStyles = fitsTwoPerPage ? twoPerPageStyles : twoFullPagesStyles;

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${pdfTitle}</title>
          <style>${finalStyles}</style>
        </head>
        <body>${finalBody}</body>
      </html>
    `);

    printWindow.document.close();

    const doPrint = () => {
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        window.setTimeout(() => printWindow.close(), 500);
      }, 700);
    };

    if (printWindow.document.readyState === "complete") {
      doPrint();
    } else {
      printWindow.onload = doPrint;
    }
  };

  /* =======================================================
     Loading / Error States
  ======================================================= */

  if (loadingData) {
    return (
      <div className="flex items-center justify-center w-full min-h-[400px]" dir="rtl">
        <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>جاري تحميل بيانات المراجعة...</span>
      </div>
    );
  }

  if (loadError || !letterTypeConfig) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 w-full min-h-[400px]" dir="rtl">
        <div
          className="rounded-[10px] px-5 py-4"
          style={{ ...F, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
        >
          {loadError || "تعذر تحميل بيانات نوع الخطاب."}
        </div>
      </div>
    );
  }

  const letterFields = getLetterScopedFields(letterTypeConfig);
  const soldierFields = getSoldierScopedFields(letterTypeConfig);

  const activeBaseColumns: BaseSoldierColumnKey[] =
    letterTypeConfig.visibleSoldierColumns ?? DEFAULT_VISIBLE_SOLDIER_COLUMNS;

  const tableSoldierFields = getTableVisibleSoldierFields(letterTypeConfig);

  const tableHeaders = [
    ...activeBaseColumns.map((key) => BASE_COLUMN_RENDERERS[key].header),
    ...tableSoldierFields.map((f) => f.label),
  ];
  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <h1
        className="text-center"
        style={{ ...F, fontWeight: 700, fontSize: "clamp(22px,4vw,32px)", color: "#2d3648" }}
      >
        {`اصدار ${letterTypeConfig.name}`}
      </h1>

      <div className="flex justify-center">
        <Stepper />
      </div>

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{ ...F, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", whiteSpace: "pre-line" }}
        >
          {error}
        </div>
      )}

      {previewWarning && !error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{ ...F, background: "#fff8e8", border: "1px solid #f4d58d", color: "#8a6500", whiteSpace: "pre-line" }}
        >
          {previewWarning}
        </div>
      )}

      {/* Letter Information */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>بيانات الخطاب</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-6 py-5">
          <InfoPair label="نوع الخطاب" value={letterTypeConfig.name} />

          <InfoPair
            label="رقم الخطاب"
            value={letterNumber !== null ? toArabicDigits(letterNumber) : "سيتم توليده عند الحفظ"}
          />

          <InfoPair label="جهة الخطاب" value={toArabicDigits(letterData.destination)} />

          <InfoPair
            label="تاريخ الخطاب"
            value={toArabicDigits(new Date().toLocaleDateString("en-GB"))}
          />

          <InfoPair label="الوحدة الأساسية" value={toArabicDigits(soldiers[0]?.unit ?? "")} />

          <InfoPair label="عدد الأفراد" value={toArabicDigits(soldiers.length)} />

          {letterFields.map((field) => (
            <InfoPair
              key={field.key}
              label={field.label}
              value={toArabicDigits(
                getFieldDisplayValue(
                  field,
                  letterData.letterFieldValues[field.key],
                  units,
                  administrations
                )
              )}
            />
          ))}

          <InfoPair label="رئيس الفرع" value={toArabicDigits(branchHeadName || "جاري التحميل")} />
        </div>
      </section>

      {/* Personnel */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>بيانات الأفراد</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="bg-[#f7f9fc]">
                {tableHeaders.map((header) => (
                  <th key={header} className="px-4 py-3 text-right border-b">
                    <span style={{ ...F, fontSize: 14, color: "#717d96" }}>{header}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {soldiers.map((soldier) => (
                <tr key={soldier.id}>
                  {activeBaseColumns.map((key) => (
                    <td className="px-4 py-3 border-b" key={key}>
                      {toArabicDigits(BASE_COLUMN_RENDERERS[key].render(soldier) as string) || "-"}
                    </td>
                  ))}

                  {tableSoldierFields.map((field) => (
                    <td key={field.key} className="px-4 py-3 border-b">
                      {toArabicDigits(
                        getFieldDisplayValue(
                          field,
                          soldier.extraData[field.key],
                          units,
                          administrations
                        ) || "لا يوجد"
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Preview */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>معاينة الخطاب</span>
        </div>

        <div className="p-6 bg-[#f7f9fc]">
          <LetterPreview
            config={letterTypeConfig}
            soldiers={soldiers}
            destination={letterData.destination}
            letterFieldValues={letterData.letterFieldValues}
            units={units}
            administrations={administrations}
            branchHeadName={branchHeadName}
            branchHeadRank={branchHeadRank}
          />
        </div>
      </section>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={saving || success}
          onClick={() => void saveLetter()}
          className="flex items-center gap-2 min-h-[48px] px-6 rounded-[8px]"
          style={{
            background: "linear-gradient(to bottom,#00b867,#00522e)",
            opacity: saving || success ? 0.6 : 1,
          }}
        >
          <Printer size={16} color="#fff" />
          <span style={{ ...F, fontSize: 15, color: "#fff" }}>
            {saving ? "جاري الحفظ..." : "تأكيد وحفظ الخطاب"}
          </span>
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={handlePrintLetter}
          className="flex items-center gap-2 min-h-[48px] px-6 rounded-[8px] border border-[#2d3648] bg-white"
        >
          <Download size={16} color="#2d3648" />
          <span style={{ ...F, fontSize: 15, color: "#2d3648" }}>طباعة / تحميل المعاينة</span>
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => navigate("/dashboard")}
          className="min-h-[48px] px-4"
        >
          <span style={{ ...F, fontSize: 15, color: "#172e78", textDecoration: "underline" }}>
            إلغاء
          </span>
        </button>
      </div>

      {saving && <LoadingModal />}
      {success && <SuccessModal letterNumber={letterNumber} />}
    </div>
  );
}