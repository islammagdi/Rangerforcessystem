/* =========================================================
   القايمة البيضاء: الحقول الوحيدة في جدول personnel
   المسموح لأي نوع خطاب إنه يغيّرها.
   ✅ أي حقل جديد يُضاف هنا فقط بمعرفة مبرمج، مش من التاب الإداري.
========================================================= */
// ✅ أكواد أنواع الخطابات "الرسمية" اللي بتستهدف دايمًا جهة
// مسجّلة في النظام. أي نوع خطاب تاني (من التاب الإداري) بيُعتبر
// خطاب لجهة ممكن تكون غير مسجّلة، فمينفعش نقيّده باختيار من القايمة.
export const SYSTEM_MANAGED_LETTER_TYPE_CODES = [
  "ATTACH",
  "DEATTACH",
  "JOIN_SAEQA",
  "JOIN_EXTERNAL",
] as const;
export const ALLOWED_PERSONNEL_FIELDS = [
  "service_status_id",
  "attachment_unit_id",
  "primary_unit_id",
] as const;
// ✅ الأعمدة الأساسية المتاحة في جدول الأفراد (بيانات الخطاب + المراجعة)
export const BASE_SOLDIER_COLUMNS = [
  { key: "military_id", label: "رقم عسكري" },
  { key: "rank", label: "الدرجة" },
  { key: "name", label: "الاسم" },
  { key: "unit", label: "الوحدة" },
  { key: "attachment_unit", label: "وحدة الإلحاق" },
] as const;

export type BaseSoldierColumnKey =
  (typeof BASE_SOLDIER_COLUMNS)[number]["key"];

export const DEFAULT_VISIBLE_SOLDIER_COLUMNS: BaseSoldierColumnKey[] = [
  "military_id",
  "rank",
  "name",
  "unit",
];

// ✅ الأعمدة الافتراضية الظاهرة جوه نص الخطاب نفسه وقت الطباعة
export const DEFAULT_PRINT_VISIBLE_SOLDIER_COLUMNS: BaseSoldierColumnKey[] = [
  "rank",
  "name",
  "unit",
];
export type AllowedPersonnelField =
  (typeof ALLOWED_PERSONNEL_FIELDS)[number];

/* =========================================================
   أنواع البيانات
========================================================= */

export type ExtraFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "month"
  | "select_unit"
  | "select_administration";

// ✅ نطاق الحقل:
// - "letter": بيتحدد مرة واحدة في فورم "بيانات الخطاب" ويتطبق
//   على الخطاب كله (زي السبب، المرحلة التجنيدية)
// - "soldier": بيظهر كعمود إضافي في جدول الأفراد، وكل فرد ياخد
//   قيمته الخاصة بيه (زي وحدة الإلحاق، المهنة، الملاحظات)
export type ExtraFieldScope = "letter" | "soldier";

export type ExtraFieldDefinition = {
  key: string;
  label: string;
  type: ExtraFieldType;
  required: boolean;
  scope: ExtraFieldScope;
  default_value?: string;
  forbid_same_as_primary_unit?: boolean;
  plural_fallback_text?: string;
  // ✅ هل الحقل ده يظهر كعمود في جدول الأفراد؟ (افتراضيًا نعم لو مش محدد)
  show_in_table?: boolean;
};

export type PersonnelEffectRule =
  | {
      field: AllowedPersonnelField;
      action: "set_value";
      value: string;
    }
  | {
      field: AllowedPersonnelField;
      action: "set_from_field";
      source: string; // اسم حقل في extra_data أو في بيانات الفرد نفسه
    }
  | {
      field: AllowedPersonnelField;
      action: "clear";
    };
export type LetterTypeConfig = {
  id: string;
  name: string;
  code: string;
  bodyTemplateSingular: string;
  bodyTemplatePlural: string;
  extraFields: ExtraFieldDefinition[];
  personnelEffect: PersonnelEffectRule[];
  eligibilityRules: EligibilityRule[];
  allowManualSoldierEntry: boolean;
  visibleSoldierColumns: BaseSoldierColumnKey[];
  printVisibleSoldierColumns: BaseSoldierColumnKey[]; // ✅ جديد
};

/* =========================================================
   تحويل الصف الخام من Supabase لشكل واضح ومضمون النوع
========================================================= */

export function mapLetterTypeRow(row: any): LetterTypeConfig {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    bodyTemplateSingular: row.body_template_singular ?? "",
    bodyTemplatePlural: row.body_template_plural ?? "",
    extraFields: (row.extra_fields ?? []) as ExtraFieldDefinition[],
    personnelEffect: (row.personnel_effect ?? []) as PersonnelEffectRule[],
    eligibilityRules: (row.eligibility_rules ?? []) as EligibilityRule[],
    allowManualSoldierEntry: Boolean(row.allow_manual_soldier_entry),
    visibleSoldierColumns:
      (row.visible_soldier_columns as BaseSoldierColumnKey[] | null) ??
      DEFAULT_VISIBLE_SOLDIER_COLUMNS,
    printVisibleSoldierColumns: // ✅ جديد
      (row.print_visible_soldier_columns as BaseSoldierColumnKey[] | null) ??
      DEFAULT_PRINT_VISIBLE_SOLDIER_COLUMNS,
  };
}

