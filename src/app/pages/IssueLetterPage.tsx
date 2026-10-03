import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import type { CSSProperties, ComponentType } from "react";
import {
  ArrowLeftRight,
  UserPlus,
  LogIn,
  FileText,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  getLetterDraft,
  resetLetterDraft,
  startLetterDraft,
  countLetterDrafts,
} from "../../lib/letterDraft";
import { usePermissions } from "../../lib/usePermissions";

const F: CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

type LetterType = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  numbering_digit: number | null;
};

/* =========================================================
   خريطة الأشكال (أيقونة + لون) لكل كود خطاب معروف حاليًا.

   ✅ أي نوع خطاب جديد يُضاف من التاب الإداري ومش موجود هنا
   ياخد تلقائيًا الشكل الافتراضي العام في الأسفل — من غير أي
   تعديل كود مطلوب.
========================================================= */

type LetterTypeVisual = {
  icon: ComponentType<{ size?: number; color?: string; style?: CSSProperties }>;
  iconBg: string;
  iconColor: string;
  flipIcon?: boolean;
};

const LETTER_TYPE_VISUALS: Record<string, LetterTypeVisual> = {
  ATTACH: {
    icon: ArrowLeftRight,
    iconBg: "#e5f8ee",
    iconColor: "#00854a",
  },
  DEATTACH: {
    icon: ArrowLeftRight,
    iconBg: "#fdeaea",
    iconColor: "#b3261e",
    flipIcon: true,
  },
  JOIN_SAEQA: {
    icon: UserPlus,
    iconBg: "#fef3e8",
    iconColor: "#c2670c",
  },
  JOIN_EXTERNAL: {
    icon: LogIn,
    iconBg: "#eef2ff",
    iconColor: "#4338ca",
  },
};

// الشكل الافتراضي لأي نوع خطاب جديد مش موجود في الخريطة فوق
const DEFAULT_LETTER_TYPE_VISUAL: LetterTypeVisual = {
  icon: FileText,
  iconBg: "#f1f3f9",
  iconColor: "#4a5468",
};

function getLetterTypeVisual(code: string): LetterTypeVisual {
  return LETTER_TYPE_VISUALS[code] ?? DEFAULT_LETTER_TYPE_VISUAL;
}

