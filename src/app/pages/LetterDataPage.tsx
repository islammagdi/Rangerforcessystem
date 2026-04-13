import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { ChevronDown, Trash2, Pencil, Check } from "lucide-react";
import type { SoldierData } from "../data/soldiersData";

const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SoldierWithAttachment extends SoldierData {
  attachmentUnit: string;
}

export interface LetterData {
  destination: string;
  attachmentPlace: string;
  reason: string;
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function GreenCheckBubble({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="ld-sg1" x1="16" x2="16" y1="0" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00B867" /><stop offset="1" stopColor="#00522E" />
            </linearGradient>
            <linearGradient id="ld-sg2" x1="16" x2="16" y1="0" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4BFF62" /><stop offset="1" stopColor="#318B3C" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill="url(#ld-sg1)" stroke="url(#ld-sg2)" strokeWidth="2" />
        </svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="absolute">
          <path d="M9 11.5L11.5 14L15.5 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ ...F, fontSize: 14, background: "linear-gradient(to bottom, #00b867, #00522e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );
}

function NumberBubble({ num, label, active }: { num: string; label: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2"
        style={{ borderColor: active ? "#2d3648" : "#a1aebe" }}
      >
        <span style={{ ...F, fontSize: 14, color: "#2d3648", lineHeight: 1.4 }}>{num}</span>
      </div>
      <span style={{ ...F, fontSize: 14, color: active ? "#2d3648" : "#465668", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );
}

function StepDots({ dark }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-[3px] mt-4 mx-2 shrink-0">
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="w-[3px] h-[3px] rounded-full shrink-0" style={{ background: dark ? "#1A202C" : "#A1AEBE" }} />
      ))}
    </div>
  );
}

function LetterStepper({ activeStep }: { activeStep: 1 | 2 | 3 | 4 }) {
  const steps = [
    { num: "01", label: "تحديد نوع الخطاب" },
    { num: "02", label: "تحديد الأفراد" },
    { num: "03", label: "بيانات الخطاب" },
    { num: "04", label: "المراجعة والتصديق" },
  ];
  return (
    <div className="flex items-start justify-center flex-wrap gap-0" dir="rtl">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < activeStep;
        const isActive = stepNum === activeStep;
        return (
          <div key={step.num} className="flex items-start">
            {isDone
              ? <GreenCheckBubble label={step.label} />
              : <NumberBubble num={step.num} label={step.label} active={isActive} />
            }
            {idx < steps.length - 1 && <StepDots dark={idx + 1 < activeStep} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function FormDropdown({
  placeholder, options, value, onChange, error,
}: {
  placeholder: string; options: string[]; value: string;
  onChange: (v: string) => void; error?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={["w-full h-[52px] bg-white border rounded-[8px] flex items-center gap-2 px-3 hover:border-[#a0aec0] transition-colors", error ? "border-[#ef4444]" : "border-[#e2e7f0]"].join(" ")}
        >
          <ChevronDown size={18} className={`shrink-0 text-[#2d3648] transition-transform ${open ? "rotate-180" : ""}`} />
          <span className="flex-1 text-right" style={{ ...F, fontSize: 16, color: value ? "#2d3648" : "#a0abc0" }}>
            {value || placeholder}
          </span>
        </button>
        {open && (
          <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden">
            {options.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={["w-full text-right px-4 py-2.5 transition-colors", opt === value ? "bg-[#f0f2fd] text-[#1f3d97]" : "hover:bg-[#f5f6fb] text-[#2d3648]"].join(" ")}
                  style={{ ...F, fontSize: 15 }}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-right px-1" style={{ ...F, fontSize: 13, color: "#ef4444" }}>{error}</p>}
    </div>
  );
}

// ─── Inline Row Dropdown ──────────────────────────────────────────────────────
function InlineDropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 h-8 px-2 rounded-[6px] bg-[#f0f2fd] border border-[#c7cef7] transition-colors hover:bg-[#e8ecfb]"
      >
        <ChevronDown size={14} className={`shrink-0 text-[#1f3d97] transition-transform ${open ? "rotate-180" : ""}`} />
        <span style={{ ...F, fontSize: 13, color: "#1f3d97", whiteSpace: "nowrap" }}>{value}</span>
      </button>
      {open && (
        <ul className="absolute z-50 top-full mt-1 left-0 min-w-[160px] bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden">
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={["w-full text-right px-3 py-2 transition-colors", opt === value ? "bg-[#f0f2fd] text-[#1f3d97]" : "hover:bg-[#f5f6fb] text-[#2d3648]"].join(" ")}
                style={{ ...F, fontSize: 13 }}
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

// ─── Sort Icon ────────────────────────────────────────────────────────────────
function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M8 13l-3-3M8 13l3-3" stroke="#A0ABC0" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function LetterDataPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { letterType?: string; soldiers?: SoldierData[] } | null;
  const letterType: "attachment" | "end-attachment" = state?.letterType === "end-attachment" ? "end-attachment" : "attachment";
  const incomingSoldiers: SoldierData[] = state?.soldiers ?? [];

  const pageTitle = letterType === "end-attachment" ? "اصدار خطاب إنهاء إلحاق" : "اصدار خطاب إلحاق";

  const DESTINATION_OPTIONS = ["سرية القيادة", "فرع العمليات", "قيادة المنطقة", "هيئة الأركان", "مج العمليات الخاصة"];
  const ATTACHMENT_OPTIONS  = ["ك ١١٣ صع", "مع العمليات الخاصة", "س ١٤٥ اشارة", "فرع العمليات", "قيادة المنطقة", "لا يوجد"];

  const [destination, setDestination] = useState("");
  const [attachmentPlace, setAttachmentPlace] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Per-soldier attachment overrides: soldierID → attachmentUnit
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  // When global attachment changes, reset overrides
  function handleAttachmentPlaceChange(v: string) {
    setAttachmentPlace(v);
    setOverrides({});
    if (errors.attachmentPlace) setErrors((p) => ({ ...p, attachmentPlace: undefined }));
  }

  const isEndAttachment = letterType === "end-attachment";

  // For end-attachment: pre-fill وحدة الالحاق from soldier.attachmentPlace or soldier.unit
  function getAttachmentUnit(soldier: SoldierData): string {
    if (isEndAttachment) {
      return overrides[soldier.id] ?? soldier.attachmentPlace ?? soldier.unit;
    }
    return overrides[soldier.id] ?? attachmentPlace ?? soldier.unit;
  }

  function handleRowAttachmentChange(soldierId: string, v: string) {
    setOverrides((prev) => ({ ...prev, [soldierId]: v }));
    setEditingId(null);
  }

  function handleRemoveSoldier(id: string) {
    // Remove from local list (we'll maintain a local state)
    setLocalSoldiers((prev) => prev.filter((s) => s.id !== id));
  }

  const [localSoldiers, setLocalSoldiers] = useState<SoldierData[]>(incomingSoldiers);

  function validate() {
    const e: Record<string, string> = {};
    if (!destination.trim()) e.destination = "جهة الخطاب مطلوبة";
    if (!isEndAttachment && !attachmentPlace.trim()) e.attachmentPlace = "مكان الالحاق مطلوب";
    if (!reason.trim()) e.reason = isEndAttachment ? "سبب إنهاء الالحاق مطلوب" : "سبب الالحاق مطلوب";
    return e;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const soldiersWithAttachment: SoldierWithAttachment[] = localSoldiers.map((s) => ({
      ...s,
      attachmentUnit: getAttachmentUnit(s),
    }));

    navigate("/dashboard/issue-letter/review", {
      state: {
        letterType,
        soldiers: soldiersWithAttachment,
        letterData: { destination, attachmentPlace, reason },
      },
    });
  }

  const thClass = "px-4 py-3 text-right border-b border-[#e2e7f0]";
  const tdClass = "px-4 py-3 text-right border-b border-[#e2e7f0]";

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">

      {/* Title */}
      <h1
        className="text-center"
        style={{ ...F, fontWeight: 700, fontSize: "clamp(22px,4vw,32px)", color: "#2d3648", lineHeight: 1.5 }}
      >
        {pageTitle}
      </h1>

      {/* Stepper */}
      <div className="flex justify-center">
        <LetterStepper activeStep={3} />
      </div>

      {/* Subtitle */}
      <p
        className="text-center"
        style={{ ...F, fontWeight: 700, fontSize: "clamp(18px,3vw,24px)", color: "#404040", lineHeight: 1.5 }}
      >
        يرجي ادخال بيانات الخطاب
      </p>

      {/* Form card */}
      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full">
        <div className="flex flex-col gap-5 px-6 py-5">

          {/* Row 1: dropdowns */}
          {isEndAttachment ? (
            /* End-attachment: single full-width جهة الخطاب dropdown */
            <div className="flex flex-col gap-1.5 w-full">
              <label style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>جهة الخطاب</label>
              <FormDropdown
                placeholder="اختر الجهة"
                options={DESTINATION_OPTIONS}
                value={destination}
                onChange={(v) => { setDestination(v); if (errors.destination) setErrors((p) => ({ ...p, destination: undefined })); }}
                error={errors.destination}
              />
            </div>
          ) : (
            /* Attachment: two dropdowns side by side */
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {/* Right: جهة الخطاب */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <label style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>جهة الخطاب</label>
                <FormDropdown
                  placeholder="اختر الجهة"
                  options={DESTINATION_OPTIONS}
                  value={destination}
                  onChange={(v) => { setDestination(v); if (errors.destination) setErrors((p) => ({ ...p, destination: undefined })); }}
                  error={errors.destination}
                />
              </div>
              {/* Left: مكان الالحاق */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <label style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>مكان الالحاق</label>
                <FormDropdown
                  placeholder="اختر مكان الالحاق"
                  options={ATTACHMENT_OPTIONS}
                  value={attachmentPlace}
                  onChange={handleAttachmentPlaceChange}
                  error={errors.attachmentPlace}
                />
                <p style={{ ...F, fontSize: 12, color: "#717d96", lineHeight: 1.5 }}>
                  سيتم تطبيق وحدة الالحاق على جميع الافراد ولكن يمكنك تعديل كل فرد من خلال جدول الافراد
                </p>
              </div>
            </div>
          )}

          <div className="w-full h-px bg-[#eff0f6]" />

          {/* سبب الالحاق / سبب انهاء الالحاق */}
          <div className="flex flex-col gap-1.5 w-full">
            <label style={{ ...F, fontWeight: 700, fontSize: 15, color: "#2d3648" }}>
              {isEndAttachment ? "سبب انهاء الالحاق" : "سبب الالحاق"}
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); if (errors.reason) setErrors((p) => ({ ...p, reason: undefined })); }}
              placeholder="اكتب السبب"
              rows={3}
              dir="rtl"
              className={["w-full bg-white border rounded-[8px] px-3 py-3 text-right outline-none resize-none focus:border-[#1f3d97] transition-colors", errors.reason ? "border-[#ef4444]" : "border-[#e2e7f0]"].join(" ")}
              style={{ ...F, fontSize: 16, color: "#4a5468" }}
            />
            {errors.reason && <p style={{ ...F, fontSize: 13, color: "#ef4444" }}>{errors.reason}</p>}
          </div>

          {/* Soldiers table */}
          {localSoldiers.length > 0 && (
            <div className="w-full overflow-x-auto rounded-[12px] border border-[#e2e7f0]">
              <table className="w-full min-w-[580px] border-collapse">
                <thead>
                  <tr className="bg-[#f7f9fc]">
                    {["الاجراء", "وحدة الالحاق", "الوحدة", "اسم", "درجة"].map((h) => (
                      <th key={h} className={thClass}>
                        <div className="flex items-center gap-1 justify-end">
                          <span style={{ ...F, fontSize: 14, color: "#717d96" }}>{h}</span>
                          <SortIcon />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localSoldiers.map((soldier, idx) => (
                    <tr key={soldier.id} className={idx === localSoldiers.length - 1 ? "" : ""}>
                      {/* الاجراء */}
                      <td className={tdClass}>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveSoldier(soldier.id)}
                            className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors hover:opacity-80"
                            style={{ backgroundColor: "#fce8f1" }}
                          >
                            <Trash2 size={13} style={{ color: "#e3282c" }} />
                          </button>
                          {editingId === soldier.id ? (
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors hover:opacity-80"
                              style={{ backgroundColor: "#ebfaea" }}
                            >
                              <Check size={13} style={{ color: "#00b867" }} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingId(soldier.id)}
                              className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors hover:opacity-80"
                              style={{ backgroundColor: "#ebedfd" }}
                            >
                              <Pencil size={13} style={{ color: "#1f3d97" }} />
                            </button>
                          )}
                        </div>
                      </td>
                      {/* وحدة الالحاق */}
                      <td className={tdClass}>
                        {editingId === soldier.id ? (
                          <InlineDropdown
                            value={getAttachmentUnit(soldier)}
                            options={ATTACHMENT_OPTIONS}
                            onChange={(v) => handleRowAttachmentChange(soldier.id, v)}
                          />
                        ) : (
                          <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                            {getAttachmentUnit(soldier)}
                          </span>
                        )}
                      </td>
                      {/* الوحدة */}
                      <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{soldier.unit}</span></td>
                      {/* اسم */}
                      <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{soldier.name}</span></td>
                      {/* درجة */}
                      <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{soldier.rank}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-start pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              className="min-h-[48px] px-6 rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90 active:opacity-80"
              style={{ background: "linear-gradient(to bottom, #00b867, #00522e)", minWidth: 180 }}
            >
              <span style={{ ...F, fontSize: 16, color: "#f5f5f5" }}>المعاينه والحفظ النهائي</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}