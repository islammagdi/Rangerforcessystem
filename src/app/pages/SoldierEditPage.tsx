import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { ChevronDown, CalendarDays } from "lucide-react";
import { supabase } from "../../lib/supabase";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const FONT: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// اسم الموقف الخدمي اللي بيفعّل حقل "جهة الإلحاق"
const ATTACHMENT_STATUS_NAME = "ملحق";

// أسماء فئة الفرد اللي بتتحكم في تاريخ التسريح
const VOLUNTEER_CATEGORY_NAME = "متطوع";
const CONSCRIPT_CATEGORY_NAME = "مجند";

// ✅ FIX: نفس الـ UUID المستخدم في ReserveBatchesPage لموقف "منتهي خدمته"
// (نفس القيمة الموجودة هناك DISCHARGED_STATUS_ID)
// استخدمنا نفس الـ ID الجاهز بدل الاعتماد على عمود "code" غير مؤكد وجوده
// في جدول service_statuses، عشان نضمن التطابق 100% مع باقي الصفحات.
const DISCHARGED_STATUS_ID = "ac8ddfa3-1578-455b-9b6a-b056260fcb1f";

// طول الرقم العسكري المطلوب بالظبط
const MILITARY_NUMBER_LENGTH = 13;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Option = {
  id: string;
  name: string;
};

type Soldier = {
  id: string;
  militaryId: string;
  name: string;
  rank: string;
  category: string;
  unit: string;
  serviceStatus: string;
  dischargeDate: string;
  attachmentPlace: string;

  rankId: string | null;
  categoryId: string | null;
  unitId: string | null;
  serviceStatusId: string | null;
  attachmentUnitId: string | null;
  // تاريخ التسريح الخام (YYYY-MM-DD) زي ما راجع من قاعدة البيانات
  dischargeDateRaw: string | null;
};

// ─────────────────────────────────────────────────────────────
// Floating position (Portal) helpers
// ---------------------------------------------------------------
// بنحسب مكان الزرار (anchor) على الشاشة عشان نرسم القائمة/الكالندر
// في document.body مباشرة (مش جوه الـ container الأبيض المحدود
// بـ overflow-hidden)، فمتقصش ومتختفيش.
// ─────────────────────────────────────────────────────────────

// هامش أمان من حواف الشاشة
const VIEWPORT_MARGIN = 8;

function useFloatingPosition(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement>,
  panelRef: React.RefObject<HTMLElement>,
  recalcTrigger?: unknown
) {
  const [rect, setRect] = useState({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!open) return;

    function updateRect() {
      const anchor = anchorRef.current;

      if (!anchor) return;

      const anchorBounds = anchor.getBoundingClientRect();

      // بنقيس طول البانل الفعلي (لو اترسم فعلًا) عشان نقرر
      // نفتحه تحت الحقل ولا نقلبه فوقه لو مفيش مساحة كفاية تحت.
      const panelHeight = panelRef.current?.offsetHeight ?? 0;

      const spaceBelow = window.innerHeight - anchorBounds.bottom;
      const spaceAbove = anchorBounds.top;

      const notEnoughRoomBelow =
        panelHeight > 0 &&
        spaceBelow < panelHeight + VIEWPORT_MARGIN &&
        spaceAbove > spaceBelow;

      const top = notEnoughRoomBelow
        ? Math.max(VIEWPORT_MARGIN, anchorBounds.top - panelHeight - 4)
        : anchorBounds.bottom + 4;

      setRect({
        top,
        left: anchorBounds.left,
        width: anchorBounds.width,
      });
    }

    updateRect();

    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);

    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recalcTrigger]);

  return rect;
}