/* =========================================================
   مساعدات لتقسيم الحقول حسب نطاقها (letter / soldier)
========================================================= */

// ✅ الحقول اللي بتظهر في فورم "بيانات الخطاب" (قيمة واحدة
// مشتركة للخطاب كله)
export function getLetterScopedFields(
  config: LetterTypeConfig
): ExtraFieldDefinition[] {
  return config.extraFields.filter((field) => field.scope === "letter");
}

// ✅ الحقول اللي بتظهر كأعمدة إضافية في جدول الأفراد (قيمة
// مستقلة لكل فرد)
export function getSoldierScopedFields(
  config: LetterTypeConfig
): ExtraFieldDefinition[] {
  return config.extraFields.filter((field) => field.scope === "soldier");
}

// ✅ نفس حقول الفرد، لكن اللي متعلم عليها إنها تظهر كعمود بس
// (show_in_table !== false يعني: افتراضيًا تظهر لو الحقل قديم
// ومفيهوش القيمة دي أصلًا)
export function getTableVisibleSoldierFields(
  config: LetterTypeConfig
): ExtraFieldDefinition[] {
  return getSoldierScopedFields(config).filter(
    (field) => field.show_in_table !== false
  );
}
// ✅ هل الخطاب ده "توثيقي" (مفيش أي تأثير على بيانات الفرد)؟
// بدل عمود منفصل زي is_documentary، الإجابة موجودة أصلًا في
// طول personnelEffect: لو فاضية، يبقى توثيقي.
export function isDocumentaryLetterType(config: LetterTypeConfig): boolean {
  return config.personnelEffect.length === 0;
}

/* =========================================================
   بناء نص الخطاب من القالب
   ({{key}} بيتستبدل بقيمته من data)
========================================================= */

export function renderLetterBody(
  config: LetterTypeConfig,
  isSingular: boolean,
  data: Record<string, string>
): string {
  const template = isSingular
    ? config.bodyTemplateSingular
    : config.bodyTemplatePlural;

  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] ?? "";
  });
}

// ✅ لحقل scope: soldier مذكور في القالب النصي: لو كل الأفراد
// عندهم نفس القيمة (بعد تحويلها لنص قابل للعرض)، بترجع القيمة
// دي؛ لو مختلفين، بترجع النص البديل (plural_fallback_text) بدل
// ما تعرض قيمة فرد واحد على إنها قيمة الكل
export function resolveSoldierFieldForTemplate(
  field: ExtraFieldDefinition,
  displayValues: string[]
): string {
  const nonEmpty = displayValues
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v));

  const allSame =
    nonEmpty.length > 0 && nonEmpty.every((v) => v === nonEmpty[0]);

  if (allSame) {
    return nonEmpty[0];
  }

  return field.plural_fallback_text ?? "الموضحة بالجدول";
}

/* =========================================================
   تطبيق تأثير الخطاب على فرد واحد
   بيرجع بس القيم اللي المفروض تتحدّث في جدول personnel
========================================================= */

export function applyPersonnelEffect(
  rules: PersonnelEffectRule[],
  formData: Record<string, string>
): Partial<Record<AllowedPersonnelField, string | null>> {
  const updates: Partial<Record<AllowedPersonnelField, string | null>> = {};

  for (const rule of rules) {
    // ✅ حماية إضافية: نتجاهل أي حقل مش موجود في القايمة البيضاء
    if (!ALLOWED_PERSONNEL_FIELDS.includes(rule.field)) {
      console.warn(
        "[LETTER ENGINE] Ignored non-whitelisted field:",
        rule.field
      );
      continue;
    }

    if (rule.action === "set_value") {
      updates[rule.field] = rule.value;
    } else if (rule.action === "clear") {
      updates[rule.field] = null;
    } else if (rule.action === "set_from_field") {
      updates[rule.field] = formData[rule.source] ?? null;
    }
  }

  return updates;
}

/* =========================================================
   قواعد أهلية الفرد (Eligibility Rules)
   ✅ مكتبة أنماط معروفة ومُختبرة — أي نوع خطاب جديد يختار
   من الأنماط دي بدل ما يحتاج شرط مكتوب في الكود.
   لو احتجنا نمط جديد كليًا مستقبلًا، بنضيفه هنا مرة واحدة بس.
========================================================= */

export type EligibilityRule =
  | {
      type: "requires_service_status";
      status_code: string;
      error_message: string;
    }
  | {
      type: "requires_category";
      category_code: string;
      error_message: string;
    }
  | {
      type: "one_time_lifetime";
      applies_to_codes: string[];
      error_message: string;
    }
  | {
      // ✅ نمط جديد: يمنع إضافة الفرد لو عنده أي خطاب سابق (أو من
      // أنواع محددة لو اتحدد applies_to_codes) لسه "غير موثّق"
      type: "no_pending_undocumented_letter";
      applies_to_codes?: string[];
      error_message: string;
    }
  | {
      // ✅ نمط جديد: يقصر الأهلية على أفراد إدارات معيّنة فقط
      // (بيقارن كود الإدارة المستخرج من الرقم العسكري بالأكواد
      // المسموحة هنا)
      type: "requires_administration";
      administration_codes: string[];
      error_message: string;
    }  | {
      // ✅ نمط جديد: يقصر الأهلية على أفراد وحدتهم الأساسية من ضمن
      // وحدات معينة فقط
      type: "requires_primary_unit";
      unit_ids: string[];
      error_message: string;
    };

