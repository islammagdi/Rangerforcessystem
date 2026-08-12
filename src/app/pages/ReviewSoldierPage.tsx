import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/logActivity";

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

  // ==========================================================================
  // اعتماد القيد
  // ==========================================================================

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
          updated_at
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
              label="تاريخ التسريح"
              value={
                form.personnel_category ===
                "متطوع"
                  ? "لا يوجد"
                  : form.discharge_date ||
                    "لا يوجد"
              }
            />
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
// Info Row
// ============================================================================

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