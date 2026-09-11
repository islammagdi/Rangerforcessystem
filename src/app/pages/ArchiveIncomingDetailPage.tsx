import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Upload, ArrowRight, Printer } from "lucide-react";
import {
  fetchIncomingMailById,
  updateIncomingMail,
  uploadIncomingScanFile,
  addIncomingMailScan,
  getScanSignedUrl,
  type IncomingMailFull,
} from "../../lib/mailArchive";
import { logActivity } from "../../lib/logActivity";
import { supabase } from "../../lib/supabase";

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

export function ArchiveIncomingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mail, setMail] = useState<IncomingMailFull | null>(null);
  const [scanUrls, setScanUrls] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // حقول قابلة للتعديل
   // حقول قابلة للتعديل
  const [faxSummary, setFaxSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [isCopyDistributed, setIsCopyDistributed] = useState(false);
  const [distributedToName, setDistributedToName] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [branchHeadDecision, setBranchHeadDecision] = useState("");

  const [saving, setSaving] = useState(false);
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
         const data = await fetchIncomingMailById(mailId);
      setMail(data);

      setFaxSummary(data.fax_summary ?? "");
      setNotes(data.notes ?? "");
      setIsCopyDistributed(data.is_copy_distributed);
      setDistributedToName(data.distributed_to_name ?? "");
      setActionTaken(data.action_taken ?? "");
      setBranchHeadDecision(data.branch_head_decision ?? "");



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

  // نص وصفي موحّد لحالة توزيع النسخة، يُستخدم في تسجيل التعديل
  function describeDistributionState(
    distributed: boolean,
    name: string
  ): string {
    if (!distributed) {
      return "لم يتم التوزيع";
    }

    return `تم التوزيع على: ${name || "غير محدد"}`;
  }

  function validate(): string | null {
    if (isCopyDistributed && !distributedToName.trim()) {
      return "يجب إدخال اسم المختص الذي استلم النسخة";
    }

    return null;
  }

  async function handleSave() {
    if (!mail) return;

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      // ═══════════════════════════════════════════════════════════════════
      // التقاط القيم القديمة قبل الحفظ، عشان نقدر نسجل الفرق بعد كده
      // ═══════════════════════════════════════════════════════════════════

      const oldFaxSummary = mail.fax_summary?.trim() || "بدون ملخص";
      const newFaxSummary = faxSummary.trim() || "بدون ملخص";

      const oldNotes = mail.notes?.trim() || "بدون ملاحظات";
      const newNotes = notes.trim() || "بدون ملاحظات";

      const oldDistributionState = describeDistributionState(
        mail.is_copy_distributed,
        mail.distributed_to_name ?? ""
      );
      const newDistributionState = describeDistributionState(
        isCopyDistributed,
        distributedToName.trim()
      );

      const oldActionTaken = mail.action_taken?.trim() || "بدون إجراء مسجل";
      const newActionTaken = actionTaken.trim() || "بدون إجراء مسجل";

      const oldBranchDecision =
        mail.branch_head_decision?.trim() || "بدون قرار مسجل";
      const newBranchDecision =
        branchHeadDecision.trim() || "بدون قرار مسجل";

      await updateIncomingMail(mail.id, {
        fax_summary: faxSummary.trim() || null,
        notes: notes.trim() || null,
        is_copy_distributed: isCopyDistributed,
        distributed_to_name: isCopyDistributed
          ? distributedToName.trim()
          : null,
        action_taken: actionTaken.trim() || null,
        branch_head_decision: branchHeadDecision.trim() || null,
      });

      // ═══════════════════════════════════════════════════════════════════
      // Audit Log — سطر منفصل لكل حقل اتغيّر فعليًا
      // ═══════════════════════════════════════════════════════════════════

      try {
        const { userId, userName } = await getCurrentUserInfo();

        const changes: { action: string; details: string }[] = [];

        if (oldFaxSummary !== newFaxSummary) {
          changes.push({
            action: "تعديل ملخص الفاكس",
            details: `القيمة القديمة: ${oldFaxSummary} - القيمة الجديدة: ${newFaxSummary}`,
          });
        }

        if (oldNotes !== newNotes) {
          changes.push({
            action: "تعديل الملاحظات",
            details: `القيمة القديمة: ${oldNotes} - القيمة الجديدة: ${newNotes}`,
          });
        }

        if (oldDistributionState !== newDistributionState) {
          changes.push({
            action: "تعديل توزيع النسخة على المختص",
            details: `القيمة القديمة: ${oldDistributionState} - القيمة الجديدة: ${newDistributionState}`,
          });
        }

        if (oldActionTaken !== newActionTaken) {
          changes.push({
            action: "تعديل ما تم حياله من المختص",
            details: `القيمة القديمة: ${oldActionTaken} - القيمة الجديدة: ${newActionTaken}`,
          });
        }

        if (oldBranchDecision !== newBranchDecision) {
          changes.push({
            action: "تعديل قرار رئيس الفرع",
            details: `القيمة القديمة: ${oldBranchDecision} - القيمة الجديدة: ${newBranchDecision}`,
          });
        }

        for (const change of changes) {
          await logActivity({
            userId,
            userName,
            actionType: "UPDATE",
            action: change.action,
            entity: "incoming_mail",
            details: change.details,
          });
        }
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      setSuccessMsg("تم حفظ التعديلات بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);

      await loadMail(mail.id);
    } catch (err: any) {
      console.error("Update mail error:", err);
      setError(err?.message || "حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddScan(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!mail) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingScan(true);
    setError("");

    try {
      const filePath = await uploadIncomingScanFile(mail.id, file);
      await addIncomingMailScan(mail.id, filePath, null);

      try {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "CREATE",
          action: "رفع الصور الضوئية للفاكس",
          entity: "incoming_mail",
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
          <title>مرفقات فاكس وارد رقم ${mail.fax_number}/${mail.fax_year}</title>

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
          onClick={() => navigate("/dashboard/archive/incoming")}
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
          فاكس وارد رقم {mail.fax_number}/{mail.fax_year}
        </h1>

        <button
          type="button"
          onClick={() => navigate("/dashboard/archive/incoming")}
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
              الجهة الواردة منها:
            </span>
            <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              {mail.source_entity}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ ...F, fontSize: 14, color: "#717d96" }}>
              المكتب المختص:
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

        <div className="p-6">
          <textarea
            value={faxSummary}
            onChange={(e) => setFaxSummary(e.target.value)}
            placeholder="اكتب ملخصًا مختصرًا لموضوع الفاكس"
            rows={3}
            dir="rtl"
            className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />
        </div>
      </section>

      {/* الملاحظات */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            ملاحظات
          </span>
        </div>

        <div className="p-6">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب أي ملاحظات إضافية"
            rows={3}
            dir="rtl"
            className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />
        </div>
      </section>

      {/* توزيع النسخة على المختص */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            توزيع نسخة على المختص
          </span>
        </div>

        <div className="p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              id="copyDistributedDetail"
              type="checkbox"
              checked={isCopyDistributed}
              onChange={(e) => {
                setIsCopyDistributed(e.target.checked);
                if (!e.target.checked) {
                  setDistributedToName("");
                }
              }}
              className="w-4 h-4 accent-[#00b867]"
            />

            <label
              htmlFor="copyDistributedDetail"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              تم توزيع نسخة على المختص
            </label>
          </div>

          {isCopyDistributed && (
            <input
              type="text"
              value={distributedToName}
              onChange={(e) => setDistributedToName(e.target.value)}
              placeholder="اسم المختص الذي استلم النسخة"
              dir="rtl"
              className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />
          )}
        </div>
      </section>

      {/* ما تم حياله من المختص */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            ما تم حياله من المختص
          </span>
        </div>

        <div className="p-6">
          <textarea
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            placeholder="اكتب ما تم اتخاذه من إجراء"
            rows={3}
            dir="rtl"
            className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />
        </div>
      </section>

      {/* قرار رئيس الفرع */}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            قرار رئيس الفرع
          </span>
        </div>

        <div className="p-6">
          <textarea
            value={branchHeadDecision}
            onChange={(e) => setBranchHeadDecision(e.target.value)}
            placeholder="اكتب قرار رئيس الفرع"
            rows={3}
            dir="rtl"
            className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />
        </div>
      </section>

      {/* زر حفظ التعديلات (للحقول الثلاثة أعلاه) */}

      <div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-[48px] px-6 rounded-[8px] disabled:opacity-50"
          style={{
            background: "linear-gradient(to bottom,#00b867,#00522e)",
            ...F,
            fontSize: 15,
            color: "#fff",
          }}
        >
          {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
        </button>
      </div>
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
    </div>
  );
}