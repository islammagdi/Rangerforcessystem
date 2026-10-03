import { useState } from "react";
import type { CSSProperties } from "react";
import {
  saveLetterDraft,
  useLetterDraft,
  isLetterDraftDirty,
  DRAFT_TTL_DAYS,
} from "../../lib/letterDraft";

const F: CSSProperties = { fontFamily: "'Almarai', sans-serif" };

export function SaveDraftButton() {
  const draft = useLetterDraft();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  const hasSoldiers = draft.soldiers.length > 0;
  const dirty = isLetterDraftDirty(draft);
  const alreadySaved = Boolean(draft.draftId) && !dirty;

  async function handleClick() {
    if (saving || !hasSoldiers) return;

    setSaving(true);
    setMessage(null);

    const result = await saveLetterDraft();

    setSaving(false);

    setMessage(
      result.ok
        ? {
            kind: "ok",
            text: `تم حفظ المسودة. هتفضل متاحة ${DRAFT_TTL_DAYS} أيام من آخر حفظ، وتقدر تكمّلها من صفحة السجل.`,
          }
        : { kind: "error", text: result.error }
    );
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <button
        type="button"
        disabled={saving || !hasSoldiers}
        onClick={() => void handleClick()}
        className="min-h-[48px] px-6 rounded-[8px] border bg-white transition-opacity hover:opacity-90"
        style={{
          borderColor: "#2d3648",
          opacity: saving || !hasSoldiers ? 0.5 : 1,
          cursor: saving || !hasSoldiers ? "not-allowed" : "pointer",
        }}
      >
        <span style={{ ...F, fontSize: 15, color: "#2d3648" }}>
          {saving
            ? "جاري حفظ المسودة..."
            : alreadySaved
            ? "تم حفظ المسودة ✓"
            : "حفظ كمسودة"}
        </span>
      </button>

      {message && (
        <p
          style={{
            ...F,
            fontSize: 13,
            color: message.kind === "ok" ? "#00854a" : "#b91c1c",
            lineHeight: 1.6,
          }}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}