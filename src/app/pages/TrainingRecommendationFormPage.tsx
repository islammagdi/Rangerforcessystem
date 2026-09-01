import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, Info } from "lucide-react";

import { supabase } from "../../lib/supabase";
import {
  createRecommendation,
  updateRecommendation,
  fetchRecommendationById,
  findPossibleDuplicates,
  getListTypeLabel,
  LIST_TYPE_LABELS,
  STAGE_MONTHS,
  RECRUITMENT_AREAS,
  logRecommendationCreated,
  logRecommendationChanges,
  fetchRecommendationLogs,
  type ListType,
  type PossibleDuplicate,
  type RecommendationLog,
} from "../../lib/trainingRecommendations";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

export function TrainingRecommendationFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditMode = Boolean(id);

  const currentYear = new Date().getFullYear();

 const yearOptions = useMemo(
  () => Array.from({ length: 6 }, (_, i) => currentYear + i),
  [currentYear]
);

  // المرحلة ونوع الكشف (إلزامي)
  const [stageYear, setStageYear] = useState(currentYear);
  const [stageMonth, setStageMonth] = useState(STAGE_MONTHS[0].value);
  const [listType, setListType] = useState<ListType>("COMMANDER");
  const [listTypeOther, setListTypeOther] = useState("");

  // بيانات الفرد
  const [fullName, setFullName] = useState("");
  const [recommender, setRecommender] = useState("");
  const [recruitmentArea, setRecruitmentArea] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [tripleNumber, setTripleNumber] = useState("");
  const [qualification, setQualification] = useState("");
  const [requiredWeapon, setRequiredWeapon] = useState("");
  const [currentWeapon, setCurrentWeapon] = useState("");
  const [requiredUnit, setRequiredUnit] = useState("");
  const [currentUnit, setCurrentUnit] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [createdByName, setCreatedByName] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // التحذير من التكرار المحتمل
  const [duplicates, setDuplicates] = useState<PossibleDuplicate[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicatesAcknowledged, setDuplicatesAcknowledged] =
    useState(false);

  // سجل التعديلات
  const [originalPayload, setOriginalPayload] = useState<Record<string, any> | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logs, setLogs] = useState<RecommendationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  useEffect(() => {
    if (id) {
      loadExisting(id);
    }
  }, [id]);

  async function loadExisting(recId: string) {
    setLoadingInitial(true);
    setError("");

    try {
      const data = await fetchRecommendationById(recId);

      setStageYear(data.stage_year);
      setStageMonth(data.stage_month);
      setListType(data.list_type);
      setListTypeOther(data.list_type_other ?? "");

      setFullName(data.full_name);
      setRecommender(data.recommender);
      setRecruitmentArea(data.recruitment_area);
      setNationalId(data.national_id ?? "");
      setTripleNumber(data.triple_number ?? "");
      setQualification(data.qualification ?? "");
      setRequiredWeapon(data.required_weapon ?? "");
      setCurrentWeapon(data.current_weapon ?? "");
      setRequiredUnit(data.required_unit ?? "");
      setCurrentUnit(data.current_unit ?? "");

      setCreatedByName(data.created_by_name ?? "غير معروف");
      setCreatedAt(data.created_at);
       setOriginalPayload({
        stage_month: data.stage_month,
        stage_year: data.stage_year,
        list_type: data.list_type,
        list_type_other: data.list_type_other ?? "",
        full_name: data.full_name,
        recommender: data.recommender,
        recruitment_area: data.recruitment_area,
        national_id: data.national_id ?? "",
        triple_number: data.triple_number ?? "",
        qualification: data.qualification ?? "",
        required_weapon: data.required_weapon ?? "",
        current_weapon: data.current_weapon ?? "",
        required_unit: data.required_unit ?? "",
        current_unit: data.current_unit ?? "",
      });
    } catch (err: any) {
      console.error("Load recommendation error:", err);
      setError(err?.message || "حدث خطأ أثناء تحميل بيانات التوصية");
    } finally {
      setLoadingInitial(false);
    }
  }

  /* =======================================================
     التحقق من التكرار المحتمل (تحذير غير حاجب)
  ======================================================= */

  async function checkForDuplicates() {
    if (!fullName.trim()) return;

    setCheckingDuplicates(true);

    try {
      const results = await findPossibleDuplicates(
        stageMonth,
        stageYear,
        fullName,
        nationalId || null,
        tripleNumber || null,
        isEditMode ? id : undefined
      );

      setDuplicates(results);
      setDuplicatesAcknowledged(false);
    } catch (err) {
      console.error("Check duplicates error:", err);
    } finally {
      setCheckingDuplicates(false);
    }
  }

  /* =======================================================
     فتح بوب أب سجل التعديلات
  ======================================================= */

  async function openLogsModal() {
    if (!id) return;

    setShowLogModal(true);
    setLoadingLogs(true);

    try {
      const data = await fetchRecommendationLogs(id);
      setLogs(data);
    } catch (err) {
      console.error("Fetch logs error:", err);
    } finally {
      setLoadingLogs(false);
    }
  }
  /* =======================================================
     Validation
  ======================================================= */
  function validate(): Record<string, string> {
    const e: Record<string, string> = {};

    if (!fullName.trim()) {
      e.fullName = "اسم الفرد مطلوب";
    }

    if (!recommender.trim()) {
      e.recommender = "اسم الموصي مطلوب";
    }

    if (!recruitmentArea) {
      e.recruitmentArea = "المنطقة التجنيدية مطلوبة";
    }

    if (listType === "OTHER" && !listTypeOther.trim()) {
      e.listTypeOther = "يرجى كتابة اسم نوع الكشف";
    }

    return e;
  }

  /* =======================================================
     Submit
  ======================================================= */

   async function handleSubmit() {
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    // لو فيه تكرار محتمل ولسه المستخدم مأكّدش، نوقف ونعرضله التحذير
    if (duplicates.length > 0 && !duplicatesAcknowledged) {
      setError(
        "يوجد فرد مطابق محتمل في نفس المرحلة (موضّح أسفل الفورم). يرجى المراجعة ثم الضغط على \"تجاهل والمتابعة\" أو تعديل البيانات."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        stage_month: stageMonth,
        stage_year: stageYear,
        list_type: listType,
        list_type_other:
          listType === "OTHER" ? listTypeOther.trim() : null,
        full_name: fullName.trim(),
        recommender: recommender.trim(),
        recruitment_area: recruitmentArea,
        national_id: nationalId.trim() || null,
        triple_number: tripleNumber.trim() || null,
        qualification: qualification.trim() || null,
        required_weapon: requiredWeapon.trim() || null,
        current_weapon: currentWeapon.trim() || null,
        required_unit: requiredUnit.trim() || null,
        current_unit: currentUnit.trim() || null,
      };

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let userName = "غير معروف";

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        userName = profile?.username ?? "غير معروف";
      }

      if (isEditMode && id) {
        await updateRecommendation(id, payload);

        if (originalPayload) {
          await logRecommendationChanges(
            id,
            userName,
            payload.full_name,
            originalPayload,
            payload
          );
        }
      } else {
        const newId = await createRecommendation({
          ...payload,
          created_by: user?.id ?? null,
          created_by_name: userName,
        });

        await logRecommendationCreated(newId, userName, payload.full_name);
      }

      navigate("/dashboard/training-recommendations");
    } catch (err: any) {
      console.error("Save recommendation error:", err);
      setError(err?.message || "حدث خطأ أثناء حفظ التوصية");
    } finally {
      setSaving(false);
    }
  }
  if (loadingInitial) {
    return (
      <div
        className="flex items-center justify-center w-full min-h-[400px]"
        dir="rtl"
      >
        <span style={{ ...F, fontSize: 16, color: "#717d96" }}>
          جاري تحميل بيانات التوصية...
        </span>
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
        {isEditMode ? "تعديل توصية" : "إضافة توصية جديدة"}
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
      {isEditMode && createdByName && (
        <div
          className="w-full rounded-[10px] px-5 py-3 flex items-center justify-between gap-2 flex-wrap"
          style={{ background: "#ffffff", border: "1px solid #e2e7f0" }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Info size={20} color="green" />
            <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
              سجّل هذه التوصية:{" "}
            </span>
            <span style={{ ...F, fontSize: 13, fontWeight: 700, color: "#2d3648" }}>
              {createdByName}
            </span>

            {createdAt && (
              <>
                <span style={{ ...F, fontSize: 13, color: "#717d96" }}>
                  {" "}
                  بتاريخ{" "}
                </span>
                <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                  {new Date(createdAt).toLocaleString("ar-EG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={openLogsModal}
            className="px-3 py-1.5 rounded-[8px]"
            style={{
              ...F,
              fontSize: 12,
              color: "#00522e",
              border: "1px solid #00b867",
              background: "#f0fdf6",
            }}
          >
            عرض سجل التوصية
          </button>
        </div>
      )}

      <div className="bg-white rounded-[20px] border border-[#eff0f6] p-6 flex flex-col gap-6">
        {/* المرحلة ونوع الكشف */}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label
              style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
            >
              السنة
            </label>

            <select
              value={stageYear}
              onChange={(e) => setStageYear(Number(e.target.value))}
              dir="rtl"
              className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
              style={{ ...F, fontSize: 15, color: "#2d3648" }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label
              style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
            >
              المرحلة التجنيدية
            </label>

            <select
              value={stageMonth}
              onChange={(e) => setStageMonth(Number(e.target.value))}
              dir="rtl"
              className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
              style={{ ...F, fontSize: 15, color: "#2d3648" }}
            >
              {STAGE_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label
              style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
            >
              نوع الكشف
            </label>

            <select
              value={listType}
              onChange={(e) => setListType(e.target.value as ListType)}
              dir="rtl"
              className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
              style={{ ...F, fontSize: 15, color: "#2d3648" }}
            >
              {Object.entries(LIST_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {errors.listTypeOther && (
              <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>
                {errors.listTypeOther}
              </p>
            )}
          </div>

          {listType === "OTHER" && (
            <div className="flex flex-col gap-1.5 flex-1">
              <label
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#2d3648",
                }}
              >
                اسم نوع الكشف
              </label>

              <input
                type="text"
                value={listTypeOther}
                onChange={(e) => setListTypeOther(e.target.value)}
                placeholder="اكتب اسم نوع الكشف"
                dir="rtl"
                className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
                style={{ ...F, fontSize: 15, color: "#2d3648" }}
              />
            </div>
          )}
        </div>

        <div className="w-full h-px bg-[#eff0f6]" />

               {/* الاسم والمنطقة (إلزامي) */}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label
              style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
            >
              اسم الفرد
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrors((p) => ({ ...p, fullName: "" }));
              }}
              onBlur={checkForDuplicates}
              placeholder="الاسم الرباعي"
              dir="rtl"
              className={[
                "w-full h-[46px] rounded-[8px] border px-3 text-right outline-none focus:border-[#00b867]",
                errors.fullName ? "border-[#ef4444]" : "border-[#e2e7f0]",
              ].join(" ")}
              style={{ ...F, fontSize: 15, color: "#2d3648" }}
            />

            {errors.fullName && (
              <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label
              style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
            >
              المنطقة التجنيدية
            </label>

            <select
              value={recruitmentArea}
              onChange={(e) => {
                setRecruitmentArea(e.target.value);
                setErrors((p) => ({ ...p, recruitmentArea: "" }));
              }}
              dir="rtl"
              className={[
                "w-full h-[46px] rounded-[8px] border px-3 text-right outline-none focus:border-[#00b867] bg-white",
                errors.recruitmentArea
                  ? "border-[#ef4444]"
                  : "border-[#e2e7f0]",
              ].join(" ")}
              style={{ ...F, fontSize: 15, color: "#2d3648" }}
            >
              <option value="">اختر المنطقة</option>
              {RECRUITMENT_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            {errors.recruitmentArea && (
              <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>
                {errors.recruitmentArea}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}
          >
            الموصي
          </label>

          <input
            type="text"
            value={recommender}
            onChange={(e) => {
              setRecommender(e.target.value);
              setErrors((p) => ({ ...p, recommender: "" }));
            }}
            placeholder="اسم الشخص الذي قدّم التوصية"
            dir="rtl"
            className={[
              "w-full h-[46px] rounded-[8px] border px-3 text-right outline-none focus:border-[#00b867]",
              errors.recommender ? "border-[#ef4444]" : "border-[#e2e7f0]",
            ].join(" ")}
            style={{ ...F, fontSize: 15, color: "#2d3648" }}
          />

          {errors.recommender && (
            <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>
              {errors.recommender}
            </p>
          )}
        </div>

        {/* تحذير التكرار المحتمل */}

        {checkingDuplicates && (
          <p style={{ ...F, fontSize: 13, color: "#a1aebe" }}>
            جاري التحقق من وجود تكرار محتمل...
          </p>
        )}

        {duplicates.length > 0 && (
          <div
            className="flex flex-col gap-3 rounded-[10px] px-4 py-3"
            style={{ background: "#fff8e8", border: "1px solid #f4d58d" }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-[#8a6500] shrink-0" />

              <div className="flex flex-col gap-1">
                <p
                  style={{
                    ...F,
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#8a6500",
                  }}
                >
                  تحذير: يوجد فرد مطابق محتمل في نفس المرحلة
                </p>

                {duplicates.map((dup) => (
                  <p
                    key={dup.id}
                    style={{ ...F, fontSize: 13, color: "#8a6500" }}
                  >
                    {dup.full_name} —{" "}
                    {getListTypeLabel(dup.list_type, dup.list_type_other)}
                  </p>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDuplicatesAcknowledged(true)}
              className="self-start px-4 py-1.5 rounded-[8px]"
              style={{
                background: duplicatesAcknowledged
                  ? "#dcfce7"
                  : "#fff",
                border: "1px solid #8a6500",
                ...F,
                fontSize: 13,
                color: duplicatesAcknowledged ? "#166534" : "#8a6500",
              }}
            >
              {duplicatesAcknowledged
                ? "تم التجاهل، يمكنك المتابعة"
                : "تجاهل والمتابعة"}
            </button>
          </div>
        )}

        <div className="w-full h-px bg-[#eff0f6]" />

        {/* بيانات إضافية اختيارية */}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              الرقم القومي (اختياري)
            </label>

            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              dir="rtl"
              className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              الرقم الثلاثي (اختياري)
            </label>

            <input
              type="text"
              value={tripleNumber}
              onChange={(e) => setTripleNumber(e.target.value)}
              dir="rtl"
              className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
            المؤهل (اختياري)
          </label>

          <input
            type="text"
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            dir="rtl"
            className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              السلاح المطلوب (اختياري)
            </label>

            <input
              type="text"
              value={requiredWeapon}
              onChange={(e) => setRequiredWeapon(e.target.value)}
              dir="rtl"
              className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              السلاح الحالي (اختياري)
            </label>

            <input
              type="text"
              value={currentWeapon}
              onChange={(e) => setCurrentWeapon(e.target.value)}
              dir="rtl"
              className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              الوحدة المطلوبة (اختياري)
            </label>

            <input
              type="text"
              value={requiredUnit}
              onChange={(e) => setRequiredUnit(e.target.value)}
              dir="rtl"
              className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
              الوحدة الحالية (اختياري)
            </label>

            <input
              type="text"
              value={currentUnit}
              onChange={(e) => setCurrentUnit(e.target.value)}
              dir="rtl"
              className="w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />
          </div>
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
            {saving ? "جاري الحفظ..." : "حفظ التوصية"}
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard/training-recommendations")
            }
            disabled={saving}
            className="h-[48px] px-6 rounded-[8px] border border-[#cbd5e1]"
            style={{ ...F, fontSize: 15, color: "#475569" }}
          >
            إلغاء
          </button>
        </div>
      </div>

      {showLogModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowLogModal(false)}
        >
          <div
            className="bg-white rounded-[16px] w-full max-w-[520px] max-h-[80vh] overflow-hidden flex flex-col"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#eff0f6]">
              <h3 style={{ ...F, fontWeight: 700, fontSize: 16, color: "#2d3648" }}>
                سجل التعديلات
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                style={{ ...F, fontSize: 16, color: "#717d96" }}
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 flex flex-col gap-3">
              {loadingLogs && (
                <p style={{ ...F, fontSize: 13, color: "#a1aebe" }}>
                  جاري تحميل السجل...
                </p>
              )}

              {!loadingLogs && logs.length === 0 && (
                <p style={{ ...F, fontSize: 13, color: "#a1aebe" }}>
                  لا يوجد سجل تعديلات لهذه التوصية
                </p>
              )}

              {!loadingLogs &&
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-[8px] px-3 py-2"
                    style={{ background: "#f8fafc" }}
                  >
                    <p style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                      {log.message}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}