import { toArabicDigits } from "./normalizeDigits";

/** تهريب النصوص قبل وضعها داخل HTML الطباعة */
export const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** أرقام وتواريخ ونصوص: تتحول لأرقام عربية، ويرجع "-" لو فاضي */
export const ar = (v: unknown): string =>
  v === null || v === undefined || v === "" ? "-" : esc(toArabicDigits(String(v)));

/** للنصوص الحرة (أسماء وأماكن وملاحظات): نفس ar لأن أي نص ممكن يحتوي رقم */
export const val = ar;
const PRINT_CSS = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { margin: 0; padding: 0; font-family: 'Almarai', Arial, sans-serif; direction: rtl; color: #2d3648; }

  /* الإطار: بيتكرر على كل صفحة بحجمها كامل */
  .page-frame { position: fixed; top: 8mm; left: 8mm; right: 8mm; bottom: 8mm; border: 2px solid #cbd2e0; border-radius: 10px; pointer-events: none; }

  /* جدول التخطيط: بيكرر مسافة فوق وتحت في كل صفحة عشان المحتوى ما يلزقش في الإطار */
  table.layout { width: 100%; border: none; border-collapse: collapse; margin: 0; }
  table.layout > thead > tr > td,
  table.layout > tfoot > tr > td,
  table.layout > tbody > tr > td { border: none; padding: 0; text-align: right; }
  .spacer { height: 14mm; }

  .page { padding: 0 16mm; }

  .header { position: relative; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #cbd2e0; padding-bottom: 10px; margin-bottom: 10px; }
  .header-text { display: flex; flex-direction: column; gap: 2px; }
  .header-title { font-size: 18px; font-weight: 700; }
  .header-subtitle { font-size: 14px; font-weight: 700; }
  .header-system { font-size: 12px; color: #717d96; }
  .header-logo { width: 64px; height: 64px; object-fit: contain; }
  .header-title-box { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 6px; padding: 6px 18px; font-size: 18px; font-weight: 700; text-decoration: underline; white-space: nowrap; }

  /* ربط العنوان بجدوله */
  .section-block { break-inside: avoid; page-break-inside: avoid; }
  .section-title { font-size: 15px; font-weight: 700; background: #f7f9fc; padding: 6px 10px; border-radius: 6px; margin-top: 16px; margin-bottom: 8px; break-after: avoid; page-break-after: avoid; }

  .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; }
  .info-item { display: flex; gap: 4px; font-size: 13px; border-bottom: 1px dashed #e2e7f0; padding-bottom: 4px; }
  .info-label { color: #717d96; white-space: nowrap; }
  .info-value { font-weight: 700; }

  table:not(.layout) { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
  table:not(.layout) thead { display: table-header-group; }
  table:not(.layout) tr { break-inside: avoid; page-break-inside: avoid; }
  table:not(.layout) th, table:not(.layout) td { border: 1px solid #e2e7f0; padding: 6px 8px; text-align: center; }
  table:not(.layout) th { background: #f7f9fc; font-weight: 700; }
  .empty-row { color: #a1aebe; padding: 12px; }

  .basic-info-row { display: flex; align-items: flex-start; gap: 16px; }
  .photo-box-inline { width: 100px; flex-shrink: 0; text-align: center; }
  .photo-box-inline img { display: block; width: 100%; height: auto; border-radius: 6px; }
  /* المرفقات */
  .attachments-page { break-before: page; page-break-before: always; }
  .attachments-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .attachment-item { display: flex; flex-direction: column; border: 1px solid #e2e7f0; border-radius: 8px; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
  .attachment-caption { order: -1; font-size: 12px; font-weight: 700; text-align: center; background: #f7f9fc; padding: 6px 8px; border-bottom: 1px solid #e2e7f0; }
  .attachment-img-box { height: 110mm; display: flex; align-items: center; justify-content: center; background: #fff; padding: 6px; }
  .attachment-img-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .attachment-placeholder { color: #a1aebe; font-size: 12px; text-align: center; }
`;
export function buildPrintHtml(opts: { title: string; boxTitle: string; logo: string; body: string }): string {
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>${esc(opts.title)}</title>
        <style>${PRINT_CSS}</style>
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
                    <div class="header-title-box">${esc(opts.boxTitle)}</div>
                    <img src="${opts.logo}" class="header-logo" />
                  </div>
                  ${opts.body}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;
}

/** لازم تتنادى مباشرة من click handler عشان المتصفح ميمنعش النافذة */
export function printHtml(html: string, existingWindow?: Window | null): void {
  const w = existingWindow ?? window.open("", "_blank", "width=1000,height=1200");

  if (!w) {
    alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
    return;
  }

  w.document.open();
  w.document.write(html);
  w.document.close();

  const doPrint = async () => {
    await Promise.all(
      Array.from(w.document.images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
      )
    );

    await new Promise((resolve) => window.setTimeout(resolve, 300));

    if (w.closed) return;
    w.focus();
    w.print();
  };

  void doPrint();
}