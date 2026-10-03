// =====================================================
// تواريخ بالتوقيت المحلي (مصر) بدل UTC
// =====================================================

/** تاريخ اليوم المحلي بصيغة YYYY-MM-DD */
export function todayLocalIso(): string {
  return toLocalIsoDate(new Date());
}

/** أي تاريخ لصيغة YYYY-MM-DD بالتوقيت المحلي */
export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" لتاريخ محلي (من غير ما يتحسب UTC) */
export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** بداية اليوم المحلي كـ ISO (للمقارنة مع أعمدة timestamptz) */
export function startOfLocalDayIso(date = new Date()): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}