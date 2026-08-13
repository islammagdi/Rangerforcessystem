import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Trash2,
  Printer,
  Pencil,
  Plus,
  ArrowDownUp,
  Download,
} from "lucide-react";

import { DeleteConfirmDialog } from "../components/dashboard/DeleteConfirmDialog";
import { supabase } from "../../lib/supabase";

const FONT = {
  fontFamily: "'Almarai', sans-serif",
};

/* =========================================================
   Types
========================================================= */

type Letter = {
  id: string;
  letterNumber: string;
  letterDate: string;
  letterType: string;
  destination: string;
  reason: string;
  previewImagePath: string | null;
};

type Soldier = {
  id: string;
  militaryId: string;
  name: string;
  rank: string;
  category: string;
  unit: string;
  serviceStatus: string;
  dischargeDate: string;
  attachmentPlace: string;
  letters: Letter[];
};

/* =========================================================
   Helpers
========================================================= */

function formatDate(date: string | null | undefined) {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(date: Date) {
  return date.toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/* =========================================================
   Info Row
========================================================= */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 justify-start flex-1 min-w-[300px]">
      <span
        className="w-[140px] shrink-0 text-right"
        style={{
          ...FONT,
          fontSize: 18,
          color: "#717d96",
        }}
      >
        {label}
      </span>

      <span
        style={{
          ...FONT,
          fontSize: 18,
          color: "#2d3648",
        }}
      >
        :
      </span>

      <span
        style={{
          ...FONT,
          fontSize: 18,
          color: "#2d3648",
          whiteSpace: "nowrap",
        }}
      >
        {value || "-"}
      </span>
    </div>
  );
}

/* =========================================================
   Section Title
========================================================= */

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        ...FONT,
        fontSize: 18,
        color: "#4a5468",
      }}
    >
      {children}
    </span>
  );
}

/* =========================================================
   Download Letter
========================================================= */

async function downloadLetter(letter: Letter) {
  if (!letter.previewImagePath) {
    alert("لا توجد نسخة محفوظة لهذا الخطاب");
    return;
  }

  try {
    const { data, error } = await supabase.storage
      .from("letter-attachments")
      .download(letter.previewImagePath);

    if (error) {
      console.error("Error downloading letter:", error);

      alert(
        "حدث خطأ أثناء تحميل الخطاب: " +
          error.message,
      );

      return;
    }

    if (!data) {
      alert("تعذر العثور على نسخة الخطاب");
      return;
    }

    const blobUrl = URL.createObjectURL(data);

    const link = document.createElement("a");

    link.href = blobUrl;

    const pathParts = letter.previewImagePath.split("/");
    const originalFileName =
      pathParts[pathParts.length - 1] ||
      `letter-${letter.letterNumber}`;

    link.download = originalFileName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error(
      "Unexpected error downloading letter:",
      error,
    );

    alert("حدث خطأ غير متوقع أثناء تحميل الخطاب");
  }
}

/* =========================================================
   Letters Table
========================================================= */