function Step({
  number,
  label,
  active = false,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 shrink-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2"
        style={{
          borderColor: active ? "#00B867" : "#a1aebe",
        }}
      >
        <span
          style={{
            ...F,
            fontSize: 14,
            color: active ? "#00854a" : "#2d3648",
          }}
        >
          {number}
        </span>
      </div>

      <span
        className="text-center whitespace-nowrap"
        style={{
          ...F,
          fontSize: 14,
          color: active ? "#00854a" : "#465668",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function StepConnector() {
  return (
    <div className="flex items-center gap-[3px] mb-[26px] shrink-0">
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#a1aebe]" />
      ))}
    </div>
  );
}

/* =========================================================
   Letter Card
========================================================= */

function LetterCard({
  title,
  selected,
  onClick,
  icon,
  iconBg,
}: {
  title: string;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="aspect-square flex flex-col items-center justify-center gap-4 px-3 rounded-[20px] transition-all bg-white"
      style={{
        width: "100%",
        height: "200px",
        boxShadow: selected
          ? "0 0 0 2.5px #00B867, 0 6px 16px rgba(0,184,103,.20)"
          : "0 1px 3px rgba(0,0,0,.10)",
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: selected ? "#e5f8ee" : iconBg,
        }}
      >
        {icon}
      </div>

      <span
        className="text-center leading-[1.35] line-clamp-2"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: 14,
          color: selected ? "#00854a" : "#4a5468",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {title}
      </span>
    </button>
  );
}

export function IssueLetterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const keepDraft = Boolean(
    (location.state as { keepDraft?: boolean } | null)?.keepDraft
  );
  // ✅ شريط المسودات: بيظهر بس لمن عنده صلاحية إصدار الخطابات
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const canUseDrafts = hasPermission("issue_letter:create");
  const [draftsCount, setDraftsCount] = useState(0);

  useEffect(() => {
    if (permissionsLoading || !canUseDrafts) return;

    let mounted = true;

    void countLetterDrafts().then((count) => {
      if (mounted) setDraftsCount(count);
    });

    return () => {
      mounted = false;
    };
  }, [permissionsLoading, canUseDrafts]);
  // ✅ دخول جديد للخطوة 1 (مش راجع من الـ Stepper) = بداية خطاب جديد
  useEffect(() => {
    if (!keepDraft) resetLetterDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [letterTypes, setLetterTypes] = useState<LetterType[]>([]);
  const [selected, setSelected] = useState<LetterType | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadLetterTypes() {
      try {
        setLoading(true);
        setError("");

        const { data, error } = await supabase
          .from("letter_types")
          .select("id, name, code, is_active, numbering_digit")
          .eq("is_active", true)
          .order("numbering_digit", { ascending: true });

        if (!mounted) return;

        if (error) {

          setError(`تعذر تحميل أنواع الخطابات: ${error.message}`);
          setLetterTypes([]);
          return;
        }

        setLetterTypes(data ?? []);

        // ✅ لو راجع من الـ Stepper، نرجّع النوع اللي كان مختاره
        const draftTypeId = getLetterDraft().letterTypeId;
        if (draftTypeId) {
          const previous = (data ?? []).find((t) => t.id === draftTypeId);
          if (previous) setSelected(previous);
        }
      } catch (err) {

        if (!mounted) return;
        setError("حدث خطأ أثناء الاتصال بقاعدة البيانات");
        setLetterTypes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadLetterTypes();

    return () => {
      mounted = false;
    };
  }, []);

  function handleNext() {
    if (!selected) return;

    let letterType: string;

    if (selected.code === "DEATTACH") {
      letterType = "end-attachment";
    } else if (selected.code === "JOIN_SAEQA") {
      letterType = "join-saeqa";
    } else if (selected.code === "JOIN_EXTERNAL") {
      letterType = "join-external";
    } else if (selected.code === "ATTACH") {
      letterType = "attachment";
    } else {
      // ✅ أي نوع خطاب جديد مش من الأنواع الأربعة الحالية:
      // نبعت كود النوع نفسه بدل ما نجبره على واحد من الأربعة القدامى
      letterType = selected.code;
    }

    // ✅ لو النوع اتغيّر عن اللي كان مختار، الأفراد والبيانات بتتصفّر
    startLetterDraft({
      id: selected.id,
      code: selected.code,
      name: selected.name,
    });

    navigate("/dashboard/issue-letter/soldiers", {
      state: {
        letterType,
        letterTypeId: selected.id,
        letterTypeCode: selected.code,
        letterTypeName: selected.name,
      },
    });
  }

  return (
    <div className="flex flex-col items-center gap-10 w-full pb-10" dir="rtl">
      <h1
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize: "clamp(22px,4vw,32px)",
          color: "#2d3648",
        }}
      >
        اصدار خطابات
      </h1>

      <div className="flex items-center justify-center gap-0 flex-wrap">
        <Step number="01" label="تحديد نوع الخطاب" active />
        <StepConnector />
        <Step number="02" label="تحديد الأفراد" />
        <StepConnector />
        <Step number="03" label="بيانات الخطاب" />
        <StepConnector />
        <Step number="04" label="المراجعة والتصديق" />
      </div>

      {/* ملحوظة: تم توسيع الحاوية لتستوعب 4 كروت في كل صف بدل 2 */}
      <div className="flex flex-col items-center gap-8 w-full max-w-[1040px]">
        {canUseDrafts && draftsCount > 0 && (
          <div
            className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-[12px]"
            style={{ background: "#fff8e8", border: "1px solid #f4d58d" }}
          >
            <span style={{ ...F, fontSize: 14, color: "#8a6500", lineHeight: 1.6 }}>
              {draftsCount === 1
                ? "لديك مسودة واحدة غير مكتملة"
                : draftsCount === 2
                ? "لديك مسودتان غير مكتملتين"
                : `لديك ${draftsCount.toLocaleString("ar-EG")} مسودات غير مكتملة`}
            </span>

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard/letters-archive", {
                  state: { tab: "drafts" },
                })
              }
              className="px-4 py-2 rounded-[8px] transition-opacity hover:opacity-80"
              style={{ border: "1.5px solid #c9a227" }}
            >
              <span style={{ ...F, fontSize: 14, color: "#8a6500", fontWeight: 700 }}>
                عرض المسودات
              </span>
            </button>
          </div>
        )}

        <p
          className="text-center"
          style={{
            ...F,
            fontWeight: 700,
            fontSize: "clamp(18px,3vw,24px)",
            color: "#404040",
          }}
        >
          يرجى تحديد نوع الخطاب المطلوب إصداره
        </p>

        {loading && (
          <div
            className="w-full bg-white rounded-[20px] border border-[#eff0f6] flex items-center justify-center"
            style={{ ...F, color: "#4a5468", padding: 40 }}
          >
            جاري تحميل أنواع الخطابات...
          </div>
        )}

        {!loading && error && (
          <div
            className="w-full rounded-[8px] px-4 py-3"
            style={{
              ...F,
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              textAlign: "right",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {letterTypes.length === 0 ? (
              <div
                className="w-full bg-white rounded-[20px] border border-[#eff0f6] text-center"
                style={{ ...F, padding: 40, color: "#717d96" }}
              >
                لا توجد أنواع خطابات متاحة
              </div>
            ) : (
              // ✅ 4 كروت في كل صف، وأي كروت زيادة تنزل تلقائي للصف اللي بعده
              // بنفس تصميم الكارد الحالي بدون أي تغيير في شكله
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 w-full">
                {letterTypes.map((type) => {
                  const visual = getLetterTypeVisual(type.code);
                  const Icon = visual.icon;
                  const isSelected = selected?.id === type.id;

                  return (
                    <LetterCard
                      key={type.id}
                      title={type.name}
                      selected={isSelected}
                      onClick={() => setSelected(type)}
                      iconBg={visual.iconBg}
                      icon={
                        <Icon
                          size={28}
                          color={isSelected ? "#00854a" : visual.iconColor}
                          style={
                            visual.flipIcon
                              ? { transform: "scaleX(-1)" }
                              : undefined
                          }
                        />
                      }
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        <button
          type="button"
          disabled={!selected || loading}
          onClick={handleNext}
          className="w-full min-h-[52px] rounded-[8px] flex items-center justify-center transition-opacity"
          style={{
            background: selected
              ? "linear-gradient(to bottom,#00b867,#00522e)"
              : "#edf0f7",
            cursor: selected && !loading ? "pointer" : "not-allowed",
            opacity: loading ? 0.7 : 1,
          }}
        >
          <span
            style={{
              ...F,
              fontSize: 16,
              color: selected ? "#fff" : "#cbd2e0",
            }}
          >
            الانتقال إلى تحديد الأفراد
          </span>
        </button>
      </div>
    </div>
  );
}