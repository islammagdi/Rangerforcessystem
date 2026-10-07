import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import logoImg from "../../assets/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";
import {
  Trash2,
  Printer,
  Pencil,
  Plus,
  ArrowDownUp,
  Download,
  Award,
  ExternalLink,
  AlertTriangle,
  FileText,
  ChevronsUp,
  UserX,
} from "lucide-react";
import { CASE_STATUS_META, caseNumber, type CaseStatus } from "./NcoDischargesPage";
import { SoftDeleteDialog } from "../components/dashboard/SoftDeleteDialog";
import { supabase } from "../../lib/supabase";

const FONT = {
  fontFamily: "'Almarai', sans-serif",
};
import { usePermissions } from "../../lib/usePermissions";
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
  administration: string;
  educationLevel: string;
    job: string;            // ✅ جديد
  isVolunteer: boolean;   // ✅ جديد
  letters: Letter[];
  transfers: TransferItem[];
  serviceEnd: ServiceEndSummary | null;
  rankHistory: RankMovement[];
  absences: AbsenceItem[];
};

type AbsenceItem = {
  id: string;
  absenceDecisionNumber: string;
  absenceDecisionDate: string;
  absenceStartDate: string;
  returnDecisionNumber: string | null;
  returnDecisionDate: string | null;
  exemptDays: number;
  absenceDays: number | null;
  previousDischargeDate: string | null;
  newDischargeDate: string | null;
  returnedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  previousStatus: string | null;
};

type RankMovement = {
  id: string;
  rankName: string | null;
  date: string;
  decisionNumber: string | null;
  movementType: "promotion" | "demotion";
  notes: string | null;
};

type ServiceEndSummary = {
  caseId: string | null;
  caseNumber: string | null;
  caseStatus: CaseStatus | null;
  reasonName: string | null;
  decisionNumber: string | null;
  decisionDate: string | null;
  decisionAuthority: string | null;
  caseCreatedAt: string | null;
  caseCompletedAt: string | null;
  certificateNumber: string | null;
  certificateDate: string | null;
  certificateSourceText: string | null;
};

const ACTIVE_CASE_STATUSES: CaseStatus[] = ["awaiting_notification", "in_progress", "submitted"];

type TransferItem = {
  id: string;
  fromDate: string;
  toDate: string;
  fromBatchName: string | null;
  toBatchName: string | null;
  direction: "postpone" | "advance";
  reasonName: string;
  referenceNumber: string | null;
  referenceDate: string | null;
  penaltyDays: number | null;
  notes: string | null;
  removedFromShipment: boolean;
  createdAt: string;
  createdByName: string | null;
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
    <div className="flex items-start gap-2 justify-start w-full sm:flex-1 sm:min-w-[280px]">
      <span
        className="w-[120px] sm:w-[140px] shrink-0 text-right"
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

      {/* ✅ FIX: كانت القيمة whiteSpace: nowrap فبتدفع الصف (والصفحة)
          تعمل سكرول أفقي على الموبايل لو القيمة طويلة (اسم كامل، اسم
          وحدة طويل...). خليناها تلف بدل ما تكسر عرض الصفحة. */}
      <span
        className="break-words min-w-0 flex-1"
        style={{
          ...FONT,
          fontSize: 18,
          color: "#2d3648",
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
   Rank History Table
========================================================= */

function movementLabel(type: "promotion" | "demotion", isVolunteer: boolean) {
  if (type === "demotion") return "عزل مجند";
  return isVolunteer ? "ترقية" : "ترقي مجند";
}

function RankHistoryTable({
  rows,
  isVolunteer,
}: {
  rows: RankMovement[];
  isVolunteer: boolean;
}) {
  const thClass =
    "px-4 py-3 text-right border-b-2 border-[#d4d8fa] whitespace-nowrap bg-white";
  const tdClass = "px-4 py-3 text-right border-b border-[#eaecf0] align-top";

  const headers = ["م", "الحركة", "الدرجة بعد الحركة", "التاريخ", "رقم القرار", "ملاحظات / السبب"];

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[800px]" dir="rtl">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className={thClass}>
                <span style={{ ...FONT, fontSize: 16, color: "#717d96" }}>{h}</span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className={`${tdClass} text-center py-8`}>
                <span style={{ ...FONT, fontSize: 16, color: "#717d96" }}>
                  لا توجد ترقيات مسجلة لهذا الفرد
                </span>
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id} className="hover:bg-[#fafafa] transition-colors">
                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>
                    {(rows.length - index).toLocaleString("ar-EG")}
                  </span>
                </td>

                <td className={tdClass}>
                  <span
                    className="inline-flex px-2.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      ...FONT,
                      fontSize: 13,
                      fontWeight: 700,
                      background: row.movementType === "promotion" ? "#DCF4DF" : "#fce9ea",
                      color: row.movementType === "promotion" ? "#00522E" : "#9d2e15",
                    }}
                  >
                    {movementLabel(row.movementType, isVolunteer)}
                  </span>
                </td>

                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 15, fontWeight: 700, color: "#2d3648" }}>
                    {row.rankName ?? "-"}
                  </span>
                </td>

                <td className={tdClass}>
                  <span className="whitespace-nowrap" style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>
                    {formatDate(row.date)}
                  </span>
                </td>

                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>{row.decisionNumber || "-"}</span>
                </td>

                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 14, color: "#717d96" }}>{row.notes || "-"}</span>
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
   Transfers Table
