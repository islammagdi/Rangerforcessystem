import { supabase } from "./supabase";
export interface Unit {
  id: string;
  name: string;
  code: string | null;
  unit_type: string | null;
  parent_unit_id: string | null;
  is_active: boolean;
  sort_order: number | null;
}
export interface UnitTreeNode extends Unit {
  children: UnitTreeNode[];
}

/* =========================================================
   جلب كل الوحدات النشطة
========================================================= */
export async function fetchUnits(): Promise<Unit[]> {
  const { data, error } = await supabase
    .from("units")
    .select(
      "id, name, code, unit_type, parent_unit_id, is_active, sort_order"
    )
    .eq("is_active", true)
    .eq("unit_type", "MAIN")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}
/* =========================================================
   بناء الشجرة من القائمة المسطّحة
   (بيدعم أي عدد من المستويات، مش بس رئيسي/تابع)
========================================================= */

export function buildUnitsTree(units: Unit[]): UnitTreeNode[] {
  const map = new Map<string, UnitTreeNode>();

  units.forEach((u) => {
    map.set(u.id, { ...u, children: [] });
  });

  const roots: UnitTreeNode[] = [];

  map.forEach((node) => {
    if (node.parent_unit_id && map.has(node.parent_unit_id)) {
      map.get(node.parent_unit_id)!.children.push(node);
    } else {
      // مفيش أب موجود في القائمة (أو parent_unit_id = null)
      // يبقى دي وحدة جذر (Root)
      roots.push(node);
    }
  });

  return roots;
}