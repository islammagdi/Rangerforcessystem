import React, { useState } from "react";
import svgPaths from "../../imports/تسجيلالدخول/svg-9l9hko8aij";

// ─── Icon components ──────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <svg fill="none" viewBox="0 0 18 20" width={18} height={20}>
      <path
        clipRule="evenodd"
        d={svgPaths.p15ee0d00}
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg fill="none" viewBox="0 0 18 20" width={18} height={20}>
      <path
        clipRule="evenodd"
        d={svgPaths.p14ef5b00}
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      width={18}
      height={18}
      stroke="currentColor"
      strokeWidth={1.8}
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
      width={18}
      height={18}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

// ─── Divider ───────────────────────────────────────────────────────────────────

function VerticalDivider() {
  return (
    <div className="w-px h-[22px] bg-[#2d3648]/30 shrink-0" />
  );
}

// ─── LoginInput ────────────────────────────────────────────────────────────────

interface LoginInputProps {
  id: string;
  label: string;
  type?: "text" | "password";
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: "user" | "lock";
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
}

/**
 * Reusable labelled input with an icon on the trailing side (RTL-aware).
 * Supports text and password types; password fields include a show/hide toggle.
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
  disabled = false,
  error,
}: LoginInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const resolvedType =
    type === "password"
      ? showPassword
        ? "text"
        : "password"
      : type;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Label */}
      <label
        htmlFor={id}
        className="block text-[#2d3648] text-right px-1"
        style={{
          fontFamily: "'Almarai', sans-serif",
          fontWeight: 700,
          fontSize: "14px",
        }}
      >
        {label}
      </label>

      {/* Input wrapper */}
      <div
        className={[
          "relative flex flex-row-reverse items-center w-full rounded-[8px] bg-[#f5f5f5]",
          "border transition-all duration-150",
          error
            ? "border-red-400 ring-2 ring-red-200"
            : "border-[#e2e7f0] focus-within:border-[#1f3d97] focus-within:ring-2 focus-within:ring-[#1f3d97]/20",
          disabled ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {/* Actual input — full width, RTL text */}
        <input
          id={id}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          dir="rtl"
          className={[
            "flex-1 min-w-0 bg-transparent outline-none px-3 py-3 pr-10 text-right",
            "text-[#2d3648] placeholder-[#9aa5b8] text-right",
          ].join(" ")}
          style={{
            fontFamily: "'Almarai', sans-serif",
            fontSize: "14px",
          }}
        />

        {/* Password toggle (only for password fields) */}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            disabled={disabled}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-[#9aa5b8] hover:text-[#2d3648] transition-colors focus:outline-none"
            aria-label={
              showPassword
                ? "إخفاء كلمة المرور"
                : "إظهار كلمة المرور"
            }
          >
            <EyeIcon open={showPassword} />
          </button>
        )}

        {/* Divider */}
        <VerticalDivider />

        {/* Icon */}
        <span className="px-3 text-[#2d3648] flex items-center shrink-0">
          {icon === "user" ? <UserIcon /> : <LockIcon />}
        </span>
      </div>

      {/* Error message */}
      {error && (
        <p
          className="text-red-500 text-right px-1"
          style={{
            fontFamily: "'Almarai', sans-serif",
            fontSize: "12px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}