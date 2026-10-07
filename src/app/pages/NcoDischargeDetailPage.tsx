import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowRight,
  Loader2,
  X,
  Trash2,
  Save,
  Ban,
  FileCheck2,
  User,
  ExternalLink,
  Upload,
  Eye,
  Paperclip,
  Printer,
  Award,
  Check,
  Send,
  Search,
  Link2,
  Unlink,
  Pencil,
  Gavel,
} from "lucide-react";
import logoImg from "../../assets/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { fetchSocialRecordByPersonnelId, getSocialPhotoSignedUrl } from "../../lib/socialRecords";
import {
  ACTIVE_STATUSES,
  CASE_STATUS_META,
  CATEGORY_LABELS,
  DECISION_AUTHORITY_SUGGESTIONS,
  caseNumber,
  formatDate,
  logDischarge,
  pickOne,
  toAr,
  toEnglishDigits,
  type CaseStatus,
} from "./NcoDischargesPage";

// =====================================================
// إعدادات
// =====================================================

const DOCS_BUCKET = "nco-discharge-documents";
const MAX_FILE_MB = 10;
const PDF_RENDER_SCALE = 2.5;   // جودة تحويل صفحات الـ PDF للطباعة
const ROTATE_LANDSCAPE = true;  // لف الصفحات العرضية علشان تملا ورقة A4 الطولية

// =====================================================
// Types
// =====================================================

type CaseDetail = {
  id: string;
  personnel_id: string;
  case_year: number;
  case_seq: number;
  status: CaseStatus;
  event_date: string;
  decision_number: string | null;
  decision_date: string | null;
  decision_authority: string | null;
  notes: string | null;
  cancel_reason: string | null;
  notify_fax_id: string | null;
  submit_fax_id: string | null;
  submitted_to: string | null;
  completed_at: string | null;
  reversed_at: string | null;
  created_at: string;
  reason_name: string;
  reason_code: string;
  person_name: string;
  person_rank: string | null;
  military_number: string;
  personnel_category: string | null;
};

type PersonInfo = {
  military_number: string;
  full_name: string;
  rank_name: string | null;
  category_name: string | null;
  service_status_name: string | null;
  primary_unit_name: string | null;
  is_active: boolean | null;
  discharge_date: string | null;
  job_name: string | null;
  education_level_name: string | null;
  administration_name: string | null;
  national_id: string | null;
  birth_date: string | null;
  phone_number: string | null;
  service_join_date: string | null;
  blood_type: string | null;
  religion: string | null;
  health_status: string | null;
  address_detail: string | null;
  emergency_contact: string | null;
  social_loaded: boolean;
};

type CaseDoc = {
  id: string;
  name: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  uploaded_at: string | null;
};

type Certificate = {
  id: string;
  certificate_number: string;
  certificate_date: string;
  file_path: string | null;
  file_name: string | null;
};

type FaxBrief = {
  id: string;
  fax_number: number;
  fax_year: number;
  created_at: string;
  issuing_office_name: string | null;
  handed_over_at: string | null;
  original_received_at: string | null;
  recipients_count: number;
};

type AttachmentPage =
  | { kind: "image"; src: string; landscape: boolean }
  | { kind: "placeholder"; text: string };

type FaxField = "notify_fax_id" | "submit_fax_id";

