import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowRight, Plus, Trash2, Upload, Printer, FileText, Download, Pencil, Check, X } from "lucide-react";
import logoImg from "../../assets/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";
import { toArabicDigits } from "../../lib/normalizeDigits";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { RELIGIONS, BLOOD_TYPES, HEALTH_STATUSES, EDUCATION_STAGES } from "../../lib/socialConstants";
import {
  fetchSocialRecordByPersonnelId,
  fetchMaritalStatuses,
  upsertSocialRecord,
  addFamilyMember,
  deleteFamilyMember,
  uploadSocialPhoto,
  getSocialPhotoSignedUrl,
  fetchAllUnitOptions,
  fetchAllRankOptions,
  fetchUnitHistory,
  addUnitHistory,
  deleteUnitHistory,
  updateUnitHistoryTransferDate,
  calculateServiceDuration,
  fetchAllGovernorates,
  fetchDistrictsByGovernorate,
  fetchInjuries,
  addInjury,
  deleteInjury,
  fetchDocuments,
  uploadDocument,
  getDocumentSignedUrl,
  deleteDocument,
  CONDUCT_GRADES,
  type SocialRecordFull,
  type MaritalStatus,
  type UnitOption,
  type RankOption,
  type UnitHistoryRow,
  type Governorate,
  type District,
  type SocialRecordInjury,
  type SocialRecordDocument,
    fetchPromotions,
  addPromotion,
  deletePromotion,
  type PromotionRow,
} from "../../lib/socialRecords";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

type MovementMeta = { type: "promotion" | "demotion"; notes: string | null };

const CONSCRIPT_RANK_NAMES = ["عريف مجند", "جندي", "جندى"];

function movementLabel(type: "promotion" | "demotion", rankName: string | null | undefined) {
  if (type === "demotion") return "عزل مجند";
  return rankName === "عريف مجند" ? "ترقي مجند" : "ترقية";
}

