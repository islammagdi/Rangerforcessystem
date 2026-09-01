// src/lib/personnelRules.ts
//
// ══════════════════════════════════════════════════════════════════════════
// مصدر الحقيقة الوحيد (Single Source of Truth) لحساب:
//   - قوة الوحدة (Unit Strength)
//   - الخوارج (Attached Outside Their Own Unit)
//
// يجب استيراد هذه الدوال في:
//   - UnitDetailPage   (بيان الوحدة)
//   - UnitSoldiersPage (أفراد الوحدة)
//   - UnitBarChart     (توزيع الخوارج)
//
// بدلاً من أي منطق محلي مكرر داخل كل صفحة، حتى تتطابق الأرقام دائمًا.
// ══════════════════════════════════════════════════════════════════════════

export interface StatusLike {
  code?: string | null;
  name: string;
}

export interface CategoryLike {
  code?: string | null;
  name: string;
}

export interface PersonnelLike {
  is_active: boolean;
  primary_unit_id: string | null;
  attachment_unit_id: string | null;
  service_status_id: string | null;
  personnel_category_id: string | null;
}

// ─────────────────────────────────────────────────────────
// تعريف الحالات (Statuses)
// ─────────────────────────────────────────────────────────

/** الحالة = "قوة الوحدة" */
export function isUnitForceStatus(status?: StatusLike): boolean {
  if (!status) return false;
  const code = status.code?.toUpperCase() ?? "";
  return code === "UNIT_FORCE" || status.name === "قوة الوحدة";
}

/** الحالة = "ملحق" (بأي صياغة نصية مستخدمة في الجدول) */
export function isAttachedStatus(status?: StatusLike): boolean {
  if (!status) return false;
  const code = status.code?.toUpperCase() ?? "";
  return (
    code === "ATTACHED" ||
    status.name === "ملحق" ||
    status.name === "ملحق علي القوة"
  );
}

// ─────────────────────────────────────────────────────────
// تعريف الفئة (Category) — تطابق تام فقط، بدون .includes()
// ─────────────────────────────────────────────────────────

/** الفرد متطوع فقط إذا كانت الفئة = "متطوع" بالضبط */
export function isVolunteerCategory(cat?: CategoryLike): boolean {
  if (!cat) return false;
  const code = cat.code?.toUpperCase() ?? "";
  return cat.name === "متطوع" || code === "VOLUNTEER";
}

/** الفرد مجند فقط إذا كانت الفئة = "مجند" بالضبط */
export function isConscriptCategory(cat?: CategoryLike): boolean {
  if (!cat) return false;
  const code = cat.code?.toUpperCase() ?? "";
  return cat.name === "مجند" || code === "CONSCRIPT";
}

// ─────────────────────────────────────────────────────────
// الشرط 1: هل يُحسب الفرد ضمن "قوة" وحدة بعينها (unitId)؟
// ─────────────────────────────────────────────────────────
// يجب تحقق الشروط الأربعة معًا:
//   1) primary_unit_id === unitId  (الوحدة الأساسية هي نفس الوحدة المختارة)
//   2) is_active === true
//   3) الحالة = "قوة الوحدة" أو "ملحق"
//
// إخلال شرط واحد فقط (مثلاً is_active = false) يستبعد الفرد من القوة تمامًا.
export function isCountedInUnitStrength(
  person: PersonnelLike,
  unitId: string,
  statusById: Map<string, StatusLike>
): boolean {
  if (person.primary_unit_id !== unitId) return false;
  if (!person.is_active) return false;

  const status = statusById.get(person.service_status_id ?? "");
  return isUnitForceStatus(status) || isAttachedStatus(status);
}

// ─────────────────────────────────────────────────────────
// الشرط 2: هل الفرد "خارج" عن وحدته الأساسية؟ (خوارج)
// ─────────────────────────────────────────────────────────
// يجب تحقق الشروط الأربعة معًا:
//   1) is_active === true
//   2) الحالة = "ملحق" فقط
//   3) attachment_unit_id له قيمة
//   4) primary_unit_id له قيمة (له وحدة أساسية)
export function isOutsideOwnUnit(
  person: PersonnelLike,
  statusById: Map<string, StatusLike>
): boolean {
  if (!person.is_active) return false;
  if (!person.attachment_unit_id) return false;
  if (!person.primary_unit_id) return false;
  if (person.attachment_unit_id === person.primary_unit_id) return false;

  const status = statusById.get(person.service_status_id ?? "");
  return isAttachedStatus(status);
}

// ─────────────────────────────────────────────────────────
// ملخص إحصائي موحّد لوحدة واحدة
// (يُستخدم في: بيان الوحدة + كارت إحصائيات أفراد الوحدة)
// ─────────────────────────────────────────────────────────

export interface UnitStrengthStats {
  total: number; // إجمالي القوة
  soldiers: number; // إجمالي الجنود (مجند)
  nco: number; // إجمالي ضباط الصف (متطوع)
  khawarij: number; // إجمالي الخوارج
  remaining: number; // المتبقي داخل الوحدة = total - khawarij
}

export function computeUnitStrengthStats(
  personnel: PersonnelLike[],
  unitId: string,
  statusById: Map<string, StatusLike>,
  categoryById: Map<string, CategoryLike>
): UnitStrengthStats {
  // القوة = كل من تحقق فيه شرط isCountedInUnitStrength فقط
  const forceMembers = personnel.filter((p) =>
    isCountedInUnitStrength(p, unitId, statusById)
  );

  const soldiers = forceMembers.filter((p) =>
    isConscriptCategory(categoryById.get(p.personnel_category_id ?? ""))
  ).length;

  const nco = forceMembers.filter((p) =>
    isVolunteerCategory(categoryById.get(p.personnel_category_id ?? ""))
  ).length;

  // الخوارج = جزء من القوة نفسها (هو أساسًا فرد بالوحدة، لكنه "ملحق" خارجها فعليًا)
  const khawarij = forceMembers.filter((p) =>
    isOutsideOwnUnit(p, statusById)
  ).length;

  return {
    total: forceMembers.length,
    soldiers,
    nco,
    khawarij,
    remaining: forceMembers.length - khawarij,
  };
}

// ─────────────────────────────────────────────────────────
// تجميع الخوارج على مستوى كل الوحدات (للرسم البياني)
// ─────────────────────────────────────────────────────────

export interface KhawarijByUnitRow {
  unitId: string;
  unitName: string;
  count: number;
}

export function computeKhawarijByUnit(
  personnel: PersonnelLike[],
  statusById: Map<string, StatusLike>,
  unitNameById: Map<string, string>
): KhawarijByUnitRow[] {
  const grouped = new Map<string, number>();

  personnel
    .filter((p) => isOutsideOwnUnit(p, statusById))
    .forEach((p) => {
      // مضمون أن primary_unit_id له قيمة بعد isOutsideOwnUnit
      const unitId = p.primary_unit_id as string;
      grouped.set(unitId, (grouped.get(unitId) ?? 0) + 1);
    });

  return Array.from(grouped.entries())
    .map(([unitId, count]) => ({
      unitId,
      unitName: unitNameById.get(unitId) ?? "بدون وحدة",
      count,
    }))
    .sort((a, b) => b.count - a.count);
}