// =====================================================
// Helpers
// =====================================================

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${toAr(Math.round(bytes / 1024))} ك.ب`;
  return `${toAr((bytes / (1024 * 1024)).toFixed(1))} م.ب`;
}

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function faxLabel(fax: FaxBrief): string {
  return `فاكس رقم ${toAr(fax.fax_number)}/${toAr(fax.fax_year)} بتاريخ ${formatDate(fax.created_at)}`;
}

// حالة الفاكس من شغل مسؤول الأرشيف
function faxStatus(fax: FaxBrief): { text: string; bg: string; color: string } {
  if (fax.original_received_at) return { text: "تم الإرسال وعاد الأصل للمختص", bg: "#DCF4DF", color: "#00522E" };
  if (fax.handed_over_at) return { text: "تم الإرسال - بانتظار تأكيد استلام الأصل", bg: "#e8f0fe", color: "#172e78" };
  if (fax.recipients_count > 0) return { text: "تم الإرسال وتوثيق المستلم", bg: "#e8f0fe", color: "#172e78" };
  return { text: "مسجل بالأرشيف - لم يُوثق المستلم بعد", bg: "#fff8e8", color: "#8a6500" };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function imageSize(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = src;
  });
}

async function renderPdfPages(blob: Blob): Promise<AttachmentPage[]> {
  const pdfjs: any = await import("pdfjs-dist");

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    // @ts-ignore - Vite بيرجع رابط ملف الـ worker
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  }

  const pdf = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
  const pages: AttachmentPage[] = [];

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    pages.push({
      kind: "image",
      src: canvas.toDataURL("image/jpeg", 0.92),
      landscape: viewport.width > viewport.height,
    });

    page.cleanup();
  }

  await pdf.destroy();
  return pages;
}

async function fileToPages(filePath: string, label: string): Promise<AttachmentPage[]> {
  const ext = (filePath.split(".").pop() ?? "").toLowerCase();

  const { data: blob, error } = await supabase.storage.from(DOCS_BUCKET).download(filePath);

  if (error || !blob) return [{ kind: "placeholder", text: `تعذر تحميل المرفق: ${label}` }];

  if (blob.type === "application/pdf" || ext === "pdf") {
    try {
      return await renderPdfPages(blob);
    } catch {
      return [{ kind: "placeholder", text: `تعذر قراءة ملف الـ PDF: ${label}` }];
    }
  }

  if (blob.type.startsWith("image/") || /^(png|jpe?g|gif|webp|bmp)$/.test(ext)) {
    const src = await blobToDataUrl(blob);
    const { w, h } = await imageSize(src);
    return [{ kind: "image", src, landscape: w > h }];
  }

  return [{ kind: "placeholder", text: `نوع الملف غير قابل للطباعة: ${label}` }];
}

async function openSignedFile(path: string, onError: (msg: string) => void) {
  const win = window.open("", "_blank");

  const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(path, 60 * 10);

  if (error || !data?.signedUrl) {
    win?.close();
    onError("تعذر فتح الملف: " + (error?.message ?? ""));
    return;
  }

  if (win) win.location.href = data.signedUrl;
  else window.open(data.signedUrl, "_blank");
}

// =====================================================
// ورقة الطباعة
// =====================================================

function buildCasePrintHtml(p: {
  detail: CaseDetail;
  person: PersonInfo | null;
  docs: CaseDoc[];
  docPageCounts: Record<string, number>;
  certificate: Certificate | null;
  certificatePageCount: number;
  notifyFax: FaxBrief | null;
  submitFax: FaxBrief | null;
  attachmentPages: AttachmentPage[];
  photoUrl: string | null;
  logoSrc: string;
}): string {
  const { detail, person } = p;

  const item = (label: string, value: string | null | undefined, wide = false) =>
    `<div class="info-item"${wide ? ' style="grid-column: span 3;"' : ""}>
       <span class="info-label">${escapeHtml(label)}:</span>
       <span class="info-value">${escapeHtml(value || "-")}</span>
     </div>`;

  const personTitle = `${detail.person_rank ? detail.person_rank + " / " : ""}${detail.person_name}`;

  const militaryHtml = person
    ? [
        item("الرقم العسكري", toAr(person.military_number)),
        item("الدرجة", person.rank_name),
        item("الاسم", person.full_name),
        item("الفئة", person.category_name),
        item("الوحدة الأساسية", person.primary_unit_name),
        item("الوظيفة", person.job_name),
        item("الإدارة / السلاح", person.administration_name),
        item("المستوى التعليمي", person.education_level_name),
        item("تاريخ الالتحاق بالخدمة", person.service_join_date ? formatDate(person.service_join_date) : null),
      ].join("")
    : "";

  const personalHtml = person?.social_loaded
    ? `<div class="section-title">البيانات الشخصية</div>
       <div class="info-grid">
         ${[
           item("الرقم القومي", person.national_id ? toAr(person.national_id) : null),
           item("تاريخ الميلاد", person.birth_date ? formatDate(person.birth_date) : null),
           item("رقم الهاتف", person.phone_number ? toAr(person.phone_number) : null),
           item("الديانة", person.religion),
           item("فصيلة الدم", person.blood_type),
           item("الحالة الصحية", person.health_status),
           item("العنوان", person.address_detail, true),
         ].join("")}
       </div>`
    : "";

  const faxItems = (fax: FaxBrief | null) =>
    fax
      ? [
          item("الفاكس", `${toAr(fax.fax_number)}/${toAr(fax.fax_year)}`),
          item("تاريخ الفاكس", formatDate(fax.created_at)),
          item("حالة الفاكس", faxStatus(fax).text),
        ].join("")
      : item("الحالة", "لم يتم بعد", true);

  const docRows = p.docs.length
    ? p.docs
        .map(
          (d, i) => `
        <tr>
          <td>${toAr(i + 1)}</td>
          <td>${escapeHtml(d.name)}</td>
          <td>${escapeHtml(d.file_name ?? "-")}</td>
          <td>${d.uploaded_at ? escapeHtml(formatDate(d.uploaded_at)) : "-"}</td>
          <td>${toAr(p.docPageCounts[d.id] ?? 0)}</td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="5" class="empty-row">لا توجد مستندات مرفقة</td></tr>`;

  const attachmentsHtml = p.attachmentPages
    .map((page) =>
      page.kind === "image"
        ? `<div class="attachment-page"><img src="${page.src}" class="${
            ROTATE_LANDSCAPE && page.landscape ? "landscape" : ""
          }" /></div>`
        : `<div class="attachment-page"><div class="attachment-placeholder">${escapeHtml(page.text)}</div></div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(`ملف إنهاء خدمة - ${detail.person_name}`)}</title>
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body { margin: 0; padding: 0; font-family: 'Almarai', Arial, sans-serif; direction: rtl; color: #2d3648; }
      .page { padding: 0 16mm; }
      .page-frame { position: fixed; top: 8mm; left: 8mm; right: 8mm; bottom: 8mm; border: 2px solid #cbd2e0; border-radius: 10px; pointer-events: none; z-index: 0; }
      .header { position: relative; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #cbd2e0; padding-bottom: 10px; margin-bottom: 10px; }
      .header-text { display: flex; flex-direction: column; gap: 2px; }
      .header-title { font-size: 18px; font-weight: 700; }
      .header-subtitle { font-size: 14px; font-weight: 700; }
      .header-system { font-size: 12px; color: #717d96; }
      .header-logo { width: 64px; height: 64px; object-fit: contain; }
      .header-title-box { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 6px 18px; font-size: 18px; font-weight: 700; text-decoration: underline; white-space: nowrap; }
      .basic-info-row { display: flex; align-items: center; gap: 16px; margin-top: 10px; padding: 10px 12px; background: #f7f9fc; border: 1px solid #e2e7f0; border-radius: 10px; }
      .photo-box-inline { width: 80px; height: 100px; border-radius: 12px; overflow: hidden; background: #fff; border: 1px solid #e2e7f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; text-align: center; }
      .photo-box-inline img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
      .status-badge { margin-right: auto; padding: 4px 12px; border-radius: 999px; border: 1px solid #cbd2e0; font-size: 12px; font-weight: 700; }
      .section-title { font-size: 15px; font-weight: 700; background: #f7f9fc; padding: 6px 10px; border-radius: 6px; margin-top: 16px; margin-bottom: 8px; break-after: avoid; page-break-after: avoid; }
      .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; }
      .info-item { display: flex; gap: 4px; font-size: 13px; border-bottom: 1px dashed #e2e7f0; padding-bottom: 4px; }
      .info-label { color: #717d96; white-space: nowrap; }
      .info-value { font-weight: 700; }
      table.data { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
      table.data th, table.data td { border: 1px solid #e2e7f0; padding: 6px 8px; text-align: center; }
      table.data th { background: #f7f9fc; font-weight: 700; }
      table.data tr { break-inside: avoid; page-break-inside: avoid; }
      thead { display: table-header-group; }
      .empty-row { color: #a1aebe; padding: 12px; }
      table.layout { width: 100%; border: none; border-collapse: collapse; }
      table.layout > thead > tr > td, table.layout > tfoot > tr > td, table.layout > tbody > tr > td { border: none; padding: 0; text-align: right; }
      .spacer { height: 14mm; }
      .attachment-page { position: relative; z-index: 2; width: 210mm; height: 296mm; background: #fff; overflow: hidden; display: flex; align-items: center; justify-content: center; page-break-before: always; break-before: page; }
      .attachment-page img { width: 210mm; height: 296mm; object-fit: contain; display: block; flex-shrink: 0; }
      .attachment-page img.landscape { width: 296mm; height: 210mm; transform: rotate(90deg); }
      .attachment-placeholder { color: #a1aebe; font-size: 14px; text-align: center; padding: 20mm; border: 1px dashed #cbd2e0; border-radius: 10px; }
    </style>
  </head>
  <body>
    <div class="page-frame"></div>

    <table class="layout">
      <thead><tr><td><div class="spacer"></div></td></tr></thead>
      <tfoot><tr><td><div class="spacer"></div></td></tr></tfoot>
      <tbody>
        <tr>
          <td>
            <div class="page">
              <div class="header">
                <div class="header-text">
                  <div class="header-title">قيادة قوات الصـاعقة</div>
                  <div class="header-subtitle">فــــــرع التنظيــــم والإدارة</div>
                  <div class="header-system"> المنظومـــة الالكترونيــــة للفرع</div>
                </div>
                               <div class="header-title-box">ملف إنهاء خدمة ${escapeHtml(
                  CATEGORY_LABELS[detail.personnel_category ?? ""] ?? "فرد"
                )}</div>
                <img src="${escapeHtml(p.logoSrc)}" class="header-logo" />
              </div>

              <div class="basic-info-row">
                <div class="photo-box-inline">
                  ${
                    p.photoUrl
                      ? `<img src="${escapeHtml(p.photoUrl)}" />`
                      : `<span style="font-size:11px;color:#a1aebe;">لا توجد صورة</span>`
                  }
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                  <div style="font-size:17px;font-weight:700;">${escapeHtml(personTitle)}</div>
                  <div style="font-size:13px;"><span style="color:#717d96;">الرقم العسكري:</span>
                    <span style="font-weight:700;">${escapeHtml(toAr(detail.military_number))}</span></div>
                  <div style="font-size:13px;"><span style="color:#717d96;">رقم الملف:</span>
                    <span style="font-weight:700;">${escapeHtml(caseNumber(detail.case_seq, detail.case_year))}</span></div>
                </div>
                <span class="status-badge">${escapeHtml(CASE_STATUS_META[detail.status].label)}</span>
              </div>

              <div class="section-title">بيانات الملف وقرار إنهاء الخدمة</div>
              <div class="info-grid">
                ${item("سبب إنهاء الخدمة", detail.reason_name)}
                ${item("تاريخ الواقعة", formatDate(detail.event_date))}
                ${item("تاريخ فتح الملف", formatDate(detail.created_at))}
                ${item("رقم القرار", detail.decision_number ? toAr(detail.decision_number) : null)}
                ${item("تاريخ القرار", detail.decision_date ? formatDate(detail.decision_date) : null)}
                ${item("الجهة المصدرة", detail.decision_authority)}
                ${detail.notes ? item("ملاحظات", detail.notes, true) : ""}
                ${detail.status === "cancelled" ? item("سبب الإلغاء", detail.cancel_reason, true) : ""}
              </div>

              ${militaryHtml ? `<div class="section-title">البيانات العسكرية</div><div class="info-grid">${militaryHtml}</div>` : ""}
              ${personalHtml}

              <div class="section-title">إخطار وحدة الفرد</div>
              <div class="info-grid">${faxItems(p.notifyFax)}</div>

              <div class="section-title">الرفع للجهة الأعلى</div>
              <div class="info-grid">
                ${faxItems(p.submitFax)}
                ${detail.submitted_to ? item("الجهة المقدم لها", detail.submitted_to, true) : ""}
              </div>

              <div class="section-title">شهادة إنهاء الخدمة</div>
              <div class="info-grid">
                ${item("رقم الشهادة", p.certificate ? toAr(p.certificate.certificate_number) : "لم تصل بعد")}
                ${item("تاريخ الشهادة", p.certificate ? formatDate(p.certificate.certificate_date) : null)}
                ${item(
                  "صورة الشهادة",
                  p.certificate?.file_path ? `مرفقة (${toAr(p.certificatePageCount)} صفحة - بعد المستندات)` : "غير مرفقة"
                )}
              </div>

              <div class="section-title">المستندات المرفقة</div>
              <table class="data">
                <thead>
                  <tr>
                    <th style="width:6%">م</th>
                    <th>اسم المستند</th>
                    <th>اسم الملف</th>
                    <th style="width:18%">تاريخ الرفع</th>
                    <th style="width:10%">الصفحات</th>
                  </tr>
                </thead>
                <tbody>${docRows}</tbody>
              </table>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    ${attachmentsHtml}
  </body>
</html>`;
}

