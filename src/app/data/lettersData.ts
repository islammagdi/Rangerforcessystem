// ── Letters archive mock data ────────────────────────────────────────────────

export interface LetterSoldier {
  rank: string;
  name: string;
  unit: string;
  attachmentUnit: string;
  militaryId: string;
}

export interface LetterArchiveRecord {
  id: string;
  letterNumber: string;
  date: string;
  type: "إلحاق" | "إنهاء إلحاق";
  destination: string;
  soldiersCount: number;
  status: "موثق" | "غير موثق";
  reason: string;
  soldiers: LetterSoldier[];
}

export const LETTERS_DATA: LetterArchiveRecord[] = [
  {
    id: "L1",
    letterNumber: "2024427700265",
    date: "2026-1-30",
    type: "إلحاق",
    destination: "قيا مع العمليات الخاصة",
    soldiersCount: 2,
    status: "موثق",
    reason: "أوامر قيادة",
    soldiers: [
      { rank: "جندي", name: "اسلام مجدي عبدالستار", unit: "ك ١١٣ صع", attachmentUnit: "ك ١١٣ صع", militaryId: "2024427700265" },
      { rank: "جندي", name: "احمد عادل عبدالستار", unit: "مع العمليات الخاصة", attachmentUnit: "مع العمليات الخاصة", militaryId: "2024159308527" },
    ],
  },
  {
    id: "L2",
    letterNumber: "2024159308527",
    date: "2025-12-31",
    type: "إنهاء إلحاق",
    destination: "قيا مع 145 صع",
    soldiersCount: 4,
    status: "غير موثق",
    reason: "انتهاء مدة الإلحاق",
    soldiers: [
      { rank: "جندي", name: "اسلام مجدي عبدالستار", unit: "ك ١١٣ صع", attachmentUnit: "ك ١١٣ صع", militaryId: "2024427700265" },
      { rank: "جندي", name: "احمد عادل عبدالستار", unit: "مع العمليات الخاصة", attachmentUnit: "مع العمليات الخاصة", militaryId: "2024159308527" },
      { rank: "مساعد أ", name: "محمود اسلام عبدالله", unit: "س ١٤٥ اشارة", attachmentUnit: "س ١٤٥ اشارة", militaryId: "2024964213580" },
      { rank: "جندي", name: "خالد فتحي محمد", unit: "ك ١١٣ صع", attachmentUnit: "ك ١١٣ صع", militaryId: "2024111222333" },
    ],
  },
  {
    id: "L3",
    letterNumber: "2024964213580",
    date: "2025-11-5",
    type: "إلحاق",
    destination: "سرية القيادة",
    soldiersCount: 1,
    status: "موثق",
    reason: "دعم مهمة تدريبية",
    soldiers: [
      { rank: "مساعد أ", name: "محمود اسلام عبدالله", unit: "س ١٤٥ اشارة", attachmentUnit: "س ١٤٥ اشارة", militaryId: "2024964213580" },
    ],
  },
];

// Lookup by soldier military ID
export function getLettersBySoldierMilitaryId(militaryId: string): LetterArchiveRecord[] {
  return LETTERS_DATA.filter((l) =>
    l.soldiers.some((s) => s.militaryId === militaryId)
  );
}

export function getLetterById(id: string): LetterArchiveRecord | undefined {
  return LETTERS_DATA.find((l) => l.id === id);
}
