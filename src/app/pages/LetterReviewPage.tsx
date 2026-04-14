import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { Download, Printer } from "lucide-react";
import imgEagle from "figma:asset/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";
import type { SoldierWithAttachment, LetterData } from "./LetterDataPage";

const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

// ─── SVG paths from Figma (success badge) ─────────────────────────────────────
const BADGE_PATH =
  "M90 45C90 48.84 85.2825 52.005 84.3375 55.545C83.3625 59.205 85.83 64.305 83.9775 67.5075C82.095 70.7625 76.4325 71.1525 73.7925 73.7925C71.1525 76.4325 70.7625 82.095 67.5075 83.9775C64.305 85.83 59.205 83.3625 55.545 84.3375C52.005 85.2825 48.84 90 45 90C41.16 90 37.995 85.2825 34.455 84.3375C30.795 83.3625 25.695 85.83 22.4925 83.9775C19.2375 82.095 18.8475 76.4325 16.2075 73.7925C13.5675 71.1525 7.905 70.7625 6.0225 67.5075C4.17 64.305 6.6375 59.205 5.6625 55.545C4.7175 52.005 0 48.84 0 45C0 41.16 4.7175 37.995 5.6625 34.455C6.6375 30.795 4.17 25.695 6.0225 22.4925C7.905 19.2375 13.5675 18.8475 16.2075 16.2075C18.8475 13.5675 19.2375 7.905 22.4925 6.0225C25.695 4.17 30.795 6.6375 34.455 5.6625C37.995 4.7175 41.16 0 45 0C48.84 0 52.005 4.7175 55.545 5.6625C59.205 6.6375 64.305 4.17 67.5075 6.0225C70.7625 7.905 71.1525 13.5675 73.7925 16.2075C76.4325 18.8475 82.095 19.2375 83.9775 22.4925C85.83 25.695 83.3625 30.795 84.3375 34.455C85.2825 37.995 90 41.16 90 45Z";
const CHECK_PATH =
  "M58.005 31.59L40.875 48.72L31.995 39.8475C31.0689 38.9219 29.8131 38.4019 28.5037 38.4019C27.1944 38.4019 25.9386 38.9219 25.0125 39.8475C24.0869 40.7736 23.5669 42.0294 23.5669 43.3388C23.5669 44.6481 24.0869 45.9039 25.0125 46.83L37.47 59.2875C38.3714 60.1879 39.5934 60.6937 40.8675 60.6937C42.1416 60.6937 43.3636 60.1879 44.265 59.2875L64.98 38.5725C65.9056 37.6464 66.4256 36.3906 66.4256 35.0813C66.4256 33.7719 65.9056 32.5161 64.98 31.59C64.5222 31.1317 63.9785 30.7682 63.3801 30.5202C62.7817 30.2721 62.1403 30.1445 61.4925 30.1445C60.8447 30.1445 60.2033 30.2721 59.6049 30.5202C59.0065 30.7682 58.4628 31.1317 58.005 31.59Z";

