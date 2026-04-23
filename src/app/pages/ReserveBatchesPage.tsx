import { useState } from "react";
import {
  ChevronDown,
  X,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowLeftRight,
} from "lucide-react";
import { getSoldiers } from "../data/soldiersData";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── Shared Dropdown ──────────────────────────────────────────────────────────
function BatchDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-1 min-w-[200px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-[54px] bg-white border border-[#e2e7f0] rounded-[8px] flex items-center gap-2 px-3 hover:border-[#a0aec0] transition-colors"
        dir="rtl"
      >
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#2d3648] transition-transform ${open ? "rotate-180" : ""}`}
        />
        <span
          className="flex-1 text-right"
          style={{ ...F, fontSize: 17, color: "#2d3648" }}
        >
          {value}
        </span>
      </button>
      {open && (
        <ul
          className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden"
          dir="rtl"
        >
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={[
                  "w-full text-right px-4 py-2.5 transition-colors",
                  opt === value
                    ? "bg-[#f0f2fd] text-[#1f3d97]"
                    : "hover:bg-[#f5f6fb] text-[#2d3648]",
                ].join(" ")}
                style={{ ...F, fontSize: 15 }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="bg-white flex-1 min-w-[180px] rounded-[20px] border border-[#eff0f6] px-5 py-4 flex items-center gap-3"
      dir="rtl"
    >
      <div className="flex flex-col gap-1 items-start flex-1">
        <p
          style={{
            ...F,
            fontSize: 22,
            color: "#2d3648",
            fontWeight: 700,
          }}
        >
          {value}
        </p>
        <p style={{ ...F, fontSize: 13, color: "#717d96" }}>
          {label}
        </p>
        {sub && (
          <p style={{ ...F, fontSize: 12, color: "#a1aebe" }}>
            {sub}
          </p>
        )}
      </div>
      <div
        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "#dcfce7" }}
      >
        {icon}
      </div>
    </div>
  );
}

// ─── Progress Card ────────────────────────────────────────────────────────────
function ProgressCard({
  icon,
  label,
  current,
  total,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  total: number;
}) {
  const pct = Math.round((current / total) * 100);
  return (
    <div
      className="bg-white flex-1 min-w-[200px] rounded-[20px] border border-[#eff0f6] px-5 py-4"
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1.5 items-start flex-1">
          <p
            style={{
              ...F,
              fontSize: 18,
              color: "#2d3648",
              fontWeight: 700,
            }}
          >
            {current.toLocaleString("ar-EG")}{" "}
            <span style={{ fontSize: 14, color: "#717d96" }}>
              من {total.toLocaleString("ar-EG")}
            </span>
          </p>
          <p style={{ ...F, fontSize: 13, color: "#717d96" }}>
            {label}
          </p>
        </div>
        <div
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "#dcfce7" }}
        >
          {icon}
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-3 w-full bg-[#eff0f6] rounded-full h-2">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(to right, #00b867, #00522e)",
          }}
        />
      </div>
      <p
        className="mt-1 text-right"
        style={{ ...F, fontSize: 11, color: "#a1aebe" }}
      >
        {pct}%
      </p>
    </div>
  );
}

