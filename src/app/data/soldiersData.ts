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
  category: "مجند";
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
    militaryId: "2024427700265",
    rank: "جندي",
    category: "مجند",
    name: "اسلام مجدي عبدالستار",
    unit: "ك ١١٣ صع",
    serviceStatus: "ملحق",
    attachmentPlace: "فرع العمليات",
    dischargeDate: "2025 - 3 - 1",
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
    militaryId: "2024159308527",
    rank: "جندي",
    category: "مجند",
    name: "احمد عادل عبدالستار",
    unit: "مع العمليات الخاصة",
    serviceStatus: "منتهي خدمته",
    attachmentPlace: "لا يوجد",
    dischargeDate: "2024 - 1 - 15",
    letters: [],
  },
  {
    id: "3",
    militaryId: "2024964213580",
    rank: "مساعد أ",
    category: "مجند",
    name: "محمود اسلام عبدالله",
    unit: "س ١٤٥ اشارة",
    serviceStatus: "علي القوة",
    attachmentPlace: "لا يوجد",
    dischargeDate: "2026 - 6 - 1",
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