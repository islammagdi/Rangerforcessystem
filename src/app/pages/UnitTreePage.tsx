import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronDown, Pencil, X } from "lucide-react";

const F: React.CSSProperties = { fontFamily: "'Almarai', sans-serif" };

// ─── Data types ───────────────────────────────────────────────────────────────
interface TreeNode {
  id: string;
  name: string;
  power: number;
  active: boolean;
  children?: TreeNode[];
}

// ─── Tree data per root unit ──────────────────────────────────────────────────
const UNIT_TREES: Record<string, TreeNode> = {
  "1": {
    id: "1",
    name: "قيادة قوات الصاعقة",
    power: 1740,
    active: true,
    children: [
      {
        id: "1-1", name: "مجموعة 145 صاعقة", power: 1740, active: true,
        children: [
          { id: "1-1-1", name: "ك 143 صع",         power: 1740, active: true, children: [] },
          { id: "1-1-2", name: "ك 144 صع",         power: 1740, active: true, children: [] },
          { id: "1-1-3", name: "ك 145 صع",         power: 1740, active: false, children: [] },
        ],
      },
      {
        id: "1-2", name: "مجموعة 43 صاعقة", power: 980, active: false,
        children: [
          { id: "1-2-1", name: "ك 43 صع", power: 980, active: false, children: [] },
        ],
      },
    ],
  },
  "2": {
    id: "2",
    name: "مج العمليات الخاصة",
    power: 1740,
    active: true,
    children: [
      {
        id: "2-1", name: "قيا مج 145 صع", power: 1740, active: true,
        children: [
          {
            id: "2-1-1", name: "ك 144 صع", power: 1740, active: true,
            children: [],
          },
          {
            id: "2-1-2", name: "ك 43 صع", power: 1740, active: true,
            children: [],
          },
          {
            id: "2-1-3", name: "ك 70 صع", power: 1740, active: true,
            children: [
              { id: "2-1-3-1", name: "س 145 اشارة",    power: 1740, active: true, children: [] },
              { id: "2-1-3-2", name: "س 145 كيميا",     power: 1740, active: true, children: [] },
              {
                id: "2-1-3-3", name: "س 145 مهندسين", power: 1740, active: true,
                children: [
                  { id: "2-1-3-3-1", name: "س 145 قيادة", power: 1740, active: true, children: [] },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "2-2", name: "ك 145 صع", power: 1740, active: true,
        children: [],
      },
    ],
  },
};

// fallback tree
function makeFallbackTree(id: string, name: string): TreeNode {
  return {
    id,
    name,
    power: 1200,
    active: true,
    children: [
      { id: `${id}-1`, name: "وحدة فرعية 1", power: 400, active: true, children: [] },
      { id: `${id}-2`, name: "وحدة فرعية 2", power: 400, active: true, children: [] },
      { id: `${id}-3`, name: "وحدة فرعية 3", power: 400, active: false, children: [] },
    ],
  };
}

const UNIT_NAMES: Record<string, string> = {
  "1": "قيادة قوات الصاعقة",
  "2": "مج العمليات الخاصة",
  "3": "المجموعة 43 صاعقة",
  "4": "المجموعة 145 صاعقة",
  "5": "المجموعة 127 صاعقة",
  "6": "فرع التنظيم والادارة",
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="relative shrink-0 rounded-full transition-colors duration-200 focus:outline-none"
      style={{
        width: 48,
        height: 26,
        background: enabled ? "#2EA324" : "#d1d5db",
      }}
      aria-checked={enabled}
      role="switch"
    >
      <span
        className="absolute top-[3px] rounded-full bg-white shadow transition-transform duration-200"
        style={{
          width: 20,
          height: 20,
          transform: enabled ? "translateX(25px)" : "translateX(3px)",
        }}
      />
    </button>
  );
}

// ─── Tree Node Card ───────────────────────────────────────────────────────────
interface NodeCardProps {
  node: TreeNode;
  onEditClick: (node: TreeNode) => void;
  onToggle: (id: string, val: boolean) => void;
}

function NodeCard({ node, onEditClick, onToggle }: NodeCardProps) {
  return (
    <div
      className="bg-white rounded-[12px] border border-[#e2e7f0] p-3 flex flex-col gap-2 min-w-[160px] max-w-[220px] shadow-sm select-none"
      dir="rtl"
    >
      {/* Name + badge */}
      <div className="flex items-center gap-2 justify-end">
        <span style={{ ...F, fontSize: 15, fontWeight: 700, color: "#2d3648" }}>{node.name}</span>
        <span
          className="px-1.5 py-0.5 rounded-[4px]"
          style={{
            background: node.active ? "#ebfaea" : "#fce9ea",
            ...F, fontSize: 11, fontWeight: 700,
            color: node.active ? "#2ea324" : "#c5481b",
          }}
        >
          {node.active ? "مفعلة" : "غير مفعلة"}
        </span>
      </div>

      {/* Power */}
      <div className="flex items-start justify-end gap-1">
        <span style={{ ...F, fontSize: 16, fontWeight: 700, color: "#2d3648" }}>{node.power.toLocaleString("ar-EG")}</span>
        <span style={{ ...F, fontSize: 11, color: "#717d96" }} className="mt-1">عدد القوه</span>
      </div>

      {/* Toggle + Edit */}
      <div className="flex items-center justify-end gap-2">
        {/* Edit button */}
        <button
          type="button"
          onClick={() => onEditClick(node)}
          className="w-8 h-8 rounded-[8px] flex items-center justify-center hover:bg-[#d8dafb] transition-colors"
          style={{ background: "#ebedfd" }}
        >
          <Pencil size={14} style={{ color: "#2d3648" }} />
        </button>
        {/* Toggle */}
        <ToggleSwitch enabled={node.active} onChange={(v) => onToggle(node.id, v)} />
      </div>
    </div>
  );
}

// ─── Diamond connector ────────────────────────────────────────────────────────
function Diamond() {
  return (
    <div
      className="shrink-0"
      style={{
        width: 12, height: 12,
        background: "#9ca3af",
        transform: "rotate(45deg)",
      }}
    />
  );
}

// ─── Recursive Tree Renderer ──────────────────────────────────────────────────
// This renders a node and its children in a vertical tree layout
// using flexbox columns and CSS-drawn connecting lines.
interface TreeLevelProps {
  node: TreeNode;
  onEditClick: (node: TreeNode) => void;
  onToggle: (id: string, val: boolean) => void;
  isRoot?: boolean;
}

function TreeLevel({ node, onEditClick, onToggle, isRoot }: TreeLevelProps) {
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div className="flex flex-col items-center" style={{ gap: 0 }}>
      {/* Node card */}
      <NodeCard node={node} onEditClick={onEditClick} onToggle={onToggle} />

      {/* Connector down */}
      {hasChildren && (
        <>
          {/* Vertical line + diamond */}
          <div className="flex flex-col items-center">
            <div style={{ width: 2, height: 24, background: "#9ca3af" }} />
            <Diamond />
            <div style={{ width: 2, height: 24, background: "#9ca3af" }} />
          </div>

          {/* Horizontal branch spanning children */}
          <div className="flex items-start" style={{ gap: 0 }}>
            {node.children!.map((child, idx) => {
              const total = node.children!.length;
              const isOnly = total === 1;
              const isFirst = idx === 0;
              const isLast = idx === total - 1;

              return (
                <div key={child.id} className="flex flex-col items-center" style={{ position: "relative" }}>
                  {/* Horizontal branch line (T-connector) */}
                  {!isOnly && (
                    <div
                      className="flex items-center"
                      style={{ height: 2, position: "relative", width: "100%" }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: isFirst ? "50%" : 0,
                          right: isLast ? "50%" : 0,
                          top: 0,
                          height: 2,
                          background: "#9ca3af",
                        }}
                      />
                    </div>
                  )}

                  {/* Vertical drop */}
                  <div style={{ width: 2, height: 20, background: "#9ca3af" }} />

                  {/* Child padding for spacing */}
                  <div style={{ padding: "0 12px" }}>
                    <TreeLevel
                      node={child}
                      onEditClick={onEditClick}
                      onToggle={onToggle}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const UNIT_TYPE_OPTIONS = ["وحدة اساسية", "وحدة فرعية", "وحدة ادارية"];
const UNIT_KIND_OPTIONS  = ["كتيبة", "سرية", "مجموعة", "فرقة", "قيادة"];
const PARENT_UNITS       = ["مج 145 صع", "مج 43 صع", "مج العمليات الخاصة", "قيادة قوات الصاعقة"];

interface EditField { label: string; value: string; onChange: (v: string) => void; options?: string[]; }

function EditFormField({ label, value, onChange, options }: EditField) {
  const [open, setOpen] = useState(false);
  if (options) {
    return (
      <div className="flex flex-col gap-1.5 w-full" dir="rtl">
        <label style={{ ...F, fontSize: 15, fontWeight: 700, color: "#2d3648" }}>{label}</label>
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-full h-[46px] bg-white border border-[#e2e7f0] rounded-[8px] flex items-center gap-2 px-3 hover:border-[#a0aec0] transition-colors"
            dir="rtl"
          >
            <ChevronDown size={16} className={`shrink-0 text-[#2d3648] transition-transform ${open ? "rotate-180" : ""}`} />
            <span className="flex-1 text-right" style={{ ...F, fontSize: 17, color: "#4a5468" }}>{value}</span>
          </button>
          {open && (
            <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-[#e2e7f0] rounded-[8px] shadow-lg overflow-hidden" dir="rtl">
              {options.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt); setOpen(false); }}
                    className={["w-full text-right px-4 py-2 transition-colors", opt === value ? "bg-[#f0f2fd] text-[#1f3d97]" : "hover:bg-[#f5f6fb] text-[#2d3648]"].join(" ")}
                    style={{ ...F, fontSize: 15 }}
                  >{opt}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full" dir="rtl">
      <label style={{ ...F, fontSize: 15, fontWeight: 700, color: "#2d3648" }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[46px] bg-white border border-[#e2e7f0] rounded-[8px] px-3 text-right outline-none focus:border-[#00b867] transition-colors"
        style={{ ...F, fontSize: 17, color: "#4a5468" }}
        dir="rtl"
      />
    </div>
  );
}

function EditModal({ node, onClose }: { node: TreeNode; onClose: () => void }) {
  const [name,       setName]       = useState(node.name);
  const [unitType,   setUnitType]   = useState(UNIT_TYPE_OPTIONS[0]);
  const [unitKind,   setUnitKind]   = useState(UNIT_KIND_OPTIONS[0]);
  const [parentUnit, setParentUnit] = useState(PARENT_UNITS[0]);

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      dir="rtl"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-[24px] p-6 w-full max-w-md flex flex-col gap-5 shadow-xl">

        {/* Close button */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-[#ccc] hover:text-[#888] transition-colors">
            <X size={20} />
          </button>
          {/* Title + icon */}
          <div className="flex flex-col items-center flex-1 gap-1.5">
            {/* Edit icon (green gradient) */}
            <div
              className="w-10 h-10 flex items-center justify-center rounded-full"
              style={{ background: "linear-gradient(to bottom, #00b867, #00522e)" }}
            >
              <Pencil size={18} style={{ color: "#fff" }} />
            </div>
            <p style={{ ...F, fontSize: 18, fontWeight: 700, color: "#122b16" }}>تعديل وحده</p>
          </div>
          {/* spacer */}
          <div className="w-6" />
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-4">
          <EditFormField
            label="اسم الوحدة"
            value={name}
            onChange={setName}
          />
          <EditFormField
            label="تقسيمة الوحده"
            value={unitType}
            onChange={setUnitType}
            options={UNIT_TYPE_OPTIONS}
          />
          <div className="grid grid-cols-2 gap-3">
            <EditFormField
              label="الوحده التابعه لها"
              value={parentUnit}
              onChange={setParentUnit}
              options={PARENT_UNITS}
            />
            <EditFormField
              label="نوع الوحده"
              value={unitKind}
              onChange={setUnitKind}
              options={UNIT_KIND_OPTIONS}
            />
          </div>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full h-[52px] rounded-[8px] flex items-center justify-center transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(to bottom, #00b867, #00522e)" }}
        >
          <span style={{ ...F, fontSize: 16, color: "#f5f5f5" }}>حفظ التعديلات</span>
        </button>
      </div>
    </div>
  );
}

// ─── Clean recursive tree with SVG connectors ─────────────────────────────────
// Uses a canvas approach: we render nodes + measure them, then draw SVG lines
// For simplicity: uses a clean flex-based org-chart

interface OrgNodeProps {
  node: TreeNode;
  onEdit: (n: TreeNode) => void;
  onToggle: (id: string, v: boolean) => void;
}

function OrgNode({ node, onEdit, onToggle }: OrgNodeProps) {
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <NodeCard node={node} onEditClick={onEdit} onToggle={onToggle} />

      {hasChildren && (
        <>
          {/* Vertical line down from card */}
          <div className="flex flex-col items-center">
            <div style={{ width: 2, height: 20, background: "#9ca3af" }} />
            {/* Diamond */}
            <div style={{ width: 10, height: 10, background: "#9ca3af", transform: "rotate(45deg)", flexShrink: 0 }} />
            <div style={{ width: 2, height: 20, background: "#9ca3af" }} />
          </div>

          {/* Children row */}
          <div className="flex flex-row items-start" style={{ gap: 24 }}>
            {node.children!.map((child, idx) => {
              const total = node.children!.length;
              return (
                <div key={child.id} className="flex flex-col items-center relative" style={{ minWidth: 0 }}>
                  {/* T-connector horizontal segment */}
                  {total > 1 && (
                    <div className="relative w-full" style={{ height: 2 }}>
                      {/* Left half line */}
                      {idx > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            right: "50%",
                            top: 0,
                            width: "50%",
                            height: 2,
                            background: "#9ca3af",
                          }}
                        />
                      )}
                      {/* Right half line */}
                      {idx < total - 1 && (
                        <div
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: 0,
                            width: "50%",
                            height: 2,
                            background: "#9ca3af",
                          }}
                        />
                      )}
                    </div>
                  )}
                  {/* Vertical drop to child */}
                  <div style={{ width: 2, height: 20, background: "#9ca3af" }} />
                  {/* Recurse */}
                  <OrgNode node={child} onEdit={onEdit} onToggle={onToggle} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function UnitTreePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const rawTree = UNIT_TREES[id ?? ""] ?? makeFallbackTree(id ?? "x", UNIT_NAMES[id ?? ""] ?? "وحدة");
  const [tree, setTree] = useState<TreeNode>(rawTree);
  const [editNode, setEditNode] = useState<TreeNode | null>(null);

  function handleToggle(nodeId: string, val: boolean) {
    setTree((prev) => {
      function recurse(n: TreeNode): TreeNode {
        if (n.id === nodeId) return { ...n, active: val };
        return { ...n, children: n.children?.map(recurse) };
      }
      return recurse(prev);
    });
  }

  return (
    <div className="flex flex-col gap-5 w-full pb-10" dir="rtl">

      {/* Title */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/dashboard/manage-units")}
          className="text-[#717d96] hover:text-[#2d3648] transition-colors"
          style={{ ...F, fontSize: 14 }}
        >
          ‹ ادارة الوحدات
        </button>
      </div>

      <h1
        className="text-center"
        style={{ ...F, fontWeight: 700, fontSize: "clamp(22px,4vw,28px)", color: "#2d3648", lineHeight: 1.5 }}
      >
        {tree.name}
      </h1>

      {/* Tree canvas */}
      <div
        className="w-full overflow-auto rounded-[20px] border border-[#eff0f6] bg-white"
        style={{ minHeight: 400 }}
      >
        <div
          className="flex items-start justify-center p-8"
          style={{ minWidth: "max-content" }}
        >
          <OrgNode node={tree} onEdit={(n) => setEditNode(n)} onToggle={handleToggle} />
        </div>
      </div>

      {/* Edit Modal */}
      {editNode && (
        <EditModal node={editNode} onClose={() => setEditNode(null)} />
      )}
    </div>
  );
}