function useCloseOnOutsideClick(
  open: boolean,
  onClose: () => void,
  refs: React.RefObject<HTMLElement>[]
) {
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;

      const clickedInside = refs.some(
        (ref) => ref.current && ref.current.contains(target)
      );

      if (!clickedInside) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

// ─────────────────────────────────────────────────────────────
// Dropdown
// ─────────────────────────────────────────────────────────────

function EditDropdown({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = "اختر...",
}: {
  options: Option[];
  value: string | null;
  onChange: (option: Option) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  const floatingRect = useFloatingPosition(open, buttonRef, panelRef);

  useCloseOnOutsideClick(open, () => setOpen(false), [buttonRef, panelRef]);

  const selectedOption = options.find((option) => option.id === value);

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={[
          "w-full h-[42px] rounded-[6px] border border-[#e2e7f0]",
          "flex items-center gap-2 px-3 text-right transition-colors",
          disabled
            ? "bg-[#f5f5f5] cursor-not-allowed"
            : "bg-white hover:border-[#a0aec0]",
        ].join(" ")}
      >
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          style={{
            color: disabled ? "#cbd2e0" : "#2D3648",
          }}
        />

        <span
          className="flex-1 text-right"
          style={{
            ...FONT,
            fontSize: 14,
            color: disabled
              ? "#cbd2e0"
              : selectedOption
              ? "#2d3648"
              : "#a0abc0",
          }}
        >
          {selectedOption?.name || placeholder}
        </span>
      </button>

      {open &&
        !disabled &&
        createPortal(
          <ul
            ref={panelRef}
            dir="rtl"
            className="fixed z-[9999] bg-white border border-[#e2e7f0] rounded-[6px] shadow-lg overflow-hidden max-h-60 overflow-y-auto"
            style={{
              top: floatingRect.top,
              left: floatingRect.left,
              width: floatingRect.width,
            }}
          >
            {options.length === 0 ? (
              <li>
                <div
                  className="w-full text-right px-4 py-3"
                  style={{
                    ...FONT,
                    fontSize: 14,
                    color: "#717d96",
                  }}
                >
                  لا توجد بيانات
                </div>
              </li>
            ) : (
              options.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                    className={[
                      "w-full text-right px-4 py-2.5",
                      "hover:bg-[#f5f6fb] transition-colors",
                      option.id === value
                        ? "bg-[#f0f2fd] text-[#1f3d97]"
                        : "text-[#2d3648]",
                    ].join(" ")}
                    style={{
                      ...FONT,
                      fontSize: 14,
                    }}
                  >
                    {option.name}
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

// ─────────────────────────────────────────────────────────────
// Readonly Input
// ─────────────────────────────────────────────────────────────

function ReadonlyInput({
  value,
  placeholder,
  note,
  hasCalendar = false,
}: {
  value: string;
  placeholder?: string;
  note?: string;
  hasCalendar?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <div className="w-full h-[42px] rounded-[6px] border border-[#e2e7f0] bg-white flex items-center gap-2 px-3">
        {hasCalendar && (
          <CalendarDays
            size={18}
            style={{ color: "#294dbb" }}
            className="shrink-0"
          />
        )}

        {value ? (
          <span
            className="flex-1 text-right"
            style={{
              ...FONT,
              fontSize: 14,
              color: "#2d3648",
            }}
          >
            {value}
          </span>
        ) : (
          <span
            className="flex-1 text-right"
            style={{
              ...FONT,
              fontSize: 14,
              color: "#cbd2e0",
            }}
          >
            {placeholder || "-"}
          </span>
        )}
      </div>

      {note && (
        <p
          className="text-right"
          style={{
            ...FONT,
            fontSize: 12,
            color: "#717d96",
            lineHeight: 1.5,
          }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Military Number Input (قابل للتعديل - 13 رقم بالظبط)
// ─────────────────────────────────────────────────────────────

function MilitaryNumberInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const digitsOnly = e.target.value
            .replace(/\D/g, "")
            .slice(0, MILITARY_NUMBER_LENGTH);

          onChange(digitsOnly);
        }}
        dir="rtl"
        placeholder={`أدخل ${MILITARY_NUMBER_LENGTH} رقم`}
        className={[
          "w-full h-[42px] rounded-[6px] border bg-white px-3",
          "text-right outline-none transition-colors",
          error
            ? "border-[#ef4444]"
            : "border-[#e2e7f0] focus:border-[#294dbb]",
        ].join(" ")}
        style={{
          ...FONT,
          fontSize: 14,
          color: "#2d3648",
        }}
      />

      <div className="flex items-center justify-between px-1">
        {error ? (
          <p
            className="text-right"
            style={{ ...FONT, fontSize: 12, color: "#ef4444" }}
          >
            {error}
          </p>
        ) : (
          <span />
        )}

        <p
          style={{
            ...FONT,
            fontSize: 11,
            color: value.length === MILITARY_NUMBER_LENGTH ? "#26861d" : "#a0abc0",
          }}
        >
          {value.length}/{MILITARY_NUMBER_LENGTH}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Date Input (DD-MM-YYYY)
// ─────────────────────────────────────────────────────────────

function DatePickerDDMMYYYY({
  value, // "YYYY-MM-DD" أو null
  onChange, // (iso: string | null) => void
  disabled = false,
}: {
  value: string | null;
  onChange: (iso: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // "days": عرض أيام الشهر العادي (زي ما كان)
  // "months": عرض شبكة الـ 12 شهر لسنة معينة (بعد الضغط على الهيدر)
  // "years": عرض شبكة سنين عشان تقفز لسنة بعيدة بسرعة
  const [pickerView, setPickerView] = useState<"days" | "months" | "years">(
    "days"
  );

  const YEARS_PER_PAGE = 12;

  const [yearsPageStart, setYearsPageStart] = useState(
    () => new Date().getFullYear() - Math.floor(YEARS_PER_PAGE / 2)
  );

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const floatingRect = useFloatingPosition(open, buttonRef, panelRef, pickerView);

  useCloseOnOutsideClick(open, () => setOpen(false), [buttonRef, panelRef]);

  const selected = value ? new Date(`${value}T00:00:00`) : null;

  const today = new Date();

  const [viewYear, setViewYear] = useState(
    selected ? selected.getFullYear() : today.getFullYear()
  );

  const [viewMonth, setViewMonth] = useState(
    selected ? selected.getMonth() : today.getMonth()
  ); // 0-indexed

  // كل ما نفتح الكالندر، نرجّع العرض لشهر/سنة التاريخ المختار
  // ونبدأ دايمًا من عرض الأيام
  useEffect(() => {
    if (!open) return;

    const d = selected ?? today;

    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setPickerView("days");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // لو الحقل بقى معطّل (مثلاً بعد اختيار فئة متطوع) نقفل الكالندر
  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  function openYearsView() {
    // بنخلي السنة الحالية في نص الشبكة تقريبًا
    setYearsPageStart(viewYear - Math.floor(YEARS_PER_PAGE / 2));
    setPickerView("years");
  }

  function goPrevYearsPage() {
    setYearsPageStart((y) => y - YEARS_PER_PAGE);
  }

  function goNextYearsPage() {
    setYearsPageStart((y) => y + YEARS_PER_PAGE);
  }

  const monthNames = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const weekDays = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

  function daysInMonth(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate();
  }

  function firstWeekday(y: number, m: number) {
    return new Date(y, m, 1).getDay(); // 0 = أحد
  }

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function selectDay(day: number) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    onChange(iso);
    setOpen(false);
  }

  function clearDate(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setOpen(false);
  }

  const displayText = value ? isoToDisplayDate(value) : "";

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startWeekday = firstWeekday(viewYear, viewMonth);

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={[
          "w-full h-[42px] rounded-[6px] border border-[#e2e7f0]",
          "flex items-center gap-2 px-3 text-right transition-colors",
          disabled
            ? "bg-[#f5f5f5] cursor-not-allowed"
            : "bg-white hover:border-[#a0aec0]",
        ].join(" ")}
      >
        <CalendarDays
          size={18}
          className="shrink-0"
          style={{ color: disabled ? "#cbd2e0" : "#294dbb" }}
        />

        <span
          className="flex-1 text-right"
          style={{
            ...FONT,
            fontSize: 14,
            color: disabled
              ? "#cbd2e0"
              : displayText
              ? "#2d3648"
              : "#a0abc0",
          }}
        >
          {displayText || "DD-MM-YYYY"}
        </span>
      </button>

      {open &&
        !disabled &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[9999] w-[280px] bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg p-3"
            style={{
              top: floatingRect.top,
              left: floatingRect.left,
            }}
            dir="rtl"
          >
            {/* رأس التنقل: بيتغيّر شكله حسب المستوى الحالي */}
            {pickerView === "days" && (
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#f5f6fb]"
                  style={{ color: "#2d3648" }}
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={() => setPickerView("months")}
                  className="px-2 py-1 rounded-[6px] hover:bg-[#f5f6fb] transition-colors"
                  style={{
                    ...FONT,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#2d3648",
                  }}
                >
                  {monthNames[viewMonth]} {viewYear}
                </button>

                <button
                  type="button"
                  onClick={goNextMonth}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#f5f6fb]"
                  style={{ color: "#2d3648" }}
                >
                  ›
                </button>
              </div>
            )}

            {pickerView === "months" && (
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y - 1)}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#f5f6fb]"
                  style={{ color: "#2d3648" }}
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={openYearsView}
                  className="px-2 py-1 rounded-[6px] hover:bg-[#f5f6fb] transition-colors"
                  style={{
                    ...FONT,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#2d3648",
                  }}
                >
                  {viewYear}
                </button>

                <button
                  type="button"
                  onClick={() => setViewYear((y) => y + 1)}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#f5f6fb]"
                  style={{ color: "#2d3648" }}
                >
                  ›
                </button>
              </div>
            )}

            {pickerView === "years" && (
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={goPrevYearsPage}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#f5f6fb]"
                  style={{ color: "#2d3648" }}
                >
                  ‹
                </button>

                <span
                  style={{
                    ...FONT,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#2d3648",
                  }}
                >
                  {yearsPageStart} - {yearsPageStart + YEARS_PER_PAGE - 1}
                </span>

                <button
                  type="button"
                  onClick={goNextYearsPage}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#f5f6fb]"
                  style={{ color: "#2d3648" }}
                >
                  ›
                </button>
              </div>
            )}

            {/* محتوى المستوى الحالي */}
            {pickerView === "days" && (
              <>
                {/* أسماء أيام الأسبوع */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {weekDays.map((d) => (
                    <div
                      key={d}
                      className="text-center"
                      style={{
                        ...FONT,
                        fontSize: 11,
                        color: "#a1aebe",
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* أيام الشهر */}
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} />;
                    }

                    const isSelected =
                      !!selected &&
                      selected.getFullYear() === viewYear &&
                      selected.getMonth() === viewMonth &&
                      selected.getDate() === day;

                    const isToday =
                      today.getFullYear() === viewYear &&
                      today.getMonth() === viewMonth &&
                      today.getDate() === day;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => selectDay(day)}
                        className="h-8 rounded-[6px] flex items-center justify-center transition-colors"
                        style={{
                          ...FONT,
                          fontSize: 13,
                          background: isSelected ? "#1f3d97" : "transparent",
                          color: isSelected
                            ? "#fff"
                            : isToday
                            ? "#1f3d97"
                            : "#2d3648",
                          fontWeight: isToday && !isSelected ? 700 : 400,
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = "#f5f6fb";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {pickerView === "months" && (
              <div className="grid grid-cols-3 gap-2">
                {monthNames.map((name, monthIndex) => {
                  const isSelectedMonth =
                    monthIndex === viewMonth &&
                    !!selected &&
                    selected.getFullYear() === viewYear;

                  const isCurrentViewMonth = monthIndex === viewMonth;

                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setViewMonth(monthIndex);
                        setPickerView("days");
                      }}
                      className="h-9 rounded-[6px] flex items-center justify-center transition-colors"
                      style={{
                        ...FONT,
                        fontSize: 12,
                        background: isSelectedMonth
                          ? "#1f3d97"
                          : isCurrentViewMonth
                          ? "#eef1fd"
                          : "transparent",
                        color: isSelectedMonth ? "#fff" : "#2d3648",
                        fontWeight: isSelectedMonth ? 700 : 400,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelectedMonth) {
                          e.currentTarget.style.background = "#f5f6fb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelectedMonth) {
                          e.currentTarget.style.background =
                            isCurrentViewMonth ? "#eef1fd" : "transparent";
                        }
                      }}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}

            {pickerView === "years" && (
              <div className="grid grid-cols-3 gap-2">
                {Array.from(
                  { length: YEARS_PER_PAGE },
                  (_, i) => yearsPageStart + i
                ).map((year) => {
                  const isSelectedYear =
                    year === viewYear &&
                    !!selected &&
                    selected.getFullYear() === viewYear;

                  const isCurrentViewYear = year === viewYear;

                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setViewYear(year);
                        setPickerView("months");
                      }}
                      className="h-9 rounded-[6px] flex items-center justify-center transition-colors"
                      style={{
                        ...FONT,
                        fontSize: 12,
                        background: isSelectedYear
                          ? "#1f3d97"
                          : isCurrentViewYear
                          ? "#eef1fd"
                          : "transparent",
                        color: isSelectedYear ? "#fff" : "#2d3648",
                        fontWeight: isSelectedYear ? 700 : 400,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelectedYear) {
                          e.currentTarget.style.background = "#f5f6fb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelectedYear) {
                          e.currentTarget.style.background =
                            isCurrentViewYear ? "#eef1fd" : "transparent";
                        }
                      }}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            )}

            {/* أزرار سفلية - تظهر بس في عرض الأيام */}
            {pickerView === "days" && (
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#eff0f6]">
                <button
                  type="button"
                  onClick={clearDate}
                  style={{
                    ...FONT,
                    fontSize: 12,
                    color: "#9d2e15",
                  }}
                >
                  مسح التاريخ
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewYear(today.getFullYear());
                    setViewMonth(today.getMonth());
                  }}
                  style={{
                    ...FONT,
                    fontSize: 12,
                    color: "#1f3d97",
                  }}
                >
                  اليوم
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Field Pair
// ─────────────────────────────────────────────────────────────

function FieldPair({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="flex-1 min-w-0">{left}</div>

      <div className="flex-1 min-w-0">{right}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Date formatters (تحويل بين YYYY-MM-DD و DD-MM-YYYY)
// ─────────────────────────────────────────────────────────────

function isoToDisplayDate(iso: string | null | undefined): string {
  if (!iso) return "";

  const datePart = iso.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

  if (!match) return "";

  const [, y, m, d] = match;
  return `${d}-${m}-${y}`;
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export function SoldierEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ───────────────────────────────────────────────────────────
  // Soldier
  // ───────────────────────────────────────────────────────────

  const [soldier, setSoldier] = useState<Soldier | null>(null);

  // ───────────────────────────────────────────────────────────
  // Dropdown data
  // ───────────────────────────────────────────────────────────

  const [rankOptions, setRankOptions] = useState<Option[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [unitOptions, setUnitOptions] = useState<Option[]>([]);
  const [serviceStatusOptions, setServiceStatusOptions] = useState<
    Option[]
  >([]);
  const [attachmentUnitOptions, setAttachmentUnitOptions] = useState<
    Option[]
  >([]);

  // ───────────────────────────────────────────────────────────
  // Selected values
  // ───────────────────────────────────────────────────────────

  const [militaryNumber, setMilitaryNumber] = useState("");
  const [rankId, setRankId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [serviceStatusId, setServiceStatusId] = useState<string | null>(
    null
  );
  const [attachmentUnitId, setAttachmentUnitId] = useState<string | null>(
    null
  );
  const [dischargeDateIso, setDischargeDateIso] = useState<string | null>(
    null
  );

  // ───────────────────────────────────────────────────────────
  // States
  // ───────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [unitError, setUnitError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [militaryNumberError, setMilitaryNumberError] = useState("");
  const [error, setError] = useState("");

  // هل الموقف الخدمي الحالي المختار = "ملحق"؟
  const selectedServiceStatusName =
    serviceStatusOptions.find((o) => o.id === serviceStatusId)?.name ??
    "";

  const isAttachmentEnabled =
    selectedServiceStatusName === ATTACHMENT_STATUS_NAME;

  // هل فئة الفرد الحالية المختارة = "متطوع" / "مجند"؟
  const selectedCategoryName =
    categoryOptions.find((o) => o.id === categoryId)?.name ?? "";

  const isVolunteerCategory = selectedCategoryName === VOLUNTEER_CATEGORY_NAME;
  const isConscriptCategory = selectedCategoryName === CONSCRIPT_CATEGORY_NAME;

  // ───────────────────────────────────────────────────────────
  // Load Dropdown Data
  // ───────────────────────────────────────────────────────────

  async function loadDropdownData() {
    try {
      const [
        ranksResult,
        categoriesResult,
        unitsResult,
        serviceStatusesResult,
      ] = await Promise.all([
        supabase
          .from("ranks")
          .select("id,name")
          .order("name", { ascending: true }),

        supabase
          .from("personnel_categories")
          .select("id,name")
          .order("name", { ascending: true }),

        supabase
          .from("units")
          .select("id,name,code,unit_type,is_active")
          .eq("is_active", true)
          .order("name", { ascending: true }),

        supabase
          .from("service_statuses")
          .select("id,name")
          .order("name", { ascending: true }),
      ]);

      if (ranksResult.error) {
        throw ranksResult.error;
      }

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      if (unitsResult.error) {
        throw unitsResult.error;
      }

      if (serviceStatusesResult.error) {
        throw serviceStatusesResult.error;
      }

      setRankOptions(
        (ranksResult.data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
        }))
      );

      setCategoryOptions(
        (categoriesResult.data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
        }))
      );

      const allUnits = (unitsResult.data ?? []).map((unit) => ({
        id: unit.id,
        name: unit.name,
        unit_type: unit.unit_type,
      }));

      // الوحدات الأساسية فقط (لحقل "الوحدة الأساسية")
      setUnitOptions(
        allUnits
          .filter(
            (unit) => unit.unit_type?.trim().toUpperCase() === "MAIN"
          )
          .map((unit) => ({ id: unit.id, name: unit.name }))
      );

      // كل الوحدات (لحقل "جهة الإلحاق")
      setAttachmentUnitOptions(
        allUnits.map((unit) => ({ id: unit.id, name: unit.name }))
      );

      setServiceStatusOptions(
        (serviceStatusesResult.data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
        }))
      );
    } catch (err: any) {
      console.error("Error loading dropdown data:", err);

      setError(
        `حدث خطأ أثناء تحميل بيانات القوائم${
          err?.message ? `\n${err.message}` : ""
        }`
      );
    }
  }

  // ───────────────────────────────────────────────────────────
  // Load Soldier
  // ───────────────────────────────────────────────────────────

  async function loadSoldier() {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: loadError } = await supabase
        .from("personnel")
        .select(`
          id,
          military_number,
          full_name,
          personnel_category_id,
          primary_unit_id,
          attachment_unit_id,
          service_status_id,
          rank_id,
          discharge_date,

          personnel_categories (
            id,
            name
          ),

          ranks (
            id,
            name
          ),

          primary_unit:units!primary_unit_id (
            id,
            name,
            code
          ),

          attachment_unit:units!attachment_unit_id (
            id,
            name,
            code
          ),

          service_statuses (
            id,
            name
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (loadError) {
        console.error("Error loading soldier:", loadError);

        setError("حدث خطأ أثناء تحميل بيانات الفرد");
        setSoldier(null);

        return;
      }

      if (!data) {
        setSoldier(null);
        return;
      }

      const raw = data as any;

      const mappedSoldier: Soldier = {
        id: raw.id,

        militaryId: raw.military_number ?? "",

        name: raw.full_name ?? "",

        rank: raw.ranks?.name ?? "",

        category: raw.personnel_categories?.name ?? "",

        unit: raw.primary_unit?.name ?? "",

        serviceStatus: raw.service_statuses?.name ?? "",

        dischargeDate: raw.discharge_date
          ? isoToDisplayDate(raw.discharge_date)
          : "",

        attachmentPlace: raw.attachment_unit?.name ?? "",

        rankId: raw.rank_id ?? null,

        categoryId: raw.personnel_category_id ?? null,

        unitId: raw.primary_unit_id ?? null,

        serviceStatusId: raw.service_status_id ?? null,

        attachmentUnitId: raw.attachment_unit_id ?? null,

        dischargeDateRaw: raw.discharge_date ?? null,
      };

      setSoldier(mappedSoldier);

      // تحديد القيم الحالية بالـ IDs
      setMilitaryNumber(mappedSoldier.militaryId);
      setRankId(mappedSoldier.rankId);
      setCategoryId(mappedSoldier.categoryId);
      setUnitId(mappedSoldier.unitId);
      setServiceStatusId(mappedSoldier.serviceStatusId);
      setAttachmentUnitId(mappedSoldier.attachmentUnitId);
      setDischargeDateIso(mappedSoldier.dischargeDateRaw);
    } catch (err) {
      console.error("Unexpected error:", err);

      setError("حدث خطأ غير متوقع أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  // ───────────────────────────────────────────────────────────
  // Initial Load
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadPage() {
      setLoading(true);

      await Promise.all([loadDropdownData(), loadSoldier()]);

      setLoading(false);
    }

    loadPage();
  }, [id]);

  // ───────────────────────────────────────────────────────────
  // تغيير الموقف الخدمي
  // لو الموقف الجديد مش "ملحق" نصفّر جهة الإلحاق تلقائيًا
  // ───────────────────────────────────────────────────────────

  function handleServiceStatusChange(option: Option) {
    setServiceStatusId(option.id);
    setError("");

    if (option.name !== ATTACHMENT_STATUS_NAME) {
      setAttachmentUnitId(null);
      setAttachmentError("");
    }
  }

  // ───────────────────────────────────────────────────────────
  // تغيير فئة الفرد
  // لو الفئة الجديدة "متطوع" مفيش تاريخ تسريح، فبنصفّره تلقائيًا
  // ───────────────────────────────────────────────────────────

  function handleCategoryChange(option: Option) {
    setCategoryId(option.id);
    setError("");

    if (option.name === VOLUNTEER_CATEGORY_NAME) {
      setDischargeDateIso(null);
    }
  }

  // ───────────────────────────────────────────────────────────
  // Save
  // ───────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!soldier) return;

    const trimmedMilitaryNumber = militaryNumber.trim();

    // Validation
    if (!/^\d{13}$/.test(trimmedMilitaryNumber)) {
      setMilitaryNumberError(
        `الرقم العسكري يجب أن يتكون من ${MILITARY_NUMBER_LENGTH} رقمًا بالضبط`
      );
      return;
    }

    if (!unitId) {
      setUnitError("الوحدة الأساسية مطلوبة");
      return;
    }

    if (!rankId) {
      setError("الدرجة مطلوبة");
      return;
    }

    if (!categoryId) {
      setError("فئة الفرد مطلوبة");
      return;
    }

    if (!serviceStatusId) {
      setError("الموقف الخدمي مطلوب");
      return;
    }

    if (isAttachmentEnabled && !attachmentUnitId) {
      setAttachmentError("جهة الإلحاق مطلوبة عند اختيار الموقف ملحق");
      return;
    }

    if (isConscriptCategory && !dischargeDateIso) {
      setError('تاريخ التسريح مطلوب لفئة "مجند"');
      return;
    }

    setUnitError("");
    setAttachmentError("");
    setMilitaryNumberError("");
    setError("");
    setSaving(true);

    try {
      // التحقق من عدم تكرار الرقم العسكري مع فرد آخر في قاعدة البيانات
      const { data: duplicateData, error: duplicateError } = await supabase
        .from("personnel")
        .select("id")
        .eq("military_number", trimmedMilitaryNumber)
        .neq("id", soldier.id)
        .maybeSingle();

      if (duplicateError) {
        console.error(
          "Error checking military number uniqueness:",
          duplicateError
        );

        setError("حدث خطأ أثناء التحقق من الرقم العسكري");
        return;
      }

      if (duplicateData) {
        setMilitaryNumberError("هذا الرقم العسكري مستخدم بالفعل لفرد آخر");
        return;
      }

      // ✅ FIX: لو الموقف الخدمي المختار هو "منتهي خدمته" (نفس الـ ID
      // المستخدم في ReserveBatchesPage)، بنحدد is_active = false تلقائيًا.
      // ده هو سبب المشكلة الأصلية: الصفحة دي كانت بتعدّل service_status_id
      // بس من غير ما تلمس is_active، فيحصل تعارض بين الحقلين في باقي الصفحات.
      const isDischargedStatus = serviceStatusId === DISCHARGED_STATUS_ID;

      // تحديث نفس الفرد باستخدام IDs مباشرة
      const { error: updateError } = await supabase
        .from("personnel")
        .update({
          military_number: trimmedMilitaryNumber,
          rank_id: rankId,
          personnel_category_id: categoryId,
          primary_unit_id: unitId,
          service_status_id: serviceStatusId,
          attachment_unit_id: isAttachmentEnabled
            ? attachmentUnitId
            : null,
          discharge_date: isVolunteerCategory ? null : dischargeDateIso,
          // ✅ FIX: تحديث is_active بما يتوافق مع الموقف الخدمي المختار
          // عشان تفضل كل الصفحات (Dashboard / تفاصيل الفرد / دفعات الرديف)
          // متوافقة مع بعضها دايمًا
          is_active: !isDischargedStatus,
        })
        .eq("id", soldier.id);

      if (updateError) {
        console.error("Update personnel error:", updateError);

        setError(
          "حدث خطأ أثناء حفظ تعديلات الفرد: " + updateError.message
        );

        return;
      }

      // الرجوع لشاشة بيانات الفرد بعد نجاح الحفظ
      navigate(`/dashboard/individual-query/soldier/${soldier.id}`);
    } catch (err) {
      console.error("Unexpected save error:", err);

      setError("حدث خطأ غير متوقع أثناء حفظ التعديلات");
    } finally {
      setSaving(false);
    }
  }

  // ───────────────────────────────────────────────────────────
  // Loading
  // ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <p
          style={{
            ...FONT,
            fontSize: 18,
            color: "#717d96",
          }}
        >
          جاري تحميل بيانات الفرد...
        </p>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────
  // Not Found
  // ───────────────────────────────────────────────────────────

  if (!soldier) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 gap-4"
        dir="rtl"
      >
        <p
          style={{
            ...FONT,
            fontSize: 18,
            color: "#717d96",
            whiteSpace: "pre-line",
          }}
        >
          {error || "لم يتم العثور على الفرد"}
        </p>

        <button
          type="button"
          onClick={() => navigate("/dashboard/individual-query")}
          className="px-4 py-2 rounded-lg text-white"
          style={{
            ...FONT,
            backgroundColor: "#2d3648",
          }}
        >
          العودة للبحث
        </button>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 w-full" dir="rtl">
      {/* Title */}

      <h1
        className="text-center w-full"
        style={{
          ...FONT,
          fontWeight: 700,
          fontSize: "clamp(20px, 4vw, 28px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        البيانات الشخصية لفرد
      </h1>

      {/* Form */}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
          {/* Header */}

          <div className="flex items-center justify-start gap-3 px-6 py-4 border-b border-[#cbd2e0]">
            <span
              style={{
                ...FONT,
                fontSize: 18,
                color: "#4a5468",
              }}
            >
              البيانات التعريفية
            </span>
          </div>

          {/* Fields */}

          <div className="flex flex-col gap-4 px-6 py-5">
            {/* Row 1 */}

            <FieldPair
              left={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    الدرجة
                  </p>

                  <EditDropdown
                    options={rankOptions}
                    value={rankId}
                    onChange={(option) => {
                      setRankId(option.id);
                      setError("");
                    }}
                    placeholder="اختر الدرجة"
                  />
                </div>
              }
              right={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    الرقم العسكري
                  </p>

                  <MilitaryNumberInput
                    value={militaryNumber}
                    onChange={(v) => {
                      setMilitaryNumber(v);
                      setMilitaryNumberError("");
                    }}
                    error={militaryNumberError}
                  />
                </div>
              }
            />

            {/* Row 2 */}

            <FieldPair
              left={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    فئة الفرد
                  </p>

                  <EditDropdown
                    options={categoryOptions}
                    value={categoryId}
                    onChange={handleCategoryChange}
                    placeholder="اختر فئة الفرد"
                  />
                </div>
              }
              right={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    الاسم
                  </p>

                  <ReadonlyInput value={soldier.name} />
                </div>
              }
            />

            {/* Row 3 */}

            <FieldPair
              left={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    الوحدة الأساسية
                  </p>

                  <EditDropdown
                    options={unitOptions}
                    value={unitId}
                    onChange={(option) => {
                      setUnitId(option.id);
                      setUnitError("");
                    }}
                    placeholder="اختر الوحدة الأساسية"
                  />

                  {unitError && (
                    <p
                      className="text-right mt-1"
                      style={{
                        ...FONT,
                        fontSize: 12,
                        color: "#ef4444",
                      }}
                    >
                      {unitError}
                    </p>
                  )}
                </div>
              }
              right={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    الموقف الخدمي
                  </p>

                  <EditDropdown
                    options={serviceStatusOptions}
                    value={serviceStatusId}
                    onChange={handleServiceStatusChange}
                    placeholder="اختر الموقف الخدمي"
                  />
                </div>
              }
            />

            {/* Row 4 */}

            <FieldPair
              left={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    جهة الإلحاق
                  </p>

                  <EditDropdown
                    options={attachmentUnitOptions}
                    value={attachmentUnitId}
                    onChange={(option) => {
                      setAttachmentUnitId(option.id);
                      setAttachmentError("");
                    }}
                    disabled={!isAttachmentEnabled}
                    placeholder={
                      isAttachmentEnabled
                        ? "اختر جهة الإلحاق"
                        : "غير مفعّل - الموقف الخدمي ليس ملحق"
                    }
                  />

                  {attachmentError && (
                    <p
                      className="text-right mt-1"
                      style={{
                        ...FONT,
                        fontSize: 12,
                        color: "#ef4444",
                      }}
                    >
                      {attachmentError}
                    </p>
                  )}
                </div>
              }
              right={
                <div>
                  <p
                    style={{
                      ...FONT,
                      fontSize: 13,
                      color: "#717d96",
                      marginBottom: 6,
                    }}
                  >
                    تاريخ التسريح
                  </p>

                  <DatePickerDDMMYYYY
                    value={isVolunteerCategory ? null : dischargeDateIso}
                    onChange={setDischargeDateIso}
                    disabled={isVolunteerCategory}
                  />

                  {isVolunteerCategory && (
                    <p
                      className="text-right mt-1"
                      style={{
                        ...FONT,
                        fontSize: 12,
                        color: "#717d96",
                      }}
                    >
                      غير مطلوب لفئة "متطوع" — سيتم حفظه بقيمة فارغة
                    </p>
                  )}
                </div>
              }
            />

            {/* Error */}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p
                  className="text-right"
                  style={{
                    ...FONT,
                    fontSize: 13,
                    color: "#dc2626",
                    whiteSpace: "pre-line",
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Save */}

            <div className="flex items-start pt-1">
              <button
                type="submit"
                disabled={saving}
                className={[
                  "flex items-center justify-center px-5 h-10 rounded-[8px]",
                  "transition-opacity",
                  saving
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:opacity-90 active:opacity-80",
                ].join(" ")}
                style={{
                  background:
                    "linear-gradient(to bottom, #00b867, #00522e)",
                }}
              >
                <span
                  style={{
                    ...FONT,
                    fontSize: 14,
                    color: "#f5f5f5",
                  }}
                >
                  {saving ? "جاري الحفظ..." : "اعتماد التعديل"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}