export type EligibilityCheckResult =
  | { ok: true }
  | {
      ok: false;
      errorMessage: string;
      relatedLetterNumber?: string | null;
    };

// ✅ الرقم العسكري دايمًا 13 رقم — الخانتين 7 و8 (1-indexed)
// يعبروا عن كود الإدارة.
export function extractAdministrationCode(
  milId: string
): string | null {
  const digitsOnly = milId.replace(/\D/g, "");

  if (digitsOnly.length !== 13) {
    return null;
  }

  return digitsOnly.substring(6, 8);
}

// ✅ بيانات الفرد اللي محتاجينها للتحقق — مستخرجة مسبقًا من
// نتيجة استعلام Supabase (بعد فك الـ relations)
export type PersonnelEligibilityInput = {
  id: string;
  serviceStatusCode?: string | null;
  categoryCode?: string | null;
  // ✅ كود الإدارة المستخرج من الرقم العسكري (الخانتين 7 و8)
  administrationCode?: string | null;
    // ✅ معرّف الوحدة الأساسية الحالية للفرد
  primaryUnitId?: string | null;
};

// نستخدم "any" لعميل Supabase هنا لتفادي مشاكل استيراد النوع
// من مكتبة Supabase؛ الوظيفة نفسها بتتعامل معاه بشكل عام
export async function checkEligibility(
  rules: EligibilityRule[],
  personnel: PersonnelEligibilityInput,
  supabaseClient: any
): Promise<EligibilityCheckResult> {
  for (const rule of rules) {
    if (rule.type === "requires_service_status") {
      const current = (personnel.serviceStatusCode ?? "").toUpperCase();

      if (current !== rule.status_code.toUpperCase()) {
        return { ok: false, errorMessage: rule.error_message };
      }
    } else if (rule.type === "requires_category") {
      const current = (personnel.categoryCode ?? "").toUpperCase();

      if (current !== rule.category_code.toUpperCase()) {
        return { ok: false, errorMessage: rule.error_message };
      }
    } else if (rule.type === "one_time_lifetime") {
      const { data, error } = await supabaseClient
        .from("letter_personnel")
        .select(
          "letter_id, letters!inner(letter_number, letter_type_id, letter_types!inner(code))"
        )
        .eq("personnel_id", personnel.id)
        .in("letters.letter_types.code", rule.applies_to_codes);

      if (error) {
        console.error(
          "[ELIGIBILITY] one_time_lifetime check failed:",
          error
        );

        return { ok: false, errorMessage: "حدث خطأ أثناء التحقق من بيانات الفرد." };
      }

      if (data && data.length > 0) {
        const first = data[0] as any;

        const letterRecord = Array.isArray(first.letters)
          ? first.letters[0]
          : first.letters;

        return {
          ok: false,
          errorMessage: rule.error_message,
          relatedLetterNumber:
            letterRecord?.letter_number != null
              ? String(letterRecord.letter_number)
              : null,
        };
      }
    } else if (rule.type === "no_pending_undocumented_letter") {
      let query = supabaseClient
        .from("letter_personnel")
        .select(
          "letter_id, letters!inner(letter_number, status, letter_type_id, letter_types!inner(code))"
        )
        .eq("personnel_id", personnel.id)
        .eq("letters.status", "UNDOCUMENTED");

      if (rule.applies_to_codes && rule.applies_to_codes.length > 0) {
        query = query.in("letters.letter_types.code", rule.applies_to_codes);
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          "[ELIGIBILITY] no_pending_undocumented_letter check failed:",
          error
        );

        return { ok: false, errorMessage: "حدث خطأ أثناء التحقق من بيانات الفرد." };
      }

      if (data && data.length > 0) {
        const first = data[0] as any;

        const letterRecord = Array.isArray(first.letters)
          ? first.letters[0]
          : first.letters;

        return {
          ok: false,
          errorMessage: rule.error_message,
          relatedLetterNumber:
            letterRecord?.letter_number != null
              ? String(letterRecord.letter_number)
              : null,
        };
      }
    } else if (rule.type === "requires_administration") {
      const current = (personnel.administrationCode ?? "").trim();

      const allowed = rule.administration_codes.some(
        (code) => code.trim() === current
      );

      if (!current || !allowed) {
        return { ok: false, errorMessage: rule.error_message };
      }
    } else if (rule.type === "requires_primary_unit") {
      const current = (personnel.primaryUnitId ?? "").trim();
      const allowed = rule.unit_ids.some((id) => id.trim() === current);

      if (!current || !allowed) {
        return { ok: false, errorMessage: rule.error_message };
      }
    }
  }

  return { ok: true };
}