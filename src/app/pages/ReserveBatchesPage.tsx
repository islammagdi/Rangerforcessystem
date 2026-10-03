import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router";
import { logActivity } from "../../lib/logActivity"; 
import { createNotification } from "../../lib/createNotification";// عدّل المسار حسب مكان الملف عندك
import {
  ChevronDown,
  X,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowLeftRight,
  Search,
  Undo2,
  History,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePermissions } from "../../lib/usePermissions";
import { useUnsavedChanges } from "../../lib/unsavedChanges";
import { fetchAllRows, fetchByIdsInChunks } from "../../lib/fetchAllRows";
import {
  ReserveBatchProcedures,
  CertificateDialog,
} from "../components/reserve/ReserveBatchProcedures";
import { todayLocalIso } from "../../lib/dates";
const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

type ReserveBatch = {
  id: string;
  batch_date: string;
  name: string | null;
  is_active: boolean;
};

type DocumentState =
  | "تم الاستلام"
  | "لم يتم الاستلام"
  | "تالف";

type SoldierStatus =
  | "بالخدمة"
  | "منتهي خدمته";

// ✅ حالة مراجعة النموذج (1س)
type Model1sReviewState =
  | "تمت المراجعة"
  | "لم تتم المراجعة"
  | "به ملاحظات";

type Soldier = {
  id: string;
  militaryId: string;
  rank: string;
  name: string;
  unit: string;
  receivedKariza: DocumentState;
  receivedLicense: DocumentState;
  receivedLiteracy: DocumentState;
  requiresLiteracy: boolean;
  status: SoldierStatus;
  model1sReview: Model1sReviewState; // ✅ جديد
  model1sNotes: string; // ✅ جديد
  unitId: string | null;
  mobilization1: string;
  mobilization2: string;
  sentToRecordsAt: string | null;
  certificateId: string | null;
  certificateNumber: string | null;
  certificateDate: string | null;
  transfers: TransferRecord[];
};

type TransferRecord = {
  id: string;
  fromBatchId: string | null;
  fromDate: string | null;
  toDate: string;
  direction: "postpone" | "advance";
  reasonName: string;
  referenceNumber: string | null;
  referenceDate: string | null;
  penaltyDays: number | null;
  notes: string | null;
  removedFromShipment: boolean;
  createdAt: string;
};

type TransferReason = {
  code: string;
  name: string;
  direction: "postpone" | "advance" | "any";
  requires_reference: boolean;
  asks_penalty_days: boolean;
};

type TransferPayload = {
  toBatchId: string;
  targetLabel: string;
  reasonCode: string;
  reasonName: string;
  referenceNumber: string;
  referenceDate: string;
  penaltyDays: number | null;
  notes: string;
  revertsTransferId: string | null;
};

type RevertTarget = { soldier: Soldier; transfer: TransferRecord };


const FIELD_LABELS: Record<string, string> = {
  receivedKariza: "استلام الكارنيه",
  receivedLicense: "استلام الرخصة",
  receivedLiteracy: "استلام محو الأمية",
  model1sReview: "مراجعة النموذج (1س)",
  model1sNotes: "ملاحظات النموذج (1س)",
  mobilization1: "التعبئة الأولى",
  mobilization2: "التعبئة الثانية",
};
/* =========================================================
   أهلية الرخصة
   الرقم السابع والثامن = 66
   ========================================================= */

