import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowRight, Plus, Trash2, Upload, Printer, FileText, Download, Check } from "lucide-react";
import logoImg from "../../assets/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";
import { usePermissions } from "../../lib/usePermissions";
import { RELIGIONS, EDUCATION_STAGES } from "../../lib/socialConstants";
import {
  fetchMaritalStatuses,
  fetchAllRankOptions,
  fetchAllUnitOptions,
  fetchAllGovernorates,
  fetchDistrictsByGovernorate,
  calculateServiceDuration,
  type MaritalStatus,
  type RankOption,
  type UnitOption,
  type Governorate,
  type District,
} from "../../lib/socialRecords";
import {
  MARTYRDOM_TYPES,
  ENTITLEMENT_TYPES,
  ENTITLEMENT_STATUSES,
  FOLLOWUP_TYPES,
  fetchMartyrById,
  fetchAllJobOptions,
  updateMartyr,
  deleteMartyr,
  uploadMartyrPhoto,
  getMartyrPhotoSignedUrl,
  fetchHeirs,
  addHeir,
  deleteHeir,
  fetchEntitlements,
  addEntitlement,
  updateEntitlement,
  deleteEntitlement,
  fetchHonors,
  addHonor,
  deleteHonor,
  fetchFollowups,
  addFollowup,
  updateFollowup,
  deleteFollowup,
  fetchMartyrDocuments,
  uploadMartyrDocument,
  getMartyrDocumentSignedUrl,
  deleteMartyrDocument,
  fetchMartyrUnitHistory,
  addMartyrUnitHistory,
  deleteMartyrUnitHistory,
  fetchMartyrPromotions,
  addMartyrPromotion,
  deleteMartyrPromotion,
  type MartyrRecord,
  type JobOption,
  type MartyrHeir,
  type MartyrEntitlement,
  type MartyrHonor,
  type MartyrFollowup,
  type MartyrDocument,
  type MartyrUnitHistoryRow,
  type MartyrPromotion,
} from "../../lib/martyrsRecords";
import { ar, buildPrintHtml, printHtml, val } from "../../lib/martyrsPrint";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

const inputClass =
  "h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] disabled:bg-[#f7f9fc] disabled:text-[#717d96] bg-white";

const addBtnStyle: React.CSSProperties = { background: "#DCF4DF", ...F, fontSize: 14, color: "#2d3648" };

const today = () => new Date().toISOString().slice(0, 10);

/* =========================================================
   مكونات صغيرة مشتركة
========================================================= */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#e2e7f0]">
        <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>{title}</span>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label style={{ ...F, fontSize: 12, color: "#717d96" }}>{label}</label>
      {children}
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-[8px] py-4 text-center" style={{ background: "#f7f9fc" }}>
      <span style={{ ...F, fontSize: 13, color: "#a1aebe" }}>{text}</span>
    </div>
  );
}