export function SocialRecordDetailPage() {
  const { personnelId } = useParams<{ personnelId: string }>();
  const navigate = useNavigate();

  const { loading: checkingAccess, hasPermission } = usePermissions();
  const canEdit = hasPermission("social_record:edit");

  const [data, setData] = useState<SocialRecordFull | null>(null);
  const [maritalStatuses, setMaritalStatuses] = useState<MaritalStatus[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [units, setUnits] = useState<UnitOption[]>([]);
  const [ranks, setRanks] = useState<RankOption[]>([]);
  const [unitHistory, setUnitHistory] = useState<UnitHistoryRow[]>([]);

  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [birthDistricts, setBirthDistricts] = useState<District[]>([]);
  const [addressDistricts, setAddressDistricts] = useState<District[]>([]);

  const [injuries, setInjuries] = useState<SocialRecordInjury[]>([]);
  const [documents, setDocuments] = useState<SocialRecordDocument[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [nationalId, setNationalId] = useState("");
  const [legacyAddress, setLegacyAddress] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [serviceJoinDate, setServiceJoinDate] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [notes, setNotes] = useState("");

  const [religion, setReligion] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [healthStatus, setHealthStatus] = useState("");

  const [birthGovernorateId, setBirthGovernorateId] = useState("");
  const [birthDistrictId, setBirthDistrictId] = useState("");

  const [addressGovernorateId, setAddressGovernorateId] = useState("");
  const [addressDistrictId, setAddressDistrictId] = useState("");
  const [addressDetail, setAddressDetail] = useState("");

  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [newRelation, setNewRelation] = useState("");
  const [newFamilyName, setNewFamilyName] = useState("");
  const [newFamilyNationalId, setNewFamilyNationalId] = useState("");
  const [newFamilyBirthDate, setNewFamilyBirthDate] = useState("");
  const [newFamilyEducationStage, setNewFamilyEducationStage] = useState("");
  const [savingFamily, setSavingFamily] = useState(false);

  const [newUnitMode, setNewUnitMode] = useState<"select" | "free">("select");
  const [newUnitId, setNewUnitId] = useState("");
  const [newUnitNameFree, setNewUnitNameFree] = useState("");
  const [newUnitRankId, setNewUnitRankId] = useState("");
  const [newUnitJoinedAt, setNewUnitJoinedAt] = useState("");
  const [newUnitTransferredAt, setNewUnitTransferredAt] = useState("");
  const [newUnitConductGrade, setNewUnitConductGrade] = useState("");
  const [savingUnit, setSavingUnit] = useState(false);

  const [editingUnitRowId, setEditingUnitRowId] = useState<string | null>(null);
  const [editTransferredAt, setEditTransferredAt] = useState("");
  const [savingTransfer, setSavingTransfer] = useState(false);

  const [newInjuryDate, setNewInjuryDate] = useState("");
  const [newInjuryType, setNewInjuryType] = useState("");
  const [newInjuryDisability, setNewInjuryDisability] = useState("");
  const [newInjuryNotes, setNewInjuryNotes] = useState("");
  const [savingInjury, setSavingInjury] = useState(false);

  const [newDocumentName, setNewDocumentName] = useState("");
  const [uploadingDocument, setUploadingDocument] = useState(false);

    const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [movementMeta, setMovementMeta] = useState<Record<string, MovementMeta>>({});

  const [newPromotionRankId, setNewPromotionRankId] = useState("");
  const [newPromotionDate, setNewPromotionDate] = useState("");
  const [newPromotionDecisionNumber, setNewPromotionDecisionNumber] = useState("");
  const [savingPromotion, setSavingPromotion] = useState(false);

  useEffect(() => {
    if (personnelId) loadAll(personnelId);
  }, [personnelId]);

  async function loadAll(id: string) {
    setLoading(true);
    setError("");

    try {
      const [full, statuses, unitOptions, rankOptions, governorateOptions] = await Promise.all([
        fetchSocialRecordByPersonnelId(id),
        fetchMaritalStatuses(),
        fetchAllUnitOptions(),
        fetchAllRankOptions(),
        fetchAllGovernorates(),
      ]);

      setData(full);
      setMaritalStatuses(statuses);
      setUnits(unitOptions);
      setRanks(rankOptions);
      setGovernorates(governorateOptions);

      setNationalId(full.record?.national_id ?? "");
      setLegacyAddress(full.record?.address ?? null);
      setPhoneNumber(full.record?.phone_number ?? "");
      setMaritalStatus(full.record?.marital_status ?? "");
      setServiceJoinDate(full.record?.service_join_date ?? "");
      setBirthDate(full.record?.birth_date ?? "");
      setNotes(full.record?.notes ?? "");

      setReligion(full.record?.religion ?? "");
      setBloodType(full.record?.blood_type ?? "");
      setHealthStatus(full.record?.health_status ?? "");

      setBirthGovernorateId(full.record?.birth_governorate_id ?? "");
      setBirthDistrictId(full.record?.birth_district_id ?? "");

      setAddressGovernorateId(full.record?.address_governorate_id ?? "");
      setAddressDistrictId(full.record?.address_district_id ?? "");
      setAddressDetail(full.record?.address_detail ?? "");

      setEmergencyContactName(full.record?.emergency_contact_name ?? "");
      setEmergencyContactPhone(full.record?.emergency_contact_phone ?? "");
      setEmergencyContactRelation(full.record?.emergency_contact_relation ?? "");

      if (full.record?.birth_governorate_id) {
        const list = await fetchDistrictsByGovernorate(full.record.birth_governorate_id);
        setBirthDistricts(list);
      } else {
        setBirthDistricts([]);
      }

      if (full.record?.address_governorate_id) {
        const list = await fetchDistrictsByGovernorate(full.record.address_governorate_id);
        setAddressDistricts(list);
      } else {
        setAddressDistricts([]);
      }

      if (full.record?.photo_path) {
        try {
          const url = await getSocialPhotoSignedUrl(full.record.photo_path);
          setPhotoUrl(url);
        } catch {
          setPhotoUrl(null);
        }
      } else {
        setPhotoUrl(null);
      }

      if (full.record) {
        const [history, injuryRows, documentRows, promotionRows] = await Promise.all([
          fetchUnitHistory(full.record.id),
          fetchInjuries(full.record.id),
          fetchDocuments(full.record.id),
          fetchPromotions(full.record.id),
        ]);

        setUnitHistory(history);
        setInjuries(injuryRows);
        setDocuments(documentRows);
        setPromotions(promotionRows);

        // نوع الحركة (ترقي / عزل) + الملاحظات
        const { data: metaRows } = await supabase
          .from("social_record_promotions")
          .select("id, movement_type, notes")
          .eq("social_record_id", full.record.id);

        const meta: Record<string, MovementMeta> = {};
        (metaRows ?? []).forEach((row: any) => {
          meta[row.id] = {
            type: row.movement_type === "demotion" ? "demotion" : "promotion",
            notes: row.notes ?? null,
          };
        });
        setMovementMeta(meta);
      } else {
        setUnitHistory([]);
        setInjuries([]);
        setDocuments([]);
        setPromotions([]);
        setMovementMeta({});
      }
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل السجل");
    } finally {
      setLoading(false);
    }
  }

  async function handleBirthGovernorateChange(governorateId: string) {
    setBirthGovernorateId(governorateId);
    setBirthDistrictId("");

    if (!governorateId) {
      setBirthDistricts([]);
      return;
    }

    try {
      const list = await fetchDistrictsByGovernorate(governorateId);
      setBirthDistricts(list);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل المراكز/الأقسام");
    }
  }

  async function handleAddressGovernorateChange(governorateId: string) {
    setAddressGovernorateId(governorateId);
    setAddressDistrictId("");

    if (!governorateId) {
      setAddressDistricts([]);
      return;
    }

    try {
      const list = await fetchDistrictsByGovernorate(governorateId);
      setAddressDistricts(list);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل المراكز/الأقسام");
    }
  }

  async function getCurrentUserInfo() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { userId: null, userName: "غير معروف" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    return { userId: user.id, userName: profile?.username ?? "غير معروف" };
  }

  function buildUpsertPayload(personnel_id: string, userId: string | null, userName: string) {
    return {
      personnel_id,
      national_id: nationalId.trim() || null,
      address: legacyAddress,
      phone_number: phoneNumber.trim() || null,
      marital_status: maritalStatus || null,
      service_join_date: serviceJoinDate || null,
      birth_date: birthDate || null,
      notes: notes.trim() || null,
      updated_by: userId,
      updated_by_name: userName,

      religion: religion || null,
      blood_type: bloodType || null,
      health_status: healthStatus || null,

      birth_governorate_id: birthGovernorateId || null,
      birth_district_id: birthDistrictId || null,

      address_governorate_id: addressGovernorateId || null,
      address_district_id: addressDistrictId || null,
      address_detail: addressDetail.trim() || null,

      emergency_contact_name: emergencyContactName.trim() || null,
      emergency_contact_phone: emergencyContactPhone.trim() || null,
      emergency_contact_relation: emergencyContactRelation.trim() || null,
    };
  }

  async function handleSave() {
    if (!personnelId) return;

    setSaving(true);
    setError("");

    try {
      const { userId, userName } = await getCurrentUserInfo();

      await upsertSocialRecord(buildUpsertPayload(personnelId, userId, userName));

      setSuccessMsg("تم حفظ البيانات بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);

      await loadAll(personnelId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!personnelId) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setError("");

    try {
      const path = await uploadSocialPhoto(personnelId, file);
      const { userId, userName } = await getCurrentUserInfo();

      await upsertSocialRecord(buildUpsertPayload(personnelId, userId, userName));

      await supabase.from("social_records").update({ photo_path: path }).eq("personnel_id", personnelId);

      await loadAll(personnelId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  async function handleAddFamilyMember() {
    if (!data?.record) {
      setError("احفظ البيانات الاجتماعية أولًا قبل إضافة أفراد الأسرة");
      return;
    }

    if (!newRelation.trim() || !newFamilyName.trim()) {
      setError("الصلة والاسم مطلوبان");
      return;
    }

    setSavingFamily(true);
    setError("");

    try {
      await addFamilyMember({
        social_record_id: data.record.id,
        relation: newRelation.trim(),
        full_name: newFamilyName.trim(),
        national_id: newFamilyNationalId.trim() || null,
        birth_date: newFamilyBirthDate || null,
        education_stage: newFamilyEducationStage || null,
        notes: null,
      });

      setNewRelation("");
      setNewFamilyName("");
      setNewFamilyNationalId("");
      setNewFamilyBirthDate("");
      setNewFamilyEducationStage("");

      if (personnelId) await loadAll(personnelId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إضافة فرد الأسرة");
    } finally {
      setSavingFamily(false);
    }
  }

  async function handleDeleteFamilyMember(id: string) {
    if (!window.confirm("هل تريد حذف فرد الأسرة هذا؟")) return;

    try {
      await deleteFamilyMember(id);
      if (personnelId) await loadAll(personnelId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء الحذف");
    }
  }

  async function handleAddUnitHistory() {
    if (!data?.record) {
      setError("احفظ البيانات الاجتماعية أولًا قبل إضافة وحدة");
      return;
    }

    if (newUnitMode === "select" && !newUnitId) {
      setError("اختر الوحدة");
      return;
    }

    if (newUnitMode === "free" && !newUnitNameFree.trim()) {
      setError("اكتب اسم الوحدة");
      return;
    }

    if (!newUnitJoinedAt) {
      setError("تاريخ الانضمام مطلوب");
      return;
    }

    setSavingUnit(true);
    setError("");

    try {
      await addUnitHistory({
        social_record_id: data.record.id,
        unit_id: newUnitMode === "select" ? newUnitId : null,
        unit_name_free: newUnitMode === "free" ? newUnitNameFree.trim() : null,
        rank_id: newUnitRankId || null,
        joined_at: newUnitJoinedAt,
        transferred_at: newUnitTransferredAt || null,
        conduct_grade: newUnitConductGrade || null,
      });

      setNewUnitId("");
      setNewUnitNameFree("");
      setNewUnitRankId("");
      setNewUnitJoinedAt("");
      setNewUnitTransferredAt("");
      setNewUnitConductGrade("");

      if (personnelId) await loadAll(personnelId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إضافة الوحدة");
    } finally {
      setSavingUnit(false);
    }
  }

  async function handleDeleteUnitHistory(id: string) {
    if (!window.confirm("هل تريد حذف هذا السجل؟")) return;

    try {
      await deleteUnitHistory(id);
      if (personnelId) await loadAll(personnelId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء الحذف");
    }
  }
    async function handleAddPromotion() {
    if (!data?.record) {
      setError("احفظ البيانات الاجتماعية أولًا قبل إضافة ترقية");
      return;
    }

    if (!newPromotionRankId) {
      setError("اختر الدرجة");
      return;
    }

    if (!newPromotionDate) {
      setError("تاريخ الترقي مطلوب");
      return;
    }

    if (!newPromotionDecisionNumber.trim()) {
      setError("رقم قرار الترقي مطلوب");
      return;
    }

    setSavingPromotion(true);
    setError("");

    try {
      await addPromotion({
        social_record_id: data.record.id,
        rank_id: newPromotionRankId,
        promotion_date: newPromotionDate,
        decision_number: newPromotionDecisionNumber.trim(),
      });

      setNewPromotionRankId("");
      setNewPromotionDate("");
      setNewPromotionDecisionNumber("");

      if (personnelId) await loadAll(personnelId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إضافة الترقية");
    } finally {
      setSavingPromotion(false);
    }
  }

  async function handleDeletePromotion(id: string) {
    const row = promotions.find((p) => p.id === id);
    const meta = movementMeta[id];

    const isConscriptMovement =
      meta?.type === "demotion" || CONSCRIPT_RANK_NAMES.includes(row?.rank_name ?? "");

    const message = isConscriptMovement
      ? "تنبيه: حذف حركة ترقي/عزل المجند من هنا بيمسح السطر من السجل بس، ومش بيرجّع درجة الفرد.\nلو عايز تلغي الحركة فعلًا، اعمل حركة عكسية من صفحة «ترقي المجندين».\n\nهل تريد حذف السطر؟"
      : "هل تريد حذف هذه الترقية؟";

    if (!window.confirm(message)) return;

    try {
      await deletePromotion(id);
      if (personnelId) await loadAll(personnelId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء الحذف");
    }
  }

  function startEditTransfer(row: UnitHistoryRow) {
    setEditingUnitRowId(row.id);
    setEditTransferredAt(row.transferred_at ?? "");
    setError("");
  }

  function cancelEditTransfer() {
    setEditingUnitRowId(null);
    setEditTransferredAt("");
  }

  async function handleSaveTransfer(row: UnitHistoryRow) {
    if (editTransferredAt && editTransferredAt < row.joined_at) {
      setError("تاريخ الانتقال لا يمكن أن يكون قبل تاريخ الانضمام");
      return;
    }

    setSavingTransfer(true);
    setError("");

    try {
      await updateUnitHistoryTransferDate(row.id, editTransferredAt || null);
      cancelEditTransfer();

      if (personnelId) await loadAll(personnelId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحديث تاريخ الانتقال");
    } finally {
      setSavingTransfer(false);
    }
  }

  async function handleAddInjury() {
    if (!data?.record) {
      setError("احفظ البيانات الاجتماعية أولًا قبل إضافة إصابة");
      return;
    }

    if (!newInjuryDate || !newInjuryType.trim()) {
      setError("تاريخ الإصابة ونوعها مطلوبان");
      return;
    }

    setSavingInjury(true);
    setError("");

    try {
      await addInjury({
        social_record_id: data.record.id,
        injury_date: newInjuryDate,
        injury_type: newInjuryType.trim(),
        disability_percentage: newInjuryDisability ? Number(newInjuryDisability) : null,
        notes: newInjuryNotes.trim() || null,
      });

      setNewInjuryDate("");
      setNewInjuryType("");
      setNewInjuryDisability("");
      setNewInjuryNotes("");

      if (personnelId) await loadAll(personnelId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إضافة الإصابة");
    } finally {
      setSavingInjury(false);
    }
  }

  async function handleDeleteInjury(id: string) {
    if (!window.confirm("هل تريد حذف سجل الإصابة هذا؟")) return;

    try {
      await deleteInjury(id);
      if (personnelId) await loadAll(personnelId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء الحذف");
    }
  }

  async function handleUploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    if (!data?.record) {
      setError("احفظ البيانات الاجتماعية أولًا قبل رفع مستند");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (!newDocumentName.trim()) {
      setError("اكتب اسم المستند أولًا");
      e.target.value = "";
      return;
    }

    setUploadingDocument(true);
    setError("");

    try {
      await uploadDocument(data.record.id, newDocumentName.trim(), file);
      setNewDocumentName("");

      if (personnelId) await loadAll(personnelId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء رفع المستند");
    } finally {
      setUploadingDocument(false);
      e.target.value = "";
    }
  }

  async function handleViewDocument(filePath: string) {
    try {
      const url = await getDocumentSignedUrl(filePath);
      window.open(url, "_blank");
    } catch (err: any) {
      setError(err?.message || "تعذر فتح المستند");
    }
  }

  async function handleDeleteDocument(id: string, filePath: string) {
    if (!window.confirm("هل تريد حذف هذا المستند؟")) return;

    try {
      await deleteDocument(id, filePath);
      if (personnelId) await loadAll(personnelId);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء الحذف");
    }
  }

  async function handlePrint() {
    if (!data) return;

    const printWindow = window.open("", "_blank", "width=1000,height=1200");

    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للمتصفح حتى تتم الطباعة.");
      return;
    }

    printWindow.document.write(
      `<p style="font-family:Arial,sans-serif;text-align:center;margin-top:40px;direction:rtl;">جاري تجهيز الطباعة...</p>`
    );

    const attachmentItems = await Promise.all(
      documents.map(async (doc) => {
        const isImage = /\.(png|jpe?g|gif|webp|bmp)$/i.test(doc.file_path);

        if (!isImage) {
          return { name: doc.document_name, url: null as string | null, isImage: false };
        }

        try {
          const url = await getDocumentSignedUrl(doc.file_path);
          return { name: doc.document_name, url, isImage: true };
        } catch {
          return { name: doc.document_name, url: null as string | null, isImage: true };
        }
      })
    );

    const maritalStatusLabel =
      maritalStatuses.find((s) => s.code === maritalStatus)?.name ?? "-";

    const birthGovernorateLabel = governorates.find((g) => g.id === birthGovernorateId)?.name ?? "-";
    const birthDistrictLabel = birthDistricts.find((d) => d.id === birthDistrictId)?.name ?? "-";
    const addressGovernorateLabel = governorates.find((g) => g.id === addressGovernorateId)?.name ?? "-";
    const addressDistrictLabel = addressDistricts.find((d) => d.id === addressDistrictId)?.name ?? "-";

    const ar = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined || value === "") return "-";
      return toArabicDigits(String(value));
    };

    const familyRowsHtml = data.familyMembers.length
      ? data.familyMembers
          .map(
            (m) => `
        <tr>
          <td>${m.relation}</td>
          <td>${m.full_name}</td>
          <td>${ar(m.national_id)}</td>
          <td>${ar(m.birth_date)}</td>
          <td>${m.education_stage ?? "-"}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="5" class="empty-row">لا يوجد أفراد أسرة مسجلين</td></tr>`;

    const unitRowsHtml = unitHistory.length
      ? unitHistory
          .map(
            (u) => `
        <tr>
          <td>${u.unit_name_resolved}</td>
          <td>${u.rank_name ?? "-"}</td>
          <td>${ar(u.joined_at)}</td>
          <td>${u.transferred_at ? ar(u.transferred_at) : "حتى الآن"}</td>
          <td>${ar(calculateServiceDuration(u.joined_at, u.transferred_at))}</td>
          <td>${u.conduct_grade ?? "-"}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="6" class="empty-row">لا يوجد سجل وحدات مضاف</td></tr>`;
    const promotionRowsHtml = promotions.length
      ? promotions
          .map((p) => {
            const meta = movementMeta[p.id];
            const type = meta?.type ?? "promotion";
            return `
        <tr>
          <td>${ar(p.promotion_date)}</td>
          <td>${p.rank_name ?? "-"}</td>
          <td>${ar(p.decision_number)}</td>
          <td>${movementLabel(type, p.rank_name)}</td>
          <td>${meta?.notes ?? "-"}</td>
        </tr>`;
          })
          .join("")
      : `<tr><td colspan="5" class="empty-row">لا يوجد ترقيات مسجلة</td></tr>`;
    const injuryRowsHtml = injuries.length
      ? injuries
          .map(
            (inj) => `
        <tr>
          <td>${ar(inj.injury_date)}</td>
          <td>${inj.injury_type}</td>
          <td>${inj.disability_percentage !== null ? ar(inj.disability_percentage) + "%" : "-"}</td>
          <td>${inj.notes ?? "-"}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="4" class="empty-row">لا يوجد إصابات مسجلة</td></tr>`;

    const attachmentsHtml = attachmentItems.length
      ? `
        <div class="page attachments-page">
          <div class="section-title" style="margin-top:0;">المستندات المرفقة - ${data.personnel.full_name}</div>

          <div class="attachments-grid">
            ${attachmentItems
              .map(
                (item) => `
              <div class="attachment-item">
                <div class="attachment-caption">${item.name}</div>
                <div class="attachment-img-box">
                  ${
                    item.isImage && item.url
                      ? `<img src="${item.url}" />`
                      : `<div class="attachment-placeholder">${
                          item.isImage ? "تعذر تحميل الصورة" : "ملف غير صورة (لا يُعرض في الطباعة)"
                        }</div>`
                  }
                </div>
              </div>`
              )
              .join("")}
          </div>
        </div>`
      : "";
    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>بيان تفصيلي لفرد - ${data.personnel.full_name}</title>

          <style>
          
            @page {
              size: A4;
              margin: 0;
            }

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

            .page {
              padding: 0 16mm;
            }

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

            .header-text {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }

            .header-title {
              font-size: 18px;
              font-weight: 700;
            }

            .header-subtitle {
              font-size: 14px;
              font-weight: 700;
            }

            .header-system {
              font-size: 12px;
              color: #717d96;
            }

            .header-logo {
              width: 64px;
              height: 64px;
              object-fit: contain;
            }

            .header-title-box {
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);

              border-radius: 6px;
              padding: 6px 18px;
              font-size: 18px;
              font-weight: 700;
              text-decoration: underline;
              white-space: nowrap;
            }

            .section-title {
              font-size: 15px;
              font-weight: 700;
              background: #f7f9fc;
              padding: 6px 10px;
              border-radius: 6px;
              margin-top: 16px;
              margin-bottom: 8px;
            }

            .info-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px 16px;
            }

            .info-item {
              display: flex;
              gap: 4px;
              font-size: 13px;
              border-bottom: 1px dashed #e2e7f0;
              padding-bottom: 4px;
            }

            .info-label {
              color: #717d96;
              white-space: nowrap;
            }

            .info-value {
              font-weight: 700;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-top: 4px;
            }

            th, td {
              border: 1px solid #e2e7f0;
              padding: 6px 8px;
              text-align: center;
            }

            th {
              background: #f7f9fc;
              font-weight: 700;
            }

            .empty-row {
              color: #a1aebe;
              padding: 12px;
            }
            .basic-info-row {
              display: flex;
              align-items: flex-start;
              gap: 16px;
            }
            .section-block {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .section-title {
              break-after: avoid;
              page-break-after: avoid;
            }

            thead {
              display: table-header-group;
            }

             table:not(.layout) tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .photo-box-inline {
              width: 90px;
              height: 90px;
              border-radius: 12px;
              overflow: hidden;
              background: #f7f9fc;
              border: 1px solid #e2e7f0;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              text-align: center;
            }

                   .photo-box-inline img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              object-position: top;
            }
            table.layout {
              width: 100%;
              border: none;
              border-collapse: collapse;
            }

            table.layout > thead > tr > td,
            table.layout > tfoot > tr > td,
            table.layout > tbody > tr > td {
              border: none;
              padding: 0;
              text-align: right;
            }

            .spacer {
              height: 14mm;
            }
            .attachments-page {
              page-break-before: always;
              break-before: page;
              -webkit-box-decoration-break: clone;
              box-decoration-break: clone;
            }

                    .attachments-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 14px;
            }

            .attachment-item {
              display: flex;
              flex-direction: column;
              border: 1px solid #e2e7f0;
              border-radius: 8px;
              overflow: hidden;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .attachment-caption {
              order: -1;
              font-size: 12px;
              font-weight: 700;
              text-align: center;
              background: #f7f9fc;
              padding: 6px 8px;
              border-bottom: 1px solid #e2e7f0;
            }

            .attachment-img-box {
              height: 110mm;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #fff;
              padding: 6px;
            }

            .attachment-img-box img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }

            .attachment-placeholder {
              color: #a1aebe;
              font-size: 12px;
              text-align: center;
            }
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


              <div class="header-title-box">السجل الاجتماعي للفرد </div>

              <img src="${logoImg}" class="header-logo" />
            </div>

                <!-- الهيدر: صورة + الدرجة / الاسم + الرقم العسكري -->
            <div class="basic-info-row" style="align-items:center; margin-top:10px; padding:10px 12px; background:#f7f9fc; border:1px solid #e2e7f0; border-radius:10px;">
              <div class="photo-box-inline" style="width:80px;height:100px;">
                ${
                  photoUrl
                    ? `<img src="${photoUrl}" />`
                    : `<span style="font-size:11px;color:#a1aebe;">لا توجد صورة</span>`
                }
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <div style="font-size:17px;font-weight:700;">${data.personnel.rank_name ?? "-"} / ${data.personnel.full_name}</div>
                <div style="font-size:13px;">
                  <span style="color:#717d96;">الرقم العسكري:</span>
                  <span style="font-weight:700;">${ar(data.personnel.military_number)}</span>
                </div>
              </div>
            </div>

            <!-- البيانات الأساسية -->
            <div class="section-title">البيانات الأساسية</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">الرقم العسكري:</span><span class="info-value">${ar(data.personnel.military_number)}</span></div>
              <div class="info-item"><span class="info-label">الدرجة:</span><span class="info-value">${data.personnel.rank_name ?? "-"}</span></div>
              <div class="info-item"><span class="info-label">الاسم:</span><span class="info-value">${data.personnel.full_name}</span></div>
              <div class="info-item"><span class="info-label">الوحدة:</span><span class="info-value">${data.personnel.unit_name ?? "-"}</span></div>
              <div class="info-item"><span class="info-label">الوظيفة:</span><span class="info-value">${data.personnel.job_name ?? "-"}</span></div>
              <div class="info-item"><span class="info-label">المستوى التعليمي:</span><span class="info-value">${data.personnel.education_level_name ?? "-"}</span></div>
              <div class="info-item"><span class="info-label">الإدارة/السلاح:</span><span class="info-value">${data.personnel.administration_name ?? "-"}</span></div>
              <div class="info-item"><span class="info-label">تاريخ الالتحاق بالخدمة:</span><span class="info-value">${ar(serviceJoinDate)}</span></div>
              <div class="info-item"><span class="info-label">فصيلة الدم:</span><span class="info-value">${bloodType || "-"}</span></div>
            </div>

            <!-- البيانات الشخصية -->
            <div class="section-title">البيانات الشخصية</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">الرقم القومي:</span><span class="info-value">${ar(nationalId)}</span></div>
              <div class="info-item"><span class="info-label">تاريخ الميلاد:</span><span class="info-value">${ar(birthDate)}</span></div>
              <div class="info-item"><span class="info-label">الحالة الاجتماعية:</span><span class="info-value">${maritalStatusLabel}</span></div>
              <div class="info-item"><span class="info-label">الديانة:</span><span class="info-value">${religion || "-"}</span></div>
              <div class="info-item"><span class="info-label">رقم الهاتف:</span><span class="info-value">${ar(phoneNumber)}</span></div>
              <div class="info-item"><span class="info-label">محل الميلاد (المحافظة):</span><span class="info-value">${birthGovernorateLabel}</span></div>
              <div class="info-item"><span class="info-label">محل الميلاد (المركز/القسم):</span><span class="info-value">${birthDistrictLabel}</span></div>
            </div>

            <!-- العنوان -->
            <div class="section-title">العنوان</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">المحافظة:</span><span class="info-value">${addressGovernorateLabel}</span></div>
              <div class="info-item"><span class="info-label">المركز/القسم:</span><span class="info-value">${addressDistrictLabel}</span></div>
              <div class="info-item"><span class="info-label">تفاصيل العنوان:</span><span class="info-value">${addressDetail ? ar(addressDetail) : "-"}</span></div>
              <div class="info-item" style="grid-column: span 3;"><span class="info-label">ملاحظات:</span><span class="info-value">${notes ? ar(notes) : "-"}</span></div>
            </div>

            <!-- جهة الاتصال في حالات الطوارئ -->
            <div class="section-title">جهة الاتصال في حالات الطوارئ</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">اسم القريب:</span><span class="info-value">${emergencyContactName || "-"}</span></div>
              <div class="info-item"><span class="info-label">صلة القرابة:</span><span class="info-value">${emergencyContactRelation || "-"}</span></div>
              <div class="info-item"><span class="info-label">رقم الهاتف:</span><span class="info-value">${ar(emergencyContactPhone)}</span></div>
            </div>

            <!-- الحالة الصحية + سجل الإصابات -->
            <div class="section-title">الحالة الصحية</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">الحالة الصحية العامة:</span><span class="info-value">${healthStatus || "-"}</span></div>
            </div>
            <div style="font-size:13px;font-weight:700;margin-top:10px;">سجل الإصابات</div>
            <table>
              <thead>
                <tr>
                  <th>تاريخ الإصابة</th>
                  <th>نوع الإصابة</th>
                  <th>نسبة العجز</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>${injuryRowsHtml}</tbody>
            </table>

            <!-- أفراد الأسرة -->
            <div class="section-title">أفراد الأسرة</div>
            <table>
              <thead>
                <tr>
                  <th>الصلة</th>
                  <th>الاسم</th>
                  <th>الرقم القومي</th>
                  <th>تاريخ الميلاد</th>
                  <th>المرحلة التعليمية</th>
                </tr>
              </thead>
              <tbody>${familyRowsHtml}</tbody>
            </table>

            <!-- الوحدات -->
            <div class="section-block">
                        <div class="section-title">الوحدات</div>
            <table>
              <thead>
                <tr>
                  <th>اسم الوحدة</th>
                  <th>الدرجة أثناء الخدمة</th>
                  <th>تاريخ الانضمام</th>
                  <th>تاريخ الانتقال</th>
                  <th>مدة الخدمة</th>
                  <th>درجة الأخلاق</th>
                </tr>
              </thead>
              <tbody>${unitRowsHtml}</tbody>
            </table>
            </div>

                     <div class="section-block">
                        <!-- سجل الترقي -->
            <div class="section-title">سجل الترقي</div>
            <table>
              <thead>
                <tr>
                  <th>تاريخ الترقي</th>
                  <th>الدرجة</th>
                  <th>رقم قرار الترقي</th>
                  <th>الحركة</th>
                  <th>ملاحظات / السبب</th>
                </tr>
              </thead>
              <tbody>${promotionRowsHtml}</tbody>
            </table>
          </div>
            </div>
                  </div>
                            ${attachmentsHtml}
                </td>
              </tr>
            </tbody>
          </table>



        </body>
      </html>
    `);

    printWindow.document.close();

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

  if (loading || checkingAccess) {
    return (
      <div className="flex items-center justify-center w-full min-h-[400px]" dir="rtl">
        <span style={{ ...F, fontSize: 16, color: "#717d96" }}>جاري تحميل السجل...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[400px] gap-4" dir="rtl">
        <span style={{ ...F, fontSize: 16, color: "#e34040" }}>{error || "لم يتم العثور على الفرد"}</span>
      </div>
    );
  }

  const inputClass =
    "h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] disabled:bg-[#f7f9fc] disabled:text-[#717d96] bg-white";

  const readOnlyClass =
    "h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none bg-[#f7f9fc] text-[#717d96] cursor-default";
  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 style={{ ...F, fontWeight: 700, fontSize: "clamp(20px,3.5vw,28px)", color: "#2d3648" }}>
          السجل الاجتماعي للفرد
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
            onClick={() => navigate("/dashboard/social-record")}
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
      {/* الهيدر: صورة + الدرجة / الاسم + الرقم العسكري */}
      <section
        className="rounded-[20px] p-6 flex flex-wrap items-center gap-6"
        style={{ background: "linear-gradient(135deg,#f7f9fc,#eff5f0)", border: "1px solid #eff0f6" }}
      >
        <div className="flex flex-col items-center gap-2 shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              className="w-30 h-30 object-cover rounded-[12] border-2"
              style={{ borderColor: "#a1aebe" }}
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

        <div className="flex flex-col gap-2">
          <span style={{ ...F, fontSize: 20, fontWeight: 700, color: "#2d3648" }}>
            {data.personnel.rank_name ?? "-"} / {data.personnel.full_name}
          </span>

          <div className="flex items-center gap-2">
            <span style={{ ...F, fontSize: 13, color: "#717d96" }}>الرقم العسكري:</span>
            <span style={{ ...F, fontSize: 15, fontWeight: 700, color: "#2d3648" }}>
              {data.personnel.military_number ?? "-"}
            </span>
          </div>
        </div>
      </section>
          {/* البيانات الأساسية */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>البيانات الأساسية</span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(
            [
              ["الرقم العسكري", data.personnel.military_number],
              ["الدرجة", data.personnel.rank_name],
              ["الاسم", data.personnel.full_name],
              ["الوحدة", data.personnel.unit_name],
              ["الوظيفة", data.personnel.job_name],
              ["المستوى التعليمي", data.personnel.education_level_name],
              ["الإدارة/السلاح", data.personnel.administration_name],
            ] as [string, string | null | undefined][]
          ).map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label style={{ ...F, fontSize: 13, color: "#717d96" }}>{label}</label>
              <input type="text" value={value ?? "-"} readOnly dir="rtl" className={readOnlyClass} style={F} />
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>تاريخ الالتحاق بالخدمة</label>
            <input
              type="date"
              value={serviceJoinDate}
              onChange={(e) => setServiceJoinDate(e.target.value)}
              disabled={!canEdit}
              className={inputClass}
              style={F}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>فصيلة الدم</label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              disabled={!canEdit}
              dir="rtl"
              className={inputClass}
              style={F}
            >
              <option value="">اختر فصيلة الدم</option>
              {BLOOD_TYPES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {canEdit && (
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-[44px] px-6 rounded-[8px] disabled:opacity-50"
                style={{ background: "#DCF4DF", ...F, fontSize: 14, color: "#2d3648" }}
              >
                {saving ? "جاري الحفظ..." : "حفظ البيانات"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* البيانات الشخصية */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>البيانات الشخصية</span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>الرقم القومي</label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              disabled={!canEdit}
              dir="rtl"
              className={inputClass}
              style={F}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>تاريخ الميلاد</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={!canEdit}
              className={inputClass}
              style={F}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>الحالة الاجتماعية</label>
            <select
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value)}
              disabled={!canEdit}
              dir="rtl"
              className={inputClass}
              style={F}
            >
              <option value="">اختر الحالة</option>
              {maritalStatuses.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>الديانة</label>
            <select
              value={religion}
              onChange={(e) => setReligion(e.target.value)}
              disabled={!canEdit}
              dir="rtl"
              className={inputClass}
              style={F}
            >
              <option value="">اختر الديانة</option>
              {RELIGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>رقم الهاتف</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={!canEdit}
              dir="rtl"
              className={inputClass}
              style={F}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>محل الميلاد (المحافظة)</label>
            <select
              value={birthGovernorateId}
              onChange={(e) => handleBirthGovernorateChange(e.target.value)}
              disabled={!canEdit}
              dir="rtl"
              className={inputClass}
              style={F}
            >
              <option value="">اختر المحافظة</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>محل الميلاد (المركز/القسم)</label>
            <select
              value={birthDistrictId}
              onChange={(e) => setBirthDistrictId(e.target.value)}
              disabled={!canEdit || !birthGovernorateId}
              dir="rtl"
              className={inputClass}
              style={F}
            >
              <option value="">اختر المركز/القسم</option>
              {birthDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {canEdit && (
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-[44px] px-6 rounded-[8px] disabled:opacity-50"
                style={{ background: "#DCF4DF", ...F, fontSize: 14, color: "#2d3648" }}
              >
                {saving ? "جاري الحفظ..." : "حفظ البيانات"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* العنوان */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>العنوان</span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>العنوان (المحافظة)</label>
            <select
              value={addressGovernorateId}
              onChange={(e) => handleAddressGovernorateChange(e.target.value)}
              disabled={!canEdit}
              dir="rtl"
              className={inputClass}
              style={F}
            >
              <option value="">اختر المحافظة</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>العنوان (المركز/القسم)</label>
            <select
              value={addressDistrictId}
              onChange={(e) => setAddressDistrictId(e.target.value)}
              disabled={!canEdit || !addressGovernorateId}
              dir="rtl"
              className={inputClass}
              style={F}
            >
              <option value="">اختر المركز/القسم</option>
              {addressDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>تفاصيل العنوان</label>
            <input
              type="text"
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              disabled={!canEdit}
              placeholder="اسم الشارع / رقم المنزل..."
              dir="rtl"
              className={inputClass}
              style={F}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canEdit}
              rows={3}
              dir="rtl"
              className="rounded-[8px] border border-[#e2e7f0] px-3 py-2 text-right outline-none resize-none focus:border-[#00b867] disabled:bg-[#f7f9fc] bg-white"
              style={F}
            />
          </div>

          {canEdit && (
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-[44px] px-6 rounded-[8px] disabled:opacity-50"
                style={{ background: "#DCF4DF", ...F, fontSize: 14, color: "#2d3648" }}
              >
                {saving ? "جاري الحفظ..." : "حفظ البيانات"}
              </button>
            </div>
          )}
        </div>
      </section>
      {/* جهة الاتصال في حالات الطوارئ */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>جهة الاتصال في حالات الطوارئ</span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>اسم القريب</label>
            <input
              type="text"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              disabled={!canEdit}
              dir="rtl"
              className={inputClass}
              style={F}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>صلة القرابة</label>
            <input
              type="text"
              value={emergencyContactRelation}
              onChange={(e) => setEmergencyContactRelation(e.target.value)}
              disabled={!canEdit}
              dir="rtl"
              className={inputClass}
              style={F}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>رقم الهاتف</label>
            <input
              type="text"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              disabled={!canEdit}
              dir="rtl"
              className={inputClass}
              style={F}
            />
          </div>

          {canEdit && (
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-[44px] px-6 rounded-[8px] disabled:opacity-50"
 style={{ background: "#DCF4DF", ...F, fontSize: 14, color: "#2d3648" }}
              >
                {saving ? "جاري الحفظ..." : "حفظ البيانات"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* الحالة الصحية + سجل الإصابات */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>الحالة الصحية</span>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 sm:w-[260px]">
            <label style={{ ...F, fontSize: 13, color: "#717d96" }}>الحالة الصحية العامة</label>
            <select
              value={healthStatus}
              onChange={(e) => setHealthStatus(e.target.value)}
              disabled={!canEdit}
              dir="rtl"
              className={inputClass}
              style={F}
            >
              <option value="">اختر الحالة</option>
              {HEALTH_STATUSES.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-[44px] px-6 rounded-[8px] disabled:opacity-50 w-fit"
               style={{ background: "#DCF4DF", ...F, fontSize: 14, color: "#2d3648" }}
            >
              {saving ? "جاري الحفظ..." : "حفظ البيانات"}
            </button>
          )}

          <div>
            <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>سجل الإصابات</span>
          </div>

          {canEdit && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1 w-[160px]">
                <label style={{ ...F, fontSize: 12, color: "#717d96" }}>تاريخ الإصابة</label>
                <input
                  type="date"
                  value={newInjuryDate}
                  onChange={(e) => setNewInjuryDate(e.target.value)}
                  className={inputClass}
                  style={{ ...F, height: 42 }}
                />
              </div>

              <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                <label style={{ ...F, fontSize: 12, color: "#717d96" }}>نوع الإصابة</label>
                <input
                  type="text"
                  value={newInjuryType}
                  onChange={(e) => setNewInjuryType(e.target.value)}
                  placeholder="وصف الإصابة"
                  dir="rtl"
                  className={inputClass}
                  style={{ ...F, height: 42 }}
                />
              </div>

              <div className="flex flex-col gap-1 w-[140px]">
                <label style={{ ...F, fontSize: 12, color: "#717d96" }}>نسبة العجز (%)</label>
                <input
                  type="number"
                  value={newInjuryDisability}
                  onChange={(e) => setNewInjuryDisability(e.target.value)}
                  min={0}
                  max={100}
                  className={inputClass}
                  style={{ ...F, height: 42 }}
                />
              </div>

              <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                <label style={{ ...F, fontSize: 12, color: "#717d96" }}>ملاحظات</label>
                <input
                  type="text"
                  value={newInjuryNotes}
                  onChange={(e) => setNewInjuryNotes(e.target.value)}
                  dir="rtl"
                  className={inputClass}
                  style={{ ...F, height: 42 }}
                />
              </div>

              <button
                type="button"
                onClick={handleAddInjury}
                disabled={savingInjury}
                className="h-[42px] px-5 rounded-[8px] flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                 style={{ background: "#DCF4DF", ...F, fontSize: 14, color: "#2d3648" }}
              >
                <Plus size={14} />
                إضافة إصابة
              </button>
            </div>
          )}

          {injuries.length === 0 ? (
            <div className="rounded-[8px] py-4 text-center" style={{ background: "#f7f9fc" }}>
              <span style={{ ...F, fontSize: 13, color: "#a1aebe" }}>لا يوجد إصابات مسجلة</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>تاريخ الإصابة</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>نوع الإصابة</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>نسبة العجز</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>ملاحظات</span>
                    </th>
                    {canEdit && <th className="px-4 py-2.5 border-b border-[#e2e7f0] bg-[#f7f9fc]" />}
                  </tr>
                </thead>
                <tbody>
                  {injuries.map((inj) => (
                    <tr key={inj.id} className="hover:bg-[#fafbff]">
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{inj.injury_date}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{inj.injury_type}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                          {inj.disability_percentage !== null ? `${inj.disability_percentage}%` : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>{inj.notes ?? "-"}</span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                          <button
                            type="button"
                            onClick={() => handleDeleteInjury(inj.id)}
                            className="w-8 h-8 rounded-[6px] flex items-center justify-center"
                            style={{ background: "#fce8f1" }}
                          >
                            <Trash2 size={14} color="#e3282c" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* أفراد الأسرة */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>أفراد الأسرة</span>
        </div>

        {canEdit && (
          <div className="px-6 pt-5 flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1 w-[140px]">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>الصلة</label>
              <input
                type="text"
                value={newRelation}
                onChange={(e) => setNewRelation(e.target.value)}
                placeholder="اختر الصلة"
                dir="rtl"
                className={inputClass}
                style={{ ...F, height: 42 }}
              />
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>الاسم</label>
              <input
                type="text"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                placeholder="اسم فرد الأسرة"
                dir="rtl"
                className={inputClass}
                style={{ ...F, height: 42 }}
              />
            </div>

            <div className="flex flex-col gap-1 w-[180px]">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>الرقم القومي</label>
              <input
                type="text"
                value={newFamilyNationalId}
                onChange={(e) => setNewFamilyNationalId(e.target.value)}
                placeholder="الرقم القومي"
                dir="rtl"
                className={inputClass}
                style={{ ...F, height: 42 }}
              />
            </div>

            <div className="flex flex-col gap-1 w-[160px]">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>تاريخ الميلاد</label>
              <input
                type="date"
                value={newFamilyBirthDate}
                onChange={(e) => setNewFamilyBirthDate(e.target.value)}
                className={inputClass}
                style={{ ...F, height: 42 }}
              />
            </div>

            <div className="flex flex-col gap-1 w-[170px]">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>المرحلة التعليمية</label>
              <select
                value={newFamilyEducationStage}
                onChange={(e) => setNewFamilyEducationStage(e.target.value)}
                dir="rtl"
                className={inputClass}
                style={{ ...F, height: 42 }}
              >
                <option value="">اختر المرحلة</option>
                {EDUCATION_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleAddFamilyMember}
              disabled={savingFamily}
              className="h-[42px] px-5 rounded-[8px] flex items-center gap-1.5 shrink-0 disabled:opacity-50"
               style={{ background: "#DCF4DF", ...F, fontSize: 14, color: "#2d3648" }}
            >
              <Plus size={14} />
              إضافة فرد
            </button>
          </div>
        )}

        <div className="p-6">
          {data.familyMembers.length === 0 ? (
            <div className="rounded-[8px] py-4 text-center" style={{ background: "#f7f9fc" }}>
              <span style={{ ...F, fontSize: 13, color: "#a1aebe" }}>لا يوجد أفراد أسرة مضافين حاليًا</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الصلة</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الاسم</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الرقم القومي</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>تاريخ الميلاد</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>المرحلة التعليمية</span>
                    </th>
                    {canEdit && <th className="px-4 py-2.5 border-b border-[#e2e7f0] bg-[#f7f9fc]" />}
                  </tr>
                </thead>
                <tbody>
                  {data.familyMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-[#fafbff]">
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, fontWeight: 700, color: "#2d3648" }}>
                          {member.relation}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{member.full_name}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>{member.national_id ?? "-"}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>{member.birth_date ?? "-"}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>{member.education_stage ?? "-"}</span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                          <button
                            type="button"
                            onClick={() => handleDeleteFamilyMember(member.id)}
                            className="w-8 h-8 rounded-[6px] flex items-center justify-center"
                            style={{ background: "#fce8f1" }}
                          >
                            <Trash2 size={14} color="#e3282c" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* سجل الوحدات */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>الوحدات</span>
        </div>

        {canEdit && (
          <div className="px-6 pt-5 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  checked={newUnitMode === "select"}
                  onChange={() => setNewUnitMode("select")}
                  className="accent-[#00b867]"
                />
                <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>وحدة مسجلة</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  checked={newUnitMode === "free"}
                  onChange={() => setNewUnitMode("free")}
                  className="accent-[#00b867]"
                />
                <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>وحدة خارجية (اسم حر)</span>
              </label>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                <label style={{ ...F, fontSize: 12, color: "#717d96" }}>اسم الوحدة</label>

                {newUnitMode === "select" ? (
                  <select
                    value={newUnitId}
                    onChange={(e) => setNewUnitId(e.target.value)}
                    dir="rtl"
                    className={inputClass}
                    style={{ ...F, height: 42 }}
                  >
                    <option value="">اختر الوحدة</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newUnitNameFree}
                    onChange={(e) => setNewUnitNameFree(e.target.value)}
                    placeholder="اكتب اسم الوحدة"
                    dir="rtl"
                    className={inputClass}
                    style={{ ...F, height: 42 }}
                  />
                )}
              </div>

              <div className="flex flex-col gap-1 w-[160px]">
                <label style={{ ...F, fontSize: 12, color: "#717d96" }}>الرتبة أثناء الخدمة</label>
                <select
                  value={newUnitRankId}
                  onChange={(e) => setNewUnitRankId(e.target.value)}
                  dir="rtl"
                  className={inputClass}
                  style={{ ...F, height: 42 }}
                >
                  <option value="">اختر الرتبة</option>
                  {ranks.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 w-[150px]">
                <label style={{ ...F, fontSize: 12, color: "#717d96" }}>تاريخ الانضمام</label>
                <input
                  type="date"
                  value={newUnitJoinedAt}
                  onChange={(e) => setNewUnitJoinedAt(e.target.value)}
                  className={inputClass}
                  style={{ ...F, height: 42 }}
                />
              </div>

              <div className="flex flex-col gap-1 w-[150px]">
                <label style={{ ...F, fontSize: 12, color: "#717d96" }}>تاريخ الانتقال (اختياري)</label>
                <input
                  type="date"
                  value={newUnitTransferredAt}
                  onChange={(e) => setNewUnitTransferredAt(e.target.value)}
                  className={inputClass}
                  style={{ ...F, height: 42 }}
                />
              </div>

              <div className="flex flex-col gap-1 w-[150px]">
                <label style={{ ...F, fontSize: 12, color: "#717d96" }}>درجة الأخلاق</label>
                <select
                  value={newUnitConductGrade}
                  onChange={(e) => setNewUnitConductGrade(e.target.value)}
                  dir="rtl"
                  className={inputClass}
                  style={{ ...F, height: 42 }}
                >
                  <option value="">اختر الدرجة</option>
                  {CONDUCT_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddUnitHistory}
                disabled={savingUnit}
                className="h-[42px] px-5 rounded-[8px] flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                style={{ background: "#DCF4DF", ...F, fontSize: 14, color: "#2d3648" }}
              >
                <Plus size={14} />
                إضافة وحدة
              </button>
            </div>
          </div>
        )}

        <div className="p-6">
          {unitHistory.length === 0 ? (
            <div className="rounded-[8px] py-4 text-center" style={{ background: "#f7f9fc" }}>
              <span style={{ ...F, fontSize: 13, color: "#a1aebe" }}>لا يوجد سجل وحدات مضاف حاليًا</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>اسم الوحدة</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الدرجة أثناء الخدمة</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>تاريخ الانضمام</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>تاريخ الانتقال</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>مدة الخدمة</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>درجة الأخلاق</span>
                    </th>
                    {canEdit && <th className="px-4 py-2.5 border-b border-[#e2e7f0] bg-[#f7f9fc]" />}
                  </tr>
                </thead>

                <tbody>
                  {unitHistory.map((row) => (
                    <tr key={row.id} className="hover:bg-[#fafbff]">
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                          {row.unit_name_resolved}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{row.rank_name ?? "-"}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{row.joined_at}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        {editingUnitRowId === row.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              value={editTransferredAt}
                              min={row.joined_at}
                              onChange={(e) => setEditTransferredAt(e.target.value)}
                              className="h-[36px] rounded-[8px] border border-[#e2e7f0] px-2 outline-none focus:border-[#00b867] bg-white"
                              style={{ ...F, fontSize: 13 }}
                            />

                            <button
                              type="button"
                              onClick={() => handleSaveTransfer(row)}
                              disabled={savingTransfer}
                              className="w-8 h-8 rounded-[6px] flex items-center justify-center disabled:opacity-50"
                              style={{ background: "#DCF4DF" }}
                              title="حفظ"
                            >
                              <Check size={14} color="#00522e" />
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditTransfer}
                              className="w-8 h-8 rounded-[6px] flex items-center justify-center"
                              style={{ background: "#f7f9fc" }}
                              title="إلغاء"
                            >
                              <X size={14} color="#717d96" />
                            </button>
                          </div>
                        ) : (
                          <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{row.transferred_at ?? "حتى الآن"}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                          {calculateServiceDuration(row.joined_at, row.transferred_at)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        {row.conduct_grade ? (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                            style={{ background: "#dcfce7", ...F, fontSize: 12, fontWeight: 700, color: "#166534" }}
                          >
                            {row.conduct_grade}
                          </span>
                        ) : (
                          <span style={{ ...F, fontSize: 13, color: "#a1aebe" }}>-</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditTransfer(row)}
                              className="w-8 h-8 rounded-[6px] flex items-center justify-center"
                              style={{ background: "#eef2ff" }}
                              title="تعديل تاريخ الانتقال"
                            >
                              <Pencil size={14} color="#3730a3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUnitHistory(row.id)}
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
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      {/* الترقيات */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>سجل الترقي</span>
        </div>

        {canEdit && (
          <div className="px-6 pt-5 flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1 w-[160px]">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>تاريخ الترقي</label>
              <input
                type="date"
                value={newPromotionDate}
                onChange={(e) => setNewPromotionDate(e.target.value)}
                className={inputClass}
                style={{ ...F, height: 42 }}
              />
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>الدرجة</label>
              <select
                value={newPromotionRankId}
                onChange={(e) => setNewPromotionRankId(e.target.value)}
                dir="rtl"
                className={inputClass}
                style={{ ...F, height: 42 }}
              >
                          <option value="">اختر الدرجة</option>
                {ranks
                  .filter((r) => r.name !== "عريف مجند")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>رقم قرار الترقي</label>
              <input
                type="text"
                value={newPromotionDecisionNumber}
                onChange={(e) => setNewPromotionDecisionNumber(e.target.value)}
                placeholder="رقم القرار"
                dir="rtl"
                className={inputClass}
                style={{ ...F, height: 42 }}
              />
            </div>

            <button
              type="button"
              onClick={handleAddPromotion}
              disabled={savingPromotion}
              className="h-[42px] px-5 rounded-[8px] flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              style={{ background: "#DCF4DF", ...F, fontSize: 14, color: "#2d3648" }}
            >
              <Plus size={14} />
              إضافة ترقية
            </button>

            <p className="w-full" style={{ ...F, fontSize: 12, color: "#b45309" }}>
              الإضافة هنا للتوثيق فقط ولا تغيّر درجة الفرد الحالية. ترقيات ضباط الصف تتم من «نشرات الترقي»، وترقي المجندين من «ترقي المجندين».
              تاريخ آخر ترقية يدخل في حساب استحقاق النقل لشؤون الضباط.
            </p>
          </div>
        )}

        <div className="p-6">
          {promotions.length === 0 ? (
            <div className="rounded-[8px] py-4 text-center" style={{ background: "#f7f9fc" }}>
              <span style={{ ...F, fontSize: 13, color: "#a1aebe" }}>لا يوجد ترقيات مسجلة حاليًا</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>تاريخ الترقي</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الدرجة</span>
                    </th>
                          <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>رقم قرار الترقي</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>الحركة</span>
                    </th>
                    <th className="px-4 py-2.5 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]">
                      <span style={{ ...F, fontSize: 12, color: "#717d96" }}>ملاحظات / السبب</span>
                    </th>
                    {canEdit && <th className="px-4 py-2.5 border-b border-[#e2e7f0] bg-[#f7f9fc]" />}
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((p) => (
                    <tr key={p.id} className="hover:bg-[#fafbff]">
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{p.promotion_date}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                          {p.rank_name ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{p.decision_number}</span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        {(() => {
                          const type = movementMeta[p.id]?.type ?? "promotion";
                          return (
                            <span
                              className="inline-flex px-2.5 py-0.5 rounded-full whitespace-nowrap"
                              style={{
                                ...F,
                                fontSize: 12,
                                fontWeight: 700,
                                background: type === "promotion" ? "#dcfce7" : "#fce9ea",
                                color: type === "promotion" ? "#166534" : "#9d2e15",
                              }}
                            >
                              {movementLabel(type, p.rank_name)}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                        <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                          {movementMeta[p.id]?.notes ?? "-"}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-2.5 border-b border-[#eaecf0]">
                          <button
                            type="button"
                            onClick={() => handleDeletePromotion(p.id)}
                            className="w-8 h-8 rounded-[6px] flex items-center justify-center"
                            style={{ background: "#fce8f1" }}
                          >
                            <Trash2 size={14} color="#e3282c" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      {/* المستندات المرفقة */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>المستندات المرفقة</span>
        </div>

        {canEdit && (
          <div className="px-6 pt-5 flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label style={{ ...F, fontSize: 12, color: "#717d96" }}>اسم المستند</label>
              <input
                type="text"
                value={newDocumentName}
                onChange={(e) => setNewDocumentName(e.target.value)}
                placeholder="مثال: رقم قومي"
                dir="rtl"
                className={inputClass}
                style={{ ...F, height: 42 }}
              />
            </div>

            <label
              className="h-[42px] px-5 rounded-[8px] flex items-center gap-1.5 shrink-0 cursor-pointer"
               style={{ background: "#DCF4DF", ...F, fontSize: 14, color: "#2d3648" }}
            >
              <Upload size={14} />
              {uploadingDocument ? "جاري الرفع..." : "رفع مستند"}
              <input
                type="file"
                onChange={handleUploadDocument}
                disabled={uploadingDocument}
                className="hidden"
              />
            </label>
          </div>
        )}

        <div className="p-6">
          {documents.length === 0 ? (
            <div className="rounded-[8px] py-4 text-center" style={{ background: "#f7f9fc" }}>
              <span style={{ ...F, fontSize: 13, color: "#a1aebe" }}>لا يوجد مستندات مرفقة حاليًا</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-[8px]"
                  style={{ background: "#f7f9fc" }}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} color="#717d96" />
                    <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{doc.document_name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewDocument(doc.file_path)}
                      className="w-8 h-8 rounded-[6px] flex items-center justify-center"
                      style={{ background: "#DCF4DF" }}
                    >
                      <Download size={14} color="#00522e" />
                    </button>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
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
      </section>
    </div>
  );
}