import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  X,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowLeftRight,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

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

type Soldier = {
  id: string;
  militaryId: string;
  rank: string;
  name: string;
  unit: string;
  receivedKariza: DocumentState;
  receivedLicense: DocumentState;
  status: SoldierStatus;
};

const DISCHARGED_STATUS_ID =
  "ac8ddfa3-1578-455b-9b6a-b056260fcb1f";

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
   BATCH DROPDOWN
   ========================================================= */

function BatchDropdown({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: string;
  options: {
    label: string;
    value: string;
  }[];
  onChange: (v: string) => void;
  disabled?: boolean;
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
          {value || "اختر تاريخ التسريح"}
        </span>
      </button>

      {open && !disabled && (
        <ul
          className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden max-h-[300px] overflow-y-auto"
          dir="rtl"
        >
          {options.length === 0 ? (
            <li
              className="px-4 py-3 text-right"
              style={{
                ...F,
                fontSize: 14,
                color: "#a1aebe",
              }}
            >
              لا توجد دفعات
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
   DOCUMENT DROPDOWN
   ========================================================= */

function DocumentDropdown({
  value,
  onChange,
  disabled = false,
}: {
  value: DocumentState;
  onChange: (
    value: DocumentState
  ) => void;
  disabled?: boolean;
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

  const options: DocumentState[] = [
    "تم الاستلام",
    "لم يتم الاستلام",
    "تالف",
  ];

  const colors: Record<
    DocumentState,
    string
  > = {
    "تم الاستلام": "#166534",
    "لم يتم الاستلام": "#9a3412",
    "تالف": "#991b1b",
  };

  const backgrounds: Record<
    DocumentState,
    string
  > = {
    "تم الاستلام": "#dcfce7",
    "لم يتم الاستلام": "#fff7ed",
    "تالف": "#fee2e2",
  };

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
              ? "غير متاح"
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
              fontSize: 18,
              color: "#2d3648",
              fontWeight: 700,
            }}
          >
            {current.toLocaleString(
              "ar-EG"
            )}{" "}
            <span
              style={{
                fontSize: 14,
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

      <div className="mt-3 w-full bg-[#eff0f6] rounded-full h-2">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(to right, #00b867, #00522e)",
          }}
        />
      </div>

      <p
        className="mt-1 text-right"
        style={{
          ...F,
          fontSize: 11,
          color: "#a1aebe",
        }}
      >
        {pct}%
      </p>
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
}: {
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
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
  batches,
  onCancel,
  onConfirm,
  saving,
}: {
  batches: ReserveBatch[];
  onCancel: () => void;
  onConfirm: (
    batchId: string
  ) => void;
  saving: boolean;
}) {
  const [targetBatch, setTargetBatch] =
    useState("");

  const options = batches.map(
    (batch) => ({
      value: batch.id,
      label:
        batch.name ||
        `دفعة ${formatBatchDate(
          batch.batch_date
        )}`,
    })
  );

  const selectedTarget =
    batches.find(
      (b) => b.id === targetBatch
    );

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4"
      dir="rtl"
    >
      <div
        className="bg-white rounded-[24px] p-6 w-full max-w-sm flex flex-col gap-6 shadow-2xl"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="flex justify-between items-center">
          <div
            className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{
              background: "#dcfce7",
            }}
          >
            <ArrowLeftRight
              size={20}
              style={{
                color: "#00b867",
              }}
            />
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="text-[#aaa] hover:text-[#555]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 items-center text-center">
          <p
            style={{
              ...F,
              fontSize: 18,
              color: "#122b16",
              fontWeight: 700,
            }}
          >
            ترحيل دفعة
          </p>

          <p
            style={{
              ...F,
              fontSize: 13,
              color: "#404040",
            }}
          >
            يرجى اختيار دفعة الترحيل
            الجديدة للأفراد
          </p>
        </div>

        <BatchDropdown
          value={
            selectedTarget
              ? selectedTarget.name ||
                `دفعة ${formatBatchDate(
                  selectedTarget.batch_date
                )}`
              : ""
          }
          options={options}
          onChange={setTargetBatch}
        />

        <button
          type="button"
          disabled={
            !targetBatch || saving
          }
          onClick={() =>
            onConfirm(targetBatch)
          }
          className="w-full h-[52px] rounded-[8px] flex items-center justify-center disabled:opacity-50"
          style={{
            background:
              "linear-gradient(to bottom, #00b867, #00522e)",
          }}
        >
          <span
            style={{
              ...F,
              fontSize: 16,
              color: "#fff",
            }}
          >
            {saving
              ? "جاري الترحيل..."
              : "حفظ وترحيل الأفراد"}
          </span>
        </button>
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

  /* =========================================================
     allChecked أصبح قيمة محسوبة
     وليس state منفصل
     ========================================================= */

  const allChecked =
    soldierData.length > 0 &&
    checkedRows.size ===
      soldierData.length;

  /* =========================================================
     تحميل الدفعات
     ========================================================= */

  useEffect(() => {
    async function loadBatches() {
      setLoadingBatches(true);
      setBatchError("");

      const { data, error } =
        await supabase
          .from("reserve_batches")
          .select(
            "id, batch_date, name, is_active"
          )
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

      const rows: ReserveBatch[] =
        (data ?? []).map(
          (row: any) => ({
            id: row.id,
            batch_date:
              row.batch_date,
            name: row.name,
            is_active:
              row.is_active === true,
          })
        );

      setBatches(rows);

      if (rows.length > 0) {
        setSelectedBatch(
          rows[0].id
        );
      }

      setLoadingBatches(false);
    }

    loadBatches();
  }, []);

  const selectedBatchObject =
    batches.find(
      (b) => b.id === selectedBatch
    );

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

    const { data, error } =
      await supabase
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
          units:primary_unit_id (
            id,
            name
          )
        `)
        .eq(
          "discharge_date",
          selectedBatchObject.batch_date
        )
        .order("full_name", {
          ascending: true,
        });

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

    const {
      data: documents,
      error: documentsError,
    } = await supabase
      .from(
        "reserve_batch_documents"
      )
      .select(`
        personnel_id,
        document_type,
        status
      `)
      .eq(
        "reserve_batch_id",
        selectedBatchObject.id
      )
      .in(
        "personnel_id",
        personnelIds
      );

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

    const documentMap =
      new Map<
        string,
        {
          kariza?: string;
          license?: string;
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
      }
    );

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

            rank: "جندي",

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

            // ✅ FIX: بنعتمد على service_status_id فقط كمصدر وحيد للحقيقة
            // بخصوص حالة الفرد (بالخدمة / منتهي خدمته)، بنفس المنطق
            // المستخدم في SoldierDetailPage، بدل الاعتماد على is_active
            // اللي ممكن يكون غير متزامن مع service_status_id لو اتعدّل
            // الفرد من صفحة تانية (زي صفحة تعديل بيانات الفرد).
            status:
              person.service_status_id ===
              DISCHARGED_STATUS_ID
                ? "منتهي خدمته"
                : "بالخدمة",
          };
        }
      );

    setSoldierData(mapped);
    setCheckedRows(new Set());
  }

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
     ========================================================= */

  function toggleAll() {
    if (allChecked) {
      setCheckedRows(new Set());
      return;
    }

    setCheckedRows(
      new Set(
        soldierData.map(
          (soldier) => soldier.id
        )
      )
    );
  }

  /* =========================================================
     تعديل المستند
     ========================================================= */

  function toggleSoldierField(
    id: string,
    field:
      | "receivedKariza"
      | "receivedLicense",
    value: DocumentState
  ) {
    setSoldierData((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              [field]: value,
            }
          : s
      )
    );
  }

  /* =========================================================
     حفظ التعديلات
     ========================================================= */

  async function handleSaveChanges() {
    if (!selectedBatchObject) {
      setBatchError(
        "يرجى اختيار دفعة أولاً"
      );
      return;
    }

    if (soldierData.length === 0) {
      setSuccessMsg(
        "لا توجد بيانات لحفظها"
      );

      setTimeout(
        () => setSuccessMsg(""),
        3000
      );

      return;
    }

    setSaving(true);
    setBatchError("");

    try {
      const documentsToSave: any[] =
        [];

      soldierData.forEach(
        (soldier) => {
          documentsToSave.push({
            personnel_id:
              soldier.id,

            reserve_batch_id:
              selectedBatchObject.id,

            document_type:
              "KARIZA",

            status:
              documentStateToDb(
                soldier.receivedKariza
              ),

            updated_at:
              new Date().toISOString(),
          });

          if (
            hasLicenseEligibility(
              soldier.militaryId
            )
          ) {
            documentsToSave.push({
              personnel_id:
                soldier.id,

              reserve_batch_id:
                selectedBatchObject.id,

              document_type:
                "LICENSE",

              status:
                documentStateToDb(
                  soldier.receivedLicense
                ),

              updated_at:
                new Date().toISOString(),
            });
          }
        }
      );

      const { error } =
        await supabase
          .from(
            "reserve_batch_documents"
          )
          .upsert(
            documentsToSave,
            {
              onConflict:
                "personnel_id,reserve_batch_id,document_type",
            }
          );

      if (error) {
        throw error;
      }

      setSuccessMsg(
        "تم حفظ جميع التعديلات بنجاح"
      );

      setTimeout(
        () => setSuccessMsg(""),
        3000
      );
    } catch (error: any) {
      console.error(
        "save all documents error:",
        error
      );

      setBatchError(
        `حدث خطأ أثناء حفظ التعديلات: ${
          error?.message ||
          "خطأ غير معروف"
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

    setBatchError("");
    setShowEndDialog(true);
  }

  /* =========================================================
     تأكيد إنهاء الخدمة
     ========================================================= */

  async function confirmEndService() {
    if (!selectedBatchObject) {
      setBatchError(
        "لم يتم اختيار الدفعة"
      );
      return;
    }

    const ids =
      Array.from(checkedRows);

    if (ids.length === 0) {
      setShowEndDialog(false);

      setBatchError(
        "يرجى تحديد فرد واحد على الأقل"
      );

      return;
    }

    setSaving(true);
    setBatchError("");

    try {
      const {
        error: personnelError,
      } = await supabase
        .from("personnel")
        .update({
          is_active: false,

          service_status_id:
            DISCHARGED_STATUS_ID,

          updated_at:
            new Date().toISOString(),
        })
        .in("id", ids);

      if (personnelError) {
        throw personnelError;
      }

      const {
        data: existingDocuments,
        error:
          documentsFetchError,
      } = await supabase
        .from(
          "reserve_batch_documents"
        )
        .select(`
          personnel_id,
          document_type,
          status
        `)
        .eq(
          "reserve_batch_id",
          selectedBatchObject.id
        )
        .in(
          "personnel_id",
          ids
        );

      if (documentsFetchError) {
        throw documentsFetchError;
      }

      const existingMap =
        new Map<
          string,
          {
            kariza?: string;
            license?: string;
          }
        >();

      (
        existingDocuments ?? []
      ).forEach((doc: any) => {
        if (
          !existingMap.has(
            doc.personnel_id
          )
        ) {
          existingMap.set(
            doc.personnel_id,
            {}
          );
        }

        const item =
          existingMap.get(
            doc.personnel_id
          )!;

        if (
          doc.document_type ===
          "KARIZA"
        ) {
          item.kariza =
            doc.status;
        }

        if (
          doc.document_type ===
          "LICENSE"
        ) {
          item.license =
            doc.status;
        }
      });

      const documentsToUpsert: any[] =
        [];

      ids.forEach(
        (personnelId) => {
          const existing =
            existingMap.get(
              personnelId
            );

          documentsToUpsert.push({
            personnel_id:
              personnelId,

            reserve_batch_id:
              selectedBatchObject.id,

            document_type:
              "KARIZA",

            status:
              existing?.kariza ||
              "PENDING",

            updated_at:
              new Date().toISOString(),
          });
        }
      );

      const selectedPersonnel =
        soldierData.filter(
          (soldier) =>
            ids.includes(soldier.id)
        );

      selectedPersonnel.forEach(
        (soldier) => {
          if (
            !hasLicenseEligibility(
              soldier.militaryId
            )
          ) {
            return;
          }

          const existing =
            existingMap.get(
              soldier.id
            );

          documentsToUpsert.push({
            personnel_id:
              soldier.id,

            reserve_batch_id:
              selectedBatchObject.id,

            document_type:
              "LICENSE",

            status:
              existing?.license ||
              "PENDING",

            updated_at:
              new Date().toISOString(),
          });
        }
      );

      const {
        error:
          documentsUpsertError,
      } = await supabase
        .from(
          "reserve_batch_documents"
        )
        .upsert(
          documentsToUpsert,
          {
            onConflict:
              "personnel_id,reserve_batch_id,document_type",
          }
        );

      if (documentsUpsertError) {
        throw documentsUpsertError;
      }

      setShowEndDialog(false);

      setCheckedRows(new Set());

      setSuccessMsg(
        "تم إنهاء خدمة الأفراد المحددين وتحديث حالتهم بنجاح"
      );

      setTimeout(
        () => setSuccessMsg(""),
        3000
      );

      await loadSoldiers();
    } catch (error: any) {
      console.error(
        "end service error:",
        error
      );

      setBatchError(
        `حدث خطأ أثناء إنهاء الخدمة: ${
          error?.message ||
          "خطأ غير معروف"
        }`
      );
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
    setShowTransferDialog(true);
  }

  /* =========================================================
     تأكيد الترحيل
     ========================================================= */

  async function confirmTransfer(
    targetBatchId: string
  ) {
    const targetBatch =
      batches.find(
        (b) =>
          b.id ===
          targetBatchId
      );

    if (!targetBatch) {
      setBatchError(
        "يرجى اختيار دفعة الترحيل"
      );
      return;
    }

    const ids =
      Array.from(checkedRows);

    if (ids.length === 0) {
      setShowTransferDialog(false);

      setBatchError(
        "يرجى تحديد فرد واحد على الأقل"
      );

      return;
    }

    setSaving(true);
    setBatchError("");

    try {
      const { error } =
        await supabase
          .from("personnel")
          .update({
            discharge_date:
              targetBatch.batch_date,

            updated_at:
              new Date().toISOString(),
          })
          .in("id", ids);

      if (error) {
        throw error;
      }

      setShowTransferDialog(false);

      setCheckedRows(new Set());

      setSuccessMsg(
        `تم ترحيل الأفراد إلى ${
          targetBatch.name ||
          formatBatchDate(
            targetBatch.batch_date
          )
        } بنجاح`
      );

      setTimeout(
        () => setSuccessMsg(""),
        3000
      );

      await loadSoldiers();
    } catch (error: any) {
      console.error(
        "transfer error:",
        error
      );

      setBatchError(
        `حدث خطأ أثناء ترحيل الأفراد: ${
          error?.message ||
          "خطأ غير معروف"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     الطباعة
     ========================================================= */

  function handlePrint() {
    window.print();
  }

  const thClass =
    "px-4 py-3 text-right border-b border-[#e2e7f0] bg-[#f7f9fc]";

  const tdClass =
    "px-4 py-3 text-right border-b border-[#e2e7f0]";

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
            <BatchDropdown
              value={
                selectedBatchLabel
              }
              options={
                batchOptions
              }
              onChange={
                setSelectedBatch
              }
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
            loadSoldiers
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

      {/* =====================================================
          ERROR
          ===================================================== */}

      {batchError && (
        <div
          className="w-full rounded-[10px] px-4 py-3"
          style={{
            background: "#fce9ea",
            color: "#9d2e15",
            ...F,
            fontSize: 14,
          }}
        >
          {batchError}
        </div>
      )}

      {/* =====================================================
          SUCCESS
          ===================================================== */}

      {successMsg && (
        <div
          className="w-full rounded-[10px] px-4 py-3 flex items-center gap-2 justify-end"
          style={{
            background: "#dcfce7",
          }}
        >
          <span
            style={{
              ...F,
              fontSize: 14,
              color: "#166534",
            }}
          >
            {successMsg}
          </span>
        </div>
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

            <div className="flex flex-wrap gap-4 w-full mt-4 no-print">

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

              {/* ✅ جديد: عدد الأفراد اللي حالة الكارنيه بتاعتهم "تالف" */}

              <ProgressCard
                icon={
                  <AlertTriangle
                    size={20}
                    color="#e3282c"
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

              {/* ✅ جديد: عدد الأفراد اللي حالة الرخصة بتاعتهم "تالف" */}
              {/* بنفس منطق كارت "تم تسليم الرخصة": الإجمالي بس الأفراد
                  اللي عندهم أهلية رخصة (الرقم 7-8 = 66) */}

              <ProgressCard
                icon={
                  <AlertTriangle
                    size={20}
                    color="#e3282c"
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

            {/* =================================================
                BUTTONS
                ================================================= */}

            <div className="flex flex-wrap items-end gap-3 mt-4 no-print">

              {/* إنهاء الخدمة */}

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

              {/* ترحيل الدفعة */}

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

              {/* طباعة */}

              <button
                type="button"
                onClick={
                  handlePrint
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
            </div>

            {/* =================================================
                TABLE
                ================================================= */}

            <div className="bg-white rounded-[12px] border border-[#e2e7f0] w-full overflow-x-auto mt-4">

              <table
                className="w-full min-w-[1100px] border-collapse"
                dir="rtl"
              >
                <thead>
                  <tr>

                    {/* تحديد الكل */}

                    <th
                      className={`${thClass} no-print`}
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

                    {[
                      "م",
                      "رقم عسكري",
                      "درجة",
                      "اسم",
                      "الوحدة",
                      "استلام كارنيه",
                      "استلام رخصة",
                      "حالة الفرد",
                    ].map((h) => (
                      <th
                        key={h}
                        className={
                          thClass
                        }
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
                            {h}
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
                        colSpan={9}
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
                  ) : (
                    soldierData.map(
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
                                ? "bg-[#f4f7ff]"
                                : ""
                            }`}
                          >

                            {/* Checkbox */}

                            <td
                              className={`${tdClass} no-print`}
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
                              className={
                                tdClass
                              }
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
                              className={
                                tdClass
                              }
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
                              className={
                                tdClass
                              }
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
                              className={
                                tdClass
                              }
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
                              className={
                                tdClass
                              }
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
                              className={`${tdClass} text-center`}
                            >
                              <DocumentDropdown
                                value={
                                  soldier.receivedKariza
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
                              className={`${tdClass} text-center`}
                            >
                              <DocumentDropdown
                                value={
                                  soldier.receivedLicense
                                }
                                disabled={
                                  !licenseEnabled
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

                            {/* حالة الفرد */}

                            <td
                              className={
                                tdClass
                              }
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

            {/* =================================================
                SAVE
                ================================================= */}

            <div className="flex justify-end mt-4 no-print">
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
        />
      )}

      {/* =====================================================
          TRANSFER POPUP
          ===================================================== */}

      {showTransferDialog && (
        <TransferDialog
          batches={batches}
          onCancel={() => {
            if (!saving) {
              setShowTransferDialog(
                false
              );
            }
          }}
          onConfirm={
            confirmTransfer
          }
          saving={saving}
        />
      )}
    </div>
  );
}