// ─── Confirm Dialog (انهاء خدمة) ──────────────────────────────────────────────
function EndServiceDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      dir="rtl"
    >
      <div className="bg-white rounded-[16px] p-5 w-[90%] max-w-sm flex flex-col gap-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={20}
            className="shrink-0 text-[#e3282c]"
          />
          <span
            className="flex-1 text-right"
            style={{
              ...F,
              fontSize: 18,
              color: "#333",
              fontWeight: 700,
            }}
          >
            تحذير
          </span>
          
             <button
            type="button"
            onClick={onCancel}
            className="shrink-0 text-[#ccc] hover:text-[#888] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <p
          style={{
            ...F,
            fontSize: 16,
            color: "#333",
            textAlign: "right",
            lineHeight: 1.6,
          }}
        >
          هل انت متأكد من انهاء خدمة الافراد المحددين؟
        </p>

        {/* Footer */}
        <div className="flex items-center gap-2">
          {/* Confirm */}
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-[8px] transition-opacity hover:opacity-90"
            style={{
              background: "#e3282c",
              ...F,
              fontSize: 16,
              color: "#f5f5f5",
            }}
          >
            انهاء خدمة الافراد
          </button>
          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-[42px] transition-colors hover:bg-[#f5f5f5]"
            style={{ ...F, fontSize: 16, color: "#888" }}
          >
            الغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Transfer Dialog (ترحيل دفعة) ─────────────────────────────────────────────
const BATCH_OPTIONS = [
  "2-2026",
  "3-2026",
  "4-2026",
  "5-2026",
  "6-2026",
];

function TransferDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [targetBatch, setTargetBatch] = useState("3-2026");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      dir="rtl"
    >
      <div className="bg-white rounded-[24px] p-6 w-[90%] max-w-sm flex flex-col gap-6 shadow-xl items-center">
        {/* Icon */}
        <div
          className="w-10 h-10 flex items-center justify-center rounded-full"
          style={{ background: "#dcfce7" }}
        >
          <ArrowLeftRight
            size={20}
            style={{ color: "#00b867" }}
          />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5 items-center text-center">
          <p
            style={{
              ...F,
              fontSize: 18,
              color: "#122b16",
              fontWeight: 700,
            }}
          >
            ترحيل دفعة
          </p>
          <p style={{ ...F, fontSize: 13, color: "#404040" }}>
            يرجي اختيار دفعة الترحيل الجديدة للافراد
          </p>
        </div>

        {/* Dropdown */}
        <BatchDropdown
          value={targetBatch}
          options={BATCH_OPTIONS}
          onChange={setTargetBatch}
        />

        {/* Confirm button */}
        <button
          type="button"
          onClick={onConfirm}
          className="w-full h-[52px] rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90"
          style={{
            background:
              "linear-gradient(to bottom, #00b867, #00522e)",
          }}
        >
          <span style={{ ...F, fontSize: 16, color: "#fff" }}>
            ترحيل الافراد
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────
function SortIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 3v10M8 13l-3-3M8 13l3-3"
        stroke="#A0ABC0"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Soldiers Table ───────────────────────────────────────────────────────────
const MOCK_SOLDIERS = [
  {
    id: "1",
    militaryId: "2024427700265",
    rank: "جندي",
    name: "اسلام مجدي عبدالستار السيد",
    unit: "قيا مع العمليات الخاصة",
    receivedKariza: true,
    receivedLicense: true,
    status: "بالخدمة" as const,
  },
  {
    id: "2",
    militaryId: "2024159308527",
    rank: "جندي",
    name: "اسلام مجدي عبدالستار السيد",
    unit: "قيا مع 145 صع",
    receivedKariza: true,
    receivedLicense: true,
    status: "منتهي خدمته" as const,
  },
  {
    id: "3",
    militaryId: "2024964213580",
    rank: "جندي",
    name: "اسلام مجدي عبدالستار السيد",
    unit: "سرية القيادة",
    receivedKariza: true,
    receivedLicense: true,
    status: "بالخدمة" as const,
  },
];

type SoldierStatus = "بالخدمة" | "منتهي خدمته";

function StatusBadge({ status }: { status: SoldierStatus }) {
  const active = status === "بالخدمة";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
      style={{
        background: active ? "#dcfce7" : "#fce9ea",
        ...F,
        fontSize: 11,
        fontWeight: 700,
        color: active ? "#166534" : "#9d2e15",
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: active ? "#16a34a" : "#E37032" }}
      />
      {status}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const DISCHARGE_BATCHES = [
  "2-2026",
  "3-2026",
  "4-2026",
  "5-2026",
  "6-2026",
];

export function ReserveBatchesPage() {
  const [selectedBatch, setSelectedBatch] = useState("2-2026");
  const [showResults, setShowResults] = useState(false);
  const [checkedRows, setCheckedRows] = useState<Set<string>>(
    new Set(),
  );
  const [allChecked, setAllChecked] = useState(false);

  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] =
    useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // For editable checkboxes in table
  const [soldierData, setSoldierData] = useState(
    MOCK_SOLDIERS.map((s) => ({ ...s })),
  );

  function toggleRow(id: string) {
    setCheckedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allChecked) {
      setCheckedRows(new Set());
      setAllChecked(false);
    } else {
      setCheckedRows(new Set(soldierData.map((s) => s.id)));
      setAllChecked(true);
    }
  }

  function handleEndService() {
    if (checkedRows.size === 0) return;
    setShowEndDialog(true);
  }

  function confirmEndService() {
    setSoldierData((prev) =>
      prev.map((s) =>
        checkedRows.has(s.id)
          ? { ...s, status: "منتهي خدمته" as const }
          : s,
      ),
    );
    setCheckedRows(new Set());
    setAllChecked(false);
    setShowEndDialog(false);
    setSuccessMsg("تم انهاء خدمة الافراد المحددين بنجاح");
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  function handleTransfer() {
    if (checkedRows.size === 0) return;
    setShowTransferDialog(true);
  }

  function confirmTransfer() {
    setShowTransferDialog(false);
    setCheckedRows(new Set());
    setSuccessMsg("تم ترحيل الافراد المحددين بنجاح");
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  function toggleSoldierField(
    id: string,
    field: "receivedKariza" | "receivedLicense",
  ) {
    setSoldierData((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, [field]: !s[field] } : s,
      ),
    );
  }

  const thClass =
    "px-4 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]";
  const tdClass =
    "px-4 py-3 text-right border-b border-[#e2e7f0]";

  return (
    <div className="flex flex-col gap-5 w-full pb-10" dir="rtl">
      {/* Title */}
      <h1
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(22px,4vw,32px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        دفعات الرديف
      </h1>

      {/* Batch selector row */}
      <div className="flex flex-wrap items-end gap-3 justify-start">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-xs">
          <label
            style={{ ...F, fontSize: 14, color: "#717d96" }}
          >
            اختر تاريخ التسريح
          </label>
          <BatchDropdown
            value={selectedBatch}
            options={DISCHARGE_BATCHES}
            onChange={setSelectedBatch}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowResults(true)}
          className="h-[54px] px-6 rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90 shrink-0"
          style={{
            background:
              "linear-gradient(to bottom, #00b867, #00522e)",
            ...F,
            fontSize: 16,
            color: "#fff",
          }}
        >
          عرض الافراد
        </button>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div
          className="w-full rounded-[10px] px-4 py-3 flex items-center gap-2 justify-end"
          style={{ background: "#dcfce7" }}
        >
          <span
            style={{ ...F, fontSize: 14, color: "#166534" }}
          >
            {successMsg}
          </span>
        </div>
      )}

      {/* Results */}
      {showResults && (
        <>
          {/* Stats row */}
          <div className="flex flex-wrap gap-4 w-full">
            {/* Batch info */}
            <StatCard
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="#00b867"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 2v4M8 2v4M3 10h18"
                    stroke="#00b867"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              }
              label="دفعة الرديف"
              value={selectedBatch}
            />
            {/* Total count */}
            <StatCard
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                    stroke="#00b867"
                    strokeWidth="2"
                  />
                  <path
                    d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
                    stroke="#00b867"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="17"
                    cy="7"
                    r="3"
                    stroke="#00b867"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 21v-2a3 3 0 00-2.5-2.97"
                    stroke="#00b867"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              }
              label="عدد الجنود المسرحين"
              value="1,850"
            />
          </div>

          {/* Progress cards */}
          <div className="flex flex-wrap gap-4 w-full">
            <ProgressCard
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 2a5 5 0 110 10A5 5 0 0112 2z"
                    stroke="#00b867"
                    strokeWidth="2"
                  />
                  <path
                    d="M2 20a10 10 0 0120 0"
                    stroke="#00b867"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              }
              label="تم تسليم الشخصية العسكرية"
              current={978}
              total={1850}
            />
            <ProgressCard
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <rect
                    x="2"
                    y="6"
                    width="20"
                    height="14"
                    rx="2"
                    stroke="#00b867"
                    strokeWidth="2"
                  />
                  <path
                    d="M7 6V4a2 2 0 012-2h6a2 2 0 012 2v2"
                    stroke="#00b867"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              }
              label="تم تسليم تحقيق رخصة القيادة"
              current={38}
              total={120}
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={handleEndService}
              className="h-[44px] px-5 rounded-[8px] flex items-center justify-center shrink-0 transition-opacity hover:opacity-90"
              style={{
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
                ...F,
                fontSize: 15,
                color: "#fff",
              }}
            >
              انهاء خدمة الافراد
            </button>
            {/* ترحيل دفعه */}
            <button
              type="button"
              onClick={handleTransfer}
              className="h-[44px] px-5 rounded-[8px] border border-[#e2e7f0] bg-white transition-colors hover:bg-[#f5f6fb] flex items-center justify-center shrink-0"
              style={{ ...F, fontSize: 15, color: "#2d3648" }}
            >
              ترحيل دفعه
            </button>
            {/* طباعة الكشف */}
            <button
              type="button"
              onClick={() => window.print()}
              className="h-[44px] px-5 rounded-[8px] border border-[#e2e7f0] bg-white transition-colors hover:bg-[#f5f6fb] flex items-center justify-center shrink-0"
              style={{ ...F, fontSize: 15, color: "#2d3648" }}
            >
              طباعة الكشف
            </button>
            {/* انهاء خدمة الافراد */}
            
          </div>

          {/* Table */}
          <div className="bg-white rounded-[12px] border border-[#e2e7f0] w-full overflow-x-auto">
            <table
              className="w-full min-w-[700px] border-collapse"
              dir="rtl"
            >
              <thead>
                <tr>
                  <th className={thClass} style={{ width: 44 }}>
                    <button type="button" onClick={toggleAll}>
                      {allChecked ? (
                        <CheckSquare
                          size={16}
                          style={{ color: "#1f3d97" }}
                        />
                      ) : (
                        <Square
                          size={16}
                          style={{ color: "#a1aebe" }}
                        />
                      )}
                    </button>
                  </th>
                  {[
                    "م",
                    "رقم عسكري",
                    "درجة",
                    "اسم",
                    "الوحدة",
                    "استلام كارنيه",
                    "استلام رخصه",
                    "حالة الفرد",
                  ].map((h) => (
                    <th key={h} className={thClass}>
                      <div className="flex items-center gap-1 justify-start">
                        <span
                          style={{
                            ...F,
                            fontSize: 13,
                            color: "#717d96",
                          }}
                        >
                          {h}
                        </span>
                        <SortIcon />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {soldierData.map((soldier, idx) => (
                  <tr
                    key={soldier.id}
                    className="hover:bg-[#fafbff] transition-colors"
                  >
                    <td className={tdClass}>
                      <button
                        type="button"
                        onClick={() => toggleRow(soldier.id)}
                      >
                        {checkedRows.has(soldier.id) ? (
                          <CheckSquare
                            size={16}
                            style={{ color: "#1f3d97" }}
                          />
                        ) : (
                          <Square
                            size={16}
                            style={{ color: "#a1aebe" }}
                          />
                        )}
                      </button>
                    </td>
                    <td className={tdClass}>
                      <span
                        style={{
                          ...F,
                          fontSize: 13,
                          color: "#2d3648",
                        }}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <span
                        style={{
                          ...F,
                          fontSize: 13,
                          color: "#2d3648",
                        }}
                      >
                        {soldier.militaryId}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <span
                        style={{
                          ...F,
                          fontSize: 13,
                          color: "#2d3648",
                        }}
                      >
                        {soldier.rank}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <span
                        style={{
                          ...F,
                          fontSize: 13,
                          color: "#2d3648",
                        }}
                      >
                        {soldier.name}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <span
                        style={{
                          ...F,
                          fontSize: 13,
                          color: "#2d3648",
                        }}
                      >
                        {soldier.unit}
                      </span>
                    </td>
                    {/* Kariza checkbox */}
                    <td className={tdClass + " text-center"}>
                      <button
                        type="button"
                        onClick={() =>
                          toggleSoldierField(
                            soldier.id,
                            "receivedKariza",
                          )
                        }
                      >
                        {soldier.receivedKariza ? (
                          <CheckSquare
                            size={16}
                            style={{ color: "#00b867" }}
                          />
                        ) : (
                          <Square
                            size={16}
                            style={{ color: "#a1aebe" }}
                          />
                        )}
                      </button>
                    </td>
                    {/* License checkbox */}
                    <td className={tdClass + " text-center"}>
                      <button
                        type="button"
                        onClick={() =>
                          toggleSoldierField(
                            soldier.id,
                            "receivedLicense",
                          )
                        }
                      >
                        {soldier.receivedLicense ? (
                          <CheckSquare
                            size={16}
                            style={{ color: "#00b867" }}
                          />
                        ) : (
                          <Square
                            size={16}
                            style={{ color: "#a1aebe" }}
                          />
                        )}
                      </button>
                    </td>
                    <td className={tdClass}>
                      <StatusBadge status={soldier.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={() =>
              setSuccessMsg("تم حفظ التعديلات بنجاح")
            }
            className="h-[44px] px-6 rounded-[8px] border border-[#e2e7f0] bg-white transition-colors hover:bg-[#f5f6fb] self-end"
            style={{ ...F, fontSize: 15, color: "#2d3648" }}
          >
            حفظ التعديلات
          </button>
        </>
      )}

      {/* Dialogs */}
      {showEndDialog && (
        <EndServiceDialog
          onCancel={() => setShowEndDialog(false)}
          onConfirm={confirmEndService}
        />
      )}
      {showTransferDialog && (
        <TransferDialog
          onCancel={() => setShowTransferDialog(false)}
          onConfirm={confirmTransfer}
        />
      )}
    </div>
  );
}