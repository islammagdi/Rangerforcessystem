import { useEffect, useMemo, useState } from "react";
import { fetchUnits, buildUnitsTree, type UnitTreeNode } from "../../lib/units";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

const INDENT = 40; // مسافة الإزاحة لكل مستوى (بالبكسل)
const LINE_COLOR = "#d3dae6";
const TIE_TOP = 24; // ارتفاع نقطة اتصال الخط الأفقي بمنتصف الكارت تقريبًا

/* =========================================================
   كارت الوحدة
========================================================= */

function UnitCard({
  node,
  isRoot,
}: {
  node: UnitTreeNode;
  isRoot: boolean;
}) {
  return (
    <div
      className="bg-white rounded-[12px] border px-4 py-2.5 flex items-center gap-3 flex-wrap"
      style={{
        borderColor: isRoot ? "#00b867" : "#e2e7f0",
        borderWidth: isRoot ? 2 : 1,
        boxShadow: isRoot
          ? "0 3px 10px rgba(0,184,103,0.12)"
          : "0 1px 4px rgba(45,54,72,0.04)",
      }}
    >
      <span
        style={{
          ...F,
          fontSize: isRoot ? 15.5 : 14,
          fontWeight: isRoot ? 700 : 600,
          color: "#2d3648",
        }}
      >
        {node.name}
      </span>

      {node.code && (
        <span style={{ ...F, fontSize: 11, color: "#a1aebe" }}>
          {node.code}
        </span>
      )}

      {node.children.length > 0 && (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full"
          style={{
            background: "#eef1fb",
            ...F,
            fontSize: 11,
            fontWeight: 700,
            color: "#28348a",
          }}
        >
          {node.children.length} وحدة تابعة
        </span>
      )}
    </div>
  );
}

/* =========================================================
   فرع الشجرة - عمودي (Recursive)
   كل مستوى بينزل تحت، وبياخد إزاحة إضافية لليمين عن اللي قبله
   عن طريق border-right على حاوية الإخوة (بيشتغل كـ"جذع" الشجرة)
========================================================= */

function TreeBranch({
  node,
  isRoot = false,
}: {
  node: UnitTreeNode;
  isRoot?: boolean;
}) {
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div className="py-1.5">
        <UnitCard node={node} isRoot={isRoot} />
      </div>

      {hasChildren && (
        <div
          style={{
            marginRight: 1,
            borderRight: `1px solid ${LINE_COLOR}`,
            paddingRight: INDENT,
          }}
        >
          {node.children.map((child, index) => {
            const isLast = index === node.children.length - 1;

            return (
              <div key={child.id} className="relative">
                {/* الخط الأفقي القصير اللي بيوصل الجذع بالكارت */}
                <div
                  className="absolute"
                  style={{
                    right: -INDENT,
                    top: TIE_TOP,
                    width: INDENT,
                    height: 1,
                    background: LINE_COLOR,
                  }}
                  aria-hidden="true"
                />

                {/* تغطية الجذع بعد آخر عنصر عشان ميكملش نازل لتحت خالص */}
                {isLast && (
                  <div
                    className="absolute bg-white"
                    style={{
                      right: -INDENT - 1,
                      top: TIE_TOP,
                      bottom: 0,
                      width: 3,
                    }}
                    aria-hidden="true"
                  />
                )}

                <TreeBranch node={child} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   الصفحة
========================================================= */

export function UnitsTreePage() {
  const [tree, setTree] = useState<UnitTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    void loadUnits();
  }, []);

  async function loadUnits() {
    setLoading(true);
    setError("");

    try {
      const units = await fetchUnits();
      setTree(buildUnitsTree(units));
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحميل بيانات الوحدات");
    } finally {
      setLoading(false);
    }
  }

  // فلترة: بنعرض بس الفروع اللي فيها تطابق بالاسم (الأب أو أي ابن)
  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) return tree;

    const term = searchTerm.trim().toLowerCase();

    function filterNode(node: UnitTreeNode): UnitTreeNode | null {
      const matches = node.name.toLowerCase().includes(term);
      const filteredChildren = node.children
        .map(filterNode)
        .filter((n): n is UnitTreeNode => n !== null);

      if (matches || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }

      return null;
    }

    return tree
      .map(filterNode)
      .filter((n): n is UnitTreeNode => n !== null);
  }, [tree, searchTerm]);

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <div className="flex items-center justify-between w-full flex-wrap gap-3">
        <h1
          style={{
            ...F,
            fontWeight: 700,
            fontSize: "clamp(22px,4vw,32px)",
            color: "#2d3648",
          }}
        >
          الهيكل التنظيمي للوحدات
        </h1>
      </div>

      {error && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            ...F,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* البحث */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] p-5">
        <div
          className="flex items-center gap-2 bg-white border border-[#e2e7f0] rounded-[8px] px-3 h-[44px] max-w-[320px]"
          dir="rtl"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم الوحدة"
            className="flex-1 bg-transparent outline-none text-right"
            style={{ ...F, fontSize: 14, color: "#2d3648" }}
          />
        </div>
      </section>

      {/* الشجرة */}
      <section className="bg-white rounded-[20px] border border-[#eff0f6] p-6">
        {loading ? (
          <div className="py-16 text-center">
            <p style={{ ...F, fontSize: 14, color: "#717d96" }}>
              جاري تحميل البيانات...
            </p>
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="py-16 text-center">
            <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
              لا توجد وحدات مطابقة
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredTree.map((root) => (
              <TreeBranch key={root.id} node={root} isRoot />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}