========================================================= */

function absenceDaysUntilToday(startIso: string): number {
  const [y, m, d] = startIso.split("-").map(Number);
  const start = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((today - start) / 86400000));
}

function AbsenceTable({ rows }: { rows: AbsenceItem[] }) {
  const thClass =
    "px-4 py-3 text-right border-b-2 border-[#d4d8fa] whitespace-nowrap bg-white";
  const tdClass = "px-4 py-3 text-right border-b border-[#eaecf0] align-top";

  const headers = [
    "قرار الغياب",
    "بداية الغياب",
    "المدة",
    "قرار الضم",
    "التسريح (قبل ← بعد)",
    "الحالة",
  ];

  const totalDays = rows
    .filter((r) => !r.cancelledAt && r.absenceDays !== null)
    .reduce((sum, r) => sum + (r.absenceDays ?? 0), 0);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[900px]" dir="rtl">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className={thClass}>
                <span style={{ ...FONT, fontSize: 16, color: "#717d96" }}>{h}</span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const open = !r.cancelledAt && !r.returnedAt;

            return (
              <tr key={r.id} className="hover:bg-[#fafafa] transition-colors">
                <td className={tdClass}>
                  <div className="flex flex-col">
                    <span style={{ ...FONT, fontSize: 15, fontWeight: 700, color: "#2d3648" }}>
                      رقم {r.absenceDecisionNumber}
                    </span>
                    <span style={{ ...FONT, fontSize: 13, color: "#717d96" }}>
                      {formatDate(r.absenceDecisionDate)}
                    </span>
                    {r.previousStatus && (
                      <span style={{ ...FONT, fontSize: 12, color: "#94a3b8" }}>
                        كان: {r.previousStatus}
                      </span>
                    )}
                  </div>
                </td>

                <td className={tdClass}>
                  <span className="whitespace-nowrap" style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>
                    {formatDate(r.absenceStartDate)}
                  </span>
                </td>

                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 15, color: "#2d3648", fontWeight: 700 }}>
                    {open
                      ? `${absenceDaysUntilToday(r.absenceStartDate).toLocaleString("ar-EG")} يوم (حتى اليوم)`
                      : r.absenceDays !== null
                      ? `${r.absenceDays.toLocaleString("ar-EG")} يوم${
                          r.exemptDays > 0 ? ` (بعد إعفاء ${r.exemptDays.toLocaleString("ar-EG")})` : ""
                        }`
                      : "-"}
                  </span>
                </td>

                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>
                    {r.returnDecisionNumber
                      ? `رقم ${r.returnDecisionNumber}${
                          r.returnDecisionDate ? ` / ${formatDate(r.returnDecisionDate)}` : ""
                        }`
                      : "-"}
                  </span>
                </td>

                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>
                    {r.previousDischargeDate
                      ? `${formatDate(r.previousDischargeDate)} ← ${
                          r.newDischargeDate ? formatDate(r.newDischargeDate) : "-"
                        }`
                      : "-"}
                  </span>
                </td>

                <td className={tdClass}>
                  <div className="flex flex-col gap-1">
                    <span
                      className="inline-flex w-fit px-2.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        ...FONT,
                        fontSize: 13,
                        fontWeight: 700,
                        background: r.cancelledAt ? "#f1f5f9" : r.returnedAt ? "#DCF4DF" : "#fef2f2",
                        color: r.cancelledAt ? "#64748b" : r.returnedAt ? "#00522E" : "#991b1b",
                      }}
                    >
                      {r.cancelledAt ? "ملغى" : r.returnedAt ? "عاد" : "غائب حاليًا"}
                    </span>
                    {r.cancelledAt && r.cancelReason && (
                      <span style={{ ...FONT, fontSize: 12, color: "#64748b" }}>السبب: {r.cancelReason}</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="px-4 py-3" style={{ ...FONT, fontSize: 14, color: "#717d96" }}>
        إجمالي أيام الغياب المحتسبة (للحالات المنتهية):{" "}
        <strong style={{ color: "#2d3648" }}>{totalDays.toLocaleString("ar-EG")} يوم</strong>
      </div>
    </div>
  );
}

function batchText(name: string | null, date: string) {
  return name ? `${name} (${formatDate(date)})` : formatDate(date);
}

