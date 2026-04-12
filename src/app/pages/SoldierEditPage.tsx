import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronDown, CalendarDays } from "lucide-react";
import { getSoldierById, updateSoldier } from "../data/soldiersData";

// ─── Helpers ────────────────────────────────────────────────────────────────
const FONT: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

const RANK_OPTIONS     = ["جندي", "عريف", "وكيل رقيب", "رقيب", "رقيب أول"];
const CATEGORY_OPTIONS = ["مجند", "متطوع"];
const UNIT_OPTIONS     = [
  "مج العمليات الخاصة",
  "ك ١١٣ صع",
  "س ١٤٥ اشارة",
  "فرع العمليات",
];

// ─── Dropdown ────────────────────────────────────────────────────────────────
function EditDropdown({
  options,
  value,
  onChange,
  disabled = false,
  blurred = false,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  blurred?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={[
          "w-full h-[42px] rounded-[6px] border border-[#e2e7f0] flex items-center gap-2 px-3 text-right transition-colors",
          disabled ? "bg-[#f5f5f5] cursor-not-allowed" : "bg-white hover:border-[#a0aec0]",
        ].join(" ")}
      >
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: disabled ? "#cbd2e0" : "#2D3648" }}
        />
        <span
          className={blurred ? "blur-[6px] select-none flex-1 text-right" : "flex-1 text-right"}
          style={{ ...FONT, fontSize: 14, color: disabled ? "#cbd2e0" : "#2d3648" }}
        >
          {value}
        </span>
      </button>

      {open && !disabled && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[6px] shadow-lg overflow-hidden">
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={[
                  "w-full text-right px-4 py-2.5 hover:bg-[#f5f6fb] transition-colors",
                  opt === value ? "bg-[#f0f2fd] text-[#1f3d97]" : "text-[#2d3648]",
                ].join(" ")}
                style={{ ...FONT, fontSize: 14 }}
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

// ─── Read-only Input ──────────────────────────────────────────────────────────
function ReadonlyInput({
  value,
  blurred = false,
  placeholder,
  note,
  hasCalendar = false,
}: {
  value: string;
  blurred?: boolean;
  placeholder?: string;
  note?: string;
  hasCalendar?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <div className="w-full h-[42px] rounded-[6px] border border-[#e2e7f0] bg-white flex items-center gap-2 px-3">
        {hasCalendar && <CalendarDays size={18} style={{ color: "#294dbb" }} className="shrink-0" />}
        {value ? (
          <span
            className={blurred ? "blur-[6px] select-none flex-1 text-right" : "flex-1 text-right"}
            style={{ ...FONT, fontSize: 14, color: blurred ? "#294dbb" : "#2d3648" }}
          >
            {value}
          </span>
        ) : (
          <span className="flex-1 text-right" style={{ ...FONT, fontSize: 14, color: "#cbd2e0" }}>
            {placeholder}
          </span>
        )}
      </div>
      {note && (
        <p className="text-right" style={{ ...FONT, fontSize: 12, color: "#717d96", lineHeight: 1.5 }}>
          {note}
        </p>
      )}
    </div>
  );
}

// ─── Field Pair ──────────────────────────────────────────────────────────────
function FieldPair({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="flex-1 min-w-0">{left}</div>
      <div className="flex-1 min-w-0">{right}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function SoldierEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const soldier = getSoldierById(id ?? "");

  // Local form state
  const [rank,     setRank]     = useState(soldier?.rank     ?? "جندي");
  const [category, setCategory] = useState(soldier?.category ?? "مجند");
  const [unit,     setUnit]     = useState(soldier?.unit     ?? "");

  if (!soldier) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ ...FONT, fontSize: 18, color: "#717d96" }}>لم يتم العثور على الفرد</p>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Persist changes to the in-memory store
    updateSoldier(soldier!.id, { rank, category, unit });
    // Navigate back to the detail page
    navigate(`/dashboard/individual-query/soldier/${soldier!.id}`);
  }

  return (
    <div className="flex flex-col gap-5 w-full" dir="rtl">

      {/* ── Title ───────────────────────────────────────────────────────── */}
      <h1
        className="text-center w-full"
        style={{ ...FONT, fontWeight: 700, fontSize: "clamp(20px, 4vw, 28px)", color: "#2d3648", lineHeight: 1.5 }}
      >
        البيانات الشخصية لفرد
      </h1>

      {/* ── Form card ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">

          {/* Card header */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-b border-[#cbd2e0]">
            <span style={{ ...FONT, fontSize: 18, color: "#4a5468" }}>البيانات التعريفية</span>
          </div>

          {/* Form fields */}
          <div className="flex flex-col gap-4 px-6 py-5">

            {/* Row 1: الدرجة | الرقم العسكري */}
            <FieldPair
              left={
                <EditDropdown
                  options={RANK_OPTIONS}
                  value={rank}
                  onChange={setRank}
                />
              }
              right={
                <ReadonlyInput value={soldier.militaryId} blurred />
              }
            />

            {/* Row 2: فئة الفرد | الاسم */}
            <FieldPair
              left={
                <EditDropdown
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={setCategory}
                />
              }
              right={
                <ReadonlyInput value={soldier.name} blurred />
              }
            />

            {/* Row 3: الوحدة الأساسية | الموقف الخدمي (readonly with note) */}
            <FieldPair
              left={
                <EditDropdown
                  options={UNIT_OPTIONS}
                  value={unit}
                  onChange={setUnit}
                  blurred={!!unit}
                />
              }
              right={
                <ReadonlyInput
                  value=""
                  placeholder="قوة الوحده"
                  note="هذا الحقل لا يمكن التعديل فيه الا عن طريق اصدار خطاب الحاق/انهاء الحاق"
                />
              }
            />

            {/* Row 4: جهة الالحاق (disabled) | تاريخ التسريح (date) */}
            <FieldPair
              left={
                <EditDropdown
                  options={[]}
                  value={soldier.attachmentPlace}
                  onChange={() => {}}
                  disabled
                />
              }
              right={
                <ReadonlyInput
                  value={soldier.dischargeDate}
                  blurred
                  hasCalendar
                />
              }
            />

            {/* اعتماد التعديل button */}
            <div className="flex items-start pt-1">
              <button
                type="submit"
                className="flex items-center justify-center px-5 h-10 rounded-[8px] transition-opacity hover:opacity-90 active:opacity-80"
                style={{ background: "linear-gradient(to bottom, #00b867, #00522e)" }}
              >
                <span style={{ ...FONT, fontSize: 14, color: "#f5f5f5" }}>اعتماد التعديل</span>
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
