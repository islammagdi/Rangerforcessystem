import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import imgDocs from "figma:asset/0b415e099a9a0d48863970a33cf2c018036bb031.png";
import { Clock, CalendarDays, User } from "lucide-react";
import { supabase } from "../../lib/supabase";

// ============================================================================
// Types
// ============================================================================

interface Personnel {
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

interface Rank {
  id: string;
  name: string;
  code: string | null;
}

interface PersonnelCategory {
  id: string;
  name: string;
  code: string;
}

interface ServiceStatus {
  id: string;
  name: string;
  code: string;
}

interface Unit {
  id: string;
  name: string;
  code: string | null;
  unit_type: string | null;
}

interface SuccessPageState {
  personnelId?: string;
}

// ============================================================================
// Style
// ============================================================================

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ============================================================================
// Helpers
// ============================================================================

function formatDate(
  date: string | null | undefined
): string {
  if (!date) {
    return "لا يوجد";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatTime(
  date: string | null | undefined
): string {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// Stepper
// ============================================================================

function GreenCheck({
  id,
}: {
  id: string;
}) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
    >
      <defs>
        <linearGradient
          id={`g-${id}`}
          x1="16"
          x2="16"
          y1="0"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00B867" />
          <stop offset="1" stopColor="#00522E" />
        </linearGradient>
      </defs>

      <circle
        cx="16"
        cy="16"
        r="15"
        fill={`url(#g-${id})`}
        stroke={`url(#g-${id})`}
        strokeWidth="2"
      />

      <path
        d="M10 16.5L13.5 20L22 12"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepDots({
  color = "#2d3648",
}: {
  color?: string;
}) {
  return (
    <div className="flex items-center gap-[3px] mx-2 mt-[14px]">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] h-[3px] rounded-full shrink-0"
          style={{
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}

function Stepper() {
  const steps = [
    {
      id: "s3",
      label: "ادخال البيانات",
    },
    {
      id: "s2",
      label: "المراجعة",
    },
    {
      id: "s1",
      label: "اعتماد النهائي",
    },
  ];

  return (
    <div
      className="flex items-start justify-center"
      dir="rtl"
    >
      {steps.map((step, index) => (
        <div
          key={step.id}
          className="flex items-start"
        >
          <div className="flex flex-col items-center gap-2">
            <GreenCheck id={step.id} />

            <span
              style={{
                ...F,
                fontWeight: 700,
                fontSize: 14,
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                whiteSpace: "nowrap",
              }}
            >
              {step.label}
            </span>
          </div>

          {index < steps.length - 1 && (
            <StepDots />
          )}
        </div>
      ))}
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
      className="flex items-start gap-2 justify-start flex-1 min-w-0"
      dir="rtl"
    >
      <span
        className="w-[130px] shrink-0 text-right"
        style={{
          ...F,
          fontSize: 18,
          color: "#717d96",
        }}
      >
        {label}
      </span>

      <span
        style={{
          ...F,
          fontSize: 18,
          color: "#172e78",
        }}
      >
        :
      </span>

      <span
        style={{
          ...F,
          fontSize: 18,
          color: "#2d3648",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value || "لا يوجد"}
      </span>
    </div>
  );
}

// ============================================================================
// Loading
// ============================================================================

function LoadingState() {
  return (
    <div
      className="w-full min-h-[400px] flex items-center justify-center"
      dir="rtl"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="
            w-10 h-10 rounded-full
            border-4
            border-[#dce8dd]
            border-t-[#00522e]
            animate-spin
          "
        />

        <p
          style={{
            ...F,
            fontSize: 17,
            color: "#415844",
          }}
        >
          جاري تحميل بيانات الفرد...
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Error
// ============================================================================

function ErrorState({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <div
      className="w-full min-h-[400px] flex items-center justify-center"
      dir="rtl"
    >
      <div
        className="
          bg-white
          border
          border-[#eff0f6]
          rounded-[20px]
          p-8
          flex
          flex-col
          items-center
          gap-5
          max-w-[600px]
          w-full
        "
      >
        <div
          className="
            w-14
            h-14
            rounded-full
            bg-[#fff1f1]
            flex
            items-center
            justify-center
          "
        >
          <span
            style={{
              ...F,
              fontSize: 28,
              color: "#dc2626",
              fontWeight: 700,
            }}
          >
            !
          </span>
        </div>

        <p
          className="text-center"
          style={{
            ...F,
            fontSize: 18,
            color: "#2d3648",
            fontWeight: 700,
          }}
        >
          تعذر تحميل بيانات الفرد
        </p>

        <p
          className="text-center"
          style={{
            ...F,
            fontSize: 14,
            color: "#717d96",
            lineHeight: 1.8,
          }}
        >
          {message}
        </p>

        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-6 rounded-[8px]"
          style={{
            background:
              "linear-gradient(to bottom, #00b867, #00522e)",
          }}
        >
          <span
            style={{
              ...F,
              fontSize: 15,
              color: "white",
            }}
          >
            العودة
          </span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Audit Strip
// ============================================================================

function AuditStrip({
  createdAt,
}: {
  createdAt: string | null;
}) {
  return (
    <div
      className="flex flex-col gap-2 items-start w-full"
      dir="rtl"
    >
      <p
        style={{
          ...F,
          fontSize: 14,
          color: "#4a5468",
        }}
      >
        بيانات الاعتماد
      </p>

      <div
        className="
          flex
          items-center
          gap-3
          border
          border-[#e7e7e7]
          rounded-[12px]
          px-3
          py-3
          flex-wrap
        "
      >
        <div className="flex items-center gap-1">
          <User
            size={18}
            className="text-[#a0abc0]"
          />

          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#4a5468",
              whiteSpace: "nowrap",
            }}
          >
            تم اعتماد القيد بنجاح
          </span>
        </div>

        {createdAt && (
          <>
            <div className="h-3 w-px bg-[#cbd2e0]" />

            <div className="flex items-center gap-1">
              <CalendarDays
                size={18}
                className="text-[#a0abc0]"
              />

              <span
                style={{
                  ...F,
                  fontSize: 14,
                  color: "#4a5468",
                  whiteSpace: "nowrap",
                }}
              >
                {formatDate(createdAt)}
              </span>
            </div>

            <div className="h-3 w-px bg-[#cbd2e0]" />

            <div className="flex items-center gap-1">
              <Clock
                size={18}
                className="text-[#a0abc0]"
              />

              <span
                style={{
                  ...F,
                  fontSize: 14,
                  color: "#4a5468",
                  whiteSpace: "nowrap",
                }}
              >
                {formatTime(createdAt)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export function SuccessSoldierPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // ==========================================================================
  // ID القادم من صفحة المراجعة
  // ==========================================================================

  const state =
    (location.state as SuccessPageState | null) ??
    null;

  const personnelId = state?.personnelId;

  // ==========================================================================
  // State
  // ==========================================================================

  const [personnel, setPersonnel] =
    useState<Personnel | null>(null);

  const [rank, setRank] =
    useState<Rank | null>(null);

  const [category, setCategory] =
    useState<PersonnelCategory | null>(null);

  const [status, setStatus] =
    useState<ServiceStatus | null>(null);

  const [primaryUnit, setPrimaryUnit] =
    useState<Unit | null>(null);

  const [attachmentUnit, setAttachmentUnit] =
    useState<Unit | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================================================
  // Load
  // ==========================================================================

  useEffect(() => {
    if (!personnelId) {
      setError(
        "لم يتم العثور على رقم سجل الفرد. يجب فتح صفحة الاعتماد من صفحة المراجعة."
      );

      setLoading(false);
      return;
    }

    loadPersonnel(personnelId);
  }, [personnelId]);

  // ==========================================================================
  // Load personnel from database
  // ==========================================================================

  async function loadPersonnel(
    id: string
  ) {
    try {
      setLoading(true);
      setError("");

      // ----------------------------------------------------------------------
      // 1. تحميل سجل الفرد
      // ----------------------------------------------------------------------

      const {
        data: personnelData,
        error: personnelError,
      } = await supabase
        .from("personnel")
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
        .eq("id", id)
        .single();

      if (personnelError) {
        console.error(
          "Personnel error:",
          personnelError
        );

        throw personnelError;
      }

      if (!personnelData) {
        throw new Error(
          "لم يتم العثور على بيانات الفرد في قاعدة البيانات."
        );
      }

      setPersonnel(personnelData);

      // ----------------------------------------------------------------------
      // 2. تحميل بيانات الجداول المرتبطة
      // ----------------------------------------------------------------------

      const [
        rankResult,
        categoryResult,
        statusResult,
        primaryUnitResult,
        attachmentUnitResult,
      ] = await Promise.all([
        // الدرجة
        supabase
          .from("ranks")
          .select("id, name, code")
          .eq(
            "id",
            personnelData.rank_id
          )
          .maybeSingle(),

        // فئة الفرد
        supabase
          .from("personnel_categories")
          .select("id, name, code")
          .eq(
            "id",
            personnelData.personnel_category_id
          )
          .maybeSingle(),

        // الموقف الخدمي
        supabase
          .from("service_statuses")
          .select("id, name, code")
          .eq(
            "id",
            personnelData.service_status_id
          )
          .maybeSingle(),

        // الوحدة الأساسية
        supabase
          .from("units")
          .select(
            "id, name, code, unit_type"
          )
          .eq(
            "id",
            personnelData.primary_unit_id
          )
          .maybeSingle(),

        // جهة الإلحاق
        personnelData.attachment_unit_id
          ? supabase
              .from("units")
              .select(
                "id, name, code, unit_type"
              )
              .eq(
                "id",
                personnelData.attachment_unit_id
              )
              .maybeSingle()
          : Promise.resolve({
              data: null,
              error: null,
            }),
      ]);

      // ----------------------------------------------------------------------
      // 3. التحقق من أخطاء lookup
      // ----------------------------------------------------------------------

      if (rankResult.error) {
        throw rankResult.error;
      }

      if (categoryResult.error) {
        throw categoryResult.error;
      }

      if (statusResult.error) {
        throw statusResult.error;
      }

      if (primaryUnitResult.error) {
        throw primaryUnitResult.error;
      }

      if (attachmentUnitResult.error) {
        throw attachmentUnitResult.error;
      }

      // ----------------------------------------------------------------------
      // 4. حفظ البيانات
      // ----------------------------------------------------------------------

      setRank(
        rankResult.data ?? null
      );

      setCategory(
        categoryResult.data ?? null
      );

      setStatus(
        statusResult.data ?? null
      );

      setPrimaryUnit(
        primaryUnitResult.data ?? null
      );

      setAttachmentUnit(
        attachmentUnitResult.data ?? null
      );
    } catch (err) {
      console.error(
        "Error loading personnel:",
        err
      );

      setError(
        "حدث خطأ أثناء تحميل بيانات الفرد من قاعدة البيانات."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================================
  // Loading
  // ==========================================================================

  if (loading) {
    return <LoadingState />;
  }

  // ==========================================================================
  // Error
  // ==========================================================================

  if (error || !personnel) {
    return (
      <ErrorState
        message={
          error ||
          "بيانات الفرد غير متاحة."
        }
        onBack={() =>
          navigate(
            "/dashboard/add-soldier"
          )
        }
      />
    );
  }

  // ==========================================================================
  // Display values
  // ==========================================================================

  const rankName =
    rank?.name ?? "غير محدد";

  const categoryName =
    category?.name ?? "غير محدد";

  const statusName =
    status?.name ?? "غير محدد";

  const primaryUnitName =
    primaryUnit?.name ?? "غير محدد";

  const attachmentUnitName =
    attachmentUnit?.name ?? "لا يوجد";

  const dischargeDate =
    personnel.discharge_date
      ? formatDate(
          personnel.discharge_date
        )
      : "لا يوجد";

  // ==========================================================================
  // UI
  // ==========================================================================

  return (
    <div
      className="flex flex-col gap-6 w-full"
      dir="rtl"
    >
      {/* Stepper */}

      <div className="flex justify-center">
        <Stepper />
      </div>

      {/* Main Card */}

      <div
        className="
          bg-white
          rounded-[20px]
          border
          border-[#eff0f6]
          w-full
          overflow-hidden
        "
      >
        <div
          className="
            flex
            flex-col
            gap-6
            px-6
            py-5
            items-center
          "
        >
          {/* Success title */}

          <p
            className="text-center"
            style={{
              ...F,
              fontWeight: 700,
              fontSize:
                "clamp(22px, 4vw, 32px)",
              background:
                "linear-gradient(to bottom, #00b867, #00522e)",
              WebkitBackgroundClip:
                "text",
              WebkitTextFillColor:
                "transparent",
              lineHeight: 1.5,
            }}
          >
            تم اعتماد القيد بنجاح
          </p>

          {/* Documents */}

          <div
            className="
              relative
              flex
              items-end
              justify-center
            "
            style={{
              width: 270,
              height: 200,
            }}
          >
            <img
              src={imgDocs}
              alt="documents"
              className="
                absolute
                inset-0
                w-full
                object-cover
              "
              style={{
                height: "103.47%",
              }}
            />

            <div className="relative z-10 mb-1">
              <svg
                width="96"
                height="96"
                viewBox="0 0 96 96"
                fill="none"
              >
                <defs>
                  <linearGradient
                    id="gc-badge"
                    x1="48"
                    x2="48"
                    y1="3"
                    y2="93"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00B867" />
                    <stop
                      offset="1"
                      stopColor="#00522E"
                    />
                  </linearGradient>
                </defs>

                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="url(#gc-badge)"
                />

                <path
                  d="M30 48L42 60L66 36"
                  stroke="#FFFCEE"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Data Card */}

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
                gap-5
                px-6
                py-5
              "
              style={{
                ...F,
                fontSize: 18,
              }}
            >
              {/* Row 1 */}

              <div className="flex flex-wrap gap-6">
                <InfoRow
                  label="الدرجة"
                  value={rankName}
                />

                <InfoRow
                  label="الرقم العسكري"
                  value={
                    personnel.military_number
                  }
                />
              </div>

              {/* Row 2 */}

              <div className="flex flex-wrap gap-6">
                <InfoRow
                  label="فئة الفرد"
                  value={categoryName}
                />

                <InfoRow
                  label="الاسم"
                  value={
                    personnel.full_name
                  }
                />
              </div>

              {/* Row 3 */}

              <div className="flex flex-wrap gap-6">
                <InfoRow
                  label="الوحدة الأساسية"
                  value={
                    primaryUnitName
                  }
                />

                <InfoRow
                  label="الموقف الخدمي"
                  value={statusName}
                />
              </div>

              {/* Row 4 */}

              <div className="flex flex-wrap gap-6">
                <InfoRow
                  label="جهة الإلحاق"
                  value={
                    attachmentUnitName
                  }
                />

                <InfoRow
                  label="تاريخ التسريح"
                  value={dischargeDate}
                />
              </div>

              {/* Row 5 */}

              <div className="flex flex-wrap gap-6">
                <InfoRow
                  label="حالة الفرد"
                  value={
                    personnel.is_active
                      ? "نشط"
                      : "غير نشط"
                  }
                />

                <InfoRow
                  label="تاريخ القيد"
                  value={formatDate(
                    personnel.created_at
                  )}
                />
              </div>
            </div>
          </div>

          {/* Audit */}

          <AuditStrip
            createdAt={
              personnel.created_at
            }
          />

          {/* Buttons */}

          <div
            className="
              flex
              flex-wrap
              gap-3
              items-center
              w-full
              justify-end
            "
          >
            {/* Add another */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard/add-soldier"
                )
              }
              className="
                flex
                items-center
                justify-center
                min-h-[44px]
                px-5
                rounded-[8px]
                transition-opacity
                hover:opacity-90
                active:opacity-80
              "
              style={{
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
              }}
            >
              <span
                style={{
                  ...F,
                  fontSize: 16,
                  color: "#f5f5f5",
                }}
              >
                إضافة فرد آخر
              </span>
            </button>

            {/* Dashboard */}

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="
                flex
                items-center
                justify-center
                min-h-[44px]
                px-5
                rounded-[8px]
                bg-[#DCF4DF]
                transition-opacity
                hover:opacity-90
                active:opacity-80
              "
            >
              <span
                style={{
                  ...F,
                  fontSize: 16,
                  color: "#2d3648",
                }}
              >
                الموقف العام
              </span>
            </button>

            {/* Letter */}

            <button
              type="button"
              onClick={() => {
                // إصدار الخطاب لاحقًا
              }}
              className="
                flex
                items-center
                justify-center
                min-h-[44px]
                px-4
                rounded-[8px]
                transition-opacity
                hover:opacity-80
              "
            >
              <span
                style={{
                  ...F,
                  fontSize: 16,
                  color: "#273629",
                  textDecoration:
                    "underline",
                }}
              >
                إصدار خطاب
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}