function hasLicenseEligibility(militaryId: string) {
  const value = String(militaryId ?? "").trim();

  return (
    value.length >= 8 &&
    value.substring(6, 8) === "66"
  );
}
async function getCurrentUserInfo(): Promise<{
  userId: string | null;
  userName: string;
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { userId: null, userName: "غير معروف" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", session.user.id)
    .maybeSingle();

  return {
    userId: session.user.id,
    userName: profile?.username ?? "غير معروف",
  };
}

/* =========================================================
   التاريخ
   ========================================================= */

function formatBatchDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

/* =========================================================
   تحويل حالة المستند
   ========================================================= */

function documentStateToDb(
  value: DocumentState
) {
  if (value === "تم الاستلام") {
    return "DELIVERED";
  }

  if (value === "تالف") {
    return "DAMAGED";
  }

  return "PENDING";
}

function dbStateToDocumentState(
  value: string | null
): DocumentState {
  if (value === "DELIVERED") {
    return "تم الاستلام";
  }

  if (value === "DAMAGED") {
    return "تالف";
  }

  return "لم يتم الاستلام";
}

/* =========================================================
   تحويل حالة مراجعة النموذج (1س)
   ========================================================= */

const MODEL1S_OPTIONS: Model1sReviewState[] = [
  "تمت المراجعة",
  "لم تتم المراجعة",
  "به ملاحظات",
];

const MODEL1S_COLORS: Record<Model1sReviewState, string> = {
  "تمت المراجعة": "#166534",
  "لم تتم المراجعة": "#9a3412",
  "به ملاحظات": "#9d2e15",
};

const MODEL1S_BACKGROUNDS: Record<Model1sReviewState, string> = {
  "تمت المراجعة": "#dcfce7",
  "لم تتم المراجعة": "#fff7ed",
  "به ملاحظات": "#fce9ea",
};

function model1sStateToDb(value: Model1sReviewState) {
  if (value === "تمت المراجعة") {
    return "REVIEWED";
  }

  if (value === "به ملاحظات") {
    return "HAS_NOTES";
  }

  return "PENDING";
}

function dbToModel1sState(
  value: string | null
): Model1sReviewState {
  if (value === "REVIEWED") {
    return "تمت المراجعة";
  }

  if (value === "HAS_NOTES") {
    return "به ملاحظات";
  }

  return "لم تتم المراجعة";
}

/* =========================================================
   GENERIC DROPDOWN (تُستخدم لكل من فلتر الدفعة وفلتر الوحدة)
   ========================================================= */

function GenericDropdown({
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  allowClear = false,
  clearLabel = "الكل",
}: {
  value: string;
  options: {
    label: string;
    value: string;
  }[];
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex-1 min-w-[200px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          !disabled &&
          setOpen((o) => !o)
        }
        className="w-full h-[54px] bg-white border border-[#e2e7f0] rounded-[8px] flex items-center gap-2 px-3 hover:border-[#a0aec0] transition-colors disabled:bg-[#f5f6f8] disabled:cursor-not-allowed"
        dir="rtl"
      >
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#2d3648] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />

        <span
          className="flex-1 text-right"
          style={{
            ...F,
            fontSize: 17,
            color: value
              ? "#2d3648"
              : "#a1aebe",
          }}
        >
          {value || placeholder}
        </span>
      </button>

      {open && !disabled && (
        <ul
          className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden max-h-[300px] overflow-y-auto"
          dir="rtl"
        >
          {allowClear && (
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="w-full text-right px-4 py-2.5 hover:bg-[#f5f6fb] transition-colors"
                style={{
                  ...F,
                  fontSize: 15,
                  color: "#717d96",
                }}
              >
                {clearLabel}
              </button>
            </li>
          )}

          {options.length === 0 ? (
            <li
              className="px-4 py-3 text-right"
              style={{
                ...F,
                fontSize: 14,
                color: "#a1aebe",
              }}
            >
              لا توجد نتائج
            </li>
          ) : (
            options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={[
                    "w-full text-right px-4 py-2.5 transition-colors",
                    opt.value === value
                      ? "bg-[#f0f2fd] text-[#1f3d97]"
                      : "hover:bg-[#f5f6fb] text-[#2d3648]",
                  ].join(" ")}
                  style={{
                    ...F,
                    fontSize: 15,
                  }}
                >
                  {opt.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/* =========================================================
   DOCUMENT DROPDOWN (معمّمة: تُستخدم لحالة المستندات
   ولحالة مراجعة النموذج (1س) بنفس الكومبوننت)
   ========================================================= */

const DEFAULT_DOCUMENT_OPTIONS: DocumentState[] = [
  "تم الاستلام",
  "لم يتم الاستلام",
  "تالف",
];

const DEFAULT_DOCUMENT_COLORS: Record<DocumentState, string> = {
  "تم الاستلام": "#166534",
  "لم يتم الاستلام": "#9a3412",
  "تالف": "#991b1b",
};

const DEFAULT_DOCUMENT_BACKGROUNDS: Record<DocumentState, string> = {
  "تم الاستلام": "#dcfce7",
  "لم يتم الاستلام": "#fff7ed",
  "تالف": "#fee2e2",
};

function DocumentDropdown<T extends string = DocumentState>({
  value,
  onChange,
  disabled = false,
  options = DEFAULT_DOCUMENT_OPTIONS as unknown as T[],
  colors = DEFAULT_DOCUMENT_COLORS as unknown as Record<T, string>,
  backgrounds = DEFAULT_DOCUMENT_BACKGROUNDS as unknown as Record<
    T,
    string
  >,
  disabledLabel = "غير متاح",
}: {
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  options?: T[];
  colors?: Record<T, string>;
  backgrounds?: Record<T, string>;
  disabledLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  const buttonRef =
    useRef<HTMLButtonElement>(null);

  const [menuPosition, setMenuPosition] =
    useState({
      top: 0,
      left: 0,
      openUp: true,
    });

  function updateMenuPosition() {
    if (!buttonRef.current) {
      return;
    }

    const rect =
      buttonRef.current.getBoundingClientRect();

    const menuWidth = 150;
    const menuHeight = 108;
    const gap = 4;

    const spaceAbove = rect.top;

    const spaceBelow =
      window.innerHeight - rect.bottom;

    const openUp =
      spaceAbove >=
        menuHeight + gap ||
      spaceAbove > spaceBelow;

    let top = openUp
      ? rect.top -
        menuHeight -
        gap
      : rect.bottom + gap;

    top = Math.max(
      4,
      Math.min(
        top,
        window.innerHeight -
          menuHeight -
          4
      )
    );

    let left =
      rect.right - menuWidth;

    left = Math.max(
      4,
      Math.min(
        left,
        window.innerWidth -
          menuWidth -
          4
      )
    );

    setMenuPosition({
      top,
      left,
      openUp,
    });
  }

  function handleToggle() {
    if (disabled) {
      return;
    }

    if (!open) {
      updateMenuPosition();
    }

    setOpen((prev) => !prev);
  }

  useEffect(() => {
    if (!open || disabled) {
      return;
    }

    updateMenuPosition();

    const handleScroll = () => {
      updateMenuPosition();
    };

    const handleResize = () => {
      updateMenuPosition();
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      true
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
        true
      );

      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, [open, disabled]);

  const dropdownMenu =
    open && !disabled
      ? createPortal(
          <div
            dir="rtl"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: 150,
              zIndex: 999999,
              background: "#ffffff",
              border:
                "1px solid #e2e7f0",
              borderRadius: 7,
              boxShadow:
                "0 10px 30px rgba(0, 0, 0, 0.16)",
              overflow: "hidden",
            }}
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className="w-full px-3 py-2.5 text-right hover:bg-[#f5f7fa] transition-colors"
                style={{
                  ...F,
                  fontSize: 11,
                  color: colors[option],
                  background: "#ffffff",
                }}
              >
                {option}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        className="inline-block min-w-[130px]"
        dir="rtl"
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className="w-full h-[34px] px-2 rounded-[6px] flex items-center justify-between gap-2 border transition-colors"
          style={{
            background: disabled
              ? "#f1f3f6"
              : backgrounds[value],

            borderColor: disabled
              ? "#d7dce5"
              : "#e2e7f0",

            color: disabled
              ? "#a1aebe"
              : colors[value],

            cursor: disabled
              ? "not-allowed"
              : "pointer",

            opacity: disabled ? 0.65 : 1,

            ...F,
            fontSize: 11,
          }}
        >
          <ChevronDown
            size={13}
            className={`transition-transform ${
              open
                ? "rotate-180"
                : ""
            }`}
          />

          <span>
            {disabled
              ? disabledLabel
              : value}
          </span>
        </button>
      </div>

      {dropdownMenu}
    </>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="bg-white flex-1 min-w-[180px] rounded-[20px] border border-[#eff0f6] px-5 py-4 flex items-center gap-3"
      dir="rtl"
    >
      <div className="flex flex-col gap-1 items-start flex-1">
        <p
          style={{
            ...F,
            fontSize: 22,
            color: "#2d3648",
            fontWeight: 700,
          }}
        >
          {value}
        </p>

        <p
          style={{
            ...F,
            fontSize: 13,
            color: "#717d96",
          }}
        >
          {label}
        </p>
      </div>

      <div
        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: "#dcfce7",
        }}
      >
        {icon}
      </div>
    </div>
  );
}

/* =========================================================
   PROGRESS CARD
   ========================================================= */

function ProgressCard({
  icon,
  label,
  current,
  total,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  total: number;
}) {
  const pct =
    total > 0
      ? Math.round(
          (current / total) * 100
        )
      : 0;

  return (
    <div
      className="bg-white flex-1 min-w-[200px] rounded-[20px] border border-[#eff0f6] px-5 py-4"
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1.5 items-start flex-1">
          <p
            style={{
              ...F,
              fontSize: 22,
              color: "#2d3648",
              fontWeight: 700,
            }}
          >
            {current.toLocaleString(
              "ar-EG"
            )}{" "}
            <span
              style={{
                fontSize: 16,
                color: "#717d96",
              }}
            >
              من{" "}
              {total.toLocaleString(
                "ar-EG"
              )}
            </span>
          </p>

          <p
            style={{
              ...F,
              fontSize: 14,
              color: "#717d96",
            }}
          >
            {label}
          </p>
        </div>

        <div
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "#dcfce7e4",
          }}
        >
          {icon}
        </div>
      </div>

 
    </div>
  );
}

/* =========================================================
   END SERVICE DIALOG
   ========================================================= */
function EndServiceDialog({
  onCancel,
  onConfirm,
  saving,
  missingCertificates = 0,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
  missingCertificates?: number;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4"
      dir="rtl"
    >
      <div
        className="bg-white rounded-[16px] p-5 w-full max-w-sm flex flex-col gap-4 shadow-2xl"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={20}
            className="shrink-0 text-[#e3282c]"
          />

          <span
            className="flex-1 text-right"
            style={{
              ...F,
              fontSize: 18,
              color: "#333",
              fontWeight: 700,
            }}
          >
            تحذير
          </span>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="shrink-0 text-[#aaa] hover:text-[#555]"
          >
            <X size={20} />
          </button>
        </div>

        <p
          style={{
            ...F,
            fontSize: 16,
            color: "#333",
            textAlign: "right",
            lineHeight: 1.7,
          }}
        >
          هل أنت متأكد من إنهاء خدمة
          الأفراد المحددين؟
        </p>

        {missingCertificates > 0 && (
          <p
            className="rounded-[8px] px-3 py-2"
            style={{
              ...F,
              fontSize: 13,
              color: "#8a6500",
              background: "#fff8e8",
              textAlign: "right",
            }}
          >
            تنبيه: {missingCertificates.toLocaleString("ar-EG")} من الأفراد المحددين لم تُسجل لهم شهادة إنهاء الخدمة بعد.
          </p>
        )}

        <div className="flex items-center gap-2 justify-start">
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="px-4 py-2 rounded-[8px] disabled:opacity-50"
            style={{
              background: "#e3282c",
              ...F,
              fontSize: 15,
              color: "#fff",
            }}
          >
            {saving
              ? "جاري الحفظ..."
              : "إنهاء خدمة الأفراد"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-[8px] disabled:opacity-50"
            style={{
              ...F,
              fontSize: 15,
              color: "#888",
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* =========================================================
   TRANSFER DIALOG
   ========================================================= */

function TransferDialog({
  currentBatch,
  count,
  revert,
  onCancel,
  onConfirm,
  saving,
}: {
  currentBatch: ReserveBatch;
  count: number;
  revert: RevertTarget | null;
  onCancel: () => void;
  onConfirm: (payload: TransferPayload) => void;
  saving: boolean;
}) {
  const [allBatches, setAllBatches] = useState<ReserveBatch[]>([]);
  const [reasons, setReasons] = useState<TransferReason[]>([]);
  const [loading, setLoading] = useState(true);

  const [targetBatch, setTargetBatch] = useState(revert?.transfer.fromBatchId ?? "");
  const [reasonCode, setReasonCode] = useState(revert ? "PENALTY_REMOVED" : "");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [referenceDate, setReferenceDate] = useState("");
  const [penaltyDays, setPenaltyDays] = useState("");
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    void (async () => {
      const [batchesRes, reasonsRes] = await Promise.all([
        supabase
          .from("reserve_batches")
          .select("id, batch_date, name, is_active")
          .order("batch_date", { ascending: true }),
        supabase
          .from("reserve_batch_transfer_reasons")
          .select("code, name, direction, requires_reference, asks_penalty_days")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

      setAllBatches(
        (batchesRes.data ?? []).map((b: any) => ({
          id: b.id,
          batch_date: b.batch_date,
          name: b.name,
          is_active: b.is_active === true,
        }))
      );
      setReasons((reasonsRes.data ?? []) as TransferReason[]);
      setLoading(false);
    })();
  }, []);

  const batchLabel = (b: ReserveBatch) => b.name || `دفعة ${formatBatchDate(b.batch_date)}`;

  const target = allBatches.find((b) => b.id === targetBatch);

  const direction: "postpone" | "advance" | null = target
    ? target.batch_date > currentBatch.batch_date
      ? "postpone"
      : "advance"
    : null;

  const availableReasons = reasons.filter(
    (r) => !direction || r.direction === "any" || r.direction === direction
  );

  const reason = reasons.find((r) => r.code === reasonCode);

  // لو الاتجاه اتغير والسبب المختار مبقاش مناسب، نفضّيه
  useEffect(() => {
    if (reasonCode && direction && reason && reason.direction !== "any" && reason.direction !== direction) {
      setReasonCode("");
    }
  }, [direction, reasonCode, reason]);

  const todayStr = todayLocalIso();
  const isPastTarget = target ? target.batch_date < todayStr : false;

  const options = allBatches
    .filter((b) => b.id !== currentBatch.id)
    .map((b) => ({
      value: b.id,
      label: `${batchLabel(b)} ${b.batch_date < currentBatch.batch_date ? "(سابقة)" : "(لاحقة)"}${
        b.is_active ? "" : " - غير نشطة"
      }`,
    }));

  const selectedLabel = options.find((o) => o.value === targetBatch)?.label ?? "";

  function submit() {
    setLocalError("");

    if (!target) return setLocalError("اختر دفعة الترحيل.");
    if (!reason) return setLocalError("اختر سبب الترحيل.");
    if (reason.requires_reference && !referenceNumber.trim())
      return setLocalError("رقم الإشارة / القرار مطلوب للسبب ده.");
    if (reason.code === "OTHER" && !notes.trim()) return setLocalError("اكتب تفاصيل السبب في الملاحظات.");

    onConfirm({
      toBatchId: target.id,
      targetLabel: batchLabel(target),
      reasonCode: reason.code,
      reasonName: reason.name,
      referenceNumber: referenceNumber.trim(),
      referenceDate,
      penaltyDays: reason.asks_penalty_days && penaltyDays.trim() ? Number(penaltyDays) : null,
      notes: notes.trim(),
      revertsTransferId: revert?.transfer.id ?? null,
    });
  }

  const inputStyle: React.CSSProperties = { ...F, fontSize: 14, color: "#2d3648" };
  const inputClass = "w-full h-[44px] rounded-[8px] border border-[#e2e7f0] px-3 outline-none focus:border-[#00b867]";

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div
        className="bg-white rounded-[24px] p-6 w-full max-w-md flex flex-col gap-4 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ background: "#dcfce7" }}>
            {revert ? (
              <Undo2 size={20} style={{ color: "#00b867" }} />
            ) : (
              <ArrowLeftRight size={20} style={{ color: "#00b867" }} />
            )}
          </div>
          <button type="button" onClick={onCancel} disabled={saving} className="text-[#aaa] hover:text-[#555]">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-1 items-center text-center">
          <p style={{ ...F, fontSize: 18, color: "#122b16", fontWeight: 700 }}>
            {revert ? "إلغاء ترحيل الفرد" : "ترحيل أفراد لدفعة أخرى"}
          </p>
          <p style={{ ...F, fontSize: 13, color: "#404040" }}>
            {revert
              ? `${revert.soldier.militaryId} - ${revert.soldier.name}`
              : `عدد الأفراد المحددين: ${count.toLocaleString("ar-EG")}`}
          </p>
        </div>

        {loading ? (
          <div className="py-6 text-center" style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
            جاري التحميل...
          </div>
        ) : (
          <>
            {/* الدفعة */}
            <div className="flex flex-col gap-1.5">
              <label style={{ ...F, fontSize: 13, color: "#717d96" }}>دفعة الترحيل *</label>
              <GenericDropdown
                value={selectedLabel}
                options={options}
                onChange={setTargetBatch}
                placeholder="اختر الدفعة"
              />
            </div>

            {direction && (
              <div
                className="rounded-[10px] px-3 py-2 flex flex-col gap-1"
                style={{
                  background: direction === "postpone" ? "#fff8e8" : "#e8f0fe",
                  color: direction === "postpone" ? "#8a6500" : "#172e78",
                }}
              >
                <span style={{ ...F, fontSize: 13, fontWeight: 700 }}>
                  {direction === "postpone"
                    ? "تأجيل لدفعة لاحقة"
                    : "تقديم لدفعة سابقة"}{" "}
                  ({formatBatchDate(currentBatch.batch_date)} ← {formatBatchDate(target!.batch_date)})
                </span>
                {isPastTarget && (
                  <span style={{ ...F, fontSize: 12 }}>
                    تاريخ الدفعة دي عدّى، يعني الفرد هيبقى مستحق الخروج بأثر رجعي، ولازم تستكمل إجراءاته فيها.
                  </span>
                )}
                {target && !target.is_active && (
                  <span style={{ ...F, fontSize: 12 }}>
                    الدفعة دي غير نشطة، وهتتفعل تاني تلقائيًا علشان الفرد يظهر فيها.
                  </span>
                )}
              </div>
            )}

            {/* السبب */}
            <div className="flex flex-col gap-1.5">
              <label style={{ ...F, fontSize: 13, color: "#717d96" }}>سبب الترحيل *</label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                disabled={!direction}
                className={`${inputClass} bg-white disabled:bg-[#f5f6f8]`}
                style={inputStyle}
              >
                <option value="">{direction ? "اختر السبب" : "اختر الدفعة الأول"}</option>
                {availableReasons.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* المرجع */}
            {reason && (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label style={{ ...F, fontSize: 13, color: "#717d96" }}>
                    رقم الإشارة / القرار {reason.requires_reference ? "*" : ""}
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={{ ...F, fontSize: 13, color: "#717d96" }}>تاريخها</label>
                  <input
                    type="date"
                    value={referenceDate}
                    onChange={(e) => setReferenceDate(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {reason?.asks_penalty_days && (
              <div className="flex flex-col gap-1.5">
                <label style={{ ...F, fontSize: 13, color: "#717d96" }}>مدة المؤثر (بالأيام)</label>
                <input
                  type="number"
                  min={1}
                  value={penaltyDays}
                  onChange={(e) => setPenaltyDays(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            )}

            {reason && (
              <div className="flex flex-col gap-1.5">
                <label style={{ ...F, fontSize: 13, color: "#717d96" }}>
                  ملاحظات {reason.code === "OTHER" ? "*" : "(اختياري)"}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-[8px] border border-[#e2e7f0] px-3 py-2 outline-none focus:border-[#00b867] resize-none"
                  style={inputStyle}
                />
              </div>
            )}

            <p style={{ ...F, fontSize: 12, color: "#94a3b8" }}>
              بيانات الكارنيه والرخصة والنموذج (1س) والتعبئة بتنتقل مع الفرد للدفعة الجديدة.
            </p>

            {localError && (
              <p style={{ ...F, fontSize: 13, color: "#9d2e15", fontWeight: 700 }}>{localError}</p>
            )}

            <button
              type="button"
              disabled={saving || !targetBatch || !reasonCode}
              onClick={submit}
              className="w-full h-[52px] rounded-[8px] flex items-center justify-center disabled:opacity-50"
              style={{ background: "linear-gradient(to bottom, #00b867, #00522e)" }}
            >
              <span style={{ ...F, fontSize: 16, color: "#fff" }}>
                {saving ? "جاري الترحيل..." : revert ? "إلغاء الترحيل وإعادة الفرد" : "حفظ وترحيل الأفراد"}
              </span>
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

/* =========================================================
   TRANSFER HISTORY DIALOG
   ========================================================= */

function TransferHistoryDialog({
  soldier,
  onClose,
}: {
  soldier: Soldier;
  onClose: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4" dir="rtl" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] p-5 w-full max-w-lg flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <History size={18} style={{ color: "#2d3648" }} />
          <span className="flex-1" style={{ ...F, fontSize: 17, fontWeight: 700, color: "#2d3648" }}>
            سجل الترحيلات - {soldier.militaryId}
          </span>
          <button type="button" onClick={onClose} className="text-[#aaa] hover:text-[#555]">
            <X size={20} />
          </button>
        </div>

        {soldier.transfers.map((t) => (
          <div
            key={t.id}
            className="rounded-[12px] border p-3 flex flex-col gap-1"
            style={{ borderColor: t.direction === "postpone" ? "#f4d58d" : "#c7d7fe" }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2 py-0.5 rounded-full"
                style={{
                  ...F,
                  fontSize: 11,
                  fontWeight: 700,
                  background: t.direction === "postpone" ? "#fff8e8" : "#e8f0fe",
                  color: t.direction === "postpone" ? "#8a6500" : "#172e78",
                }}
              >
                {t.direction === "postpone" ? "تأجيل" : "تقديم"}
              </span>
              <span style={{ ...F, fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                {t.fromDate ? formatBatchDate(t.fromDate) : "-"} ← {formatBatchDate(t.toDate)}
              </span>
              <span className="mr-auto" style={{ ...F, fontSize: 11, color: "#94a3b8" }}>
                {new Date(t.createdAt).toLocaleDateString("ar-EG")}
              </span>
            </div>

            <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>السبب: {t.reasonName}</span>

            {(t.referenceNumber || t.referenceDate) && (
              <span style={{ ...F, fontSize: 12, color: "#717d96" }}>
                المرجع: {t.referenceNumber || "-"}
                {t.referenceDate ? ` بتاريخ ${formatBatchDate(t.referenceDate)}` : ""}
              </span>
            )}

            {t.penaltyDays && (
              <span style={{ ...F, fontSize: 12, color: "#717d96" }}>
                مدة المؤثر: {t.penaltyDays.toLocaleString("ar-EG")} يوم
              </span>
            )}

            {t.notes && <span style={{ ...F, fontSize: 12, color: "#717d96" }}>ملاحظات: {t.notes}</span>}

            {t.removedFromShipment && (
              <span style={{ ...F, fontSize: 11, color: "#9a3412" }}>
                اتشال من إرسالية السجلات العسكرية بتاعة الدفعة القديمة.
              </span>
            )}
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}

/* =========================================================
   PRINT COLUMNS DIALOG
   ========================================================= */

function PrintColumnsDialog({
  columns,
  selectedColumns,
  onToggleColumn,
  onSelectAll,
  onClearAll,
  onCancel,
  onConfirm,
}: {
  columns: { id: string; label: string }[];
  selectedColumns: Set<string>;
  onToggleColumn: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4"
      dir="rtl"
    >
      <div
        className="bg-white rounded-[16px] p-5 w-full max-w-md flex flex-col gap-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex-1 text-right"
            style={{
              ...F,
              fontSize: 18,
              color: "#333",
              fontWeight: 700,
            }}
          >
            اختر أعمدة الطباعة
          </span>

          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 text-[#aaa] hover:text-[#555]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 justify-start">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-sm underline"
            style={{ ...F, fontSize: 13, color: "#1f3d97" }}
          >
            تحديد الكل
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="text-sm underline"
            style={{ ...F, fontSize: 13, color: "#717d96" }}
          >
            إلغاء التحديد
          </button>
        </div>

        <div
          className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto"
          dir="rtl"
        >
          {columns.map((col) => {
            const checked = selectedColumns.has(col.id);

            return (
              <button
                key={col.id}
                type="button"
                onClick={() => onToggleColumn(col.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-[#e2e7f0] hover:bg-[#f5f6fb] transition-colors text-right"
              >
                {checked ? (
                  <CheckSquare size={16} style={{ color: "#1f3d97" }} />
                ) : (
                  <Square size={16} style={{ color: "#a1aebe" }} />
                )}

                <span style={{ ...F, fontSize: 13, color: "#2d3648" }}>
                  {col.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 justify-start">
          <button
            type="button"
            onClick={onConfirm}
            disabled={selectedColumns.size === 0}
            className="px-4 py-2 rounded-[8px] disabled:opacity-50"
            style={{
              background:
                "linear-gradient(to bottom, #00b867, #00522e)",
              ...F,
              fontSize: 15,
              color: "#fff",
            }}
          >
            طباعة
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-[8px]"
            style={{
              ...F,
              fontSize: 15,
              color: "#888",
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* =========================================================
   SORT ICON
   ========================================================= */

function SortIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
    >
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

/* =========================================================
   MAIN PAGE
   ========================================================= */

export function ReserveBatchesPage() {
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const [autoLoadPending, setAutoLoadPending] = useState<boolean>(
    Boolean((location.state as any)?.batchDate)
  );
  const [batches, setBatches] =
    useState<ReserveBatch[]>([]);

  const [loadingBatches, setLoadingBatches] =
    useState(true);

  const [batchError, setBatchError] =
    useState("");

  const [selectedBatch, setSelectedBatch] =
    useState("");

  const [showResults, setShowResults] =
    useState(false);

  const [checkedRows, setCheckedRows] =
    useState<Set<string>>(new Set());

  const [showEndDialog, setShowEndDialog] =
    useState(false);

  const [
    showTransferDialog,
    setShowTransferDialog,
  ] = useState(false);

  const [successMsg, setSuccessMsg] =
    useState("");

  const [soldierData, setSoldierData] =
    useState<Soldier[]>([]);

  const [saving, setSaving] =
    useState(false);
  // ✅ نسخة من بيانات الأفراد "زي ما جت من قاعدة البيانات" قبل أي تعديل
  // بنستخدمها وقت الحفظ عشان نعرف إيه اللي اتغيّر بالظبط
  const originalSoldierDataRef =
    useRef<Map<string, Soldier>>(new Map());

  // ─────────────────────────────────────────────────────────
  // تتبّع التعديلات غير المحفوظة
  // ─────────────────────────────────────────────────────────
  // بنقارن كل صف في الجدول بنسخته الأصلية (originalSoldierDataRef)
  // على نفس الحقول اللي فعليًا بتتحفظ (الكارنيه/الرخصة/محو الأمية/
  // مراجعة النموذج وملاحظاته)
  const { setDirty, guardNavigation, setPerformingSensitiveOperation } = useUnsavedChanges();

  // ⭐ عملية حساسة (تعديل مستندات/إنهاء خدمة/ترحيل دفعة رديف)
  useEffect(() => {
    setPerformingSensitiveOperation(true);
    return () => {
      setPerformingSensitiveOperation(false);
    };
  }, [setPerformingSensitiveOperation]);

  const isDirty = useMemo(() => {
    return soldierData.some((soldier) => {
      const original = originalSoldierDataRef.current.get(soldier.id);
      if (!original) return false;

      return (
        original.receivedKariza !== soldier.receivedKariza ||
        original.receivedLicense !== soldier.receivedLicense ||
        original.receivedLiteracy !== soldier.receivedLiteracy ||
        original.model1sReview !== soldier.model1sReview ||
        (original.model1sNotes ?? "") !== (soldier.model1sNotes ?? "") ||
        original.mobilization1 !== soldier.mobilization1 ||
        original.mobilization2 !== soldier.mobilization2
      );
    });
  }, [soldierData]);

  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  // رسالة الخطأ بتختفي لوحدها بعد ٨ ثواني
  useEffect(() => {
    if (!batchError) return;
    const timer = window.setTimeout(() => setBatchError(""), 8000);
    return () => window.clearTimeout(timer);
  }, [batchError]);

  useEffect(() => {
    return () => setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ إعدادات طباعة الأعمدة: قائمة كل الأعمدة القابلة للطباعة
  const PRINT_COLUMNS: {
    id: string;
    label: string;
  }[] = [
    { id: "index", label: "م" },
    { id: "militaryId", label: "رقم عسكري" },
    { id: "rank", label: "درجة" },
    { id: "name", label: "اسم" },
    { id: "unit", label: "الوحدة" },
    { id: "kariza", label: "استلام كارنيه" },
    { id: "license", label: "استلام رخصة" },
    { id: "literacy", label: "استلام محو الأمية" },
    { id: "model1s", label: "مراجعة النموذج (1س)" },
    { id: "model1sNotes", label: "ملاحظات النموذج (1س)" },
    { id: "mobilization1", label: "التعبئة الأولى" },
    { id: "mobilization2", label: "التعبئة الثانية" },
    { id: "records", label: "الإرسال للسجلات" },
    { id: "certificate", label: "شهادة إنهاء الخدمة" },
    { id: "transfer", label: "الترحيل" },
    { id: "status", label: "حالة الفرد" },
  ];

  const [selectedPrintColumns, setSelectedPrintColumns] =
    useState<Set<string>>(new Set(PRINT_COLUMNS.map((c) => c.id)));
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // شهادة إنهاء الخدمة
  const [certTarget, setCertTarget] = useState<Soldier | null>(null);

  // الترحيل
  const [revertTarget, setRevertTarget] = useState<RevertTarget | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Soldier | null>(null);
  const [savingCert, setSavingCert] = useState(false);

  // ✅ فلتر الوحدة: يعمل على الوحدات الموجودة فعليًا داخل الأفراد
  // المحمّلين حاليًا في الجدول (مش استعلام منفصل لجدول units).
  const [unitFilter, setUnitFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  // ✅ بحث بالرقم العسكري: مطابقة جزئية (includes) مش شرط كتابته كامل.
  const [militarySearch, setMilitarySearch] = useState("");

  // ✅ فلاتر حالة المستندات ومراجعة النموذج (1س)
  const [karizaFilter, setKarizaFilter] = useState<DocumentState | "">("");
  const [licenseFilter, setLicenseFilter] = useState<DocumentState | "">("");
  const [literacyFilter, setLiteracyFilter] = useState<DocumentState | "">("");
  const [model1sFilter, setModel1sFilter] = useState<Model1sReviewState | "">("");

  /* =========================================================
     allChecked أصبح قيمة محسوبة
     وليس state منفصل
     ========================================================= */

  /* =========================================================
     تحميل الدفعات
     ========================================================= */

  useEffect(() => {
 async function loadBatches() {
  setLoadingBatches(true);
  setBatchError("");

  const { data, error } = await supabase
    .from("reserve_batches")
    .select("id, batch_date, name, is_active")
    .eq("is_active", true) // جلب الدفعات النشطة فقط
    .order("batch_date", {
      ascending: true,
    });

  if (error) {
    setBatchError(
      `خطأ في قراءة دفعات الرديف: ${error.message}`
    );
    setBatches([]);
    setLoadingBatches(false);
    return;
  }

  const rows: ReserveBatch[] = (data ?? []).map(
    (row: any) => ({
      id: row.id,
      batch_date: row.batch_date,
      name: row.name,
      is_active: row.is_active === true,
    })
  );

 setBatches(rows);

  const targetDate = (location.state as any)?.batchDate as
    | string
    | undefined;

  const matchedBatch = targetDate
    ? rows.find((b) => b.batch_date === targetDate)
    : null;

  if (matchedBatch) {
    setSelectedBatch(matchedBatch.id);
  } else if (rows.length > 0) {
    setSelectedBatch(rows[0].id);
  } else {
    setSelectedBatch("");
  }

  if (!matchedBatch) {
    setAutoLoadPending(false);
  }

  setLoadingBatches(false);
}

    loadBatches();
  }, []);

  const selectedBatchObject =
    batches.find(
      (b) => b.id === selectedBatch
    );
    useEffect(() => {
    if (!autoLoadPending) return;
    if (!selectedBatchObject) return;

    setAutoLoadPending(false);
    loadSoldiers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoadPending, selectedBatchObject]);

  const batchOptions = batches.map(
    (batch) => ({
      value: batch.id,
      label:
        batch.name ||
        `دفعة ${formatBatchDate(
          batch.batch_date
        )}`,
    })
  );

  const selectedBatchLabel =
    selectedBatchObject
      ? selectedBatchObject.name ||
        `دفعة ${formatBatchDate(
          selectedBatchObject.batch_date
        )}`
      : "";

  /* =========================================================
     تحميل الأفراد
     ========================================================= */

  async function loadSoldiers() {
    if (!selectedBatchObject) {
      setBatchError(
        "يرجى اختيار دفعة أولاً"
      );
      return;
    }

    setShowResults(true);
    setBatchError("");

    // ✅ إعادة ضبط الفلاتر عند تحميل دفعة جديدة
    setUnitFilter("");
    setMilitarySearch("");

    let data: any[] = [];
    let error: any = null;

    try {
      data = await fetchAllRows((from, to) =>
        supabase
          .from("personnel")
          .select(`
            id,
            military_number,
            full_name,
            discharge_date,
            is_active,
            service_status_id,
            rank_id,
            primary_unit_id,
            education_level_id,
            units:primary_unit_id (
              id,
              name
            ),
            education_level:education_levels!education_level_id (
              id,
              requires_literacy_certificate
            ),
            rank:ranks ( name ),
            service_status:service_statuses ( code )
          `)
          .eq("discharge_date", selectedBatchObject.batch_date)
          .order("full_name", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to)
      );
    } catch (err) {
      error = err;
    }

    if (error) {
      console.error(
        "personnel error:",
        error
      );

      setBatchError(
        `حدث خطأ أثناء جلب الأفراد: ${error.message}`
      );

      setSoldierData([]);
      
      
      return;
      
    }
    

    const personnel = data ?? [];

    if (personnel.length === 0) {
      setSoldierData([]);
      setCheckedRows(new Set());
      return;
    }

    const personnelIds =
      personnel.map(
        (person: any) =>
          person.id
      );

    // كل مستندات الدفعة على صفحات (من غير .in علشان طول الرابط)
    let documents: any[] = [];
    let documentsError: any = null;

    try {
      const personnelIdSet = new Set(personnelIds);

      const allBatchDocuments = await fetchAllRows((from, to) =>
        supabase
          .from("reserve_batch_documents")
          .select("id, personnel_id, document_type, status, notes")
          .eq("reserve_batch_id", selectedBatchObject.id)
          .order("id", { ascending: true })
          .range(from, to)
      );

      documents = allBatchDocuments.filter((d: any) => personnelIdSet.has(d.personnel_id));
    } catch (err) {
      documentsError = err;
    }

    if (documentsError) {
      console.error(
        "reserve_batch_documents error:",
        documentsError
      );

      setBatchError(
        `حدث خطأ أثناء جلب حالات المستندات: ${documentsError.message}`
      );

      return;
    }

    const documentMap = new Map<
      string,
      {
        kariza?: string;
        license?: string;
        literacy?: string;
        model1s?: string;
        model1sNotes?: string | null;
      }
    >();

    (documents ?? []).forEach(
      (doc: any) => {
        if (
          !documentMap.has(
            doc.personnel_id
          )
        ) {
          documentMap.set(
            doc.personnel_id,
            {}
          );
        }

        const current =
          documentMap.get(
            doc.personnel_id
          )!;

        if (
          doc.document_type ===
          "KARIZA"
        ) {
          current.kariza =
            doc.status;
        }

        if (
          doc.document_type ===
          "LICENSE"
        ) {
          current.license =
            doc.status;
        }

        if (
          doc.document_type ===
          "LITERACY"
        ) {
          current.literacy =
            doc.status;
        }

        if (
          doc.document_type ===
          "MODEL_1S"
        ) {
          current.model1s =
            doc.status;

          current.model1sNotes =
            doc.notes;
        }
      }
    );

    // أرقام التعبئة + الشهادات
    const [mobilizationRows, certificateRows, transferRows] = await Promise.all([
      fetchAllRows((from, to) =>
        supabase
          .from("reserve_batch_mobilization")
          .select("personnel_id, first_number, second_number")
          .eq("reserve_batch_id", selectedBatchObject.id)
          .order("personnel_id", { ascending: true })
          .range(from, to)
      ).catch(() => [] as any[]),

      fetchByIdsInChunks(personnelIds, (chunk, from, to) =>
        supabase
          .from("service_end_certificates")
          .select("id, personnel_id, certificate_number, certificate_date")
          .in("personnel_id", chunk)
          .order("id", { ascending: true })
          .range(from, to)
      ).catch(() => [] as any[]),

      fetchByIdsInChunks(personnelIds, (chunk, from, to) =>
        supabase
          .from("personnel_batch_transfers")
          .select(
            "id, personnel_id, from_batch_id, from_date, to_date, direction, reference_number, reference_date, penalty_days, notes, removed_from_shipment, created_at, reason:reason_code(name)"
          )
          .in("personnel_id", chunk)
          .order("created_at", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to)
      ).catch(() => [] as any[]),
    ]);

    const mobilizationRes = { data: mobilizationRows };
    const certificatesRes = { data: certificateRows };
    const transfersRes = { data: transferRows };

    const transfersMap = new Map<string, TransferRecord[]>();
    (transfersRes.data ?? []).forEach((row: any) => {
      const reasonRow = Array.isArray(row.reason) ? row.reason[0] : row.reason;
      const list = transfersMap.get(row.personnel_id) ?? [];
      list.push({
        id: row.id,
        fromBatchId: row.from_batch_id,
        fromDate: row.from_date,
        toDate: row.to_date,
        direction: row.direction,
        reasonName: reasonRow?.name ?? "-",
        referenceNumber: row.reference_number,
        referenceDate: row.reference_date,
        penaltyDays: row.penalty_days,
        notes: row.notes,
        removedFromShipment: row.removed_from_shipment === true,
        createdAt: row.created_at,
      });
      transfersMap.set(row.personnel_id, list);
    });
    const mobilizationMap = new Map<string, { first: string; second: string }>();
    (mobilizationRes.data ?? []).forEach((row: any) =>
      mobilizationMap.set(row.personnel_id, {
        first: row.first_number ?? "",
        second: row.second_number ?? "",
      })
    );

    const certificateMap = new Map<string, any>();
    (certificatesRes.data ?? []).forEach((row: any) => certificateMap.set(row.personnel_id, row));

    const mapped: Soldier[] =
      personnel.map(
        (person: any) => {
          const docs =
            documentMap.get(
              person.id
            );

          return {
            id: person.id,

            militaryId:
              person.military_number ||
              "-",

            rank:
              (Array.isArray(person.rank) ? person.rank[0]?.name : person.rank?.name) ||
              "جندي",

            name:
              person.full_name ||
              "-",

            unit:
              person.units?.name ||
              "-",

            receivedKariza:
              dbStateToDocumentState(
                docs?.kariza ||
                  null
              ),

                       receivedLicense:
              dbStateToDocumentState(
                docs?.license ||
                  null
              ),

            receivedLiteracy:
              dbStateToDocumentState(
                docs?.literacy ||
                  null
              ),

            requiresLiteracy:
              person.education_level
                ?.requires_literacy_certificate ===
              true,

            // ✅ FIX: بنعتمد على service_status_id فقط كمصدر وحيد للحقيقة
            // بخصوص حالة الفرد (بالخدمة / منتهي خدمته)، بنفس المنطق
            // المستخدم في SoldierDetailPage، بدل الاعتماد على is_active
            // اللي ممكن يكون غير متزامن مع service_status_id لو اتعدّل
            // الفرد من صفحة تانية (زي صفحة تعديل بيانات الفرد).
            status:
              (Array.isArray(person.service_status)
                ? person.service_status[0]?.code
                : person.service_status?.code) === "DISCHARGED"
                ? "منتهي خدمته"
                : "بالخدمة",

            // ✅ مراجعة النموذج (1س) + ملاحظاتها
            model1sReview:
              dbToModel1sState(
                docs?.model1s ||
                  null
              ),

            model1sNotes:
              docs?.model1sNotes ||
              "",

            unitId: person.units?.id ?? person.primary_unit_id ?? null,
            mobilization1: mobilizationMap.get(person.id)?.first ?? "",
            mobilization2: mobilizationMap.get(person.id)?.second ?? "",
            sentToRecordsAt: null, // بيتحدّث من قسم إجراءات الدفعة
            certificateId: certificateMap.get(person.id)?.id ?? null,
            certificateNumber: certificateMap.get(person.id)?.certificate_number ?? null,
            certificateDate: certificateMap.get(person.id)?.certificate_date ?? null,
            transfers: transfersMap.get(person.id) ?? [],
          };
        }
      );

    setSoldierData(mapped);
    setCheckedRows(new Set());

    // ✅ نحفظ نسخة "قبل التعديل" من كل فرد، عشان نقارن بيها وقت الحفظ
    const snapshot = new Map<string, Soldier>();
    mapped.forEach((s) => snapshot.set(s.id, { ...s }));
    originalSoldierDataRef.current = snapshot;

    const { userId, userName } = await getCurrentUserInfo();

await logActivity({
  userId,
  userName,
  actionType: "QUERY",
  action: "بحث عن دفعة رديف",
  entity: "reserve_batches",
  details: JSON.stringify({
    queryBasis: "دفعة الرديف",
    queryValue:
      selectedBatchObject.name ||
      formatBatchDate(selectedBatchObject.batch_date),
    resultsCount: mapped.length,
  }),
});
  }
const statusFilterOptions = [
    { value: "بالخدمة", label: "بالخدمة" },
    { value: "منتهي خدمته", label: "منتهي خدمته" },
  ];

  // ✅ خيارات فلاتر حالة المستندات ومراجعة النموذج (1س)
  const karizaFilterOptions = DEFAULT_DOCUMENT_OPTIONS.map((opt) => ({
    value: opt,
    label: opt,
  }));

  const licenseFilterOptions = DEFAULT_DOCUMENT_OPTIONS.map((opt) => ({
    value: opt,
    label: opt,
  }));

  const literacyFilterOptions: { value: DocumentState; label: string }[] = [
    { value: "تم الاستلام", label: "تم الاستلام" },
    { value: "لم يتم الاستلام", label: "لم يتم الاستلام" },
  ];

  const model1sFilterOptions = MODEL1S_OPTIONS.map((opt) => ({
    value: opt,
    label: opt,
  }));

  // ✅ هل فيه أي فلتر مفعّل حاليًا (بنستخدمها لتفعيل/تعطيل زرار إعادة التعيين)
  const hasActiveFilters =
    !!unitFilter ||
    !!statusFilter ||
    !!militarySearch.trim() ||
    !!karizaFilter ||
    !!licenseFilter ||
    !!literacyFilter ||
    !!model1sFilter;

  // ✅ إعادة تعيين كل الفلاتر للقيم الافتراضية (عرض الكل)
  function resetFilters() {
    setUnitFilter("");
    setStatusFilter("");
    setMilitarySearch("");
    setKarizaFilter("");
    setLicenseFilter("");
    setLiteracyFilter("");
    setModel1sFilter("");
  }
  /* =========================================================
     ✅ قائمة الوحدات لفلتر الجدول
     مبنية من الوحدات الموجودة فعليًا في الأفراد المحمّلين حاليًا
     (مش استعلام منفصل لجدول units)
     ========================================================= */

  const unitFilterOptions = useMemo(() => {
    const uniqueNames = Array.from(
      new Set(
        soldierData
          .map((s) => s.unit)
          .filter(
            (name) =>
              !!name && name !== "-"
          )
      )
    ).sort((a, b) =>
      a.localeCompare(b, "ar")
    );

    return uniqueNames.map((name) => ({
      value: name,
      label: name,
    }));
  }, [soldierData]);

  /* =========================================================
     ✅ الأفراد بعد تطبيق فلتر الوحدة + بحث الرقم العسكري
     ========================================================= */
const filteredSoldierData = useMemo(() => {
    const searchTerm = militarySearch
      .trim();

    return soldierData.filter(
      (soldier) => {
        if (
          unitFilter &&
          soldier.unit !== unitFilter
        ) {
          return false;
        }

        if (
          statusFilter &&
          soldier.status !== statusFilter
        ) {
          return false;
        }

        if (
          karizaFilter &&
          soldier.receivedKariza !== karizaFilter
        ) {
          return false;
        }

        if (
          licenseFilter &&
          soldier.receivedLicense !== licenseFilter
        ) {
          return false;
        }

        if (
          literacyFilter &&
          soldier.receivedLiteracy !== literacyFilter
        ) {
          return false;
        }

        if (
          model1sFilter &&
          soldier.model1sReview !== model1sFilter
        ) {
          return false;
        }

        if (
          searchTerm &&
          !soldier.militaryId.includes(
            searchTerm
          )
        ) {
          return false;
        }

        return true;
      }
    );
  }, [
    soldierData,
    unitFilter,
    statusFilter,
    karizaFilter,
    licenseFilter,
    literacyFilter,
    model1sFilter,
    militarySearch,
  ]);

  const allChecked =
    filteredSoldierData.length > 0 &&
    filteredSoldierData.every((s) =>
      checkedRows.has(s.id)
    );

  /* =========================================================
     اختيار فرد
     ========================================================= */

  function toggleRow(id: string) {
    setCheckedRows((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  /* =========================================================
     تحديد الكل
     ✅ يعمل على الأفراد الظاهرين حاليًا بعد الفلترة فقط
     ========================================================= */

  function toggleAll() {
    setCheckedRows((prev) => {
      const next = new Set(prev);

      if (allChecked) {
        filteredSoldierData.forEach(
          (s) => next.delete(s.id)
        );
      } else {
        filteredSoldierData.forEach(
          (s) => next.add(s.id)
        );
      }

      return next;
    });
  }

  /* =========================================================
     تعديل المستند
     ========================================================= */

  function toggleSoldierField(
    id: string,
    field:
      | "receivedKariza"
      | "receivedLicense"
      | "receivedLiteracy"
      | "model1sReview",
    value: DocumentState | Model1sReviewState
  ) {
    setSoldierData((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              [field]: value,
              // ✅ لو حالة مراجعة النموذج (1س) اتغيرت من "به ملاحظات"
              // لأي حالة تانية، نصفّر نص الملاحظات تلقائيًا
              ...(field === "model1sReview" &&
              value !== "به ملاحظات"
                ? { model1sNotes: "" }
                : {}),
            }
          : s
      )
    );
  }

  /* =========================================================
     تعديل ملاحظات مراجعة النموذج (1س)
     ========================================================= */

  function updateSoldierModel1sNotes(
    id: string,
    value: string
  ) {
    setSoldierData((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, model1sNotes: value }
          : s
      )
    );
  }

  /* =========================================================
     حفظ التعديلات
     ========================================================= */

  function updateSoldierMobilization(
    id: string,
    field: "mobilization1" | "mobilization2",
    value: string
  ) {
    setSoldierData((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  // تاريخ الإرسال للسجلات (بيوصل من قسم إجراءات الدفعة)
  function applyRecordsMap(map: Record<string, string>) {
    setSoldierData((prev) => prev.map((s) => ({ ...s, sentToRecordsAt: map[s.id] ?? null })));
  }

  async function recordCertificate(number: string, date: string) {
    if (!certTarget || !selectedBatchObject) return;

    setSavingCert(true);
    setBatchError("");

    const { data, error } = await supabase.rpc("record_reserve_batch_certificate", {
      p_batch_id: selectedBatchObject.id,
      p_personnel_id: certTarget.id,
      p_number: number,
      p_date: date,
    });

    setSavingCert(false);

    if (error) {
      setBatchError(error.message);
      return;
    }

    const targetId = certTarget.id;
    const patch = { certificateId: data as string, certificateNumber: number, certificateDate: date };

    setSoldierData((prev) => prev.map((s) => (s.id === targetId ? { ...s, ...patch } : s)));
    const original = originalSoldierDataRef.current.get(targetId);
    if (original) originalSoldierDataRef.current.set(targetId, { ...original, ...patch });

    const { userId, userName } = await getCurrentUserInfo();
    await logActivity({
      userId,
      userName,
      actionType: "UPDATE",
      action: "تسجيل شهادة إنهاء خدمة",
      entity: "service_end_certificates",
      details: `${certTarget.militaryId} - شهادة رقم ${number}`,
    });

    setCertTarget(null);
    setSuccessMsg("تم تسجيل شهادة إنهاء الخدمة.");
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  async function deleteCertificate(soldier: Soldier) {
    if (!soldier.certificateId) return;
    if (!window.confirm(`حذف شهادة إنهاء الخدمة رقم ${soldier.certificateNumber} للفرد ${soldier.militaryId}؟`)) return;

    const { error } = await supabase.rpc("delete_reserve_batch_certificate", {
      p_certificate_id: soldier.certificateId,
    });

    if (error) {
      setBatchError(error.message);
      return;
    }

    const patch = { certificateId: null, certificateNumber: null, certificateDate: null };
    setSoldierData((prev) => prev.map((s) => (s.id === soldier.id ? { ...s, ...patch } : s)));
    const original = originalSoldierDataRef.current.get(soldier.id);
    if (original) originalSoldierDataRef.current.set(soldier.id, { ...original, ...patch });
  }

   async function handleSaveChanges() {
    if (!selectedBatchObject) {
      setBatchError("يرجى اختيار دفعة أولاً");
      return;
    }

    if (soldierData.length === 0) {
      setSuccessMsg("لا توجد بيانات لحفظها");
      setTimeout(() => setSuccessMsg(""), 3000);
      return;
    }

    setSaving(true);
    setBatchError("");

    try {
      const documentsToSave: any[] = [];

      // ✅ هنا هنجمع كل سطر تغيير حصل، عشان نحفظه بعدين في سجل العمليات
      const changeLines: string[] = [];

      const canUpdateDocuments = hasPermission(
        "reserve_batches:update_documents"
      );

      const canUpdateLiteracy = hasPermission(
        "reserve_batches:update_literacy"
      );

      const canUpdateModel1s =
        hasPermission("reserve_batches:update_model1s_review") ||
        hasPermission("reserve_batches:update_model1s_notes");

      soldierData.forEach((soldier) => {
        // القيمة الأصلية بتاعت الفرد ده قبل أي تعديل
        const original = originalSoldierDataRef.current.get(soldier.id);

        if (canUpdateDocuments) {
          documentsToSave.push({
            personnel_id: soldier.id,
            reserve_batch_id: selectedBatchObject.id,
            document_type: "KARIZA",
            status: documentStateToDb(soldier.receivedKariza),
            updated_at: new Date().toISOString(),
          });

          if (
            original &&
            original.receivedKariza !== soldier.receivedKariza
          ) {
            changeLines.push(
              `تحديث بيانات ${soldier.militaryId} حقل ${FIELD_LABELS.receivedKariza} من ${original.receivedKariza} إلي ${soldier.receivedKariza}`
            );
          }

          if (hasLicenseEligibility(soldier.militaryId)) {
            documentsToSave.push({
              personnel_id: soldier.id,
              reserve_batch_id: selectedBatchObject.id,
              document_type: "LICENSE",
              status: documentStateToDb(soldier.receivedLicense),
              updated_at: new Date().toISOString(),
            });

            if (
              original &&
              original.receivedLicense !== soldier.receivedLicense
            ) {
              changeLines.push(
                `تحديث بيانات ${soldier.militaryId} حقل ${FIELD_LABELS.receivedLicense} من ${original.receivedLicense} إلي ${soldier.receivedLicense}`
              );
            }
          }
        }

        if (canUpdateLiteracy && soldier.requiresLiteracy) {
          documentsToSave.push({
            personnel_id: soldier.id,
            reserve_batch_id: selectedBatchObject.id,
            document_type: "LITERACY",
            status: documentStateToDb(soldier.receivedLiteracy),
            updated_at: new Date().toISOString(),
          });

          if (
            original &&
            original.receivedLiteracy !== soldier.receivedLiteracy
          ) {
            changeLines.push(
              `تحديث بيانات ${soldier.militaryId} حقل ${FIELD_LABELS.receivedLiteracy} من ${original.receivedLiteracy} إلي ${soldier.receivedLiteracy}`
            );
          }
        }

        if (canUpdateModel1s) {
          documentsToSave.push({
            personnel_id: soldier.id,
            reserve_batch_id: selectedBatchObject.id,
            document_type: "MODEL_1S",
            status: model1sStateToDb(soldier.model1sReview),
            notes:
              soldier.model1sReview === "به ملاحظات"
                ? soldier.model1sNotes?.trim() || null
                : null,
            updated_at: new Date().toISOString(),
          });

          if (
            original &&
            original.model1sReview !== soldier.model1sReview
          ) {
            changeLines.push(
              `تحديث بيانات ${soldier.militaryId} حقل ${FIELD_LABELS.model1sReview} من ${original.model1sReview} إلي ${soldier.model1sReview}`
            );
          }

          // ✅ مقارنة الملاحظات بشكل منفصل
          const oldNotes =
            original?.model1sNotes?.trim() || "لا يوجد";

          const newNotes =
            soldier.model1sReview === "به ملاحظات"
              ? soldier.model1sNotes?.trim() || "لا يوجد"
              : "لا يوجد";

          if (original && oldNotes !== newNotes) {
            changeLines.push(
              `تحديث بيانات ${soldier.militaryId} حقل ${FIELD_LABELS.model1sNotes} من ${oldNotes} إلي ${newNotes}`
            );
          }
        }
      });

      // أرقام التعبئة (اللي اتغيرت بس)
      const canUpdateMobilization = hasPermission("reserve_batches:update_mobilization");

      const mobilizationToSave = canUpdateMobilization
        ? soldierData
            .filter((soldier) => {
              const original = originalSoldierDataRef.current.get(soldier.id);
              return (
                original &&
                (original.mobilization1 !== soldier.mobilization1 ||
                  original.mobilization2 !== soldier.mobilization2)
              );
            })
            .map((soldier) => {
              const original = originalSoldierDataRef.current.get(soldier.id)!;

              if (original.mobilization1 !== soldier.mobilization1) {
                changeLines.push(
                  `تحديث بيانات ${soldier.militaryId} حقل ${FIELD_LABELS.mobilization1} من ${original.mobilization1 || "لا يوجد"} إلي ${soldier.mobilization1 || "لا يوجد"}`
                );
              }

              if (original.mobilization2 !== soldier.mobilization2) {
                changeLines.push(
                  `تحديث بيانات ${soldier.militaryId} حقل ${FIELD_LABELS.mobilization2} من ${original.mobilization2 || "لا يوجد"} إلي ${soldier.mobilization2 || "لا يوجد"}`
                );
              }

              return {
                reserve_batch_id: selectedBatchObject.id,
                personnel_id: soldier.id,
                first_number: soldier.mobilization1.trim() || null,
                second_number: soldier.mobilization2.trim() || null,
                updated_at: new Date().toISOString(),
              };
            })
        : [];

      if (mobilizationToSave.length > 0) {
        const { error: mobilizationError } = await supabase
          .from("reserve_batch_mobilization")
          .upsert(mobilizationToSave, { onConflict: "reserve_batch_id,personnel_id" });

        if (mobilizationError) throw mobilizationError;
      }

      if (documentsToSave.length === 0 && !canUpdateMobilization) {
        setSuccessMsg("لا توجد لديك صلاحية لحفظ أي تعديلات");
        setTimeout(() => setSuccessMsg(""), 3000);
        setSaving(false);
        return;
      }

      if (documentsToSave.length > 0) {
        const { error } = await supabase
          .from("reserve_batch_documents")
          .upsert(documentsToSave, {
            onConflict: "personnel_id,reserve_batch_id,document_type",
          });

        if (error) {
          throw error;
        }
      }

      // ✅ نسجّل في سجل العمليات بس لو فيه تغييرات فعلية حصلت
      if (changeLines.length > 0) {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "UPDATE",
          action: "تحديث حالة الكارنيه/الرخصة للأفراد",
          entity: "reserve_batch_documents",
          details: changeLines.join("\n"),
        });
      }
      // ✅ بعد نجاح الحفظ، النسخة الحالية بقت هي "الأصلية" الجديدة
      const newSnapshot = new Map<string, Soldier>();
      soldierData.forEach((s) => newSnapshot.set(s.id, { ...s }));
      originalSoldierDataRef.current = newSnapshot;

      setDirty(false);

      setSuccessMsg("تم حفظ جميع التعديلات بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error: any) {
      console.error("save all documents error:", error);

      setBatchError(
        `حدث خطأ أثناء حفظ التعديلات: ${
          error?.message || "خطأ غير معروف"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     فتح Popup إنهاء الخدمة
     ========================================================= */

  function handleEndService() {
    console.log(
      "End Service clicked",
      checkedRows.size
    );

    if (checkedRows.size === 0) {
      setBatchError(
        "يرجى تحديد فرد واحد على الأقل"
      );
      return;
    }

    const withoutCertificate = soldierData.filter(
      (s) => checkedRows.has(s.id) && !s.certificateNumber
    );

    if (withoutCertificate.length > 0) {
      setBatchError(
        `لا يمكن إنهاء الخدمة: ${withoutCertificate.length.toLocaleString("ar-EG")} من الأفراد المحددين لم تُسجل لهم شهادة إنهاء الخدمة بعد.`
      );
      return;
    }

    setBatchError("");
    setShowEndDialog(true);
  }

  /* =========================================================
     تأكيد إنهاء الخدمة
     ========================================================= */

  async function confirmEndService() {
    if (!selectedBatchObject) {
      setBatchError("لم يتم اختيار الدفعة");
      return;
    }

    const ids = Array.from(checkedRows);

    if (ids.length === 0) {
      setShowEndDialog(false);
      setBatchError("يرجى تحديد فرد واحد على الأقل");
      return;
    }

    setSaving(true);
    setBatchError("");

    try {
      // كل التحقق والتنفيذ وسجل العمليات بيحصل في قاعدة البيانات
      const { data, error } = await supabase.rpc("end_reserve_batch_service", {
        p_batch_id: selectedBatchObject.id,
        p_personnel_ids: ids,
      });

      if (error) throw error;

      const result = (data ?? {}) as { ended?: number; already_discharged?: number };
      const ended = result.ended ?? 0;
      const already = result.already_discharged ?? 0;

      if (ended > 0) {
        const { userName } = await getCurrentUserInfo();

        await createNotification({
          title: "تم إنهاء خدمة أفراد",
          body: `تم إنهاء خدمة ${ended} فردًا من دفعة ${
            selectedBatchObject.name || formatBatchDate(selectedBatchObject.batch_date)
          }`,
          type: "warning",
          entityType: "reserve_batch",
          entityId: selectedBatchObject.id,
          userName,
        });
      }

      setShowEndDialog(false);
      setCheckedRows(new Set());

      setSuccessMsg(
        ended > 0
          ? `تم إنهاء خدمة ${ended.toLocaleString("ar-EG")} فرد بنجاح${
              already > 0 ? `، و${already.toLocaleString("ar-EG")} كانت خدمتهم منتهية بالفعل.` : "."
            }`
          : "كل الأفراد المحددين خدمتهم منتهية بالفعل."
      );

      setTimeout(() => setSuccessMsg(""), 5000);

      await loadSoldiers();
    } catch (error: any) {
      console.error("end service error:", error);
      setBatchError(`حدث خطأ أثناء إنهاء الخدمة: ${error?.message || "خطأ غير معروف"}`);
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     فتح Popup الترحيل
     ========================================================= */

  function handleTransfer() {
    console.log(
      "Transfer clicked",
      checkedRows.size
    );

    if (checkedRows.size === 0) {
      setBatchError(
        "يرجى تحديد فرد واحد على الأقل"
      );
      return;
    }

    setBatchError("");
    setRevertTarget(null);
    setShowTransferDialog(true);
  }

  /* =========================================================
     تأكيد الترحيل
     ========================================================= */

   async function confirmTransfer(payload: TransferPayload) {
    if (!selectedBatchObject) return;

    const ids = revertTarget ? [revertTarget.soldier.id] : Array.from(checkedRows);

    if (ids.length === 0) {
      setShowTransferDialog(false);
      setBatchError("يرجى تحديد فرد واحد على الأقل");
      return;
    }

    setSaving(true);
    setBatchError("");

    try {
      const { data, error } = await supabase.rpc("transfer_personnel_batch", {
        p_personnel_ids: ids,
        p_to_batch_id: payload.toBatchId,
        p_reason_code: payload.reasonCode,
        p_reference_number: payload.referenceNumber || null,
        p_reference_date: payload.referenceDate || null,
        p_penalty_days: payload.penaltyDays,
        p_notes: payload.notes || null,
        p_reverts_transfer_id: payload.revertsTransferId,
      });

      if (error) throw error;

      const result = (data ?? {}) as { moved?: number; removed_from_shipments?: number };

      const transferredSoldiers = soldierData.filter((s) => ids.includes(s.id));

      const changeLines = transferredSoldiers.map(
        (s) =>
          `تحديث بيانات ${s.militaryId} حقل دفعة الترحيل من ${selectedBatchLabel} إلي ${payload.targetLabel} - السبب: ${payload.reasonName}${
            payload.referenceNumber ? ` - المرجع: ${payload.referenceNumber}` : ""
          }`
      );

      const { userId, userName } = await getCurrentUserInfo();

      await logActivity({
        userId,
        userName,
        actionType: "UPDATE",
        action: revertTarget ? "إلغاء ترحيل فرد" : "ترحيل أفراد إلى دفعة أخرى",
        entity: "personnel",
        details: changeLines.join("\n"),
      });

      await createNotification({
        title: revertTarget ? "تم إلغاء ترحيل فرد" : "تم ترحيل أفراد",
        body: `تم ترحيل ${transferredSoldiers.length} فردًا إلى ${payload.targetLabel} (${payload.reasonName})`,
        type: "info",
        entityType: "reserve_batch",
        entityId: payload.toBatchId,
        userName,
      });

      setShowTransferDialog(false);
      setRevertTarget(null);
      setCheckedRows(new Set());

      const removed = result.removed_from_shipments ?? 0;

      setSuccessMsg(
        `تم ترحيل ${(result.moved ?? ids.length).toLocaleString("ar-EG")} فرد إلى ${payload.targetLabel} بنجاح${
          removed > 0
            ? `، واتشال ${removed.toLocaleString("ar-EG")} منهم من إرسالية السجلات العسكرية (محتاجين يتبعتوا تاني).`
            : "."
        }`
      );

      setTimeout(() => setSuccessMsg(""), 6000);

      await loadSoldiers();
    } catch (error: any) {
      console.error("transfer error:", error);
      setBatchError(`حدث خطأ أثناء ترحيل الأفراد: ${error?.message || "خطأ غير معروف"}`);
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     الطباعة
     ========================================================= */

  function togglePrintColumn(id: string) {
    setSelectedPrintColumns((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function selectAllPrintColumns() {
    setSelectedPrintColumns(
      new Set(PRINT_COLUMNS.map((c) => c.id))
    );
  }

  function clearAllPrintColumns() {
    setSelectedPrintColumns(new Set());
  }

  function confirmPrint() {
    setShowPrintDialog(false);
    void handlePrint();
  }

  async function handlePrint() {
  const { userId, userName } = await getCurrentUserInfo();

  await logActivity({
    userId,
    userName,
    actionType: "PRINT",
    action: "طباعة كشف دفعة الرديف",
    entity: "reserve_batches",
    details: JSON.stringify({
      queryValue: selectedBatchObject
        ? selectedBatchObject.name ||
          formatBatchDate(selectedBatchObject.batch_date)
        : "",
      resultsCount: filteredSoldierData.length,
    }),
  });

    const originalTitle = document.title;

  const batchLabel =
    selectedBatchObject?.name ||
    (selectedBatchObject
      ? formatBatchDate(selectedBatchObject.batch_date)
      : "");

  document.title = `كشف دفعة الرديف ${batchLabel}`;

  window.print();

  document.title = originalTitle;
}

  const thClass =
    "px-4 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]";

  const tdClass =
    "px-4 py-3 text-right border-b border-[#e2e7f0]";

  // ✅ دالة بترجع كلاس مخصص لكل عمود عشان نقدر نتحكم في إخفائه وقت الطباعة
  function printColClass(id: string) {
    return `print-col-${id}`;
  }

  /* =========================================================
     RETURN
     ========================================================= */

  return (
    <div
      className="flex flex-col gap-5 w-full pb-10"
      dir="rtl"
    >
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }

            .reserve-print-area,
            .reserve-print-area * {
              visibility: visible !important;
            }

            .reserve-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }

            .no-print {
              display: none !important;
            }

            table {
              width: 100% !important;
              min-width: 0 !important;
              font-size: 10px !important;
            }

            th,
            td {
              padding: 6px !important;
            }

            @page {
              size: A4 landscape;
              margin: 10mm;
            }
          }
        `}
      </style>

      {/* ✅ جدول بارتفاع الشاشة: الاسكرول الأفقي دايمًا ظاهر + رأس وأعمدة ثابتة */}
      <style>
        {`
          .reserve-table-scroll thead th {
            position: sticky;
            top: 0;
            z-index: 2;
          }

          .reserve-table-scroll .sticky-col-1,
          .reserve-table-scroll .sticky-col-2,
          .reserve-table-scroll .sticky-col-3 {
            position: sticky;
            z-index: 1;
            background: #ffffff;
          }

          .reserve-table-scroll .sticky-col-1 { right: 0;    width: 44px;  min-width: 44px; }
          .reserve-table-scroll .sticky-col-2 { right: 44px; width: 56px;  min-width: 56px; }
          .reserve-table-scroll .sticky-col-3 {
            right: 100px;
            min-width: 150px;
            box-shadow: -2px 0 0 #e2e7f0;
          }

          .reserve-table-scroll thead th.sticky-col-1,
          .reserve-table-scroll thead th.sticky-col-2,
          .reserve-table-scroll thead th.sticky-col-3 {
            z-index: 3;
            background: #f7f9fc;
          }

          .reserve-table-scroll tr.row-checked td.sticky-col-1,
          .reserve-table-scroll tr.row-checked td.sticky-col-2,
          .reserve-table-scroll tr.row-checked td.sticky-col-3 {
            background: #f4f7ff;
          }

          .reserve-table-scroll tr:hover td.sticky-col-1,
          .reserve-table-scroll tr:hover td.sticky-col-2,
          .reserve-table-scroll tr:hover td.sticky-col-3 {
            background: #fafbff;
          }

          @media print {
            .reserve-table-scroll {
              max-height: none !important;
              overflow: visible !important;
            }

            .reserve-table-scroll thead th,
            .reserve-table-scroll .sticky-col-1,
            .reserve-table-scroll .sticky-col-2,
            .reserve-table-scroll .sticky-col-3 {
              position: static !important;
              box-shadow: none !important;
            }
          }
        `}
      </style>

      {/* ✅ ستايل ديناميكي لإخفاء الأعمدة الغير مختارة وقت الطباعة فقط */}
      <style>
        {`
          @media print {
            ${PRINT_COLUMNS.filter(
              (col) => !selectedPrintColumns.has(col.id)
            )
              .map(
                (col) =>
                  `.print-col-${col.id} { display: none !important; }`
              )
              .join("\n")}
          }
        `}
      </style>
      {/* =====================================================
          العنوان
          ===================================================== */}

      <h1
        className="text-center"
        style={{
          ...F,
          fontWeight: 700,
          fontSize:
            "clamp(22px,4vw,32px)",
          color: "#2d3648",
          lineHeight: 1.5,
        }}
      >
        دفعات الرديف
      </h1>

      {/* =====================================================
          اختيار الدفعة
          ===================================================== */}

      <div className="flex flex-wrap items-end gap-3 justify-start no-print">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-xs">
          <label
            style={{
              ...F,
              fontSize: 14,
              color: "#717d96",
            }}
          >
            اختر تاريخ التسريح
          </label>

          {loadingBatches ? (
            <div
              className="h-[54px] bg-white border border-[#e2e7f0] rounded-[8px] flex items-center px-3"
              style={{
                ...F,
                fontSize: 14,
                color: "#a1aebe",
              }}
            >
              جاري تحميل الدفعات...
            </div>
          ) : (
            <GenericDropdown
              value={
                selectedBatchLabel
              }
              options={
                batchOptions
              }
              onChange={
                setSelectedBatch
              }
              placeholder="اختر تاريخ التسريح"
              disabled={
                batches.length ===
                0
              }
            />
          )}
        </div>
        <button
          type="button"
          disabled={
            !selectedBatch ||
            loadingBatches
          }
          onClick={
            () => guardNavigation(loadSoldiers)
          }
          className="h-[54px] px-6 rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90 shrink-0 disabled:opacity-50"
          style={{
            background:
              "linear-gradient(to bottom, #00b867, #00522e)",
            ...F,
            fontSize: 16,
            color: "#fff",
          }}
        >
          عرض الأفراد
        </button>
      </div>

      {(batchError || successMsg) &&
        createPortal(
          <div
            className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-[min(92vw,560px)]"
            style={{ zIndex: 1000000 }}
            dir="rtl"
          >
            {batchError && (
              <div
                role="alert"
                className="rounded-[12px] px-4 py-3 flex items-start gap-3 shadow-xl border"
                style={{ background: "#fce9ea", borderColor: "#f5c2c7" }}
              >
                <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: "#9d2e15" }} />
                <span className="flex-1" style={{ ...F, fontSize: 14, color: "#9d2e15", lineHeight: 1.7 }}>
                  {batchError}
                </span>
                <button
                  type="button"
                  onClick={() => setBatchError("")}
                  className="shrink-0 hover:opacity-70"
                  style={{ color: "#9d2e15" }}
                  aria-label="إغلاق"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                className="rounded-[12px] px-4 py-3 flex items-start gap-3 shadow-xl border"
                style={{ background: "#dcfce7", borderColor: "#bbf7d0" }}
              >
                <CheckSquare size={18} className="shrink-0 mt-0.5" style={{ color: "#166534" }} />
                <span className="flex-1" style={{ ...F, fontSize: 14, color: "#166534", lineHeight: 1.7 }}>
                  {successMsg}
                </span>
                <button
                  type="button"
                  onClick={() => setSuccessMsg("")}
                  className="shrink-0 hover:opacity-70"
                  style={{ color: "#166534" }}
                  aria-label="إغلاق"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>,
          document.body
        )}

      {/* =====================================================
          النتائج
          ===================================================== */}

      {showResults &&
        selectedBatchObject && (
          <div className="reserve-print-area">

            {/* Print Header */}

            <div className="hidden print:block text-center mb-5">
              <h2
                style={{
                  ...F,
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                كشف أفراد دفعة الرديف
              </h2>

              <p
                style={{
                  ...F,
                  fontSize: 14,
                }}
              >
                {selectedBatchObject.name ||
                  `دفعة ${formatBatchDate(
                    selectedBatchObject.batch_date
                  )}`}
              </p>
            </div>

            {/* =================================================
                STATS
                ================================================= */}

            <div className="flex flex-wrap gap-4 w-full no-print">

              <StatCard
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      stroke="#00b867"
                      strokeWidth="2"
                    />

                    <path
                      d="M16 2v4M8 2v4M3 10h18"
                      stroke="#00b867"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
                label="دفعة الرديف"
                value={
                  selectedBatchObject.name ||
                  formatBatchDate(
                    selectedBatchObject.batch_date
                  )
                }
              />

              <StatCard
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="9"
                      cy="7"
                      r="4"
                      stroke="#00b867"
                      strokeWidth="2"
                    />

                    <path
                      d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
                      stroke="#00b867"
                      strokeWidth="2"
                    />
                  </svg>
                }
                label="عدد الجنود"
                value={soldierData.length.toLocaleString(
                  "ar-EG"
                )}
              />
            </div>

            {/* =================================================
                PROGRESS
                ================================================= */}

               {/* الصف الأول: تم تسليم الكارنيه + تم تسليم الرخصة */}

            <div className="flex gap-4 w-full mt-4 no-print">

              <div className="flex-1">
                <ProgressCard
                  icon={
                    <CheckSquare
                      size={20}
                      color="#00b867"
                    />
                  }
                  label="تم تسليم الكارنيه"
                  current={
                    soldierData.filter(
                      (s) =>
                        s.receivedKariza ===
                        "تم الاستلام"
                    ).length
                  }
                  total={
                    soldierData.length
                  }
                />
              </div>

              <div className="flex-1">
                <ProgressCard
                  icon={
                    <CheckSquare
                      size={20}
                      color="#00b867"
                    />
                  }
                  label="تم تسليم الرخصة"
                  current={
                    soldierData.filter(
                      (s) =>
                        hasLicenseEligibility(
                          s.militaryId
                        ) &&
                        s.receivedLicense ===
                          "تم الاستلام"
                    ).length
                  }
                  total={
                    soldierData.filter(
                      (s) =>
                        hasLicenseEligibility(
                          s.militaryId
                        )
                    ).length
                  }
                />
              </div>
            </div>

            {/* الصف الثاني: كارنيه تالف + رخصة تالفة + تم تسليم محو الأمية */}

            <div className="flex gap-4 w-full mt-4 no-print">

              {/* ✅ عدد الأفراد اللي حالة الكارنيه بتاعتهم "تالف" */}

              <div className="flex-1">
                <ProgressCard
                  icon={
                    <AlertTriangle
                      size={20}
                      color="#3eb712"
                    />
                  }
                  label="كارنيه تالف"
                  current={
                    soldierData.filter(
                      (s) =>
                        s.receivedKariza ===
                        "تالف"
                    ).length
                  }
                  total={
                    soldierData.length
                  }
                />
              </div>

              {/* ✅ عدد الأفراد اللي حالة الرخصة بتاعتهم "تالف" */}
              {/* بنفس منطق كارت "تم تسليم الرخصة": الإجمالي بس الأفراد
                  اللي عندهم أهلية رخصة (الرقم 7-8 = 66) */}

              <div className="flex-1">
                <ProgressCard
                  icon={
                    <AlertTriangle
                      size={20}
                      color="#3eb712"
                    />
                  }
                  label="رخصة تالفة"
                  current={
                    soldierData.filter(
                      (s) =>
                        hasLicenseEligibility(
                          s.militaryId
                        ) &&
                        s.receivedLicense ===
                          "تالف"
                    ).length
                  }
                  total={
                    soldierData.filter(
                      (s) =>
                        hasLicenseEligibility(
                          s.militaryId
                        )
                    ).length
                  }
                />
              </div>

              <div className="flex-1">
                <ProgressCard
                  icon={
                    <CheckSquare
                      size={20}
                      color="#00b867"
                    />
                  }
                  label="تم تسليم محو الأمية"
                  current={
                    soldierData.filter(
                      (s) =>
                        s.requiresLiteracy &&
                        s.receivedLiteracy ===
                          "تم الاستلام"
                    ).length
                  }
                  total={
                    soldierData.filter(
                      (s) => s.requiresLiteracy
                    ).length
                  }
                />
              </div>
            </div>

            {/* الصف الثالث: مراجعة النموذج (1س) */}

            <div className="flex gap-4 w-full mt-4 no-print">
              <div className="flex-1">
                <ProgressCard
                  icon={
                    <CheckSquare
                      size={20}
                      color="#00b867"
                    />
                  }
                  label="تمت مراجعة النموذج (1س)"
                  current={
                    soldierData.filter(
                      (s) =>
                        s.model1sReview ===
                        "تمت المراجعة"
                    ).length
                  }
                  total={
                    soldierData.length
                  }
                />
              </div>

              <div className="flex-1">
                <ProgressCard
                  icon={
                    <AlertTriangle
                      size={20}
                      color="#3eb712"
                    />
                  }
                  label="نماذج (1س) بها ملاحظات"
                  current={
                    soldierData.filter(
                      (s) =>
                        s.model1sReview ===
                        "به ملاحظات"
                    ).length
                  }
                  total={
                    soldierData.length
                  }
                />
              </div>
            </div>

            {/* الصف الرابع: التعبئة + الإرسال للسجلات + الشهادات */}

            <div className="flex gap-4 w-full mt-4 no-print">
              <div className="flex-1">
                <ProgressCard
                  icon={<CheckSquare size={20} color="#00b867" />}
                  label="التعبئة مكتملة (الأولى والثانية)"
                  current={soldierData.filter((s) => s.mobilization1.trim() && s.mobilization2.trim()).length}
                  total={soldierData.length}
                />
              </div>

              <div className="flex-1">
                <ProgressCard
                  icon={<CheckSquare size={20} color="#00b867" />}
                  label="أُرسلت ملفاتهم للسجلات العسكرية"
                  current={soldierData.filter((s) => s.sentToRecordsAt).length}
                  total={soldierData.length}
                />
              </div>

              <div className="flex-1">
                <ProgressCard
                  icon={<CheckSquare size={20} color="#00b867" />}
                  label="وصلت شهادة إنهاء الخدمة"
                  current={soldierData.filter((s) => s.certificateNumber).length}
                  total={soldierData.length}
                />
              </div>
            </div>

            {/* إجراءات الدفعة: القرار + إخطار الوحدات + الإرسال للسجلات */}

            <ReserveBatchProcedures
              batch={selectedBatchObject}
              soldiers={soldierData.map((s) => ({
                id: s.id,
                unitId: s.unitId,
                unit: s.unit,
                militaryId: s.militaryId,
                name: s.name,
              }))}
              checkedIds={Array.from(checkedRows)}
              canManage={hasPermission("reserve_batches:manage_procedures")}
              onRecordsMapChange={applyRecordsMap}
            />

            {/* =================================================
                FILTERS (فلتر الوحدة + بحث الرقم العسكري)
                ================================================= */}
            <div className="flex flex-wrap items-end gap-3 mt-4 no-print">

              {/* بحث بالرقم العسكري */}

              <div className="flex flex-col gap-1.5 flex-1 min-w-[220px] max-w-xs">
                <label
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#717d96",
                  }}
                >
                  بحث بالرقم العسكري
                </label>

                <div
                  className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[54px]"
                  dir="rtl"
                >
                  <input
                    type="text"
                    value={
                      militarySearch
                    }
                    onChange={(e) =>
                      setMilitarySearch(
                        e.target
                          .value
                      )
                    }
                    placeholder="اكتب الرقم العسكري أو جزء منه"
                    className="flex-1 bg-transparent outline-none text-right"
                    style={{
                      ...F,
                      fontSize: 15,
                      color: "#2d3648",
                    }}
                    dir="rtl"
                  />

                  <Search
                    size={18}
                    className="shrink-0 text-[#2d3648]"
                  />
                </div>
              </div>

              {/* فلتر الوحدة */}

              <div className="flex flex-col gap-1.5 flex-1 min-w-[220px] max-w-xs">
                <label
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#717d96",
                  }}
                >
                  فلتر حسب الوحدة
                </label>

                <GenericDropdown
                  value={unitFilter}
                  options={
                    unitFilterOptions
                  }
                  onChange={
                    setUnitFilter
                  }
                  placeholder="كل الوحدات"
                  allowClear
                  clearLabel="كل الوحدات"
                  disabled={
                    unitFilterOptions.length ===
                    0
                  }
                />
              </div>
{/* فلتر حالة الفرد */}

              <div className="flex flex-col gap-1.5 flex-1 min-w-[220px] max-w-xs">
                <label
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#717d96",
                  }}
                >
                  فلتر حسب حالة الفرد
                </label>

                <GenericDropdown
                  value={statusFilter}
                  options={statusFilterOptions}
                  onChange={setStatusFilter}
                  placeholder="كل الحالات"
                  allowClear
                  clearLabel="كل الحالات"
                />
              </div>
              {/* عدد النتائج بعد الفلترة */}

              <div
                className="flex items-center h-[54px] px-2"
                dir="rtl"
              >
                <span
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#717d96",
                  }}
                >
                  عدد النتائج:{" "}
                  {filteredSoldierData.length.toLocaleString(
                    "ar-EG"
                  )}
                </span>
              </div>
            </div>

            {/* =================================================
                فلاتر إضافية: حالة المستندات ومراجعة النموذج (1س)
                + زرار إعادة تعيين الفلاتر
                ================================================= */}

            <div className="flex flex-wrap items-end gap-3 mt-3 no-print">

              {/* فلتر حالة الكارنيه */}

              <div className="flex flex-col gap-1.5 flex-1 min-w-[220px] max-w-xs">
                <label
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#717d96",
                  }}
                >
                  فلتر حسب حالة الكارنيه
                </label>

                <GenericDropdown
                  value={karizaFilter}
                  options={karizaFilterOptions}
                  onChange={(v) =>
                    setKarizaFilter(v as DocumentState | "")
                  }
                  placeholder="عرض الكل"
                  allowClear
                  clearLabel="عرض الكل"
                />
              </div>

              {/* فلتر حالة الرخصة */}

              <div className="flex flex-col gap-1.5 flex-1 min-w-[220px] max-w-xs">
                <label
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#717d96",
                  }}
                >
                  فلتر حسب حالة الرخصة
                </label>

                <GenericDropdown
                  value={licenseFilter}
                  options={licenseFilterOptions}
                  onChange={(v) =>
                    setLicenseFilter(v as DocumentState | "")
                  }
                  placeholder="عرض الكل"
                  allowClear
                  clearLabel="عرض الكل"
                />
              </div>

              {/* فلتر محو الأمية */}

              <div className="flex flex-col gap-1.5 flex-1 min-w-[220px] max-w-xs">
                <label
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#717d96",
                  }}
                >
                  فلتر حسب محو الأمية
                </label>

                <GenericDropdown
                  value={literacyFilter}
                  options={literacyFilterOptions}
                  onChange={(v) =>
                    setLiteracyFilter(v as DocumentState | "")
                  }
                  placeholder="عرض الكل"
                  allowClear
                  clearLabel="عرض الكل"
                />
              </div>

              {/* فلتر مراجعة النموذج (1س) */}

              <div className="flex flex-col gap-1.5 flex-1 min-w-[220px] max-w-xs">
                <label
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#717d96",
                  }}
                >
                  فلتر حسب مراجعة النموذج (1س)
                </label>

                <GenericDropdown
                  value={model1sFilter}
                  options={model1sFilterOptions}
                  onChange={(v) =>
                    setModel1sFilter(v as Model1sReviewState | "")
                  }
                  placeholder="عرض الكل"
                  allowClear
                  clearLabel="عرض الكل"
                />
              </div>

              {/* إعادة تعيين الفلاتر */}

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="h-[54px] px-5 rounded-[8px] border border-[#e2e7f0] bg-white shrink-0 disabled:opacity-50"
                style={{
                  ...F,
                  fontSize: 15,
                  color: "#2d3648",
                  cursor: hasActiveFilters
                    ? "pointer"
                    : "not-allowed",
                }}
              >
                إعادة تعيين الفلاتر
              </button>
            </div>

            {/* =================================================
                BUTTONS
                ================================================= */}

               <div className="flex flex-wrap items-end gap-3 mt-4 no-print">

              {/* إنهاء الخدمة */}

              {hasPermission("reserve_batches:end_service") && (
                <button
                  type="button"
                  onClick={
                    handleEndService
                  }
                  disabled={saving}
                  className="h-[44px] px-5 rounded-[8px] flex items-center justify-center shrink-0 disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(to bottom, #00b867, #00522e)",
                    ...F,
                    fontSize: 15,
                    color: "#fff",
                    cursor: saving
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  إنهاء خدمة الأفراد
                </button>
              )}

              {/* ترحيل الدفعة */}

              {hasPermission("reserve_batches:transfer") && (
                <button
                  type="button"
                  onClick={
                    handleTransfer
                  }
                  disabled={saving}
                  className="h-[44px] px-5 rounded-[8px] border border-[#e2e7f0] bg-white disabled:opacity-50"
                  style={{
                    ...F,
                    fontSize: 15,
                    color: "#2d3648",
                    cursor: saving
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  ترحيل دفعة
                </button>
              )}

              {/* طباعة */}

              {hasPermission("reserve_batches:print") && (
                <button
                  type="button"
                  onClick={() =>
                    setShowPrintDialog(true)
                  }
                  className="h-[44px] px-5 rounded-[8px] border border-[#e2e7f0] bg-white"
                  style={{
                    ...F,
                    fontSize: 15,
                    color: "#2d3648",
                  }}
                >
                  طباعة الكشف
                </button>
              )}
                   {/* =================================================
                SAVE
                ================================================= */}

       
            </div>
     <div className="flex justify-between mt-4 no-print w-full gap-3 items-center">
       <h2
          className="text-right"
          style={{ ...F, fontWeight: 700, fontSize: 24, color: "#2d3648" }}
        >
         افراد دفعة الرديف
        </h2>
              {(hasPermission("reserve_batches:update_documents") ||
                hasPermission("reserve_batches:update_literacy") ||
                hasPermission("reserve_batches:update_mobilization") ||
                hasPermission(
                  "reserve_batches:update_model1s_review"
                )) && (
                <button
                  type="button"
                  onClick={
                    handleSaveChanges
                  }
                  disabled={saving}
                  className="h-[44px] px-6 rounded-[8px] border border-[#e2e7f0] bg-white disabled:opacity-50"
                  style={{
                    ...F,
                    fontSize: 15,
                    color: "#2d3648",
                  }}
                >
                  {saving
                    ? "جاري الحفظ..."
                    : "حفظ التعديلات"}
                </button>
              )}
            </div>
            {/* =================================================
                TABLE
                ================================================= */}

                     <div
              className="reserve-table-scroll bg-white rounded-[12px] border border-[#e2e7f0] w-full overflow-auto mt-4"
              style={{ maxHeight: "calc(100vh - 160px)" }}
            >

              <table
                className="w-full min-w-[1350px] border-collapse"
                dir="rtl"
              >
                <thead>
                  <tr>

                    {/* تحديد الكل */}

                    <th
                      className={`${thClass} no-print sticky-col-1`}
                      style={{
                        width: 44,
                      }}
                    >
                      <button
                        type="button"
                        onClick={
                          toggleAll
                        }
                      >
                        {allChecked ? (
                          <CheckSquare
                            size={16}
                            color="#1f3d97"
                          />
                        ) : (
                          <Square
                            size={16}
                            color="#a1aebe"
                          />
                        )}
                      </button>
                    </th>

                                     {PRINT_COLUMNS.map((col) => (
                      <th
                        key={col.id}
                        className={`${thClass} ${printColClass(col.id)} ${
                          col.id === "index"
                            ? "sticky-col-2"
                            : col.id === "militaryId"
                            ? "sticky-col-3"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            style={{
                              ...F,
                              fontSize: 13,
                              color:
                                "#717d96",
                            }}
                          >
                            {col.label}
                          </span>

                          <SortIcon />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {soldierData.length ===
                  0 ? (
                    <tr>
                      <td
                 colSpan={PRINT_COLUMNS.length + 1}
                        className="py-10 text-center"
                        style={{
                          ...F,
                          fontSize: 15,
                          color:
                            "#a1aebe",
                        }}
                      >
                        لا يوجد أفراد في
                        هذه الدفعة
                      </td>
                    </tr>
                  ) : filteredSoldierData.length ===
                    0 ? (
                    <tr>
                      <td
                    colSpan={PRINT_COLUMNS.length + 1}
                        className="py-10 text-center"
                        style={{
                          ...F,
                          fontSize: 15,
                          color:
                            "#a1aebe",
                        }}
                      >
                        لا توجد نتائج
                        مطابقة للفلاتر
                        المحددة
                      </td>
                    </tr>
                  ) : (
                    filteredSoldierData.map(
                      (
                        soldier,
                        idx
                      ) => {
                        const licenseEnabled =
                          hasLicenseEligibility(
                            soldier.militaryId
                          );

                        const isChecked =
                          checkedRows.has(
                            soldier.id
                          );

                        return (
                          <tr
                            key={
                              soldier.id
                            }
                            className={`hover:bg-[#fafbff] ${
                              isChecked
                                ? "bg-[#f4f7ff] row-checked"
                                : ""
                            }`}
                          >

                            {/* Checkbox */}

                            <td
                              className={`${tdClass} no-print sticky-col-1`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  toggleRow(
                                    soldier.id
                                  )
                                }
                              >
                                {isChecked ? (
                                  <CheckSquare
                                    size={
                                      16
                                    }
                                    color="#1f3d97"
                                  />
                                ) : (
                                  <Square
                                    size={
                                      16
                                    }
                                    color="#a1aebe"
                                  />
                                )}
                              </button>
                            </td>

                            {/* م */}

                            <td
                                                        className={`${tdClass} ${printColClass("index")} sticky-col-2`}
                            >
                              <span
                                style={{
                                  ...F,
                                  fontSize: 13,
                                }}
                              >
                                {idx + 1}
                              </span>
                            </td>

                            {/* الرقم العسكري */}

                            <td
                                                   className={`${tdClass} ${printColClass("militaryId")} sticky-col-3`}
                            >
                              <span
                                style={{
                                  ...F,
                                  fontSize: 13,
                                }}
                              >
                                {
                                  soldier.militaryId
                                }
                              </span>
                            </td>

                            {/* الدرجة */}

                            <td
                              className={`${tdClass} ${printColClass("rank")}`}
                            >
                              <span
                                style={{
                                  ...F,
                                  fontSize: 13,
                                }}
                              >
                                {
                                  soldier.rank
                                }
                              </span>
                            </td>

                            {/* الاسم */}

                            <td
                              className={`${tdClass} ${printColClass("name")}`}
                            >
                              <span
                                style={{
                                  ...F,
                                  fontSize: 13,
                                }}
                              >
                                {
                                  soldier.name
                                }
                              </span>
                            </td>

                            {/* الوحدة */}

                            <td
                              className={`${tdClass} ${printColClass("unit")}`}
                            >
                              <span
                                style={{
                                  ...F,
                                  fontSize: 13,
                                }}
                              >
                                {
                                  soldier.unit
                                }
                              </span>
                            </td>

                                 {/* الكارنيه */}

                            <td
                              className={`${tdClass} text-center ${printColClass("kariza")}`}
                            >
                              <DocumentDropdown
                                value={
                                  soldier.receivedKariza
                                }
                                disabled={
                                  !hasPermission(
                                    "reserve_batches:update_documents"
                                  )
                                }
                                onChange={(
                                  value
                                ) =>
                                  toggleSoldierField(
                                    soldier.id,
                                    "receivedKariza",
                                    value
                                  )
                                }
                              />
                            </td>

                            {/* الرخصة */}

                            <td
                              className={`${tdClass} text-center ${printColClass("license")}`}
                            >
                              <DocumentDropdown
                                value={
                                  soldier.receivedLicense
                                }
                                disabled={
                                  !licenseEnabled ||
                                  !hasPermission(
                                    "reserve_batches:update_documents"
                                  )
                                }
                                onChange={(
                                  value
                                ) =>
                                  toggleSoldierField(
                                    soldier.id,
                                    "receivedLicense",
                                    value
                                  )
                                }
                              />
                            </td>

                                 {/* محو الأمية */}

                            <td
                              className={`${tdClass} text-center ${printColClass("literacy")}`}
                            >
                              <DocumentDropdown
                                value={
                                  soldier.receivedLiteracy
                                }
                                options={[
                                  "تم الاستلام",
                                  "لم يتم الاستلام",
                                ]}
                                disabled={
                                  !soldier.requiresLiteracy ||
                                  !hasPermission(
                                    "reserve_batches:update_literacy"
                                  )
                                }
                                onChange={(
                                  value
                                ) =>
                                  toggleSoldierField(
                                    soldier.id,
                                    "receivedLiteracy",
                                    value
                                  )
                                }
                              />
                            </td>

                            {/* مراجعة النموذج (1س) */}

                            <td
                              className={`${tdClass} text-center ${printColClass("model1s")}`}
                            >
                              <DocumentDropdown<Model1sReviewState>
                                value={
                                  soldier.model1sReview
                                }
                                options={
                                  MODEL1S_OPTIONS
                                }
                                colors={
                                  MODEL1S_COLORS
                                }
                                backgrounds={
                                  MODEL1S_BACKGROUNDS
                                }
                                disabled={
                                  !hasPermission(
                                    "reserve_batches:update_model1s_review"
                                  )
                                }
                                onChange={(
                                  value
                                ) =>
                                  toggleSoldierField(
                                    soldier.id,
                                    "model1sReview",
                                    value
                                  )
                                }
                              />
                            </td>

                            {/* ملاحظات النموذج (1س) */}

                            <td
                              className={`${tdClass} ${printColClass("model1sNotes")}`}
                            >
                              {soldier.model1sReview ===
                              "به ملاحظات" ? (
                                <input
                                  type="text"
                                  value={
                                    soldier.model1sNotes
                                  }
                                  disabled={
                                    !hasPermission(
                                      "reserve_batches:update_model1s_notes"
                                    )
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateSoldierModel1sNotes(
                                      soldier.id,
                                      e.target
                                        .value
                                    )
                                  }
                                  placeholder="اكتب الملاحظات هنا"
                                  className="w-full min-w-[160px] h-[34px] px-2 rounded-[6px] border border-[#e2e7f0] outline-none text-right disabled:bg-[#f1f3f6] disabled:cursor-not-allowed disabled:opacity-65"
                                  style={{
                                    ...F,
                                    fontSize: 12,
                                    color:
                                      "#2d3648",
                                  }}
                                  dir="rtl"
                                />
                              ) : (
                                <span
                                  style={{
                                    ...F,
                                    fontSize: 12,
                                    color:
                                      "#a1aebe",
                                  }}
                                >
                                  -
                                </span>
                              )}
                            </td>

                                                      {/* التعبئة الأولى */}

                            <td className={`${tdClass} ${printColClass("mobilization1")}`}>
                              <input
                                type="text"
                                value={soldier.mobilization1}
                                disabled={!hasPermission("reserve_batches:update_mobilization")}
                                onChange={(e) =>
                                  updateSoldierMobilization(soldier.id, "mobilization1", e.target.value)
                                }
                                placeholder="-"
                                dir="ltr"
                                className="w-full min-w-[110px] h-[34px] px-2 rounded-[6px] border border-[#e2e7f0] outline-none text-center disabled:bg-[#f1f3f6] disabled:cursor-not-allowed"
                                style={{ ...F, fontSize: 12, color: "#2d3648" }}
                              />
                            </td>

                            {/* التعبئة الثانية */}

                            <td className={`${tdClass} ${printColClass("mobilization2")}`}>
                              <input
                                type="text"
                                value={soldier.mobilization2}
                                disabled={!hasPermission("reserve_batches:update_mobilization")}
                                onChange={(e) =>
                                  updateSoldierMobilization(soldier.id, "mobilization2", e.target.value)
                                }
                                placeholder="-"
                                dir="ltr"
                                className="w-full min-w-[110px] h-[34px] px-2 rounded-[6px] border border-[#e2e7f0] outline-none text-center disabled:bg-[#f1f3f6] disabled:cursor-not-allowed"
                                style={{ ...F, fontSize: 12, color: "#2d3648" }}
                              />
                            </td>

                            {/* الإرسال للسجلات */}

                            <td className={`${tdClass} ${printColClass("records")}`}>
                              {soldier.sentToRecordsAt ? (
                                <span
                                  className="inline-flex px-2 py-0.5 rounded-full whitespace-nowrap"
                                  style={{ ...F, fontSize: 11, fontWeight: 700, background: "#e8f0fe", color: "#172e78" }}
                                >
                                  أُرسل {formatBatchDate(soldier.sentToRecordsAt)}
                                </span>
                              ) : (
                                <span style={{ ...F, fontSize: 12, color: "#a1aebe" }}>لم يُرسل</span>
                              )}
                            </td>

                            {/* شهادة إنهاء الخدمة */}

                            <td className={`${tdClass} ${printColClass("certificate")}`}>
                              {soldier.certificateNumber ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="flex flex-col">
                                    <span style={{ ...F, fontSize: 12, fontWeight: 700, color: "#166534" }}>
                                      {soldier.certificateNumber}
                                    </span>
                                    <span style={{ ...F, fontSize: 10, color: "#717d96" }}>
                                      {soldier.certificateDate ? formatBatchDate(soldier.certificateDate) : ""}
                                    </span>
                                  </div>
                                  {hasPermission("reserve_batches:certificates") &&
                                    soldier.status === "بالخدمة" && (
                                      <button
                                        type="button"
                                        onClick={() => void deleteCertificate(soldier)}
                                        title="حذف الشهادة"
                                        className="no-print text-[#991b1b] hover:opacity-70"
                                      >
                                        <X size={13} />
                                      </button>
                                    )}
                                </div>
                              ) : hasPermission("reserve_batches:certificates") ? (
                                <button
                                  type="button"
                                  onClick={() => setCertTarget(soldier)}
                                  className="no-print px-2.5 h-[30px] rounded-[6px] border border-[#00b867] whitespace-nowrap"
                                  style={{ ...F, fontSize: 11, color: "#00522e" }}
                                >
                                  تسجيل الشهادة
                                </button>
                              ) : (
                                <span style={{ ...F, fontSize: 12, color: "#a1aebe" }}>-</span>
                              )}
                            </td>
                            {/* الترحيل */}

                            <td className={`${tdClass} ${printColClass("transfer")}`}>
                              {(() => {
                                const last = soldier.transfers.find(
                                  (t) => t.toDate === selectedBatchObject?.batch_date
                                );

                                if (!last) {
                                  return soldier.transfers.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => setHistoryTarget(soldier)}
                                      className="no-print flex items-center gap-1 hover:underline"
                                      style={{ ...F, fontSize: 11, color: "#1f3d97" }}
                                    >
                                      <History size={12} />
                                      سجل الترحيلات
                                    </button>
                                  ) : (
                                    <span style={{ ...F, fontSize: 12, color: "#a1aebe" }}>-</span>
                                  );
                                }

                                return (
                                  <div className="flex flex-col gap-1 min-w-[170px]">
                                    <span
                                      className="inline-flex w-fit px-2 py-0.5 rounded-full whitespace-nowrap"
                                      style={{
                                        ...F,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        background: last.direction === "postpone" ? "#fff8e8" : "#e8f0fe",
                                        color: last.direction === "postpone" ? "#8a6500" : "#172e78",
                                      }}
                                    >
                                      {last.direction === "postpone" ? "مُرحّل من" : "مُقدّم من"}{" "}
                                      {last.fromDate ? formatBatchDate(last.fromDate) : "-"}
                                    </span>
                                    <span style={{ ...F, fontSize: 11, color: "#717d96" }}>{last.reasonName}</span>

                                    <div className="no-print flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setHistoryTarget(soldier)}
                                        className="flex items-center gap-1 hover:underline"
                                        style={{ ...F, fontSize: 11, color: "#1f3d97" }}
                                      >
                                        <History size={12} />
                                        السجل
                                      </button>

                                      {last.direction === "postpone" &&
                                        last.fromBatchId &&
                                        soldier.status === "بالخدمة" &&
                                        !soldier.certificateNumber &&
                                        hasPermission("reserve_batches:transfer") && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setRevertTarget({ soldier, transfer: last });
                                              setShowTransferDialog(true);
                                            }}
                                            className="flex items-center gap-1 hover:underline"
                                            style={{ ...F, fontSize: 11, color: "#00522e" }}
                                          >
                                            <Undo2 size={12} />
                                            إلغاء الترحيل
                                          </button>
                                        )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* حالة الفرد */}

                            <td
                              className={`${tdClass} ${printColClass("status")}`}
                            >
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
                                style={{
                                  background:
                                    soldier.status ===
                                    "بالخدمة"
                                      ? "#dcfce7"
                                      : "#fce9ea",

                                  ...F,

                                  fontSize: 11,

                                  fontWeight: 700,

                                  color:
                                    soldier.status ===
                                    "بالخدمة"
                                      ? "#166534"
                                      : "#9d2e15",
                                }}
                              >
                                {
                                  soldier.status
                                }
                              </span>
                            </td>

                          </tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>

       

          </div>
        )}

      {/* =====================================================
          END SERVICE POPUP
          ===================================================== */}

      {showEndDialog && (
        <EndServiceDialog
          onCancel={() => {
            if (!saving) {
              setShowEndDialog(
                false
              );
            }
          }}
          onConfirm={
            confirmEndService
          }
          saving={saving}
          missingCertificates={
            soldierData.filter(
              (s) => checkedRows.has(s.id) && !s.certificateNumber
            ).length
          }
        />
      )}

      {/* =====================================================
          TRANSFER POPUP
          ===================================================== */}
      {showTransferDialog && selectedBatchObject && (
        <TransferDialog
          currentBatch={selectedBatchObject}
          count={revertTarget ? 1 : checkedRows.size}
          revert={revertTarget}
          onCancel={() => {
            if (!saving) {
              setShowTransferDialog(false);
              setRevertTarget(null);
            }
          }}
          onConfirm={(payload) => void confirmTransfer(payload)}
          saving={saving}
        />
      )}

      {historyTarget && (
        <TransferHistoryDialog soldier={historyTarget} onClose={() => setHistoryTarget(null)} />
      )}

      {/* =====================================================
          PRINT COLUMNS POPUP
          ===================================================== */}

      {certTarget && (
        <CertificateDialog
          soldierLabel={`${certTarget.militaryId} - ${certTarget.name}`}
          saving={savingCert}
          onCancel={() => !savingCert && setCertTarget(null)}
          onConfirm={(number, date) => void recordCertificate(number, date)}
        />
      )}

      {showPrintDialog && (
        <PrintColumnsDialog
          columns={PRINT_COLUMNS}
          selectedColumns={selectedPrintColumns}
          onToggleColumn={togglePrintColumn}
          onSelectAll={selectAllPrintColumns}
          onClearAll={clearAllPrintColumns}
          onCancel={() => setShowPrintDialog(false)}
          onConfirm={confirmPrint}
        />
      )}
    </div>
  );
}