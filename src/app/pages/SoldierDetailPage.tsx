import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Trash2, Printer, Pencil, Plus, ArrowDownUp, Download } from "lucide-react";
import { getSoldierById, deleteSoldier, type SoldierData } from "../data/soldiersData";
import { DeleteConfirmDialog } from "../components/dashboard/DeleteConfirmDialog";

// ─── helpers ────────────────────────────────────────────────────────────────
const FONT = { fontFamily: "'Almarai', sans-serif" };

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ ...FONT, fontSize: 18, color: "#4a5468" }}>{children}</span>
  );
}

// ─── Info Row (label : value) ────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  blurred = false,
  highlight = false,
}: {
  label: string;
  value: string;
  blurred?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 justify-end flex-1 min-w-0">
      <span
        className={blurred ? "blur-[6px] select-none" : ""}
        style={{ ...FONT, fontSize: 18, color: highlight ? "#172e78" : "#2d3648", whiteSpace: "nowrap" }}
      >
        {value}
      </span>
      <span style={{ ...FONT, fontSize: 18, color: "#172e78" }}>:</span>
      <span
        className="w-[130px] shrink-0 text-right"
        style={{ ...FONT, fontSize: 18, color: "#717d96" }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Letters Table ────────────────────────────────────────────────────────────
function LettersTable({ soldier }: { soldier: SoldierData }) {
  const thClass = "px-4 py-3 text-right border-b-2 border-[#d4d8fa] whitespace-nowrap bg-white";
  const tdClass = "px-4 py-3 text-right border-b border-[#eaecf0] whitespace-nowrap";

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[600px]" dir="rtl">
        <thead>
          <tr>
            {["رقم الخطاب", "تاريخ الخطاب", "نوع الخطاب", "الجهة الصادر إليها", "السبب", "الاجراء"].map(
              (h) => (
                <th key={h} className={thClass}>
                  <div className="flex items-center gap-1 justify-end">
                    <span style={{ ...FONT, fontSize: 16, color: "#717d96" }}>{h}</span>
                    {h !== "الاجراء" && <ArrowDownUp size={13} className="text-[#a0abc0]" />}
                  </div>
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {soldier.letters.length === 0 ? (
            <tr>
              <td colSpan={6} className={`${tdClass} text-center`}>
                <span style={{ ...FONT, fontSize: 16, color: "#717d96" }}>لا توجد خطابات</span>
              </td>
            </tr>
          ) : (
            soldier.letters.map((letter) => (
              <tr key={letter.id} className="hover:bg-[#fafafa] transition-colors">
                {/* رقم الخطاب */}
                <td className={tdClass}>
                  <div className="flex items-center gap-2">
                    {/* checkbox */}
                    <span className="w-5 h-5 rounded border-2 border-[#1f3d97] bg-[#1f3d97] flex items-center justify-center shrink-0">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span style={{ ...FONT, fontSize: 16, color: "#2d3648" }}>{letter.letterNumber}</span>
                  </div>
                </td>
                {/* تاريخ الخطاب */}
                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 16, color: "#2d3648" }}>{letter.letterDate}</span>
                </td>
                {/* نوع الخطاب */}
                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 16, color: "#2d3648" }}>{letter.letterType}</span>
                </td>
                {/* الجهة الصادر إليها */}
                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 16, color: "#2d3648" }}>
                    {letter.destination}
                  </span>
                </td>
                {/* السبب */}
                <td className={tdClass}>
                  <span style={{ ...FONT, fontSize: 16, color: "#2d3648" }}>
                    {letter.reason}
                  </span>
                </td>
                {/* الاجراء */}
                <td className={tdClass}>
                  <button
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] transition-opacity hover:opacity-80"
                    style={{ backgroundColor: "#ebedfd" }}
                  >
                    <span style={{ ...FONT, fontSize: 14, color: "#2d3648" }}>تحميل الخطاب</span>
                    <Download size={14} className="text-[#2d3648]" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function SoldierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);

  const soldier = getSoldierById(id ?? "");

  if (!soldier) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ ...FONT, fontSize: 18, color: "#717d96" }}>لم يتم العثور على الفرد</p>
      </div>
    );
  }

  function handleConfirmDelete() {
    deleteSoldier(soldier!.id);
    setShowDelete(false);
    navigate("/dashboard/individual-query");
  }

  return (
    <div className="flex flex-col gap-5 w-full" dir="rtl">

      {/* Delete dialog */}
      <DeleteConfirmDialog
        open={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* ── Title ───────────────────────────────────────────────────────── */}
      <h1
        className="text-center w-full"
        style={{ ...FONT, fontWeight: 700, fontSize: "clamp(22px, 4vw, 32px)", color: "#2d3648", lineHeight: 1.5 }}
      >
        بيانات الفرد
      </h1>

      {/* ── Card: البيانات التعريفية ─────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-b border-[#cbd2e0]">
          <SectionTitle>البيانات التعريفية</SectionTitle>
          <div className="flex-1" />
          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {/* Delete */}
            <button
              onClick={() => setShowDelete(true)}
              title="حذف"
              className="w-9 h-9 rounded-[8px] flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#fce8f1" }}
            >
              <Trash2 size={16} style={{ color: "#E3282C" }} />
            </button>
            {/* Print */}
            <button
              title="طباعة"
              className="w-9 h-9 rounded-[8px] flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#ebedfd" }}
            >
              <Printer size={16} style={{ color: "#2D3648" }} />
            </button>
            {/* Edit → navigate to edit page */}
            <button
              onClick={() => navigate(`/dashboard/individual-query/soldier/${soldier.id}/edit`)}
              title="تعديل"
              className="w-9 h-9 rounded-[8px] flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#ebedfd" }}
            >
              <Pencil size={16} style={{ color: "#2D3648" }} />
            </button>
          </div>
        </div>

        {/* Data grid */}
        <div className="flex flex-col gap-4 px-6 py-5">
          {/* Row 1: الرقم العسكري | الدرجة */}
          <div className="flex flex-wrap gap-4">
            <InfoRow label="الرقم العسكري"  value={soldier.militaryId} />
            <InfoRow label="الدرجة"            value={soldier.rank} />
          </div>
          {/* Row 2: الاسم | فئة الفرد */}
          <div className="flex flex-wrap gap-4">
            <InfoRow label="الاسم"             value={soldier.name} />
            <InfoRow label="فئة الفرد"         value={soldier.category} />
          </div>
          {/* Row 3: الوحدة الأساسية | الموقف الخدمي */}
          <div className="flex flex-wrap gap-4">
            <InfoRow label="الوحدة الاساسية"  value={soldier.unit} />
            <InfoRow label="الموقف الخدمي"    value={soldier.serviceStatus} highlight />
          </div>
          {/* Row 4: تاريخ التسريح | جهة الالحاق */}
          <div className="flex flex-wrap gap-4">
            <InfoRow label="تاريخ التسريح"    value={soldier.dischargeDate} />
            <InfoRow label="جهة الالحاق"      value={soldier.attachmentPlace} />
          </div>
        </div>
      </div>

      {/* ── Card: سجل الخطابات ───────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-[#eff0f6] w-full overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-b border-[#cbd2e0]">
          <SectionTitle>سجل الخطابات</SectionTitle>
          <div className="flex-1" />
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(to bottom, #00b867, #00522e)" }}
          >
            <span style={{ ...FONT, fontSize: 14, color: "#f5f5f5" }}>اصدار خطاب</span>
            <Plus size={14} className="text-white" />
          </button>
        </div>

        <LettersTable soldier={soldier} />
      </div>
    </div>
  );
}