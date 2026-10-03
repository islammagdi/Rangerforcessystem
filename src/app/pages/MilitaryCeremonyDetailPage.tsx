import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Save,
  Loader2,
  X,
  Printer,
  ClipboardList,
  LayoutGrid,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { useUnsavedChanges } from "../../lib/unsavedChanges";
import { formatVisitDate, logCeremony, toAr } from "./MilitaryCeremoniesPage";
import logoImg from "../../assets/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";

// =====================================================
// Types + Helpers
// =====================================================

type Side = "guest" | "host";

type Row = {
  key: string;
  id: string | null;
  rank: string;
  full_name: string;
  job_title: string;
};

const FIELDS = ["rank", "full_name", "job_title"] as const;
type Field = (typeof FIELDS)[number];

const SIDE_META: Record<Side, { title: string; bg: string; color: string }> = {
  guest: { title: "كشف الضيف", bg: "#e8f0fe", color: "#172e78" },
  host: { title: "كشف المستضيف", bg: "#DCF4DF", color: "#00522E" },
};

// =====================================================
// إعدادات ورقة الكروت (كلها بالمليمتر) — غيّر هنا براحتك
// =====================================================

// الورقة
const PAGE_WIDTH_MM = 210;       // A4
const PAGE_HEIGHT_MM = 297;      // A4
const PAGE_PADDING_X_MM = 8;     // هامش الورقة يمين وشمال
const PAGE_PADDING_Y_MM = 6;     // هامش الورقة فوق وتحت

// الشبكة
const COLUMNS = 2;               // عدد الأعمدة
const CARD_HEIGHT_MM = 16;       // ارتفاع الكارت
const ROW_GAP_MM = 3.8;          // المسافة بين كل صف والتاني
const COLUMN_GAP_MM = 6;         // المسافة بين كل بوكس والتاني (أفقيًا)

// الكارت
const CARD_BORDER_MM = 0.8;      // سُمك الإطار
const CARD_PADDING_X_MM = 4;     // المسافة الداخلية يمين وشمال
const CARD_PADDING_Y_MM = 2;     // المسافة الداخلية فوق وتحت

// عدد الصفوف بيتحسب تلقائيًا علشان الكروت تكفي الورقة من غير ما تتقص
const ROWS = Math.max(
  1,
  Math.floor(
    (PAGE_HEIGHT_MM - 2 * PAGE_PADDING_Y_MM + ROW_GAP_MM) / (CARD_HEIGHT_MM + ROW_GAP_MM)
  )
);
const CARDS_PER_PAGE = ROWS * COLUMNS;

const emptyRow = (): Row => ({
  key: crypto.randomUUID(),
  id: null,
  rank: "",
  full_name: "",
  job_title: "",
});

const isBlank = (r: Row) => !r.rank.trim() && !r.full_name.trim() && !r.job_title.trim();

const cleanRows = (list: Row[]) =>
  list
    .filter((r) => !isBlank(r))
    .map((r) => [r.id, r.rank.trim(), r.full_name.trim(), r.job_title.trim()]);

const snapshotOf = (title: string, date: string, guests: Row[], hosts: Row[]) =>
  JSON.stringify([title.trim(), date, cleanRows(guests), cleanRows(hosts)]);

const cardText = (r: Row) =>
  [r.rank.trim(), r.full_name.trim()].filter(Boolean).join(" / ");



function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}



// =====================================================
// ورقة طباعة الكروت
// =====================================================

