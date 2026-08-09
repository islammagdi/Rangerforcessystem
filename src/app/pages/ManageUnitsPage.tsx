import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Search, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Unit {
  id: string;
  name: string | null;
  code: string | null;
  unit_type: string | null;
  parent_unit_id: string | null;
  is_active: boolean | null;
}

interface UnitCard {
  id: string;
  name: string;
  active: boolean;
  saryaCount: number;
  kataibCount: number;
  unitType: string;
}

export function ManageUnitsPage() {
  const navigate = useNavigate();

  const [units, setUnits] = useState<Unit[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("الكل");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnits();
  }, []);

  async function loadUnits() {
    setLoading(true);

    const { data, error } = await supabase
      .from("units")
      .select(`
        id,
        name,
        code,
        unit_type,
        parent_unit_id,
        is_active
      `)
      .order("name");

    if (error) {
      console.error("Error loading units:", error);
      setLoading(false);
      return;
    }

    setUnits(data ?? []);
    setLoading(false);
  }

  const unitCards: UnitCard[] = useMemo(() => {
    return units
      .filter((unit) => unit.unit_type === "MAIN")
      .map((unit) => {
        const children = units.filter(
          (child) => child.parent_unit_id === unit.id
        );

        return {
          id: unit.id,
          name: unit.name ?? "",
          active: unit.is_active ?? false,

          // عدد السرايا التابعة
          saryaCount: children.filter(
            (child) =>
              child.name?.includes("سرية") ||
              child.name?.includes("فصيلة")
          ).length,

          // عدد الكتائب التابعة
          kataibCount: children.filter(
            (child) => child.name?.includes("كتيبة")
          ).length,

          unitType: "اساسية",
        };
      });
  }, [units]);

  const filtered = unitCards.filter((unit) => {
    const matchSearch =
      search === "" ||
      unit.name.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      activeFilter === "الكل"
        ? true
        : activeFilter === "اساسي"
        ? unit.unitType === "اساسية"
        : activeFilter === "مفعلة"
        ? unit.active
        : activeFilter === "غير مفعلة"
        ? !unit.active
        : true;

    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="text-center py-10">
        جاري تحميل الوحدات...
      </div>
    );
  }

  // باقي الـ JSX الحالي بتاعك
}