function LettersTable({
  soldier,
}: {
  soldier: Soldier;
}) {
  const thClass =
    "px-4 py-3 text-right border-b-2 border-[#d4d8fa] whitespace-nowrap bg-white";

  const tdClass =
    "px-4 py-3 text-right border-b border-[#eaecf0] whitespace-nowrap";

  return (
    <div className="w-full overflow-x-auto">
      <table
        className="w-full min-w-[800px]"
        dir="rtl"
      >
        <thead>
          <tr>
            {[
              "رقم الخطاب",
              "تاريخ الخطاب",
              "نوع الخطاب",
              "الجهة الصادر إليها",
              "السبب",
              "الإجراء",
            ].map((h) => (
              <th
                key={h}
                className={thClass}
              >
                <div className="flex items-center gap-1 justify-start">
                  <span
                    style={{
                      ...FONT,
                      fontSize: 16,
                      color: "#717d96",
                    }}
                  >
                    {h}
                  </span>

                  {h !== "الإجراء" && (
                    <ArrowDownUp
                      size={13}
                      className="text-[#a0abc0]"
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {soldier.letters.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className={`${tdClass} text-center w-full py-8`}
              >
                <span
                  style={{
                    ...FONT,
                    fontSize: 16,
                    color: "#717d96",
                   
                  }}
                >
                  لا توجد خطابات مسجلة لهذا الفرد
                </span>
              </td>
            </tr>
          ) : (
            soldier.letters.map((letter) => (
              <tr
                key={letter.id}
                className="hover:bg-[#fafafa] transition-colors"
              >
                <td className={tdClass}>
                  <span
                    style={{
                      ...FONT,
                      fontSize: 16,
                      color: "#2d3648",
                    }}
                  >
                    {letter.letterNumber}
                  </span>
                </td>

                <td className={tdClass}>
                  <span
                    style={{
                      ...FONT,
                      fontSize: 16,
                      color: "#2d3648",
                    }}
                  >
                    {letter.letterDate}
                  </span>
                </td>

                <td className={tdClass}>
                  <span
                    style={{
                      ...FONT,
                      fontSize: 16,
                      color: "#2d3648",
                    }}
                  >
                    {letter.letterType}
                  </span>
                </td>

                <td className={tdClass}>
                  <span
                    style={{
                      ...FONT,
                      fontSize: 16,
                      color: "#2d3648",
                    }}
                  >
                    {letter.destination}
                  </span>
                </td>

                <td className={tdClass}>
                  <span
                    style={{
                      ...FONT,
                      fontSize: 16,
                      color: "#2d3648",
                    }}
                  >
                    {letter.reason}
                  </span>
                </td>

                <td className={tdClass}>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[8px]"
                    style={{
                      backgroundColor: "#ebedfd",
                    }}
                    onClick={() =>
                      downloadLetter(letter)
                    }
                  >
                    <span
                      style={{
                        ...FONT,
                        fontSize: 14,
                        color: "#2d3648",
                      }}
                    >
                      تحميل الخطاب
                    </span>

                    <Download
                      size={14}
                      className="text-[#2d3648]"
                    />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   Print
========================================================= */

function printSoldier(
  soldier: Soldier,
  printerName: string,
) {
  const now = new Date();
  const printDate = formatDateTime(now);

  const printWindow = window.open(
    "",
    "_blank",
    "width=1000,height=800",
  );

  if (!printWindow) {
    alert("تعذر فتح نافذة الطباعة");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />

        <title>بيانات الفرد</title>

        <style>
          @page {
            size: A4;
            margin: 18mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            background: white;
            color: #222;
            font-family: Arial, Tahoma, sans-serif;
            direction: rtl;
          }

          .page {
            width: 100%;
          }

          .header {
            text-align: center;
            margin-bottom: 28px;
            padding-bottom: 18px;
            border-bottom: 2px solid #222;
          }

          .header-title {
            font-size: 23px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          .header-subtitle {
            font-size: 19px;
            font-weight: bold;
            margin-bottom: 6px;
          }

          .header-system {
            font-size: 18px;
            font-weight: bold;
          }

          .report-title {
            text-align: center;
            font-size: 22px;
            font-weight: bold;
            margin: 25px 0;
          }

          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          .info-table td {
            border: 1px solid #bfc4cc;
            padding: 12px;
            font-size: 16px;
          }

          .label {
            width: 20%;
            background: #f4f5f7;
            font-weight: bold;
          }

          .value {
            width: 30%;
          }

          .footer-info {
            margin-top: 35px;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #bfc4cc;
            padding-top: 15px;
            font-size: 15px;
          }

          .signature {
            margin-top: 55px;
            text-align: left;
            font-size: 16px;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>
        <div class="page">

          <div class="header">
            <div class="header-title">
              قيادة قوات الصاعقة
            </div>

            <div class="header-subtitle">
              فرع التنظيم والإدارة
            </div>

            <div class="header-system">
              منظومة الخوارج الداخلية
            </div>
          </div>

          <div class="report-title">
            بيانات الفرد
          </div>

          <table class="info-table">

            <tr>
              <td class="label">
                الرقم العسكري
              </td>

              <td class="value">
                ${soldier.militaryId || "-"}
              </td>

              <td class="label">
                الدرجة
              </td>

              <td class="value">
                ${soldier.rank || "-"}
              </td>
            </tr>

            <tr>
              <td class="label">
                الاسم
              </td>

              <td class="value">
                ${soldier.name || "-"}
              </td>

              <td class="label">
                فئة الفرد
              </td>

              <td class="value">
                ${soldier.category || "-"}
              </td>
            </tr>

            <tr>
              <td class="label">
                الوحدة الأساسية
              </td>

              <td class="value">
                ${soldier.unit || "-"}
              </td>

              <td class="label">
                الموقف الخدمي
              </td>

              <td class="value">
                ${soldier.serviceStatus || "-"}
              </td>
            </tr>

            <tr>
              <td class="label">
                تاريخ التسريح
              </td>

              <td class="value">
                ${soldier.dischargeDate || "-"}
              </td>

              <td class="label">
                جهة الإلحاق
              </td>

              <td class="value">
                ${soldier.attachmentPlace || "-"}
              </td>
            </tr>

          </table>

          <div class="footer-info">
            <div>
              القائم بالطباعة:
              <strong>${printerName || "-"}</strong>
            </div>

            <div>
              تاريخ ووقت الطباعة:
              <strong>${printDate}</strong>
            </div>
          </div>

          <div class="signature">
            التوقيع: ........................................
          </div>

        </div>

        <script>
          window.onload = function () {
            window.focus();
            window.print();

            window.onafterprint = function () {
              window.close();
            };
          };
        </script>

      </body>
    </html>
  `);

  printWindow.document.close();
}

/* =========================================================
   Page
========================================================= */

export function SoldierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [soldier, setSoldier] = useState<Soldier | null>(null);

  const printerName = "مستخدم النظام";

  /* =======================================================
     Load Soldier + Letters
  ======================================================= */

  async function loadSoldier() {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      /* ---------------------------------------------------
         1. تحميل بيانات الفرد
      --------------------------------------------------- */

      const {
        data: personnelData,
        error: personnelError,
      } = await supabase
        .from("personnel")
        .select(`
          id,
          military_number,
          full_name,
          personnel_category_id,
          primary_unit_id,
          attachment_unit_id,
          service_status_id,
          rank_id,
          discharge_date,

          personnel_categories (
            id,
            name
          ),

          ranks (
            id,
            name
          ),

          primary_unit:units!primary_unit_id (
            id,
            name,
            code
          ),

          attachment_unit:units!attachment_unit_id (
            id,
            name,
            code
          ),

          service_statuses (
            id,
            name
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (personnelError) {
        console.error(
          "Error loading personnel:",
          personnelError,
        );

        setSoldier(null);
        return;
      }

      if (!personnelData) {
        setSoldier(null);
        return;
      }

      const raw = personnelData as any;

      /* ---------------------------------------------------
         2. تحميل خطابات الفرد من جدول الربط

         letter_personnel
         ├── personnel_id
         └── letter_id
      --------------------------------------------------- */

      const {
        data: lettersData,
        error: lettersError,
      } = await supabase
        .from("letter_personnel")
        .select(`
          personnel_id,

          letters (
            id,
            letter_number,
            letter_date,
            reason,
            letter_type_id,
            issuing_unit_id,
            attachment_unit_id,
            preview_image_path,

            letter_types (
              id,
              name
            ),

            issuing_unit:units!issuing_unit_id (
              id,
              name,
              code
            ),

            attachment_unit:units!attachment_unit_id (
              id,
              name,
              code
            )
          )
        `)
        .eq("personnel_id", id);

      if (lettersError) {
        console.error(
          "Error loading personnel letters:",
          lettersError,
        );
      }

      /* ---------------------------------------------------
         3. تحويل الخطابات للشكل المطلوب للواجهة
      --------------------------------------------------- */

      const mappedLetters: Letter[] = (lettersData ?? [])
        .map((row: any) => row.letters)
        .filter(Boolean)
        .map((letter: any) => {
          const destination =
            letter.attachment_unit?.name ??
            letter.issuing_unit?.name ??
            "-";

          return {
            id: letter.id,

            letterNumber:
              letter.letter_number != null
                ? String(letter.letter_number)
                : "-",

            letterDate:
              letter.letter_date
                ? formatDate(letter.letter_date)
                : "-",

            letterType:
              letter.letter_types?.name ??
              "-",

            destination,

            reason:
              letter.reason ??
              "-",

            previewImagePath:
              letter.preview_image_path ??
              null,
          };
        });

      /* ---------------------------------------------------
         4. إنشاء بيانات الفرد النهائية
      --------------------------------------------------- */

      const mappedSoldier: Soldier = {
        id: raw.id,

        militaryId:
          raw.military_number ?? "-",

        name:
          raw.full_name ?? "-",

        rank:
          raw.ranks?.name ?? "-",

        category:
          raw.personnel_categories?.name ?? "-",

        unit:
          raw.primary_unit?.name ?? "-",

        serviceStatus:
          raw.service_statuses?.name ?? "-",

        dischargeDate:
          raw.discharge_date
            ? formatDate(raw.discharge_date)
            : "-",

        attachmentPlace:
          raw.attachment_unit?.name ?? "-",

        letters: mappedLetters,
      };

      console.log(
        "بيانات الفرد:",
        mappedSoldier,
      );

      console.log(
        "خطابات الفرد:",
        mappedLetters,
      );

      setSoldier(mappedSoldier);

    } catch (error) {
      console.error(
        "Unexpected error:",
        error,
      );

      setSoldier(null);

    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     Load on page mount / id change
  ======================================================= */

  useEffect(() => {
    loadSoldier();
  }, [id]);

  /* =======================================================
     Loading
  ======================================================= */

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        dir="rtl"
      >
        <p
          style={{
            ...FONT,
            fontSize: 18,
            color: "#717d96",
          }}
        >
          جاري تحميل بيانات الفرد...
        </p>
      </div>
    );
  }

  /* =======================================================
     Not Found
  ======================================================= */

  if (!soldier) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 gap-4"
        dir="rtl"
      >
        <p
          style={{
            ...FONT,
            fontSize: 18,
            color: "#717d96",
          }}
        >
          لم يتم العثور على الفرد
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/dashboard/individual-query")
          }
          className="px-4 py-2 rounded-lg text-white"
          style={{
            ...FONT,
            backgroundColor: "#2d3648",
          }}
        >
          العودة للبحث
        </button>
      </div>
    );
  }

  /* =======================================================
     Delete
  ======================================================= */

  async function handleConfirmDelete() {
    if (!soldier) return;

    const { error } = await supabase
      .from("personnel")
      .delete()
      .eq("id", soldier.id);

    if (error) {
      console.error(
        "Delete personnel error:",
        error,
      );

      alert(
        "حدث خطأ أثناء حذف الفرد: " +
          error.message,
      );

      return;
    }

    setShowDelete(false);

    navigate(
      "/dashboard/individual-query",
    );
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div
      className="flex flex-col gap-5 w-full"
      dir="rtl"
    >
      {/* Delete Dialog */}

      <DeleteConfirmDialog
        open={showDelete}
        onCancel={() =>
          setShowDelete(false)
        }
        onConfirm={
          handleConfirmDelete
        }
      />

      {/* ===================================================
          Page Title
      =================================================== */}

      <h1
        className="text-center w-full"
        style={{
          ...FONT,
          fontWeight: 700,
          fontSize: "clamp(22px, 4vw, 32px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        بيانات الفرد
      </h1>

      {/* ===================================================
          Identification Card
      =================================================== */}

      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">

        {/* Card Header */}

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-b border-[#cbd2e0]">

          <SectionTitle>
            البيانات التعريفية
          </SectionTitle>

          <div className="flex-1" />

          <div className="flex items-center gap-3">

            {/* Delete */}

            <button
              type="button"
              onClick={() =>
                setShowDelete(true)
              }
              title="حذف"
              className="w-9 h-9 rounded-[8px] flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{
                backgroundColor:
                  "#fce8f1",
              }}
            >
              <Trash2
                size={16}
                style={{
                  color: "#E3282C",
                }}
              />
            </button>

            {/* Print */}

            <button
              type="button"
              onClick={() =>
                printSoldier(
                  soldier,
                  printerName,
                )
              }
              title="طباعة بيانات الفرد"
              className="w-9 h-9 rounded-[8px] flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{
                backgroundColor:
                  "#ebedfd",
              }}
            >
              <Printer
                size={16}
                style={{
                  color: "#2D3648",
                }}
              />
            </button>

            {/* Edit */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/dashboard/individual-query/soldier/${soldier.id}/edit`,
                )
              }
              title="تعديل"
              className="w-9 h-9 rounded-[8px] flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{
                backgroundColor:
                  "#ebedfd",
              }}
            >
              <Pencil
                size={16}
                style={{
                  color: "#2D3648",
                }}
              />
            </button>

          </div>
        </div>

        {/* Data */}

        <div className="flex flex-col gap-4 px-6 py-5">

          {/* Row 1 */}

          <div className="flex flex-wrap gap-4">

            <InfoRow
              label="الرقم العسكري"
              value={
                soldier.militaryId
              }
            />

            <InfoRow
              label="الدرجة"
              value={
                soldier.rank
              }
            />

          </div>

          {/* Row 2 */}

          <div className="flex flex-wrap gap-4">

            <InfoRow
              label="الاسم"
              value={
                soldier.name
              }
            />

            <InfoRow
              label="فئة الفرد"
              value={
                soldier.category
              }
            />

          </div>

          {/* Row 3 */}

          <div className="flex flex-wrap gap-4">

            <InfoRow
              label="الوحدة الأساسية"
              value={
                soldier.unit
              }
            />

            <InfoRow
              label="الموقف الخدمي"
              value={
                soldier.serviceStatus
              }
            />

          </div>

          {/* Row 4 */}

          <div className="flex flex-wrap gap-4">

            <InfoRow
              label="تاريخ التسريح"
              value={
                soldier.dischargeDate
              }
            />

            <InfoRow
              label="جهة الإلحاق"
              value={
                soldier.attachmentPlace
              }
            />

          </div>

        </div>
      </div>

      {/* ===================================================
          Letters
      =================================================== */}

      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">

        {/* Letters Header */}

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-b border-[#cbd2e0]">

          <SectionTitle>
            سجل الخطابات
          </SectionTitle>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => {
              navigate(
                `/dashboard/issue-letter?personnel_id=${soldier.id}`,
              );
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] transition-opacity hover:opacity-90"
            style={{
              background:
                "linear-gradient(to bottom, #00b867, #00522e)",
            }}
          >
            <span
              style={{
                ...FONT,
                fontSize: 14,
                color: "#f5f5f5",
              }}
            >
              إصدار خطاب
            </span>

            <Plus
              size={14}
              className="text-white"
            />
          </button>

        </div>

        {/* Letters Table */}

        <LettersTable
          soldier={soldier}
        />

      </div>
    </div>
  );
}