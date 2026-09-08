import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { CSSProperties } from "react";
import { ArrowLeftRight, LogIn, UserPlus } from "lucide-react";
import { supabase } from "../../lib/supabase";

const F: CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

type LetterType = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
};

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
  iconColor,
}: {
  title: string;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <button
    
      type="button"
      onClick={onClick}
      className="aspect-square flex flex-col items-center justify-center gap-4 px-3 rounded-[20px] transition-all bg-white"
      style={{
  width: "100%",
  height: "200px",  // 👈 رقم ثابت للارتفاع بس
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
          .select("id, name, code, is_active")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (!mounted) return;

        if (error) {
          console.error("LETTER TYPES ERROR:", error);
          setError(`تعذر تحميل أنواع الخطابات: ${error.message}`);
          setLetterTypes([]);
          return;
        }

        setLetterTypes(data ?? []);
      } catch (err) {
        console.error("Unexpected error:", err);
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
    } else {
      letterType = "attachment";
    }

    navigate("/dashboard/issue-letter/soldiers", {
      state: {
        letterType,
        letterTypeId: selected.id,
        letterTypeCode: selected.code,
        letterTypeName: selected.name,
      },
    });
  }

  const attachmentType =
    letterTypes.find((x) => x.code === "ATTACH") ??
    letterTypes.find((x) => x.name === "الحاق");

  const endAttachmentType =
    letterTypes.find((x) => x.code === "DEATTACH") ??
    letterTypes.find((x) => x.name === "إنهاء الحاق");

  const joinSaeqaType = letterTypes.find((x) => x.code === "JOIN_SAEQA");
  const joinExternalType = letterTypes.find((x) => x.code === "JOIN_EXTERNAL");

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

      <div className="flex flex-col items-center gap-8 w-full max-w-[600px]">
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
        <div className="grid grid-cols-2 gap-5 w-full">
  {attachmentType && (
    <LetterCard
      title={attachmentType.name}
      selected={selected?.id === attachmentType.id}
      onClick={() => setSelected(attachmentType)}
      iconBg="#e5f8ee"
      iconColor="#00854a"
      icon={
        <ArrowLeftRight
          size={28}
          color={
            selected?.id === attachmentType.id
              ? "#00854a"
              : "#00854a"
          }
        />
      }
    />
  )}

  {endAttachmentType && (
    <LetterCard
      title={endAttachmentType.name}
      selected={selected?.id === endAttachmentType.id}
      onClick={() => setSelected(endAttachmentType)}
      iconBg="#fdeaea"
      iconColor="#b3261e"
      icon={
        <ArrowLeftRight
          size={28}
          style={{ transform: "scaleX(-1)" }}
          color={
            selected?.id === endAttachmentType.id
              ? "#00854a"
              : "#b3261e"
          }
        />
      }
    />
  )}

  {joinSaeqaType && (
    <LetterCard
      title={joinSaeqaType.name}
      selected={selected?.id === joinSaeqaType.id}
      onClick={() => setSelected(joinSaeqaType)}
      iconBg="#fef3e8"
      iconColor="#c2670c"
      icon={
        <UserPlus
          size={28}
          color={
            selected?.id === joinSaeqaType.id
              ? "#00854a"
              : "#c2670c"
          }
        />
      }
    />
  )}

  {joinExternalType && (
    <LetterCard
      title={joinExternalType.name}
      selected={selected?.id === joinExternalType.id}
      onClick={() => setSelected(joinExternalType)}
      iconBg="#eef2ff"
      iconColor="#4338ca"
      icon={
        <LogIn
          size={28}
          color={
            selected?.id === joinExternalType.id
              ? "#00854a"
              : "#4338ca"
          }
        />
      }
    />
  )}
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