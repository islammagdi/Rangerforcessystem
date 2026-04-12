import React from "react";

interface LoginButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

/**
 * Green-gradient primary button used for form submission.
 * Supports hover, active, disabled and loading states.
 */
export function LoginButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  type = "submit",
  className = "",
}: LoginButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        "w-full min-h-[52px] rounded-[8px] px-5 py-3",
        "text-[#f5f5f5] transition-all duration-200",
        "flex items-center justify-center gap-2",
        // Gradient
        "bg-gradient-to-b from-[#00b867] to-[#00522e]",
        // Hover: slightly brighten
        "hover:from-[#00cc73] hover:to-[#006b3c] hover:shadow-md",
        // Active: scale down slightly
        "active:scale-[0.98] active:shadow-inner",
        // Disabled
        (disabled || loading)
          ? "opacity-60 cursor-not-allowed hover:from-[#00b867] hover:to-[#00522e] hover:shadow-none"
          : "cursor-pointer",
        className,
      ].join(" ")}
      style={{ fontFamily: "'Almarai', sans-serif", fontWeight: 400, fontSize: "16px" }}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <Spinner />
          <span>جاري التحميل...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width={18}
      height={18}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
