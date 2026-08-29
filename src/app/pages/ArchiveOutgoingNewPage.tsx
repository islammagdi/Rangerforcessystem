import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Trash2, Upload, X } from "lucide-react";

import { supabase } from "../../lib/supabase";
import {
  fetchMailOffices,
  createOutgoingMail,
  uploadOutgoingScanFile,
  addOutgoingMailScan,
  type MailOffice,
} from "../../lib/mailArchive";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

/* =========================================================
   Types محلية للفورم
========================================================= */

interface RecipientRow {
  name: string;
  entity: string;
}

interface PendingScan {
  file: File;
  label: string;
  previewUrl: string;
}

/* =========================================================
   Page
========================================================= */

export function ArchiveOutgoingNewPage() {
  const navigate = useNavigate();

  const [offices, setOffices] = useState<MailOffice[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(true);

  const [faxDate, setFaxDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [officeId, setOfficeId] = useState("");
  const [faxSummary, setFaxSummary] = useState("");

  const [destinations, setDestinations] = useState<string[]>([""]);
  const [notes, setNotes] = useState<string[]>([""]);
  const [recipients, setRecipients] = useState<RecipientRow[]>([
    { name: "", entity: "" },
  ]);

  const [pendingScans, setPendingScans] = useState<PendingScan[]>([]);

  const [isOriginalReceived, setIsOriginalReceived] = useState(false);
  const [originalReceivedBy, setOriginalReceivedBy] = useState("");

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

  /* =======================================================
     جهات الإرسال (متعددة)
  ======================================================= */

  function addDestinationRow() {
    setDestinations((prev) => [...prev, ""]);
  }

  function removeDestinationRow(index: number) {
    setDestinations((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDestination(index: number, value: string) {
    setDestinations((prev) =>
      prev.map((d, i) => (i === index ? value : d))
    );
  }

  /* =======================================================
     الملاحظات (متعددة)
  ======================================================= */

  function addNoteRow() {
    setNotes((prev) => [...prev, ""]);
  }

  function removeNoteRow(index: number) {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateNote(index: number, value: string) {
    setNotes((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  /* =======================================================
     المستلمين (متعددين)
  ======================================================= */

  function addRecipientRow() {
    setRecipients((prev) => [...prev, { name: "", entity: "" }]);
  }

  function removeRecipientRow(index: number) {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRecipient(
    index: number,
    field: "name" | "entity",
    value: string
  ) {
    setRecipients((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    );
  }

  /* =======================================================
     الصور (متعددة)
  ======================================================= */

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

  /* =======================================================
     Validation
  ======================================================= */

  function validate(): string | null {
    if (!faxDate) {
      return "تاريخ الفاكس مطلوب";
    }

    if (!officeId) {
      return "مكتب الإصدار مطلوب";
    }

    const validDestinations = destinations.filter((d) => d.trim());

    if (validDestinations.length === 0) {
      return "يجب إدخال جهة واحدة على الأقل صادر لها الفاكس";
    }

    if (isOriginalReceived && !originalReceivedBy.trim()) {
      return "يجب إدخال اسم الشخص الذي استلم الأصل";
    }

    return null;
  }

  /* =======================================================
     Submit
  ======================================================= */

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

       const faxId = await createOutgoingMail({
        fax_date: faxDate,
        issuing_office_id: officeId,
        fax_summary: faxSummary.trim() || null,
        destinations: destinations.filter((d) => d.trim()),
        notes: notes.filter((n) => n.trim()),
        recipients: recipients
          .filter((r) => r.name.trim())
          .map((r) => ({
            name: r.name,
            entity: r.entity || null,
          })),
        is_original_received: isOriginalReceived,
        original_received_by: isOriginalReceived
          ? originalReceivedBy.trim()
          : null,
        created_by: user?.id ?? null,
        created_by_name: createdByName,
      });

      // رفع الصور (لو موجودة) بعد إنشاء الفاكس
      for (const scan of pendingScans) {
        const filePath = await uploadOutgoingScanFile(
          faxId,
          scan.file
        );

        await addOutgoingMailScan(
          faxId,
          filePath,
          scan.label.trim() || null
        );
      }

      navigate(`/dashboard/archive/outgoing/${faxId}`);
    } catch (err: any) {
      console.error("Create outgoing mail error:", err);
      setError(
        err?.message || "حدث خطأ أثناء حفظ الفاكس"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     Render
  ======================================================= */

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
        إضافة فاكس صادر جديد
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
        {/* التاريخ والمكتب */}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              تاريخ الفاكس
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
              مكتب الإصدار
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

        <div className="w-full h-px bg-[#eff0f6]" />

        {/* جهات الإرسال */}

        {/* جهات الإرسال */}

        <div className="flex flex-col gap-3">
          <label
            style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
          >
            جهة/جهات الصادر لها الفاكس
          </label>

          {destinations.map((dest, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={dest}
                onChange={(e) => updateDestination(index, e.target.value)}
                placeholder="اكتب اسم الجهة"
                dir="rtl"
                className="flex-1 h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
                style={{ ...F, fontSize: 14, color: "#2d3648" }}
              />

              {destinations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDestinationRow(index)}
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
                  style={{ background: "#fce8f1" }}
                >
                  <Trash2 size={15} color="#e3282c" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addDestinationRow}
            className="flex items-center gap-1.5 self-start"
            style={{ ...F, fontSize: 13, color: "#00522e" }}
          >
            <Plus size={14} />
            إضافة جهة أخرى
          </button>
        </div>

        <div className="w-full h-px bg-[#eff0f6]" />

        {/* المستلمين */}

        <div className="flex flex-col gap-3">
          <label
            style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
          >
            الأشخاص المستلمين للفاكس
          </label>

          {recipients.map((recipient, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={recipient.name}
                onChange={(e) =>
                  updateRecipient(index, "name", e.target.value)
                }
                placeholder="اسم الشخص"
                dir="rtl"
                className="flex-1 h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
                style={{ ...F, fontSize: 14, color: "#2d3648" }}
              />

              <input
                type="text"
                value={recipient.entity}
                onChange={(e) =>
                  updateRecipient(index, "entity", e.target.value)
                }
                placeholder="الجهة (اختياري)"
                dir="rtl"
                className="flex-1 h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
                style={{ ...F, fontSize: 14, color: "#2d3648" }}
              />

              {recipients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRecipientRow(index)}
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
                  style={{ background: "#fce8f1" }}
                >
                  <Trash2 size={15} color="#e3282c" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addRecipientRow}
            className="flex items-center gap-1.5 self-start"
            style={{ ...F, fontSize: 13, color: "#00522e" }}
          >
            <Plus size={14} />
            إضافة مستلم آخر
          </button>
        </div>

        <div className="w-full h-px bg-[#eff0f6]" />

        {/* الملاحظات */}

        <div className="flex flex-col gap-3">
          <label
            style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
          >
          ملاحظات
          </label>

          {notes.map((note, index) => (
            <div key={index} className="flex items-center gap-2">
              <textarea
                value={note}
                onChange={(e) => updateNote(index, e.target.value)}
                placeholder="اكتب ملاحظات  "
                rows={2}
                dir="rtl"
                className="flex-1 rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867]"
                style={{ ...F, fontSize: 14, color: "#2d3648" }}
              />

              {notes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeNoteRow(index)}
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
                  style={{ background: "#fce8f1" }}
                >
                  <Trash2 size={15} color="#e3282c" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addNoteRow}
            className="flex items-center gap-1.5 self-start"
            style={{ ...F, fontSize: 13, color: "#00522e" }}
          >
            <Plus size={14} />
            إضافة ملاحظة أخرى
          </button>
        </div>

        <div className="w-full h-px bg-[#eff0f6]" />

        {/* الصور الضوئية */}

        <div className="flex flex-col gap-3">
          <label
            style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
          >
            الصور الضوئية للفاكس (وش / ضهر / ملحقات)
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
                    placeholder="تسمية (وش / ضهر / ملحق 1...)"
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

        <div className="w-full h-px bg-[#eff0f6]" />

        {/* استلام الأصل */}

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              id="originalReceived"
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
              htmlFor="originalReceived"
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
            onClick={() => navigate("/dashboard/archive/outgoing")}
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