function TransfersTable({ transfers }: { transfers: TransferItem[] }) {
  const thClass =
    "px-4 py-3 text-right border-b-2 border-[#d4d8fa] whitespace-nowrap bg-white";
  const tdClass = "px-4 py-3 text-right border-b border-[#eaecf0] align-top";

  const headers = [
    "م",
    "النوع",
    "من دفعة",
    "إلى دفعة",
    "السبب",
    "المرجع",
    "مدة المؤثر",
    "التاريخ",
    "بواسطة",
  ];

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[1000px]" dir="rtl">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className={thClass}>
                <span style={{ ...FONT, fontSize: 16, color: "#717d96" }}>{h}</span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {transfers.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className={`${tdClass} text-center py-8`}>
                <span style={{ ...FONT, fontSize: 16, color: "#717d96" }}>
                  لم يتم ترحيل الفرد لأي دفعة أخرى
                </span>
              </td>
            </tr>
          ) : (
            transfers.map((t, index) => (
              <tr key={t.id} className="hover:bg-[#fafafa] transition-colors">
                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>
                    {(transfers.length - index).toLocaleString("ar-EG")}
                  </span>
                </td>

                <td className={tdClass}>
                  <span
                    className="inline-flex px-2.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      ...FONT,
                      fontSize: 13,
                      fontWeight: 700,
                      background: t.direction === "postpone" ? "#fff8e8" : "#e8f0fe",
                      color: t.direction === "postpone" ? "#8a6500" : "#172e78",
                    }}
                  >
                    {t.direction === "postpone" ? "تأجيل" : "تقديم"}
                  </span>
                </td>

                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>
                    {batchText(t.fromBatchName, t.fromDate)}
                  </span>
                </td>

                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>
                    {batchText(t.toBatchName, t.toDate)}
                  </span>
                </td>

                <td className={tdClass}>
                  <div className="flex flex-col gap-1 min-w-[180px]">
                    <span style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>{t.reasonName}</span>
                    {t.notes && (
                      <span style={{ ...FONT, fontSize: 13, color: "#717d96" }}>{t.notes}</span>
                    )}
                    {t.removedFromShipment && (
                      <span style={{ ...FONT, fontSize: 12, color: "#9a3412" }}>
                        اتشال من إرسالية السجلات العسكرية بتاعة الدفعة القديمة
                      </span>
                    )}
                  </div>
                </td>

                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>
                    {t.referenceNumber || "-"}
                    {t.referenceDate ? ` / ${formatDate(t.referenceDate)}` : ""}
                  </span>
                </td>

                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>
                    {t.penaltyDays ? `${t.penaltyDays.toLocaleString("ar-EG")} يوم` : "-"}
                  </span>
                </td>

                <td className={tdClass}>
                  <span className="whitespace-nowrap" style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>
                    {formatDate(t.createdAt)}
                  </span>
                </td>

                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 15, color: "#2d3648" }}>{t.createdByName || "-"}</span>
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
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            align-items: center;
            justify-items: stretch;
            gap: 12px;
            margin-bottom: 28px;
            padding-bottom: 18px;
            border-bottom: 1px solid #cccccc;
          }

          .header-col {
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .header-title,
          .header-subtitle,
          .header-system {
            width: 100%;
            text-align: center;
          }

          .header-title {
            font-size: 19px;
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

          .header-title,
          .header-subtitle,
          .header-system {
            width: 100%;
            text-align: right;
          }

          .header-logo-col {
            display: flex;
            direction: ltr;
            justify-content: flex-start;
            align-items: center;
          }

          .header-logo {
            max-width: 100%;
            max-height: 90px;
            object-fit: contain;
          }

          .report-title {
            text-align: center;
            font-size: 22px;
            font-weight: bold;
            margin: 25px 0;
          }

          .section {
            margin-top: 22px;
          }

          .section-title {
            font-size: 17px;
            font-weight: bold;
            color: #4a5468;
            margin-bottom: 10px;
          }

          .section-divider {
            border: none;
            border-top: 1px solid #eceef2;
            margin: 22px 0 0 0;
          }

          .info-table {
            width: 100%;
            border-collapse: collapse;
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
            <div class="header-col">
              <div class="header-title">قيادة قوات الصــــــاعقة</div>
              <div class="header-subtitle">فــرع التنظيــــم والإدارة</div>
              <div class="header-system">منظومة الخوارج الداخلية</div>
            </div>

            <div class="header-col" style="align-items: center;">
           
            </div>

            <div class="header-logo-col">
              <img src="${logoImg}" class="header-logo" />
            </div>
          </div>

          <div style="text-decoration: underline; font-size: 20px; font-weight: bold; width: 100%; text-align: center; margin-top: 12px;">
  بيان تفصيلي لفرد
          </div>

          <!-- Section 1: البيانات التعريفية -->
          <div class="section">
            <div class="section-title">
              البيانات التعريفية
            </div>

            <table class="info-table">
              <tr>
                <td class="label">الرقم العسكري</td>
                <td class="value">${soldier.militaryId || "-"}</td>
                <td class="label">الدرجة</td>
                <td class="value">${soldier.rank || "-"}</td>
              </tr>

              <tr>
                <td class="label">الاسم</td>
                <td class="value">${soldier.name || "-"}</td>
                <td class="label">فئة الفرد</td>
                <td class="value">${soldier.category || "-"}</td>
              </tr>
            </table>
          </div>

          <hr class="section-divider" />

          <!-- Section 2: بيانات الوحدة والإلحاق -->
          <div class="section">
            <div class="section-title">
              بيانات الوحدة والإلحاق
            </div>

            <table class="info-table">
              <tr>
                <td class="label">الوحدة الأساسية</td>
                <td class="value">${soldier.unit || "-"}</td>
                <td class="label">الموقف الخدمي</td>
                <td class="value">${soldier.serviceStatus || "-"}</td>
              </tr>

              <tr>
                <td class="label">جهة الإلحاق</td>
                <td class="value">${soldier.attachmentPlace || "-"}</td>
                <td class="label">الوظيفة</td>
                <td class="value">${soldier.job || "-"}</td>
              </tr>
            </table>
          </div>

          <hr class="section-divider" />

          <!-- Section 3: بيانات إضافية -->
          <div class="section">
            <div class="section-title">
              بيانات إضافية
            </div>

            <table class="info-table">
              <tr>
                <td class="label">الإدارة/السلاح</td>
                ${
                  soldier.isVolunteer && soldier.dischargeDate === "-"
                    ? `<td class="value" colspan="3">${soldier.administration || "-"}</td>`
                    : `<td class="value">${soldier.administration || "-"}</td>
                       <td class="label">${soldier.isVolunteer ? "تاريخ إنهاء الخدمة" : "تاريخ التسريح"}</td>
                       <td class="value">${soldier.dischargeDate || "-"}</td>`
                }
              </tr>

              <tr>
                <td class="label">المستوى التعليمي</td>
                <td class="value" colspan="3">${soldier.educationLevel || "-"}</td>
              </tr>
            </table>
          </div>

          ${
            soldier.serviceEnd
              ? `
          <hr class="section-divider" />

          <div class="section">
            <div class="section-title">موقف إنهاء الخدمة</div>

            <table class="info-table">
              ${
                soldier.serviceEnd.caseId
                  ? `
              <tr>
                <td class="label">رقم الملف</td>
                <td class="value">${soldier.serviceEnd.caseNumber ?? "-"}</td>
                <td class="label">حالة الملف</td>
                <td class="value">${
                  soldier.serviceEnd.caseStatus ? CASE_STATUS_META[soldier.serviceEnd.caseStatus].label : "-"
                }</td>
              </tr>
              <tr>
                <td class="label">السبب</td>
                <td class="value">${soldier.serviceEnd.reasonName ?? "-"}</td>
                <td class="label">القرار</td>
                <td class="value">${soldier.serviceEnd.decisionNumber ?? "-"}${
                      soldier.serviceEnd.decisionDate ? ` / ${formatDate(soldier.serviceEnd.decisionDate)}` : ""
                    }</td>
              </tr>`
                  : ""
              }
              <tr>
                <td class="label">رقم الشهادة</td>
                <td class="value">${soldier.serviceEnd.certificateNumber ?? "لم تصدر بعد"}</td>
                <td class="label">تاريخ الشهادة</td>
                <td class="value">${
                  soldier.serviceEnd.certificateDate ? formatDate(soldier.serviceEnd.certificateDate) : "-"
                }</td>
              </tr>
            </table>
          </div>`
              : ""
          }

          ${
            soldier.transfers.length > 0
              ? `
          <hr class="section-divider" />

          <div class="section">
            <div class="section-title">سجل الترحيلات</div>

            <table class="info-table">
              <tr>
                <td class="label" style="width:auto;">النوع</td>
                <td class="label" style="width:auto;">من دفعة</td>
                <td class="label" style="width:auto;">إلى دفعة</td>
                <td class="label" style="width:auto;">السبب</td>
                <td class="label" style="width:auto;">المرجع</td>
              </tr>
              ${soldier.transfers
                .map(
                  (t) => `
              <tr>
                <td>${t.direction === "postpone" ? "تأجيل" : "تقديم"}</td>
                <td>${batchText(t.fromBatchName, t.fromDate)}</td>
                <td>${batchText(t.toBatchName, t.toDate)}</td>
                <td>${t.reasonName}${t.penaltyDays ? ` (${t.penaltyDays} يوم)` : ""}</td>
                <td>${t.referenceNumber || "-"}${t.referenceDate ? ` / ${formatDate(t.referenceDate)}` : ""}</td>
              </tr>`
                )
                .join("")}
            </table>
          </div>`
              : ""
          }
          ${
            soldier.rankHistory.length > 0
              ? `
          <hr class="section-divider" />

          <div class="section">
            <div class="section-title">سجل الترقي</div>

            <table class="info-table">
              <tr>
                <td class="label" style="width:auto;">الحركة</td>
                <td class="label" style="width:auto;">الدرجة</td>
                <td class="label" style="width:auto;">التاريخ</td>
                <td class="label" style="width:auto;">رقم القرار</td>
              </tr>
              ${soldier.rankHistory
                .map(
                  (r) => `
              <tr>
                <td>${movementLabel(r.movementType, soldier.isVolunteer)}</td>
                <td>${r.rankName ?? "-"}</td>
                <td>${formatDate(r.date)}</td>
                <td>${r.decisionNumber || "-"}</td>
              </tr>`
                )
                .join("")}
            </table>
          </div>`
              : ""
          }

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
const { hasPermission } = usePermissions();
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [soldier, setSoldier] = useState<Soldier | null>(null);

  const [printerName, setPrinterName] = useState("-");

  // اسم المستخدم الحالي (القائم بالطباعة)
  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select(`
          username,
          full_name,
          rank_name,
          personnel:personnel_id (
            full_name,
            rank:ranks ( name )
          )
        `)
        .eq("id", user.id)
        .maybeSingle();

      const profile: any = data;
      const person = Array.isArray(profile?.personnel) ? profile.personnel[0] : profile?.personnel;
      const rank = Array.isArray(person?.rank) ? person.rank[0] : person?.rank;

      const name = person?.full_name || profile?.full_name || profile?.username || "-";
      const rankName = rank?.name || profile?.rank_name;

      setPrinterName(rankName ? `${rankName} / ${name}` : name);
    })();
  }, []);

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
                   administration_id,
          education_level_id,
          personnel_categories (
            id,
            name,
            code
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
          ),

          administration:external_administrations!administration_id (
            id,
            name,
            code
          ),

          education_level:education_levels!education_level_id (
            id,
            name,
            code
          ),


          job:jobs!job_id (
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
         4. سجل الترحيلات بين دفعات الرديف
      --------------------------------------------------- */

      const { data: transfersData, error: transfersError } = await supabase.rpc(
        "get_personnel_transfer_history",
        { p_personnel_id: id }
      );

      if (transfersError) {
        console.error("Error loading transfers:", transfersError);
      }

      const mappedTransfers: TransferItem[] = (transfersData ?? []).map((t: any) => ({
        id: t.id,
        fromDate: t.from_date,
        toDate: t.to_date,
        fromBatchName: t.from_batch_name,
        toBatchName: t.to_batch_name,
        direction: t.direction,
        reasonName: t.reason_name ?? "-",
        referenceNumber: t.reference_number,
        referenceDate: t.reference_date,
        penaltyDays: t.penalty_days,
        notes: t.notes,
        removedFromShipment: t.removed_from_shipment === true,
        createdAt: t.created_at,
        createdByName: t.created_by_name,
      }));

      /* ---------------------------------------------------
         5. موقف إنهاء الخدمة + الشهادة
      --------------------------------------------------- */

      const { data: summaryData, error: summaryError } = await supabase.rpc(
        "get_personnel_service_end_summary",
        { p_personnel_id: id }
      );

      if (summaryError) {
        console.error("Error loading service end summary:", summaryError);
      }

      const s: any = (summaryData ?? [])[0];

      const certificateSourceText = !s?.certificate_number
        ? null
        : s.certificate_source === "reserve_batch"
        ? `دفعة رديف${
            s.certificate_batch_name
              ? ` - ${s.certificate_batch_name}`
              : s.certificate_batch_date
              ? ` ${formatDate(s.certificate_batch_date)}`
              : ""
          }`
        : s.certificate_source === "nco_discharge"
        ? "ملف إنهاء خدمة"
        : "أخرى";

      const mappedServiceEnd: ServiceEndSummary | null =
        s && (s.case_id || s.certificate_number)
          ? {
              caseId: s.case_id,
              caseNumber: s.case_id ? caseNumber(s.case_seq, s.case_year) : null,
              caseStatus: s.case_status,
              reasonName: s.reason_name,
              decisionNumber: s.decision_number,
              decisionDate: s.decision_date,
              decisionAuthority: s.decision_authority,
              caseCreatedAt: s.case_created_at,
              caseCompletedAt: s.case_completed_at,
              certificateNumber: s.certificate_number,
              certificateDate: s.certificate_date,
              certificateSourceText,
            }
          : null;

       /* ---------------------------------------------------
         6. سجل الترقي (ترقيات وعزل)
      --------------------------------------------------- */

      const { data: rankData, error: rankError } = await supabase.rpc(
        "get_personnel_rank_history",
        { p_personnel_id: id }
      );

      if (rankError) {
        console.error("Error loading rank history:", rankError);
      }

      const mappedRankHistory: RankMovement[] = (rankData ?? []).map((r: any) => ({
        id: r.id,
        rankName: r.rank_name,
        date: r.promotion_date,
        decisionNumber: r.decision_number,
        movementType: r.movement_type === "demotion" ? "demotion" : "promotion",
        notes: r.notes,
      }));

      /* ---------------------------------------------------
         7. إنشاء بيانات الفرد النهائية
      --------------------------------------------------- */

      /* ---------------------------------------------------
         سجل الغياب (بيرجع فاضي لو المستخدم معندوش صلاحية العرض)
      --------------------------------------------------- */

      const { data: absenceData, error: absenceError } = await supabase
        .from("absence_decisions")
        .select(
          `id, absence_decision_number, absence_decision_date, absence_start_date,
           return_decision_number, return_decision_date, exempt_days, absence_days,
           previous_discharge_date, new_discharge_date, returned_at, cancelled_at, cancel_reason,
           previous_status:service_statuses!previous_service_status_id(name)`
        )
        .eq("personnel_id", id)
        .order("created_at", { ascending: false });

      if (absenceError) {
        console.error("Error loading absences:", absenceError);
      }

      const mappedAbsences: AbsenceItem[] = (absenceData ?? []).map((a: any) => {
        const prev = Array.isArray(a.previous_status) ? a.previous_status[0] : a.previous_status;

        return {
          id: a.id,
          absenceDecisionNumber: a.absence_decision_number,
          absenceDecisionDate: a.absence_decision_date,
          absenceStartDate: a.absence_start_date,
          returnDecisionNumber: a.return_decision_number,
          returnDecisionDate: a.return_decision_date,
          exemptDays: a.exempt_days ?? 0,
          absenceDays: a.absence_days,
          previousDischargeDate: a.previous_discharge_date,
          newDischargeDate: a.new_discharge_date,
          returnedAt: a.returned_at,
          cancelledAt: a.cancelled_at,
          cancelReason: a.cancel_reason,
          previousStatus: prev?.name ?? null,
        };
      });

      const openAbsence = mappedAbsences.find((a) => !a.returnedAt && !a.cancelledAt) ?? null;

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
(raw.service_statuses?.name ?? "-") +
          (openAbsence?.previousStatus ? ` (كان ${openAbsence.previousStatus})` : ""),

        dischargeDate:
          raw.discharge_date
            ? formatDate(raw.discharge_date)
            : "-",

        attachmentPlace:
          raw.attachment_unit?.name ?? "-",

        administration:
          raw.administration?.name ?? "-",

        educationLevel:
          raw.education_level?.name ?? "-",

        job: raw.job?.name ?? "-",                              // ✅ جديد
        isVolunteer: raw.personnel_categories?.code === "VOLUNTEER", // ✅ جديد

        letters: mappedLetters,
        transfers: mappedTransfers,
        serviceEnd: mappedServiceEnd,
        rankHistory: mappedRankHistory,
        absences: mappedAbsences,
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
        className="flex flex-col items-center justify-center h-64 gap-4 px-4 text-center"
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

  async function handleConfirmDelete(reason: string) {
    if (!soldier) return;

    const { error } = await supabase.rpc("soft_delete_personnel", {
      p_personnel_id: soldier.id,
      p_reason: reason,
    });

    if (error) throw error; // النافذة بتعرض الرسالة

    setShowDelete(false);
    navigate("/dashboard/individual-query");
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

      <SoftDeleteDialog
        open={showDelete}
        subtitle={`${soldier.militaryId} - ${soldier.name}`}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleConfirmDelete}
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

        <div className="flex flex-wrap items-center justify-end gap-3 px-4 sm:px-6 py-4 border-b border-[#cbd2e0]">

          <SectionTitle>
           بيانات الفرد
          </SectionTitle>

          <div className="flex-1" />

                  <div className="flex items-center gap-3">

            {/* Delete */}

            {hasPermission("individual_query:delete") && (
              <button
                type="button"
                onClick={() =>
                  setShowDelete(true)
                }
                title="حذف"
                className="w-9 h-9 shrink-0 rounded-[8px] flex items-center justify-center hover:opacity-80 transition-opacity"
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
            )}

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
              className="w-9 h-9 shrink-0 rounded-[8px] flex items-center justify-center hover:opacity-80 transition-opacity"
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

            {hasPermission("individual_query:edit") && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/dashboard/individual-query/soldier/${soldier.id}/edit`,
                  )
                }
                title="تعديل"
                className="w-9 h-9 shrink-0 rounded-[8px] flex items-center justify-center hover:opacity-80 transition-opacity"
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
            )}

          </div>
        </div>

        {/* Data */}

        <div className="flex flex-col gap-5 px-4 sm:px-6 py-5">

          {/* -------- Section 1: البيانات التعريفية -------- */}
          <div className="flex flex-col gap-4">
            <span
              style={{
                ...FONT,
                fontSize: 15,
                fontWeight: 600,
                color: "#a0abc0",
              }}
            >
              البيانات التعريفية
            </span>

            <div className="flex flex-wrap gap-4">
              <InfoRow label="الرقم العسكري" value={soldier.militaryId} />
              <InfoRow label="الدرجة" value={soldier.rank} />
            </div>

            <div className="flex flex-wrap gap-4">
              <InfoRow label="الاسم" value={soldier.name} />
              <InfoRow label="فئة الفرد" value={soldier.category} />
            </div>
          </div>

          {/* Divider */}
          <div
            className="w-full"
            style={{ borderTop: "1px solid #f0f1f5" }}
          />

          {/* -------- Section 2: بيانات الوحدة والإلحاق -------- */}
          <div className="flex flex-col gap-4">
            <span
              style={{
                ...FONT,
                fontSize: 15,
                fontWeight: 600,
                color: "#a0abc0",
              }}
            >
              بيانات الوحدة والإلحاق
            </span>

            <div className="flex flex-wrap gap-4">
              <InfoRow label="الوحدة الأساسية" value={soldier.unit} />
              <InfoRow label="الموقف الخدمي" value={soldier.serviceStatus} />
            </div>

            <div className="flex flex-wrap gap-4">
              <InfoRow label="جهة الإلحاق" value={soldier.attachmentPlace} />
              <InfoRow label="الوظيفة" value={soldier.job} />
            </div>
          </div>

          {/* Divider */}
          <div
            className="w-full"
            style={{ borderTop: "1px solid #f0f1f5" }}
          />

          {/* -------- Section 3: بيانات إضافية -------- */}
          <div className="flex flex-col gap-4">
            <span
              style={{
                ...FONT,
                fontSize: 15,
                fontWeight: 600,
                color: "#a0abc0",
              }}
            >
              بيانات إضافية
            </span>

            <div className="flex flex-wrap gap-4">
              <InfoRow label="الإدارة / السلاح" value={soldier.administration} />
              {(!soldier.isVolunteer || soldier.dischargeDate !== "-") && (
                <InfoRow
                  label={soldier.isVolunteer ? "تاريخ إنهاء الخدمة" : "تاريخ التسريح"}
                  value={soldier.dischargeDate}
                />
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <InfoRow label="المستوى التعليمي" value={soldier.educationLevel} />
             
            </div>
          </div>

        </div>
      </div>

      {/* ===================================================
          Rank History (سجل الترقي)
      =================================================== */}

      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
        <div className="flex flex-wrap items-center justify-end gap-3 px-4 sm:px-6 py-4 border-b border-[#cbd2e0]">
          <ChevronsUp size={18} style={{ color: "#4a5468" }} />
          <SectionTitle>سجل الترقي</SectionTitle>

          <div className="flex-1" />

          {soldier.rankHistory.length > 0 && (
            <span
              className="px-3 py-1 rounded-full"
              style={{ ...FONT, fontSize: 13, background: "#f7f9fc", color: "#717d96" }}
            >
              {soldier.rankHistory.length.toLocaleString("ar-EG")} حركة
            </span>
          )}
        </div>

        <RankHistoryTable rows={soldier.rankHistory} isVolunteer={soldier.isVolunteer} />
      </div>

      {/* ===================================================
          Service End (ملف إنهاء الخدمة + الشهادة)
      =================================================== */}

      {soldier.serviceEnd && (
        <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
          <div className="flex flex-wrap items-center justify-end gap-3 px-4 sm:px-6 py-4 border-b border-[#cbd2e0]">
            <SectionTitle>موقف إنهاء الخدمة</SectionTitle>

            <div className="flex-1" />

            {soldier.serviceEnd.caseId && hasPermission("nco_discharge:view") && (
              <button
                type="button"
                onClick={() => navigate(`/dashboard/nco-discharges/${soldier.serviceEnd!.caseId}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] hover:opacity-80"
                style={{ backgroundColor: "#ebedfd" }}
              >
                <span style={{ ...FONT, fontSize: 14, color: "#2d3648" }}>فتح الملف</span>
                <ExternalLink size={14} className="text-[#2d3648]" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-5 px-4 sm:px-6 py-5">
            {/* تنبيه الملف الجاري */}
            {soldier.serviceEnd.caseStatus &&
              ACTIVE_CASE_STATUSES.includes(soldier.serviceEnd.caseStatus) && (
                <div
                  className="rounded-[12px] px-4 py-3 flex items-center gap-2"
                  style={{ background: "#fff8e8", border: "1px solid #f4d58d" }}
                >
                  <AlertTriangle size={18} className="shrink-0" style={{ color: "#8a6500" }} />
                  <span style={{ ...FONT, fontSize: 15, fontWeight: 700, color: "#8a6500" }}>
                    الفرد عليه ملف إنهاء خدمة جاري، وخدمته في طريقها للانتهاء.
                  </span>
                </div>
              )}

            {/* الملف */}
            {soldier.serviceEnd.caseId && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText size={16} style={{ color: "#a0abc0" }} />
                  <span style={{ ...FONT, fontSize: 15, fontWeight: 600, color: "#a0abc0" }}>
                    ملف إنهاء الخدمة
                  </span>

                  {soldier.serviceEnd.caseStatus && (
                    <span
                      className="px-3 py-0.5 rounded-full"
                      style={{
                        ...FONT,
                        fontSize: 13,
                        fontWeight: 700,
                        background: CASE_STATUS_META[soldier.serviceEnd.caseStatus].bg,
                        color: CASE_STATUS_META[soldier.serviceEnd.caseStatus].color,
                      }}
                    >
                      {CASE_STATUS_META[soldier.serviceEnd.caseStatus].label}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4">
                  <InfoRow label="رقم الملف" value={soldier.serviceEnd.caseNumber ?? "-"} />
                  <InfoRow label="سبب إنهاء الخدمة" value={soldier.serviceEnd.reasonName ?? "-"} />
                </div>

                <div className="flex flex-wrap gap-4">
                  <InfoRow
                    label="قرار إنهاء الخدمة"
                    value={
                      soldier.serviceEnd.decisionNumber
                        ? `${soldier.serviceEnd.decisionNumber}${
                            soldier.serviceEnd.decisionDate
                              ? ` بتاريخ ${formatDate(soldier.serviceEnd.decisionDate)}`
                              : ""
                          }`
                        : "-"
                    }
                  />
                  <InfoRow label="الجهة المصدرة" value={soldier.serviceEnd.decisionAuthority ?? "-"} />
                </div>

                <div className="flex flex-wrap gap-4">
                  <InfoRow label="تاريخ فتح الملف" value={formatDate(soldier.serviceEnd.caseCreatedAt)} />
                  <InfoRow
                    label="تاريخ اكتمال الملف"
                    value={soldier.serviceEnd.caseCompletedAt ? formatDate(soldier.serviceEnd.caseCompletedAt) : "لم يكتمل بعد"}
                  />
                </div>
              </div>
            )}

            {soldier.serviceEnd.caseId && (
              <div className="w-full" style={{ borderTop: "1px solid #f0f1f5" }} />
            )}

            {/* الشهادة */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Award size={16} style={{ color: "#a0abc0" }} />
                <span style={{ ...FONT, fontSize: 15, fontWeight: 600, color: "#a0abc0" }}>
                  شهادة إنهاء الخدمة
                </span>
              </div>

              {soldier.serviceEnd.certificateNumber ? (
                <>
                  <div className="flex flex-wrap gap-4">
                    <InfoRow label="رقم الشهادة" value={soldier.serviceEnd.certificateNumber} />
                    <InfoRow label="تاريخ الشهادة" value={formatDate(soldier.serviceEnd.certificateDate)} />
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <InfoRow label="مصدر التسجيل" value={soldier.serviceEnd.certificateSourceText ?? "-"} />
                  </div>
                </>
              ) : (
                <span style={{ ...FONT, fontSize: 16, color: "#717d96" }}>لم تصدر الشهادة بعد</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          Transfers (للمجندين دايمًا، ولغيرهم لو ليهم ترحيلات)
      =================================================== */}

      {/* ===================================================
          سجل الغياب (بيظهر لو للفرد غياب سابق أو حالي)
      =================================================== */}

      {soldier.absences.length > 0 && (
        <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
          <div className="flex flex-wrap items-center justify-end gap-3 px-4 sm:px-6 py-4 border-b border-[#cbd2e0]">
            <UserX size={18} style={{ color: "#4a5468" }} />
            <SectionTitle>سجل الغياب</SectionTitle>

            <div className="flex-1" />

            {soldier.absences.some((a) => !a.returnedAt && !a.cancelledAt) && (
              <span
                className="px-3 py-1 rounded-full"
                style={{ ...FONT, fontSize: 13, fontWeight: 700, background: "#fef2f2", color: "#991b1b" }}
              >
                غائب حاليًا
              </span>
            )}

            <span
              className="px-3 py-1 rounded-full"
              style={{ ...FONT, fontSize: 13, background: "#f7f9fc", color: "#717d96" }}
            >
              {soldier.absences.length.toLocaleString("ar-EG")} واقعة
            </span>
          </div>

          <AbsenceTable rows={soldier.absences} />
        </div>
      )}

      {(!soldier.isVolunteer || soldier.transfers.length > 0) && (
        <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
          <div className="flex flex-wrap items-center justify-end gap-3 px-4 sm:px-6 py-4 border-b border-[#cbd2e0]">
            <SectionTitle>سجل ترحيلات الفرد</SectionTitle>

            <div className="flex-1" />

            {soldier.transfers.length > 0 && (
              <span
                className="px-3 py-1 rounded-full"
                style={{ ...FONT, fontSize: 13, background: "#f7f9fc", color: "#717d96" }}
              >
                {soldier.transfers.length.toLocaleString("ar-EG")} ترحيل
              </span>
            )}
          </div>

          <TransfersTable transfers={soldier.transfers} />
        </div>
      )}

      {/* ===================================================
          Letters
      =================================================== */}

      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">

        {/* Letters Header */}

        <div className="flex flex-wrap items-center justify-end gap-3 px-4 sm:px-6 py-4 border-b border-[#cbd2e0]">

          <SectionTitle>
            سجل خطابات الفرد
          </SectionTitle>

                    <div className="flex-1" />

          {hasPermission("issue_letter:create") && (
            <button
              type="button"
              onClick={() => {
                navigate(
                  `/dashboard/issue-letter?personnel_id=${soldier.id}`,
                );
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] transition-opacity hover:opacity-90 shrink-0"
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
          )}

        </div>
        {/* Letters Table */}

        <LettersTable
          soldier={soldier}
        />

      </div>
    </div>
  );
}