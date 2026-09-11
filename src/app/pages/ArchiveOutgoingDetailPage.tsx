import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Plus, Trash2, Upload, ArrowRight, Printer } from "lucide-react";

import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/logActivity";
import {
  fetchOutgoingMailById,
  updateOutgoingMail,
  addOutgoingMailNote,
  addOutgoingMailScan,
  addOutgoingMailRecipient,
  uploadOutgoingScanFile,
  getScanSignedUrl,
  type OutgoingMailFull,
} from "../../lib/mailArchive";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ArchiveOutgoingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mail, setMail] = useState<OutgoingMailFull | null>(null);
  const [scanUrls, setScanUrls] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ملخص الفاكس
  const [faxSummary, setFaxSummary] = useState("");
  const [savingSummary, setSavingSummary] = useState(false);

  // استلام الأصل
  const [isOriginalReceived, setIsOriginalReceived] = useState(false);
  const [originalReceivedBy, setOriginalReceivedBy] = useState("");
  const [savingReceipt, setSavingReceipt] = useState(false);

  // إضافة ملاحظة جديدة
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // إضافة مستلم جديد
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientEntity, setNewRecipientEntity] = useState("");
  const [savingRecipient, setSavingRecipient] = useState(false);

  // إضافة صورة جديدة
  const [uploadingScan, setUploadingScan] = useState(false);

  useEffect(() => {
    if (id) {
      loadMail(id);
    }
  }, [id]);

  async function loadMail(mailId: string) {
    setLoading(true);
    setError("");

    try {
      const data = await fetchOutgoingMailById(mailId);
      setMail(data);

      setFaxSummary(data.fax_summary ?? "");
      setIsOriginalReceived(data.is_original_received);
      setOriginalReceivedBy(data.original_received_by ?? "");

      // تجهيز روابط معاينة الصور
      const urls: Record<string, string> = {};

      await Promise.all(
        data.scans.map(async (scan) => {
          try {
            urls[scan.id] = await getScanSignedUrl(scan.file_path);
          } catch (err) {
            console.error("Signed url error:", err);
          }
        })
      );

      setScanUrls(urls);
    } catch (err: any) {
      console.error("Load mail detail error:", err);
      setError(err?.message || "حدث خطأ أثناء تحميل بيانات الفاكس");
    } finally {
      setLoading(false);
    }
  }

  async function getCurrentUserInfo(): Promise<{
    userId: string | null;
    userName: string;
  }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { userId: null, userName: "غير معروف" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    return {
      userId: user.id,
      userName: profile?.username ?? "غير معروف",
    };
  }

  // نص وصفي موحّد لحالة استلام الأصل، يُستخدم في تسجيل التعديل
  function describeReceiptState(
    received: boolean,
    receivedBy: string
  ): string {
    if (!received) {
      return "غير مستلم";
    }

    return `مستلم بواسطة: ${receivedBy || "غير محدد"}`;
  }

  /* =======================================================
     حفظ ملخص الفاكس
  ======================================================= */

  async function handleSaveSummary() {
    if (!mail) return;

    setSavingSummary(true);
    setError("");

    try {
      const oldSummary = mail.fax_summary?.trim() || "بدون ملخص";
      const newSummary = faxSummary.trim() || "بدون ملخص";

      await updateOutgoingMail(mail.id, {
        fax_summary: faxSummary.trim() || null,
      });

      try {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "UPDATE",
          action: "تعديل ملخص الفاكس",
          entity: "outgoing_mail",
          details: `القيمة القديمة: ${oldSummary} - القيمة الجديدة: ${newSummary}`,
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      setSuccessMsg("تم حفظ ملخص الفاكس بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);

      await loadMail(mail.id);
    } catch (err: any) {
      console.error("Save summary error:", err);
      setError(err?.message || "حدث خطأ أثناء حفظ الملخص");
    } finally {
      setSavingSummary(false);
    }
  }

  /* =======================================================
     حفظ حالة استلام الأصل
  ======================================================= */

  async function handleSaveReceipt() {
    if (!mail) return;

    if (isOriginalReceived && !originalReceivedBy.trim()) {
      setError("يجب إدخال اسم الشخص الذي استلم الأصل");
      return;
    }

    setSavingReceipt(true);
    setError("");

    try {
      const oldState = describeReceiptState(
        mail.is_original_received,
        mail.original_received_by ?? ""
      );

      const newState = describeReceiptState(
        isOriginalReceived,
        originalReceivedBy.trim()
      );

      await updateOutgoingMail(mail.id, {
        is_original_received: isOriginalReceived,
        original_received_by: isOriginalReceived
          ? originalReceivedBy.trim()
          : null,
      });

      try {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "UPDATE",
          action: "تعديل استلام الأصل",
          entity: "outgoing_mail",
          details: `القيمة القديمة: ${oldState} - القيمة الجديدة: ${newState}`,
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      setSuccessMsg("تم تحديث حالة استلام الأصل بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);

      await loadMail(mail.id);
    } catch (err: any) {
      console.error("Update receipt error:", err);
      setError(err?.message || "حدث خطأ أثناء حفظ التعديل");
    } finally {
      setSavingReceipt(false);
    }
  }

  /* =======================================================
     إضافة ملاحظة جديدة
  ======================================================= */

  async function handleAddNote() {
    if (!mail) return;

    if (!newNote.trim()) {
      setError("يرجى كتابة نص الملاحظة أولاً");
      return;
    }

    setSavingNote(true);
    setError("");

    try {
      const { userId, userName } = await getCurrentUserInfo();
      const noteText = newNote.trim();

      await addOutgoingMailNote(mail.id, noteText, userId, userName);

      try {
        await logActivity({
          userId,
          userName,
          actionType: "CREATE",
          action: "اضافة الملاحظات",
          entity: "outgoing_mail",
          details: `الملاحظة: ${noteText}`,
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      setNewNote("");
      await loadMail(mail.id);
    } catch (err: any) {
      console.error("Add note error:", err);
      setError(err?.message || "حدث خطأ أثناء إضافة الملاحظة");
    } finally {
      setSavingNote(false);
    }
  }

  /* =======================================================
     إضافة مستلم جديد
  ======================================================= */

  async function handleAddRecipient() {
    if (!mail) return;

    if (!newRecipientName.trim()) {
      setError("يرجى كتابة اسم المستلم أولاً");
      return;
    }

    setSavingRecipient(true);
    setError("");

    try {
      const recipientName = newRecipientName.trim();
      const recipientEntity = newRecipientEntity.trim();

      await addOutgoingMailRecipient(
        mail.id,
        recipientName,
        recipientEntity || null
      );

      try {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "CREATE",
          action: "اضافة الأشخاص المستلمين للفاكس",
          entity: "outgoing_mail",
          details: `الاسم: ${recipientName} - الجهة: ${
            recipientEntity || "غير محددة"
          }`,
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      setNewRecipientName("");
      setNewRecipientEntity("");
      await loadMail(mail.id);
    } catch (err: any) {
      console.error("Add recipient error:", err);
      setError(err?.message || "حدث خطأ أثناء إضافة المستلم");
    } finally {
      setSavingRecipient(false);
    }
  }

  /* =======================================================
     إضافة صورة جديدة
  ======================================================= */

  async function handleAddScan(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!mail) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingScan(true);
    setError("");

    try {
      const filePath = await uploadOutgoingScanFile(mail.id, file);
      await addOutgoingMailScan(mail.id, filePath, null);

      try {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "CREATE",
          action: "رفع الصور الضوئية للفاكس",
          entity: "outgoing_mail",
          details: "عدد الصور المرفوعة: 1",
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      await loadMail(mail.id);
    } catch (err: any) {
      console.error("Add scan error:", err);
      setError(err?.message || "حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploadingScan(false);
      e.target.value = "";
    }
  }
  /* =======================================================
     طباعة كل المرفقات (الصور)
  ======================================================= */

  function handlePrintScans() {
    if (!mail || mail.scans.length === 0) {
      alert("لا توجد مرفقات لطباعتها.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=1200");

    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    const imagesHtml = mail.scans
      .map((scan) => {
        const url = scanUrls[scan.id] ?? "";

        return `
          <div class="print-page">
            <img src="${url}" alt="${scan.label ?? ""}" />
            ${
              scan.label
                ? `<p class="caption">${scan.label}</p>`
                : ""
            }
          </div>
        `;
      })
      .join("");

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>مرفقات فاكس صادر رقم ${mail.fax_number}/${mail.fax_year}</title>

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

            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              direction: rtl;
            }

            .print-page {
              width: 100%;
              height: 277mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              page-break-after: always;
            }

            .print-page:last-child {
              page-break-after: auto;
            }

            .print-page img {
              max-width: 100%;
              max-height: 250mm;
              object-fit: contain;
            }

            .caption {
              margin-top: 8px;
              font-size: 14px;
              text-align: center;
              color: #333;
            }
          </style>
        </head>

        <body>
          ${imagesHtml}
        </body>
      </html>
    `);

    printWindow.document.close();

    const doPrint = () => {
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };

    if (printWindow.document.readyState === "complete") {
      doPrint();
    } else {
      printWindow.onload = doPrint;
    }
  }
  /* =======================================================
     Render
  ======================================================= */

  if (loading) {
    return (
      <div
        className="flex items-center justify-center w-full min-h-[400px]"
        dir="rtl"
      >
        <span style={{ ...F, fontSize: 16, color: "#717d96" }}>
          جاري تحميل بيانات الفاكس...
        </span>
      </div>
    );
  }

  if (!mail) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full min-h-[400px] gap-4"
        dir="rtl"
      >
        <span style={{ ...F, fontSize: 16, color: "#e34040" }}>
          {error || "لم يتم العثور على الفاكس"}
        </span>

        <button
          type="button"
          onClick={() => navigate("/dashboard/archive/outgoing")}
          className="px-5 py-2 rounded-[8px] bg-[#DCF4DF]"
          style={{ ...F, fontSize: 14, color: "#2d3648" }}
        >
          العودة للقائمة
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1
          style={{
            ...F,
            fontWeight: 700,
            fontSize: "clamp(20px,3.5vw,28px)",
            color: "#2d3648",
          }}
        >
          فاكس صادر رقم {mail.fax_number}/{mail.fax_year}
        </h1>

        <button
          type="button"
          onClick={() => navigate("/dashboard/archive/outgoing")}
          className="flex items-center gap-1.5"
          style={{ ...F, fontSize: 14, color: "#1f3d97" }}
        >
          <ArrowRight size={16} />
          العودة للقائمة
        </button>
      </div>

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            ...F,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{
            background: "#dcfce7",
            color: "#166534",
            ...F,
            fontSize: 14,
          }}
        >
          {successMsg}
        </div>
      )}

      {/* البيانات الأساسية */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span style={{ ...F, fontSize: 14, color: "#717d96" }}>
              تاريخ الفاكس:
            </span>
            <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              {formatDate(mail.fax_date)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ ...F, fontSize: 14, color: "#717d96" }}>
              مكتب الإصدار:
            </span>
            <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              {mail.mail_offices?.name ?? "-"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ ...F, fontSize: 14, color: "#717d96" }}>
              تاريخ التسجيل:
            </span>
            <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              {formatDateTime(mail.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ ...F, fontSize: 14, color: "#717d96" }}>
              سجّله:
            </span>
            <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              {mail.created_by_name ?? "-"}
            </span>
          </div>
        </div>
      </section>
      {/* ملخص الفاكس */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            ملخص الفاكس
          </span>
        </div>

        <div className="p-6 flex flex-col gap-3">
          <textarea
            value={faxSummary}
            onChange={(e) => setFaxSummary(e.target.value)}
            placeholder="اكتب ملخصًا مختصرًا لموضوع الفاكس"
            rows={3}
            dir="rtl"
            className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />

          <button
            type="button"
            onClick={handleSaveSummary}
            disabled={savingSummary}
            className="h-[42px] px-6 rounded-[8px] self-start disabled:opacity-50"
            style={{
              background: "linear-gradient(to bottom,#00b867,#00522e)",
              ...F,
              fontSize: 14,
              color: "#fff",
            }}
          >
            {savingSummary ? "جاري الحفظ..." : "حفظ الملخص"}
          </button>
        </div>
      </section>

      {/* جهات الإرسال */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            جهة/جهات الصادر لها الفاكس
          </span>
        </div>

        <div className="p-6 flex flex-col gap-2">
          {mail.destinations.length === 0 ? (
            <span style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
              لا توجد جهات مسجلة
            </span>
          ) : (
            mail.destinations.map((dest) => (
              <div
                key={dest.id}
                className="px-3 py-2 rounded-[8px]"
                style={{ background: "#f7f9fc" }}
              >
                <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                  {dest.destination_entity}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* المستلمين */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            الأشخاص المستلمين للفاكس
          </span>
        </div>

        <div className="p-6 flex flex-col gap-3">
          {mail.recipients.length === 0 ? (
            <span style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
              لا يوجد مستلمين مسجلين
            </span>
          ) : (
            <div className="flex flex-col gap-2">
              {mail.recipients.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-3 py-2 rounded-[8px]"
                  style={{ background: "#f7f9fc" }}
                >
                  <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                    {r.recipient_name}
                  </span>

                  {r.recipient_entity && (
                    <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                      {r.recipient_entity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* إضافة مستلم جديد */}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newRecipientName}
              onChange={(e) => setNewRecipientName(e.target.value)}
              placeholder="اسم الشخص"
              dir="rtl"
              className="flex-1 h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />

            <input
              type="text"
              value={newRecipientEntity}
              onChange={(e) => setNewRecipientEntity(e.target.value)}
              placeholder="الجهة (اختياري)"
              dir="rtl"
              className="flex-1 h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />

            <button
              type="button"
              onClick={handleAddRecipient}
              disabled={savingRecipient}
              className="h-[42px] px-4 rounded-[8px] flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              style={{
                background: "#DCF4DF",
                ...F,
                fontSize: 13,
                color: "#2d3648",
              }}
            >
              <Plus size={14} />
              إضافة
            </button>
          </div>
        </div>
      </section>

      {/* الملاحظات */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            الملاحظات
          </span>
        </div>

        <div className="p-6 flex flex-col gap-3">
          {mail.notes.length === 0 ? (
            <span style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
              لا توجد ملاحظات مسجلة
            </span>
          ) : (
            <div className="flex flex-col gap-3">
              {mail.notes.map((note) => (
                <div
                  key={note.id}
                  className="px-4 py-3 rounded-[8px]"
                  style={{ background: "#f7f9fc" }}
                >
                  <p style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                    {note.note_text}
                  </p>

                  <p
                    className="mt-1"
                    style={{ ...F, fontSize: 12, color: "#a1aebe" }}
                  >
                    {note.created_by_name ?? "غير معروف"} —{" "}
                    {formatDateTime(note.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* إضافة ملاحظة جديدة */}

          <div className="flex items-start gap-2 pt-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="اكتب ملاحظة جديدة"
              rows={2}
              dir="rtl"
              className="flex-1 rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />

            <button
              type="button"
              onClick={handleAddNote}
              disabled={savingNote}
              className="h-[42px] px-4 rounded-[8px] flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              style={{
                background: "#DCF4DF",
                ...F,
                fontSize: 13,
                color: "#2d3648",
              }}
            >
              <Plus size={14} />
              إضافة
            </button>
          </div>
        </div>
      </section>

      {/* الصور الضوئية */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0] flex items-center justify-between">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            الصور الضوئية للفاكس
          </span>

          <button
            type="button"
            onClick={handlePrintScans}
            disabled={mail.scans.length === 0}
            className="flex items-center gap-1.5 h-[36px] px-4 rounded-[8px] disabled:opacity-40"
            style={{ background: "#DCF4DF" }}
          >
            <Printer size={15} color="#2d3648" />
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
              طباعة كل المرفقات
            </span>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {mail.scans.length === 0 ? (
            <span style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
              لا توجد صور مرفوعة
            </span>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {mail.scans.map((scan) => (
                <a
                  key={scan.id}
                  href={scanUrls[scan.id] ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1"
                >
                  <img
                    src={scanUrls[scan.id]}
                    alt={scan.label ?? ""}
                    className="w-full h-[100px] object-cover rounded-[8px] border border-[#e2e7f0]"
                  />

                  {scan.label && (
                    <span
                      className="text-center"
                      style={{ ...F, fontSize: 12, color: "#717d96" }}
                    >
                      {scan.label}
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}

          <label
            className="flex items-center justify-center gap-2 h-[60px] rounded-[10px] border-2 border-dashed cursor-pointer self-start px-6"
            style={{ borderColor: "#cbd2e0" }}
          >
            <Upload size={18} className="text-[#415844]" />
            <span style={{ ...F, fontSize: 13, color: "#4a5468" }}>
              {uploadingScan ? "جاري الرفع..." : "إضافة صورة جديدة"}
            </span>

            <input
              type="file"
              accept="image/*"
              onChange={handleAddScan}
              disabled={uploadingScan}
              className="hidden"
            />
          </label>
        </div>
      </section>

      {/* استلام الأصل */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            استلام الأصل
          </span>
        </div>

        <div className="p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              id="detailOriginalReceived"
              type="checkbox"
              checked={isOriginalReceived}
              onChange={(e) => {
                setIsOriginalReceived(e.target.checked);
                if (!e.target.checked) {
                  setOriginalReceivedBy("");
                }
              }}
              className="w-4 h-4 accent-[#00b867]"
            />

            <label
              htmlFor="detailOriginalReceived"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              تم استلام الأصل بعد التوزيع
            </label>
          </div>

          {isOriginalReceived && (
            <input
              type="text"
              value={originalReceivedBy}
              onChange={(e) => setOriginalReceivedBy(e.target.value)}
              placeholder="اسم الشخص الذي استلم الأصل"
              dir="rtl"
              className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />
          )}

          <button
            type="button"
            onClick={handleSaveReceipt}
            disabled={savingReceipt}
            className="h-[44px] px-6 rounded-[8px] self-start disabled:opacity-50"
            style={{
              background: "linear-gradient(to bottom,#00b867,#00522e)",
              ...F,
              fontSize: 14,
              color: "#fff",
            }}
          >
            {savingReceipt ? "جاري الحفظ..." : "حفظ التعديل"}
          </button>
        </div>
      </section>
    </div>
  );
}