import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Upload, X } from "lucide-react";

import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/logActivity";
import {
  fetchMailOffices,
  createIncomingMail,
  uploadIncomingScanFile,
  addIncomingMailScan,
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

  const [faxDate, setFaxDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [sourceEntity, setSourceEntity] = useState("");
  const [officeId, setOfficeId] = useState("");

  const [isCopyDistributed, setIsCopyDistributed] = useState(false);
  const [distributedToName, setDistributedToName] = useState("");

  const [faxSummary, setFaxSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [branchHeadDecision, setBranchHeadDecision] = useState("");

  const [pendingScans, setPendingScans] = useState<PendingScan[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOffices();
  }, []);

  async function loadOffices() {
    try {
      setLoadingOffices(true);
      const data = await fetchMailOffices();
      setOffices(data);
    } catch (err: any) {
      console.error("Load offices error:", err);
      setError("حدث خطأ أثناء تحميل قائمة المكاتب");
    } finally {
      setLoadingOffices(false);
    }
  }

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
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

    if (!officeId) {
      return "المكتب المختص مطلوب";
    }

    if (isCopyDistributed && !distributedToName.trim()) {
      return "يجب إدخال اسم المختص الذي استلم النسخة";
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
        receiving_office_id: officeId,
        fax_summary: faxSummaryTrimmed || null,
        notes: notes.trim() || null,
        is_copy_distributed: isCopyDistributed,
        distributed_to_name: isCopyDistributed
          ? distributedToName.trim()
          : null,
        action_taken: actionTaken.trim() || null,
        branch_head_decision: branchHeadDecision.trim() || null,
        created_by: user?.id ?? null,
        created_by_name: createdByName,
      });

      const faxId = newMail.id;
      const faxDisplayNumber = `${newMail.fax_number}/${newMail.fax_year}`;

      for (const scan of pendingScans) {
        const filePath = await uploadIncomingScanFile(
          faxId,
          scan.file
        );

        await addIncomingMailScan(
          faxId,
          filePath,
          scan.label.trim() || null
        );
      }

      // ═════════════════════════════════════════════════════════════════════
      // Audit Log
      // ═════════════════════════════════════════════════════════════════════

      try {
        await logActivity({
          userId: user?.id ?? null,
          userName: createdByName,
          actionType: "CREATE",
          action: `تم اضافة فاكس وارد رقم ${faxDisplayNumber}`,
          entity: "incoming_mail",
          details: `ملخص الفاكس: ${faxSummaryTrimmed || "بدون ملخص"}`,
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      navigate(`/dashboard/archive/incoming/${faxId}`);
    } catch (err: any) {
      console.error("Create incoming mail error:", err);
      setError(err?.message || "حدث خطأ أثناء حفظ الفاكس");
    } finally {
      setSaving(false);
    }
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
        {/* التاريخ والجهة الواردة منها */}

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

        {/* المكتب المختص */}

        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
            المكتب المختص بالفاكس
          </label>

          <select
            value={officeId}
            onChange={(e) => setOfficeId(e.target.value)}
            dir="rtl"
            disabled={loadingOffices}
            className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
            style={{ ...F, fontSize: 15, color: "#2d3648" }}
          >
            <option value="">اختر المكتب</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
          >
            ملخص الفاكس (اختياري)
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
          <label
            style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
          >
            ملاحظات (اختياري)
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب أي ملاحظات إضافية"
            rows={2}
            dir="rtl"
            className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />
        </div>

        <div className="w-full h-px bg-[#eff0f6]" />

        {/* توزيع نسخة على المختص */}

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              id="copyDistributed"
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
              htmlFor="copyDistributed"
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

        <div className="w-full h-px bg-[#eff0f6]" />

        {/* ما تم حياله من المختص */}

        <div className="flex flex-col gap-1.5">
          <label
            style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
          >
            ما تم حياله من المختص (اختياري)
          </label>

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

        {/* قرار رئيس الفرع */}

        <div className="flex flex-col gap-1.5">
          <label
            style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
          >
            قرار رئيس الفرع (اختياري)
          </label>

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

        <div className="w-full h-px bg-[#eff0f6]" />

        {/* الصور الضوئية */}

        <div className="flex flex-col gap-3">
          <label
            style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
          >
            الصور الضوئية للفاكس
          </label>

          <label
            className="flex items-center justify-center gap-2 h-[80px] rounded-[10px] border-2 border-dashed cursor-pointer"
            style={{ borderColor: "#cbd2e0" }}
          >
            <Upload size={20} className="text-[#415844]" />
            <span style={{ ...F, fontSize: 14, color: "#4a5468" }}>
              اضغط هنا لاختيار صورة أو أكثر
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
                    onChange={(e) =>
                      updateScanLabel(index, e.target.value)
                    }
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

        {/* أزرار الحفظ */}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
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
            onClick={() => navigate("/dashboard/archive/incoming")}
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