// =====================================================
// كارت ربط فاكس صادر من الأرشيف
// =====================================================

function FaxLinkCard({
  step,
  title,
  description,
  fax,
  editable,
  lockedReason,
  unlinkDisabledReason,
  busy,
  onLink,
  onUnlink,
  onOpen,
  children,
}: {
  step: number;
  title: string;
  description: string;
  fax: FaxBrief | null;
  editable: boolean;
  lockedReason?: string | null;
  unlinkDisabledReason?: string | null;
  busy: boolean;
  onLink: (faxId: string) => void;
  onUnlink: () => void;
  onOpen: (faxId: string) => void;
  children?: React.ReactNode;
}) {
  const [number, setNumber] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FaxBrief[]>([]);
  const [searchError, setSearchError] = useState("");

  async function search() {
    const n = parseInt(toEnglishDigits(number).trim(), 10);
    const y = parseInt(toEnglishDigits(year).trim(), 10);

    setResults([]);
    setSearchError("");

    if (!n || !y) {
      setSearchError("اكتب رقم الفاكس والسنة.");
      return;
    }

    setSearching(true);
    const { data, error } = await supabase.rpc("get_outgoing_fax_brief", { p_number: n, p_year: y });
    setSearching(false);

    if (error) {
      setSearchError(error.message);
      return;
    }

    if (!data || data.length === 0) {
      setSearchError("لا يوجد فاكس صادر بهذا الرقم في هذه السنة. اتأكد إن مسؤول الأرشيف سجّله.");
      return;
    }

    setResults(data as FaxBrief[]);
  }

  const status = fax ? faxStatus(fax) : null;

  return (
    <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              fontSize: 13,
              fontWeight: 700,
              background: fax ? "#DCF4DF" : "#f1f5f9",
              color: fax ? "#00522E" : "#64748b",
            }}
          >
            {fax ? <Check size={14} /> : toAr(step)}
          </span>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#2d3648" }}>{title}</p>
        </div>

        <span
          className="px-2.5 py-0.5 rounded-full"
          style={{
            fontSize: 12,
            fontWeight: 700,
            background: fax ? "#DCF4DF" : "#fff8e8",
            color: fax ? "#00522E" : "#8a6500",
          }}
        >
          {fax ? "تم" : "لم يتم بعد"}
        </span>
      </div>

      <p style={{ fontSize: 13, color: "#717d96" }}>{description}</p>

      {fax ? (
        <div className="rounded-xl border border-[#e2e7f0] bg-[#f8fafc] p-4 flex items-center gap-3 flex-wrap">
          <Send size={18} className="text-[#172e78] shrink-0" />

          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{faxLabel(fax)}</span>
            {fax.issuing_office_name && (
              <span style={{ fontSize: 12, color: "#717d96" }}>المكتب المُصدر: {fax.issuing_office_name}</span>
            )}
          </div>

          {status && (
            <span
              className="px-2.5 py-0.5 rounded-full"
              style={{ fontSize: 12, fontWeight: 700, background: status.bg, color: status.color }}
            >
              {status.text}
            </span>
          )}

          <div className="flex items-center gap-2 mr-auto">
            <button
              type="button"
              onClick={() => onOpen(fax.id)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-white"
              style={{ fontSize: 12, fontWeight: 700 }}
            >
              <ExternalLink size={13} />
              فتح الفاكس
            </button>

            {editable && (
              <button
                type="button"
                onClick={onUnlink}
                disabled={busy || Boolean(unlinkDisabledReason)}
                title={unlinkDisabledReason ?? "فك ربط الفاكس"}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[#991b1b] hover:bg-[#fef2f2] disabled:opacity-40"
                style={{ fontSize: 12, fontWeight: 700 }}
              >
                <Unlink size={13} />
                فك الربط
              </button>
            )}
          </div>
        </div>
      ) : lockedReason ? (
        <p style={{ fontSize: 13, color: "#94a3b8" }}>{lockedReason}</p>
      ) : editable ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <label style={{ fontSize: 12, color: "#717d96", display: "block", marginBottom: 4 }}>
                رقم الفاكس الصادر
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void search()}
                dir="ltr"
                className="w-[140px] h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867] text-left"
                style={{ fontSize: 14 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#717d96", display: "block", marginBottom: 4 }}>السنة</label>
              <input
                type="text"
                inputMode="numeric"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void search()}
                dir="ltr"
                className="w-[100px] h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867] text-left"
                style={{ fontSize: 14 }}
              />
            </div>

            <button
              type="button"
              onClick={() => void search()}
              disabled={searching}
              className="flex items-center gap-2 px-4 h-[42px] rounded-lg bg-[#2d3648] text-white hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              بحث في الأرشيف
            </button>
          </div>

          {searchError && <p style={{ fontSize: 13, color: "#991b1b" }}>{searchError}</p>}

          {results.map((r) => {
            const s = faxStatus(r);
            return (
              <div
                key={r.id}
                className="rounded-xl border border-[#e2e7f0] p-3 flex items-center gap-3 flex-wrap"
              >
                <div className="flex flex-col">
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{faxLabel(r)}</span>
                  {r.issuing_office_name && (
                    <span style={{ fontSize: 12, color: "#717d96" }}>المكتب المُصدر: {r.issuing_office_name}</span>
                  )}
                </div>
                <span
                  className="px-2.5 py-0.5 rounded-full"
                  style={{ fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}
                >
                  {s.text}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onLink(r.id);
                    setResults([]);
                    setNumber("");
                  }}
                  disabled={busy}
                  className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50 mr-auto"
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  <Link2 size={14} />
                  ربط بالملف
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#94a3b8" }}>لم يتم ربط فاكس.</p>
      )}

      {children}
    </div>
  );
}

// =====================================================
// الصفحة
// =====================================================

export function NcoDischargeDetailPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("nco_discharge:edit");
  const canOpenIndividual = hasPermission("individual_query:view");
  const canOpenSocialRecord = hasPermission("social_record:view");

  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [docs, setDocs] = useState<CaseDoc[]>([]);
  const [person, setPerson] = useState<PersonInfo | null>(null);
  const [personPhoto, setPersonPhoto] = useState<string | null>(null);
  const [loadingPerson, setLoadingPerson] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [notifyFax, setNotifyFax] = useState<FaxBrief | null>(null);
  const [submitFax, setSubmitFax] = useState<FaxBrief | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [printing, setPrinting] = useState(false);

  // القرار
  const [decisionNumber, setDecisionNumber] = useState("");
  const [decisionDate, setDecisionDate] = useState("");
  const [decisionAuthority, setDecisionAuthority] = useState("");

  // الرفع
  const [submittedTo, setSubmittedTo] = useState("");

  // المستندات
  const [newDocName, setNewDocName] = useState("");
  const [uploading, setUploading] = useState(false);

  // الشهادة
  const [certNumber, setCertNumber] = useState("");
  const [certDate, setCertDate] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [savingCert, setSavingCert] = useState(false);
  const [editingCert, setEditingCert] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function load() {
    if (!caseId) return;
    setLoading(true);

    const [caseRes, docsRes] = await Promise.all([
      supabase
        .from("nco_discharge_cases")
        .select(
          `id, personnel_id, case_year, case_seq, status, event_date,
           decision_number, decision_date, decision_authority,
           notes, cancel_reason, notify_fax_id, submit_fax_id, submitted_to,
                  completed_at, reversed_at, created_at, personnel_category,
           reason:reason_id(name, code),
           personnel:personnel_id(full_name, military_number, rank:ranks(name))`
        )
        .eq("id", caseId)
        .maybeSingle(),
      supabase
        .from("nco_discharge_case_documents")
        .select("id, name, file_path, file_name, file_size, uploaded_at, sort_order")
        .eq("case_id", caseId)
        .order("sort_order", { ascending: true }),
    ]);

    if (caseRes.error || docsRes.error) {
      setError("تعذر تحميل الملف: " + (caseRes.error?.message ?? docsRes.error?.message ?? ""));
      setLoading(false);
      return;
    }

    const row: any = caseRes.data;

    if (!row) {
      setDetail(null);
      setLoading(false);
      return;
    }

    const p = pickOne<any>(row.personnel);
    const reason = pickOne<any>(row.reason);

    const next: CaseDetail = {
      id: row.id,
      personnel_id: row.personnel_id,
      case_year: row.case_year,
      case_seq: row.case_seq,
      status: row.status,
      event_date: row.event_date,
      decision_number: row.decision_number,
      decision_date: row.decision_date,
      decision_authority: row.decision_authority,
      notes: row.notes,
      cancel_reason: row.cancel_reason,
      notify_fax_id: row.notify_fax_id,
      submit_fax_id: row.submit_fax_id,
      submitted_to: row.submitted_to,
           completed_at: row.completed_at,
      reversed_at: row.reversed_at ?? null,
      created_at: row.created_at,
      reason_name: reason?.name ?? "-",
      reason_code: reason?.code ?? "",
      person_name: p?.full_name ?? "-",
      person_rank: pickOne<any>(p?.rank)?.name ?? null,
      military_number: p?.military_number ?? "",
      personnel_category: row.personnel_category ?? null,
    };

    setDetail(next);
    setDecisionNumber(row.decision_number ?? "");
    setDecisionDate(row.decision_date ?? "");
    setDecisionAuthority(row.decision_authority ?? "");
    setSubmittedTo(row.submitted_to ?? "");
    setDocs((docsRes.data ?? []) as CaseDoc[]);

    await Promise.all([
      loadFax(row.notify_fax_id, setNotifyFax),
      loadFax(row.submit_fax_id, setSubmitFax),
      loadCertificate(row.id),
    ]);

    if (!person) void loadPerson(row.personnel_id);

    setLoading(false);
  }

  async function loadFax(faxId: string | null, setter: (f: FaxBrief | null) => void) {
    if (!faxId) {
      setter(null);
      return;
    }

    const { data } = await supabase.rpc("get_outgoing_fax_brief", { p_fax_id: faxId });
    setter(((data ?? []) as FaxBrief[])[0] ?? null);
  }

  async function loadCertificate(id: string) {
    const { data } = await supabase
      .from("service_end_certificates")
      .select("id, certificate_number, certificate_date, file_path, file_name")
      .eq("nco_case_id", id)
      .maybeSingle();

    const cert = (data as Certificate) ?? null;
    setCertificate(cert);

    if (cert) {
      setCertNumber(cert.certificate_number);
      setCertDate(cert.certificate_date);
    }
  }

  async function loadPerson(personnelId: string) {
    setLoadingPerson(true);

    try {
      const { data: p } = await supabase
        .from("personnel")
        .select(
          `military_number, full_name, is_active, discharge_date,
           rank:rank_id(name),
           category:personnel_category_id(name),
           service_status:service_status_id(name),
           primary_unit:primary_unit_id(name)`
        )
        .eq("id", personnelId)
        .maybeSingle();

      const base: any = p ?? {};

      const info: PersonInfo = {
        military_number: base.military_number ?? "",
        full_name: base.full_name ?? "",
        rank_name: pickOne<any>(base.rank)?.name ?? null,
        category_name: pickOne<any>(base.category)?.name ?? null,
        service_status_name: pickOne<any>(base.service_status)?.name ?? null,
        primary_unit_name: pickOne<any>(base.primary_unit)?.name ?? null,
        is_active: base.is_active ?? null,
        discharge_date: base.discharge_date ?? null,
        job_name: null,
        education_level_name: null,
        administration_name: null,
        national_id: null,
        birth_date: null,
        phone_number: null,
        service_join_date: null,
        blood_type: null,
        religion: null,
        health_status: null,
        address_detail: null,
        emergency_contact: null,
        social_loaded: false,
      };

      try {
        const full: any = await fetchSocialRecordByPersonnelId(personnelId);
        const rec = full?.record ?? {};
        const per = full?.personnel ?? {};

        info.job_name = per.job_name ?? null;
        info.education_level_name = per.education_level_name ?? null;
        info.administration_name = per.administration_name ?? null;
        info.national_id = rec.national_id ?? null;
        info.birth_date = rec.birth_date ?? null;
        info.phone_number = rec.phone_number ?? null;
        info.service_join_date = rec.service_join_date ?? null;
        info.blood_type = rec.blood_type ?? null;
        info.religion = rec.religion ?? null;
        info.health_status = rec.health_status ?? null;
        info.address_detail = rec.address_detail ?? null;
        info.emergency_contact =
          [rec.emergency_contact_name, rec.emergency_contact_relation, rec.emergency_contact_phone]
            .filter(Boolean)
            .join(" - ") || null;
        info.social_loaded = true;

        if (rec.photo_path) {
          try {
            setPersonPhoto(await getSocialPhotoSignedUrl(rec.photo_path));
          } catch {
            setPersonPhoto(null);
          }
        }
      } catch {
        // مفيش صلاحية أو مفيش سجل: نعرض البيانات العسكرية بس
      }

      setPerson(info);
    } finally {
      setLoadingPerson(false);
    }
  }

  // ===================================================
  // قيم مشتقة
  // ===================================================

  const isActive = detail ? ACTIVE_STATUSES.includes(detail.status) : false;
  const editable = canEdit && isActive;

  const decisionDirty =
    (detail?.decision_number ?? "") !== decisionNumber.trim() ||
    (detail?.decision_date ?? "") !== decisionDate ||
    (detail?.decision_authority ?? "") !== decisionAuthority.trim();

  function personLabel() {
    if (!detail) return "";
    return `${detail.person_rank ? detail.person_rank + " " : ""}${detail.person_name}`;
  }

  async function updateCase(patch: Record<string, unknown>, successMessage: string, logAction: string) {
    if (!caseId) return false;

    setBusy(true);
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase.from("nco_discharge_cases").update(patch).eq("id", caseId);

    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return false;
    }

    setSuccess(successMessage);
    await logDischarge("UPDATE", logAction, personLabel());
    await load();
    return true;
  }

  // ===================================================
  // القرار
  // ===================================================

  async function saveDecision() {
    if (!decisionNumber.trim() || !decisionDate || !decisionAuthority.trim()) {
      setError("رقم القرار وتاريخه والجهة المصدرة مطلوبين.");
      return;
    }

    await updateCase(
      {
        decision_number: decisionNumber.trim(),
        decision_date: decisionDate,
        decision_authority: decisionAuthority.trim(),
      },
      "تم حفظ بيانات القرار.",
      "تعديل قرار إنهاء خدمة"
    );
  }

  // ===================================================
  // الفاكسات
  // ===================================================

  async function linkFax(field: FaxField, faxId: string) {
    await updateCase(
      { [field]: faxId },
      field === "notify_fax_id" ? "تم ربط فاكس إخطار الوحدة." : "تم ربط فاكس الرفع للجهة الأعلى.",
      field === "notify_fax_id" ? "ربط فاكس إخطار الوحدة" : "ربط فاكس الرفع للجهة الأعلى"
    );
  }

  async function unlinkFax(field: FaxField) {
    if (!window.confirm("فك ربط الفاكس من الملف؟ (الفاكس نفسه هيفضل في الأرشيف)")) return;

    await updateCase({ [field]: null }, "تم فك ربط الفاكس.", "فك ربط فاكس من ملف إنهاء خدمة");
  }

  // ===================================================
  // المستندات
  // ===================================================

  async function uploadDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || !caseId) return;

    const name = newDocName.trim();

    if (!name) {
      setError("اكتب اسم المستند الأول.");
      return;
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`حجم الملف أكبر من ${toAr(MAX_FILE_MB)} ميجا.`);
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
      const path = `${caseId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(DOCS_BUCKET)
        .upload(path, file, { contentType: file.type || undefined, upsert: false });

      if (uploadError) {
        setError("تعذر رفع الملف: " + uploadError.message);
        return;
      }

      const { error: insertError } = await supabase.from("nco_discharge_case_documents").insert({
        case_id: caseId,
        name,
        sort_order: docs.length,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || null,
      });

      if (insertError) {
        await supabase.storage.from(DOCS_BUCKET).remove([path]);
        setError("تعذر حفظ المستند: " + insertError.message);
        return;
      }

      setNewDocName("");
      setSuccess(`تم رفع "${name}".`);
      await logDischarge("UPDATE", "رفع مستند إنهاء خدمة", `${personLabel()} - ${name}`);
      await load();
    } finally {
      setUploading(false);
    }
  }

  async function removeDoc(doc: CaseDoc) {
    if (!window.confirm(`حذف المستند "${doc.name}" نهائيًا؟`)) return;

    setBusy(true);
    setError("");

    const { error: deleteError } = await supabase
      .from("nco_discharge_case_documents")
      .delete()
      .eq("id", doc.id);

    if (deleteError) {
      setBusy(false);
      setError(deleteError.message);
      return;
    }

    if (doc.file_path) await supabase.storage.from(DOCS_BUCKET).remove([doc.file_path]);

    setBusy(false);
    await logDischarge("UPDATE", "حذف مستند إنهاء خدمة", `${personLabel()} - ${doc.name}`);
    await load();
  }

  // ===================================================
  // الشهادة وإكمال الملف
  // ===================================================

  async function completeCase() {
    if (!caseId || !detail) return;

    if (!certNumber.trim() || !certDate) {
      setError("اكتب رقم الشهادة وتاريخها.");
      return;
    }

    if (certFile && certFile.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`حجم الملف أكبر من ${toAr(MAX_FILE_MB)} ميجا.`);
      return;
    }

    if (
      !window.confirm(
        `تسجيل شهادة إنهاء الخدمة رقم ${certNumber.trim()} وإكمال الملف؟\n\n${personLabel()} هيتلغى تفعيله ويخرج من القوة، والملف هيتقفل.`
      )
    ) {
      return;
    }

    setSavingCert(true);
    setError("");
    setSuccess("");

    let path: string | null = null;

    try {
      if (certFile) {
        const ext = certFile.name.includes(".") ? certFile.name.split(".").pop()!.toLowerCase() : "bin";
        path = `${caseId}/certificate-${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(DOCS_BUCKET)
          .upload(path, certFile, { contentType: certFile.type || undefined, upsert: false });

        if (uploadError) {
          setError("تعذر رفع صورة الشهادة: " + uploadError.message);
          return;
        }
      }

      const { error: rpcError } = await supabase.rpc("complete_nco_discharge_case", {
        p_case_id: caseId,
        p_certificate_number: certNumber.trim(),
        p_certificate_date: certDate,
        p_file_path: path,
        p_file_name: certFile?.name ?? null,
        p_file_size: certFile?.size ?? null,
        p_mime_type: certFile?.type || null,
      });

      if (rpcError) {
        if (path) await supabase.storage.from(DOCS_BUCKET).remove([path]);
        setError(rpcError.message);
        return;
      }

      setCertFile(null);
      setSuccess("تم تسجيل الشهادة وإكمال الملف.");
      await logDischarge(
        "UPDATE",
        "إكمال ملف إنهاء خدمة",
        `${personLabel()} - شهادة رقم ${certNumber.trim()}`
      );
      await load();
    } finally {
      setSavingCert(false);
    }
  }

  async function saveCertCorrection() {
    if (!certificate) return;

    if (!certNumber.trim() || !certDate) {
      setError("رقم الشهادة وتاريخها مطلوبين.");
      return;
    }

    setSavingCert(true);
    setError("");

    const { error: rpcError } = await supabase.rpc("update_service_end_certificate", {
      p_certificate_id: certificate.id,
      p_certificate_number: certNumber.trim(),
      p_certificate_date: certDate,
    });

    setSavingCert(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setEditingCert(false);
    setSuccess("تم تصحيح بيانات الشهادة.");
    await logDischarge("UPDATE", "تصحيح شهادة إنهاء خدمة", `${personLabel()} - ${certNumber.trim()}`);
    if (caseId) await loadCertificate(caseId);
  }

  // ===================================================
  // الإلغاء
  // ===================================================

  async function handleCancel() {
    const reason = window.prompt("سبب إلغاء الملف:");
    if (reason === null) return;

    if (!reason.trim()) {
      setError("لازم تكتب سبب الإلغاء.");
      return;
    }

    await updateCase({ status: "cancelled", cancel_reason: reason.trim() }, "تم إلغاء الملف.", "إلغاء ملف إنهاء خدمة");
  }

  // ===================================================
  // الطباعة
  // ===================================================

  async function handlePrint() {
    if (!detail) return;

    const printWindow = window.open("", "_blank", "width=1000,height=1200");

    if (!printWindow) {
      setError("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    printWindow.document.write(
      `<p style="font-family:Arial,sans-serif;text-align:center;margin-top:40px;direction:rtl;">جاري تجهيز الملف والمرفقات للطباعة...</p>`
    );

    setPrinting(true);
    setError("");

    try {
      const pages: AttachmentPage[] = [];
      const counts: Record<string, number> = {};

      for (const doc of docs) {
        if (!doc.file_path) continue;
        const docPages = await fileToPages(doc.file_path, doc.name);
        counts[doc.id] = docPages.length;
        pages.push(...docPages);
      }

      let certificatePageCount = 0;

      if (certificate?.file_path) {
        const certPages = await fileToPages(certificate.file_path, "شهادة إنهاء الخدمة");
        certificatePageCount = certPages.length;
        pages.push(...certPages);
      }

      if (printWindow.closed) return;

      printWindow.document.open();
      printWindow.document.write(
        buildCasePrintHtml({
          detail,
          person,
          docs,
          docPageCounts: counts,
          certificate,
          certificatePageCount,
          notifyFax,
          submitFax,
          attachmentPages: pages,
          photoUrl: personPhoto,
          logoSrc: new URL(logoImg, window.location.href).href,
        })
      );
      printWindow.document.close();

      await Promise.all(
        Array.from(printWindow.document.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
        )
      );

      await new Promise((resolve) => window.setTimeout(resolve, 300));

      if (printWindow.closed) return;

      printWindow.focus();
      printWindow.print();
    } catch (err: any) {
      printWindow.close();
      setError("تعذر تجهيز الطباعة: " + (err?.message ?? ""));
    } finally {
      setPrinting(false);
    }
  }

  // ===================================================
  // Render
  // ===================================================

  if (loading && !detail) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[#00B867]" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div
        className="bg-white rounded-2xl border border-[#eff0f6] py-16 text-center text-[#717d96]"
        dir="rtl"
        style={{ fontFamily: "'Almarai', sans-serif" }}
      >
        {error || "الملف غير موجود."}
        <button
          type="button"
          onClick={() => navigate("/dashboard/nco-discharges")}
          className="block mx-auto mt-3 text-[#1f3d97] underline"
        >
          الرجوع لكل الملفات
        </button>
      </div>
    );
  }

  const meta = CASE_STATUS_META[detail.status];

  const inputClass =
    "w-full h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]";
  const labelStyle: React.CSSProperties = { fontSize: 13, color: "#717d96", display: "block", marginBottom: 4 };

  const steps = [
    { label: "استلام القرار وفتح الملف", done: true },
    { label: "إخطار الوحدة", done: Boolean(detail.notify_fax_id) },
    { label: "استيفاء الإجراءات", done: docs.length > 0 },
    { label: "الرفع للجهة الأعلى", done: Boolean(detail.submit_fax_id) },
    {
      label: "الشهادة وإكمال الملف",
      done: detail.status === "completed" || detail.status === "reversed",
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl" style={{ fontFamily: "'Almarai', sans-serif" }}>
      {/* الرأس */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/dashboard/nco-discharges")}
            className="flex items-center gap-1 text-[#475569] hover:text-[#2d3648]"
            style={{ fontSize: 14 }}
          >
            <ArrowRight size={16} />
            كل الملفات
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => void handlePrint()}
              disabled={printing}
              className="flex items-center gap-2 px-4 h-10 rounded-lg border border-[#2d3648] bg-white text-[#2d3648] hover:bg-gray-50 disabled:opacity-50"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              {printing ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
              {printing ? "جاري تجهيز الطباعة..." : "طباعة الملف"}
            </button>

            {editable && (
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={busy}
                className="flex items-center gap-1 px-4 h-10 rounded-lg bg-[#f1f5f9] text-[#475569] hover:opacity-80 disabled:opacity-50"
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                <Ban size={15} />
                إلغاء الملف
              </button>
            )}
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 13, color: "#717d96" }}>
              ملف رقم {caseNumber(detail.case_seq, detail.case_year)}
            </span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#2d3648" }}>
              {detail.person_rank ? `${detail.person_rank} / ` : ""}
              {detail.person_name}
            </span>
            <span className="flex items-center gap-2 flex-wrap" style={{ fontSize: 13, color: "#717d96" }}>
              الرقم العسكري: <b style={{ color: "#2d3648" }}>{detail.military_number}</b>
              {detail.personnel_category && (
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: detail.personnel_category === "CONSCRIPT" ? "#fef3c7" : "#e0f2fe",
                    color: detail.personnel_category === "CONSCRIPT" ? "#92400e" : "#075985",
                  }}
                >
                  {CATEGORY_LABELS[detail.personnel_category] ?? detail.personnel_category}
                </span>
              )}
            </span>
          </div>

          <span
            className="px-3 py-1 rounded-full"
            style={{ fontSize: 13, fontWeight: 700, background: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
        </div>

        {detail.status === "completed" && (
          <div
            className="rounded-xl px-4 py-3 bg-[#f6fcf8] border border-[#bbf7d0]"
            style={{ fontSize: 13, color: "#166534" }}
          >
            الملف مكتمل{detail.completed_at ? ` بتاريخ ${formatDate(detail.completed_at)}` : ""}، والفرد خرج من القوة.
          </div>
        )}

        {detail.status === "cancelled" && (
          <div
            className="rounded-xl px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0]"
            style={{ fontSize: 13, color: "#475569" }}
          >
            الملف ملغى. السبب: {detail.cancel_reason ?? "-"}
          </div>
        )}

        {detail.status === "reversed" && (
          <div
            className="rounded-xl px-4 py-3 bg-[#faf5ff] border border-[#e9d5ff]"
            style={{ fontSize: 13, color: "#6b21a8" }}
          >
            الفرد أُعيد للخدمة{detail.reversed_at ? ` بتاريخ ${formatDate(detail.reversed_at)}` : ""} بعد إكمال
            الملف. تفاصيل قرار الإعادة في صفحة أرشيف المنتهية خدمتهم (تاب سجل الإعادة للخدمة).
          </div>
        )}
      </div>

      {/* مراحل الملف */}
      {detail.status !== "cancelled" && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] p-4 flex flex-wrap items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 px-3 h-8 rounded-full"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  background: step.done ? "#DCF4DF" : "#f1f5f9",
                  color: step.done ? "#00522E" : "#94a3b8",
                }}
              >
                {step.done ? (
                  <Check size={13} />
                ) : (
                  <span
                    className="w-4 h-4 rounded-full border flex items-center justify-center"
                    style={{ fontSize: 10, borderColor: "#cbd5e1" }}
                  >
                    {toAr(index + 1)}
                  </span>
                )}
                {step.label}
              </span>
              {index < steps.length - 1 && <span style={{ color: "#cbd5e1" }}>←</span>}
            </div>
          ))}
        </div>
      )}

      {/* الرسائل */}
      {error && (
        <div className="rounded-xl px-5 py-3 bg-[#fef2f2] border border-[#fecaca] flex items-center justify-between">
          <span style={{ color: "#991b1b", fontSize: 14, fontWeight: 700 }}>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-[#991b1b]">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="rounded-xl px-5 py-3 bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-between">
          <span style={{ color: "#166534", fontSize: 14, fontWeight: 700 }}>{success}</span>
          <button type="button" onClick={() => setSuccess("")} className="text-[#166534]">
            <X size={16} />
          </button>
        </div>
      )}

      {/* بيانات الفرد */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#eff0f6] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[#00522E]" />
            <p style={{ fontSize: 16, fontWeight: 700, color: "#2d3648" }}>بيانات الفرد</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canOpenIndividual && (
              <button
                type="button"
                onClick={() => navigate(`/dashboard/individual-query/soldier/${detail.personnel_id}`)}
                className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50"
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                <ExternalLink size={14} />
                ملف الفرد
              </button>
            )}
            {canOpenSocialRecord && (
              <button
                type="button"
                onClick={() => navigate(`/dashboard/social-record/personnel/${detail.personnel_id}`)}
                className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50"
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                <ExternalLink size={14} />
                السجل الاجتماعي
              </button>
            )}
          </div>
        </div>

        {loadingPerson || !person ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-[#717d96]" />
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-5">
            <div className="flex items-start gap-5 flex-wrap">
              <div className="w-[90px] h-[110px] rounded-xl overflow-hidden border border-[#e2e7f0] bg-[#f7f9fc] flex items-center justify-center shrink-0">
                {personPhoto ? (
                  <img src={personPhoto} alt="" className="w-full h-full object-cover object-top" />
                ) : (
                  <span style={{ fontSize: 11, color: "#a1aebe" }}>لا توجد صورة</span>
                )}
              </div>

              <div className="flex-1 min-w-[260px] flex flex-col gap-2">
                <p style={{ fontSize: 13, fontWeight: 700, color: "#00522E" }}>البيانات العسكرية</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
                  {[
                    ["الرقم العسكري", person.military_number],
                    ["الدرجة", person.rank_name],
                    ["الاسم", person.full_name],
                    ["الفئة", person.category_name],
                    ["الوحدة الأساسية", person.primary_unit_name],
                    ["الوظيفة", person.job_name],
                    ["الإدارة / السلاح", person.administration_name],
                    ["المستوى التعليمي", person.education_level_name],
                    ["تاريخ الالتحاق بالخدمة", person.service_join_date ? formatDate(person.service_join_date) : null],
                    ["حالة الخدمة", person.service_status_name],
                    [
                      "الحالة في المنظومة",
                      person.is_active === false
                        ? `غير نشط${person.discharge_date ? " منذ " + formatDate(person.discharge_date) : ""}`
                        : "نشط",
                    ],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex flex-col gap-0.5">
                      <span style={{ fontSize: 12, color: "#717d96" }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{value || "-"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-[#eff0f6]">
              <p style={{ fontSize: 13, fontWeight: 700, color: "#00522E" }}>البيانات الشخصية</p>

              {person.social_loaded ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
                  {[
                    ["الرقم القومي", person.national_id],
                    ["تاريخ الميلاد", person.birth_date ? formatDate(person.birth_date) : null],
                    ["رقم الهاتف", person.phone_number],
                    ["الديانة", person.religion],
                    ["فصيلة الدم", person.blood_type],
                    ["الحالة الصحية", person.health_status],
                    ["العنوان", person.address_detail],
                    ["جهة الاتصال في الطوارئ", person.emergency_contact],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex flex-col gap-0.5">
                      <span style={{ fontSize: 12, color: "#717d96" }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{value || "-"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "#94a3b8" }}>
                  لا يمكن عرض البيانات الشخصية (لا يوجد سجل اجتماعي للفرد، أو ليس لديك صلاحية عرض السجل الاجتماعي).
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ١) القرار */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "#DCF4DF", color: "#00522E" }}
          >
            <Gavel size={14} />
          </span>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#2d3648" }}>قرار إنهاء الخدمة الوارد</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-0.5">
            <span style={{ fontSize: 12, color: "#717d96" }}>سبب إنهاء الخدمة</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{detail.reason_name}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span style={{ fontSize: 12, color: "#717d96" }}>تاريخ الواقعة</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{formatDate(detail.event_date)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span style={{ fontSize: 12, color: "#717d96" }}>تاريخ فتح الملف</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{formatDate(detail.created_at)}</span>
          </div>
        </div>

        {editable ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label style={labelStyle}>رقم القرار *</label>
                <input
                  type="text"
                  value={decisionNumber}
                  onChange={(e) => setDecisionNumber(e.target.value)}
                  className={inputClass}
                  style={{ fontSize: 14 }}
                />
              </div>
              <div>
                <label style={labelStyle}>تاريخ القرار *</label>
                <input
                  type="date"
                  value={decisionDate}
                  onChange={(e) => setDecisionDate(e.target.value)}
                  className={inputClass}
                  style={{ fontSize: 14 }}
                />
              </div>
              <div>
                <label style={labelStyle}>الجهة المصدرة *</label>
                <input
                  type="text"
                  list="nco-decision-authorities-detail"
                  value={decisionAuthority}
                  onChange={(e) => setDecisionAuthority(e.target.value)}
                  className={inputClass}
                  style={{ fontSize: 14 }}
                />
                <datalist id="nco-decision-authorities-detail">
                  {DECISION_AUTHORITY_SUGGESTIONS.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>
            </div>

            {decisionDirty && (
              <button
                type="button"
                onClick={() => void saveDecision()}
                disabled={busy}
                className="flex items-center gap-2 px-5 h-[42px] rounded-lg border border-[#00B867] text-[#00522E] hover:bg-[#f0fdf4] disabled:opacity-50 w-fit"
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                حفظ تعديل القرار
              </button>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ["رقم القرار", detail.decision_number ?? "-"],
              ["تاريخ القرار", formatDate(detail.decision_date)],
              ["الجهة المصدرة", detail.decision_authority ?? "-"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span style={{ fontSize: 12, color: "#717d96" }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {detail.notes && (
          <div className="flex flex-col gap-0.5">
            <span style={{ fontSize: 12, color: "#717d96" }}>ملاحظات</span>
            <span style={{ fontSize: 14, color: "#2d3648" }}>{detail.notes}</span>
          </div>
        )}
      </div>

      {/* ٢) إخطار الوحدة */}
      <FaxLinkCard
        step={2}
        title="إخطار وحدة الفرد"
        description="بعد ما مسؤول الأرشيف يسجّل فاكس الإخطار على المنظومة، ابحث عنه برقمه واربطه بالملف."
        fax={notifyFax}
        editable={editable}
        unlinkDisabledReason={detail.submit_fax_id ? "فك ربط فاكس الرفع للجهة الأعلى الأول" : null}
        busy={busy}
        onLink={(id) => void linkFax("notify_fax_id", id)}
        onUnlink={() => void unlinkFax("notify_fax_id")}
        onOpen={(id) => navigate(`/dashboard/archive/outgoing/${id}`)}
      />

      {/* ٣) استيفاء الإجراءات (المستندات) */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#eff0f6] flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              fontSize: 13,
              fontWeight: 700,
              background: docs.length > 0 ? "#DCF4DF" : "#f1f5f9",
              color: docs.length > 0 ? "#00522E" : "#64748b",
            }}
          >
            {docs.length > 0 ? <Check size={14} /> : toAr(3)}
          </span>
          <FileCheck2 size={18} className="text-[#00522E]" />
          <p style={{ fontSize: 16, fontWeight: 700, color: "#2d3648" }}>استيفاء الإجراءات - المستندات</p>
          <span
            className="px-2.5 py-0.5 rounded-full"
            style={{ fontSize: 12, fontWeight: 700, background: "#e8f0fe", color: "#172e78" }}
          >
            {toAr(docs.length)} مستند
          </span>
        </div>

        {editable && (
          <div className="px-5 py-4 border-b border-[#eff0f6] flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="اسم المستند"
                disabled={uploading}
                className="flex-1 min-w-[240px] h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867] disabled:bg-[#f7f9fc]"
                style={{ fontSize: 14 }}
              />

              <label
                className={[
                  "flex items-center gap-2 px-5 h-[42px] rounded-lg transition-opacity",
                  uploading || !newDocName.trim()
                    ? "bg-[#DCF4DF] text-[#00522E] opacity-50 cursor-not-allowed"
                    : "bg-[#00B867] text-white hover:opacity-90 cursor-pointer",
                ].join(" ")}
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {uploading ? "جاري الرفع..." : "اختيار الملف ورفعه"}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  disabled={uploading || !newDocName.trim()}
                  onChange={(e) => void uploadDoc(e)}
                />
              </label>
            </div>

            <p style={{ fontSize: 12, color: "#94a3b8" }}>
              المستندات اللي قدّمها الفرد ويحتفظ بيها الفرع. اكتب اسم المستند الأول، وبعدين اختار الملف (PDF أو صورة،
              بحد أقصى {toAr(MAX_FILE_MB)} ميجا).
            </p>
          </div>
        )}

        {docs.length === 0 ? (
          <p className="px-5 py-8 text-center" style={{ fontSize: 13, color: "#94a3b8" }}>
            لم يتم رفع أي مستندات بعد.
          </p>
        ) : (
          <div className="flex flex-col">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="px-5 py-3 border-b border-[#eff0f6] last:border-b-0 flex items-center gap-3 flex-wrap"
              >
                <div className="w-9 h-9 rounded-lg bg-[#f6fcf8] flex items-center justify-center shrink-0">
                  <Paperclip size={16} className="text-[#00522E]" />
                </div>

                <div className="flex flex-col min-w-0">
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{doc.name}</span>
                  <span className="truncate max-w-[360px]" style={{ fontSize: 12, color: "#94a3b8" }}>
                    {[doc.file_name, formatSize(doc.file_size)].filter(Boolean).join(" • ")}
                  </span>
                </div>

                <span style={{ fontSize: 12, color: "#717d96", marginRight: "auto" }}>
                  {doc.uploaded_at ? `رُفع ${formatDate(doc.uploaded_at)}` : ""}
                </span>

                {doc.file_path && (
                  <button
                    type="button"
                    onClick={() => void openSignedFile(doc.file_path!, setError)}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#DCF4DF] text-[#00522E] hover:opacity-80"
                    style={{ fontSize: 12, fontWeight: 700 }}
                  >
                    <Eye size={14} />
                    عرض
                  </button>
                )}

                {editable && (
                  <button
                    type="button"
                    onClick={() => void removeDoc(doc)}
                    disabled={busy}
                    title="حذف المستند"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#991b1b] hover:bg-[#fef2f2] disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ٤) الرفع للجهة الأعلى */}
      <FaxLinkCard
        step={4}
        title="الرفع للجهة الأعلى"
        description="بعد استيفاء الإجراءات، اربط فاكس تقديم الملف للجهة الأعلى لطباعة شهادة إنهاء الخدمة."
        fax={submitFax}
        editable={editable}
        lockedReason={!detail.notify_fax_id ? "لازم يتم إخطار الوحدة الأول." : null}
        busy={busy}
        onLink={(id) => void linkFax("submit_fax_id", id)}
        onUnlink={() => void unlinkFax("submit_fax_id")}
        onOpen={(id) => navigate(`/dashboard/archive/outgoing/${id}`)}
      >
        {(editable || detail.submitted_to) && detail.notify_fax_id && (
          <div className="flex items-end gap-2 flex-wrap pt-3 border-t border-[#eff0f6]">
            <div className="flex-1 min-w-[240px]">
              <label style={labelStyle}>الجهة المقدَّم لها الملف</label>
              {editable ? (
                <input
                  type="text"
                  value={submittedTo}
                  onChange={(e) => setSubmittedTo(e.target.value)}
                  placeholder="مثال: هيئة التنظيم والإدارة"
                  className={inputClass}
                  style={{ fontSize: 14 }}
                />
              ) : (
                <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>{detail.submitted_to}</span>
              )}
            </div>

            {editable && (detail.submitted_to ?? "") !== submittedTo.trim() && (
              <button
                type="button"
                onClick={() =>
                  void updateCase(
                    { submitted_to: submittedTo.trim() || null },
                    "تم حفظ الجهة المقدم لها.",
                    "تعديل الجهة المقدم لها ملف إنهاء خدمة"
                  )
                }
                disabled={busy}
                className="flex items-center gap-2 px-4 h-[42px] rounded-lg border border-[#00B867] text-[#00522E] hover:bg-[#f0fdf4] disabled:opacity-50"
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                <Save size={14} />
                حفظ
              </button>
            )}
          </div>
        )}
      </FaxLinkCard>

      {/* ٥) شهادة إنهاء الخدمة */}
      {detail.status !== "cancelled" && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  background: certificate ? "#DCF4DF" : "#f1f5f9",
                  color: certificate ? "#00522E" : "#64748b",
                }}
              >
                {certificate ? <Check size={14} /> : toAr(5)}
              </span>
              <Award size={18} className="text-[#00522E]" />
              <p style={{ fontSize: 16, fontWeight: 700, color: "#2d3648" }}>شهادة إنهاء الخدمة</p>
            </div>

            <span
              className="px-2.5 py-0.5 rounded-full"
              style={{
                fontSize: 12,
                fontWeight: 700,
                background: certificate ? "#DCF4DF" : "#fff8e8",
                color: certificate ? "#00522E" : "#8a6500",
              }}
            >
              {certificate ? "تم التسجيل" : "بانتظار الشهادة من الجهة الأعلى"}
            </span>
          </div>

          {certificate ? (
            editingCert ? (
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label style={labelStyle}>رقم الشهادة</label>
                  <input
                    type="text"
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    className={inputClass}
                    style={{ fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>تاريخ الشهادة</label>
                  <input
                    type="date"
                    value={certDate}
                    onChange={(e) => setCertDate(e.target.value)}
                    className={inputClass}
                    style={{ fontSize: 14 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void saveCertCorrection()}
                  disabled={savingCert}
                  className="flex items-center gap-2 px-5 h-[42px] rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
                  style={{ fontSize: 14, fontWeight: 700 }}
                >
                  {savingCert ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  حفظ التصحيح
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCert(false);
                    setCertNumber(certificate.certificate_number);
                    setCertDate(certificate.certificate_date);
                  }}
                  className="h-[42px] px-4 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-gray-50"
                  style={{ fontSize: 14 }}
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex flex-col gap-0.5">
                  <span style={{ fontSize: 12, color: "#717d96" }}>رقم الشهادة</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#2d3648" }}>
                    {certificate.certificate_number}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span style={{ fontSize: 12, color: "#717d96" }}>تاريخ الشهادة</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#2d3648" }}>
                    {formatDate(certificate.certificate_date)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mr-auto">
                  {certificate.file_path && (
                    <button
                      type="button"
                      onClick={() => void openSignedFile(certificate.file_path!, setError)}
                      className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#DCF4DF] text-[#00522E] hover:opacity-80"
                      style={{ fontSize: 13, fontWeight: 700 }}
                    >
                      <Eye size={14} />
                      عرض الشهادة
                    </button>
                  )}

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setEditingCert(true)}
                      className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50"
                      style={{ fontSize: 13, fontWeight: 700 }}
                    >
                      <Pencil size={13} />
                      تصحيح
                    </button>
                  )}
                </div>
              </div>
            )
          ) : detail.status !== "submitted" ? (
            <p style={{ fontSize: 13, color: "#94a3b8" }}>
              تُسجل الشهادة بعد رفع الملف للجهة الأعلى.
            </p>
          ) : canEdit ? (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label style={labelStyle}>رقم الشهادة *</label>
                  <input
                    type="text"
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    className={inputClass}
                    style={{ fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>تاريخ الشهادة *</label>
                  <input
                    type="date"
                    value={certDate}
                    onChange={(e) => setCertDate(e.target.value)}
                    className={inputClass}
                    style={{ fontSize: 14 }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label
                  className="flex items-center gap-2 px-4 h-[42px] rounded-lg border border-[#cbd5e1] text-[#2d3648] hover:bg-gray-50 cursor-pointer"
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  <Upload size={14} />
                  {certFile ? certFile.name : "إرفاق صورة الشهادة (اختياري)"}
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      setCertFile(e.target.files?.[0] ?? null);
                      e.target.value = "";
                    }}
                  />
                </label>

                {certFile && (
                  <button
                    type="button"
                    onClick={() => setCertFile(null)}
                    className="text-[#64748b] hover:text-[#2d3648]"
                    title="إزالة الملف"
                  >
                    <X size={16} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void completeCase()}
                  disabled={savingCert || !certNumber.trim() || !certDate}
                  className="flex items-center gap-2 px-5 h-[42px] rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
                  style={{ fontSize: 14, fontWeight: 700 }}
                >
                  {savingCert ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
                  تسجيل الشهادة وإكمال الملف
                </button>
              </div>

              <p style={{ fontSize: 12, color: "#b45309" }}>
                تسجيل الشهادة هيكمّل الملف ويلغي تفعيل الفرد ويخرجه من أرقام القوة.
              </p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: "#94a3b8" }}>لم تُسجل الشهادة بعد.</p>
          )}
        </div>
      )}
    </div>
  );
}