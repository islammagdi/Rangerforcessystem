import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Upload, X } from "lucide-react";
	import { todayLocalIso } from "../../lib/dates";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/logActivity";
import { useUnsavedChanges } from "../../lib/unsavedChanges";
import { usePermissions } from "../../lib/usePermissions";
import {
  fetchMailOffices,
  createIncomingMail,
  uploadIncomingScanFile,
  addIncomingMailScan,
  notifyOfficesAboutNewIncomingMail,
  type MailOffice,
} from "../../lib/mailArchive";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

interface PendingScan {
  file: File;
  label: string;
  previewUrl: string;
}

export function ArchiveIncomingNewPage() {
  const navigate = useNavigate();

  const [offices, setOffices] = useState<MailOffice[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(true);

  const { loading: checkingAccess, hasPermission } = usePermissions();
const canCreate = hasPermission("archive_incoming:create");

  const [faxDate, setFaxDate] = useState(
    todayLocalIso()
  );

  const [sourceEntity, setSourceEntity] = useState("");
  const [selectedOfficeIds, setSelectedOfficeIds] = useState<string[]>([]);

  const [faxSummary, setFaxSummary] = useState("");
  const [initialNote, setInitialNote] = useState("");

  const [pendingScans, setPendingScans] = useState<PendingScan[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { setDirty, guardNavigation, setPerformingSensitiveOperation } = useUnsavedChanges();

  useEffect(() => {
    setPerformingSensitiveOperation(true);
    return () => {
      setPerformingSensitiveOperation(false);
    };
  }, [setPerformingSensitiveOperation]);

  const isDirty = useMemo(() => {
    return (
      sourceEntity.trim() !== "" ||
      selectedOfficeIds.length > 0 ||
      faxSummary.trim() !== "" ||
      initialNote.trim() !== "" ||
      pendingScans.length > 0
    );
  }, [sourceEntity, selectedOfficeIds.length, faxSummary, initialNote, pendingScans.length]);

  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  useEffect(() => {
    return () => setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadOffices();
  }, []);



  async function loadOffices() {
    try {
      setLoadingOffices(true);
      const data = await fetchMailOffices();
      setOffices(data);
    } catch (err: any) {
      setError("حدث خطأ أثناء تحميل قائمة المكاتب");
    } finally {
      setLoadingOffices(false);
    }
  }

  function toggleOffice(officeId: string) {
    setSelectedOfficeIds((prev) =>
      prev.includes(officeId) ? prev.filter((id) => id !== officeId) : [...prev, officeId]
    );
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newScans: PendingScan[] = Array.from(files).map((file) => ({
      file,
      label: "",
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingScans((prev) => [...prev, ...newScans]);

    e.target.value = "";
  }

  function updateScanLabel(index: number, label: string) {
    setPendingScans((prev) =>
      prev.map((s, i) => (i === index ? { ...s, label } : s))
    );
  }

  function removeScan(index: number) {
    setPendingScans((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function validate(): string | null {
    if (!faxDate) {
      return "تاريخ الفاكس مطلوب";
    }

    if (!sourceEntity.trim()) {
      return "الجهة الواردة منها الفاكس مطلوبة";
    }

    if (selectedOfficeIds.length === 0) {
      return "يجب اختيار مكتب واحد على الأقل";
    }

    if (!faxSummary.trim()) {
      return "ملخص الفاكس مطلوب";
    }

    if (pendingScans.length === 0) {
      return "يجب رفع صورة ضوئية واحدة على الأقل للفاكس";
    }

    return null;
  }

  async function handleSubmit() {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let createdByName = "غير معروف";

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        createdByName = profile?.username ?? "غير معروف";
      }

      const faxSummaryTrimmed = faxSummary.trim();

      const newMail = await createIncomingMail({
        fax_date: faxDate,
        source_entity: sourceEntity.trim(),
        office_ids: selectedOfficeIds,
        fax_summary: faxSummaryTrimmed,
        initial_note: initialNote.trim() || null,
        created_by: user?.id ?? null,
        created_by_name: createdByName,
      });

      const faxId = newMail.id;
      const faxDisplayNumber = `${newMail.fax_number}/${newMail.fax_year}`;

      for (const scan of pendingScans) {
        const filePath = await uploadIncomingScanFile(faxId, scan.file);

        await addIncomingMailScan(faxId, filePath, scan.label.trim() || null);
      }

      try {
        await logActivity({
          userId: user?.id ?? null,
          userName: createdByName,
          actionType: "CREATE",
          action: `تم اضافة فاكس وارد رقم ${faxDisplayNumber}`,
          entity: "incoming_mail",
          details: `ملخص الفاكس: ${faxSummaryTrimmed}`,
        });
      } catch (auditError) {
        // تجاهل فشل سجل العمليات
      }

      try {
        await notifyOfficesAboutNewIncomingMail({
          officeIds: selectedOfficeIds,
          faxId,
          faxDisplayNumber,
          summary: faxSummaryTrimmed,
          createdBy: user?.id ?? null,
          createdByName,
        });
      } catch (notifyError) {
        // مفيش داعي نوقف العملية لو الإشعار فشل
      }

      setDirty(false);

      navigate(`/dashboard/archive/incoming/${faxId}`);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حفظ الفاكس");
    } finally {
      setSaving(false);
    }
  }

  if (checkingAccess) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <span style={{ ...F, fontSize: 15, color: "#717d96" }}>
          جاري التحقق من الصلاحيات...
        </span>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-24 w-full"
        dir="rtl"
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "#fef2f2" }}
        >
          <X size={26} color="#991b1b" />
        </div>

        <p style={{ ...F, fontWeight: 700, fontSize: 18, color: "#2d3648" }}>
          غير مسموح لك بالدخول لهذه الصفحة
        </p>

        <button
          type="button"
          onClick={() => navigate("/dashboard/archive/incoming")}
          className="h-[42px] px-5 rounded-[8px] border border-[#e2e7f0] mt-2"
          style={{ ...F, fontSize: 14, color: "#475569" }}
        >
          الرجوع لأرشيف الوارد
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <h1
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(22px,4vw,32px)",
          color: "#2d3648",
        }}
      >
        إضافة فاكس وارد جديد
      </h1>

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



      <div className="bg-white rounded-[20px] border border-[#eff0f6] p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              تاريخ الفاكس (تاريخ الورود)
            </label>

            <input
              type="date"
              value={faxDate}
              onChange={(e) => setFaxDate(e.target.value)}
              className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 15, color: "#2d3648" }}
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              الجهة الواردة منها الفاكس
            </label>

            <input
              type="text"
              value={sourceEntity}
              onChange={(e) => setSourceEntity(e.target.value)}
              placeholder="اكتب اسم الجهة"
              dir="rtl"
              className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 15, color: "#2d3648" }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
            المكاتب المختصة بالفاكس (يمكن اختيار أكثر من مكتب)
          </label>

          {loadingOffices ? (
            <span style={{ ...F, fontSize: 13, color: "#a1aebe" }}>
              جاري تحميل المكاتب...
            </span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {offices.map((office) => {
                const checked = selectedOfficeIds.includes(office.id);

                return (
                  <label
                    key={office.id}
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
                      onChange={() => toggleOffice(office.id)}
                      className="w-4 h-4 accent-[#00B867]"
                    />
                    <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                      {office.name}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>
            ملخص الفاكس <span style={{ color: "#e3282c" }}>*</span>
          </label>

          <textarea
            value={faxSummary}
            onChange={(e) => setFaxSummary(e.target.value)}
            placeholder="اكتب ملخصًا مختصرًا لموضوع الفاكس"
            rows={2}
            dir="rtl"
            className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>
            ملاحظة أولية (اختياري)
          </label>

          <textarea
            value={initialNote}
            onChange={(e) => setInitialNote(e.target.value)}
            placeholder="أي ملاحظة تحب تسجّلها الآن — هتظهر باسمك ووقت التسجيل في سجل الملاحظات"
            rows={2}
            dir="rtl"
            className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />
        </div>

        <div className="w-full h-px bg-[#eff0f6]" />

        <div className="flex flex-col gap-3">
          <label style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>
            الصور الضوئية للفاكس <span style={{ color: "#e3282c" }}>*</span>
          </label>

          <label
            className="flex items-center justify-center gap-2 h-[80px] rounded-[10px] border-2 border-dashed cursor-pointer"
            style={{ borderColor: "#cbd2e0" }}
          >
            <Upload size={20} className="text-[#415844]" />
            <span style={{ ...F, fontSize: 14, color: "#4a5468" }}>
              اضغط هنا لاختيار صورة أو أكثر (مطلوب)
            </span>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {pendingScans.length > 0 && (
            <div className="flex flex-col gap-2">
              {pendingScans.map((scan, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 border border-[#e2e7f0] rounded-[8px] p-2"
                >
                  <img
                    src={scan.previewUrl}
                    alt=""
                    className="w-14 h-14 object-cover rounded-[6px] shrink-0"
                  />

                  <input
                    type="text"
                    value={scan.label}
                    onChange={(e) => updateScanLabel(index, e.target.value)}
                    placeholder="تسمية (اختياري)"
                    dir="rtl"
                    className="flex-1 h-[38px] rounded-[6px] border border-[#e2e7f0] px-2 text-right outline-none"
                    style={{ ...F, fontSize: 13, color: "#2d3648" }}
                  />

                  <button
                    type="button"
                    onClick={() => removeScan(index)}
                    className="w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0"
                    style={{ background: "#fce8f1" }}
                  >
                    <X size={14} color="#e3282c" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || checkingAccess || !canCreate}
            className="h-[48px] px-6 rounded-[8px] disabled:opacity-50"
            style={{
              background: "linear-gradient(to bottom,#00b867,#00522e)",
              ...F,
              fontSize: 15,
              color: "#fff",
            }}
          >
            {saving ? "جاري الحفظ..." : "حفظ الفاكس"}
          </button>

          <button
            type="button"
            onClick={() =>
              guardNavigation(() => navigate("/dashboard/archive/incoming"))
            }
            disabled={saving}
            className="h-[48px] px-6 rounded-[8px] border border-[#cbd5e1]"
            style={{ ...F, fontSize: 15, color: "#475569" }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}