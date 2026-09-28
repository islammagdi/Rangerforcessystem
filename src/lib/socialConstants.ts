export const RELIGIONS = ["مسلم", "مسيحي"] as const;

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const HEALTH_STATUSES = ["لائق", "غير لائق", "تحت الملاحظة"] as const;

export const EDUCATION_STAGES = [
  "حضانة",
  "ابتدائي",
  "إعدادي",
  "ثانوي",
  "جامعي",
  "غير ملتحق بالتعليم",
] as const;

export const REQUIRED_FIELD_LABELS: Record<string, string> = {
  national_id: "الرقم القومي",
  phone_number: "رقم الهاتف",
  marital_status: "الحالة الاجتماعية",
  service_join_date: "تاريخ الالتحاق بالخدمة",
  birth_date: "تاريخ الميلاد",
  religion: "الديانة",
  blood_type: "فصيلة الدم",
  health_status: "الحالة الصحية العامة",
  birth_governorate_id: "محل الميلاد (المحافظة)",
  birth_district_id: "محل الميلاد (المركز/القسم)",
  address_governorate_id: "العنوان (المحافظة)",
  address_district_id: "العنوان (المركز/القسم)",
  address_detail: "تفاصيل العنوان",
  emergency_contact_name: "اسم جهة الاتصال في الطوارئ",
  emergency_contact_phone: "رقم هاتف جهة الاتصال في الطوارئ",
  emergency_contact_relation: "صلة جهة الاتصال في الطوارئ",
};