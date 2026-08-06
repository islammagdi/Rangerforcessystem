import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { supabase } from "../../lib/supabase";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

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

export function ReviewSoldierPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form =
    (location.state as ReviewFormData | null) ?? null;

  const handleConfirm = useCallback(async () => {
    if (!form) return;

    try {
      setIsLoading(true);
      setError("");

      const militaryNumber =
        form.military_number.trim();

      // =====================================================
      // 1. فحص الرقم العسكري قبل الحفظ
      // =====================================================

      const { data: existingPersonnel, error: checkError } =
        await supabase
          .from("personnel")
          .select("id")
          .eq("military_number", militaryNumber)
          .maybeSingle();

      if (checkError) {
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
      // 2. تجهيز البيانات للحفظ
      // =====================================================

      const payload = {
        military_number: militaryNumber,
        full_name: form.full_name.trim(),

        rank_id: form.rank_id,

        personnel_category_id:
          form.personnel_category_id,

        service_status_id:
          form.service_status_id,

        primary_unit_id:
          form.primary_unit_id,

        attachment_unit_id:
          form.attachment_unit_id || null,

        // المتطوع يتم حفظ تاريخ تسريحه NULL
        discharge_date:
          form.personnel_category === "متطوع"
            ? null
            : form.discharge_date || null,

        is_active: true,
      };

      // =====================================================
      // 3. الحفظ النهائي في personnel
      // =====================================================

      const { data: insertedPersonnel, error: insertError } =
        await supabase
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

      if (insertError) {

        // حماية إضافية في حالة حدوث duplicate
        // بسبب إدخال آخر في نفس اللحظة
        if (insertError.code === "23505") {
          setError(
            `الرقم العسكري ${militaryNumber} مسجل بالفعل ولا يمكن تكراره.`
          );
          setIsLoading(false);
          return;
        }

        throw insertError;
      }

      // =====================================================
      // 4. الانتقال للصفحة النهائية
      //    مع البيانات التي تم حفظها فعليًا
      // =====================================================

      navigate(
        "/dashboard/add-soldier/success",
        {
          state: {
            personnel: insertedPersonnel,

            // البيانات المعروضة للمستخدم
            military_number:
              insertedPersonnel.military_number,

            full_name:
              insertedPersonnel.full_name,

            rank_name:
              form.rank_name,

            personnel_category:
              form.personnel_category,

            status_name:
              form.status_name,

            primary_unit_name:
              form.primary_unit_name,

            attachment_unit_name:
              form.attachment_unit_name,

            discharge_date:
              insertedPersonnel.discharge_date,
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

  if (!form) {
    return (
      <div
        dir="rtl"
        className="flex flex-col items-center gap-5 py-20"
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
            navigate("/dashboard/add-soldier")
          }
          className="px-6 h-[44px] rounded-[8px]"
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

  return (
    <div
      className="flex flex-col gap-6 w-full"
      dir="rtl"
    >
      {isLoading && (
        <LoadingOverlay
          onDone={() => {}}
          durationMs={5000}
        />
      )}

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

      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full">
        <div className="flex flex-col gap-6 px-6 py-5">

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

          <div className="w-full h-px bg-[#cbd2e0]" />

          {/* البيانات */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <InfoRow
              label="الرقم العسكري"
              value={form.military_number}
            />

            <InfoRow
              label="الاسم"
              value={form.full_name}
            />

            <InfoRow
              label="فئة الفرد"
              value={form.personnel_category}
            />

            <InfoRow
              label="الدرجة"
              value={form.rank_name}
            />

            <InfoRow
              label="الموقف الخدمي"
              value={form.status_name}
            />

            <InfoRow
              label="الوحدة الأساسية"
              value={form.primary_unit_name}
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
                form.discharge_date
                  ? form.discharge_date
                  : "لا يوجد"
              }
            />

          </div>

          {/* رسالة الخطأ */}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
              <p
                style={{
                  ...F,
                  color: "#dc2626",
                  fontSize: 14,
                }}
              >
                {error}
              </p>
            </div>
          )}

          {/* اعتماد */}

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="h-[44px] px-6 rounded-[8px] disabled:opacity-50"
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2">
      <span
        style={{
          ...F,
          color: "#717d96",
          fontSize: 16,
          minWidth: 130,
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
        }}
      >
        {value || "غير محدد"}
      </span>
    </div>
  );
}