export function normalizeDigits(value: string): string {
  const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndex = arabicIndicDigits.indexOf(digit);
    if (arabicIndex !== -1) return String(arabicIndex);

    const persianIndex = persianDigits.indexOf(digit);
    if (persianIndex !== -1) return String(persianIndex);

    return digit;
  });
}

export function toArabicDigits(value: string): string {
  const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";

  return value.replace(/[0-9]/g, (digit) => arabicIndicDigits[Number(digit)]);
}