import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronDown, CalendarDays } from "lucide-react";
import { supabase } from "../../lib/supabase";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const FONT: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

const RANK_OPTIONS = [
  "جندي",
  "عريف",
  "وكيل رقيب",
  "رقيب",
  "رقيب أول",
];

const CATEGORY_OPTIONS = ["مجند", "متطوع"];

const UNIT_OPTIONS = [
  "مج العمليات الخاصة",
  "ك ١١٣ صع",
  "س ١٤٥ اشارة",
  "فرع العمليات",
];

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Soldier = {
  id: string;
  militaryId: string;
  name: string;
  rank: string;
  category: string;
  unit: string;
  serviceStatus: string;
  dischargeDate: string;
  attachmentPlace: string;

  rankId: string | null;
  categoryId: string | null;
  unitId: string | null;
};

// ─────────────────────────────────────────────────────────────
// Dropdown
// ─────────────────────────────────────────────────────────────

function EditDropdown({
  options,
  value,
  onChange,
  disabled = false,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={[
          "w-full h-[42px] rounded-[6px] border border-[#e2e7f0]",
          "flex items-center gap-2 px-3 text-right transition-colors",
          disabled
            ? "bg-[#f5f5f5] cursor-not-allowed"
            : "bg-white hover:border-[#a0aec0]",
        ].join(" ")}
      >
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          style={{
            color: disabled ? "#cbd2e0" : "#2D3648",
          }}
        />

        <span
          className="flex-1 text-right"
          style={{
            ...FONT,
            fontSize: 14,
            color: disabled ? "#cbd2e0" : "#2d3648",
          }}
        >
          {value || "-"}
        </span>
      </button>

      {open && !disabled && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[6px] shadow-lg overflow-hidden">
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={[
                  "w-full text-right px-4 py-2.5",
                  "hover:bg-[#f5f6fb] transition-colors",
                  opt === value
                    ? "bg-[#f0f2fd] text-[#1f3d97]"
                    : "text-[#2d3648]",
                ].join(" ")}
                style={{
                  ...FONT,
                  fontSize: 14,
                }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Readonly Input
// ─────────────────────────────────────────────────────────────

function ReadonlyInput({
  value,
  placeholder,
  note,
  hasCalendar = false,
}: {
  value: string;
  placeholder?: string;
  note?: string;
  hasCalendar?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <div className="w-full h-[42px] rounded-[6px] border border-[#e2e7f0] bg-white flex items-center gap-2 px-3">
        {hasCalendar && (
          <CalendarDays
            size={18}
            style={{ color: "#294dbb" }}
            className="shrink-0"
          />
        )}

        {value ? (
          <span
            className="flex-1 text-right"
            style={{
              ...FONT,
              fontSize: 14,
              color: "#2d3648",
            }}
          >
            {value}
          </span>
        ) : (
          <span
            className="flex-1 text-right"
            style={{
              ...FONT,
              fontSize: 14,
              color: "#cbd2e0",
            }}
          >
            {placeholder || "-"}
          </span>
        )}
      </div>

      {note && (
        <p
          className="text-right"
          style={{
            ...FONT,
            fontSize: 12,
            color: "#717d96",
            lineHeight: 1.5,
          }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Field Pair
// ─────────────────────────────────────────────────────────────

function FieldPair({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="flex-1 min-w-0">
        {left}
      </div>

      <div className="flex-1 min-w-0">
        {right}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Date formatter
// ─────────────────────────────────────────────────────────────

function formatDate(date: string | null | undefined) {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export function SoldierEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ───────────────────────────────────────────────────────────
  // State
  // ───────────────────────────────────────────────────────────

  const [soldier, setSoldier] = useState<Soldier | null>(null);

  const [rank, setRank] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [unitError, setUnitError] = useState("");
  const [error, setError] = useState("");

  // ───────────────────────────────────────────────────────────
  // Load Soldier
  // ───────────────────────────────────────────────────────────

  async function loadSoldier() {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const {
        data,
        error: loadError,
      } = await supabase
        .from("personnel")
        .select(`
          id,
          military_number,
          full_name,
          personnel_category_id,
          primary_unit_id,
          attachment_unit_id,
          service_status_id,
          rank_id,
          discharge_date,

          personnel_categories (
            id,
            name
          ),

          ranks (
            id,
            name
          ),

          primary_unit:units!primary_unit_id (
            id,
            name,
            code
          ),

          attachment_unit:units!attachment_unit_id (
            id,
            name,
            code
          ),

          service_statuses (
            id,
            name
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (loadError) {
        console.error(
          "Error loading soldier:",
          loadError,
        );

        setError(
          "حدث خطأ أثناء تحميل بيانات الفرد",
        );

        setSoldier(null);
        return;
      }

      if (!data) {
        setSoldier(null);
        return;
      }

      const raw = data as any;

      const mappedSoldier: Soldier = {
        id: raw.id,

        militaryId:
          raw.military_number ?? "",

        name:
          raw.full_name ?? "",

        rank:
          raw.ranks?.name ?? "",

        category:
          raw.personnel_categories?.name ?? "",

        unit:
          raw.primary_unit?.name ?? "",

        serviceStatus:
          raw.service_statuses?.name ?? "",

        dischargeDate:
          raw.discharge_date
            ? formatDate(raw.discharge_date)
            : "",

        attachmentPlace:
          raw.attachment_unit?.name ?? "",

        rankId:
          raw.rank_id ?? null,

        categoryId:
          raw.personnel_category_id ?? null,

        unitId:
          raw.primary_unit_id ?? null,
      };

      setSoldier(mappedSoldier);

      // تعبئة الفورم بالبيانات الحالية
      setRank(mappedSoldier.rank);
      setCategory(mappedSoldier.category);
      setUnit(mappedSoldier.unit);
    } catch (err) {
      console.error(
        "Unexpected error:",
        err,
      );

      setError(
        "حدث خطأ غير متوقع أثناء تحميل البيانات",
      );
    } finally {
      setLoading(false);
    }
  }

  // ───────────────────────────────────────────────────────────
  // Load when page opens
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    loadSoldier();
  }, [id]);

  // ───────────────────────────────────────────────────────────
  // Find IDs from names
  // ───────────────────────────────────────────────────────────

  async function getRankId(
    rankName: string,
  ) {
    if (!rankName) return null;

    const { data, error } = await supabase
      .from("ranks")
      .select("id")
      .eq("name", rankName)
      .maybeSingle();

    if (error) {
      console.error(
        "Error finding rank:",
        error,
      );

      return null;
    }

    return data?.id ?? null;
  }

  async function getCategoryId(
    categoryName: string,
  ) {
    if (!categoryName) return null;

    const { data, error } = await supabase
      .from("personnel_categories")
      .select("id")
      .eq("name", categoryName)
      .maybeSingle();

    if (error) {
      console.error(
        "Error finding category:",
        error,
      );

      return null;
    }

    return data?.id ?? null;
  }

  async function getUnitId(
    unitName: string,
  ) {
    if (!unitName) return null;

    const { data, error } = await supabase
      .from("units")
      .select("id")
      .eq("name", unitName)
      .maybeSingle();

    if (error) {
      console.error(
        "Error finding unit:",
        error,
      );

      return null;
    }

    return data?.id ?? null;
  }

  // ───────────────────────────────────────────────────────────
  // Save
  // ───────────────────────────────────────────────────────────

  async function handleSubmit(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    if (!soldier) return;

    // Validation
    if (!unit.trim()) {
      setUnitError(
        "الوحدة الأساسية مطلوبة",
      );
      return;
    }

    setUnitError("");
    setError("");
    setSaving(true);

    try {
      // الحصول على IDs المقابلة للقيم المختارة
      const [
        rankId,
        categoryId,
        unitId,
      ] = await Promise.all([
        getRankId(rank),
        getCategoryId(category),
        getUnitId(unit),
      ]);

      if (!rankId) {
        setError(
          "لم يتم العثور على الدرجة المحددة في قاعدة البيانات",
        );
        return;
      }

      if (!categoryId) {
        setError(
          "لم يتم العثور على فئة الفرد المحددة في قاعدة البيانات",
        );
        return;
      }

      if (!unitId) {
        setError(
          "لم يتم العثور على الوحدة المحددة في قاعدة البيانات",
        );
        return;
      }

      // تحديث نفس الفرد باستخدام id الموجود في الرابط
      const {
        error: updateError,
      } = await supabase
        .from("personnel")
        .update({
          rank_id: rankId,
          personnel_category_id: categoryId,
          primary_unit_id: unitId,
        })
        .eq("id", soldier.id);

      if (updateError) {
        console.error(
          "Update personnel error:",
          updateError,
        );

        setError(
          "حدث خطأ أثناء حفظ تعديلات الفرد: " +
            updateError.message,
        );

        return;
      }

      // بعد نجاح الحفظ نرجع لتفاصيل نفس الفرد
      navigate(
        `/dashboard/individual-query/soldier/${soldier.id}`,
      );
    } catch (err) {
      console.error(
        "Unexpected save error:",
        err,
      );

      setError(
        "حدث خطأ غير متوقع أثناء حفظ التعديلات",
      );
    } finally {
      setSaving(false);
    }
  }

  // ───────────────────────────────────────────────────────────
  // Loading
  // ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        dir="rtl"
      >
        <p
          style={{
            ...FONT,
            fontSize: 18,
            color: "#717d96",
          }}
        >
          جاري تحميل بيانات الفرد...
        </p>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────
  // Not Found
  // ───────────────────────────────────────────────────────────

  if (!soldier) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 gap-4"
        dir="rtl"
      >
        <p
          style={{
            ...FONT,
            fontSize: 18,
            color: "#717d96",
          }}
        >
          {error || "لم يتم العثور على الفرد"}
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/dashboard/individual-query",
            )
          }
          className="px-4 py-2 rounded-lg text-white"
          style={{
            ...FONT,
            backgroundColor: "#2d3648",
          }}
        >
          العودة للبحث
        </button>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col gap-5 w-full"
      dir="rtl"
    >
      {/* Title */}

      <h1
        className="text-center w-full"
        style={{
          ...FONT,
          fontWeight: 700,
          fontSize:
            "clamp(20px, 4vw, 28px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        البيانات الشخصية لفرد
      </h1>

      {/* Form */}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">

          {/* Header */}

          <div className="flex items-center justify-start gap-3 px-6 py-4 border-b border-[#cbd2e0]">
            <span
              style={{
                ...FONT,
                fontSize: 18,
                color: "#4a5468",
              }}
            >
              البيانات التعريفية
            </span>
          </div>

          {/* Fields */}

          <div className="flex flex-col gap-4 px-6 py-5">

            {/* Row 1 */}

            <FieldPair
              left={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    الدرجة
                  </p>

                  <EditDropdown
                    options={RANK_OPTIONS}
                    value={rank}
                    onChange={setRank}
                  />
                </div>
              }
              right={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    الرقم العسكري
                  </p>

                  <ReadonlyInput
                    value={
                      soldier.militaryId
                    }
                  />
                </div>
              }
            />

            {/* Row 2 */}

            <FieldPair
              left={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    فئة الفرد
                  </p>

                  <EditDropdown
                    options={
                      CATEGORY_OPTIONS
                    }
                    value={category}
                    onChange={
                      setCategory
                    }
                  />
                </div>
              }
              right={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    الاسم
                  </p>

                  <ReadonlyInput
                    value={soldier.name}
                  />
                </div>
              }
            />

            {/* Row 3 */}

            <FieldPair
              left={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    الوحدة الأساسية
                  </p>

                  <EditDropdown
                    options={UNIT_OPTIONS}
                    value={unit}
                    onChange={(v) => {
                      setUnit(v);
                      setUnitError("");
                    }}
                  />

                  {unitError && (
                    <p
                      className="text-right mt-1"
                      style={{
                        ...FONT,
                        fontSize: 12,
                        color: "#ef4444",
                      }}
                    >
                      {unitError}
                    </p>
                  )}
                </div>
              }
              right={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    الموقف الخدمي
                  </p>

                  <ReadonlyInput
                    value=""
                    placeholder="قوة الوحده"
                    note="هذا الحقل لا يمكن التعديل فيه الا عن طريق اصدار خطاب الحاق/انهاء الحاق"
                  />
                </div>
              }
            />

            {/* Row 4 */}

            <FieldPair
              left={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    جهة الإلحاق
                  </p>

                  <EditDropdown
                    options={[]}
                    value={
                      soldier.attachmentPlace
                    }
                    onChange={() => {}}
                    disabled
                  />
                </div>
              }
              right={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    تاريخ التسريح
                  </p>

                  <ReadonlyInput
                    value={
                      soldier.dischargeDate
                    }
                    hasCalendar
                  />
                </div>
              }
            />

            {/* Error */}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p
                  className="text-right"
                  style={{
                    ...FONT,
                    fontSize: 13,
                    color: "#dc2626",
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Save */}

            <div className="flex items-start pt-1">
              <button
                type="submit"
                disabled={saving}
                className={[
                  "flex items-center justify-center px-5 h-10 rounded-[8px]",
                  "transition-opacity",
                  saving
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:opacity-90 active:opacity-80",
                ].join(" ")}
                style={{
                  background:
                    "linear-gradient(to bottom, #00b867, #00522e)",
                }}
              >
                <span
                  style={{
                    ...FONT,
                    fontSize: 14,
                    color: "#f5f5f5",
                  }}
                >
                  {saving
                    ? "جاري الحفظ..."
                    : "اعتماد التعديل"}
                </span>
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}