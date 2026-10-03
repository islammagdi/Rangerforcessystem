import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/logActivity";
import { useUnsavedChanges } from "../../lib/unsavedChanges";
import { resetAddSoldierFlow } from "../../lib/addSoldierFlow";

// ============================================================================
// Style
// ============================================================================

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ============================================================================
// Types
// ============================================================================

interface ReviewFormData {
  military_number: string;
  full_name: string;

  rank_id: string;

  personnel_category_id: string;
  personnel_category: string;

  service_status_id: string;

  primary_unit_id: string;
  attachment_unit_id: string | null;

  discharge_date: string | null;

  rank_name: string;
  status_name: string;
  primary_unit_name: string;
  attachment_unit_name: string;
    job_id?: string | null;
  job_name?: string;
  administration_id?: string | null;
  administration_name?: string;
  education_level_id?: string | null;
  education_level_name?: string;
}

interface InsertedPersonnel {
  id: string;
  created_at: string;
  military_number: string;
  full_name: string;
  rank_id: string;
  personnel_category_id: string;
  service_status_id: string;
  primary_unit_id: string;
  attachment_unit_id: string | null;
  discharge_date: string | null;
  is_active: boolean;
  updated_at: string | null;
  job_id: string | null;
}

// ============================================================================
// Page
// ============================================================================