// ─── Loading Modal ─────────────────────────────────────────────────────────────
function LoadingModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div
        className="bg-white rounded-[24px] flex flex-col items-center justify-center gap-0 overflow-hidden"
        style={{ width: "clamp(320px,50vw,560px)", padding: "77px 40px" }}
        dir="rtl"
      >
        {/* Animated three dots */}
        <div className="flex items-center gap-6 mb-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full"
              style={{
                background: "linear-gradient(to bottom, #00B867, #00522E)",
                animation: `ldBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-4 pt-8 text-center">
          <p style={{ ...F, fontWeight: 700, fontSize: "clamp(24px,4vw,36px)", color: "#122b16", lineHeight: 1.2 }}>
            يرجي الانتظار
          </p>
          <p style={{ ...F, fontWeight: 700, fontSize: "clamp(16px,2.5vw,24px)", color: "#404040", lineHeight: 1.5 }}>
            يتم حفظ وطباعة الجواب الان
          </p>
        </div>
      </div>
      <style>{`
        @keyframes ldBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 1; }
          40% { transform: translateY(-14px); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

// ─── Success Modal ─────────────────────────────────────────────────────────────
function SuccessModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div
        className="bg-white rounded-[24px] flex flex-col items-center justify-center gap-0 overflow-hidden"
        style={{ width: "clamp(320px,50vw,560px)", padding: "77px 40px" }}
        dir="rtl"
      >
        {/* Green badge icon */}
        <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
          <svg className="absolute inset-0 w-full h-full" fill="none" viewBox="0 0 90 90">
            <defs>
              <linearGradient id="badgeGrad" gradientUnits="userSpaceOnUse" x1="45" x2="45" y1="0" y2="90">
                <stop stopColor="#00B867" />
                <stop offset="1" stopColor="#00522E" />
              </linearGradient>
            </defs>
            <path d={BADGE_PATH} fill="url(#badgeGrad)" />
            <path d={CHECK_PATH} fill="#FFFCEE" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-4 pt-8 text-center">
          <p style={{ ...F, fontWeight: 700, fontSize: "clamp(24px,4vw,36px)", color: "#122b16", lineHeight: 1.2 }}>
            عملية ناجحة!
          </p>
          <p style={{ ...F, fontWeight: 700, fontSize: "clamp(14px,2vw,24px)", color: "#404040", lineHeight: 1.5, maxWidth: 360 }}>
            تمت طباعة الجواب بنجاح, جاري توجهيك للصفحة الرئيسية
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function GreenCheckBubble({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="lr-sg1" x1="16" x2="16" y1="0" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00B867" /><stop offset="1" stopColor="#00522E" />
            </linearGradient>
            <linearGradient id="lr-sg2" x1="16" x2="16" y1="0" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4BFF62" /><stop offset="1" stopColor="#318B3C" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill="url(#lr-sg1)" stroke="url(#lr-sg2)" strokeWidth="2" />
        </svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="absolute">
          <path
            d="M9 11.5L11.5 14L15.5 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>
      <span style={{ ...F, fontSize: 14, background: "linear-gradient(to bottom,#00b867,#00522e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", whiteSpace: "nowrap" }}>
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

// ─── Sort Icon ────────────────────────────────────────────────────────────────
function SortIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M8 13l-3-3M8 13l3-3" stroke="#A0ABC0" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Letter Preview (paper document mock) ────────────────────────────────────
function LetterPreview({
  soldiers, destination, attachmentPlace, reason, letterType,
}: {
  soldiers: SoldierWithAttachment[];
  destination: string;
  attachmentPlace: string;
  reason: string;
  letterType: string;
}) {
  const today = "13 - 04 - 2026";
  const letterBodyType = letterType === "end-attachment" ? "إنهاء إلحاق" : "إلحاق";

  return (
    <div
      className="bg-white border border-[#ddd] rounded-[4px] p-8 w-full max-w-[680px] mx-auto shadow-sm"
      dir="rtl"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 pb-4 border-b border-[#e0e0e0] mb-4">
        {/* Eagle emblem */}
        <div className="shrink-0 w-14 h-14">
          <img src={imgEagle} alt="شعار الجمهورية" className="w-full h-full object-contain" />
        </div>
        {/* Command info */}
        <div className="flex flex-col gap-0.5 flex-1 text-right">
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>قيادة قوات الصاعقة</p>
          <p style={{ fontSize: 12, color: "#333" }}>فرع التنظيم والإدارة</p>
          <p style={{ fontSize: 12, color: "#333" }}>التاريخ : {today}</p>
        </div>
      </div>

      {/* Recipient */}
      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
        إلى / {destination || "..."}
      </p>

      {/* Body */}
      <p style={{ fontSize: 12, color: "#333", lineHeight: 1.8, marginBottom: 8 }}>
        قدم لكم اليوم {today} الأفراد المذكور أسماؤهم وبياناتهم من التكليف الأميرية ذلك لهم
        للعمل ({reason || "أوامر قيادة"}) بالأماكن الموضحة قرين كل منهم وذلك بناءً على أوامر الأركان وبياناتهم كالتالي:
      </p>

      {/* Soldiers table */}
      <table className="w-full border-collapse mb-4" style={{ fontSize: 11 }}>
        <thead>
          <tr style={{ background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
            {["ملاحظات", "وحدة الالحاق", "الوحدة", "الاسم", "الدرجة", "م"].map((h) => (
              <th key={h} style={{ padding: "4px 8px", textAlign: "right", borderRight: "1px solid #ddd", color: "#444" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {soldiers.map((soldier, idx) => (
            <tr key={soldier.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "4px 8px", borderRight: "1px solid #eee" }}></td>
              <td style={{ padding: "4px 8px", borderRight: "1px solid #eee" }}>{soldier.attachmentUnit || attachmentPlace}</td>
              <td style={{ padding: "4px 8px", borderRight: "1px solid #eee" }}>{soldier.unit}</td>
              <td style={{ padding: "4px 8px", borderRight: "1px solid #eee" }}>{soldier.name}</td>
              <td style={{ padding: "4px 8px", borderRight: "1px solid #eee" }}>{soldier.rank}</td>
              <td style={{ padding: "4px 8px", borderRight: "1px solid #eee", textAlign: "center" }}>{idx + 1}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: 12, color: "#333", marginBottom: 16 }}>مع وافر التحية ،،،</p>

      {/* Signature */}
      <div className="flex flex-col items-start gap-1 mt-4">
        <p style={{ fontSize: 12, color: "#333" }}>التوقيع (           )</p>
        <p style={{ fontSize: 12, color: "#333" }}>عليه/محمد سمير عبدالغني</p>
        <p style={{ fontSize: 12, color: "#333" }}>رئيس فرع التنظيم والإدارة</p>
      </div>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 justify-start min-w-0">
      <span style={{ ...F, fontSize: 15, color: "#717d96", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ ...F, fontSize: 15, color: "#172e78" }}>:</span>
      <span style={{ ...F, fontSize: 15, color: "#2d3648" }}>{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function LetterReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    letterType?: string;
    soldiers?: SoldierWithAttachment[];
    letterData?: LetterData;
  } | null;

  const letterType = state?.letterType === "end-attachment" ? "end-attachment" : "attachment";
  const soldiers: SoldierWithAttachment[] = state?.soldiers ?? [];
  const letterData: LetterData = state?.letterData ?? { destination: "سرية القيادة", attachmentPlace: "مع العمليات الخاصة", reason: "أوامر قيادة" };

  const pageTitle = letterType === "end-attachment" ? "اصدار خطاب إنهاء إلحاق" : "اصدار خطاب إلحاق";
  const letterTypeLabel = letterType === "end-attachment" ? "إنهاء إلحاق فرد" : "إلحاق فرد";

  const letterNumber = "25184";
  const today = "13 - 04 - 2026";

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [showLoading, setShowLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePrint = useCallback(() => {
    setShowLoading(true);
    setShowSuccess(false);
  }, []);

  useEffect(() => {
    if (!showLoading) return;
    // After 5 seconds → switch to success modal
    const loadingTimer = setTimeout(() => {
      setShowLoading(false);
      setShowSuccess(true);
    }, 5000);
    return () => clearTimeout(loadingTimer);
  }, [showLoading]);

  useEffect(() => {
    if (!showSuccess) return;
    // After 3 more seconds → navigate to dashboard
    const successTimer = setTimeout(() => {
      navigate("/dashboard");
    }, 3000);
    return () => clearTimeout(successTimer);
  }, [showSuccess, navigate]);

  const thClass = "px-4 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]";
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
        <LetterStepper activeStep={4} />
      </div>

      {/* ── بيانات الخطاب ──────────────────────────────────────────── */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-end px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>بيانات الخطاب</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 px-6 py-5">
          <InfoPair label="نوع الخطاب" value={letterTypeLabel} />
          <InfoPair label="رقم الخطاب" value={letterNumber} />
          <InfoPair label="جهة الخطاب" value={letterData.destination} />
          <InfoPair label="تاريخ الخطاب" value={today} />
          <InfoPair label="الوحدة الأساسية" value={soldiers[0]?.unit ?? "مع العمليات الخاصة"} />
          <InfoPair label="عدد الافراد" value={String(soldiers.length || 3)} />
          <InfoPair label="وحدة الالحاق" value={letterData.attachmentPlace || "لا يوجد"} />
          <InfoPair label="تاريخ التسريح" value={soldiers[0]?.dischargeDate ?? "2025 - 3 - 1"} />
        </div>
      </section>

      {/* ── بيانات الافراد ─────────────────────────────────────────── */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
        <div className="flex items-center justify-end px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>بيانات الافراد</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse">
            <thead>
              <tr>
                {["وحدة الالحاق", "الوحدة", "اسم", "درجة"].map((h) => (
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
              {(soldiers.length > 0 ? soldiers : [
                { id: "1", name: "اسلام مجدي عبدالستار", rank: "جندي", unit: "ك ١١٣ صع", attachmentUnit: "ك ١١٣ صع" },
                { id: "2", name: "احمد عادل عبدالستار", rank: "جندي", unit: "مع العمليات الخاصة", attachmentUnit: "مع العمليات الخاصة" },
                { id: "3", name: "محمود اسلام عبدالله", rank: "مساعد أ", unit: "س ١٤٥ اشارة", attachmentUnit: "س ١٤٥ اشارة" },
              ] as SoldierWithAttachment[]).map((soldier, idx) => (
                <tr key={soldier.id}>
                  <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{soldier.attachmentUnit}</span></td>
                  <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{soldier.unit}</span></td>
                  <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{soldier.name}</span></td>
                  <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{soldier.rank}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── معاينة الخطاب ──────────────────────────────────────────── */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
        <div className="flex items-center justify-end px-6 py-4 border-b border-[#e2e7f0]">
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>معاينة الخطاب</span>
        </div>
        <div className="flex flex-col gap-4 p-6 bg-[#f7f9fc]">
          {/* Copy 1 */}
          <LetterPreview
            soldiers={soldiers.length > 0 ? soldiers : [
              { id: "1", militaryId: "2024427700265", name: "اسلام مجدي عبدالستار", rank: "جندي", unit: "ك ١١٣ صع", attachmentUnit: "ك ١١٣ صع", category: "مجند", serviceStatus: "ملحق", attachmentPlace: "فرع العمليات", dischargeDate: "2025 - 3 - 1", letters: [] },
              { id: "2", militaryId: "2024159308527", name: "احمد عادل عبدالستار", rank: "جندي", unit: "مع العمليات الخاصة", attachmentUnit: "مع العمليات الخاصة", category: "مجند", serviceStatus: "منتهي خدمته", attachmentPlace: "لا يوجد", dischargeDate: "2024 - 1 - 15", letters: [] },
              { id: "3", militaryId: "2024964213580", name: "محمود اسلام عبدالله", rank: "مساعد أ", unit: "س ١٤٥ اشارة", attachmentUnit: "س ١٤٥ اشارة", category: "مجند", serviceStatus: "علي القوة", attachmentPlace: "لا يوجد", dischargeDate: "2026 - 6 - 1", letters: [] },
            ] as SoldierWithAttachment[]}
            destination={letterData.destination}
            attachmentPlace={letterData.attachmentPlace}
            reason={letterData.reason}
            letterType={letterType}
          />
          {/* Copy 2 (duplicate) */}
          <LetterPreview
            soldiers={soldiers.length > 0 ? soldiers : [
              { id: "1", militaryId: "2024427700265", name: "اسلام مجدي عبدالستار", rank: "جندي", unit: "ك ١١٣ صع", attachmentUnit: "ك ١١٣ صع", category: "مجند", serviceStatus: "ملحق", attachmentPlace: "فرع العمليات", dischargeDate: "2025 - 3 - 1", letters: [] },
              { id: "2", militaryId: "2024159308527", name: "احمد عادل عبدالستار", rank: "جندي", unit: "مع العمليات الخاصة", attachmentUnit: "مع العمليات الخاصة", category: "مجند", serviceStatus: "منتهي خدمته", attachmentPlace: "لا يوجد", dischargeDate: "2024 - 1 - 15", letters: [] },
              { id: "3", militaryId: "2024964213580", name: "محمود اسلام عبدالله", rank: "مساعد أ", unit: "س ١٤٥ اشارة", attachmentUnit: "س ١٤٥ اشارة", category: "مجند", serviceStatus: "علي القوة", attachmentPlace: "لا يوجد", dischargeDate: "2026 - 6 - 1", letters: [] },
            ] as SoldierWithAttachment[]}
            destination={letterData.destination}
            attachmentPlace={letterData.attachmentPlace}
            reason={letterData.reason}
            letterType={letterType}
          />
        </div>
      </section>

      {/* ── Action buttons ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Primary: أكيد وطباعة */}
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 min-h-[48px] px-6 rounded-[8px] transition-opacity hover:opacity-90 active:opacity-80"
          style={{ background: "linear-gradient(to bottom, #00b867, #00522e)" }}
        >
          <Printer size={16} style={{ color: "#f5f5f5" }} />
          <span style={{ ...F, fontSize: 15, color: "#f5f5f5" }}>أكيد وطباعة الخطاب</span>
        </button>

        {/* Secondary: تحميل معاينة */}
        <button
          type="button"
          className="flex items-center gap-2 min-h-[48px] px-6 rounded-[8px] border border-[#2d3648] bg-white transition-colors hover:bg-[#f5f6fb] active:opacity-80"
        >
          <Download size={16} style={{ color: "#2d3648" }} />
          <span style={{ ...F, fontSize: 15, color: "#2d3648" }}>تحميل معاينة</span>
        </button>

        {/* Tertiary: حفظ كمسودة */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 min-h-[48px] px-4 rounded-[8px] transition-opacity hover:opacity-70 active:opacity-50"
        >
          <span style={{ ...F, fontSize: 15, color: "#172e78", textDecoration: "underline" }}>حفظ كمسوده</span>
        </button>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showLoading && <LoadingModal />}
      {showSuccess && <SuccessModal />}

    </div>
  );
}