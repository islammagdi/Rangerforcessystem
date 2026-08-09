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

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Option = {
  id: string;
  name: string;
};

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
  placeholder = "اختر...",
}: {
  options: Option[];
  value: string | null;
  onChange: (option: Option) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((option) => option.id === value);

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
            color: disabled
              ? "#cbd2e0"
              : selectedOption
              ? "#2d3648"
              : "#a0abc0",
          }}
        >
          {selectedOption?.name || placeholder}
        </span>
      </button>

      {open && !disabled && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[6px] shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <li>
              <div
                className="w-full text-right px-4 py-3"
                style={{
                  ...FONT,
                  fontSize: 14,
                  color: "#717d96",
                }}
              >
                لا توجد بيانات
              </div>
            </li>
          ) : (
            options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={[
                    "w-full text-right px-4 py-2.5",
                    "hover:bg-[#f5f6fb] transition-colors",
                    option.id === value
                      ? "bg-[#f0f2fd] text-[#1f3d97]"
                      : "text-[#2d3648]",
                  ].join(" ")}
                  style={{
                    ...FONT,
                    fontSize: 14,
                  }}
                >
                  {option.name}
                </button>
              </li>
            ))
          )}
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
      <div className="flex-1 min-w-0">{left}</div>

      <div className="flex-1 min-w-0">{right}</div>
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
  // Soldier
  // ───────────────────────────────────────────────────────────

  const [soldier, setSoldier] = useState<Soldier | null>(null);

  // ───────────────────────────────────────────────────────────
  // Dropdown data
  // ───────────────────────────────────────────────────────────

  const [rankOptions, setRankOptions] = useState<Option[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [unitOptions, setUnitOptions] = useState<Option[]>([]);

  // ───────────────────────────────────────────────────────────
  // Selected values
  // ───────────────────────────────────────────────────────────

  const [rankId, setRankId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);

  // ───────────────────────────────────────────────────────────
  // States
  // ───────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [unitError, setUnitError] = useState("");
  const [error, setError] = useState("");

  // ───────────────────────────────────────────────────────────
  // Load Dropdown Data
  // ───────────────────────────────────────────────────────────

  async function loadDropdownData() {
    try {
      const [ranksResult, categoriesResult, unitsResult] =
        await Promise.all([
          supabase
            .from("ranks")
            .select("id,name")
            .order("name", { ascending: true }),

          supabase
            .from("personnel_categories")
            .select("id,name")
            .order("name", { ascending: true }),

          supabase
            .from("units")
            .select("id,name,code,unit_type,is_active")
            .eq("is_active", true)
            .order("name", { ascending: true }),
        ]);

      if (ranksResult.error) {
        throw ranksResult.error;
      }

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      if (unitsResult.error) {
        throw unitsResult.error;
      }

      setRankOptions(
        (ranksResult.data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
        }))
      );

      setCategoryOptions(
        (categoriesResult.data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
        }))
      );

      // الوحدات الأساسية فقط
      setUnitOptions(
        (unitsResult.data ?? [])
          .filter(
            (unit) =>
              unit.unit_type?.trim().toUpperCase() === "MAIN"
          )
          .map((unit) => ({
            id: unit.id,
            name: unit.name,
          }))
      );
    } catch (err: any) {
      console.error("Error loading dropdown data:", err);

      setError(
        `حدث خطأ أثناء تحميل بيانات القوائم${
          err?.message ? `\n${err.message}` : ""
        }`
      );
    }
  }

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
      const { data, error: loadError } = await supabase
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
        console.error("Error loading soldier:", loadError);

        setError("حدث خطأ أثناء تحميل بيانات الفرد");
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

        militaryId: raw.military_number ?? "",

        name: raw.full_name ?? "",

        rank: raw.ranks?.name ?? "",

        category: raw.personnel_categories?.name ?? "",

        unit: raw.primary_unit?.name ?? "",

        serviceStatus: raw.service_statuses?.name ?? "",

        dischargeDate: raw.discharge_date
          ? formatDate(raw.discharge_date)
          : "",

        attachmentPlace: raw.attachment_unit?.name ?? "",

        rankId: raw.rank_id ?? null,

        categoryId: raw.personnel_category_id ?? null,

        unitId: raw.primary_unit_id ?? null,
      };

      setSoldier(mappedSoldier);

      // تحديد القيم الحالية بالـ IDs
      setRankId(mappedSoldier.rankId);
      setCategoryId(mappedSoldier.categoryId);
      setUnitId(mappedSoldier.unitId);
    } catch (err) {
      console.error("Unexpected error:", err);

      setError("حدث خطأ غير متوقع أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  // ───────────────────────────────────────────────────────────
  // Initial Load
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadPage() {
      setLoading(true);

      await Promise.all([
        loadDropdownData(),
        loadSoldier(),
      ]);

      setLoading(false);
    }

    loadPage();
  }, [id]);

  // ───────────────────────────────────────────────────────────
  // Save
  // ───────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!soldier) return;

    // Validation
    if (!unitId) {
      setUnitError("الوحدة الأساسية مطلوبة");
      return;
    }

    if (!rankId) {
      setError("الدرجة مطلوبة");
      return;
    }

    if (!categoryId) {
      setError("فئة الفرد مطلوبة");
      return;
    }

    setUnitError("");
    setError("");
    setSaving(true);

    try {
      // تحديث نفس الفرد باستخدام IDs مباشرة
      const { error: updateError } = await supabase
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
          updateError
        );

        setError(
          "حدث خطأ أثناء حفظ تعديلات الفرد: " +
            updateError.message
        );

        return;
      }

      // تحديث الحالة المحلية
      const selectedRank = rankOptions.find(
        (x) => x.id === rankId
      );

      const selectedCategory = categoryOptions.find(
        (x) => x.id === categoryId
      );

      const selectedUnit = unitOptions.find(
        (x) => x.id === unitId
      );

      setSoldier((prev) =>
        prev
          ? {
              ...prev,
              rankId,
              categoryId,
              unitId,
              rank: selectedRank?.name ?? prev.rank,
              category:
                selectedCategory?.name ?? prev.category,
              unit: selectedUnit?.name ?? prev.unit,
            }
          : prev
      );

      // الرجوع لتفاصيل نفس الفرد
      navigate(
        `/dashboard/individual-query/soldier/${soldier.id}`
      );
    } catch (err) {
      console.error("Unexpected save error:", err);

      setError(
        "حدث خطأ غير متوقع أثناء حفظ التعديلات"
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
            whiteSpace: "pre-line",
          }}
        >
          {error || "لم يتم العثور على الفرد"}
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/dashboard/individual-query")
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
          fontSize: "clamp(20px, 4vw, 28px)",
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
                    options={rankOptions}
                    value={rankId}
                    onChange={(option) => {
                      setRankId(option.id);
                      setError("");
                    }}
                    placeholder="اختر الدرجة"
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
                    value={soldier.militaryId}
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
                    options={categoryOptions}
                    value={categoryId}
                    onChange={(option) => {
                      setCategoryId(option.id);
                      setError("");
                    }}
                    placeholder="اختر فئة الفرد"
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
                    options={unitOptions}
                    value={unitId}
                    onChange={(option) => {
                      setUnitId(option.id);
                      setUnitError("");
                    }}
                    placeholder="اختر الوحدة الأساسية"
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
                    value={null}
                    onChange={() => {}}
                    disabled
                    placeholder={
                      soldier.attachmentPlace || "-"
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
                    تاريخ التسريح
                  </p>

                  <ReadonlyInput
                    value={soldier.dischargeDate}
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
                    whiteSpace: "pre-line",
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