export function ReviewSoldierPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================================
  // البيانات القادمة من صفحة إضافة الفرد
  // ==========================================================================

  const form =
    (location.state as ReviewFormData | null) ?? null;

  // ─────────────────────────────────────────────────────
  // تتبّع التعديلات غير المحفوظة
  // ─────────────────────────────────────────────────────
  // الصفحة دي معندهاش حقول تتعدل، لكن وجود "form" معناه إن فيه
  // بيانات جاهزة للاعتماد لسه محفوظتش في قاعدة البيانات — لو
  // المستخدم غادر من غير اعتماد، هيفقدها ويضطر يملى الفورم تاني
  const { setDirty, setPerformingSensitiveOperation } =
    useUnsavedChanges();

  useEffect(() => {
    setDirty(Boolean(form));

    return () => setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(form)]);

  // ─────────────────────────────────────────────────────
  // تحديد أن هذه عملية حساسة
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    setPerformingSensitiveOperation(true);

    return () => {
      setPerformingSensitiveOperation(false);
    };
  }, [setPerformingSensitiveOperation]);

  // ==========================================================
  // اعتماد القيد
  // ==========================================================

  const handleConfirm = useCallback(async () => {
    if (!form) {
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // =====================================================
      // 1. تنظيف البيانات
      // =====================================================

      const militaryNumber =
        form.military_number?.trim();

      const fullName =
        form.full_name?.trim();

      if (!militaryNumber) {
        setError("برجاء إدخال الرقم العسكري.");
        setIsLoading(false);
        return;
      }

      if (!fullName) {
        setError("برجاء إدخال اسم الفرد.");
        setIsLoading(false);
        return;
      }

      if (!form.rank_id) {
        setError("برجاء اختيار الدرجة.");
        setIsLoading(false);
        return;
      }

      if (!form.personnel_category_id) {
        setError("برجاء اختيار فئة الفرد.");
        setIsLoading(false);
        return;
      }

      if (!form.service_status_id) {
        setError("برجاء اختيار الموقف الخدمي.");
        setIsLoading(false);
        return;
      }

      if (!form.primary_unit_id) {
        setError("برجاء اختيار الوحدة الأساسية.");
        setIsLoading(false);
        return;
      }

      // =====================================================
      // 2. فحص الرقم العسكري قبل الحفظ
      // =====================================================

      const { data: deletedNumbers } = await supabase.rpc(
        "get_deleted_military_numbers",
        { p_numbers: [militaryNumber] }
      );

      if ((deletedNumbers ?? []).length > 0) {
        setError(
          `الرقم العسكري ${militaryNumber} لفرد محذوف من المنظومة. استرجعه من صفحة «الأفراد المحذوفين» بدل إضافته من جديد.`
        );
        setIsLoading(false);
        return;
      }

      const {
        data: existingPersonnel,
        error: checkError,
      } = await supabase
        .from("personnel")
        .select("id")
        .eq("military_number", militaryNumber)
        .maybeSingle();

      if (checkError) {
        console.error(
          "Check military number error:",
          checkError
        );

        throw checkError;
      }

      if (existingPersonnel) {
        setError(
          `الرقم العسكري ${militaryNumber} مسجل بالفعل ولا يمكن تكراره.`
        );

        setIsLoading(false);
        return;
      }

      // =====================================================
      // 3. تجهيز تاريخ التسريح
      // =====================================================

      /*
       * المتطوع لا يتم حفظ تاريخ تسريح له.
       *
       * أما باقي الفئات:
       * يتم حفظ التاريخ كما جاء من الفورم.
       */

      const dischargeDate =
        form.personnel_category === "متطوع"
          ? null
          : form.discharge_date || null;

      // =====================================================
      // 4. تجهيز البيانات للحفظ
      // =====================================================

      const payload = {
        military_number: militaryNumber,

        full_name: fullName,

        rank_id: form.rank_id,

        personnel_category_id:
          form.personnel_category_id,

        service_status_id:
          form.service_status_id,

        primary_unit_id:
          form.primary_unit_id,

        attachment_unit_id:
          form.attachment_unit_id || null,

        discharge_date: dischargeDate,
        job_id: form.job_id || null,

        // من الرقم العسكري (اتحسبوا في صفحة الإضافة)
        administration_id: form.administration_id || null,
        education_level_id: form.education_level_id || null,

        is_active: true,
      };
      console.log(
        "PERSONNEL PAYLOAD:",
        payload
      );

      // =====================================================
      // 5. الحفظ النهائي في personnel
      // =====================================================

      const {
        data: insertedPersonnel,
        error: insertError,
      } = await supabase
        .from("personnel")
        .insert(payload)
        .select(`
          id,
          created_at,
          military_number,
          full_name,
          rank_id,
          personnel_category_id,
          service_status_id,
          primary_unit_id,
          attachment_unit_id,
          discharge_date,
          is_active,
          updated_at,
          job_id
        `)
        .single();

      // =====================================================
      // 6. معالجة خطأ الحفظ
      // =====================================================

      if (insertError) {
        console.error(
          "Insert personnel error:",
          insertError
        );

        // duplicate
        if (insertError.code === "23505") {
          setError(
            `الرقم العسكري ${militaryNumber} مسجل بالفعل ولا يمكن تكراره.`
          );

          setIsLoading(false);
          return;
        }

        throw insertError;
      }

      if (!insertedPersonnel) {
        throw new Error(
          "لم يتم إنشاء سجل الفرد."
        );
      }

      // =====================================================
      // 7. التحقق من ID الذي تم إنشاؤه
      // =====================================================

      const personnelId =
        (insertedPersonnel as InsertedPersonnel).id;

      if (!personnelId) {
        throw new Error(
          "لم يتم الحصول على رقم سجل الفرد بعد الحفظ."
        );
      }
      // =====================================================
// تسجيل إضافة الفرد في audit_logs
// =====================================================

const {
  data: { user },
} = await supabase.auth.getUser();

let userName = "غير معروف";

if (user) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile error:", profileError);
  }

  userName = profile?.username ?? "غير معروف";
}

await logActivity({
  userId: user?.id ?? null,
  userName,
  actionType: "CREATE",
  action: "إضافة فرد",
  entity: "personnel",
  details: JSON.stringify({
    personnelId,
    militaryNumber,
    fullName,
    personnelCategory: form.personnel_category,
    rank: form.rank_name,
    serviceStatus: form.status_name,
    primaryUnit: form.primary_unit_name,
    attachmentUnit: form.attachment_unit_name,
        job: form.job_name || null,
        administration: form.administration_name || null,
        educationLevel: form.education_level_name || null,
    dischargeDate,
  }),
});

      console.log(
        "INSERTED PERSONNEL ID:",
        personnelId
      );

      console.log(
        "INSERTED DISCHARGE DATE:",
        insertedPersonnel.discharge_date
      );

      // =====================================================
      // 8. الانتقال إلى صفحة النجاح
      // =====================================================

      /*
       * مهم جدًا:
       *
       * SuccessSoldierPage تبحث عن:
       *
       * location.state.personnelId
       *
       * لذلك يجب إرسال personnelId هنا.
       */

      // ✅ الحفظ نجح فعليًا في قاعدة البيانات، فمن هنا فصاعدًا
      // مفيش داعي نحذّر المستخدم لو غادر الصفحة
      setDirty(false);
      resetAddSoldierFlow();

      navigate(
        "/dashboard/add-soldier/success",
        {
          state: {
            personnelId: personnelId,
          },
        }
      );

    } catch (err) {
      console.error(
        "Error saving personnel:",
        err
      );

      setError(
        "حدث خطأ أثناء حفظ بيانات الفرد، برجاء المحاولة مرة أخرى."
      );

      setIsLoading(false);
    }
  }, [form, navigate]);

  // ==========================================================================
  // لا توجد بيانات للمراجعة
  // ==========================================================================

  if (!form) {
    return (
      <div
        dir="rtl"
        className="
          flex
          flex-col
          items-center
          gap-5
          py-20
        "
      >
        <p
          style={{
            ...F,
            fontSize: 18,
            color: "#2d3648",
          }}
        >
          لا توجد بيانات للمراجعة
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/dashboard/add-soldier"
            )
          }
          className="
            px-6
            h-[44px]
            rounded-[8px]
          "
          style={{
            background:
              "linear-gradient(to bottom, #00b867, #00522e)",
          }}
        >
          <span
            style={{
              ...F,
              color: "white",
            }}
          >
            العودة لصفحة الإضافة
          </span>
        </button>
      </div>
    );
  }

  // ==========================================================================
  // UI
  // ==========================================================================

  return (
    <div
      className="
        flex
        flex-col
        gap-6
        w-full
      "
      dir="rtl"
    >
      {/* Loading */}

      {isLoading && (
        <LoadingOverlay
          onDone={() => {}}
          durationMs={5000}
        />
      )}

      {/* Title */}

      <h1
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: 32,
          color: "#2d3648",
        }}
      >
        قيد قوة جديدة
      </h1>

      <div className="flex justify-center">
        <ReviewStepper
          onBack={() => {
            setDirty(false);
            navigate("/dashboard/add-soldier", {
              state: { resumed: true },
            });
          }}
        />
      </div>

      {/* Main Card */}

      <div
        className="
          bg-white
          rounded-[20px]
          border
          border-[#eff0f6]
          w-full
        "
      >
        <div
          className="
            flex
            flex-col
            gap-6
            px-6
            py-5
          "
        >
          {/* Section title */}

          <p
            style={{
              ...F,
              fontSize: 18,
              color: "#2d3648",
              fontWeight: 700,
            }}
          >
            مراجعة البيانات
          </p>

          {/* Divider */}

          <div className="w-full h-px bg-[#cbd2e0]" />

          {/* =================================================================
              البيانات
          ================================================================== */}

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-5
            "
          >
            <InfoRow
              label="الرقم العسكري"
              value={
                form.military_number
              }
            />

            <InfoRow
              label="الاسم"
              value={
                form.full_name
              }
            />

            <InfoRow
              label="فئة الفرد"
              value={
                form.personnel_category
              }
            />

            <InfoRow
              label="الدرجة"
              value={
                form.rank_name
              }
            />

            <InfoRow
              label="الموقف الخدمي"
              value={
                form.status_name
              }
            />

            <InfoRow
              label="الوحدة الأساسية"
              value={
                form.primary_unit_name
              }
            />

            <InfoRow
              label="جهة الإلحاق"
              value={
                form.attachment_unit_name ||
                "لا يوجد"
              }
            />

            <InfoRow
              label="الوظيفة"
              value={form.job_name || "لا يوجد"}
            />

            <InfoRow
              label="الإدارة / السلاح"
              value={form.administration_name || "غير محدد"}
            />

            <InfoRow
              label="المستوى التعليمي"
              value={form.education_level_name || "غير محدد"}
            />

            {form.personnel_category !== "متطوع" && (
              <InfoRow
                label="تاريخ التسريح"
                value={form.discharge_date || "لا يوجد"}
              />
            )}
          </div>

          {/* =================================================================
              رسالة الخطأ
          ================================================================== */}

          {error && (
            <div
              className="
                bg-red-50
                border
                border-red-200
                rounded-[10px]
                px-4
                py-3
              "
            >
              <p
                style={{
                  ...F,
                  color: "#dc2626",
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
              >
                {error}
              </p>
            </div>
          )}

          {/* =================================================================
              اعتماد
          ================================================================== */}

          <div
            className="
              flex
              justify-end
              pt-3
            "
          >
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="
                h-[44px]
                px-6
                rounded-[8px]
                disabled:opacity-50
                transition-opacity
                hover:opacity-90
              "
              style={{
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
              }}
            >
              <span
                style={{
                  ...F,
                  color: "white",
                  fontSize: 16,
                }}
              >
                {isLoading
                  ? "جاري الحفظ..."
                  : "اعتماد القيد"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Stepper (01 قابلة للضغط)
// ============================================================================

function ReviewStepper({ onBack }: { onBack: () => void }) {
  const dots = (dark: boolean) => (
    <div className="flex items-center gap-[3px] mt-4 mx-2">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] h-[3px] rounded-full"
          style={{ background: dark ? "#1A202C" : "#A1AEBE" }}
        />
      ))}
    </div>
  );

  return (
    <div className="flex items-start justify-center" dir="rtl">
      <button
        type="button"
        onClick={onBack}
        title="الرجوع لإدخال البيانات"
        className="flex flex-col items-center gap-2 bg-transparent p-0 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(to bottom,#00b867,#00522e)" }}
        >
          <span style={{ color: "#fff", fontSize: 16 }}>✓</span>
        </div>
        <span style={{ ...F, fontSize: 14, color: "#00864d", whiteSpace: "nowrap" }}>
          ادخال البيانات
        </span>
      </button>

      {dots(true)}

      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#344736] bg-white">
          <span style={{ ...F, fontSize: 14, color: "#344736" }}>02</span>
        </div>
        <span style={{ ...F, fontSize: 14, color: "#344736", whiteSpace: "nowrap" }}>
          المراجعة
        </span>
      </div>

      {dots(false)}

      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#a1aebe] bg-white">
          <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>03</span>
        </div>
        <span style={{ ...F, fontSize: 14, color: "#465668", whiteSpace: "nowrap" }}>
          اعتماد
        </span>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        flex
        gap-2
        min-w-0
      "
      dir="rtl"
    >
      <span
        style={{
          ...F,
          color: "#717d96",
          fontSize: 16,
          minWidth: 130,
          flexShrink: 0,
        }}
      >
        {label}:
      </span>

      <span
        style={{
          ...F,
          color: "#2d3648",
          fontSize: 16,
          fontWeight: 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value || "غير محدد"}
      </span>
    </div>
  );
}