function DataTable({ heads, withActions, children }: { heads: string[]; withActions: boolean; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {heads.map((h) => (
              <th key={h} className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                <span style={{ ...F, fontSize: 12, color: "#717d96" }}>{h}</span>
              </th>
            ))}
            {withActions && <th className="px-4 py-2.5 border-b border-[#e2e7f0] bg-[#f7f9fc]" />}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Cell({ children, bold }: { children: ReactNode; bold?: boolean }) {
  return (
    <td className="px-4 py-2.5 border-b border-[#eaecf0]">
      <span style={{ ...F, fontSize: 13, fontWeight: bold ? 700 : 400, color: "#2d3648" }}>{children}</span>
    </td>
  );
}

function DeleteCell({ onClick }: { onClick: () => void }) {
  return (
    <td className="px-4 py-2.5 border-b border-[#eaecf0]">
      <button
        type="button"
        onClick={onClick}
        className="w-8 h-8 rounded-[6px] flex items-center justify-center"
        style={{ background: "#fce8f1" }}
      >
        <Trash2 size={14} color="#e3282c" />
      </button>
    </td>
  );
}

/* =========================================================
   الحالة الابتدائية للنموذج
========================================================= */

const emptyForm = {
  military_number: "",
  full_name: "",
  national_id: "",
  rank_id: "",
  unit_id: "",
  job_id: "",
  birth_date: "",
  birth_governorate_id: "",
  birth_district_id: "",
  religion: "",
  marital_status: "",
  address_governorate_id: "",
  address_district_id: "",
  address_detail: "",
  service_join_date: "",
  martyrdom_date: "",
  martyrdom_place: "",
  martyrdom_type: "",
  circumstances: "",
  decision_number: "",
  decision_date: "",
  decision_issuer: "",
  notes: "",
};

type FormState = typeof emptyForm;

const emptyHeir = {
  relation: "",
  full_name: "",
  national_id: "",
  birth_date: "",
  phone_number: "",
  education_stage: "",
  is_pension_beneficiary: false,
};
const emptyEntitlement = { entitlement_type: "", status: "لم يتم", status_date: "", decision_number: "", notes: "" };
const emptyHonor = { honor_type: "", honor_date: "", issuer: "", notes: "" };
const emptyFollowup = { followup_date: "", followup_type: "", done_by: "", details: "" };
const emptyUnit = { mode: "select" as "select" | "free", unit_id: "", unit_name_free: "", rank_id: "", joined_at: "", transferred_at: "" };
const emptyPromotion = { rank_id: "", promotion_date: "", decision_number: "" };

/* =========================================================
   الصفحة
========================================================= */

export function MartyrDetailPage() {
  const { martyrId } = useParams<{ martyrId: string }>();
  const navigate = useNavigate();

  const { loading: checkingAccess, hasPermission } = usePermissions();
  const canEdit = hasPermission("martyrs_record:edit");

  const [record, setRecord] = useState<MartyrRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [ranks, setRanks] = useState<RankOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<MaritalStatus[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [birthDistricts, setBirthDistricts] = useState<District[]>([]);
  const [addressDistricts, setAddressDistricts] = useState<District[]>([]);

  const [heirs, setHeirs] = useState<MartyrHeir[]>([]);
  const [entitlements, setEntitlements] = useState<MartyrEntitlement[]>([]);
  const [honors, setHonors] = useState<MartyrHonor[]>([]);
  const [followups, setFollowups] = useState<MartyrFollowup[]>([]);
  const [documents, setDocuments] = useState<MartyrDocument[]>([]);
  const [unitHistory, setUnitHistory] = useState<MartyrUnitHistoryRow[]>([]);
  const [promotions, setPromotions] = useState<MartyrPromotion[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const [heirForm, setHeirForm] = useState(emptyHeir);
  const [entForm, setEntForm] = useState(emptyEntitlement);
  const [honorForm, setHonorForm] = useState(emptyHonor);
  const [followForm, setFollowForm] = useState(emptyFollowup);
  const [unitForm, setUnitForm] = useState(emptyUnit);
  const [promoForm, setPromoForm] = useState(emptyPromotion);
  const [documentName, setDocumentName] = useState("");

  useEffect(() => {
    if (martyrId) loadAll(martyrId);
  }, [martyrId]);

  async function loadAll(id: string) {
    setLoading(true);
    setError("");

    try {
      const [
        rec,
        rankOptions,
        unitOptions,
        jobOptions,
        statuses,
        governorateOptions,
        heirRows,
        entitlementRows,
        honorRows,
        followupRows,
        documentRows,
        unitRows,
        promotionRows,
      ] = await Promise.all([
        fetchMartyrById(id),
        fetchAllRankOptions(),
        fetchAllUnitOptions(),
        fetchAllJobOptions(),
        fetchMaritalStatuses(),
        fetchAllGovernorates(),
        fetchHeirs(id),
        fetchEntitlements(id),
        fetchHonors(id),
        fetchFollowups(id),
        fetchMartyrDocuments(id),
        fetchMartyrUnitHistory(id),
        fetchMartyrPromotions(id),
      ]);

      setRecord(rec);
      setRanks(rankOptions);
      setUnits(unitOptions);
      setJobs(jobOptions);
      setMaritalStatuses(statuses);
      setGovernorates(governorateOptions);
      setHeirs(heirRows);
      setEntitlements(entitlementRows);
      setHonors(honorRows);
      setFollowups(followupRows);
      setDocuments(documentRows);
      setUnitHistory(unitRows);
      setPromotions(promotionRows);

      setForm({
        military_number: rec.military_number ?? "",
        full_name: rec.full_name ?? "",
        national_id: rec.national_id ?? "",
        rank_id: rec.rank_id ?? "",
        unit_id: rec.unit_id ?? "",
        job_id: rec.job_id ?? "",
        birth_date: rec.birth_date ?? "",
        birth_governorate_id: rec.birth_governorate_id ?? "",
        birth_district_id: rec.birth_district_id ?? "",
        religion: rec.religion ?? "",
        marital_status: rec.marital_status ?? "",
        address_governorate_id: rec.address_governorate_id ?? "",
        address_district_id: rec.address_district_id ?? "",
        address_detail: rec.address_detail ?? "",
        service_join_date: rec.service_join_date ?? "",
        martyrdom_date: rec.martyrdom_date ?? "",
        martyrdom_place: rec.martyrdom_place ?? "",
        martyrdom_type: rec.martyrdom_type ?? "",
        circumstances: rec.circumstances ?? "",
        decision_number: rec.decision_number ?? "",
        decision_date: rec.decision_date ?? "",
        decision_issuer: rec.decision_issuer ?? "",
        notes: rec.notes ?? "",
      });

      setBirthDistricts(rec.birth_governorate_id ? await fetchDistrictsByGovernorate(rec.birth_governorate_id) : []);
      setAddressDistricts(
        rec.address_governorate_id ? await fetchDistrictsByGovernorate(rec.address_governorate_id) : []
      );

      if (rec.photo_path) {
        try {
          setPhotoUrl(await getMartyrPhotoSignedUrl(rec.photo_path));
        } catch {
          setPhotoUrl(null);
        }
      } else {
        setPhotoUrl(null);
      }
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل السجل");
    } finally {
      setLoading(false);
    }
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleBirthGovernorateChange(governorateId: string) {
    setForm((prev) => ({ ...prev, birth_governorate_id: governorateId, birth_district_id: "" }));

    try {
      setBirthDistricts(governorateId ? await fetchDistrictsByGovernorate(governorateId) : []);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل المراكز/الأقسام");
    }
  }

  async function handleAddressGovernorateChange(governorateId: string) {
    setForm((prev) => ({ ...prev, address_governorate_id: governorateId, address_district_id: "" }));

    try {
      setAddressDistricts(governorateId ? await fetchDistrictsByGovernorate(governorateId) : []);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل المراكز/الأقسام");
    }
  }

  /** ينفذ عملية ثم يعيد تحميل الصفحة، مع عرض أي خطأ */
  async function run(fn: () => Promise<void>, fallbackError: string) {
    setError("");

    try {
      await fn();
      if (martyrId) await loadAll(martyrId);
    } catch (err: any) {
      setError(err?.message || fallbackError);
    }
  }

  async function runDelete(message: string, fn: () => Promise<void>) {
    if (!window.confirm(message)) return;
    await run(fn, "حدث خطأ أثناء الحذف");
  }

  /* ---------------- الحفظ ---------------- */

  async function handleSave() {
    if (!martyrId) return;

    if (!form.full_name.trim()) {
      setError("اسم الشهيد مطلوب");
      return;
    }

    if (!form.martyrdom_date) {
      setError("تاريخ الاستشهاد مطلوب");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateMartyr(martyrId, {
        military_number: form.military_number.trim() || null,
        full_name: form.full_name.trim(),
        national_id: form.national_id.trim() || null,
        rank_id: form.rank_id || null,
        unit_id: form.unit_id || null,
        job_id: form.job_id || null,
        birth_date: form.birth_date || null,
        birth_governorate_id: form.birth_governorate_id || null,
        birth_district_id: form.birth_district_id || null,
        religion: form.religion || null,
        marital_status: form.marital_status || null,
        address_governorate_id: form.address_governorate_id || null,
        address_district_id: form.address_district_id || null,
        address_detail: form.address_detail.trim() || null,
        service_join_date: form.service_join_date || null,
        martyrdom_date: form.martyrdom_date,
        martyrdom_place: form.martyrdom_place.trim() || null,
        martyrdom_type: form.martyrdom_type || null,
        circumstances: form.circumstances.trim() || null,
        decision_number: form.decision_number.trim() || null,
        decision_date: form.decision_date || null,
        decision_issuer: form.decision_issuer.trim() || null,
        notes: form.notes.trim() || null,
      });

      setSuccessMsg("تم حفظ البيانات بنجاح");
      window.setTimeout(() => setSuccessMsg(""), 3000);

      await loadAll(martyrId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMartyr() {
    if (!martyrId) return;
    if (!window.confirm("هل أنت متأكد من حذف سجل هذا الشهيد بالكامل؟ لا يمكن التراجع.")) return;

    try {
      await deleteMartyr(martyrId);
      navigate("/dashboard/martyrs-record");
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء الحذف");
    }
  }

  async function handleUploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!martyrId) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setError("");

    try {
      const path = await uploadMartyrPhoto(martyrId, file);
      await updateMartyr(martyrId, { photo_path: path });
      await loadAll(martyrId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  /* ---------------- الإضافات ---------------- */

  async function handleAddHeir() {
    if (!martyrId) return;

    if (!heirForm.relation.trim() || !heirForm.full_name.trim()) {
      setError("الصلة والاسم مطلوبان");
      return;
    }

    await run(async () => {
      await addHeir({
        martyr_id: martyrId,
        relation: heirForm.relation.trim(),
        full_name: heirForm.full_name.trim(),
        national_id: heirForm.national_id.trim() || null,
        birth_date: heirForm.birth_date || null,
        phone_number: heirForm.phone_number.trim() || null,
        education_stage: heirForm.education_stage || null,
        is_pension_beneficiary: heirForm.is_pension_beneficiary,
        notes: null,
      });
      setHeirForm(emptyHeir);
    }, "حدث خطأ أثناء إضافة الوريث");
  }

  async function handleAddEntitlement() {
    if (!martyrId) return;

    if (!entForm.entitlement_type) {
      setError("اختر نوع الحق");
      return;
    }

    await run(async () => {
      await addEntitlement({
        martyr_id: martyrId,
        entitlement_type: entForm.entitlement_type,
        status: entForm.status,
        status_date: entForm.status_date || null,
        decision_number: entForm.decision_number.trim() || null,
        notes: entForm.notes.trim() || null,
      });
      setEntForm(emptyEntitlement);
    }, "حدث خطأ أثناء إضافة الحق");
  }

  async function handleChangeEntitlementStatus(item: MartyrEntitlement, status: string) {
    await run(
      () =>
        updateEntitlement(item.id, {
          status,
          status_date: status === "تم" && !item.status_date ? today() : item.status_date,
        }),
      "حدث خطأ أثناء التحديث"
    );
  }

  async function handleAddHonor() {
    if (!martyrId) return;

    if (!honorForm.honor_type.trim()) {
      setError("نوع التكريم مطلوب");
      return;
    }

    await run(async () => {
      await addHonor({
        martyr_id: martyrId,
        honor_type: honorForm.honor_type.trim(),
        honor_date: honorForm.honor_date || null,
        issuer: honorForm.issuer.trim() || null,
        notes: honorForm.notes.trim() || null,
      });
      setHonorForm(emptyHonor);
    }, "حدث خطأ أثناء إضافة التكريم");
  }

  async function handleAddFollowup() {
    if (!martyrId) return;

    if (!followForm.followup_date || !followForm.followup_type) {
      setError("تاريخ المتابعة ونوعها مطلوبان");
      return;
    }

    await run(async () => {
      await addFollowup({
        martyr_id: martyrId,
        followup_date: followForm.followup_date,
        followup_type: followForm.followup_type,
        done_by: followForm.done_by.trim() || null,
        details: followForm.details.trim() || null,
        status: "مفتوح",
      });
      setFollowForm(emptyFollowup);
    }, "حدث خطأ أثناء إضافة المتابعة");
  }

  async function handleAddUnit() {
    if (!martyrId) return;

    if (unitForm.mode === "select" && !unitForm.unit_id) {
      setError("اختر الوحدة");
      return;
    }

    if (unitForm.mode === "free" && !unitForm.unit_name_free.trim()) {
      setError("اكتب اسم الوحدة");
      return;
    }

    if (!unitForm.joined_at) {
      setError("تاريخ الانضمام مطلوب");
      return;
    }

    if (unitForm.transferred_at && unitForm.transferred_at < unitForm.joined_at) {
      setError("تاريخ الانتقال لا يمكن أن يكون قبل تاريخ الانضمام");
      return;
    }

    await run(async () => {
      await addMartyrUnitHistory({
        martyr_id: martyrId,
        unit_id: unitForm.mode === "select" ? unitForm.unit_id : null,
        unit_name_free: unitForm.mode === "free" ? unitForm.unit_name_free.trim() : null,
        rank_id: unitForm.rank_id || null,
        joined_at: unitForm.joined_at,
        transferred_at: unitForm.transferred_at || null,
      });
      setUnitForm(emptyUnit);
    }, "حدث خطأ أثناء إضافة الوحدة");
  }

  async function handleAddPromotion() {
    if (!martyrId) return;

    if (!promoForm.rank_id || !promoForm.promotion_date || !promoForm.decision_number.trim()) {
      setError("الدرجة وتاريخ الترقي ورقم القرار مطلوبة");
      return;
    }

    await run(async () => {
      await addMartyrPromotion({
        martyr_id: martyrId,
        rank_id: promoForm.rank_id,
        promotion_date: promoForm.promotion_date,
        decision_number: promoForm.decision_number.trim(),
      });
      setPromoForm(emptyPromotion);
    }, "حدث خطأ أثناء إضافة الترقية");
  }

  async function handleUploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    if (!martyrId) return;

    const file = e.target.files?.[0];
    if (!file) return;

    if (!documentName.trim()) {
      setError("اكتب اسم المستند أولًا");
      e.target.value = "";
      return;
    }

    setUploadingDocument(true);
    setError("");

    try {
      await uploadMartyrDocument(martyrId, documentName.trim(), file);
      setDocumentName("");
      await loadAll(martyrId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء رفع المستند");
    } finally {
      setUploadingDocument(false);
      e.target.value = "";
    }
  }

  async function handleViewDocument(filePath: string) {
    try {
      const url = await getMartyrDocumentSignedUrl(filePath);
      window.open(url, "_blank");
    } catch (err: any) {
      setError(err?.message || "تعذر فتح المستند");
    }
  }

  /* ---------------- الطباعة ---------------- */

  async function handlePrint() {
    if (!record) return;

    // لازم نفتح النافذة الأول (قبل أي await) عشان المتصفح ما يمنعهاش
    const printWindow = window.open("", "_blank", "width=1000,height=1200");

    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    printWindow.document.write(
      `<p style="font-family:Arial,sans-serif;text-align:center;margin-top:40px;direction:rtl;">جاري تجهيز الطباعة...</p>`
    );

    // نجيب روابط المرفقات
    const attachmentItems = await Promise.all(
      documents.map(async (doc) => {
        const isImage = /\.(png|jpe?g|gif|webp|bmp)$/i.test(doc.file_path);

        if (!isImage) {
          return { name: doc.document_name, url: null as string | null, isImage: false };
        }

        try {
          const url = await getMartyrDocumentSignedUrl(doc.file_path);
          return { name: doc.document_name, url, isImage: true };
        } catch {
          return { name: doc.document_name, url: null as string | null, isImage: true };
        }
      })
    );

    const attachmentsHtml = attachmentItems.length
      ? `
        <div class="attachments-page">
          <div class="section-title" style="margin-top:0;">المستندات المرفقة - ${val(form.full_name)}</div>
          <div class="attachments-grid">
            ${attachmentItems
              .map(
                (a) => `
              <div class="attachment-item">
                <div class="attachment-caption">${val(a.name)}</div>
                <div class="attachment-img-box">
                  ${
                    a.isImage && a.url
                      ? `<img src="${a.url}" />`
                      : `<div class="attachment-placeholder">${
                          a.isImage ? "تعذر تحميل الصورة" : "ملف غير صورة (لا يُعرض في الطباعة)"
                        }</div>`
                  }
                </div>
              </div>`
              )
              .join("")}
          </div>
        </div>`
      : "";

    const maritalLabel = maritalStatuses.find((s) => s.code === form.marital_status)?.name ?? "-";
    const birthGov = governorates.find((g) => g.id === form.birth_governorate_id)?.name ?? "-";
    const birthDist = birthDistricts.find((d) => d.id === form.birth_district_id)?.name ?? "-";
    const addrGov = governorates.find((g) => g.id === form.address_governorate_id)?.name ?? "-";
    const addrDist = addressDistricts.find((d) => d.id === form.address_district_id)?.name ?? "-";

    const item = (label: string, value: string, span = false) =>
      `<div class="info-item"${span ? ' style="grid-column: span 3;"' : ""}><span class="info-label">${label}:</span><span class="info-value">${value}</span></div>`;

    const table = (heads: string[], rowsHtml: string, emptyText: string) => `
      <table>
        <thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rowsHtml || `<tr><td colspan="${heads.length}" class="empty-row">${emptyText}</td></tr>`}</tbody>
      </table>`;

    // عنوان + جدول جوه بلوك واحد عشان ما يتفصلوش عن بعض
    const tableSection = (title: string, heads: string[], rowsHtml: string, emptyText: string) => `
      <div class="section-block">
        <div class="section-title">${title}</div>
        ${table(heads, rowsHtml, emptyText)}
      </div>`;

    // عنوان + بيانات (شبكة معلومات) جوه بلوك واحد
    const infoSection = (title: string, itemsHtml: string) => `
      <div class="section-block">
        <div class="section-title">${title}</div>
        <div class="info-grid">${itemsHtml}</div>
      </div>`;
    const heirsHtml = heirs
      .map(
        (h) => `<tr>
          <td>${val(h.relation)}</td>
          <td>${val(h.full_name)}</td>
          <td>${ar(h.national_id)}</td>
          <td>${ar(h.birth_date)}</td>
          <td>${ar(h.phone_number)}</td>
          <td>${val(h.education_stage)}</td>
          <td>${h.is_pension_beneficiary ? "نعم" : "لا"}</td>
        </tr>`
      )
      .join("");

    const entitlementsHtml = entitlements
      .map(
        (e) => `<tr>
          <td>${val(e.entitlement_type)}</td>
          <td>${val(e.status)}</td>
          <td>${ar(e.status_date)}</td>
          <td>${ar(e.decision_number)}</td>
          <td>${val(e.notes)}</td>
        </tr>`
      )
      .join("");

    const honorsHtml = honors
      .map(
        (h) => `<tr>
          <td>${val(h.honor_type)}</td>
          <td>${ar(h.honor_date)}</td>
          <td>${val(h.issuer)}</td>
          <td>${val(h.notes)}</td>
        </tr>`
      )
      .join("");

    const followupsHtml = followups
      .map(
        (f) => `<tr>
          <td>${ar(f.followup_date)}</td>
          <td>${val(f.followup_type)}</td>
          <td>${val(f.done_by)}</td>
          <td>${val(f.details)}</td>
          <td>${val(f.status)}</td>
        </tr>`
      )
      .join("");

    const unitsHtml = unitHistory
      .map(
        (u) => `<tr>
          <td>${val(u.unit_name_resolved)}</td>
          <td>${val(u.rank_name)}</td>
          <td>${ar(u.joined_at)}</td>
          <td>${u.transferred_at ? ar(u.transferred_at) : "حتى الاستشهاد"}</td>
          <td>${ar(calculateServiceDuration(u.joined_at, u.transferred_at ?? form.martyrdom_date))}</td>
        </tr>`
      )
      .join("");

    const promotionsHtml = promotions
      .map(
        (p) => `<tr>
          <td>${ar(p.promotion_date)}</td>
          <td>${val(p.rank_name)}</td>
          <td>${ar(p.decision_number)}</td>
        </tr>`
      )
      .join("");

    const rankName = ranks.find((r) => r.id === form.rank_id)?.name ?? null;
    const unitName = units.find((u) => u.id === form.unit_id)?.name ?? null;
    const jobName = jobs.find((j) => j.id === form.job_id)?.name ?? null;
    const body = `
      <div class="section-block">
        <div class="section-title">البيانات الأساسية</div>
        <div class="basic-info-row">
          <div class="info-grid" style="flex: 1;">
            ${item("الرقم العسكري", ar(form.military_number))}
            ${item("الدرجة", val(rankName))}
            ${item("الاسم", val(form.full_name))}
            ${item("الوحدة", val(unitName))}
            ${item("الوظيفة", val(jobName))}
            ${item("الرقم القومي", ar(form.national_id))}
          </div>
          <div class="photo-box-inline">
            ${photoUrl ? `<img src="${photoUrl}" />` : `<span style="font-size:11px;color:#a1aebe;">لا توجد صورة</span>`}
          </div>
        </div>
      </div>

      ${infoSection(
        "البيانات الشخصية",
        `
        ${item("تاريخ الميلاد", ar(form.birth_date))}
        ${item("محل الميلاد", `${val(birthGov)} - ${val(birthDist)}`)}
        ${item("الديانة", val(form.religion))}
        ${item("الحالة الاجتماعية", val(maritalLabel))}
        ${item("تاريخ الالتحاق بالخدمة", ar(form.service_join_date))}
        ${item("العنوان", `${val(addrGov)} - ${val(addrDist)} - ${form.address_detail ? ar(form.address_detail) : "-"}`, true)}
        `
      )}

      ${infoSection(
        "بيانات الاستشهاد",
        `
        ${item("تاريخ الاستشهاد", ar(form.martyrdom_date))}
        ${item("نوع الاستشهاد", val(form.martyrdom_type))}
        ${item("مكان الاستشهاد", val(form.martyrdom_place))}
        ${item("رقم القرار", ar(form.decision_number))}
        ${item("تاريخ القرار", ar(form.decision_date))}
        ${item("جهة الإصدار", val(form.decision_issuer))}
        ${item("ظروف الواقعة", val(form.circumstances), true)}
        `
      )}

      ${tableSection(
        "الورثة والمستحقون",
        ["الصلة", "الاسم", "الرقم القومي", "تاريخ الميلاد", "الهاتف", "المرحلة التعليمية", "مستفيد من المعاش"],
        heirsHtml,
        "لا يوجد ورثة مسجلين"
      )}

      ${tableSection(
        "الحقوق والمستحقات",
        ["النوع", "الحالة", "التاريخ", "رقم القرار", "ملاحظات"],
        entitlementsHtml,
        "لا توجد حقوق مسجلة"
      )}

      ${tableSection(
        "التكريمات والأوسمة",
        ["النوع", "التاريخ", "الجهة", "ملاحظات"],
        honorsHtml,
        "لا توجد تكريمات مسجلة"
      )}

      ${tableSection(
        "المتابعة",
        ["التاريخ", "النوع", "بواسطة", "التفاصيل", "الحالة"],
        followupsHtml,
        "لا توجد متابعات مسجلة"
      )}

      ${tableSection(
        "سجل الوحدات",
        ["اسم الوحدة", "الدرجة أثناء الخدمة", "تاريخ الانضمام", "تاريخ الانتقال", "مدة الخدمة"],
        unitsHtml,
        "لا يوجد سجل وحدات"
      )}

      ${tableSection(
        "سجل الترقي",
        ["تاريخ الترقي", "الدرجة", "رقم قرار الترقي"],
        promotionsHtml,
        "لا يوجد ترقيات مسجلة"
      )}

      ${
        form.notes
          ? `<div class="section-block"><div class="section-title">ملاحظات</div><div style="font-size:13px;">${ar(form.notes)}</div></div>`
          : ""
      }

      ${attachmentsHtml}
    `;
    printHtml(
      buildPrintHtml({
        title: `بيان شهيد - ${form.full_name}`,
        boxTitle: "بيان تفصيلي لشهيد",
        logo: logoImg,
        body,
      }),
      printWindow
    );
  }

  /* ---------------- العرض ---------------- */

  if (loading || checkingAccess) {
    return (
      <div className="flex items-center justify-center w-full min-h-[400px]" dir="rtl">
        <span style={{ ...F, fontSize: 16, color: "#717d96" }}>جاري تحميل السجل...</span>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex items-center justify-center w-full min-h-[400px]" dir="rtl">
        <span style={{ ...F, fontSize: 16, color: "#e34040" }}>{error || "لم يتم العثور على الشهيد"}</span>
      </div>
    );
  }

  const saveButton = canEdit && (
    <div className="sm:col-span-3">
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="h-[44px] px-6 rounded-[8px] disabled:opacity-50"
        style={addBtnStyle}
      >
        {saving ? "جاري الحفظ..." : "حفظ البيانات"}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 style={{ ...F, fontWeight: 700, fontSize: "clamp(20px,3.5vw,28px)", color: "#2d3648" }}>
          سجل الشهيد
        </h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px]"
            style={{ background: "#DCF4DF" }}
          >
            <Printer size={15} color="#2d3648" />
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>طباعة البيان</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/martyrs-record")}
            className="flex items-center gap-1.5"
            style={{ ...F, fontSize: 14, color: "#1f3d97" }}
          >
            <ArrowRight size={16} />
            العودة
          </button>
        </div>
      </div>

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", ...F, fontSize: 14 }}
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

      {/* الهيدر */}
      <section
        className="rounded-[20px] p-6 flex flex-wrap items-center gap-6"
        style={{ background: "linear-gradient(135deg,#f7f9fc,#eff5f0)", border: "1px solid #eff0f6" }}
      >
        <div className="flex flex-col items-center gap-2 shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              className="w-24 h-24 object-cover rounded-[12px] border-2"
              style={{ borderColor: "#00b867" }}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-[12px] flex items-center justify-center border-2"
              style={{ background: "#fff", borderColor: "#dcf4df" }}
            >
              <span style={{ ...F, fontSize: 11, color: "#a1aebe", textAlign: "center" }}>لا توجد صورة</span>
            </div>
          )}

          {canEdit && (
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Upload size={13} className="text-[#00522e]" />
              <span style={{ ...F, fontSize: 12, color: "#00522e" }}>
                {uploadingPhoto ? "جاري الرفع..." : "تغيير الصورة"}
              </span>
              <input type="file" accept="image/*" onChange={handleUploadPhoto} disabled={uploadingPhoto} className="hidden" />
            </label>
          )}
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-3 flex-1">
          {[
            ["الرقم العسكري", record.military_number],
            ["الدرجة", record.rank_name],
            ["الاسم", record.full_name],
            ["الوحدة", record.unit_name],
            ["تاريخ الاستشهاد", record.martyrdom_date],
            ["نوع الاستشهاد", record.martyrdom_type],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span style={{ ...F, fontSize: 12, color: "#717d96" }}>{label}</span>
              <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>{value ?? "-"}</span>
            </div>
          ))}
        </div>
      </section>

      {/* البيانات الأساسية */}
      <Section title="البيانات الأساسية">
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="الرقم العسكري">
            <input type="text" value={form.military_number} onChange={(e) => setField("military_number", e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F} />
          </Field>

          <Field label="الدرجة وقت الاستشهاد">
            <select value={form.rank_id} onChange={(e) => setField("rank_id", e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F}>
              <option value="">اختر الدرجة</option>
              {ranks.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </Field>

          <Field label="الاسم *">
            <input type="text" value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F} />
          </Field>

          <Field label="اسم الوحدة">
            <select value={form.unit_id} onChange={(e) => setField("unit_id", e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F}>
              <option value="">اختر الوحدة</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Field>

          <Field label="الوظيفة">
            <select value={form.job_id} onChange={(e) => setField("job_id", e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F}>
              <option value="">اختر الوظيفة</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </select>
          </Field>

          <Field label="تاريخ الالتحاق بالخدمة">
            <input type="date" value={form.service_join_date} onChange={(e) => setField("service_join_date", e.target.value)} disabled={!canEdit} className={inputClass} style={F} />
          </Field>

          {saveButton}
        </div>
      </Section>

      {/* البيانات الشخصية */}
      <Section title="البيانات الشخصية">
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="الرقم القومي">
            <input type="text" value={form.national_id} onChange={(e) => setField("national_id", e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F} />
          </Field>

          <Field label="تاريخ الميلاد">
            <input type="date" value={form.birth_date} onChange={(e) => setField("birth_date", e.target.value)} disabled={!canEdit} className={inputClass} style={F} />
          </Field>

          <Field label="الحالة الاجتماعية">
            <select value={form.marital_status} onChange={(e) => setField("marital_status", e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F}>
              <option value="">اختر الحالة</option>
              {maritalStatuses.map((s) => (
                <option key={s.id} value={s.code}>{s.name}</option>
              ))}
            </select>
          </Field>

          <Field label="الديانة">
            <select value={form.religion} onChange={(e) => setField("religion", e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F}>
              <option value="">اختر الديانة</option>
              {RELIGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>

          <Field label="محل الميلاد (المحافظة)">
            <select value={form.birth_governorate_id} onChange={(e) => handleBirthGovernorateChange(e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F}>
              <option value="">اختر المحافظة</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </Field>

          <Field label="محل الميلاد (المركز/القسم)">
            <select value={form.birth_district_id} onChange={(e) => setField("birth_district_id", e.target.value)} disabled={!canEdit || !form.birth_governorate_id} dir="rtl" className={inputClass} style={F}>
              <option value="">اختر المركز/القسم</option>
              {birthDistricts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>

          <Field label="العنوان (المحافظة)">
            <select value={form.address_governorate_id} onChange={(e) => handleAddressGovernorateChange(e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F}>
              <option value="">اختر المحافظة</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </Field>

          <Field label="العنوان (المركز/القسم)">
            <select value={form.address_district_id} onChange={(e) => setField("address_district_id", e.target.value)} disabled={!canEdit || !form.address_governorate_id} dir="rtl" className={inputClass} style={F}>
              <option value="">اختر المركز/القسم</option>
              {addressDistricts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>

          <Field label="تفاصيل العنوان">
            <input type="text" value={form.address_detail} onChange={(e) => setField("address_detail", e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F} />
          </Field>

          <Field label="ملاحظات" className="sm:col-span-3">
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              disabled={!canEdit}
              rows={3}
              dir="rtl"
              className="rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867] disabled:bg-[#f7f9fc] bg-white"
              style={F}
            />
          </Field>

          {saveButton}
        </div>
      </Section>
      {/* بيانات الاستشهاد */}
      <Section title="بيانات الاستشهاد">
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="تاريخ الاستشهاد *">
            <input type="date" value={form.martyrdom_date} onChange={(e) => setField("martyrdom_date", e.target.value)} disabled={!canEdit} className={inputClass} style={F} />
          </Field>

          <Field label="نوع الاستشهاد">
            <select value={form.martyrdom_type} onChange={(e) => setField("martyrdom_type", e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F}>
              <option value="">اختر النوع</option>
              {MARTYRDOM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>

          <Field label="مكان الاستشهاد">
            <input type="text" value={form.martyrdom_place} onChange={(e) => setField("martyrdom_place", e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F} />
          </Field>

          <Field label="رقم قرار اعتباره شهيدًا">
            <input type="text" value={form.decision_number} onChange={(e) => setField("decision_number", e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F} />
          </Field>

          <Field label="تاريخ القرار">
            <input type="date" value={form.decision_date} onChange={(e) => setField("decision_date", e.target.value)} disabled={!canEdit} className={inputClass} style={F} />
          </Field>

          <Field label="جهة الإصدار">
            <input type="text" value={form.decision_issuer} onChange={(e) => setField("decision_issuer", e.target.value)} disabled={!canEdit} dir="rtl" className={inputClass} style={F} />
          </Field>

          <Field label="ظروف الواقعة" className="sm:col-span-3">
            <textarea
              value={form.circumstances}
              onChange={(e) => setField("circumstances", e.target.value)}
              disabled={!canEdit}
              rows={3}
              dir="rtl"
              className="rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867] disabled:bg-[#f7f9fc] bg-white"
              style={F}
            />
          </Field>

          {saveButton}
        </div>
      </Section>

      {/* الورثة */}
      <Section title="الورثة والمستحقون">
        {canEdit && (
          <div className="px-6 pt-5 flex flex-wrap items-end gap-2">
            <Field label="الصلة" className="w-[130px]">
              <input type="text" value={heirForm.relation} onChange={(e) => setHeirForm({ ...heirForm, relation: e.target.value })} placeholder="زوجة / ابن..." dir="rtl" className={inputClass} style={F} />
            </Field>
            <Field label="الاسم" className="flex-1 min-w-[160px]">
              <input type="text" value={heirForm.full_name} onChange={(e) => setHeirForm({ ...heirForm, full_name: e.target.value })} dir="rtl" className={inputClass} style={F} />
            </Field>
            <Field label="الرقم القومي" className="w-[170px]">
              <input type="text" value={heirForm.national_id} onChange={(e) => setHeirForm({ ...heirForm, national_id: e.target.value })} dir="rtl" className={inputClass} style={F} />
            </Field>
            <Field label="تاريخ الميلاد" className="w-[150px]">
              <input type="date" value={heirForm.birth_date} onChange={(e) => setHeirForm({ ...heirForm, birth_date: e.target.value })} className={inputClass} style={F} />
            </Field>
            <Field label="رقم الهاتف" className="w-[150px]">
              <input type="text" value={heirForm.phone_number} onChange={(e) => setHeirForm({ ...heirForm, phone_number: e.target.value })} dir="rtl" className={inputClass} style={F} />
            </Field>
            <Field label="المرحلة التعليمية" className="w-[160px]">
              <select value={heirForm.education_stage} onChange={(e) => setHeirForm({ ...heirForm, education_stage: e.target.value })} dir="rtl" className={inputClass} style={F}>
                <option value="">اختر المرحلة</option>
                {EDUCATION_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>

            <label className="flex items-center gap-1.5 h-[42px] cursor-pointer">
              <input type="checkbox" checked={heirForm.is_pension_beneficiary} onChange={(e) => setHeirForm({ ...heirForm, is_pension_beneficiary: e.target.checked })} className="accent-[#00b867]" />
              <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>مستفيد من المعاش</span>
            </label>

            <button type="button" onClick={handleAddHeir} className="h-[42px] px-5 rounded-[8px] flex items-center gap-1.5 shrink-0" style={addBtnStyle}>
              <Plus size={14} />
              إضافة وريث
            </button>
          </div>
        )}

        <div className="p-6">
          {heirs.length === 0 ? (
            <EmptyBox text="لا يوجد ورثة مسجلين حاليًا" />
          ) : (
            <DataTable heads={["الصلة", "الاسم", "الرقم القومي", "تاريخ الميلاد", "الهاتف", "المرحلة التعليمية", "مستفيد من المعاش"]} withActions={canEdit}>
              {heirs.map((h) => (
                <tr key={h.id} className="hover:bg-[#fafbff]">
                  <Cell bold>{h.relation}</Cell>
                  <Cell>{h.full_name}</Cell>
                  <Cell>{h.national_id ?? "-"}</Cell>
                  <Cell>{h.birth_date ?? "-"}</Cell>
                  <Cell>{h.phone_number ?? "-"}</Cell>
                  <Cell>{h.education_stage ?? "-"}</Cell>
                  <Cell>{h.is_pension_beneficiary ? "نعم" : "لا"}</Cell>
                  {canEdit && <DeleteCell onClick={() => runDelete("هل تريد حذف هذا الوريث؟", () => deleteHeir(h.id))} />}
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </Section>

      {/* الحقوق */}
      <Section title="الحقوق والمستحقات">
        {canEdit && (
          <div className="px-6 pt-5 flex flex-wrap items-end gap-2">
            <Field label="نوع الحق" className="w-[170px]">
              <select value={entForm.entitlement_type} onChange={(e) => setEntForm({ ...entForm, entitlement_type: e.target.value })} dir="rtl" className={inputClass} style={F}>
                <option value="">اختر النوع</option>
                {ENTITLEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="الحالة" className="w-[130px]">
              <select value={entForm.status} onChange={(e) => setEntForm({ ...entForm, status: e.target.value })} dir="rtl" className={inputClass} style={F}>
                {ENTITLEMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="التاريخ" className="w-[150px]">
              <input type="date" value={entForm.status_date} onChange={(e) => setEntForm({ ...entForm, status_date: e.target.value })} className={inputClass} style={F} />
            </Field>
            <Field label="رقم القرار" className="w-[150px]">
              <input type="text" value={entForm.decision_number} onChange={(e) => setEntForm({ ...entForm, decision_number: e.target.value })} dir="rtl" className={inputClass} style={F} />
            </Field>
            <Field label="ملاحظات" className="flex-1 min-w-[160px]">
              <input type="text" value={entForm.notes} onChange={(e) => setEntForm({ ...entForm, notes: e.target.value })} dir="rtl" className={inputClass} style={F} />
            </Field>
            <button type="button" onClick={handleAddEntitlement} className="h-[42px] px-5 rounded-[8px] flex items-center gap-1.5 shrink-0" style={addBtnStyle}>
              <Plus size={14} />
              إضافة حق
            </button>
          </div>
        )}

        <div className="p-6">
          {entitlements.length === 0 ? (
            <EmptyBox text="لا توجد حقوق مسجلة حاليًا" />
          ) : (
            <DataTable heads={["النوع", "الحالة", "التاريخ", "رقم القرار", "ملاحظات"]} withActions={canEdit}>
              {entitlements.map((en) => (
                <tr key={en.id} className="hover:bg-[#fafbff]">
                  <Cell bold>{en.entitlement_type}</Cell>
                  <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                    {canEdit ? (
                      <select
                        value={en.status}
                        onChange={(e) => handleChangeEntitlementStatus(en, e.target.value)}
                        dir="rtl"
                        className="h-[36px] rounded-[8px] border border-[#e2e7f0] px-2 outline-none focus:border-[#00b867] bg-white"
                        style={{ ...F, fontSize: 13 }}
                      >
                        {ENTITLEMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{en.status}</span>
                    )}
                  </td>
                  <Cell>{en.status_date ?? "-"}</Cell>
                  <Cell>{en.decision_number ?? "-"}</Cell>
                  <Cell>{en.notes ?? "-"}</Cell>
                  {canEdit && <DeleteCell onClick={() => runDelete("هل تريد حذف هذا الحق؟", () => deleteEntitlement(en.id))} />}
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </Section>

      {/* التكريمات */}
      <Section title="التكريمات والأوسمة">
        {canEdit && (
          <div className="px-6 pt-5 flex flex-wrap items-end gap-2">
            <Field label="نوع التكريم / الوسام" className="flex-1 min-w-[180px]">
              <input type="text" value={honorForm.honor_type} onChange={(e) => setHonorForm({ ...honorForm, honor_type: e.target.value })} dir="rtl" className={inputClass} style={F} />
            </Field>
            <Field label="التاريخ" className="w-[150px]">
              <input type="date" value={honorForm.honor_date} onChange={(e) => setHonorForm({ ...honorForm, honor_date: e.target.value })} className={inputClass} style={F} />
            </Field>
            <Field label="الجهة" className="flex-1 min-w-[160px]">
              <input type="text" value={honorForm.issuer} onChange={(e) => setHonorForm({ ...honorForm, issuer: e.target.value })} dir="rtl" className={inputClass} style={F} />
            </Field>
            <Field label="ملاحظات" className="flex-1 min-w-[160px]">
              <input type="text" value={honorForm.notes} onChange={(e) => setHonorForm({ ...honorForm, notes: e.target.value })} dir="rtl" className={inputClass} style={F} />
            </Field>
            <button type="button" onClick={handleAddHonor} className="h-[42px] px-5 rounded-[8px] flex items-center gap-1.5 shrink-0" style={addBtnStyle}>
              <Plus size={14} />
              إضافة تكريم
            </button>
          </div>
        )}

        <div className="p-6">
          {honors.length === 0 ? (
            <EmptyBox text="لا توجد تكريمات مسجلة حاليًا" />
          ) : (
            <DataTable heads={["النوع", "التاريخ", "الجهة", "ملاحظات"]} withActions={canEdit}>
              {honors.map((h) => (
                <tr key={h.id} className="hover:bg-[#fafbff]">
                  <Cell bold>{h.honor_type}</Cell>
                  <Cell>{h.honor_date ?? "-"}</Cell>
                  <Cell>{h.issuer ?? "-"}</Cell>
                  <Cell>{h.notes ?? "-"}</Cell>
                  {canEdit && <DeleteCell onClick={() => runDelete("هل تريد حذف هذا التكريم؟", () => deleteHonor(h.id))} />}
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </Section>

      {/* المتابعة */}
      <Section title="المتابعة (زيارات / اتصالات / طلبات / شكاوى)">
        {canEdit && (
          <div className="px-6 pt-5 flex flex-wrap items-end gap-2">
            <Field label="التاريخ" className="w-[150px]">
              <input type="date" value={followForm.followup_date} onChange={(e) => setFollowForm({ ...followForm, followup_date: e.target.value })} className={inputClass} style={F} />
            </Field>
            <Field label="النوع" className="w-[130px]">
              <select value={followForm.followup_type} onChange={(e) => setFollowForm({ ...followForm, followup_type: e.target.value })} dir="rtl" className={inputClass} style={F}>
                <option value="">اختر النوع</option>
                {FOLLOWUP_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="بواسطة" className="w-[160px]">
              <input type="text" value={followForm.done_by} onChange={(e) => setFollowForm({ ...followForm, done_by: e.target.value })} dir="rtl" className={inputClass} style={F} />
            </Field>
            <Field label="التفاصيل" className="flex-1 min-w-[200px]">
              <input type="text" value={followForm.details} onChange={(e) => setFollowForm({ ...followForm, details: e.target.value })} dir="rtl" className={inputClass} style={F} />
            </Field>
            <button type="button" onClick={handleAddFollowup} className="h-[42px] px-5 rounded-[8px] flex items-center gap-1.5 shrink-0" style={addBtnStyle}>
              <Plus size={14} />
              إضافة متابعة
            </button>
          </div>
        )}

        <div className="p-6">
          {followups.length === 0 ? (
            <EmptyBox text="لا توجد متابعات مسجلة حاليًا" />
          ) : (
            <DataTable heads={["التاريخ", "النوع", "بواسطة", "التفاصيل", "الحالة"]} withActions={canEdit}>
              {followups.map((f) => (
                <tr key={f.id} className="hover:bg-[#fafbff]">
                  <Cell>{f.followup_date}</Cell>
                  <Cell bold>{f.followup_type}</Cell>
                  <Cell>{f.done_by ?? "-"}</Cell>
                  <Cell>{f.details ?? "-"}</Cell>
                  <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                      style={{
                        background: f.status === "مغلق" ? "#dcfce7" : "#fef3c7",
                        ...F,
                        fontSize: 12,
                        fontWeight: 700,
                        color: f.status === "مغلق" ? "#166534" : "#92400e",
                      }}
                    >
                      {f.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                      <div className="flex items-center gap-2">
                        {f.status === "مفتوح" && (
                          <button
                            type="button"
                            onClick={() => run(() => updateFollowup(f.id, { status: "مغلق" }), "حدث خطأ أثناء التحديث")}
                            className="w-8 h-8 rounded-[6px] flex items-center justify-center"
                            style={{ background: "#DCF4DF" }}
                            title="إغلاق"
                          >
                            <Check size={14} color="#00522e" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => runDelete("هل تريد حذف هذه المتابعة؟", () => deleteFollowup(f.id))}
                          className="w-8 h-8 rounded-[6px] flex items-center justify-center"
                          style={{ background: "#fce8f1" }}
                        >
                          <Trash2 size={14} color="#e3282c" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </Section>

      {/* سجل الوحدات */}
      <Section title="سجل الوحدات">
        {canEdit && (
          <div className="px-6 pt-5 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={unitForm.mode === "select"} onChange={() => setUnitForm({ ...unitForm, mode: "select" })} className="accent-[#00b867]" />
                <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>وحدة مسجلة</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={unitForm.mode === "free"} onChange={() => setUnitForm({ ...unitForm, mode: "free" })} className="accent-[#00b867]" />
                <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>وحدة خارجية (اسم حر)</span>
              </label>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <Field label="اسم الوحدة" className="flex-1 min-w-[180px]">
                {unitForm.mode === "select" ? (
                  <select value={unitForm.unit_id} onChange={(e) => setUnitForm({ ...unitForm, unit_id: e.target.value })} dir="rtl" className={inputClass} style={F}>
                    <option value="">اختر الوحدة</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={unitForm.unit_name_free} onChange={(e) => setUnitForm({ ...unitForm, unit_name_free: e.target.value })} placeholder="اكتب اسم الوحدة" dir="rtl" className={inputClass} style={F} />
                )}
              </Field>

              <Field label="الرتبة أثناء الخدمة" className="w-[160px]">
                <select value={unitForm.rank_id} onChange={(e) => setUnitForm({ ...unitForm, rank_id: e.target.value })} dir="rtl" className={inputClass} style={F}>
                  <option value="">اختر الرتبة</option>
                  {ranks.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="تاريخ الانضمام" className="w-[150px]">
                <input type="date" value={unitForm.joined_at} onChange={(e) => setUnitForm({ ...unitForm, joined_at: e.target.value })} className={inputClass} style={F} />
              </Field>

              <Field label="تاريخ الانتقال (اختياري)" className="w-[160px]">
                <input type="date" value={unitForm.transferred_at} onChange={(e) => setUnitForm({ ...unitForm, transferred_at: e.target.value })} className={inputClass} style={F} />
              </Field>

              <button type="button" onClick={handleAddUnit} className="h-[42px] px-5 rounded-[8px] flex items-center gap-1.5 shrink-0" style={addBtnStyle}>
                <Plus size={14} />
                إضافة وحدة
              </button>
            </div>
          </div>
        )}

        <div className="p-6">
          {unitHistory.length === 0 ? (
            <EmptyBox text="لا يوجد سجل وحدات مضاف حاليًا" />
          ) : (
            <DataTable heads={["اسم الوحدة", "الدرجة أثناء الخدمة", "تاريخ الانضمام", "تاريخ الانتقال", "مدة الخدمة"]} withActions={canEdit}>
              {unitHistory.map((u) => (
                <tr key={u.id} className="hover:bg-[#fafbff]">
                  <Cell bold>{u.unit_name_resolved}</Cell>
                  <Cell>{u.rank_name ?? "-"}</Cell>
                  <Cell>{u.joined_at}</Cell>
                  <Cell>{u.transferred_at ?? "حتى الاستشهاد"}</Cell>
                  <Cell>{calculateServiceDuration(u.joined_at, u.transferred_at ?? form.martyrdom_date)}</Cell>
                  {canEdit && <DeleteCell onClick={() => runDelete("هل تريد حذف هذا السجل؟", () => deleteMartyrUnitHistory(u.id))} />}
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </Section>

      {/* الترقيات */}
      <Section title="سجل الترقي">
        {canEdit && (
          <div className="px-6 pt-5 flex flex-wrap items-end gap-2">
            <Field label="تاريخ الترقي" className="w-[160px]">
              <input type="date" value={promoForm.promotion_date} onChange={(e) => setPromoForm({ ...promoForm, promotion_date: e.target.value })} className={inputClass} style={F} />
            </Field>
            <Field label="الدرجة" className="flex-1 min-w-[180px]">
              <select value={promoForm.rank_id} onChange={(e) => setPromoForm({ ...promoForm, rank_id: e.target.value })} dir="rtl" className={inputClass} style={F}>
                <option value="">اختر الدرجة</option>
                {ranks.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
            <Field label="رقم قرار الترقي" className="flex-1 min-w-[180px]">
              <input type="text" value={promoForm.decision_number} onChange={(e) => setPromoForm({ ...promoForm, decision_number: e.target.value })} dir="rtl" className={inputClass} style={F} />
            </Field>
            <button type="button" onClick={handleAddPromotion} className="h-[42px] px-5 rounded-[8px] flex items-center gap-1.5 shrink-0" style={addBtnStyle}>
              <Plus size={14} />
              إضافة ترقية
            </button>
          </div>
        )}

        <div className="p-6">
          {promotions.length === 0 ? (
            <EmptyBox text="لا يوجد ترقيات مسجلة حاليًا" />
          ) : (
            <DataTable heads={["تاريخ الترقي", "الدرجة", "رقم قرار الترقي"]} withActions={canEdit}>
              {promotions.map((p) => (
                <tr key={p.id} className="hover:bg-[#fafbff]">
                  <Cell>{p.promotion_date}</Cell>
                  <Cell bold>{p.rank_name ?? "-"}</Cell>
                  <Cell>{p.decision_number}</Cell>
                  {canEdit && <DeleteCell onClick={() => runDelete("هل تريد حذف هذه الترقية؟", () => deleteMartyrPromotion(p.id))} />}
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </Section>

      {/* المستندات */}
      <Section title="المستندات المرفقة">
        {canEdit && (
          <div className="px-6 pt-5 flex flex-wrap items-end gap-2">
            <Field label="اسم المستند" className="flex-1 min-w-[200px]">
              <input type="text" value={documentName} onChange={(e) => setDocumentName(e.target.value)} placeholder="مثال: قرار الشهادة" dir="rtl" className={inputClass} style={F} />
            </Field>

            <label className="h-[42px] px-5 rounded-[8px] flex items-center gap-1.5 shrink-0 cursor-pointer" style={addBtnStyle}>
              <Upload size={14} />
              {uploadingDocument ? "جاري الرفع..." : "رفع مستند"}
              <input type="file" onChange={handleUploadDocument} disabled={uploadingDocument} className="hidden" />
            </label>
          </div>
        )}

        <div className="p-6">
          {documents.length === 0 ? (
            <EmptyBox text="لا يوجد مستندات مرفقة حاليًا" />
          ) : (
            <div className="flex flex-col gap-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between px-4 py-2.5 rounded-[8px]" style={{ background: "#f7f9fc" }}>
                  <div className="flex items-center gap-2">
                    <FileText size={16} color="#717d96" />
                    <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{doc.document_name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => handleViewDocument(doc.file_path)} className="w-8 h-8 rounded-[6px] flex items-center justify-center" style={{ background: "#DCF4DF" }}>
                      <Download size={14} color="#00522e" />
                    </button>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => runDelete("هل تريد حذف هذا المستند؟", () => deleteMartyrDocument(doc.id, doc.file_path))}
                        className="w-8 h-8 rounded-[6px] flex items-center justify-center"
                        style={{ background: "#fce8f1" }}
                      >
                        <Trash2 size={14} color="#e3282c" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {canEdit && (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleDeleteMartyr}
            className="h-[42px] px-5 rounded-[8px] flex items-center gap-1.5"
            style={{ background: "#fce8f1", ...F, fontSize: 14, color: "#e3282c" }}
          >
            <Trash2 size={14} />
            حذف سجل الشهيد بالكامل
          </button>
        </div>
      )}
    </div>
  );
}