import { useState } from "react";
import { Plus, X } from "lucide-react";
import { DROPDOWN_SOURCES } from "../../../lib/sheets";

const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

export function DropdownColumnConfig({
  source,
  options,
  onChange,
}: {
  source: string | null;
  options: string[];
  onChange: (next: { source: string | null; options: string[] }) => void;
}) {
  const [draft, setDraft] = useState("");
  const [bulk, setBulk] = useState("");

  function addOne(value: string) {
    const v = value.trim();
    if (!v || options.includes(v)) return;
    onChange({ source: null, options: [...options, v] });
  }

  function addBulk() {
    const lines = bulk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...options, ...lines]));
    onChange({ source: null, options: merged });
    setBulk("");
  }

  function removeOption(value: string) {
    onChange({ source: null, options: options.filter((o) => o !== value) });
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-[8px] border border-[#e2e7f0] bg-[#f7f9fc] p-3"
      dir="rtl"
    >
      <div className="flex flex-col gap-1.5">
        <label style={{ ...F, fontWeight: 700, fontSize: 13, color: "#2d3648" }}>
          مصدر القيم
        </label>
        <select
          value={source ?? "manual"}
          onChange={(e) =>
            onChange({
              source: e.target.value === "manual" ? null : e.target.value,
              options: [],
            })
          }
          dir="rtl"
          className="h-[40px] rounded-[8px] border border-[#e2e7f0] px-2 text-right outline-none focus:border-[#00b867] bg-white"
          style={{ ...F, fontSize: 13, color: "#2d3648" }}
        >
          <option value="manual">إدخال يدوي</option>
          {Object.entries(DROPDOWN_SOURCES).map(([key, cfg]) => (
            <option key={key} value={key}>
              من جدول: {cfg.label}
            </option>
          ))}
        </select>
      </div>

      {source ? (
        <p style={{ ...F, fontSize: 12, color: "#717d96" }}>
          القيم هتتسحب تلقائيًا من جدول "{DROPDOWN_SOURCES[source]?.label}" وأي
          إضافة جديدة في الجدول هتظهر في القائمة.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOne(draft);
                  setDraft("");
                }
              }}
              placeholder="اكتب قيمة واضغط Enter"
              dir="rtl"
              className="flex-1 h-[40px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
              style={{ ...F, fontSize: 13, color: "#2d3648" }}
            />
            <button
              type="button"
              onClick={() => {
                addOne(draft);
                setDraft("");
              }}
              className="h-[40px] px-3 rounded-[8px] flex items-center gap-1"
              style={{ background: "#DCF4DF", color: "#00522e", ...F, fontSize: 13 }}
            >
              <Plus size={14} />
              إضافة
            </button>
          </div>

          <details>
            <summary style={{ ...F, fontSize: 12, color: "#1f3d97", cursor: "pointer" }}>
              إضافة عدة قيم دفعة واحدة (كل قيمة في سطر)
            </summary>
            <div className="flex flex-col gap-2 mt-2">
              <textarea
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                rows={4}
                dir="rtl"
                className="w-full rounded-[8px] border border-[#e2e7f0] p-2 text-right outline-none focus:border-[#00b867] bg-white"
                style={{ ...F, fontSize: 13, color: "#2d3648" }}
              />
              <button
                type="button"
                onClick={addBulk}
                className="self-start h-[34px] px-3 rounded-[8px]"
                style={{ background: "#f0f2fd", color: "#1f3d97", ...F, fontSize: 13 }}
              >
                إضافة القيم
              </button>
            </div>
          </details>

          <div className="flex flex-wrap gap-2">
            {options.length === 0 && (
              <span style={{ ...F, fontSize: 12, color: "#a1aebe" }}>
                لم تتم إضافة أي قيم بعد
              </span>
            )}
            {options.map((opt) => (
              <span
                key={opt}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCF4DF]"
                style={{ ...F, fontSize: 12, color: "#00522e" }}
              >
                {opt}
                <button type="button" onClick={() => removeOption(opt)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}