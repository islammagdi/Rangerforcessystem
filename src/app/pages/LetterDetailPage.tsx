import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Trash2,
  Printer,
  Upload,
  FileText,
  X,
} from "lucide-react";
import { getLetterById } from "../data/lettersData";
import imgEagle from "figma:asset/af406d517dfa4e5b22e9993bd61d8e4e002646b6.png";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({
  status,
}: {
  status: "موثق" | "غير موثق";
}) {
  const isVerified = status === "موثق";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
      style={{
        background: isVerified ? "#dcfce7" : "#fce9ea",
        ...F,
        fontSize: 12,
        fontWeight: 700,
        color: isVerified ? "#166534" : "#9d2e15",
        whiteSpace: "nowrap",
      }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{
          background: isVerified ? "#16a34a" : "#E37032",
        }}
      />
      {status}
    </span>
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

// ─── Info Pair ─────────────────────────────────────────────────────────────────
function InfoPair({
  label,
  value,
  badge,
}: {
  label: string;
  value?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-2 justify-start"
      dir="rtl"
    >
      <span
        style={{
          ...F,
          fontSize: 16,
          color: "#717d96",
          minWidth: 100,
          textAlign: "right",
        }}
      >
        {label}
      </span>
      <span style={{ ...F, fontSize: 16, color: "#172e78" }}>
        :
      </span>
      {badge ?? (
        <span style={{ ...F, fontSize: 16, color: "#2d3648" }}>
          {value}
        </span>
      )}
    </div>
  );
}

// ─── Letter Paper Preview ─────────────────────────────────────────────────────
function LetterPaper({
  letter,
}: {
  letter: NonNullable<ReturnType<typeof getLetterById>>;
}) {
  return (
    <div
      className="bg-white border border-[#ddd] rounded-[4px] p-6 w-full shadow-sm"
      dir="rtl"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 pb-3 border-b border-[#e0e0e0] mb-4">
        <div className="shrink-0 w-12 h-12">
          <img
            src={imgEagle}
            alt="شعار الجمهورية"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col gap-0.5 flex-1 text-right">
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#1a1a1a",
            }}
          >
            قيادة قوات الصاعقة
          </p>
          <p style={{ fontSize: 11, color: "#333" }}>
            فرع التنظيم والإدارة
          </p>
          <p style={{ fontSize: 11, color: "#333" }}>
            التاريخ : {letter.date}
          </p>
        </div>
      </div>

      {/* Recipient */}
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: 8,
        }}
      >
        إلى / {letter.destination}
      </p>

      {/* Body */}
      <p
        style={{
          fontSize: 11,
          color: "#333",
          lineHeight: 1.8,
          marginBottom: 8,
        }}
      >
        قدم لكم اليوم {letter.date} الأفراد المذكور أسماؤهم
        وبياناتهم من التكليف الأميرية ذلك لهم للعمل (
        {letter.reason || "أوامر قيادة"}) بالأماكن الموضحة قرين
        كل منهم وذلك بناءً على أوامر الأركان وبياناتهم كالتالي:
      </p>

      {/* Soldiers table */}
      <table
        className="w-full border-collapse mb-4"
        style={{ fontSize: 10 }}
      >
        <thead>
          <tr
            style={{
              background: "#f5f5f5",
              borderBottom: "1px solid #ddd",
            }}
          >
            {[
              "ملاحظات",
              "وحدة الالحاق",
              "الوحدة",
              "الاسم",
              "الدرجة",
              "م",
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: "4px 6px",
                  textAlign: "right",
                  borderRight: "1px solid #ddd",
                  color: "#444",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {letter.soldiers.map((s, idx) => (
            <tr
              key={idx}
              style={{ borderBottom: "1px solid #eee" }}
            >
              <td
                style={{
                  padding: "4px 6px",
                  borderRight: "1px solid #eee",
                }}
              ></td>
              <td
                style={{
                  padding: "4px 6px",
                  borderRight: "1px solid #eee",
                }}
              >
                {s.attachmentUnit}
              </td>
              <td
                style={{
                  padding: "4px 6px",
                  borderRight: "1px solid #eee",
                }}
              >
                {s.unit}
              </td>
              <td
                style={{
                  padding: "4px 6px",
                  borderRight: "1px solid #eee",
                }}
              >
                {s.name}
              </td>
              <td
                style={{
                  padding: "4px 6px",
                  borderRight: "1px solid #eee",
                }}
              >
                {s.rank}
              </td>
              <td
                style={{
                  padding: "4px 6px",
                  borderRight: "1px solid #eee",
                  textAlign: "center",
                }}
              >
                {idx + 1}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p
        style={{
          fontSize: 11,
          color: "#333",
          marginBottom: 12,
        }}
      >
        مع وافر التحية ،،،
      </p>

      {/* Signature */}
      <div className="flex flex-col items-start gap-0.5">
        <p style={{ fontSize: 11, color: "#333" }}>
          التوقيع ( )
        </p>
        <p style={{ fontSize: 11, color: "#333" }}>
          عليه/محمد سمير عبدالغني
        </p>
        <p style={{ fontSize: 11, color: "#333" }}>
          رئيس فرع التنظيم والإدارة
        </p>
      </div>
    </div>
  );
}

// ─── Upload Area (Unverified) ─────────────────────────────────────────────────
function UploadArea({ onSave }: { onSave: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(f: File) {
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Warning text */}
      <div className="text-center" dir="rtl">
        <p
          style={{
            ...F,
            fontSize: 16,
            color: "#1a1a1a",
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          هذا الخطاب غير موثق حق الآن.
        </p>
        <p
          style={{
            ...F,
            fontSize: 16,
            color: "#1a1a1a",
            fontWeight: 700,
          }}
        >
          يرجى رفع النسخة المصدق عليها لاستكمال الإجراءات.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-[12px] flex flex-col items-center justify-center gap-3 py-8 px-4 cursor-pointer transition-colors"
        style={{
          border: `2px dashed ${dragging ? "#395945" : "#cbd2e0"}`,
          background: dragging ? "#f0f4ff" : "#fff",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.png"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {file ? (
          <div className="flex items-center gap-3">
            <FileText size={24} style={{ color: "#395945" }} />
            <span
              style={{ ...F, fontSize: 14, color: "#2d3648" }}
            >
              {file.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
            >
              <X size={16} style={{ color: "#ef4444" }} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={28} style={{ color: "#395945" }} />
            <p
              style={{
                ...F,
                fontSize: 14,
                color: "#4a5468",
                textAlign: "center",
              }}
            >
              اسحب الملف هنا أو تصفح
            </p>
            <p style={{ ...F, fontSize: 12, color: "#a1aebe" }}>
              أو
            </p>
            <button
              type="button"
              className="px-4 py-1.5 rounded-[6px] border border-[#395945] transition-colors hover:bg-[#f0f4ff]"
              style={{ ...F, fontSize: 14, color: "#395945" }}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              تصفح الملفات
            </button>
          </>
        )}
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={onSave}
        className="w-full h-[52px] rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90 active:opacity-80"
        style={{
          background:
            "linear-gradient(to bottom, #00b867, #00522e)",
        }}
      >
        <span style={{ ...F, fontSize: 16, color: "#fff" }}>
          حفظ التعديلات
        </span>
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function LetterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const letter = getLetterById(id ?? "");

  const [saved, setSaved] = useState(false);

  if (!letter) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-4"
        dir="rtl"
      >
        <p style={{ ...F, fontSize: 18, color: "#717d96" }}>
          لم يتم العثور على الخطاب
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard/letters-archive")}
          className="px-6 py-2 rounded-[8px] border border-[#395945] hover:bg-[#f0f4ff] transition-colors"
          style={{ ...F, fontSize: 15, color: "#1f3d97" }}
        >
          العودة لسجل الخطابات
        </button>
      </div>
    );
  }

  const isVerified = letter.status === "موثق";
  const thClass =
    "px-4 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]";
  const tdClass =
    "px-4 py-3 text-right border-b border-[#e2e7f0]";

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
        بيانات الخطاب
      </h1>

      {/* ── Section: بيانات الخطاب ──────────────────────────────────────── */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
        {/* Card header with action buttons */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-[#e2e7f0]"
          dir="rtl"
        >
          {/* Action buttons */}
          {/* Section label */}
          <span
            style={{ ...F, fontSize: 16, color: "#4a5468" }}
          >
            بيانات الخطاب
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              title="طباعة"
              onClick={() => window.print()}
              className="w-9 h-9 rounded-[8px] flex items-center justify-center transition-colors hover:opacity-80"
              style={{ backgroundColor: "#ebedfd" }}
            >
              <Printer size={15} style={{ color: "#2d3648" }} />
            </button>
            <button
              type="button"
              title="حذف"
              onClick={() =>
                navigate("/dashboard/letters-archive")
              }
              className="w-9 h-9 rounded-[8px] flex items-center justify-center transition-colors hover:opacity-80"
              style={{ backgroundColor: "#fce8f1" }}
            >
              <Trash2 size={15} style={{ color: "#e3282c" }} />
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 px-6 py-5"
          dir="rtl"
        >
          <InfoPair
            label="نوع الخطاب"
            value={
              letter.type === "إلحاق"
                ? "إلحاق فرد"
                : "إنهاء إلحاق فرد"
            }
          />
          <InfoPair
            label="رقم الخطاب"
            value={letter.letterNumber.slice(-5)}
          />
          <InfoPair
            label="جهة الخطاب"
            value={letter.destination}
          />
          <InfoPair
            label="تاريخ الخطاب"
            value={letter.date.replace(/-/g, " - ")}
          />
          <InfoPair
            label="حالة الخطاب"
            badge={<StatusBadge status={letter.status} />}
          />
          <InfoPair
            label="عدد الافراد"
            value={String(letter.soldiersCount)}
          />
        </div>
      </section>

      {/* ── Section: بيانات الافراد ─────────────────────────────────────── */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
        <div className="flex items-center justify-start px-5 py-4 border-b border-[#e2e7f0]">
          <span
            style={{ ...F, fontSize: 16, color: "#4a5468" }}
          >
            بيانات الافراد
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[450px] border-collapse">
            <thead>
              <tr>
                {["درجة", "اسم", "الوحدة", "وحدة الالحاق"].map(
                  (h) => (
                    <th key={h} className={thClass}>
                      <div className="flex items-center gap-1 justify-end">
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
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {letter.soldiers.map((soldier, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-[#fafbff] transition-colors"
                >
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
                  <td className={tdClass}>
                    <span
                      style={{
                        ...F,
                        fontSize: 14,
                        color: "#2d3648",
                      }}
                    >
                      {soldier.attachmentUnit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section: صورة الخطاب ────────────────────────────────────────── */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
        <div className="flex items-center justify-start px-5 py-4 border-b border-[#e2e7f0]">
          <span
            style={{ ...F, fontSize: 16, color: "#4a5468" }}
          >
            صورة الخطاب
          </span>
        </div>
        <div className="px-6 py-6 flex flex-col gap-5">
          {isVerified ? (
            /* ── Verified: show letter previews + print button ── */
            <>
              <div className="flex flex-col gap-4 bg-[#f7f9fc] p-4 rounded-[12px]">
                <LetterPaper letter={letter} />
                <LetterPaper letter={letter} />
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full h-[52px] rounded-[8px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80"
                style={{
                  background:
                    "linear-gradient(to bottom, #00b867, #00522e)",
                }}
              >
                <Printer size={18} style={{ color: "#fff" }} />
                <span
                  style={{ ...F, fontSize: 16, color: "#fff" }}
                >
                  طباعة نسخة الخطاب
                </span>
              </button>
            </>
          ) : /* ── Unverified: upload area ── */
          saved ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#dcfce7" }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="#16a34a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                style={{
                  ...F,
                  fontSize: 16,
                  color: "#166534",
                  fontWeight: 700,
                }}
              >
                تم رفع الملف بنجاح
              </p>
              <p
                style={{ ...F, fontSize: 14, color: "#4a5468" }}
              >
                سيتم مراجعة الخطاب واعتماده قريباً
              </p>
            </div>
          ) : (
            <UploadArea onSave={() => setSaved(true)} />
          )}
        </div>
      </section>
    </div>
  );
}