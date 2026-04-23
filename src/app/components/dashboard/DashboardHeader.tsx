import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  KeyRound,
  ImagePlus,
  X,
} from "lucide-react";
import imgAvatar from "figma:asset/8b9f86452ff0e90495bf9daf1494dd6920ad538a.png";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

// ─── Change Password Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>(
    {},
  );
  const [success, setSuccess] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.current) e.current = "كلمة المرور الحالية مطلوبة";
    if (!form.next || form.next.length < 6)
      e.next = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    if (form.next !== form.confirm)
      e.confirm = "كلمتا المرور غير متطابقتين";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSuccess(true);
    setTimeout(onClose, 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      dir="rtl"
    >
      <div className="bg-white rounded-[20px] p-6 w-[90%] max-w-sm flex flex-col gap-5 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#DCF4DF" }}
            >
              <KeyRound
                size={16}
                style={{ color: "#5B795F" }}
              />
            </div>
            <span
              style={{
                ...F,
                fontSize: 18,
                color: "#2d3648",
                fontWeight: 700,
              }}
            >
              تغيير كلمة المرور
            </span>
            
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#a1aebe] hover:text-[#2d3648] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <p
            style={{
              ...F,
              fontSize: 15,
              color: "#166534",
              textAlign: "center",
            }}
          >
            تم تغيير كلمة المرور بنجاح ✓
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            {(
              [
                {
                  key: "current",
                  label: "كلمة المرور الحالية",
                },
                { key: "next", label: "كلمة المرور الجديدة" },
                { key: "confirm", label: "تأكيد كلمة المرور" },
              ] as const
            ).map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1">
                <label
                  style={{
                    ...F,
                    fontSize: 13,
                    color: "#717d96",
                  }}
                >
                  {label}
                </label>
                <input
                  type="password"
                  value={form[key]}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      [key]: e.target.value,
                    }))
                  }
                  className={`h-[44px] w-full rounded-[8px] border px-3 text-right outline-none transition-colors focus:border-[#5B795F] ${errors[key] ? "border-red-500" : "border-[#e2e7f0]"}`}
                  style={{
                    ...F,
                    fontSize: 14,
                    color: "#2d3648",
                  }}
                />
                {errors[key] && (
                  <span
                    style={{
                      ...F,
                      fontSize: 12,
                      color: "#e3282c",
                    }}
                  >
                    {errors[key]}
                  </span>
                )}
              </div>
            ))}
            <button
              type="submit"
              className="h-[48px] rounded-[8px] flex items-center justify-center mt-1 transition-opacity hover:opacity-90"
              style={{
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
              }}
            >
              <span
                style={{ ...F, fontSize: 15, color: "#fff" }}
              >
                حفظ كلمة المرور
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Change Picture Modal ──────────────────────────────────────────────────────
function ChangePictureModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(onClose, 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      dir="rtl"
    >
      <div className="bg-white rounded-[20px] p-6 w-[90%] max-w-sm flex flex-col gap-5 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#DCF4DF" }}
            >
              <ImagePlus
                size={16}
                style={{ color: "#5B795F" }}
              />
            </div>
            <span
              style={{
                ...F,
                fontSize: 18,
                color: "#2d3648",
                fontWeight: 700,
              }}
            >
              تغيير الصورة الشخصية
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#a1aebe] hover:text-[#2d3648] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {saved ? (
          <p
            style={{
              ...F,
              fontSize: 15,
              color: "#166534",
              textAlign: "center",
            }}
          >
            تم تحديث الصورة بنجاح ✓
          </p>
        ) : (
          <>
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
                border: `2px dashed ${dragging ? "#5B795F" : "#cbd2e0"}`,
                background: dragging ? "#f0f4ff" : "#ffffff",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {preview ? (
                <img
                  src={preview}
                  alt="معاينة"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#5B795F]"
                />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#DCF4DF] flex items-center justify-center">
                    <ImagePlus
                      size={28}
                      style={{ color: "#5B795F" }}
                    />
                  </div>
                  <p
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#4a5468",
                      textAlign: "center",
                    }}
                  >
                    اسحب الصورة هنا أو انقر للاختيار
                  </p>
                  <p
                    style={{
                      ...F,
                      fontSize: 12,
                      color: "#a1aebe",
                    }}
                  >
                    PNG, JPG مسموح بهما
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={!preview}
              className="h-[48px] rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{
                background:
                  "linear-gradient(to bottom, #00b867, #00522e)",
              }}
            >
              <span
                style={{ ...F, fontSize: 15, color: "#fff" }}
              >
                حفظ الصورة
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
interface DashboardHeaderProps {
  pageTitle?: string;
}

export function DashboardHeader({
  pageTitle = "الموقف العام",
}: DashboardHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modal, setModal] = useState<
    "password" | "picture" | null
  >(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, []);

  return (
    <>
      <header className="bg-white h-[100px] w-full border-b border-[#eff0f6] flex items-center justify-between px-7 shrink-0">
        {/* Right: Page title */}
        <div className="flex items-center">
          <span
            style={{
              color: "#2d3648",
              fontFamily: "'Almarai', sans-serif",
              fontSize: "18px",
            }}
          >
            {pageTitle}
          </span>
        </div>

        {/* Left: User info + avatar */}
        <div className="flex items-center gap-3">
          {/* Avatar + dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="bg-[#ffb31f] w-10 h-10 rounded-full overflow-hidden relative focus:outline-none ring-offset-1 transition-shadow hover:ring-2 hover:ring-[#ffb31f]/60"
              aria-label="قائمة المستخدم"
            >
              <img
                src={imgAvatar}
                alt="اسلام مجدي"
                className="absolute object-contain pointer-events-none"
                style={{
                  inset: "-35% -40% -45% -40%",
                  width: "180%",
                  height: "180%",
                }}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div
                className="absolute left-0 top-[calc(100%+8px)] z-50 bg-white rounded-[12px] border border-[#eff0f6] shadow-lg overflow-hidden min-w-[180px]"
                dir="rtl"
              >
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setModal("password");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6fb] transition-colors text-right"
                >
                  <KeyRound
                    size={16}
                    style={{ color: "#5B795F" }}
                    className="shrink-0"
                  />
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                    }}
                  >
                    تغيير كلمة المرور
                  </span>
                </button>
                <div className="h-px bg-[#eff0f6]" />
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setModal("picture");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6fb] transition-colors text-right"
                >
                  <ImagePlus
                    size={16}
                    style={{ color: "#5B795F" }}
                    className="shrink-0"
                  />
                  <span
                    style={{
                      ...F,
                      fontSize: 14,
                      color: "#2d3648",
                    }}
                  >
                    تغيير الصورة الشخصية
                  </span>
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-start gap-0.5">
              <span
                style={{
                  color: "#64748b",
                  fontFamily: "'Almarai', sans-serif",
                  fontSize: "12px",
                }}
              >
                مرحبا بك
              </span>
              <span
                style={{
                  color: "#081021",
                  fontFamily: "'Almarai', sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                جندي / اسلام مجدي
              </span>
            </div>
          </div>
          <ChevronDown size={18} className="text-[#081021]" />
        </div>
      </header>

      {/* Modals */}
      {modal === "password" && (
        <ChangePasswordModal onClose={() => setModal(null)} />
      )}
      {modal === "picture" && (
        <ChangePictureModal onClose={() => setModal(null)} />
      )}
    </>
  );
}