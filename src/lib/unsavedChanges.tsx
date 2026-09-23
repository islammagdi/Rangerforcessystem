import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────

interface UnsavedChangesContextValue {
  /** هل فيه حاليًا تعديلات لم تُحفظ (من أي صفحة فورم مفتوحة) */
  isDirty: boolean;

  /** الصفحة بتنده عليها كل ما تتغيّر حالة الفورم بتاعتها */
  setDirty: (dirty: boolean) => void;

  /**
   * أي حاجة بتعمل تنقل (Sidebar / Breadcrumbs / زرار داخلي) لازم
   * تلف الأكشن بتاعها بالدالة دي بدل ما تنده navigate() مباشرة.
   * لو مفيش تعديلات غير محفوظة، الأكشن بينفذ فورًا. لو فيه، بيظهر
   * بوب اب تأكيد وبيتأجل التنفيذ لحد ما المستخدم يقرر.
   */
  guardNavigation: (action: () => void) => void;
}

const UnsavedChangesContext =
  createContext<UnsavedChangesContextValue | null>(null);

// ─────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────

export function UnsavedChangesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDirty, setIsDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // بنخزّن الأكشن المؤجل (غالبًا navigate(path)) هنا لحد ما
  // المستخدم يأكد قرار المغادرة
  const pendingActionRef = useRef<(() => void) | null>(null);

  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  const guardNavigation = useCallback(
    (action: () => void) => {
      if (isDirty) {
        pendingActionRef.current = action;
        setShowModal(true);
      } else {
        action();
      }
    },
    [isDirty]
  );

  // تحذير المتصفح الأصلي عند إغلاق التاب / تحديث الصفحة (F5).
  // ملحوظة: المتصفحات الحديثة بتعرض نص ثابت من عندها لأسباب أمنية
  // ومينفعش نغيّر النص، لكن السلوك (تحذير قبل الخروج) بيشتغل صح.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty) return;

      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function handleConfirmLeave() {
    setShowModal(false);
    setIsDirty(false);

    const action = pendingActionRef.current;
    pendingActionRef.current = null;

    // بنأجل التنفيذ خطوة عشان الـ state يتحدث الأول
    if (action) {
      setTimeout(action, 0);
    }
  }

  function handleCancelLeave() {
    setShowModal(false);
    pendingActionRef.current = null;
  }

  return (
    <UnsavedChangesContext.Provider
      value={{ isDirty, setDirty, guardNavigation }}
    >
      {children}

      {showModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4"
            dir="rtl"
            onClick={handleCancelLeave}
          >
            <div
              className="bg-white rounded-[16px] p-6 w-full max-w-sm flex flex-col gap-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "#fff7ed" }}
                  >
                    <AlertTriangle size={18} style={{ color: "#c2680d" }} />
                  </div>

                  <p
                    style={{
                      ...F,
                      fontWeight: 700,
                      fontSize: 18,
                      color: "#2d3648",
                    }}
                  >
                    لديك تعديلات لم تُحفظ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCancelLeave}
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#f5f5f5]"
                >
                  <X size={16} className="text-[#a1aebe]" />
                </button>
              </div>

              <p
                className="text-right"
                style={{
                  ...F,
                  fontSize: 14,
                  color: "#717d96",
                  lineHeight: 1.8,
                }}
              >
                التغييرات اللي عملتها في هذه الصفحة هتُفقد لو غادرتها الآن.
                هل تريد المتابعة بدون حفظ؟
              </p>

              <div className="flex items-center gap-2.5 justify-start flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCancelLeave}
                  autoFocus
                  className="px-5 py-2.5 rounded-[8px] flex-1 sm:flex-initial"
                  style={{
                    background:
                      "linear-gradient(to bottom, #00b867, #00522e)",
                    ...F,
                    fontSize: 14,
                    color: "#fff",
                  }}
                >
                  البقاء في الصفحة
                </button>

                <button
                  type="button"
                  onClick={handleConfirmLeave}
                  className="px-5 py-2.5 rounded-[8px] border flex-1 sm:flex-initial"
                  style={{
                    borderColor: "#f4b5ae",
                    background: "#fce8f1",
                    ...F,
                    fontSize: 14,
                    color: "#9d2e15",
                  }}
                >
                  مغادرة بدون حفظ
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </UnsavedChangesContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────

export function useUnsavedChanges() {
  const ctx = useContext(UnsavedChangesContext);

  if (!ctx) {
    throw new Error(
      "useUnsavedChanges must be used within UnsavedChangesProvider"
    );
  }

  return ctx;
}

// ─────────────────────────────────────────────────────────
// Helper اختياري: بيبسّط تسجيل حالة isDirty لأي فورم
// بمقارنة snapshot أول تحميل مع القيم الحالية
// ─────────────────────────────────────────────────────────

/**
 * استخدام مقترح جوه أي صفحة فورم:
 *
 *   const { setDirty } = useUnsavedChanges();
 *   const initialSnapshotRef = useRef<string>("");
 *
 *   // بعد تحميل البيانات:
 *   initialSnapshotRef.current = JSON.stringify({ field1, field2, ... });
 *
 *   // في useEffect بيتابع كل الحقول:
 *   useEffect(() => {
 *     const current = JSON.stringify({ field1, field2, ... });
 *     setDirty(!!initialSnapshotRef.current && current !== initialSnapshotRef.current);
 *   }, [field1, field2, ...]);
 *
 *   // بعد نجاح الحفظ:
 *   initialSnapshotRef.current = JSON.stringify({ field1, field2, ... });
 *   setDirty(false);
 *
 *   // عند الخروج من الصفحة (unmount) لو محدثش حفظ:
 *   useEffect(() => () => setDirty(false), []);
 */