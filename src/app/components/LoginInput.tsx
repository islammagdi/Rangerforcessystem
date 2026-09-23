import React, { useState } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      width={20}
      height={20}
      stroke="currentColor"
      strokeWidth={1.7}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      width={20}
      height={20}
      stroke="currentColor"
      strokeWidth={1.7}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      width={16}
      height={16}
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      width={20}
      height={20}
      stroke="currentColor"
      strokeWidth={1.7}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ) : (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      width={20}
      height={20}
      stroke="currentColor"
      strokeWidth={1.7}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

// ─── LoginInput ───────────────────────────────────────────────────────────────

interface LoginInputProps {
  id: string;
  label: string;
  type?: "text" | "password";
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: "user" | "lock";
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: string;
  /** نص مساعد صغير يظهر أسفل الحقل (يختفي عند وجود خطأ) */
  hint?: string;
}

/**
 * حقل إدخال بعنوان علوي وأيقونة على جهة البداية (يمين في RTL).
 * حقول كلمة المرور فيها زر إظهار/إخفاء على الجهة المقابلة.
 */
export function LoginInput({
  id,
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
  icon,
  autoComplete,
  autoFocus,
  disabled = false,
  error,
  hint,
}: LoginInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const resolvedType = isPassword
    ? showPassword
      ? "text"
      : "password"
    : type;

  const describedBy = error
    ? `${id}-error`
    : hint
      ? `${id}-hint`
      : undefined;

  return (
    <div
      className="w-full flex flex-col gap-2"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      {/* Label */}
      <label
        htmlFor={id}
        className="text-right text-[14px] font-bold text-[#1c2b20]"
      >
        {label}
      </label>

      {/* Field */}
      <div
        className={[
          "group relative w-full rounded-xl border bg-[#f6f8f6]",
          "transition-[border-color,box-shadow,background-color] duration-150",
          error
            ? "border-red-400 bg-red-50/40 focus-within:ring-4 focus-within:ring-red-500/10"
            : "border-[#dbe3dc] hover:border-[#b9c7bb] focus-within:border-[#067647] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#067647]/10",
          disabled ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {/* Leading icon (right side in RTL) */}
        <span
          className={[
            "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors",
            error
              ? "text-red-400"
              : "text-[#8a9a8d] group-focus-within:text-[#067647]",
          ].join(" ")}
        >
          {icon === "user" ? <UserIcon /> : <LockIcon />}
        </span>

        <input
          id={id}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          dir="rtl"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            "block h-12 w-full min-w-0 rounded-xl bg-transparent outline-none",
            "pr-11 text-right text-[16px] sm:text-[15px] text-[#1c2b20] placeholder:text-[#9aa8a0]",
            isPassword ? "pl-12" : "pl-4",
          ].join(" ")}
          style={{ fontFamily: "'Almarai', sans-serif" }}
        />

        {/* Show / hide password */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            disabled={disabled}
            className="absolute left-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8a9a8d] transition-colors hover:bg-[#e9efe9] hover:text-[#1c2b20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#067647]/40"
            aria-label={
              showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
            }
            aria-pressed={showPassword}
          >
            <EyeIcon open={showPassword} />
          </button>
        )}
      </div>

      {/* Error / hint */}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-right text-[13px] leading-5 text-red-600"
        >
          <span className="mt-0.5">
            <AlertIcon />
          </span>
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p
          id={`${id}-hint`}
          className="text-right text-[12px] leading-5 text-[#6b7b70]"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}