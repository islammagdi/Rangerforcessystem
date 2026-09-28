import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Upload, ArrowRight, Printer } from "lucide-react";
import {
  fetchIncomingMailById,
  updateIncomingMail,
  uploadIncomingScanFile,
  addIncomingMailScan,
  addIncomingMailNote,
  getScanSignedUrl,
  markIncomingMailReceived,
  fetchIncomingMailPermissions,
  upsertIncomingMailOfficeAction,
  type IncomingMailFull,
} from "../../lib/mailArchive";
import { logActivity } from "../../lib/logActivity";
import { supabase } from "../../lib/supabase";
import { useUnsavedChanges } from "../../lib/unsavedChanges";

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

  const [permissions, setPermissions] = useState({
    isArchive: false,
    isBranchHead: false,
    editableOfficeIds: [] as string[],
  });

  const [officeActionTexts, setOfficeActionTexts] = useState<Record<string, string>>({});
  const originalOfficeActionsRef = useRef<Record<string, string>>({});
  const [savingOfficeActionId, setSavingOfficeActionId] = useState<string | null>(null);

  const [faxSummary, setFaxSummary] = useState("");
  const [savingArchive, setSavingArchive] = useState(false);
  const originalArchiveRef = useRef<string>("");

  const [branchHeadDecision, setBranchHeadDecision] = useState("");
  const [savingBranch, setSavingBranch] = useState(false);
  const originalBranchRef = useRef<string>("");

  const [newNoteText, setNewNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const [uploadingScan, setUploadingScan] = useState(false);

  const { setDirty, guardNavigation, setPerformingSensitiveOperation } = useUnsavedChanges();

  useEffect(() => {
    setPerformingSensitiveOperation(true);
    return () => {
      setPerformingSensitiveOperation(false);
    };
  }, [setPerformingSensitiveOperation]);

  const archiveDirty = faxSummary !== originalArchiveRef.current;
  const branchDirty = branchHeadDecision !== originalBranchRef.current;

  const officeActionsDirty = mail
    ? mail.offices.some(
        (o) =>
          (officeActionTexts[o.office_id] ?? "") !==
          (originalOfficeActionsRef.current[o.office_id] ?? "")
      )
    : false;

  const isDirty = archiveDirty || officeActionsDirty || branchDirty;

  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  useEffect(() => {
    return () => setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (id) {
      loadMail(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  async function loadMail(mailId: string) {
    setLoading(true);
    setError("");

    try {
      const data = await fetchIncomingMailById(mailId);
      const officeIds = data.offices.map((o) => o.office_id);

      const perms = await fetchIncomingMailPermissions(officeIds);
      setPermissions(perms);

      let finalData = data;

      if (perms.editableOfficeIds.length > 0) {
        try {
          const receivedBefore = new Set(
            data.receipts.filter((r) => r.received_at).map((r) => r.office_id)
          );

          await markIncomingMailReceived(mailId);
          finalData = await fetchIncomingMailById(mailId);

          const newlyReceived = finalData.receipts.filter(
            (r) => r.received_at && !receivedBefore.has(r.office_id)
          );

          if (newlyReceived.length > 0) {
            const { userId, userName } = await getCurrentUserInfo();

            for (const r of newlyReceived) {
              await logActivity({
                userId,
                userName,
                actionType: "UPDATE",
                action: "استلام نسخة من الفاكس الوارد",
                entity: "incoming_mail",
                details: `تم استلام الفاكس رقم ${finalData.fax_number}/${finalData.fax_year} من مكتب ${r.office_name} بواسطة ${userName}`,
              });
            }
          }
        } catch (receiveErr) {
          // مفيش داعي نوقف تحميل الصفحة لو تسجيل الاستلام فشل
        }
      }

      setMail(finalData);

      setFaxSummary(finalData.fax_summary ?? "");
      setBranchHeadDecision(finalData.branch_head_decision ?? "");

      originalArchiveRef.current = finalData.fax_summary ?? "";
      originalBranchRef.current = finalData.branch_head_decision ?? "";

      const actionsMap: Record<string, string> = {};
      finalData.officeActions.forEach((a) => {
        actionsMap[a.office_id] = a.action_text ?? "";
      });
      setOfficeActionTexts(actionsMap);
      originalOfficeActionsRef.current = actionsMap;

      const urls: Record<string, string> = {};

      await Promise.all(
        finalData.scans.map(async (scan) => {
          try {
            urls[scan.id] = await getScanSignedUrl(scan.file_path);
          } catch (err) {
            // تجاهل فشل توليد رابط صورة واحدة
          }
        })
      );

      setScanUrls(urls);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل بيانات الفاكس");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveArchiveFields() {
    if (!mail) return;

    setSavingArchive(true);
    setError("");

    try {
      const oldFaxSummary = mail.fax_summary?.trim() || "بدون ملخص";
      const newFaxSummary = faxSummary.trim() || "بدون ملخص";

      await updateIncomingMail(mail.id, {
        fax_summary: faxSummary.trim() || null,
      });

      if (oldFaxSummary !== newFaxSummary) {
        try {
          const { userId, userName } = await getCurrentUserInfo();
          await logActivity({
            userId,
            userName,
            actionType: "UPDATE",
            action: "تعديل ملخص الفاكس",
            entity: "incoming_mail",
            details: `القيمة القديمة: ${oldFaxSummary} - القيمة الجديدة: ${newFaxSummary}`,
          });
        } catch (auditError) {
          // تجاهل فشل تسجيل سجل العمليات
        }
      }

      setSuccessMsg("تم حفظ التعديلات بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);

      await loadMail(mail.id);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setSavingArchive(false);
    }
  }

  async function handleSaveOfficeAction(officeId: string) {
    if (!mail) return;

    setSavingOfficeActionId(officeId);
    setError("");

    try {
      const { userId, userName } = await getCurrentUserInfo();
      const text = officeActionTexts[officeId] ?? "";

      await upsertIncomingMailOfficeAction(mail.id, officeId, text, userId, userName);

      try {
        const officeName = mail.offices.find((o) => o.office_id === officeId)?.office_name ?? "";

        await logActivity({
          userId,
          userName,
          actionType: "UPDATE",
          action: `تحديث ما تم حياله من مكتب ${officeName}`,
          entity: "incoming_mail",
          details: text.trim() || "بدون نص",
        });
      } catch (auditError) {
        // تجاهل فشل تسجيل سجل العمليات
      }

      setSuccessMsg("تم حفظ الإجراء بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);

      await loadMail(mail.id);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حفظ الإجراء");
    } finally {
      setSavingOfficeActionId(null);
    }
  }

  async function handleSaveBranchDecision() {
    if (!mail) return;

    setSavingBranch(true);
    setError("");

    try {
      await updateIncomingMail(mail.id, {
        branch_head_decision: branchHeadDecision.trim() || null,
      });

      setSuccessMsg("تم حفظ قرار رئيس الفرع بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);

      await loadMail(mail.id);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حفظ القرار");
    } finally {
      setSavingBranch(false);
    }
  }

  async function handleAddNote() {
    if (!mail || !newNoteText.trim()) return;

    setAddingNote(true);
    setError("");

    try {
      const { userId, userName } = await getCurrentUserInfo();

      await addIncomingMailNote(mail.id, newNoteText.trim(), userId, userName);

      try {
        await logActivity({
          userId,
          userName,
          actionType: "CREATE",
          action: "إضافة ملاحظة على الفاكس الوارد",
          entity: "incoming_mail",
          details: newNoteText.trim(),
        });
      } catch (auditError) {
        // تجاهل فشل تسجيل سجل العمليات
      }

      setNewNoteText("");
      await loadMail(mail.id);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إضافة الملاحظة");
    } finally {
      setAddingNote(false);
    }
  }

  async function handleAddScan(e: React.ChangeEvent<HTMLInputElement>) {
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
      setError(err?.message || "حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploadingScan(false);
      e.target.value = "";
    }
  }

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
            ${scan.label ? `<p class="caption">${scan.label}</p>` : ""}
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
            @page { size: A4; margin: 10mm; }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; direction: rtl; }
            .print-page {
              width: 100%;
              height: 277mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              page-break-after: always;
            }
            .print-page:last-child { page-break-after: auto; }
            .print-page img { max-width: 100%; max-height: 250mm; object-fit: contain; }
            .caption { margin-top: 8px; font-size: 14px; text-align: center; color: #333; }
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
      <div className="flex items-center justify-center w-full min-h-[400px]" dir="rtl">
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

  const canEditArchiveFields = permissions.isArchive;

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
          onClick={() => guardNavigation(() => navigate("/dashboard/archive/incoming"))}
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
          style={{ background: "#dcfce7", color: "#166534", ...F, fontSize: 14 }}
        >
          {successMsg}
        </div>
      )}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span style={{ ...F, fontSize: 14, color: "#717d96" }}>تاريخ الفاكس:</span>
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

          <div className="flex items-center gap-2 sm:col-span-2">
            <span style={{ ...F, fontSize: 14, color: "#717d96" }}>المكاتب المختصة:</span>
            <div className="flex flex-wrap gap-1.5">
              {mail.offices.map((o) => (
                <span
                  key={o.office_id}
                  className="px-2 py-0.5 rounded-full"
                  style={{ ...F, fontSize: 13, background: "#f7f9fc", color: "#2d3648" }}
                >
                  {o.office_name}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ ...F, fontSize: 14, color: "#717d96" }}>تاريخ التسجيل:</span>
            <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              {formatDateTime(mail.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ ...F, fontSize: 14, color: "#717d96" }}>سجّله:</span>
            <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              {mail.created_by_name ?? "-"}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#eff0f6] flex flex-col gap-2">
          <span style={{ ...F, fontSize: 14, color: "#717d96" }}>حالة الاستلام:</span>

          <div className="flex flex-col gap-1.5">
            {mail.receipts.map((r) => (
              <div key={r.office_id} className="flex items-center gap-2">
                <span style={{ ...F, fontSize: 13, color: "#2d3648", fontWeight: 700 }}>
                  {r.office_name}:
                </span>
                {r.received_at ? (
                  <span style={{ ...F, fontSize: 13, color: "#166534" }}>
                    تم الاستلام بواسطة {r.received_by_name} في {formatDateTime(r.received_at)}
                  </span>
                ) : (
                  <span style={{ ...F, fontSize: 13, color: "#a1aebe" }}>
                    لم يتم الاستلام بعد
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>ملخص الفاكس</span>
        </div>

        <div className="p-6 flex flex-col gap-3">
          <textarea
            value={faxSummary}
            onChange={(e) => setFaxSummary(e.target.value)}
            disabled={!canEditArchiveFields}
            placeholder="اكتب ملخصًا مختصرًا لموضوع الفاكس"
            rows={3}
            dir="rtl"
            className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867] disabled:bg-[#f7f9fc] disabled:text-[#717d96]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />

          {canEditArchiveFields && (
            <button
              type="button"
              onClick={handleSaveArchiveFields}
              disabled={savingArchive || !archiveDirty}
              className="h-[44px] px-6 rounded-[8px] self-start disabled:opacity-50"
              style={{
                background: "linear-gradient(to bottom,#00b867,#00522e)",
                ...F,
                fontSize: 14,
                color: "#fff",
              }}
            >
              {savingArchive ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          )}
        </div>
      </section>

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            ما تم حياله من كل مكتب مختص
          </span>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {mail.offices.length === 0 ? (
            <span style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
              لا توجد مكاتب مختصة بهذا الفاكس
            </span>
          ) : (
            mail.offices.map((office) => {
              const canEdit = permissions.editableOfficeIds.includes(office.office_id);
              const text = officeActionTexts[office.office_id] ?? "";
              const isDirtyForOffice =
                text !== (originalOfficeActionsRef.current[office.office_id] ?? "");
              const action = mail.officeActions.find(
                (a) => a.office_id === office.office_id
              );

              return (
                <div key={office.office_id} className="flex flex-col gap-2">
                  <span style={{ ...F, fontWeight: 700, fontSize: 14, color: "#2d3648" }}>
                    {office.office_name}
                  </span>

                  <textarea
                    value={text}
                    onChange={(e) =>
                      setOfficeActionTexts((prev) => ({
                        ...prev,
                        [office.office_id]: e.target.value,
                      }))
                    }
                    disabled={!canEdit}
                    placeholder={
                      canEdit ? "اكتب ما تم اتخاذه من إجراء" : "لا يوجد إجراء مسجل بعد"
                    }
                    rows={3}
                    dir="rtl"
                    className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867] disabled:bg-[#f7f9fc] disabled:text-[#717d96]"
                    style={{ ...F, fontSize: 14, color: "#2d3648" }}
                  />

                  {action?.action_by_name && action?.action_at && (
                    <span style={{ ...F, fontSize: 12, color: "#a1aebe" }}>
                      آخر تحديث بواسطة {action.action_by_name} في{" "}
                      {formatDateTime(action.action_at)}
                    </span>
                  )}

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleSaveOfficeAction(office.office_id)}
                      disabled={savingOfficeActionId === office.office_id || !isDirtyForOffice}
                      className="h-[40px] px-5 rounded-[8px] self-start disabled:opacity-50"
                      style={{
                        background: "linear-gradient(to bottom,#00b867,#00522e)",
                        ...F,
                        fontSize: 13,
                        color: "#fff",
                      }}
                    >
                      {savingOfficeActionId === office.office_id
                        ? "جاري الحفظ..."
                        : "حفظ الإجراء"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>قرار رئيس الفرع</span>
        </div>

        <div className="p-6 flex flex-col gap-3">
          <textarea
            value={branchHeadDecision}
            onChange={(e) => setBranchHeadDecision(e.target.value)}
            disabled={!permissions.isBranchHead}
            placeholder={
              permissions.isBranchHead ? "اكتب قرار رئيس الفرع" : "لم يصدر قرار بعد"
            }
            rows={3}
            dir="rtl"
            className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867] disabled:bg-[#f7f9fc] disabled:text-[#717d96]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />

          {mail.branch_head_decision_by_name && mail.branch_head_decision_at && (
            <span style={{ ...F, fontSize: 12, color: "#a1aebe" }}>
              آخر تحديث بواسطة {mail.branch_head_decision_by_name} في{" "}
              {formatDateTime(mail.branch_head_decision_at)}
            </span>
          )}

          {permissions.isBranchHead && (
            <button
              type="button"
              onClick={handleSaveBranchDecision}
              disabled={savingBranch || !branchDirty}
              className="h-[44px] px-6 rounded-[8px] self-start disabled:opacity-50"
              style={{
                background: "linear-gradient(to bottom,#00b867,#00522e)",
                ...F,
                fontSize: 14,
                color: "#fff",
              }}
            >
              {savingBranch ? "جاري الحفظ..." : "حفظ القرار"}
            </button>
          )}
        </div>
      </section>

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>الملاحظات</span>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {mail.notes.length === 0 ? (
            <span style={{ ...F, fontSize: 14, color: "#a1aebe" }}>لا توجد ملاحظات بعد</span>
          ) : (
            <div className="flex flex-col gap-3">
              {mail.notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-[10px] border border-[#eff0f6] bg-[#f7f9fc] p-3 flex flex-col gap-1"
                >
                  <p style={{ ...F, fontSize: 14, color: "#2d3648" }}>{note.note_text}</p>
                  <span style={{ ...F, fontSize: 12, color: "#a1aebe" }}>
                    {note.created_by_name ?? "غير معروف"} — {formatDateTime(note.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="اكتب ملاحظة جديدة — هتتسجل باسمك ووقت الإضافة"
              rows={2}
              dir="rtl"
              className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />

            <button
              type="button"
              onClick={handleAddNote}
              disabled={addingNote || !newNoteText.trim()}
              className="h-[40px] px-5 rounded-[8px] self-start disabled:opacity-50"
              style={{
                background: "linear-gradient(to bottom,#00b867,#00522e)",
                ...F,
                fontSize: 13,
                color: "#fff",
              }}
            >
              {addingNote ? "جاري الإضافة..." : "إضافة ملاحظة"}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0] flex items-center justify-between">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>الصور الضوئية للفاكس</span>

          <button
            type="button"
            onClick={handlePrintScans}
            disabled={mail.scans.length === 0}
            className="flex items-center gap-1.5 h-[36px] px-4 rounded-[8px] disabled:opacity-40"
            style={{ background: "#DCF4DF" }}
          >
            <Printer size={15} color="#2d3648" />
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
              طباعة / تحميل كل المرفقات
            </span>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {mail.scans.length === 0 ? (
            <span style={{ ...F, fontSize: 14, color: "#a1aebe" }}>لا توجد صور مرفوعة</span>
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

          {canEditArchiveFields && (
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
          )}
        </div>
      </section>
    </div>
  );
}