import { useState } from "react";
import { ChevronDown, Calendar, Printer, CheckCircle2 } from "lucide-react";

const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

// ─── Stepper ──────────────────────────────────────────────────────────────────
const STEPS = ["اختيار اليومية", "اعدادات اليومية", "العرض والطباعة"];

function DailyStepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-start justify-center gap-0 w-full" dir="rtl">
      {[1, 2, 3].map((n, idx) => {
        const done  = step > n;
        const active = step === n;
        return (
          <div key={n} className="flex items-start">
            {/* Step symbol + label */}
            <div className="flex flex-col items-center" style={{ width: 72 }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                style={{
                  borderColor: done ? " #00b867" : active ? "#a1aebe" : "#a1aebe",
                  background: done ? " #00b867" : active ? "#ffffff" : "#fff",
                }}
              >
                {done
                  ? <CheckCircle2 size={16} color="#fff" fill=  " #00b867" />
                  : <span style={{ ...F, fontSize: 13, color: active ? "#a1aebe" : "#a1aebe" }}>0{n}</span>}
              </div>
              <p
                className="mt-2 text-center whitespace-nowrap"
                style={{
                  ...F,
                  fontSize: 13,
                  color: done
                    ? "#00b867"
                    : active
                    ? "#121212"
                    : "#a1aebe",
                }}
              >
                {STEPS[idx]}
              </p>
            </div>
            {/* Trail */}
            {idx < 2 && (
              <div className="flex items-center mt-4" style={{ width: 80 }}>
                <div className="flex items-center gap-1 w-full justify-center">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: step > n ? "#00b867" : "#a1aebe" }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Select report type ───────────────────────────────────────────────
interface ReportCard {
  title: string;
  desc: string;
}

const REPORT_TYPES: ReportCard[] = [
  { title: "يومية عددية بقوة الوحدة",       desc: "إجمالي القوة والخوارج داخل وحدات محددة" },
  { title: "يومية عددية بخوارج الوحدات",    desc: "إجمالي الخوارج على مستوى وحدات وحدات السلاح" },
  { title: "كشف الافراد الملحقين علي وحده", desc: "عرض اسماء الافراد الملحقين علي وحده معينه" },
  { title: "يومية عددية بخوارج وحدة",       desc: "طباعة الخوارج تفصيليا حسب اماكن الاذاق" },
  { title: "يومية عددية بخوارج الوحدات",    desc: "طباعة الخوارج تفصيليا حسب اماكن الاذاق" },
  { title: "كشف الافراد الملحقين خارج وحده",desc: "عرض اسماء الافراد الملحقين خارج وحده معينه" },
];

function Step1({ onSelect }: { onSelect: (card: ReportCard) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full" dir="rtl">
      {REPORT_TYPES.map((card, idx) => (
        <div
          key={idx}
          className="bg-white rounded-[16px] border border-[#eff0f6] p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
        >
          <p style={{ ...F, fontWeight: 700, fontSize: 17, color: "#2d3648" }}>{card.title}</p>
          <p style={{ ...F, fontSize: 13, color: "#717d96" }}>{card.desc}</p>
          <button
            type="button"
            onClick={() => onSelect(card)}
            style={{ ...F, fontSize: 13, color: "#00b867", fontWeight: 700, textAlign: "right" }}
            className="hover:underline"
          >
            إنشاء اليومية
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Step 2: Settings ─────────────────────────────────────────────────────────
const UNITS = ["سرية القيادة", "فرع العمليات", "قيادة المنطقة", "مع العمليات الخاصة", "ك ١١٣ صع"];
type Category = "الكل" | "ضباط صف" | "جنود";

function SimpleDropdown({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-[54px] bg-white border border-[#e2e7f0] rounded-[8px] flex items-center gap-2 px-3 hover:border-[#a0aec0] transition-colors"
        dir="rtl"
      >
        <ChevronDown size={18} className={`shrink-0 text-[#2d3648] transition-transform ${open ? "rotate-180" : ""}`} />
        <span className="flex-1 text-right" style={{ ...F, fontSize: 17, color: value ? "#2d3648" : "#4a5468" }}>{value}</span>
      </button>
      {open && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden" dir="rtl">
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={["w-full text-right px-4 py-2.5 transition-colors", opt === value ? "bg-[#f0f2fd] text-[#1f3d97]" : "hover:bg-[#f5f6fb] text-[#2d3648]"].join(" ")}
                style={{ ...F, fontSize: 15 }}
              >{opt}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Step2({ reportTitle, onNext }: { reportTitle: string; onNext: (cfg: { unit: string; category: Category; excludeBatch: boolean; date: string }) => void }) {
  const [unit, setUnit] = useState("سرية القيادة");
  const [category, setCategory] = useState<Category>("الكل");
  const [excludeBatch, setExcludeBatch] = useState(false);
  const [date, setDate] = useState("");

  const CATEGORIES: Category[] = ["الكل", "ضباط صف", "جنود"];

  function handleSubmit() {
    onNext({ unit, category, excludeBatch, date });
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full max-w-xl mx-auto p-6 flex flex-col gap-5" dir="rtl">
      <p className="text-center" style={{ ...F, fontSize: 15, color: "#717d96" }}>{reportTitle}</p>

      {/* Unit */}
      <div className="flex flex-col gap-2">
        <label style={{ ...F, fontSize: 15, color: "#2d3648", fontWeight: 700 }}>اختيار الوحده</label>
        <SimpleDropdown value={unit} options={UNITS} onChange={setUnit} />
      </div>

      {/* Category toggle */}
      <div className="flex flex-col gap-2">
        <label style={{ ...F, fontSize: 15, color: "#2d3648", fontWeight: 700 }}>اختيار الفئة</label>
        <div className="flex items-center rounded-[8px] border border-[#e2e7f0] overflow-hidden h-[48px]" dir="rtl">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className="flex-1 h-full flex items-center justify-center transition-all"
              style={{
                ...F,
                fontSize: 15,
                color: category === cat ? "#fff" : "#2d3648",
                background: category === cat ? "linear-gradient(to bottom, #00b867, #00522e)" : "#fff",
                borderRight: cat !== "جنود" ? "1px solid #e2e7f0" : "none",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Exclude batch */}
      <div className="flex items-center gap-2 justify-start">
        <label htmlFor="excludeBatch" style={{ ...F, fontSize: 15, color: "#2d3648" }}>استثناء دفعة رديف</label>
        <input
          id="excludeBatch"
          type="checkbox"
          checked={excludeBatch}
          onChange={(e) => setExcludeBatch(e.target.checked)}
          className="w-4 h-4 accent-[#00b867]"
        />
      </div>

      {/* Date */}
      <div className="relative w-full">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full h-[54px] bg-white border border-[#e2e7f0] rounded-[8px] px-3 text-right outline-none focus:border-[#00b867] transition-colors"
          style={{ ...F, fontSize: 15, color: date ? "#2d3648" : "#4a5468", direction: "rtl" }}
          placeholder="تاريخ التسريح"
        />
        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1aebe] pointer-events-none" />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full h-[52px] rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(to bottom, #00b867, #00522e)" }}
      >
        <span style={{ ...F, fontSize: 16, color: "#fff" }}>معاينة اليومية</span>
      </button>
    </div>
  );
}

// ─── Step 3: View & Print ─────────────────────────────────────────────────────
interface ReportConfig { unit: string; category: string; excludeBatch: boolean; date: string; }

const MOCK_DATA = {
  جنود: { قوة: 250, خوارج: 100 },
  "ضباط صف": { قوة: 35, خوارج: 5 },
};

function Step3({ reportTitle, cfg }: { reportTitle: string; cfg: ReportConfig }) {
  const rows = [
    { label: "جنود",     قوة: MOCK_DATA["جنود"]["قوة"],       خوارج: MOCK_DATA["جنود"]["خوارج"] },
    { label: "ضباط صف", قوة: MOCK_DATA["ضباط صف"]["قوة"],    خوارج: MOCK_DATA["ضباط صف"]["خوارج"] },
  ].filter((r) => {
    if (cfg.category === "جنود") return r.label === "جنود";
    if (cfg.category === "ضباط صف") return r.label === "ضباط صف";
    return true;
  });

  const totalPower    = rows.reduce((a, r) => a + r.قوة, 0);
  const totalKharij   = rows.reduce((a, r) => a + r.خوارج, 0);
  const thClass = "px-5 py-3 text-right border border-[#dde3ef] bg-[#f7f9fc]";
  const tdClass = "px-5 py-3 text-center border border-[#dde3ef]";
  const now = new Date();
  const displayDate = cfg.date
    ? cfg.date.replace(/-/g, "-")
    : `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}, 12:00 PM`;

  return (
    <div className="flex flex-col gap-5 w-full" dir="rtl">
      {/* Header info */}
      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full p-5 flex flex-col gap-3">
        {/* Report title */}
        <div className="flex items-center justify-start">
          <p style={{ ...F, fontSize: 16, color: "#2d3648", fontWeight: 700 }}>{reportTitle}</p>
        </div>
        <div className="w-full h-px bg-[#eff0f6]" />
        {/* Meta row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 items-center justify-start" dir="rtl">
          <div className="flex items-center gap-1.5">
            <span style={{ ...F, fontSize: 13, color: "#717d96" }}>استثناء دفعة رديف :</span>
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{cfg.excludeBatch ? "يوجد" : "لا يوجد"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ ...F, fontSize: 13, color: "#717d96" }}>تاريخ الاصدار :</span>
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{displayDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ ...F, fontSize: 13, color: "#717d96" }}>فئة الافراد :</span>
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
              {cfg.category === "الكل" ? "كل الافراد" : cfg.category}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ ...F, fontSize: 13, color: "#717d96" }}>اسم الوحده :</span>
            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>{cfg.unit}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[350px] border-collapse">
            <thead>
              <tr>
                {["البيان", "قوة", "خوارج", "متبقي"].map((h) => (
                  <th key={h} className={thClass} style={{ ...F, fontSize: 14, color: "#717d96" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="hover:bg-[#fafbff] transition-colors">
                  <td className="px-5 py-3 text-right border border-[#dde3ef]">
                    <span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{row.label}</span>
                  </td>
                  <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{row.قوة}</span></td>
                  <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{row.خوارج}</span></td>
                  <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648" }}>{row.قوة - row.خوارج}</span></td>
                </tr>
              ))}
              {/* Total row */}
              <tr style={{ background: "#f7f9fc" }}>
                <td className="px-5 py-3 text-right border border-[#dde3ef]">
                  <span style={{ ...F, fontSize: 14, color: "#2d3648", fontWeight: 700 }}>اجمالي</span>
                </td>
                <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648", fontWeight: 700 }}>{totalPower}</span></td>
                <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648", fontWeight: 700 }}>{totalKharij}</span></td>
                <td className={tdClass}><span style={{ ...F, fontSize: 14, color: "#2d3648", fontWeight: 700 }}>{totalPower - totalKharij}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Print button */}
      <button
        type="button"
        onClick={() => window.print()}
        className="w-full h-[52px] rounded-[8px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(to bottom, #00b867, #00522e)" }}
      >
        <Printer size={18} style={{ color: "#fff" }} />
        <span style={{ ...F, fontSize: 16, color: "#fff" }}>طباعة اليومية</span>
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function DailyReportsPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCard, setSelectedCard] = useState<ReportCard | null>(null);
  const [reportConfig, setReportConfig] = useState<ReportConfig | null>(null);

  function handleSelectCard(card: ReportCard) {
    setSelectedCard(card);
    setStep(2);
  }

  function handleSettings(cfg: { unit: string; category: Category; excludeBatch: boolean; date: string }) {
    setReportConfig(cfg);
    setStep(3);
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">

      {/* Title */}
      <h1
        className="text-center"
        style={{ ...F, fontWeight: 700, fontSize: "clamp(22px,4vw,32px)", color: "#2d3648", lineHeight: 1.5 }}
      >
        اليوميات
      </h1>

      {/* Stepper */}
      <div className="flex justify-center">
        <DailyStepper step={step} />
      </div>

      {/* Step content */}
      {step === 1 && <Step1 onSelect={handleSelectCard} />}
      {step === 2 && selectedCard && (
        <Step2 reportTitle={selectedCard.title} onNext={handleSettings} />
      )}
      {step === 3 && selectedCard && reportConfig && (
        <Step3 reportTitle={selectedCard.title} cfg={reportConfig} />
      )}

    </div>
  );
}