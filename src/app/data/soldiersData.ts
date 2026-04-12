// ── Shared mock data store ─────────────────────────────────────────────────
export interface LetterRecord {
  id: string;
  letterNumber: string;
  letterDate: string;
  letterType: string;
  destination: string;
  reason: string;
}

export interface SoldierData {
  id: string;
  militaryId: string;
  rank: string;
  category: string;
  name: string;
  unit: string;
  serviceStatus: string;
  attachmentPlace: string;
  dischargeDate: string;
  letters: LetterRecord[];
}

export const SOLDIERS: SoldierData[] = [
  {
    id: "1",
    militaryId: "٢٠٢٤٤٢٧٧٠٠٢٦٥",
    rank: "جندي",
    category: "مجند",
    name: "اسلام مجدى عبدالستار السيد حجاج",
    unit: "مج العمليات الخاصة",
    serviceStatus: "قوة الوحده",
    attachmentPlace: "لا يوجد",
    dischargeDate: "٢٠٢٥ - ٣ - ١",
    letters: [
      {
        id: "l1",
        letterNumber: "2024415",
        letterDate: "2024 - 3 - 2",
        letterType: "إلحاق",
        destination: "فرع العمليات",
        reason: "أوامر قيادة",
      },
      {
        id: "l2",
        letterNumber: "2022540",
        letterDate: "2025 - 2 - 28",
        letterType: "إنهاء إلحاق",
        destination: "قيادة المنطقة",
        reason: "انتهاء مدة الإلحاق",
      },
    ],
  },
  {
    id: "2",
    militaryId: "٣٤٥٦٧٨٩٠١",
    rank: "عريف",
    category: "مجند",
    name: "احمد عادل عبدالستار",
    unit: "مج العمليات الخاصة",
    serviceStatus: "منتهي خدمته",
    attachmentPlace: "لا يوجد",
    dischargeDate: "٢٠٢٤ - ١ - ١٥",
    letters: [],
  },
  {
    id: "3",
    militaryId: "٤٥٦٧٨٩٠١٢",
    rank: "جندي",
    category: "مجند",
    name: "محمود سمير حسن",
    unit: "س ١٤٥ اشارة",
    serviceStatus: "علي القوة",
    attachmentPlace: "لا يوجد",
    dischargeDate: "٢٠٢٦ - ٦ - ١",
    letters: [],
  },
];

// Mutable in-memory store (simulates DB)
let _soldiers: SoldierData[] = JSON.parse(JSON.stringify(SOLDIERS));

export function getSoldiers() {
  return _soldiers;
}

export function getSoldierById(id: string): SoldierData | undefined {
  return _soldiers.find((s) => s.id === id);
}

export function updateSoldier(id: string, patch: Partial<Omit<SoldierData, "id" | "letters">>) {
  _soldiers = _soldiers.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

export function deleteSoldier(id: string) {
  _soldiers = _soldiers.filter((s) => s.id !== id);
}
