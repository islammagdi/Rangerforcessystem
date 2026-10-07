import { supabase } from "./supabase";

// =====================================================
// أرشيف اليوميات
// بناء نسخة HTML مطابقة لليومية وقت الطباعة، وحفظها وفتحها
// =====================================================

export const DAILY_ARCHIVE_BUCKET = "daily-reports-archive";

export type DailyArchiveMeta = {
  reportType: string;
  reportTitle: string;
  unitId: string | null;
  unitName: string;
  category: string;
  excludeBatch: boolean;
  dischargeDate: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// كل الـ CSS المحمّل في الصفحة دلوقتي (Tailwind وغيره)، علشان النسخة
// تفضل بنفس الشكل لما تتفتح لوحدها. الملفات اللي من مواقع تانية (زي
// Google Fonts) مينفعش نقرأها، فبنحط رابطها بدلها.
function collectPageCss(): { inline: string; links: string[] } {
  let inline = "";
  const links: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from((sheet as CSSStyleSheet).cssRules)) {
        inline += rule.cssText + "\n";
      }
    } catch {
      if (sheet.href) links.push(sheet.href);
    }
  }

  return { inline, links };
}

// نسخة من منطقة الطباعة زي ما هي على الشاشة دلوقتي، من غير الأزرار
// والعناصر اللي عليها no-print
export function buildDailyReportSnapshot(areaId: string, title: string): string {
  const area = document.getElementById(areaId);

  if (!area) {
    throw new Error("مش لاقي اليومية في الصفحة");
  }

  const clone = area.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".no-print").forEach((el) => el.remove());

  const { inline, links } = collectPageCss();

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<base href="${escapeHtml(window.location.origin)}/" />
<title>${escapeHtml(title)}</title>
${links.map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}" />`).join("\n")}
<style>${inline}</style>
<style>
  body { margin: 0; background: #fff; direction: rtl; }
  #daily-report-print-area { padding: 20px; }
</style>
</head>
<body>
${clone.outerHTML}
</body>
</html>`;
}

export async function archiveDailyReport(meta: DailyArchiveMeta, html: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("لازم تكون مسجل دخول");
  }

  const now = new Date();
  const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.html`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });

  const { error: uploadError } = await supabase.storage
    .from(DAILY_ARCHIVE_BUCKET)
    .upload(path, blob, { contentType: "text/html;charset=utf-8", upsert: false });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error: insertError } = await supabase.from("daily_report_archive").insert({
    report_type: meta.reportType,
    report_title: meta.reportTitle,
    unit_id: meta.unitId,
    unit_name: meta.unitName,
    category: meta.category,
    exclude_batch: meta.excludeBatch,
    discharge_date: meta.dischargeDate,
    file_path: path,
    file_size: blob.size,
    printed_by: user.id,
  });

  if (insertError) {
    await supabase.storage.from(DAILY_ARCHIVE_BUCKET).remove([path]);
    throw new Error(insertError.message);
  }
}

// فتح نسخة محفوظة في نافذة جديدة، ولو print = true بتتطبع على طول
export async function openArchivedReport(path: string, print = false): Promise<void> {
  // بنفتح النافذة الأول علشان المتصفح ميعتبرهاش popup
  const win = window.open("", "_blank");

  if (!win) {
    throw new Error("اسمح بالنوافذ المنبثقة للمتصفح");
  }

  win.document.write(
    `<p style="font-family:Arial,sans-serif;text-align:center;margin-top:40px;direction:rtl;">جاري تحميل اليومية...</p>`
  );

  const { data, error } = await supabase.storage.from(DAILY_ARCHIVE_BUCKET).download(path);

  if (error || !data) {
    win.close();
    throw new Error(error?.message ?? "تعذر تحميل اليومية");
  }

  const html = await data.text();

  win.document.open();
  win.document.write(html);
  win.document.close();

  if (print) {
    // مهلة صغيرة علشان الخطوط تتحمّل قبل الطباعة
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    if (win.closed) return;
    win.focus();
    win.print();
  }
}