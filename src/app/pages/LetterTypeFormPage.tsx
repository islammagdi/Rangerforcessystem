import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowRight,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  Eye,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import type {
  ExtraFieldDefinition,
  ExtraFieldType,
  ExtraFieldScope,
  AllowedPersonnelField,
  PersonnelEffectRule,
  EligibilityRule,
  BaseSoldierColumnKey,
  LetterTypeConfig,
} from "../../lib/letterTypeEngine";
import { usePermissions } from "../../lib/usePermissions";
import { useUnsavedChanges } from "../../lib/unsavedChanges";
import {
  BASE_SOLDIER_COLUMNS,
  DEFAULT_VISIBLE_SOLDIER_COLUMNS,
  DEFAULT_PRINT_VISIBLE_SOLDIER_COLUMNS,
  getLetterScopedFields,
  getSoldierScopedFields,
  getTableVisibleSoldierFields,
  renderLetterBody,
  resolveSoldierFieldForTemplate,
} from "../../lib/letterTypeEngine";
import { STAGE_MONTHS } from "../../lib/trainingRecommendations";
import imgEagle from "figma:asset/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";
import { todayLocalIso } from "../../lib/dates";
const PF: React.CSSProperties = {
  fontFamily: "'Times New Roman', Times, serif",
};
const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

type VariableOption = {
  key: string;
  label: string;
};

// ✅ متغيرات ثابتة متاحة دايمًا لأي نوع خطاب، بغض النظر عن
// الحقول الإضافية المُعرَّفة له
const FIXED_VARIABLES: VariableOption[] = [
  { key: "date", label: "التاريخ" },
  { key: "stageLabel", label: "المرحلة التجنيدية (شهر + سنة)" },
];

const FIELD_TYPE_OPTIONS: { value: ExtraFieldType; label: string }[] = [
  { value: "text", label: "نص قصير" },
  { value: "textarea", label: "نص طويل (فقرة)" },
  { value: "number", label: "رقم" },
  { value: "date", label: "تاريخ" },
  { value: "month", label: "شهر (قائمة الشهور)" },
  { value: "select_unit", label: "اختيار من الوحدات" },
  { value: "select_administration", label: "اختيار من الإدارات الخارجية" },
];

// ✅ القايمة البيضاء لحقول الفرد، بشكلها اللي يظهر للمدير + الجدول
// المرجعي المستخدم لجلب قيم "قيمة ثابتة" لكل حقل
const PERSONNEL_FIELD_OPTIONS: {
  value: AllowedPersonnelField;
  label: string;
  refTable: "service_statuses" | "units";
}[] = [
  { value: "service_status_id", label: "الحالة الخدمية", refTable: "service_statuses" },
  { value: "attachment_unit_id", label: "وحدة الإلحاق", refTable: "units" },
  { value: "primary_unit_id", label: "الوحدة الأساسية", refTable: "units" },
];

const EFFECT_ACTION_OPTIONS: { value: "set_value" | "set_from_field" | "clear"; label: string }[] = [
  { value: "set_value", label: "قيمة ثابتة" },
  { value: "set_from_field", label: "قيمة من حقل بالفورم" },
  { value: "clear", label: "تفريغ الحقل" },
];

// ✅ شكل التأثير أثناء التعديل في الفورم
type FormPersonnelEffect = {
  _localId: string;
  field: AllowedPersonnelField | "";
  action: "set_value" | "set_from_field" | "clear" | "";
  value?: string;
  source?: string;
};

type EligibilityRuleType =
  | "requires_service_status"
  | "requires_category"
  | "one_time_lifetime"
  | "no_pending_undocumented_letter"
  | "requires_administration"
  | "requires_primary_unit";

const RULE_TYPE_OPTIONS: { value: EligibilityRuleType; label: string }[] = [
  { value: "requires_service_status", label: "يتطلب حالة خدمية معيّنة" },
  { value: "requires_category", label: "يتطلب فئة معيّنة" },
  { value: "one_time_lifetime", label: "مرة واحدة فقط في حياة الفرد" },
  { value: "no_pending_undocumented_letter", label: "لا يوجد خطاب سابق غير موثّق" },
  { value: "requires_administration", label: "يتطلب إدارة معيّنة" },
  { value: "requires_primary_unit", label: "يتطلب وحدة أساسية معيّنة" },
];

// ✅ شكل قاعدة الأهلية أثناء التعديل في الفورم
type FormEligibilityRule = {
  _localId: string;
  type: EligibilityRuleType | "";
  status_code?: string;
  category_code?: string;
  applies_to_codes?: string[];
  administration_codes?: string[];
  unit_ids?: string[];
  error_message: string;
};

// ✅ شكل الحقل أثناء التعديل في الفورم — زي ExtraFieldDefinition
// بالظبط + معرّف محلي بس لأغراض React key (بيتشال قبل الحفظ)
type FormExtraField = ExtraFieldDefinition & { _localId: string };

function normalizeCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

function normalizeFieldKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function makeLocalId(): string {
  return Math.random().toString(36).slice(2);
}

/* =========================================================
   مربع نص + شريط أزرار لإدراج متغيّر في مكان الكيرسور
========================================================= */