function buildCardsHtml(title: string, labels: string[]): string {
  // كل فرد له صفحة كاملة: الكارت بتاعه متكرر ٣٢ مرة
  const pages = labels
    .map((label) => {
      const card = `<div class="card"><span>${escapeHtml(label)}</span></div>`;

      return `
      <section class="page">
        <div class="grid">${card.repeat(CARDS_PER_PAGE)}</div>
      </section>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml("كروت " + title)}</title>
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      html, body { margin: 0; padding: 0; background: #fff; }
      body { direction: rtl; color: #000; }
      .page {
        width: ${PAGE_WIDTH_MM}mm;
        height: ${PAGE_HEIGHT_MM}mm;
        padding: ${PAGE_PADDING_Y_MM}mm ${PAGE_PADDING_X_MM}mm;
        overflow: hidden;
        page-break-after: always;
        break-after: page;
      }
      .page:last-child { page-break-after: auto; break-after: auto; }
      .grid {
        display: grid;
        height: 100%;
        grid-template-columns: repeat(${COLUMNS}, 1fr);
        grid-template-rows: repeat(${ROWS}, ${CARD_HEIGHT_MM}mm);
        column-gap: ${COLUMN_GAP_MM}mm;
        row-gap: ${ROW_GAP_MM}mm;
        align-content: center;
      }
      .card {
        border: ${CARD_BORDER_MM}mm solid #000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: ${CARD_PADDING_Y_MM}mm ${CARD_PADDING_X_MM}mm;
        overflow: hidden;
      }
      .card span {
        display: inline-block;
        white-space: nowrap;
        line-height: 1.15;
        font-family: 'Times New Roman', Times, serif;
        font-weight: 700;
      }
    </style>
    <script>
      // أكبر حجم خط يخلي النص يملا الكارت من غير ما يخرج برّه
      function fitCards() {
        document.querySelectorAll('.page').forEach(function (page) {
          var cards = page.querySelectorAll('.card');
          if (!cards.length) return;

          var first = cards[0];
          var span = first.querySelector('span');
          var cs = getComputedStyle(first);
          var maxW = first.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
          var maxH = first.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);

          var lo = 4, hi = maxH * 1.2, best = 4;
          while (hi - lo > 0.2) {
            var mid = (lo + hi) / 2;
            span.style.fontSize = mid + 'px';
            if (span.offsetWidth <= maxW && span.offsetHeight <= maxH) {
              best = mid;
              lo = mid;
            } else {
              hi = mid;
            }
          }

          // كل كروت الصفحة نفس الاسم، فنفس الحجم
          cards.forEach(function (card) {
            card.querySelector('span').style.fontSize = best + 'px';
          });
        });
      }
      window.addEventListener('load', fitCards);
    </script>
  </head>
  <body>${pages}</body>
</html>`;
}
// =====================================================
// ورقة طباعة قائمة الحضور (نفس نسق طباعة السجل الاجتماعي)
// =====================================================

function buildAttendanceHtml({
  title,
  visitDate,
  guests,
  hosts,
  logoSrc,
}: {
  title: string;
  visitDate: string;
  guests: Row[];
  hosts: Row[];
  logoSrc: string;
}): string {
  const filledGuests = guests.filter((r) => !isBlank(r));
  const filledHosts = hosts.filter((r) => !isBlank(r));

    const tableHtml = (rows: Row[], emptyText: string) => {
    const body = rows.length
      ? rows
          .map(
            (r, i) => `
          <tr>
            <td>${toAr(i + 1)}</td>
            <td>${escapeHtml(r.rank.trim() || "-")}</td>
            <td class="name">${escapeHtml(r.full_name.trim())}</td>
            <td>${escapeHtml(r.job_title.trim() || "-")}</td>
            <td class="notes"></td>
          </tr>`
          )
          .join("")
      : `<tr><td colspan="5" class="empty-row">${emptyText}</td></tr>`;

    return `
      <table class="data">
        <colgroup>
          <col style="width:6%" />
          <col style="width:18%" />
          <col style="width:30%" />
          <col style="width:24%" />
          <col style="width:22%" />
        </colgroup>
        <thead>
          <tr>
            <th>م</th>
            <th>الرتبة</th>
            <th>الاسم</th>
            <th>الوظيفة</th>
            <th>ملاحظات</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>`;
  };

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml("قائمة الحضور - " + title)}</title>
    <style>
      @page { size: A4; margin: 0; }

      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: 'Almarai', Arial, sans-serif;
        direction: rtl;
        color: #2d3648;
      }

      .page { padding: 0 16mm; }

      .page-frame {
        position: fixed;
        top: 8mm;
        left: 8mm;
        right: 8mm;
        bottom: 8mm;
        border: 2px solid #cbd2e0;
        border-radius: 10px;
        pointer-events: none;
      }

      .header {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #cbd2e0;
        padding-bottom: 10px;
        margin-bottom: 10px;
      }

      .header-text { display: flex; flex-direction: column; gap: 2px; }
      .header-title { font-size: 18px; font-weight: 700; }
      .header-subtitle { font-size: 14px; font-weight: 700; }
      .header-system { font-size: 12px; color: #717d96; }
      .header-logo { width: 64px; height: 64px; object-fit: contain; }

      .header-title-box {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        padding: 6px 18px;
        font-size: 18px;
        font-weight: 700;
        text-decoration: underline;
        white-space: nowrap;
      }

      .visit-box {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px 16px;
        margin-top: 10px;
        padding: 10px 12px;
        background: #f7f9fc;
        border: 1px solid #e2e7f0;
        border-radius: 10px;
      }

      .visit-item { display: flex; gap: 4px; font-size: 13px; }
      .visit-item.wide { grid-column: span 3; font-size: 16px; }
      .visit-label { color: #717d96; white-space: nowrap; }
      .visit-value { font-weight: 700; }

      .section-title {
        font-size: 15px;
        font-weight: 700;
        background: #f7f9fc;
        padding: 6px 10px;
        border-radius: 6px;
        margin-top: 16px;
        margin-bottom: 8px;
        break-after: avoid;
        page-break-after: avoid;
      }

      table.data {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        margin-top: 4px;
      }

      table.data th,
      table.data td {
        border: 1px solid #e2e7f0;
        padding: 8px;
        text-align: center;
      }

      table.data th { background: #f7f9fc; font-weight: 700; }
      table.data td.name { font-weight: 700; }
      table.data td.notes { height: 30px; }

      table.data tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      thead { display: table-header-group; }

      .empty-row { color: #a1aebe; padding: 12px; }

      table.layout { width: 100%; border: none; border-collapse: collapse; }

      table.layout > thead > tr > td,
      table.layout > tfoot > tr > td,
      table.layout > tbody > tr > td {
        border: none;
        padding: 0;
        text-align: right;
      }

      .spacer { height: 14mm; }
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

                <div class="header-title-box">قائمة الحضور</div>

                <img src="${escapeHtml(logoSrc)}" class="header-logo" />
              </div>

              <div class="visit-box">
                <div class="visit-item wide">
                  <span class="visit-label">الزيارة:</span>
                  <span class="visit-value">${escapeHtml(title)}</span>
                </div>
                <div class="visit-item">
                  <span class="visit-label">التاريخ:</span>
                  <span class="visit-value">${escapeHtml(visitDate ? formatVisitDate(visitDate) : "-")}</span>
                </div>
                <div class="visit-item">
                  <span class="visit-label">عدد الضيوف:</span>
                  <span class="visit-value">${toAr(filledGuests.length)}</span>
                </div>
                <div class="visit-item">
                  <span class="visit-label">عدد المستضيف:</span>
                  <span class="visit-value">${toAr(filledHosts.length)}</span>
                </div>
              </div>

              <div class="section-title">${SIDE_META.guest.title}</div>
              ${tableHtml(filledGuests, "لا توجد أسماء في كشف الضيف")}

              <div class="section-title">${SIDE_META.host.title}</div>
              ${tableHtml(filledHosts, "لا توجد أسماء في كشف المستضيف")}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
}

// =====================================================
// جدول كشف (ضيف / مستضيف)
// =====================================================

function AttendeeTable({
  side,
  rows,
  onChange,
  canEdit,
}: {
  side: Side;
  rows: Row[];
  onChange: (rows: Row[]) => void;
  canEdit: boolean;
}) {
  const meta = SIDE_META[side];
  const filled = rows.filter((r) => !isBlank(r)).length;
  const visibleRows = canEdit ? rows : rows.filter((r) => !isBlank(r));

  function update(index: number, field: Field, value: string) {
    onChange(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  }

  // لصق أعمدة من Excel: (الرتبة، الاسم، الوظيفة) يبدأ من الخانة الحالية
  function handlePaste(
    e: React.ClipboardEvent<HTMLInputElement>,
    rowIndex: number,
    fieldIndex: number
  ) {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\t") && !text.includes("\n")) return;

    e.preventDefault();

    const lines = text
      .replace(/\r/g, "")
      .split("\n")
      .filter((line) => line.trim().length > 0);

    const next = [...rows];

    lines.forEach((line, li) => {
      const target = rowIndex + li;
      while (next.length <= target) next.push(emptyRow());

      const row = { ...next[target] };
      line.split("\t").forEach((cell, ci) => {
        const field = FIELDS[fieldIndex + ci];
        if (field) row[field] = cell.trim();
      });
      next[target] = row;
    });

    onChange(next);
  }

  const inputClass =
    "w-full h-10 rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]";

  return (
    <div className="bg-white rounded-2xl border border-[#eff0f6] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#eff0f6] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p style={{ fontSize: 16, fontWeight: 700, color: "#2d3648" }}>{meta.title}</p>
          <span
            className="px-2.5 py-0.5 rounded-full"
            style={{ fontSize: 12, fontWeight: 700, background: meta.bg, color: meta.color }}
          >
            {toAr(filled)} فرد
          </span>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => onChange([...rows, emptyRow()])}
            className="flex items-center gap-1 px-3 h-9 rounded-lg bg-[#DCF4DF] text-[#00522E] hover:opacity-80"
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            <Plus size={14} />
            إضافة صف
          </button>
        )}
      </div>

      {canEdit && (
        <p className="px-5 pt-3" style={{ fontSize: 12, color: "#94a3b8" }}>
          تقدر تنسخ الأعمدة (الرتبة، الاسم، الوظيفة) من Excel وتلصقها في أي خانة مرة واحدة.
        </p>
      )}

      {visibleRows.length === 0 ? (
        <p className="px-5 py-8 text-center" style={{ fontSize: 13, color: "#94a3b8" }}>
          لا توجد أسماء في هذا الكشف.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="text-[#64748b] text-sm">
                <th className="text-right px-4 py-3 w-[50px]">م</th>
                <th className="text-right px-4 py-3 w-[180px]">الرتبة</th>
                <th className="text-right px-4 py-3">الاسم</th>
                <th className="text-right px-4 py-3">الوظيفة</th>
                {canEdit && <th className="px-4 py-3 w-[120px]" />}
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row, index) => (
                <tr key={row.key} className="border-t border-[#eff0f6]">
                  <td className="px-4 py-2" style={{ fontSize: 13, color: "#717d96" }}>
                    {toAr(index + 1)}
                  </td>

                  {canEdit ? (
                    <>
                      {FIELDS.map((field, fieldIndex) => (
                        <td key={field} className="px-2 py-2">
                          <input
                            type="text"
                            value={row[field]}
                            onChange={(e) => update(index, field, e.target.value)}
                            onPaste={(e) => handlePaste(e, index, fieldIndex)}
                            placeholder={
                              field === "rank" ? "الرتبة" : field === "full_name" ? "الاسم *" : "الوظيفة"
                            }
                            className={inputClass}
                            style={{ fontSize: 13 }}
                          />
                        </td>
                      ))}

                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="لأعلى"
                            onClick={() => move(index, -1)}
                            disabled={index === 0}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-gray-100 disabled:opacity-30"
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            type="button"
                            title="لأسفل"
                            onClick={() => move(index, 1)}
                            disabled={index === rows.length - 1}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-gray-100 disabled:opacity-30"
                          >
                            <ArrowDown size={15} />
                          </button>
                          <button
                            type="button"
                            title="حذف الصف"
                            onClick={() => onChange(rows.filter((_, i) => i !== index))}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#991b1b] hover:bg-[#fef2f2]"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3" style={{ fontSize: 14, color: "#2d3648" }}>
                        {row.rank || "—"}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                        {row.full_name}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 14, color: "#334155" }}>
                        {row.job_title || "—"}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =====================================================
// معاينة صفحة كروت فرد واحد (نفس طريقة ملء البوكس)
// =====================================================

function PreviewPage({ label }: { label: string }) {
  const probeRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(6);

  useLayoutEffect(() => {
    const span = probeRef.current;
    const cell = span?.parentElement;
    if (!span || !cell) return;

    const cs = getComputedStyle(cell);
    const maxW = cell.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const maxH = cell.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);

    let lo = 1;
    let hi = Math.max(2, maxH * 1.2);
    let best = 1;

    while (hi - lo > 0.1) {
      const mid = (lo + hi) / 2;
      span.style.fontSize = `${mid}px`;
      if (span.offsetWidth <= maxW && span.offsetHeight <= maxH) {
        best = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }

    span.style.fontSize = `${best}px`;
    setFontSize(best);
  }, [label]);

  return (
    <div
      className="bg-white border border-[#cbd5e1] shadow-sm shrink-0"
      dir="rtl"
      style={{
        width: PAGE_WIDTH_MM,
        height: PAGE_HEIGHT_MM,
        padding: `${PAGE_PADDING_Y_MM}px ${PAGE_PADDING_X_MM}px`,
      }}
    >
      <div
        style={{
          display: "grid",
          height: "100%",
          gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, ${CARD_HEIGHT_MM}px)`,
          columnGap: COLUMN_GAP_MM,
          rowGap: ROW_GAP_MM,
          alignContent: "center",
        }}
      >
        {Array.from({ length: CARDS_PER_PAGE }, (_, i) => (
          <div
            key={i}
            style={{
              border: `${Math.max(1, CARD_BORDER_MM)}px solid #000`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: `${CARD_PADDING_Y_MM}px ${CARD_PADDING_X_MM}px`,
              overflow: "hidden",
              minWidth: 0,
              minHeight: 0,
            }}
          >
            <span
              ref={i === 0 ? probeRef : undefined}
              style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                lineHeight: 1.15,
                fontWeight: 700,
                fontFamily: "'Times New Roman', Times, serif",
                fontSize,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// إنشاء كروت الأفراد
// =====================================================

function CardsPanel({
  title,
  guests,
  hosts,
  hasUnsaved,
}: {
  title: string;
  guests: Row[];
  hosts: Row[];
  hasUnsaved: boolean;
}) {
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const groups = [
    { side: "guest" as Side, rows: guests.filter((r) => r.full_name.trim()) },
    { side: "host" as Side, rows: hosts.filter((r) => r.full_name.trim()) },
  ];

  const labels = groups.flatMap((g) =>
    g.rows.filter((r) => !excluded.has(r.key)).map(cardText)
  );
  // كل فرد = صفحة كاملة من الكروت
  const pages = labels.map((label) => Array.from({ length: CARDS_PER_PAGE }, () => label));

  function toggle(key: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleGroup(rows: Row[]) {
    const allIncluded = rows.every((r) => !excluded.has(r.key));
    setExcluded((prev) => {
      const next = new Set(prev);
      rows.forEach((r) => (allIncluded ? next.add(r.key) : next.delete(r.key)));
      return next;
    });
  }

  function handlePrint() {
    if (labels.length === 0) return;

    const printWindow = window.open("", "_blank", "width=900,height=1200");

    if (!printWindow) {
      window.alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildCardsHtml(title, labels));
    printWindow.document.close();

    const doPrint = () => {
      (printWindow as any).fitCards?.();
      printWindow.focus();
      printWindow.print();
      window.setTimeout(() => printWindow.close(), 500);
    };

    window.setTimeout(doPrint, 400);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span style={{ fontSize: 15, fontWeight: 700, color: "#2d3648" }}>
            {toAr(labels.length)} فرد • {toAr(pages.length)} ورقة A4
          </span>
          <span style={{ fontSize: 12, color: "#717d96" }}>
                      كل فرد له ورقة كاملة فيها كارته متكرر {toAr(CARDS_PER_PAGE)} مرة ({toAr(COLUMNS)} عمود × {toAr(ROWS)} صف). الكارت فيه الرتبة والاسم فقط.
          </span>
          {hasUnsaved && (
            <span style={{ fontSize: 12, color: "#b45309" }}>
              الكروت بتتطبع من البيانات الحالية حتى لو التعديلات لسه ما اتحفظتش.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handlePrint}
          disabled={labels.length === 0}
          className="flex items-center gap-2 px-5 h-10 rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
          style={{ fontSize: 14, fontWeight: 700 }}
        >
          <Printer size={16} />
          طباعة الكروت
        </button>
      </div>

      {/* اختيار الأسماء */}
      {groups.map(({ side, rows }) => {
        const meta = SIDE_META[side];
        const allIncluded = rows.length > 0 && rows.every((r) => !excluded.has(r.key));

        return (
          <div key={side} className="bg-white rounded-2xl border border-[#eff0f6] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p style={{ fontSize: 14, fontWeight: 700, color: meta.color }}>{meta.title}</p>

              {rows.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <span style={{ fontSize: 12, color: "#717d96" }}>تحديد الكل</span>
                  <input
                    type="checkbox"
                    checked={allIncluded}
                    onChange={() => toggleGroup(rows)}
                    className="w-4 h-4 accent-[#00B867] cursor-pointer"
                  />
                </label>
              )}
            </div>

            {rows.length === 0 ? (
              <p style={{ fontSize: 13, color: "#94a3b8" }}>لا توجد أسماء في هذا الكشف.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {rows.map((row) => {
                  const checked = !excluded.has(row.key);
                  return (
                    <label
                      key={row.key}
                      className={[
                        "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                        checked
                          ? "bg-[#DCF4DF] border-[#00B867]"
                          : "bg-[#f7f9fc] border-[#eff0f6] hover:bg-[#f5f6fb]",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(row.key)}
                        className="w-4 h-4 accent-[#00B867] cursor-pointer"
                      />
                      <span style={{ fontSize: 13, fontWeight: checked ? 700 : 400, color: "#2d3648" }}>
                        {cardText(row)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* معاينة الورق */}
      {pages.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#eff0f6] p-4 flex flex-col gap-3">
          <p style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>معاينة</p>

          <div className="flex flex-wrap gap-4">
            {pages.map((page, pageIndex) => (
              <div key={pageIndex} className="flex flex-col items-center gap-1">
                <PreviewPage label={page[0]} />
                <span
                  className="truncate"
                  style={{ maxWidth: PAGE_WIDTH_MM, fontSize: 11, color: "#94a3b8" }}
          
                  title={page[0]}
                >
                  ورقة {toAr(pageIndex + 1)}: {page[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// الصفحة
// =====================================================

export function MilitaryCeremonyDetailPage() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("military_ceremonies:edit");
  const { setDirty, guardNavigation } = useUnsavedChanges();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState<"attendance" | "cards">("attendance");

  const [title, setTitle] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [guests, setGuests] = useState<Row[]>([]);
  const [hosts, setHosts] = useState<Row[]>([]);
  const [originalIds, setOriginalIds] = useState<string[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const isDirty = canEdit && snapshotOf(title, visitDate, guests, hosts) !== savedSnapshot;

  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  useEffect(() => {
    return () => setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId]);

  async function load() {
    if (!visitId) return;
    setLoading(true);

    const [visitRes, attendeesRes] = await Promise.all([
      supabase
        .from("military_ceremony_visits")
        .select("id, title, visit_date")
        .eq("id", visitId)
        .maybeSingle(),
      supabase
        .from("military_ceremony_attendees")
        .select("id, side, rank, full_name, job_title, sort_order")
        .eq("visit_id", visitId)
        .order("sort_order", { ascending: true }),
    ]);

    if (visitRes.error || attendeesRes.error) {
      setError(
        "تعذر تحميل الزيارة: " + (visitRes.error?.message ?? attendeesRes.error?.message ?? "")
      );
      setLoading(false);
      return;
    }

    if (!visitRes.data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const toRow = (a: any): Row => ({
      key: a.id,
      id: a.id,
      rank: a.rank ?? "",
      full_name: a.full_name ?? "",
      job_title: a.job_title ?? "",
    });

    const list = attendeesRes.data ?? [];
    const loadedGuests = list.filter((a: any) => a.side === "guest").map(toRow);
    const loadedHosts = list.filter((a: any) => a.side === "host").map(toRow);

    const v = visitRes.data;
    setTitle(v.title);
    setVisitDate(v.visit_date);
    setGuests(canEdit && loadedGuests.length === 0 ? [emptyRow()] : loadedGuests);
    setHosts(canEdit && loadedHosts.length === 0 ? [emptyRow()] : loadedHosts);
    setOriginalIds(list.map((a: any) => a.id));
    setSavedSnapshot(snapshotOf(v.title, v.visit_date, loadedGuests, loadedHosts));
    setLoading(false);
  }

  async function handleSave() {
    if (!visitId) return;

    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("اكتب اسم الزيارة.");
      return;
    }

    if (!visitDate) {
      setError("اختر تاريخ الزيارة.");
      return;
    }

    for (const side of ["guest", "host"] as Side[]) {
      const list = side === "guest" ? guests : hosts;
      if (list.some((r) => !isBlank(r) && !r.full_name.trim())) {
        setError(`يوجد صف بدون اسم في ${SIDE_META[side].title}.`);
        return;
      }
    }

    setBusy(true);

    try {
      const { error: visitError } = await supabase
        .from("military_ceremony_visits")
        .update({
          title: title.trim(),
          visit_date: visitDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", visitId);

      if (visitError) throw visitError;

      const all = (["guest", "host"] as Side[]).flatMap((side) =>
        (side === "guest" ? guests : hosts)
          .filter((r) => !isBlank(r))
          .map((r, index) => ({
            id: r.id,
            visit_id: visitId,
            side,
            rank: r.rank.trim() || null,
            full_name: r.full_name.trim(),
            job_title: r.job_title.trim() || null,
            sort_order: index,
          }))
      );

      const keepIds = all.filter((r) => r.id).map((r) => r.id as string);
      const removedIds = originalIds.filter((id) => !keepIds.includes(id));

      if (removedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("military_ceremony_attendees")
          .delete()
          .in("id", removedIds);
        if (deleteError) throw deleteError;
      }

      const existing = all.filter((r) => r.id);
      if (existing.length > 0) {
        const { error: upsertError } = await supabase
          .from("military_ceremony_attendees")
          .upsert(existing);
        if (upsertError) throw upsertError;
      }

      const fresh = all.filter((r) => !r.id).map(({ id: _id, ...rest }) => rest);
      if (fresh.length > 0) {
        const { error: insertError } = await supabase
          .from("military_ceremony_attendees")
          .insert(fresh);
        if (insertError) throw insertError;
      }

      await load();
      setSuccess("تم حفظ الزيارة بنجاح.");
      await logCeremony("UPDATE", "تعديل زيارة", `${title.trim()} - ${visitDate}`);
    } catch (err: any) {
      setError("تعذر الحفظ: " + (err?.message ?? ""));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!visitId) return;
    if (!window.confirm(`هل تريد حذف الزيارة "${title}" بكل كشوفها نهائيًا؟`)) return;

    setBusy(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("military_ceremony_visits")
        .delete()
        .eq("id", visitId);

      if (deleteError) {
        setError("تعذر حذف الزيارة: " + deleteError.message);
        return;
      }

      await logCeremony("DELETE", "حذف زيارة", `${title} - ${visitDate}`);
      setDirty(false);
      navigate("/dashboard/military-ceremonies");
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    guardNavigation(() => navigate("/dashboard/military-ceremonies"));
  }

  async function handlePrintAttendance() {
    const printWindow = window.open("", "_blank", "width=1000,height=1200");

    if (!printWindow) {
      setError("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(
      buildAttendanceHtml({
        title,
        visitDate,
        guests,
        hosts,
        logoSrc: new URL(logoImg, window.location.href).href,
      })
    );
    printWindow.document.close();

    // نستنى اللوجو يتحمل قبل الطباعة
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
  }
  const tabs = useMemo(
    () => [
      { id: "attendance" as const, label: "قائمة الحضور", icon: <ClipboardList size={16} /> },
      { id: "cards" as const, label: "إنشاء كروت الأفراد", icon: <LayoutGrid size={16} /> },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[#00B867]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div
        className="bg-white rounded-2xl border border-[#eff0f6] py-16 text-center text-[#717d96]"
        dir="rtl"
        style={{ fontFamily: "'Almarai', sans-serif" }}
      >
        الزيارة غير موجودة.
        <button
          type="button"
          onClick={() => navigate("/dashboard/military-ceremonies")}
          className="block mx-auto mt-3 text-[#1f3d97] underline"
        >
          الرجوع لكل الزيارات
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 w-full"
      dir="rtl"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      {/* بيانات الزيارة */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1 text-[#475569] hover:text-[#2d3648]"
            style={{ fontSize: 14 }}
          >
            <ArrowRight size={16} />
            كل الزيارات
          </button>

          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={busy}
                className="flex items-center gap-1 px-4 h-10 rounded-lg bg-[#fef2f2] text-[#991b1b] hover:opacity-80 disabled:opacity-50"
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                <Trash2 size={15} />
                حذف الزيارة
              </button>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={busy || !isDirty}
                className="flex items-center gap-2 px-5 h-10 rounded-lg bg-[#00B867] text-white hover:opacity-90 disabled:opacity-50"
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                حفظ
              </button>
            </div>
          )}
        </div>

        {canEdit ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <label style={{ fontSize: 13, color: "#717d96", display: "block", marginBottom: 4 }}>
                اسم الزيارة
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]"
                style={{ fontSize: 15, fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, color: "#717d96", display: "block", marginBottom: 4 }}>
                تاريخ الزيارة
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="h-[42px] rounded-lg border border-[#cbd5e1] px-3 outline-none focus:border-[#00B867]"
                style={{ fontSize: 14 }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <p style={{ fontSize: 20, fontWeight: 700, color: "#2d3648" }}>{title}</p>
            <p style={{ fontSize: 14, color: "#717d96" }}>{formatVisitDate(visitDate)}</p>
          </div>
        )}
      </div>

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

      {/* التابات */}
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-1.5 flex gap-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "flex items-center gap-2 px-5 h-10 rounded-xl transition-colors",
              tab === t.id ? "bg-[#DCF4DF] text-[#00522E]" : "text-[#717d96] hover:bg-[#f5f6fb]",
            ].join(" ")}
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "attendance" ? (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-[#eff0f6] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                {toAr(guests.filter((r) => !isBlank(r)).length)} ضيف •{" "}
                {toAr(hosts.filter((r) => !isBlank(r)).length)} من المستضيف
              </span>
              {isDirty && (
                <span style={{ fontSize: 12, color: "#b45309" }}>
                  الطباعة بتطلع بالبيانات الحالية حتى لو التعديلات لسه ما اتحفظتش.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => void handlePrintAttendance()}
              disabled={
                guests.every((r) => isBlank(r)) && hosts.every((r) => isBlank(r))
              }
              className="flex items-center gap-2 px-5 h-10 rounded-lg border border-[#2d3648] bg-white text-[#2d3648] hover:bg-gray-50 disabled:opacity-50"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              <Printer size={16} />
              طباعة قائمة الحضور
            </button>
          </div>

          <AttendeeTable side="guest" rows={guests} onChange={setGuests} canEdit={canEdit} />
          <AttendeeTable side="host" rows={hosts} onChange={setHosts} canEdit={canEdit} />
        </div>
      ) : (
        <CardsPanel title={title} guests={guests} hosts={hosts} hasUnsaved={isDirty} />
      )}
    </div>
  );
}