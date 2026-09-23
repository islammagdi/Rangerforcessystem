import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { getBreadcrumbs } from "../../lib/breadcrumbs";
import { useUnsavedChanges } from "../../../lib/unsavedChanges";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

export function Breadcrumbs({ pathname }: { pathname: string }) {
  const navigate = useNavigate();
  const { guardNavigation } = useUnsavedChanges();
  const steps = getBreadcrumbs(pathname);

  return (
    <nav className="flex items-center gap-1.5 flex-wrap" dir="rtl">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <span key={index} className="flex items-center gap-1.5">
            {step.path && !isLast ? (
              <button
                type="button"
                onClick={() => guardNavigation(() => navigate(step.path!))}
                className="hover:underline transition-colors"
                style={{
                  ...F,
                  fontSize: 14,
                  color: "#717d96",
                }}
              >
                {step.label}
              </button>
            ) : (
              <span
                style={{
                  ...F,
                  fontSize: 15,
                  fontWeight: isLast ? 700 : 400,
                  color: isLast ? "#2d3648" : "#717d96",
                }}
              >
                {step.label}
              </span>
            )}

            {!isLast && (
              <ChevronLeft size={14} className="text-[#cbd2e0] shrink-0" />
            )}
          </span>
        );
      })}
    </nav>
  );
}