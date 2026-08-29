import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router";
import {
  ChevronDown,
  Trash2,
  Pencil,
  Check,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import type { SoldierData } from "../data/soldiersData";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SoldierWithAttachment extends SoldierData {
  attachmentUnit: string;
  attachmentUnitId?: string;
}

export interface LetterData {
  destination: string;
  destinationId: string;
  issuingUnitId: string;
  attachmentPlace: string;
  attachmentPlaceId: string | null;
  reason: string;
   notes: string; // ✅ جديد
}

interface Unit {
  id: string;
  name: string;
  code: string;
  unit_type: string | null;
  is_active: boolean;
}

interface LetterType {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stepper
// ─────────────────────────────────────────────────────────────────────────────

function GreenCheckBubble({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient
              id="ld-sg1"
              x1="16"
              x2="16"
              y1="0"
              y2="32"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00B867" />
              <stop offset="1" stopColor="#00522E" />
            </linearGradient>
          </defs>

          <circle cx="16" cy="16" r="15" fill="url(#ld-sg1)" />
        </svg>

        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="absolute"
        >
          <path
            d="M9 11.5L11.5 14L15.5 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <span
        style={{
          ...F,
          fontSize: 14,
          background:
            "linear-gradient(to bottom, #00b867, #00522e)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function NumberBubble({
  num,
  label,
  active,
}: {
  num: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2"
        style={{
          borderColor: active ? "#2d3648" : "#a1aebe",
        }}
      >
        <span
          style={{
            ...F,
            fontSize: 14,
            color: "#2d3648",
            lineHeight: 1.4,
          }}
        >
          {num}
        </span>
      </div>

      <span
        style={{
          ...F,
          fontSize: 14,
          color: active ? "#2d3648" : "#465668",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function StepDots({ dark }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-[3px] mt-4 mx-2 shrink-0">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] h-[3px] rounded-full shrink-0"
          style={{
            background: dark ? "#1A202C" : "#A1AEBE",
          }}
        />
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
            {isDone ? (
              <GreenCheckBubble label={step.label} />
            ) : (
              <NumberBubble
                num={step.num}
                label={step.label}
                active={isActive}
              />
            )}

            {idx < steps.length - 1 && (
              <StepDots dark={idx + 1 < activeStep} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Searchable Dropdown
// ─────────────────────────────────────────────────────────────────────────────

function FormDropdown({
  placeholder,
  options,
  value,
  onChange,
  error,
  disabled = false,
}: {
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(option: string) {
    onChange(option);
    setSearch("");
    setOpen(false);
  }

  function handleOpen() {
    if (disabled) return;

    setOpen((prev) => !prev);

    if (!open) {
      setSearch("");
    }
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative w-full">
        <div
          className={[
            "w-full h-[52px] bg-white border rounded-[8px] flex items-center transition-colors",
            disabled
              ? "opacity-60 cursor-not-allowed"
              : "hover:border-[#a0aec0]",
            error
              ? "border-[#ef4444]"
              : open
              ? "border-[#1f3d97]"
              : "border-[#e2e7f0]",
          ].join(" ")}
        >
          <input
            type="text"
            value={open ? search : value}
            disabled={disabled}
            placeholder={value || placeholder}
            onFocus={() => {
              if (!disabled) {
                setOpen(true);
                setSearch("");
              }
            }}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                setSearch("");
              }

              if (e.key === "Enter" && filteredOptions.length === 1) {
                handleSelect(filteredOptions[0]);
              }
            }}
            className="flex-1 h-full bg-transparent outline-none px-3 text-right"
            style={{
              ...F,
              fontSize: 16,
              color: "#2d3648",
            }}
          />

          <button
            type="button"
            disabled={disabled}
            onClick={handleOpen}
            className="w-10 h-full flex items-center justify-center shrink-0"
          >
            <ChevronDown
              size={18}
              className={[
                "text-[#2d3648] transition-transform",
                open ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>
        </div>

        {open && !disabled && (
          <div className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden">
            <div
              className="px-3 py-2 border-b border-[#eff0f6] text-right bg-[#fafbfc]"
              style={{
                ...F,
                fontSize: 12,
                color: "#717d96",
              }}
            >
              {filteredOptions.length} وحدة
            </div>

            <ul className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <li>
                  <div
                    className="px-4 py-4 text-center"
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#717d96",
                    }}
                  >
                    لا توجد وحدة بهذا الاسم
                  </div>
                </li>
              ) : (
                filteredOptions.map((option) => (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={[
                        "w-full text-right px-4 py-2.5 transition-colors",
                        option === value
                          ? "bg-[#f0f2fd] text-[#1f3d97]"
                          : "hover:bg-[#f5f6fb] text-[#2d3648]",
                      ].join(" ")}
                      style={{
                        ...F,
                        fontSize: 15,
                      }}
                    >
                      {option}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <p
          className="text-right px-1"
          style={{
            ...F,
            fontSize: 13,
            color: "#ef4444",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Searchable Dropdown (يفتح عن طريق Portal خارج الجدول)
// ─────────────────────────────────────────────────────────────────────────────

function InlineDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 240 });

  const anchorRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  function updateCoords() {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;

    const menuWidth = Math.max(rect.width, 240);

    // dir="rtl" ⇒ نحاذي القائمة مع يمين الزرار
    let left = rect.right - menuWidth;
    if (left < 8) left = 8;

    setCoords({
      top: rect.bottom + 4,
      left,
      width: menuWidth,
    });
  }

  function handleOpen() {
    updateCoords();
    setOpen(true);
    setSearch("");
  }

  function handleSelect(option: string) {
    onChange(option);
    setSearch("");
    setOpen(false);
  }

  // اقفل الدروب داون عند السكرول / تغيير حجم الشاشة / الضغط بره القائمة
  useEffect(() => {
    if (!open) return;

    function handleScrollOrResize() {
      updateCoords();
    }

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;

      if (
        anchorRef.current?.contains(target) ||
        document.getElementById("inline-dropdown-portal")?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative min-w-[180px]" ref={anchorRef}>
      <div className="flex items-center gap-1 h-9 px-2 rounded-[6px] bg-[#f0f2fd] border border-[#c7cef7]">
        <input
          type="text"
          value={open ? search : value}
          placeholder={value || "اختر الوحدة"}
          onFocus={handleOpen}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) handleOpen();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setSearch("");
            }

            if (e.key === "Enter" && filteredOptions.length === 1) {
              handleSelect(filteredOptions[0]);
            }
          }}
          className="flex-1 min-w-0 bg-transparent outline-none text-right"
          style={{
            ...F,
            fontSize: 13,
            color: "#1f3d97",
          }}
        />

        <button
          type="button"
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              handleOpen();
            }
          }}
          className="shrink-0"
        >
          <ChevronDown
            size={14}
            className={[
              "text-[#1f3d97] transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
      </div>

      {open &&
        createPortal(
          <ul
            id="inline-dropdown-portal"
            dir="rtl"
            className="fixed z-[9999] bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden max-h-60 overflow-y-auto"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
          >
            {filteredOptions.length === 0 ? (
              <li>
                <div
                  className="px-4 py-3 text-center"
                  style={{
                    ...F,
                    fontSize: 13,
                    color: "#717d96",
                  }}
                >
                  لا توجد نتائج
                </div>
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={[
                      "w-full text-right px-3 py-2 transition-colors",
                      option === value
                        ? "bg-[#f0f2fd] text-[#1f3d97]"
                        : "hover:bg-[#f5f6fb] text-[#2d3648]",
                    ].join(" ")}
                    style={{
                      ...F,
                      fontSize: 13,
                    }}
                  >
                    {option}
                  </button>
                </li>
              ))
            )}
          </ul>,
          document.body
        )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sort Icon
// ─────────────────────────────────────────────────────────────────────────────

function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
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

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function LetterDataPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    letterType?: "attachment" | "end-attachment";
    soldiers?: SoldierData[];
  } | null;

  const letterType =
    state?.letterType === "end-attachment"
      ? "end-attachment"
      : "attachment";

  const incomingSoldiers: SoldierData[] = state?.soldiers ?? [];

  const isEndAttachment = letterType === "end-attachment";

  const pageTitle = isEndAttachment
    ? "اصدار خطاب إنهاء إلحاق"
    : "اصدار خطاب إلحاق";

  // ─────────────────────────────────────────────────────────
  // Supabase Data
  // ─────────────────────────────────────────────────────────

  const [units, setUnits] = useState<Unit[]>([]);
  const [letterTypes, setLetterTypes] = useState<LetterType[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      setLoadError("");

      try {
        const [
          { data: unitsData, error: unitsError },
          { data: typesData, error: typesError },
        ] = await Promise.all([
          supabase
            .from("units")
            .select("id,name,code,unit_type,is_active")
            .eq("is_active", true)
            .order("name"),

          supabase
            .from("letter_types")
            .select("id,name,code,is_active")
            .eq("is_active", true)
            .order("name"),
        ]);

        if (unitsError) {
          throw new Error(`خطأ في تحميل الوحدات: ${unitsError.message}`);
        }

        if (typesError) {
          throw new Error(
            `خطأ في تحميل أنواع الخطابات: ${typesError.message}`
          );
        }

        setUnits(unitsData ?? []);
        setLetterTypes(typesData ?? []);
      } catch (error) {
        console.error(error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحميل البيانات"
        );
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  // ─────────────────────────────────────────────────────────
  // Find Letter Type
  // ─────────────────────────────────────────────────────────

  const selectedLetterType = letterTypes.find(
    (type) => type.code === (isEndAttachment ? "DEATTACH" : "ATTACH")
  );

  // ─────────────────────────────────────────────────────────
  // Form State
  // ─────────────────────────────────────────────────────────

  const [destination, setDestination] = useState("");
  const [destinationId, setDestinationId] = useState("");

  const [attachmentPlace, setAttachmentPlace] = useState("");
  const [attachmentPlaceId, setAttachmentPlaceId] = useState<string | null>(
    null
  );

  const [reason, setReason] = useState("");
const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─────────────────────────────────────────────────────────
  // Soldiers
  // ─────────────────────────────────────────────────────────

  const [localSoldiers, setLocalSoldiers] =
    useState<SoldierData[]>(incomingSoldiers);

  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [overrideIds, setOverrideIds] = useState<Record<string, string>>({});

  const [editingId, setEditingId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────
  // Unit Options
  // ─────────────────────────────────────────────────────────

  const unitOptions = units.map((unit) => unit.name).filter(Boolean);

  // ─────────────────────────────────────────────────────────
  // Destination
  // ─────────────────────────────────────────────────────────

  function handleDestinationChange(name: string) {
    const unit = units.find((item) => item.name === name);

    setDestination(name);
    setDestinationId(unit?.id ?? "");

    if (errors.destination) {
      setErrors((prev) => ({
        ...prev,
        destination: "",
      }));
    }
  }

  // ─────────────────────────────────────────────────────────
  // Attachment Unit
  // ─────────────────────────────────────────────────────────

  function handleAttachmentPlaceChange(name: string) {
    const unit = units.find((item) => item.name === name);

    setAttachmentPlace(name);
    setAttachmentPlaceId(unit?.id ?? null);

    // تغيير وحدة الإلحاق العامة
    // يعيد ضبط التعديلات الفردية
    setOverrides({});
    setOverrideIds({});

    if (errors.attachmentPlace) {
      setErrors((prev) => ({
        ...prev,
        attachmentPlace: "",
      }));
    }
  }

  // ─────────────────────────────────────────────────────────
  // Get Soldier Attachment
  // ─────────────────────────────────────────────────────────

  function getAttachmentUnit(soldier: SoldierData): string {
    if (overrides[soldier.id]) {
      return overrides[soldier.id];
    }

    if (isEndAttachment) {
      return soldier.attachmentPlace || "";
    }

    return (
      attachmentPlace || soldier.attachmentPlace || soldier.unit || ""
    );
  }

  function getAttachmentUnitId(soldier: SoldierData): string | null {
    if (overrideIds[soldier.id]) {
      return overrideIds[soldier.id];
    }

    if (isEndAttachment) {
      if (!soldier.attachmentPlace) {
        return null;
      }

      const unit = units.find((u) => u.name === soldier.attachmentPlace);

      return unit?.id ?? null;
    }

    return attachmentPlaceId;
  }

  // ─────────────────────────────────────────────────────────
  // Row Change
  // ─────────────────────────────────────────────────────────

  function handleRowAttachmentChange(soldierId: string, value: string) {
    const unit = units.find((item) => item.name === value);

    setOverrides((prev) => ({
      ...prev,
      [soldierId]: value,
    }));

    setOverrideIds((prev) => ({
      ...prev,
      [soldierId]: unit?.id ?? "",
    }));

    setEditingId(null);
  }

  // ─────────────────────────────────────────────────────────
  // Remove Soldier
  // ─────────────────────────────────────────────────────────

  function handleRemoveSoldier(id: string) {
    setLocalSoldiers((prev) => prev.filter((s) => s.id !== id));
  }

  // ─────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────

  function validate() {
    const e: Record<string, string> = {};

    if (!destinationId) {
      e.destination = "جهة الخطاب مطلوبة";
    }

    if (!isEndAttachment && !attachmentPlaceId) {
      e.attachmentPlace = "مكان الالحاق مطلوب";
    }

    if (!reason.trim()) {
      e.reason = isEndAttachment
        ? "سبب إنهاء الالحاق مطلوب"
        : "سبب الالحاق مطلوب";
    }

    if (!selectedLetterType) {
      e.letterType = "نوع الخطاب غير موجود في قاعدة البيانات";
    }

    if (localSoldiers.length === 0) {
      e.soldiers = "يجب اختيار فرد واحد على الأقل";
    }

        // ✅ التحقق الجديد: لو الخطاب "إلحاق" (مش إنهاء إلحاق)، نتأكد إن
    // مفيش فرد وحدة إلحاقه المختارة (سواء العامة أو المُعدَّلة له
    // شخصيًا من الجدول) هي نفسها وحدته الأساسية.
    if (!isEndAttachment && localSoldiers.length > 0) {
      const invalidSoldierNames = localSoldiers
        .filter((soldier) => {
          const chosenAttachmentUnitName =
            getAttachmentUnit(soldier);

          return (
            chosenAttachmentUnitName &&
            chosenAttachmentUnitName === soldier.unit
          );
        })
        .map((soldier) => soldier.name);

      if (invalidSoldierNames.length > 0) {
        e.attachmentPlace ='لا يمكن إلحاق الفرد بنفس وحدته الأساسية يرجي تغيير الوحدة.';
      }
    }

    return e;
  
  }

  // ─────────────────────────────────────────────────────────
  // Submit → Review
  // ─────────────────────────────────────────────────────────

  function handleSubmit() {
    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});

    const soldiersWithAttachment: SoldierWithAttachment[] =
      localSoldiers.map((soldier) => ({
        ...soldier,

        attachmentUnit: getAttachmentUnit(soldier),

        attachmentUnitId: getAttachmentUnitId(soldier) ?? undefined,
      }));

   const letterData: LetterData = {
  destination,
  destinationId,
  issuingUnitId: destinationId,

  attachmentPlace: isEndAttachment ? "" : attachmentPlace,

  attachmentPlaceId: isEndAttachment ? null : attachmentPlaceId,

  reason,
  notes, // ✅ جديد
};

    navigate("/dashboard/issue-letter/review", {
      state: {
        letterType,
        letterTypeId: selectedLetterType?.id,

        letterTypeCode: selectedLetterType?.code,

        soldiers: soldiersWithAttachment,

        letterData,
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────

  if (loadingData) {
    return (
      <div
        className="flex items-center justify-center w-full min-h-[400px]"
        dir="rtl"
      >
        <div
          style={{
            ...F,
            fontSize: 18,
            color: "#415844",
          }}
        >
          جاري تحميل بيانات الخطاب...
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Error
  // ─────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 w-full min-h-[400px]"
        dir="rtl"
      >
        <div
          className="bg-red-50 border border-red-200 rounded-xl px-6 py-4"
          style={{
            ...F,
            color: "#b91c1c",
          }}
        >
          {loadError}
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2 rounded-lg text-white"
          style={{
            ...F,
            background: "linear-gradient(to bottom, #00b867, #00522e)",
          }}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Table Classes
  // ─────────────────────────────────────────────────────────

  const thClass = "px-4 py-3 text-right border-b border-[#e2e7f0]";
  const tdClass = "px-4 py-3 text-right border-b border-[#e2e7f0]";

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
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
        {pageTitle}
      </h1>

      {/* Stepper */}

      <div className="flex justify-center">
        <LetterStepper activeStep={3} />
      </div>

      {/* Subtitle */}

      <p
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(18px,3vw,24px)",
          color: "#404040",
          lineHeight: 1.5,
        }}
      >
        يرجي ادخال بيانات الخطاب
      </p>

      {/* Letter Type Error */}

      {errors.letterType && (
        <div
          className="w-full bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-right"
          style={{
            ...F,
            color: "#b91c1c",
          }}
        >
          {errors.letterType}
        </div>
      )}

      {/* Form */}

      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full">
        <div className="flex flex-col gap-5 px-6 py-5">
          {/* Destination */}

          {isEndAttachment ? (
            <div className="flex flex-col gap-1.5 w-full">
              <label
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#2d3648",
                }}
              >
                جهة الخطاب
              </label>

              <FormDropdown
                placeholder="ابحث عن جهة الخطاب"
                options={unitOptions}
                value={destination}
                onChange={handleDestinationChange}
                error={errors.destination}
              />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {/* Destination */}

              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <label
                  style={{
                    ...F,
                    fontWeight: 700,
                    fontSize: 15,
                    color: "#2d3648",
                  }}
                >
                  جهة الخطاب
                </label>

                <FormDropdown
                  placeholder="ابحث عن جهة الخطاب"
                  options={unitOptions}
                  value={destination}
                  onChange={handleDestinationChange}
                  error={errors.destination}
                />
              </div>

              {/* Attachment Unit */}

              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <label
                  style={{
                    ...F,
                    fontWeight: 700,
                    fontSize: 15,
                    color: "#2d3648",
                  }}
                >
                  مكان الالحاق
                </label>

                <FormDropdown
                  placeholder="ابحث عن مكان الالحاق"
                  options={unitOptions}
                  value={attachmentPlace}
                  onChange={handleAttachmentPlaceChange}
                  error={errors.attachmentPlace}
                />

                <p
                  style={{
                    ...F,
                    fontSize: 12,
                    color: "#717d96",
                    lineHeight: 1.5,
                  }}
                >
                  سيتم تطبيق وحدة الالحاق على جميع الافراد ولكن يمكنك تعديل
                  كل فرد من خلال جدول الافراد
                </p>
              </div>
            </div>
          )}

          <div className="w-full h-px bg-[#eff0f6]" />

          {/* Reason */}

          <div className="flex flex-col gap-1.5 w-full">
            <label
              style={{
                ...F,
                fontWeight: 700,
                fontSize: 15,
                color: "#2d3648",
              }}
            >
              {isEndAttachment ? "سبب انهاء الالحاق" : "سبب الالحاق"}
            </label>

            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);

                if (errors.reason) {
                  setErrors((p) => ({
                    ...p,
                    reason: "",
                  }));
                }
              }}
              placeholder="اكتب السبب"
              rows={3}
              dir="rtl"
              className={[
                "w-full bg-white border rounded-[8px] px-3 py-3 text-right outline-none resize-none focus:border-[#1f3d97] transition-colors",
                errors.reason ? "border-[#ef4444]" : "border-[#e2e7f0]",
              ].join(" ")}
              style={{
                ...F,
                fontSize: 16,
                color: "#4a5468",
              }}
            />

            {errors.reason && (
              <p
                style={{
                  ...F,
                  fontSize: 13,
                  color: "#ef4444",
                }}
              >
                {errors.reason}
              </p>
            )}
          </div>
{/* Notes */}

<div className="flex flex-col gap-1.5 w-full">
  <label
    style={{
      ...F,
      fontWeight: 700,
      fontSize: 15,
      color: "#2d3648",
    }}
  >
    ملاحظات (اختياري)
  </label>

  <textarea
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    placeholder="اكتب أي ملاحظات إضافية"
    rows={2}
    dir="rtl"
    className="w-full bg-white border border-[#e2e7f0] rounded-[8px] px-3 py-3 text-right outline-none resize-none focus:border-[#1f3d97] transition-colors"
    style={{
      ...F,
      fontSize: 16,
      color: "#4a5468",
    }}
  />
</div>
          {/* Soldiers */}

          {localSoldiers.length > 0 && (
            <div className="w-full overflow-x-auto rounded-[12px] border border-[#e2e7f0]">
              <table className="w-full min-w-[580px] border-collapse">
                <thead>
                  <tr className="bg-[#f7f9fc]">
                    {[
                      "درجة",
                      "اسم",
                      "الوحدة",
                      "وحدة الالحاق",
                      "الاجراء",
                    ].map((h) => (
                      <th key={h} className={thClass}>
                        <div className="flex items-center gap-1 justify-start">
                          <span
                            style={{
                              ...F,
                              fontSize: 14,
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
                  {localSoldiers.map((soldier) => (
                    <tr key={soldier.id}>
                      {/* Rank */}

                      <td className={tdClass}>
                        <span
                          style={{
                            ...F,
                            fontSize: 14,
                            color: "#2d3648",
                          }}
                        >
                          {soldier.rank}
                        </span>
                      </td>

                      {/* Name */}

                      <td className={tdClass}>
                        <span
                          style={{
                            ...F,
                            fontSize: 14,
                            color: "#2d3648",
                          }}
                        >
                          {soldier.name}
                        </span>
                      </td>

                      {/* Unit */}

                      <td className={tdClass}>
                        <span
                          style={{
                            ...F,
                            fontSize: 14,
                            color: "#2d3648",
                          }}
                        >
                          {soldier.unit}
                        </span>
                      </td>

                      {/* Attachment Unit */}

                      <td className={tdClass}>
                        {editingId === soldier.id ? (
                          <InlineDropdown
                            value={getAttachmentUnit(soldier)}
                            options={unitOptions}
                            onChange={(v) =>
                              handleRowAttachmentChange(soldier.id, v)
                            }
                          />
                        ) : (
                          <span
                            style={{
                              ...F,
                              fontSize: 14,
                              color: "#2d3648",
                            }}
                          >
                            {getAttachmentUnit(soldier) || "-"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}

                      <td className={tdClass}>
                        <div className="flex items-start gap-2">
                          {/* Delete */}

                          <button
                            type="button"
                            onClick={() => handleRemoveSoldier(soldier.id)}
                            className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors hover:opacity-80"
                            style={{
                              backgroundColor: "#fce8f1",
                            }}
                          >
                            <Trash2
                              size={13}
                              style={{
                                color: "#e3282c",
                              }}
                            />
                          </button>

                          {/* Edit / Check */}

                          {editingId === soldier.id ? (
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors hover:opacity-80"
                              style={{
                                backgroundColor: "#ebfaea",
                              }}
                            >
                              <Check
                                size={13}
                                style={{
                                  color: "#00b867",
                                }}
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingId(soldier.id)}
                              className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors hover:opacity-80"
                              style={{
                                backgroundColor: "#ebedfd",
                              }}
                            >
                              <Pencil
                                size={13}
                                style={{
                                  color: "#1f3d97",
                                }}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No Soldiers */}

          {localSoldiers.length === 0 && (
            <div
              className="w-full bg-[#fff8e8] border border-[#f4d58d] rounded-lg px-4 py-4 text-center"
              style={{
                ...F,
                fontSize: 14,
                color: "#8a6500",
              }}
            >
              لم يتم اختيار أي أفراد.
              <br />
              ارجع إلى الخطوة السابقة لاختيار الأفراد.
            </div>
          )}

          {errors.soldiers && (
            <p
              style={{
                ...F,
                fontSize: 13,
                color: "#ef4444",
              }}
            >
              {errors.soldiers}
            </p>
          )}

          {/* Submit */}

          <div className="w-full flex items-start pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              className="min-h-[48px] px-6 rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90 active:opacity-80"
              style={{
                background: "linear-gradient(to bottom, #00b867, #00522e)",
                minWidth: 180,
              }}
            >
              <span
                style={{
                  ...F,
                  fontSize: 16,
                  color: "#f5f5f5",
                }}
              >
                المعاينه والحفظ النهائي
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}