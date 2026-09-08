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
import { STAGE_MONTHS } from "../../lib/trainingRecommendations";
import type { SoldierData } from "../data/soldiersData";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SoldierWithAttachment extends SoldierData {
  // مستخدمة فقط لخطابات الإلحاق/إنهاء الإلحاق
  attachmentUnit?: string;
  attachmentUnitId?: string;

  // ✅ مستخدمة فقط لخطابات الضم (صاعقة / إدارات خارجية)
  remarks?: string;
  administrationId?: string | null;
  administrationName?: string | null;
}

export interface LetterData {
  destination: string;
  destinationId: string;
  issuingUnitId: string;
  attachmentPlace: string;
  attachmentPlaceId: string | null;
  reason: string;
  notes: string;

  // ✅ مستخدمة فقط لخطابات الضم
  stageMonth?: number;
  stageYear?: number;
  administrationId?: string | null;
  administrationName?: string | null;
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

interface ExternalAdministration {
  id: string;
  name: string;
}

// ✅ أنواع الخطاب الأربعة المدعومة الآن
type LetterFlowType =
  | "attachment"
  | "end-attachment"
  | "join-saeqa"
  | "join-external";

const LETTER_TYPE_CODE_MAP: Record<LetterFlowType, string> = {
  attachment: "ATTACH",
  "end-attachment": "DEATTACH",
  "join-saeqa": "JOIN_SAEQA",
  "join-external": "JOIN_EXTERNAL",
};

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
              {filteredOptions.length} نتيجة
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
                    لا توجد نتيجة بهذا الاسم
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
    letterType?: LetterFlowType;
    soldiers?: SoldierData[];
  } | null;

  // ✅ بقى فيه 4 أنواع بدل 2
  const letterType: LetterFlowType =
    state?.letterType === "end-attachment" ||
    state?.letterType === "join-saeqa" ||
    state?.letterType === "join-external"
      ? state.letterType
      : "attachment";

  const incomingSoldiers: SoldierData[] = state?.soldiers ?? [];

  const isEndAttachment = letterType === "end-attachment";
  const isJoin = letterType === "join-saeqa" || letterType === "join-external";
  const isJoinExternal = letterType === "join-external";

  const pageTitle =
    letterType === "end-attachment"
      ? "اصدار خطاب إنهاء إلحاق"
      : letterType === "join-saeqa"
      ? "اصدار خطاب ضم أفراد صاعقة"
      : letterType === "join-external"
      ? "اصدار خطاب ضم أفراد إدارات خارجية"
      : "اصدار خطاب إلحاق";

  // ─────────────────────────────────────────────────────────
  // Supabase Data
  // ─────────────────────────────────────────────────────────

  const [units, setUnits] = useState<Unit[]>([]);
  const [letterTypes, setLetterTypes] = useState<LetterType[]>([]);
  const [administrations, setAdministrations] = useState<
    ExternalAdministration[]
  >([]);

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
          { data: adminsData, error: adminsError },
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

          supabase
            .from("external_administrations")
            .select("id,name")
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

        if (adminsError) {
          throw new Error(
            `خطأ في تحميل الإدارات الخارجية: ${adminsError.message}`
          );
        }

        setUnits(unitsData ?? []);
        setLetterTypes(typesData ?? []);
        setAdministrations(adminsData ?? []);
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
    (type) => type.code === LETTER_TYPE_CODE_MAP[letterType]
  );

  // ─────────────────────────────────────────────────────────
  // Form State — الإلحاق / إنهاء الإلحاق
  // ─────────────────────────────────────────────────────────

  const [destination, setDestination] = useState("");
  const [destinationId, setDestinationId] = useState("");

  const [attachmentPlace, setAttachmentPlace] = useState("");
  const [attachmentPlaceId, setAttachmentPlaceId] = useState<string | null>(
    null
  );

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  // ─────────────────────────────────────────────────────────
  // Form State — خطابات الضم فقط
  // ─────────────────────────────────────────────────────────

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const [stageMonth, setStageMonth] = useState(STAGE_MONTHS[0].value);
  const [stageYear, setStageYear] = useState(currentYear);

  const [administrationName, setAdministrationName] = useState("");
  const [administrationId, setAdministrationId] = useState("");

  // ملاحظة كل فرد (افتراضيًا "(1س) الأصل" وقابلة للتعديل)
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  // إدارة كل فرد (تبدأ بالإدارة العامة المختارة، وقابلة للتخصيص لكل فرد)
  const [soldierAdminOverrides, setSoldierAdminOverrides] = useState<
    Record<string, string>
  >({});

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
  // Unit / Administration Options
  // ─────────────────────────────────────────────────────────

  const unitOptions = units.map((unit) => unit.name).filter(Boolean);
  const administrationOptions = administrations.map((a) => a.name);

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
  // Attachment Unit (خاص بالإلحاق فقط)
  // ─────────────────────────────────────────────────────────

  function handleAttachmentPlaceChange(name: string) {
    const unit = units.find((item) => item.name === name);

    setAttachmentPlace(name);
    setAttachmentPlaceId(unit?.id ?? null);

    setOverrides({});
    setOverrideIds({});

    if (errors.attachmentPlace) {
      setErrors((prev) => ({
        ...prev,
        attachmentPlace: "",
      }));
    }
  }

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
  // Administration (خاص بخطابات الضم فقط)
  // ─────────────────────────────────────────────────────────

  function handleAdministrationChange(name: string) {
    const admin = administrations.find((a) => a.name === name);

    setAdministrationName(name);
    setAdministrationId(admin?.id ?? "");

    // تغيير الإدارة العامة يعيد ضبط أي تخصيص فردي سابق
    setSoldierAdminOverrides({});

    if (errors.administration) {
      setErrors((prev) => ({
        ...prev,
        administration: "",
      }));
    }
  }

  function getSoldierAdministrationId(soldierId: string): string {
    return soldierAdminOverrides[soldierId] ?? administrationId;
  }

  function handleSoldierAdministrationChange(
    soldierId: string,
    adminId: string
  ) {
    setSoldierAdminOverrides((prev) => ({
      ...prev,
      [soldierId]: adminId,
    }));
  }

  // ─────────────────────────────────────────────────────────
  // Remarks (خاص بخطابات الضم فقط)
  // ─────────────────────────────────────────────────────────

  function getRemark(soldierId: string): string {
    return remarks[soldierId] ?? "(1س) الأصل";
  }

  function handleRemarkChange(soldierId: string, value: string) {
    setRemarks((prev) => ({
      ...prev,
      [soldierId]: value,
    }));
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

    if (!selectedLetterType) {
      e.letterType = "نوع الخطاب غير موجود في قاعدة البيانات";
    }

    if (localSoldiers.length === 0) {
      e.soldiers = "يجب اختيار فرد واحد على الأقل";
    }

    // ✅ خطابات الضم: مفيهاش مكان إلحاق ولا سبب، وبس بنتحقق من
    // الإدارة العامة لو النوع "ضم إدارات خارجية"
    if (isJoin) {
      if (isJoinExternal && !administrationId) {
        e.administration = "الإدارة مطلوبة";
      }

      return e;
    }

    // باقي التحقق خاص فقط بالإلحاق/إنهاء الإلحاق

    if (!isEndAttachment && !attachmentPlaceId) {
      e.attachmentPlace = "مكان الالحاق مطلوب";
    }

    if (!reason.trim()) {
      e.reason = isEndAttachment
        ? "سبب إنهاء الالحاق مطلوب"
        : "سبب الالحاق مطلوب";
    }

    // ✅ التحقق: لو الخطاب "إلحاق"، نتأكد إن مفيش فرد وحدة إلحاقه
    // المختارة هي نفسها وحدته الأساسية
    if (!isEndAttachment && localSoldiers.length > 0) {
      const invalidSoldierNames = localSoldiers
        .filter((soldier) => {
          const chosenAttachmentUnitName = getAttachmentUnit(soldier);

          return (
            chosenAttachmentUnitName &&
            chosenAttachmentUnitName === soldier.unit
          );
        })
        .map((soldier) => soldier.name);

      if (invalidSoldierNames.length > 0) {
        e.attachmentPlace =
          "لا يمكن إلحاق الفرد بنفس وحدته الأساسية يرجي تغيير الوحدة.";
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

    let soldiersPayload: SoldierWithAttachment[];

    if (isJoin) {
      soldiersPayload = localSoldiers.map((soldier) => {
        const adminId = isJoinExternal
          ? getSoldierAdministrationId(soldier.id)
          : "";

        const adminName = isJoinExternal
          ? administrations.find((a) => a.id === adminId)?.name ?? null
          : null;

        return {
          ...soldier,
          remarks: getRemark(soldier.id),
          administrationId: isJoinExternal ? adminId || null : null,
          administrationName: adminName,
        };
      });
    } else {
      soldiersPayload = localSoldiers.map((soldier) => ({
        ...soldier,
        attachmentUnit: getAttachmentUnit(soldier),
        attachmentUnitId: getAttachmentUnitId(soldier) ?? undefined,
      }));
    }

    const letterData: LetterData = {
      destination,
      destinationId,
      issuingUnitId: destinationId,

      attachmentPlace: !isJoin && !isEndAttachment ? attachmentPlace : "",
      attachmentPlaceId: !isJoin && !isEndAttachment ? attachmentPlaceId : null,

      reason: isJoin ? "" : reason,
      notes: isJoin ? "" : notes,

      ...(isJoin
        ? {
            stageMonth,
            stageYear,
            administrationId: isJoinExternal ? administrationId || null : null,
            administrationName: isJoinExternal
              ? administrationName || null
              : null,
          }
        : {}),
    };

    navigate("/dashboard/issue-letter/review", {
      state: {
        letterType,
        letterTypeId: selectedLetterType?.id,
        letterTypeCode: selectedLetterType?.code,
        soldiers: soldiersPayload,
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
  // Table Columns (حسب نوع الخطاب)
  // ─────────────────────────────────────────────────────────

  const thClass = "px-4 py-3 text-right border-b border-[#e2e7f0]";
  const tdClass = "px-4 py-3 text-right border-b border-[#e2e7f0]";

  const tableHeaders = isJoin
    ? isJoinExternal
      ? ["درجة", "اسم", "الوحدة", "ملاحظات", "الادارة", "الاجراء"]
      : ["درجة", "اسم", "الوحدة", "ملاحظات", "الاجراء"]
    : ["درجة", "اسم", "الوحدة", "وحدة الالحاق", "الاجراء"];

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
          {isJoin ? (
            /* ═══════════════════════════════════════════════════
               بيانات خطابات الضم (صاعقة / إدارات خارجية)
            ═══════════════════════════════════════════════════ */
            <>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                {/* جهة الخطاب */}

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

                {/* الإدارة (ضم إدارات فقط) */}

                {isJoinExternal && (
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <label
                      style={{
                        ...F,
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#2d3648",
                      }}
                    >
                      الإدارة
                    </label>

                    <FormDropdown
                      placeholder="اختر الإدارة"
                      options={administrationOptions}
                      value={administrationName}
                      onChange={handleAdministrationChange}
                      error={errors.administration}
                    />

                    <p
                      style={{
                        ...F,
                        fontSize: 12,
                        color: "#717d96",
                        lineHeight: 1.5,
                      }}
                    >
                      سيتم تطبيق الإدارة على جميع الأفراد، ويمكنك تعديلها
                      لكل فرد من خلال جدول الأفراد
                    </p>
                  </div>
                )}
              </div>

              {/* المرحلة التجنيدية */}

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <label
                    style={{
                      ...F,
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#2d3648",
                    }}
                  >
                    سنة المرحلة التجنيدية
                  </label>

                  <select
                    value={stageYear}
                    onChange={(e) => setStageYear(Number(e.target.value))}
                    dir="rtl"
                    className="w-full h-[52px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#1f3d97] bg-white"
                    style={{ ...F, fontSize: 16, color: "#2d3648" }}
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <label
                    style={{
                      ...F,
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#2d3648",
                    }}
                  >
                    شهر المرحلة التجنيدية
                  </label>

                  <select
                    value={stageMonth}
                    onChange={(e) => setStageMonth(Number(e.target.value))}
                    dir="rtl"
                    className="w-full h-[52px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#1f3d97] bg-white"
                    style={{ ...F, fontSize: 16, color: "#2d3648" }}
                  >
                    {STAGE_MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : (
            /* ═══════════════════════════════════════════════════
               بيانات الإلحاق / إنهاء الإلحاق (زي ما كانت بالظبط)
            ═══════════════════════════════════════════════════ */
            <>
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
                      سيتم تطبيق وحدة الالحاق على جميع الافراد ولكن يمكنك
                      تعديل كل فرد من خلال جدول الافراد
                    </p>
                  </div>
                </div>
              )}

              <div className="w-full h-px bg-[#eff0f6]" />

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
            </>
          )}

          <div className="w-full h-px bg-[#eff0f6]" />

          {/* Soldiers */}

          {localSoldiers.length > 0 && (
            <div className="w-full overflow-x-auto rounded-[12px] border border-[#e2e7f0]">
              <table className="w-full min-w-[580px] border-collapse">
                <thead>
                  <tr className="bg-[#f7f9fc]">
                    {tableHeaders.map((h) => (
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

                      {isJoin ? (
                        <>
                          {/* Remarks (نص حر لكل فرد) */}

                          <td className={tdClass}>
                            <input
                              type="text"
                              value={getRemark(soldier.id)}
                              onChange={(e) =>
                                handleRemarkChange(soldier.id, e.target.value)
                              }
                              dir="rtl"
                              className="w-full min-w-[140px] h-9 px-2 rounded-[6px] border border-[#e2e7f0] text-right outline-none focus:border-[#1f3d97]"
                              style={{
                                ...F,
                                fontSize: 13,
                                color: "#2d3648",
                              }}
                            />
                          </td>

                          {/* Administration (ضم إدارات فقط) */}

                          {isJoinExternal && (
                            <td className={tdClass}>
                              <select
                                value={getSoldierAdministrationId(soldier.id)}
                                onChange={(e) =>
                                  handleSoldierAdministrationChange(
                                    soldier.id,
                                    e.target.value
                                  )
                                }
                                dir="rtl"
                                className="w-full min-w-[140px] h-9 px-2 rounded-[6px] border border-[#e2e7f0] text-right outline-none focus:border-[#1f3d97] bg-white"
                                style={{
                                  ...F,
                                  fontSize: 13,
                                  color: "#2d3648",
                                }}
                              >
                                <option value="">اختر الإدارة</option>
                                {administrations.map((admin) => (
                                  <option key={admin.id} value={admin.id}>
                                    {admin.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                          )}

                          {/* Actions: حذف فقط */}

                          <td className={tdClass}>
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
                          </td>
                        </>
                      ) : (
                        <>
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
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveSoldier(soldier.id)
                                }
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
                        </>
                      )}
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