function TemplateEditor({
  label,
  value,
  onChange,
  variables,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  variables: VariableOption[];
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertVariable(variableKey: string) {
    const textarea = textareaRef.current;
    const token = `{{${variableKey}}}`;

    if (!textarea) {
      onChange(value + token);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;

    const newValue = value.slice(0, start) + token + value.slice(end);
    onChange(newValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + token.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <label style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>
        {label}
      </label>

      <div className="flex flex-wrap gap-2">
        {variables.map((variable) => (
          <button
            key={variable.key}
            type="button"
            onClick={() => insertVariable(variable.key)}
            className="px-3 py-1.5 rounded-[6px] transition-colors hover:opacity-80"
            style={{ ...F, fontSize: 12, background: "#ebedfd", color: "#1f3d97" }}
          >
            + {variable.label}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        dir="rtl"
        placeholder="اكتب نص الخطاب هنا، واضغط على الأزرار فوق لإدراج المتغيرات في مكان الكيرسور"
        className="w-full bg-white border border-[#e2e7f0] rounded-[8px] px-3 py-3 text-right outline-none resize-none focus:border-[#1f3d97] transition-colors"
        style={{ ...F, fontSize: 15, color: "#2d3648", lineHeight: 1.8 }}
      />
    </div>
  );
}

/* =========================================================
   بطاقة حقل إضافي واحد
========================================================= */

function ExtraFieldCard({
  field,
  onChange,
  onDelete,
  errors,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  field: FormExtraField;
  onChange: (updated: FormExtraField) => void;
  onDelete: () => void;
  errors?: { key?: string; label?: string };
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const showForbidSameUnit = field.type === "select_unit";
  const isSoldierScope = field.scope === "soldier";

  return (
    <div className="rounded-[12px] border border-[#e2e7f0] p-4 flex flex-col gap-4 bg-[#fafbfc]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
              اسم الحقل (بيظهر للمستخدم)
            </label>

            <input
              type="text"
              value={field.label}
              onChange={(e) => onChange({ ...field, label: e.target.value })}
              placeholder="مثال: سبب الإلحاق"
              dir="rtl"
              className={[
                "w-full h-[42px] bg-white border rounded-[8px] px-3 text-right outline-none focus:border-[#1f3d97] transition-colors",
                errors?.label ? "border-[#ef4444]" : "border-[#e2e7f0]",
              ].join(" ")}
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />

            {errors?.label && (
              <p style={{ ...F, fontSize: 12, color: "#ef4444" }}>{errors.label}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
              المفتاح (يُستخدم في القالب كـ {"{{"}المفتاح{"}}"})
            </label>

            <input
              type="text"
              value={field.key}
              onChange={(e) => onChange({ ...field, key: e.target.value })}
              onBlur={() => onChange({ ...field, key: normalizeFieldKey(field.key) })}
              placeholder="مثال: reason"
              dir="ltr"
              className={[
                "w-full h-[42px] bg-white border rounded-[8px] px-3 text-left outline-none focus:border-[#1f3d97] transition-colors",
                errors?.key ? "border-[#ef4444]" : "border-[#e2e7f0]",
              ].join(" ")}
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            />

            {errors?.key && (
              <p style={{ ...F, fontSize: 12, color: "#ef4444" }}>{errors.key}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="w-9 h-[18px] rounded-t-[6px] flex items-center justify-center disabled:opacity-30"
            style={{ backgroundColor: "#f1f3f9" }}
            title="تحريك لأعلى"
          >
            <ChevronUp size={13} style={{ color: "#4a5468" }} />
          </button>

          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="w-9 h-[18px] rounded-b-[6px] flex items-center justify-center disabled:opacity-30"
            style={{ backgroundColor: "#f1f3f9" }}
            title="تحريك لأسفل"
          >
            <ChevronDown size={13} style={{ color: "#4a5468" }} />
          </button>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#fce8f1" }}
          title="حذف الحقل"
        >
          <Trash2 size={14} style={{ color: "#e3282c" }} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
            نوع الحقل
          </label>

          <select
            value={field.type}
            onChange={(e) =>
              onChange({ ...field, type: e.target.value as ExtraFieldType })
            }
            dir="rtl"
            className="w-full h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#1f3d97] bg-white"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          >
            {FIELD_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
            نطاق الحقل
          </label>

          <div className="flex items-center gap-4 h-[42px]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={field.scope === "letter"}
                onChange={() => onChange({ ...field, scope: "letter" as ExtraFieldScope })}
              />
              <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>بيانات الخطاب</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={field.scope === "soldier"}
                onChange={() => onChange({ ...field, scope: "soldier" as ExtraFieldScope })}
              />
              <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>كل فرد لوحده</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 justify-end">
          <label className="flex items-center gap-1.5 cursor-pointer h-[42px]">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onChange({ ...field, required: e.target.checked })}
            />
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>إجباري</span>
          </label>
        </div>
      </div>

      {(isSoldierScope || showForbidSameUnit) && (
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[#eff0f6]">
          {isSoldierScope && (
            <div className="flex flex-col gap-1.5 flex-1">
              <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
                قيمة افتراضية (اختياري)
              </label>

              <input
                type="text"
                value={field.default_value ?? ""}
                onChange={(e) => onChange({ ...field, default_value: e.target.value })}
                dir="rtl"
                className="w-full h-[42px] bg-white border border-[#e2e7f0] rounded-[8px] px-3 text-right outline-none focus:border-[#1f3d97]"
                style={{ ...F, fontSize: 14, color: "#2d3648" }}
              />
            </div>
          )}

          {isSoldierScope && (
            <div className="flex flex-col gap-1.5 flex-1">
              <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
                نص بديل عند اختلاف الأفراد (اختياري)
              </label>

              <input
                type="text"
                value={field.plural_fallback_text ?? ""}
                onChange={(e) =>
                  onChange({ ...field, plural_fallback_text: e.target.value })
                }
                placeholder="مثال: الموضحة بالجدول"
                dir="rtl"
                className="w-full h-[42px] bg-white border border-[#e2e7f0] rounded-[8px] px-3 text-right outline-none focus:border-[#1f3d97]"
                style={{ ...F, fontSize: 14, color: "#2d3648" }}
              />
            </div>
          )}

          {isSoldierScope && (
            <div className="flex flex-col gap-1.5 justify-end">
              <label className="flex items-center gap-1.5 cursor-pointer h-[42px]">
                <input
                  type="checkbox"
                  checked={field.show_in_table !== false}
                  onChange={(e) =>
                    onChange({ ...field, show_in_table: e.target.checked })
                  }
                />
                <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                  إظهار الحقل كعمود في الجدول
                </span>
              </label>
            </div>
          )}
          {showForbidSameUnit && (
            <div className="flex flex-col gap-1.5 justify-end">
              <label className="flex items-center gap-1.5 cursor-pointer h-[42px]">
                <input
                  type="checkbox"
                  checked={Boolean(field.forbid_same_as_primary_unit)}
                  onChange={(e) =>
                    onChange({
                      ...field,
                      forbid_same_as_primary_unit: e.target.checked,
                    })
                  }
                />
                <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                  منع اختيار نفس وحدة الفرد الأساسية
                </span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   بطاقة تأثير واحد على بيانات الفرد
========================================================= */

function EffectCard({
  effect,
  onChange,
  onDelete,
  serviceStatuses,
  units,
  currentFields,
}: {
  effect: FormPersonnelEffect;
  onChange: (updated: FormPersonnelEffect) => void;
  onDelete: () => void;
  serviceStatuses: { id: string; name: string }[];
  units: { id: string; name: string }[];
  currentFields: FormExtraField[];
}) {
  const selectedFieldConfig = PERSONNEL_FIELD_OPTIONS.find(
    (f) => f.value === effect.field
  );

  const referenceOptions =
    selectedFieldConfig?.refTable === "service_statuses"
      ? serviceStatuses
      : selectedFieldConfig?.refTable === "units"
      ? units
      : [];

  return (
    <div className="rounded-[12px] border border-[#e2e7f0] p-4 flex flex-col gap-3 bg-[#fafbfc]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
              الحقل المتأثر
            </label>

            <select
              value={effect.field}
              onChange={(e) =>
                onChange({
                  ...effect,
                  field: e.target.value as AllowedPersonnelField,
                  value: "",
                  source: "",
                })
              }
              dir="rtl"
              className="w-full h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#1f3d97] bg-white"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              <option value="">اختر الحقل</option>
              {PERSONNEL_FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
              الإجراء
            </label>

            <select
              value={effect.action}
              onChange={(e) =>
                onChange({
                  ...effect,
                  action: e.target.value as FormPersonnelEffect["action"],
                  value: "",
                  source: "",
                })
              }
              dir="rtl"
              className="w-full h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#1f3d97] bg-white"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              <option value="">اختر الإجراء</option>
              {EFFECT_ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#fce8f1" }}
          title="حذف التأثير"
        >
          <Trash2 size={14} style={{ color: "#e3282c" }} />
        </button>
      </div>

      {effect.action === "set_value" && (
        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
            القيمة الثابتة
          </label>

          {referenceOptions.length > 0 ? (
            <select
              value={effect.value ?? ""}
              onChange={(e) => onChange({ ...effect, value: e.target.value })}
              dir="rtl"
              className="w-full h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#1f3d97] bg-white"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              <option value="">اختر القيمة</option>
              {referenceOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          ) : (
            <p style={{ ...F, fontSize: 13, color: "#8a6500" }}>
              اختر الحقل الأول عشان تظهر القيم المتاحة له
            </p>
          )}
        </div>
      )}

      {effect.action === "set_from_field" && (
        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
            الحقل اللي هتُؤخذ منه القيمة
          </label>

          {currentFields.length > 0 ? (
            <select
              value={effect.source ?? ""}
              onChange={(e) => onChange({ ...effect, source: e.target.value })}
              dir="rtl"
              className="w-full h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#1f3d97] bg-white"
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              <option value="">اختر الحقل</option>
              {currentFields.map((f) => (
                <option key={f._localId} value={f.key}>
                  {f.label || "(بدون اسم)"} ({f.key || "بدون مفتاح"})
                </option>
              ))}
            </select>
          ) : (
            <p style={{ ...F, fontSize: 13, color: "#8a6500" }}>
              لازم تضيف حقل في قسم "الحقول الإضافية" فوق الأول عشان تقدر تختاره هنا
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   بطاقة قاعدة أهلية واحدة
========================================================= */
function EligibilityRuleCard({
  rule,
  onChange,
  onDelete,
  serviceStatuses,
  categories,
  letterTypesList,
  administrations,
  units,
}: {
  rule: FormEligibilityRule;
  onChange: (updated: FormEligibilityRule) => void;
  onDelete: () => void;
  serviceStatuses: { id: string; name: string; code: string }[];
  categories: { id: string; name: string; code: string }[];
  letterTypesList: { id: string; name: string; code: string }[];
  administrations: { id: string; name: string; code: string }[];
  units: { id: string; name: string }[];
}) {
  function toggleAppliesCode(code: string) {
    const current = rule.applies_to_codes ?? [];
    const updated = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    onChange({ ...rule, applies_to_codes: updated });
  }

  function toggleAdministrationCode(code: string) {
    const current = rule.administration_codes ?? [];
    const updated = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    onChange({ ...rule, administration_codes: updated });
  }

  function toggleUnitId(unitId: string) {
    const current = rule.unit_ids ?? [];
    const updated = current.includes(unitId)
      ? current.filter((u) => u !== unitId)
      : [...current, unitId];
    onChange({ ...rule, unit_ids: updated });
  }

  // ✅ رأس مشترك لأي مجموعة checkboxes: العنوان + "تحديد الكل"
  function GroupHeader({
    label,
    allSelected,
    onToggleAll,
  }: {
    label: string;
    allSelected: boolean;
    onToggleAll: (checked: boolean) => void;
  }) {
    return (
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
          {label}
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => onToggleAll(e.target.checked)}
          />
          <span style={{ ...F, fontSize: 12, color: "#717d96" }}>تحديد الكل</span>
        </label>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-[#e2e7f0] p-4 flex flex-col gap-3 bg-[#fafbfc]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
            نوع القاعدة
          </label>

          <select
            value={rule.type}
            onChange={(e) =>
              onChange({
                _localId: rule._localId,
                type: e.target.value as EligibilityRuleType,
                error_message: rule.error_message,
              })
            }
            dir="rtl"
            className="w-full h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#1f3d97] bg-white"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          >
            <option value="">اختر نوع القاعدة</option>
            {RULE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#fce8f1" }}
          title="حذف القاعدة"
        >
          <Trash2 size={14} style={{ color: "#e3282c" }} />
        </button>
      </div>

      {rule.type === "requires_service_status" && (
        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
            الحالة الخدمية المطلوبة
          </label>

          <select
            value={rule.status_code ?? ""}
            onChange={(e) => onChange({ ...rule, status_code: e.target.value })}
            dir="rtl"
            className="w-full h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#1f3d97] bg-white"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          >
            <option value="">اختر الحالة</option>
            {serviceStatuses.map((s) => (
              <option key={s.id} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {rule.type === "requires_category" && (
        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
            الفئة المطلوبة
          </label>

          <select
            value={rule.category_code ?? ""}
            onChange={(e) => onChange({ ...rule, category_code: e.target.value })}
            dir="rtl"
            className="w-full h-[42px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#1f3d97] bg-white"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          >
            <option value="">اختر الفئة</option>
            {categories.map((c) => (
              <option key={c.id} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(rule.type === "one_time_lifetime" ||
        rule.type === "no_pending_undocumented_letter") && (
        <div className="flex flex-col gap-1.5">
          <GroupHeader
            label={
              rule.type === "one_time_lifetime"
                ? "الأنواع اللي تحسب ضمن القاعدة (لازم واحد على الأقل)"
                : "الأنواع اللي تحسب ضمن القاعدة (سيبها فاضية = أي نوع خطاب)"
            }
            allSelected={
              letterTypesList.length > 0 &&
              (rule.applies_to_codes ?? []).length === letterTypesList.length
            }
            onToggleAll={(checked) =>
              onChange({
                ...rule,
                applies_to_codes: checked
                  ? letterTypesList.map((lt) => lt.code)
                  : [],
              })
            }
          />

          <div className="flex flex-wrap gap-2">
            {letterTypesList.map((lt) => {
              const isChecked = (rule.applies_to_codes ?? []).includes(lt.code);

              return (
                <label
                  key={lt.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] cursor-pointer"
                  style={{
                    background: isChecked ? "#ebedfd" : "#fff",
                    border: "1px solid #e2e7f0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleAppliesCode(lt.code)}
                  />
                  <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{lt.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {rule.type === "requires_administration" && (
        <div className="flex flex-col gap-1.5">
          <GroupHeader
            label="الإدارات المسموح لها (لازم واحدة على الأقل)"
            allSelected={
              administrations.length > 0 &&
              (rule.administration_codes ?? []).length === administrations.length
            }
            onToggleAll={(checked) =>
              onChange({
                ...rule,
                administration_codes: checked
                  ? administrations.map((a) => a.code)
                  : [],
              })
            }
          />

          <div className="flex flex-wrap gap-2">
            {administrations.map((admin) => {
              const isChecked = (rule.administration_codes ?? []).includes(
                admin.code
              );

              return (
                <label
                  key={admin.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] cursor-pointer"
                  style={{
                    background: isChecked ? "#ebedfd" : "#fff",
                    border: "1px solid #e2e7f0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleAdministrationCode(admin.code)}
                  />
                  <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                    {admin.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {rule.type === "requires_primary_unit" && (
        <div className="flex flex-col gap-1.5">
          <GroupHeader
            label="الوحدات المسموح لها (لازم واحدة على الأقل)"
            allSelected={
              units.length > 0 && (rule.unit_ids ?? []).length === units.length
            }
            onToggleAll={(checked) =>
              onChange({
                ...rule,
                unit_ids: checked ? units.map((u) => u.id) : [],
              })
            }
          />

          <div className="flex flex-wrap gap-2">
            {units.map((unit) => {
              const isChecked = (rule.unit_ids ?? []).includes(unit.id);

              return (
                <label
                  key={unit.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] cursor-pointer"
                  style={{
                    background: isChecked ? "#ebedfd" : "#fff",
                    border: "1px solid #e2e7f0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleUnitId(unit.id)}
                  />
                  <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                    {unit.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {rule.type && (
        <div className="flex flex-col gap-1.5">
          <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#4a5468" }}>
            رسالة الخطأ (بتظهر للمستخدم لو القاعدة اترفضت)
          </label>

          <input
            type="text"
            value={rule.error_message}
            onChange={(e) => onChange({ ...rule, error_message: e.target.value })}
            placeholder="مثال: الفرد غير مُلحق. لا يمكن إصدار هذا الخطاب لفرد غير مُلحق."
            dir="rtl"
            className="w-full h-[42px] bg-white border border-[#e2e7f0] rounded-[8px] px-3 text-right outline-none focus:border-[#1f3d97]"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Preview helpers (نسخة مبسّطة من نفس منطق صفحة المراجعة،
   بس بتشتغل على بيانات الفورم الحالية + بيانات وهمية ثابتة)
========================================================= */

const DATE_MARKER = "@@DATE@@";

const toArabicDigits = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
};

const renderTextWithDates = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4})/g);
  return parts.map((part, index) => {
    const isDate = /^\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4}$/.test(part);
    if (isDate) {
      return (
        <span key={index} style={{ direction: "ltr", unicodeBidi: "isolate", display: "inline-block" }}>
          {toArabicDigits(part)}
        </span>
      );
    }
    return <span key={index}>{toArabicDigits(part)}</span>;
  });
};

function DateBlank({ month, year }: { month: string | number; year: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", direction: "rtl", unicodeBidi: "isolate", whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-block", width: "25px" }}>&nbsp;</span>
      <span>/</span>
      <span>{toArabicDigits(month)}</span>
      <span>/</span>
      <span>{toArabicDigits(year)}</span>
    </span>
  );
}

// ✅ عرض القيمة بشكل مقروء (تحويل ID لاسم لو select_unit/select_administration)
function getFieldDisplayValue(
  field: ExtraFieldDefinition,
  rawValue: string | undefined,
  units: { id: string; name: string }[],
  administrations: { id: string; name: string }[]
): string {
  if (!rawValue) return "";
  switch (field.type) {
    case "select_unit":
      return units.find((u) => u.id === rawValue)?.name ?? "";
    case "select_administration":
      return administrations.find((a) => a.id === rawValue)?.name ?? "";
    case "month":
      return STAGE_MONTHS.find((m) => String(m.value) === String(rawValue))?.label ?? rawValue;
    default:
      return rawValue;
  }
}

function computeStageLabel(letterFieldValues: Record<string, string>): string {
  const month = letterFieldValues["stage_month"];
  const year = letterFieldValues["stage_year"];
  if (!month || !year) return "";
  const monthLabel = STAGE_MONTHS.find((m) => String(m.value) === String(month))?.label ?? "";
  return `${monthLabel} ${toArabicDigits(year)}`;
}

// ✅ قيمة وهمية لأي حقل إضافي — بتستخدم القيمة الافتراضية لو موجودة،
// وإلا نص/رقم/تاريخ تجريبي حسب نوع الحقل، عشان المعاينة تشتغل
// حتى لو الحقل لسه من غير default_value
function generatePlaceholderValue(
  field: ExtraFieldDefinition,
  variantIndex: number,
  units: { id: string; name: string }[],
  administrations: { id: string; name: string }[]
): string {
  if (field.default_value) return field.default_value;

  switch (field.type) {
    case "number":
      return String(10 + variantIndex);
    case "date":
      return todayLocalIso();
    case "month":
      return STAGE_MONTHS[variantIndex % STAGE_MONTHS.length]?.value?.toString() ?? "";
    case "select_unit":
      return units[variantIndex % Math.max(units.length, 1)]?.id ?? "";
    case "select_administration":
      return administrations[variantIndex % Math.max(administrations.length, 1)]?.id ?? "";
    case "textarea":
      return "فقرة نصية تجريبية لمعاينة شكل الخطاب.";
    default:
      return variantIndex === 0 ? "نص تجريبي" : "نص تجريبي (٢)";
  }
}

// ✅ فردين وهميين ثابتين — بيانات مش حقيقية ومش هتتحفظ في أي مكان،
// غرضهم بس يوريك شكل الجدول والنص جوه الخطاب
const DUMMY_SOLDIERS = [
  { militaryId: "١٢٣٤٥٦٧٨٩٠١٢٣", rank: "عريف", name: "أحمد محمد علي", unit: "الكتيبة الأولى", attachmentUnit: "-" },
  { militaryId: "٩٨٧٦٥٤٣٢١٠٩٨٧", rank: "جندي", name: "محمود سيد حسن", unit: "الكتيبة الأولى", attachmentUnit: "-" },
];

// ✅ رندرر أعمدة نص الخطاب المطبوع لبيانات المعاينة الوهمية
const PRINT_BASE_COLUMN_RENDERERS: Record<
  BaseSoldierColumnKey,
  { header: string; render: (s: (typeof DUMMY_SOLDIERS)[number]) => string }
> = {
  military_id: { header: "رقم عسكري", render: (s) => s.militaryId },
  rank: { header: "الدرجة", render: (s) => s.rank },
  name: { header: "الاسم", render: (s) => s.name },
  unit: { header: "الوحدة", render: (s) => s.unit },
  attachment_unit: { header: "وحدة الإلحاق", render: (s) => s.attachmentUnit },
};
function LetterPreviewModal({
  config,
  units,
  administrations,
  onClose,
}: {
  config: LetterTypeConfig;
  units: { id: string; name: string }[];
  administrations: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"single" | "multiple">("single");

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = now.getFullYear();

  const soldiersCount = mode === "single" ? 1 : 2;
  const letterFields = getLetterScopedFields(config);
  const soldierFields = getSoldierScopedFields(config);
  const tableSoldierFields = getTableVisibleSoldierFields(config);

  // ✅ قيم وهمية لحقول "بيانات الخطاب"
  const letterFieldValues: Record<string, string> = {};
  letterFields.forEach((f) => {
    letterFieldValues[f.key] = generatePlaceholderValue(f, 0, units, administrations);
  });

  // ✅ قيم وهمية لكل فرد لحقول "كل فرد لوحده"
  const soldiersExtraData = Array.from({ length: soldiersCount }).map((_, i) => {
    const data: Record<string, string> = {};
    soldierFields.forEach((f) => {
      data[f.key] = generatePlaceholderValue(f, i, units, administrations);
    });
    return data;
  });

  const templateData: Record<string, string> = {
    date: DATE_MARKER,
    stageLabel: computeStageLabel(letterFieldValues),
  };

  letterFields.forEach((field) => {
    templateData[field.key] = getFieldDisplayValue(field, letterFieldValues[field.key], units, administrations);
  });

  soldierFields.forEach((field) => {
    const displayValues = soldiersExtraData.map((data) =>
      getFieldDisplayValue(field, data[field.key], units, administrations)
    );
    templateData[field.key] = resolveSoldierFieldForTemplate(field, displayValues);
  });

  const rawBody = renderLetterBody(config, mode === "single", templateData);
  const bodySegments = rawBody.split(DATE_MARKER);

  const printBaseColumns =
    config.printVisibleSoldierColumns ?? DEFAULT_PRINT_VISIBLE_SOLDIER_COLUMNS;

  const tableHeaders = [
    "م",
    ...printBaseColumns.map((key) => PRINT_BASE_COLUMN_RENDERERS[key].header),
    ...tableSoldierFields.map((f) => f.label),
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.45)" }} dir="rtl">
      <div className="bg-white rounded-[20px] w-full max-w-[760px] max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e7f0] sticky top-0 bg-white z-10">
          <span style={{ ...F, fontWeight: 700, fontSize: 17, color: "#2d3648" }}>معاينة شكل الخطاب</span>

          <button type="button" onClick={onClose} className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: "#f1f3f9" }}>
            <X size={16} style={{ color: "#2d3648" }} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setMode("single")}
              className="px-3 py-1.5 rounded-[6px]"
              style={{ ...F, fontSize: 13, background: mode === "single" ? "#1f3d97" : "#ebedfd", color: mode === "single" ? "#fff" : "#1f3d97" }}
            >
              معاينة فرد واحد
            </button>

            <button
              type="button"
              onClick={() => setMode("multiple")}
              className="px-3 py-1.5 rounded-[6px]"
              style={{ ...F, fontSize: 13, background: mode === "multiple" ? "#1f3d97" : "#ebedfd", color: mode === "multiple" ? "#fff" : "#1f3d97" }}
            >
              معاينة أكتر من فرد
            </button>
          </div>

          <p style={{ ...F, fontSize: 12, color: "#8a6500", marginBottom: 12 }}>
            البيانات دي وهمية بالكامل لأغراض المعاينة فقط، ومش بتتحفظ في أي مكان.
          </p>
        </div>

        <div className="p-6 pt-0">
          <div className="bg-white border border-[#ddd] rounded-[4px] p-8 w-full mx-auto" dir="rtl">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #ddd" }}>
              <div style={{ ...PF, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <p style={{ ...PF, fontSize: 14, fontWeight: 700, margin: 0 }}>قيـــــادة قـــوات الصـاعقـــة</p>
                <p style={{ ...PF, fontSize: 14, margin: "3px 0" }}>فــــــرع التنظيــــــم والإدارة</p>
                <p style={{ ...PF, fontSize: 14, margin: 0 }}>
                  التاريــخ : <DateBlank month={currentMonth} year={currentYear} />
                </p>
              </div>

              <div style={{ width: 80, height: 80, flexShrink: 0 }}>
                <img src={imgEagle} alt="شعار الجمهورية" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
            </div>

            <p style={{ ...PF, fontSize: 18, fontWeight: 700, marginBottom: 14, textAlign: "center", textDecoration: "underline" }}>
              إلى / جهة تجريبية
            </p>

            <p style={{ ...PF, fontSize: 14, color: "#333", lineHeight: 1.8, marginBottom: 12, textAlign: "right" }}>
              {bodySegments.map((segment, index) => (
                <span key={index}>
                  {renderTextWithDates(segment)}
                  {index < bodySegments.length - 1 && <DateBlank month={currentMonth} year={currentYear} />}
                </span>
              ))}
            </p>

            <table className="w-full border-collapse mb-4" style={{ ...PF, fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f5f5f5", textAlign: "center" }}>
                  {tableHeaders.map((header) => (
                    <th key={header} style={{ padding: "5px", border: "1px solid #ddd", textAlign: "center" }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {DUMMY_SOLDIERS.slice(0, soldiersCount).map((soldier, index) => (
                  <tr key={soldier.militaryId}>
                    <td style={{ padding: "5px", border: "1px solid #eee", textAlign: "center" }}>{toArabicDigits(index + 1)}</td>
                    {printBaseColumns.map((key) => (
                      <td key={key} style={{ padding: "5px", border: "1px solid #eee", textAlign: "center" }}>
                        {toArabicDigits(PRINT_BASE_COLUMN_RENDERERS[key].render(soldier))}
                      </td>
                    ))}
                    {tableSoldierFields.map((field) => (
                      <td key={field.key} style={{ padding: "5px", border: "1px solid #eee", textAlign: "center" }}>
                        {toArabicDigits(getFieldDisplayValue(field, soldiersExtraData[index]?.[field.key], units, administrations) || "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <p style={{ ...PF, fontSize: 14, marginTop: 20, textAlign: "center" }}>مع وافر التحية ،،،</p>

            <div style={{ ...PF, fontSize: 14, marginTop: 28, width: "fit-content", marginLeft: 0, marginRight: "auto", direction: "rtl" }}>
              <p style={{ margin: 0, fontWeight: 700, whiteSpace: "pre" }}>{"التوقيع (                               )"}</p>
              <p style={{ margin: "6px 0 0", fontWeight: 700 }}>عقـــــــيد / محمد سميـــر عبدالغني</p>
              <p style={{ margin: "4px 0 0", fontWeight: 700 }}>رئيــــس فــــرع التنظيــــم والاداره</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Page
========================================================= */

export function LetterTypeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
const { hasPermission } = usePermissions();
  const { setPerformingSensitiveOperation } = useUnsavedChanges();

  const isEditMode = Boolean(id);

  // ⭐ عملية حساسة (إدارة الخطابات)
  useEffect(() => {
    setPerformingSensitiveOperation(true);
    return () => {
      setPerformingSensitiveOperation(false);
    };
  }, [setPerformingSensitiveOperation]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [bodyTemplateSingular, setBodyTemplateSingular] = useState("");
  const [bodyTemplatePlural, setBodyTemplatePlural] = useState("");
  const [fields, setFields] = useState<FormExtraField[]>([]);
  const [numberingDigit, setNumberingDigit] = useState<number | null>(null);
  const [effects, setEffects] = useState<FormPersonnelEffect[]>([]);
  const [eligibilityRules, setEligibilityRules] = useState<
    FormEligibilityRule[]
  >([]);
  const [visibleSoldierColumns, setVisibleSoldierColumns] =
    useState<BaseSoldierColumnKey[]>(DEFAULT_VISIBLE_SOLDIER_COLUMNS);
  const [printVisibleSoldierColumns, setPrintVisibleSoldierColumns] =
    useState<BaseSoldierColumnKey[]>(DEFAULT_PRINT_VISIBLE_SOLDIER_COLUMNS);
  const [serviceStatuses, setServiceStatuses] = useState<
    { id: string; name: string; code: string }[]
  >([]);
  const [units, setUnits] = useState<
    { id: string; name: string; unit_type?: string }[]
  >([]);
  const [categories, setCategories] = useState<
    { id: string; name: string; code: string }[]
  >([]);
  
  const [letterTypesList, setLetterTypesList] = useState<
    { id: string; name: string; code: string }[]
  >([]);
  const [administrations, setAdministrations] = useState<
    { id: string; name: string; code: string }[]
  >([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldCardErrors, setFieldCardErrors] = useState<
    Record<string, { key?: string; label?: string }>
  >({});
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

async function loadReferenceLists() {
  const [
    { data: statusesData },
    { data: unitsData },
    { data: categoriesData },
    { data: letterTypesData },
    { data: administrationsData },
  ] = await Promise.all([
    supabase.from("service_statuses").select("id, name, code").order("name"),
  supabase.from("units").select("id, name, unit_type").order("name"),
    supabase.from("personnel_categories").select("id, name, code").order("name"),
    supabase.from("letter_types").select("id, name, code").order("name"),
    supabase
      .from("external_administrations")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (!mounted) return;

  setServiceStatuses(statusesData ?? []);
  setUnits(unitsData ?? []);
  setCategories(categoriesData ?? []);
  setLetterTypesList(letterTypesData ?? []);
  setAdministrations(administrationsData ?? []);
}

    loadReferenceLists();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditMode) return;

    let mounted = true;

    async function loadLetterType() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("letter_types")
        .select(
          "id, name, code, body_template_singular, body_template_plural, extra_fields, numbering_digit, personnel_effect, eligibility_rules, visible_soldier_columns, print_visible_soldier_columns"
        )
        .eq("id", id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        setError(`تعذر تحميل بيانات نوع الخطاب: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data) {
        setError("نوع الخطاب غير موجود.");
        setLoading(false);
        return;
      }

      setName(data.name ?? "");
      setCode(data.code ?? "");
      setBodyTemplateSingular(data.body_template_singular ?? "");
      setBodyTemplatePlural(data.body_template_plural ?? "");
      setNumberingDigit(data.numbering_digit ?? null);
      setVisibleSoldierColumns(
        (data.visible_soldier_columns as BaseSoldierColumnKey[] | null) ??
          DEFAULT_VISIBLE_SOLDIER_COLUMNS
      );
      setPrintVisibleSoldierColumns(
        (data.print_visible_soldier_columns as BaseSoldierColumnKey[] | null) ??
          DEFAULT_PRINT_VISIBLE_SOLDIER_COLUMNS
      );
      const extraFields = (data.extra_fields ?? []) as ExtraFieldDefinition[];

      setFields(
        extraFields.map((f) => ({
          ...f,
          _localId: makeLocalId(),
        }))
      );

      const personnelEffectRows = (data.personnel_effect ??
        []) as PersonnelEffectRule[];

      setEffects(
        personnelEffectRows.map((e) => ({
          _localId: makeLocalId(),
          field: e.field,
          action: e.action,
          value: e.action === "set_value" ? e.value : "",
          source: e.action === "set_from_field" ? e.source : "",
        }))
      );

      const eligibilityRuleRows = (data.eligibility_rules ??
        []) as EligibilityRule[];

      setEligibilityRules(
        eligibilityRuleRows.map((r) => ({
          _localId: makeLocalId(),
          type: r.type,
          status_code: r.type === "requires_service_status" ? r.status_code : "",
          category_code: r.type === "requires_category" ? r.category_code : "",
          applies_to_codes:
            r.type === "one_time_lifetime"
              ? r.applies_to_codes
              : r.type === "no_pending_undocumented_letter"
              ? r.applies_to_codes ?? []
              : [],
          administration_codes:
            r.type === "requires_administration" ? r.administration_codes : [],
          unit_ids: r.type === "requires_primary_unit" ? r.unit_ids : [],
          error_message: r.error_message,
        }))
      );

      setLoading(false);
    }

    loadLetterType();

    return () => {
      mounted = false;
    };
  }, [id, isEditMode]);
  function toggleSoldierColumn(key: BaseSoldierColumnKey) {
    setVisibleSoldierColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function addPrintColumn(key: BaseSoldierColumnKey) {
    setPrintVisibleSoldierColumns((prev) =>
      prev.includes(key) ? prev : [...prev, key]
    );
  }

  function removePrintColumn(key: BaseSoldierColumnKey) {
    setPrintVisibleSoldierColumns((prev) => prev.filter((k) => k !== key));
  }

  function movePrintColumn(index: number, direction: "up" | "down") {
    setPrintVisibleSoldierColumns((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }
  function handleMoveField(localId: string, direction: "up" | "down") {
    setFields((prev) => {
      const index = prev.findIndex((f) => f._localId === localId);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }
  function handleAddField() {
    const newField: FormExtraField = {
      _localId: makeLocalId(),
      key: "",
      label: "",
      type: "text",
      required: false,
      scope: "letter",
      show_in_table: true,
    };

    setFields((prev) => [...prev, newField]);
  }

  function handleFieldChange(localId: string, updated: FormExtraField) {
    setFields((prev) =>
      prev.map((f) => (f._localId === localId ? updated : f))
    );
  }

  function handleFieldDelete(localId: string) {
    setFields((prev) => prev.filter((f) => f._localId !== localId));
  }

  function handleAddEffect() {
    const newEffect: FormPersonnelEffect = {
      _localId: makeLocalId(),
      field: "",
      action: "",
    };

    setEffects((prev) => [...prev, newEffect]);
  }

  function handleEffectChange(localId: string, updated: FormPersonnelEffect) {
    setEffects((prev) =>
      prev.map((e) => (e._localId === localId ? updated : e))
    );
  }

  function handleEffectDelete(localId: string) {
    setEffects((prev) => prev.filter((e) => e._localId !== localId));
  }

  function handleAddEligibilityRule() {
    const newRule: FormEligibilityRule = {
      _localId: makeLocalId(),
      type: "",
      error_message: "",
    };

    setEligibilityRules((prev) => [...prev, newRule]);
  }

  function handleEligibilityRuleChange(
    localId: string,
    updated: FormEligibilityRule
  ) {
    setEligibilityRules((prev) =>
      prev.map((r) => (r._localId === localId ? updated : r))
    );
  }

  function handleEligibilityRuleDelete(localId: string) {
    setEligibilityRules((prev) => prev.filter((r) => r._localId !== localId));
  }

  function validate() {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = "اسم الخطاب مطلوب";
    }

    if (!code.trim()) {
      errs.code = "كود الخطاب مطلوب";
    }

    const cardErrs: Record<string, { key?: string; label?: string }> = {};
    const seenKeys = new Set<string>();

    fields.forEach((field) => {
      const cardErr: { key?: string; label?: string } = {};

      if (!field.label.trim()) {
        cardErr.label = "اسم الحقل مطلوب";
      }

      const normalizedKey = normalizeFieldKey(field.key);

      if (!normalizedKey) {
        cardErr.key = "المفتاح مطلوب";
      } else if (seenKeys.has(normalizedKey)) {
        cardErr.key = "المفتاح ده مستخدم في حقل تاني";
      } else {
        seenKeys.add(normalizedKey);
      }

      if (Object.keys(cardErr).length > 0) {
        cardErrs[field._localId] = cardErr;
      }
    });

    if (Object.keys(cardErrs).length > 0) {
      errs.fields = "فيه أخطاء في الحقول الإضافية";
    }

    setFieldCardErrors(cardErrs);

    const invalidEffect = effects.find((e) => {
      if (!e.field || !e.action) return true;
      if (e.action === "set_value" && !e.value) return true;
      if (e.action === "set_from_field" && !e.source) return true;
      return false;
    });

    if (invalidEffect) {
      errs.effects = "فيه تأثير ناقص بيانات — أكمله أو احذفه";
    }
    const invalidEligibilityRule = eligibilityRules.find((r) => {
      if (!r.type || !r.error_message.trim()) return true;
      if (r.type === "requires_service_status" && !r.status_code) return true;
      if (r.type === "requires_category" && !r.category_code) return true;
      if (
        r.type === "one_time_lifetime" &&
        (!r.applies_to_codes || r.applies_to_codes.length === 0)
      )
        return true;
      if (
        r.type === "requires_administration" &&
        (!r.administration_codes || r.administration_codes.length === 0)
      )
        return true;
              if (
        r.type === "requires_primary_unit" &&
        (!r.unit_ids || r.unit_ids.length === 0)
      )
        return true;
      return false;
    });

    if (invalidEligibilityRule) {
      errs.eligibility = "فيه قاعدة أهلية ناقصة بيانات — أكملها أو احذفها";
    }
    

    return errs;
  }
  

  async function handleSave() {
    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    setError("");

    const normalizedCode = normalizeCode(code);

    const cleanFields: ExtraFieldDefinition[] = fields.map((f) => {
      const { _localId, ...rest } = f;

      return {
        ...rest,
        key: normalizeFieldKey(rest.key),
      };
    });

    const cleanEffects: PersonnelEffectRule[] = effects.map((e) => {
      if (e.action === "set_value") {
        return {
          field: e.field as AllowedPersonnelField,
          action: "set_value",
          value: e.value ?? "",
        };
      }

      if (e.action === "set_from_field") {
        return {
          field: e.field as AllowedPersonnelField,
          action: "set_from_field",
          source: e.source ?? "",
        };
      }

      return {
        field: e.field as AllowedPersonnelField,
        action: "clear",
      };
    });

    const cleanEligibilityRules: EligibilityRule[] = eligibilityRules.map(
      (r) => {
        if (r.type === "requires_service_status") {
          return {
            type: "requires_service_status",
            status_code: r.status_code ?? "",
            error_message: r.error_message,
          };
        }

        if (r.type === "requires_category") {
          return {
            type: "requires_category",
            category_code: r.category_code ?? "",
            error_message: r.error_message,
          };
        }

        if (r.type === "one_time_lifetime") {
          return {
            type: "one_time_lifetime",
            applies_to_codes: r.applies_to_codes ?? [],
            error_message: r.error_message,
          };
        }
        if (r.type === "requires_primary_unit") {
          return {
            type: "requires_primary_unit",
            unit_ids: r.unit_ids ?? [],
            error_message: r.error_message,
          };
        }
        if (r.type === "requires_administration") {
          return {
            type: "requires_administration",
            administration_codes: r.administration_codes ?? [],
            error_message: r.error_message,
          };
        }

        return {
          type: "no_pending_undocumented_letter",
          applies_to_codes:
            r.applies_to_codes && r.applies_to_codes.length > 0
              ? r.applies_to_codes
              : undefined,
          error_message: r.error_message,
        };
        
      }
      
    );
    try {
      if (isEditMode) {
        const { error: updateError } = await supabase
          .from("letter_types")
          .update({
            name: name.trim(),
            code: normalizedCode,
            body_template_singular: bodyTemplateSingular,
            body_template_plural: bodyTemplatePlural,
            extra_fields: cleanFields,
            personnel_effect: cleanEffects,
            eligibility_rules: cleanEligibilityRules,
            visible_soldier_columns: visibleSoldierColumns,
            print_visible_soldier_columns: printVisibleSoldierColumns,
          })
          .eq("id", id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        navigate("/dashboard/manage-letter-types");
      } else {
        const { data: newType, error: insertError } = await supabase
          .from("letter_types")
          .insert({
            name: name.trim(),
            code: normalizedCode,
            body_template_singular: bodyTemplateSingular,
            body_template_plural: bodyTemplatePlural,
            extra_fields: cleanFields,
            personnel_effect: cleanEffects,
            eligibility_rules: cleanEligibilityRules,
            visible_soldier_columns: visibleSoldierColumns,
            print_visible_soldier_columns: printVisibleSoldierColumns,
            is_active: true,
          })
          .select("id")
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        navigate(`/dashboard/manage-letter-types/${newType.id}`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء حفظ نوع الخطاب."
      );
    } finally {
      setSaving(false);
    }
  }

  // ✅ شريط المتغيرات بيتحدّث لحظيًا من قايمة الحقول الحالية في
  // الفورم (حتى لو لسه متحفظتش)، مش من نسخة قديمة محمّلة من الداتابيز
  const availableVariables: VariableOption[] = [
    ...FIXED_VARIABLES,
    ...fields
      .filter((f) => f.key.trim() && f.label.trim())
      .map((f) => ({ key: normalizeFieldKey(f.key), label: f.label })),
  ];
const mainUnits = units.filter((u) => u.unit_type === "MAIN");
const requiredPermission = isEditMode
  ? "letter_types:edit"
  : "letter_types:create";

if (!hasPermission(requiredPermission)) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 w-full min-h-[300px]"
      dir="rtl"
    >
      <p style={{ ...F, fontSize: 16, color: "#717d96" }}>
        ليس لديك صلاحية الوصول لهذه الصفحة.
      </p>
    </div>
  );
}
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full min-h-[300px]" dir="rtl">
        <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
          جاري تحميل بيانات نوع الخطاب...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/manage-letter-types")}
            className="w-9 h-9 rounded-[8px] flex items-center justify-center"
            style={{ backgroundColor: "#f1f3f9" }}
          >
            <ArrowRight size={16} style={{ color: "#2d3648" }} />
          </button>

          <h1
            style={{
              ...F,
              fontWeight: 700,
              fontSize: "clamp(20px,3.5vw,26px)",
              color: "#2d3648",
            }}
          >
            {isEditMode ? "تعديل نوع خطاب" : "إضافة نوع خطاب جديد"}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="flex items-center gap-2 h-[42px] px-4 rounded-[8px] border border-[#1f3d97]"
        >
          <Eye size={16} style={{ color: "#1f3d97" }} />
          <span style={{ ...F, fontSize: 14, color: "#1f3d97" }}>معاينة الخطاب</span>
        </button>
      </div>

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{ ...F, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
        >
          {error}
        </div>
      )}

      {fieldErrors.fields && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{ ...F, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
        >
          {fieldErrors.fields}
        </div>
      )}

      {/* البيانات الأساسية */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>البيانات الأساسية</span>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>
                اسم الخطاب
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors((p) => ({ ...p, name: "" }));
                  }
                }}
                placeholder="مثال: ضم أفراد حفظ سلام"
                dir="rtl"
                className={[
                  "w-full h-[52px] bg-white border rounded-[8px] px-3 text-right outline-none focus:border-[#1f3d97] transition-colors",
                  fieldErrors.name ? "border-[#ef4444]" : "border-[#e2e7f0]",
                ].join(" ")}
                style={{ ...F, fontSize: 16, color: "#2d3648" }}
              />

              {fieldErrors.name && (
                <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>{fieldErrors.name}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <label style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>
                كود الخطاب
              </label>

              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (fieldErrors.code) {
                    setFieldErrors((p) => ({ ...p, code: "" }));
                  }
                }}
                onBlur={() => setCode((prev) => normalizeCode(prev))}
                placeholder="مثال: JOIN_PEACEKEEPING"
                dir="ltr"
                className={[
                  "w-full h-[52px] bg-white border rounded-[8px] px-3 text-left outline-none focus:border-[#1f3d97] transition-colors",
                  fieldErrors.code ? "border-[#ef4444]" : "border-[#e2e7f0]",
                ].join(" ")}
                style={{ ...F, fontSize: 16, color: "#2d3648" }}
              />

              <p style={{ ...F, fontSize: 12, color: "#717d96" }}>
                حروف إنجليزية كبيرة وأرقام و _ فقط — بيتظبط تلقائيًا
              </p>

              {fieldErrors.code && (
                <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>{fieldErrors.code}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 max-w-[220px]">
            <label style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>
              رقم الخطاب (تلقائي)
            </label>

            <div
              className="w-full h-[52px] rounded-[8px] border border-[#e2e7f0] px-3 flex items-center bg-[#f7f9fc]"
              style={{ ...F, fontSize: 16, color: "#4a5468" }}
            >
              {isEditMode
                ? numberingDigit ?? "-"
                : "سيتم تحديده تلقائيًا عند الحفظ"}
            </div>

            <p style={{ ...F, fontSize: 12, color: "#717d96" }}>
              الرقم ده جزء من رقم الخطاب النهائي، وبيتحدد تلقائيًا ومينفعش يتغيّر
            </p>
          </div>
        </div>
      </section>

      {/* نص الخطاب */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>نص الخطاب</span>
        </div>

        <div className="flex flex-col gap-6 px-6 py-5">
          <TemplateEditor
            label="نص الخطاب — حالة فرد واحد"
            value={bodyTemplateSingular}
            onChange={setBodyTemplateSingular}
            variables={availableVariables}
          />

          <div className="w-full h-px bg-[#eff0f6]" />

          <TemplateEditor
            label="نص الخطاب — حالة أكتر من فرد"
            value={bodyTemplatePlural}
            onChange={setBodyTemplatePlural}
            variables={availableVariables}
          />
        </div>
      </section>

      {/* الحقول الإضافية */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0] flex items-center justify-between">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>الحقول الإضافية</span>

          <button
            type="button"
            onClick={handleAddField}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px]"
            style={{ background: "#ebedfd" }}
          >
            <Plus size={14} style={{ color: "#1f3d97" }} />
            <span style={{ ...F, fontSize: 13, color: "#1f3d97" }}>إضافة حقل</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          {fields.length === 0 && (
            <p style={{ ...F, fontSize: 14, color: "#717d96", textAlign: "center" }}>
              لا توجد حقول إضافية بعد. اضغط "إضافة حقل" لإضافة أول حقل.
            </p>
          )}

          {fields.map((field, index) => (
            <ExtraFieldCard
              key={field._localId}
              field={field}
              onChange={(updated) => handleFieldChange(field._localId, updated)}
              onDelete={() => handleFieldDelete(field._localId)}
              errors={fieldCardErrors[field._localId]}
              onMoveUp={() => handleMoveField(field._localId, "up")}
              onMoveDown={() => handleMoveField(field._localId, "down")}
              canMoveUp={index > 0}
              canMoveDown={index < fields.length - 1}
            />
          ))}
        </div>
      </section>
      {/* أعمدة جدول الأفراد */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            أعمدة جدول الأفراد
          </span>
        </div>

        <div className="flex flex-col gap-3 px-6 py-5">
          <p style={{ ...F, fontSize: 13, color: "#717d96" }}>
            حدد الأعمدة الأساسية اللي تظهر في جدول "بيانات الخطاب" وجدول
            "بيانات الأفراد" بصفحة المراجعة. الحقول الإضافية بنطاق "كل فرد
            لوحده" بتتضاف تلقائيًا بعدها بنفس ترتيبها في القسم اللي فوق.
          </p>

          <div className="flex flex-wrap gap-3">
            {BASE_SOLDIER_COLUMNS.map((col) => {
              const checked = visibleSoldierColumns.includes(col.key);

              return (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-3 py-2 rounded-[8px] cursor-pointer"
                  style={{
                    background: checked ? "#ebedfd" : "#fff",
                    border: "1px solid #e2e7f0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSoldierColumn(col.key)}
                  />
                  <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                    {col.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </section>
        {/* أعمدة نص الخطاب المطبوع */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            أعمدة جدول الأفراد داخل نص الخطاب (وقت الطباعة)
          </span>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <p style={{ ...F, fontSize: 13, color: "#717d96" }}>
            دي أعمدة الجدول اللي بيظهر جوه نص الخطاب نفسه وقت المعاينة أو
            الطباعة (منفصلة عن جدول "بيانات الأفراد" اللي فوق). رتّب
            الأعمدة بالأسهم بالشكل اللي عايز الجدول يظهر بيه، والحقول
            الإضافية بنطاق "كل فرد لوحده" بتتضاف تلقائيًا بعدها لو متعلّم
            عليها "إظهار كعمود".
          </p>

          {printVisibleSoldierColumns.length === 0 && (
            <p style={{ ...F, fontSize: 13, color: "#8a6500" }}>
              لا يوجد أي عمود أساسي ظاهر — اختر عمود من تحت لإضافته.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {printVisibleSoldierColumns.map((key, index) => {
              const col = BASE_SOLDIER_COLUMNS.find((c) => c.key === key);

              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-[8px]"
                  style={{ background: "#ebedfd", border: "1px solid #e2e7f0" }}
                >
                  <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                    {col?.label}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => movePrintColumn(index, "up")}
                      disabled={index === 0}
                      className="w-7 h-7 rounded-[6px] flex items-center justify-center disabled:opacity-30"
                      style={{ backgroundColor: "#fff" }}
                      title="تحريك لأعلى"
                    >
                      <ChevronUp size={13} style={{ color: "#4a5468" }} />
                    </button>

                    <button
                      type="button"
                      onClick={() => movePrintColumn(index, "down")}
                      disabled={index === printVisibleSoldierColumns.length - 1}
                      className="w-7 h-7 rounded-[6px] flex items-center justify-center disabled:opacity-30"
                      style={{ backgroundColor: "#fff" }}
                      title="تحريك لأسفل"
                    >
                      <ChevronDown size={13} style={{ color: "#4a5468" }} />
                    </button>

                    <button
                      type="button"
                      onClick={() => removePrintColumn(key)}
                      className="w-7 h-7 rounded-[6px] flex items-center justify-center"
                      style={{ backgroundColor: "#fce8f1" }}
                      title="إخفاء العمود"
                    >
                      <Trash2 size={13} style={{ color: "#e3282c" }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {BASE_SOLDIER_COLUMNS.some(
            (col) => !printVisibleSoldierColumns.includes(col.key)
          ) && (
            <div className="flex flex-col gap-2 pt-2 border-t border-[#eff0f6]">
              <span style={{ ...F, fontSize: 12, color: "#717d96" }}>
                إضافة عمود:
              </span>

              <div className="flex flex-wrap gap-2">
                {BASE_SOLDIER_COLUMNS.filter(
                  (col) => !printVisibleSoldierColumns.includes(col.key)
                ).map((col) => (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => addPrintColumn(col.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px]"
                    style={{ background: "#f1f3f9" }}
                  >
                    <Plus size={13} style={{ color: "#1f3d97" }} />
                    <span style={{ ...F, fontSize: 13, color: "#1f3d97" }}>
                      {col.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* تأثير الخطاب على بيانات الفرد */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0] flex items-center justify-between">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            تأثير الخطاب على بيانات الفرد
          </span>

          <button
            type="button"
            onClick={handleAddEffect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px]"
            style={{ background: "#ebedfd" }}
          >
            <Plus size={14} style={{ color: "#1f3d97" }} />
            <span style={{ ...F, fontSize: 13, color: "#1f3d97" }}>إضافة تأثير</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          {fieldErrors.effects && (
            <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>{fieldErrors.effects}</p>
          )}

          {effects.length === 0 && (
            <p style={{ ...F, fontSize: 14, color: "#717d96", textAlign: "center" }}>
              لا يوجد أي تأثير — الخطاب ده هيتعامل معاه النظام كخطاب توثيقي بحت
              (مفيش تحديث على بيانات الفرد).
            </p>
          )}

          {effects.map((effect) => (
            <EffectCard
              key={effect._localId}
              effect={effect}
              onChange={(updated) => handleEffectChange(effect._localId, updated)}
              onDelete={() => handleEffectDelete(effect._localId)}
              serviceStatuses={serviceStatuses}
              units={units}
              currentFields={fields}
            />
          ))}
        </div>
      </section>

      {/* قواعد أهلية الفرد */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0] flex items-center justify-between">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            شروط قبول الفرد في الخطاب
          </span>

          <button
            type="button"
            onClick={handleAddEligibilityRule}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px]"
            style={{ background: "#ebedfd" }}
          >
            <Plus size={14} style={{ color: "#1f3d97" }} />
            <span style={{ ...F, fontSize: 13, color: "#1f3d97" }}>إضافة شرط</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          {fieldErrors.eligibility && (
            <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>{fieldErrors.eligibility}</p>
          )}

          {eligibilityRules.length === 0 && (
            <p style={{ ...F, fontSize: 14, color: "#717d96", textAlign: "center" }}>
              لا يوجد أي شرط — أي فرد ينفع يتضاف للخطاب ده من غير قيود.
            </p>
          )}
          {eligibilityRules.map((rule) => (
<EligibilityRuleCard

  key={rule._localId}
  rule={rule}
  onChange={(updated) => handleEligibilityRuleChange(rule._localId, updated)}
  onDelete={() => handleEligibilityRuleDelete(rule._localId)}
  serviceStatuses={serviceStatuses}
  categories={categories}
  letterTypesList={letterTypesList}
  administrations={administrations}
  units={mainUnits}
/>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="min-h-[48px] px-6 rounded-[8px] flex items-center justify-center"
          style={{
            background: "linear-gradient(to bottom,#00b867,#00522e)",
            opacity: saving ? 0.6 : 1,
          }}
        >
          <span style={{ ...F, fontSize: 15, color: "#fff" }}>
            {saving ? "جاري الحفظ..." : isEditMode ? "حفظ التعديلات" : "إنشاء نوع الخطاب"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard/manage-letter-types")}
          className="min-h-[48px] px-4"
        >
          <span style={{ ...F, fontSize: 15, color: "#172e78", textDecoration: "underline" }}>
            إلغاء
          </span>
        </button>
      </div>

      {previewOpen && (
        <LetterPreviewModal
          config={{
            id: id ?? "preview",
            name: name || "اسم الخطاب",
            code: code || "CODE",
            bodyTemplateSingular,
            bodyTemplatePlural,
            extraFields: fields.map(({ _localId, ...rest }) => rest),
            personnelEffect: [],
            eligibilityRules: [],
            allowManualSoldierEntry: false,
            visibleSoldierColumns,
            printVisibleSoldierColumns,
          }}
          units={units}
          administrations={administrations}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}