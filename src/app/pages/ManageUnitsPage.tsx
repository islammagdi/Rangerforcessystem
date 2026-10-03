import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Power, X, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { todayLocalIso } from "../../lib/dates";
const UNIT_HIERARCHY_ORDER: string[] = [
  "قيادة قوات الصاعقة",
  "سريه القياده",
  "كتيبة القيادة",
  "سرية الإيجلا",
  "كتيبة التأمين الفني",
  "ميس 4",
  "سرية 279 نقل",
  "فصيلة 121 شرطة عسكرية",
  "سرية 680 إشارة",
  "مدرسة الصاعقة",
  "فرقة الموسيقى",
  "السرية الزراعية",
  "كتيبة 49 مدفعية",
  "قيادة المجموعة 127 صاعقة",
  "كتيبة 33 صاعقة",
  "كتيبة 43 صاعقة",
  "كتيبة 53 صاعقة",
  "كتيبة 103 صاعقة",
  "قيادة المجموعة 129 صاعقة",
  "كتيبة 13 صاعقة",
  "كتيبة 23 صاعقة",
  "كتيبة 83 صاعقة",
  "كتيبة 113 صاعقة",
  "قيادة المجموعة 145 صاعقة",
  "كتيبة 63 صاعقة",
  "كتيبة 93 صاعقة",
  "كتيبة 73 صاعقة",
  "كتيبة 143 صاعقة",
  "قيادة المجموعة 101 صاعقة",
  "كتيبة 11 صاعقة",
  "كتيبة 21 صاعقة",
  "كتيبة 31 صاعقة",
  "كتيبة 41 صاعقة",
  "قياده مجموعه العمليات الخاصه",
  "الوحدة 777 قتال",
  "الوحدة 999 قتال",
  "كتيبة 50 صاعقة",
  "سرية العائمات",
  "فصيلة شئون مظلات",
];
interface Unit {
  id: string;
  name: string | null;
  code: string | null;
  unit_type: string | null;
  parent_unit_id: string | null;
  parent_unit_name: string | null;
  is_active: boolean | null;
}

type TypeFilter = "الكل" | "اساسي" | "فرعي";
type StatusFilter = "الكل" | "نشطه" | "مغلقه";

export function ManageUnitsPage() {
  // ============================================================
  // States
  // ============================================================

  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  // فلتر النوع
  const [typeFilter, setTypeFilter] =
    useState<TypeFilter>("الكل");

  // فلتر الحالة
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("الكل");

  // Modal إضافة / تعديل
  const [showModal, setShowModal] = useState(false);

  const [editingUnit, setEditingUnit] =
    useState<Unit | null>(null);

  const [unitName, setUnitName] = useState("");

  const [unitType, setUnitType] =
    useState<"MAIN" | "MANAGE">("MAIN");

  const [parentUnitId, setParentUnitId] =
    useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  // رسالة الخطأ
  const [errorMessage, setErrorMessage] =
    useState("");

  // Modal تصدير إكسيل
  const [showExportModal, setShowExportModal] =
    useState(false);

  const [exportTypeFilter, setExportTypeFilter] =
    useState<TypeFilter>("الكل");

  const [exportStatusFilter, setExportStatusFilter] =
    useState<StatusFilter>("الكل");
  // ============================================================
  // تحميل الوحدات
  // ============================================================

  useEffect(() => {
    loadUnits();
  }, []);

  async function loadUnits() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("units")
        .select(`
          id,
          name,
          code,
          unit_type,
          parent_unit_id,
          parent_unit:parent_unit_id(name),
          is_active
        `)
        .order("name");

      if (!error && data) {
        const mappedData = data.map((unit: any) => ({
          ...unit,
          parent_unit_name: unit.parent_unit?.name || null,
        }));
        setUnits(mappedData);
        return;
      }

      if (error) {

        setErrorMessage(
          "حدث خطأ أثناء تحميل الوحدات"
        );

        return;
      }

      setUnits(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // الإحصائيات
  // ============================================================

  const statistics = useMemo(() => {
    const mainUnits = units.filter(
      (unit) =>
        unit.unit_type === "MAIN"
    );

    const manageUnits = units.filter(
      (unit) =>
        unit.unit_type === "MANAGE"
    );

    const activeUnits = units.filter(
      (unit) =>
        unit.is_active === true
    );

    const inactiveUnits = units.filter(
      (unit) =>
        unit.is_active === false
    );

    return {
      total: units.length,
      main: mainUnits.length,
      manage: manageUnits.length,
      active: activeUnits.length,
      inactive: inactiveUnits.length,
    };
  }, [units]);

  // ============================================================
  // الفلترة
  // ============================================================
  const parentUnits = useMemo(() => {
    return units.filter(
      (unit) =>
        unit.unit_type === "MAIN" &&
        unit.is_active === true
    );
  }, [units]);
  const filteredUnits = useMemo(() => {
    const filtered = units.filter((unit) => {
      // ... نفس كود الفلترة الموجود
      const searchValue =
        search.trim().toLowerCase();

      const matchesSearch =
        searchValue === "" ||
        (unit.name ?? "")
          .toLowerCase()
          .includes(searchValue);

      const matchesType =
        typeFilter === "الكل"
          ? true
          : typeFilter === "اساسي"
          ? unit.unit_type === "MAIN"
          : unit.unit_type === "MANAGE";

      const matchesStatus =
        statusFilter === "الكل"
          ? true
          : statusFilter === "نشطه"
          ? unit.is_active === true
          : unit.is_active === false;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });

    // ترتيب: الأساسية حسب الترتيب المحدد، ثم الفرعية
    return filtered.sort((a, b) => {
      // أولاً: الوحدات الأساسية قبل الفرعية
      if (a.unit_type !== b.unit_type) {
        return a.unit_type === "MAIN" ? -1 : 1;
      }

      // للوحدات الأساسية: ترتيب حسب UNIT_HIERARCHY_ORDER
      if (a.unit_type === "MAIN") {
        const indexA = UNIT_HIERARCHY_ORDER.indexOf(
          a.name || ""
        );
        const indexB = UNIT_HIERARCHY_ORDER.indexOf(
          b.name || ""
        );

        // إذا كانت في القائمة، رتبها حسب الترتيب
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }

        // الوحدات غير الموجودة في القائمة تظهر في النهاية
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // إذا لم تكن كلاهما في القائمة، رتب أبجدياً
        return (a.name || "").localeCompare(
          b.name || ""
        );
      }

      // للوحدات الفرعية: ترتيب حسب الأب ثم الاسم
      if (a.parent_unit_id !== b.parent_unit_id) {
        return (a.parent_unit_id || "").localeCompare(
          b.parent_unit_id || ""
        );
      }

      return (a.name || "").localeCompare(
        b.name || ""
      );
    });
  }, [
    units,
    search,
    typeFilter,
    statusFilter,
  ]);

  // ============================================================
  // فتح Modal الإضافة
  // ============================================================

  function openAddModal() {
    setEditingUnit(null);
    setUnitName("");
    setUnitType("MAIN");
    setParentUnitId(null);
    setErrorMessage("");
    setShowModal(true);
  }

  // ============================================================
  // فتح Modal التعديل
  // ============================================================
  function openEditModal(unit: Unit) {
    setEditingUnit(unit);

    setUnitName(
      unit.name ?? ""
    );

    setUnitType(
      unit.unit_type === "MANAGE"
        ? "MANAGE"
        : "MAIN"
    );

    setParentUnitId(
      unit.parent_unit_id ?? null
    );

    setErrorMessage("");
    setShowModal(true);
  }

  // ============================================================
  // إغلاق Modal
  // ============================================================

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingUnit(null);
    setUnitName("");
    setParentUnitId(null);
    setErrorMessage("");
  }

  // ============================================================
  // حفظ الوحدة
  // ============================================================

  async function handleSave() {
    setErrorMessage("");

    const trimmedName =
      unitName.trim();

    if (!trimmedName) {
      setErrorMessage(
        "من فضلك اكتب اسم الوحدة"
      );
      return;
    }

    setSaving(true);

    try {
      // ========================================================
      // تعديل
      // ========================================================

      if (editingUnit) {
        const updateData: any = {
          name: trimmedName,
          unit_type: unitType,
          updated_at:
            new Date().toISOString(),
        };

        if (unitType === "MAIN") {
          updateData.parent_unit_id = parentUnitId;
        }

        const { error } =
          await supabase
            .from("units")
            .update(updateData)
            .eq(
              "id",
              editingUnit.id
            );

        if (error) {


          setErrorMessage(
            "حدث خطأ أثناء تعديل الوحدة"
          );

          return;
        }
      }

      // ========================================================
      // إضافة
      // ========================================================
      else {
        const insertData: any = {
          name: trimmedName,
          unit_type: unitType,
          is_active: true,
        };

        if (unitType === "MAIN") {
          insertData.parent_unit_id = parentUnitId;
        }

        const { error } =
          await supabase
            .from("units")
            .insert(insertData);

        if (error) {


          setErrorMessage(
            "حدث خطأ أثناء إضافة الوحدة"
          );

          return;
        }
      }

      closeModal();
      await loadUnits();
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // التحقق من إمكانية إغلاق الوحدة
  // ============================================================

  async function canCloseUnit(
    unitId: string
  ) {
    // ========================================================
    // 1. أفراد وحدتهم الأساسية هي الوحدة
    // ========================================================

    const {
      count: primaryCount,
      error: primaryError,
    } = await supabase
      .from("personnel")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "primary_unit_id",
        unitId
      )
      .eq(
        "is_active",
        true
      );

    if (primaryError) {


      throw new Error(
        "تعذر التحقق من قوة الوحدة"
      );
    }

    // ========================================================
    // 2. أفراد مكان إلحاقهم هو الوحدة
    // ========================================================

    const {
      count: attachmentCount,
      error: attachmentError,
    } = await supabase
      .from("personnel")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "attachment_unit_id",
        unitId
      )
      .eq(
        "is_active",
        true
      );

    if (attachmentError) {


      throw new Error(
        "تعذر التحقق من خوارج الوحدة"
      );
    }

    return {
      primaryCount:
        primaryCount ?? 0,

      attachmentCount:
        attachmentCount ?? 0,
    };
  }

  // ============================================================
  // إغلاق الوحدة
  // ============================================================

  async function handleCloseUnit(
    unit: Unit
  ) {
    if (!unit.is_active) {
      return;
    }

    const confirmed =
      window.confirm(
        `هل أنت متأكد من إغلاق الوحدة "${unit.name}"؟`
      );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");

      // ========================================================
      // فحص الأفراد
      // ========================================================

      const {
        primaryCount,
        attachmentCount,
      } =
        await canCloseUnit(
          unit.id
        );

      // ========================================================
      // الوحدة عليها أفراد
      // ========================================================

      if (
        primaryCount > 0 ||
        attachmentCount > 0
      ) {
        let message =
          `لا يمكن إغلاق الوحدة "${unit.name}".\n\n`;

        if (
          primaryCount > 0
        ) {
          message +=
            `- يوجد ${primaryCount} فرد وحدتهم الأساسية هي هذه الوحدة.\n`;
        }

        if (
          attachmentCount > 0
        ) {
          message +=
            `- يوجد ${attachmentCount} فرد مكان إلحاقه هو هذه الوحدة.\n`;
        }

        message +=
          "\nيجب أولاً نقل الأفراد أو تعديل بيانات إلحاقهم.";

        window.alert(message);

        return;
      }

      // ========================================================
      // إغلاق الوحدة
      // ========================================================

      const { error } =
        await supabase
          .from("units")
          .update({
            is_active: false,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            unit.id
          );

      if (error) {


        window.alert(
          "حدث خطأ أثناء إغلاق الوحدة"
        );

        return;
      }

      await loadUnits();

      window.alert(
        "تم إغلاق الوحدة بنجاح"
      );
    } catch (error) {


      window.alert(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع"
      );
    }
  }

  // ============================================================
  // إعادة تفعيل الوحدة
  // ============================================================

  async function handleActivateUnit(
    unit: Unit
  ) {
    const confirmed =
      window.confirm(
        `هل تريد إعادة تفعيل الوحدة "${unit.name}"؟`
      );

    if (!confirmed) {
      return;
    }

    const { error } =
      await supabase
        .from("units")
        .update({
          is_active: true,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          unit.id
        );

    if (error) {


      window.alert(
        "حدث خطأ أثناء إعادة تفعيل الوحدة"
      );

      return;
    }

    await loadUnits();

    window.alert(
      "تم تفعيل الوحدة بنجاح"
    );
  }

  // ============================================================
  // تصدير الوحدات إلى إكسيل
  // ============================================================

  function handleExportExcel() {
    const rowsToExport = units.filter((unit) => {
      const matchesType =
        exportTypeFilter === "الكل"
          ? true
          : exportTypeFilter === "اساسي"
          ? unit.unit_type === "MAIN"
          : unit.unit_type === "MANAGE";

      const matchesStatus =
        exportStatusFilter === "الكل"
          ? true
          : exportStatusFilter === "نشطه"
          ? unit.is_active === true
          : unit.is_active === false;

      return matchesType && matchesStatus;
    });

    const excelData = rowsToExport.map((unit, index) => ({
      "#": index + 1,
      "اسم الوحدة": unit.name || "بدون اسم",
      الكود: unit.code || "-",
      النوع: unit.unit_type === "MAIN" ? "أساسية" : "فرعية",
      "الوحدة الأب": unit.parent_unit_name || "-",
      الحالة: unit.is_active ? "نشطة" : "مغلقة",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الوحدات");

    const today = todayLocalIso();
    XLSX.writeFile(workbook, `كشف_الوحدات_${today}.xlsx`);

    setShowExportModal(false);
  }
  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div
        className="text-center py-10"
        dir="rtl"
      >
        جاري تحميل الوحدات...
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      className="w-full space-y-6"
      dir="rtl"
    >
      {/* ======================================================
          العنوان
      ====================================================== */}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              color: "#2d3648",
              fontFamily:
                "'Almarai', sans-serif",
            }}
          >
            إدارة الوحدات
          </h1>

          <p
            className="text-gray-500 mt-1"
            style={{
              fontFamily:
                "'Almarai', sans-serif",
            }}
          >
            إدارة ومتابعة جميع الوحدات
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-[#00B867] font-bold border border-[#00B867]"
            style={{
              backgroundColor: "#ffffff",
              fontFamily: "'Almarai', sans-serif",
            }}
          >
            <Download size={19} />
            تصدير إكسيل
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold"
            style={{
              backgroundColor:
                "#00B867",
              fontFamily:
                "'Almarai', sans-serif",
            }}
          >
            <Plus size={19} />

            إضافة وحدة
          </button>
        </div>
      </div>

      {/* ======================================================
          الإحصائيات
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        <StatBox
          title="إجمالي الوحدات"
          value={statistics.total}
        />

        <StatBox
          title="الوحدات الأساسية"
          value={statistics.main}
        />

        <StatBox
          title="الوحدات الفرعية"
          value={statistics.manage}
        />

        <StatBox
          title="الوحدات النشطة"
          value={statistics.active}
        />

        <StatBox
          title="الوحدات المغلقة"
          value={statistics.inactive}
        />

      </div>

      {/* ======================================================
          أدوات البحث والفلاتر
      ====================================================== */}

      <div className="bg-white border border-gray-200 rounded-2xl p-5 ">

        <div className="flex flex-col lg:flex-row gap-4">

          {/* البحث */}

          <div className="relative flex-1">

            <Search
              size={20}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="ابحث باسم الوحدة..."
              className="w-full border border-gray-200 rounded-xl py-3 pr-12 pl-4 outline-none focus:border-[#344736]"
              style={{
                fontFamily:
                  "'Almarai', sans-serif",
              }}
            />

          </div>

          {/* ==================================================
              فلتر النوع
          ================================================== */}

          <div className="flex items-center gap-2 flex-wrap">

            <span
              className="text-gray-500 text-sm"
              style={{
                fontFamily:
                  "'Almarai', sans-serif",
              }}
            >
              النوع:
            </span>

            <FilterButton
              active={
                typeFilter === "الكل"
              }
              onClick={() =>
                setTypeFilter(
                  "الكل"
                )
              }
            >
              الكل
            </FilterButton>

            <FilterButton
              active={
                typeFilter === "اساسي"
              }
              onClick={() =>
                setTypeFilter(
                  "اساسي"
                )
              }
            >
              أساسية
            </FilterButton>

            <FilterButton
              active={
                typeFilter === "فرعي"
              }
              onClick={() =>
                setTypeFilter(
                  "فرعي"
                )
              }
            >
              فرعية
            </FilterButton>

          </div>

          {/* ==================================================
              فلتر الحالة
          ================================================== */}

          <div className="flex items-center gap-2 flex-wrap">

            <span
              className="text-gray-500 text-sm"
              style={{
                fontFamily:
                  "'Almarai', sans-serif",
              }}
            >
              الحالة:
            </span>

            <FilterButton
              active={
                statusFilter ===
                "الكل"
              }
              onClick={() =>
                setStatusFilter(
                  "الكل"
                )
              }
            >
              الكل
            </FilterButton>

            <FilterButton
              active={
                statusFilter ===
                "نشطه"
              }
              onClick={() =>
                setStatusFilter(
                  "نشطه"
                )
              }
            >
              نشطة
            </FilterButton>

            <FilterButton
              active={
                statusFilter ===
                "مغلقه"
              }
              onClick={() =>
                setStatusFilter(
                  "مغلقه"
                )
              }
            >
              مغلقة
            </FilterButton>

          </div>

        </div>

      </div>

      {/* ======================================================
          عدد النتائج
      ====================================================== */}

      <div
        className="text-sm text-gray-500"
        style={{
          fontFamily:
            "'Almarai', sans-serif",
        }}
      >
        عدد النتائج:{" "}
        <span className="font-bold text-[#344736]">
          {filteredUnits.length}
        </span>
      </div>

      {/* ======================================================
          جدول الوحدات
      ====================================================== */}

      <div className="bg-white rounded-2xl border border-gray-200  overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-right">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-5 py-4 text-sm font-bold text-gray-600">
                  #
                </th>

                <th className="px-5 py-4 text-sm font-bold text-gray-600">
                  اسم الوحدة
                </th>

              <th className="px-5 py-4 text-sm font-bold text-gray-600">
                النوع
              </th>

              <th className="px-5 py-4 text-sm font-bold text-gray-600">
                الوحدة التابع لها
              </th>

              <th className="px-5 py-4 text-sm font-bold text-gray-600">
                الحالة
              </th>

                <th className="px-5 py-4 text-sm font-bold text-gray-600">
                  الإجراءات
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredUnits.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="text-center py-12 text-gray-500"
                  >
                    لا توجد وحدات مطابقة للبحث والفلاتر
                  </td>

                </tr>

              ) : (

                filteredUnits.map(
                  (unit, index) => (

                    <tr
                      key={unit.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >

                      <td className="px-5 py-4 text-gray-500">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4">

                        <div className="font-bold text-[#344736]">
                          {unit.name ||
                            "بدون اسم"}
                        </div>

                        {unit.code && (
                          <div className="text-xs text-gray-400 mt-1">
                            {unit.code}
                          </div>
                        )}

                      </td>

                      <td className="px-5 py-4">

                        {unit.unit_type ===
                        "MAIN" ? (

                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                            أساسية
                          </span>

                        ) : (

                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                            فرعية
                          </span>

                        )}

                      </td>

                      <td className="px-5 py-4">

                        <div
                          className="text-sm"
                          style={{
                            color: unit.parent_unit_name
                              ? "#2d3648"
                              : "#a1aebe",
                          }}
                        >
                          {unit.parent_unit_name ||
                            (unit.unit_type ===
                            "MAIN"
                              ? "بدون تابع"
                              : "-")}
                        </div>

                      </td>

                      <td className="px-5 py-4">

                        {unit.is_active ? (

                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
                            نشطة
                          </span>

                        ) : (

                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700">
                            مغلقة
                          </span>

                        )}

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          {/* تعديل */}

                          <button
                            onClick={() =>
                              openEditModal(
                                unit
                              )
                            }
                            className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                            title="تعديل"
                          >
                            <Pencil
                              size={17}
                            />
                          </button>

                          {/* إغلاق */}

                          {unit.is_active ? (

                            <button
                              onClick={() =>
                                handleCloseUnit(
                                  unit
                                )
                              }
                              className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                              title="إغلاق الوحدة"
                            >
                              <Power
                                size={17}
                              />
                            </button>

                          ) : (

                            <button
                              onClick={() =>
                                handleActivateUnit(
                                  unit
                                )
                              }
                              className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                              title="تفعيل الوحدة"
                            >
                              <Power
                                size={17}
                              />
                            </button>

                          )}

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ======================================================
          Modal إضافة / تعديل
      ====================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">

            {/* Header */}

            <div className="flex items-center justify-between p-5 border-b">

              <h2
                className="text-lg font-bold text-[#2d3648]"
                style={{
                  fontFamily:
                    "'Almarai', sans-serif",
                }}
              >
                {editingUnit
                  ? "تعديل الوحدة"
                  : "إضافة وحدة جديدة"}
              </h2>

              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>

            </div>

            {/* Body */}

            <div className="p-5 space-y-5">

              {/* اسم الوحدة */}

              <div>

                <label
                  className="block mb-2 text-sm font-bold text-gray-700"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                  }}
                >
                  اسم الوحدة
                </label>

                <input
                  type="text"
                  value={unitName}
                  onChange={(e) =>
                    setUnitName(
                      e.target.value
                    )
                  }
                  placeholder="اكتب اسم الوحدة"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#344736]"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                  }}
                />

              </div>

              {/* نوع الوحدة */}

              <div>

                <label
                  className="block mb-2 text-sm font-bold text-gray-700"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                  }}
                >
                  نوع الوحدة
                </label>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setUnitType(
                        "MAIN"
                      )
                    }
                    className={`py-3 rounded-xl border font-bold ${
                      unitType ===
                      "MAIN"
                        ? "bg-[#00B867] text-white border-[#00B867]"
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    أساسية
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setUnitType(
                        "MANAGE"
                      )
                    }
                    className={`py-3 rounded-xl border font-bold ${
                      unitType ===
                      "MANAGE"
                        ? "bg-[#00B867] text-white border-[#00B867]"
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    فرعية
                  </button>

                </div>

              </div>

              {/* الوحدة الأب - فقط للوحدات الأساسية */}

              {unitType === "MAIN" && (

                <div>

                  <label
                    className="block mb-2 text-sm font-bold text-gray-700"
                    style={{
                      fontFamily:
                        "'Almarai', sans-serif",
                    }}
                  >
                    الوحدة الأب
                  </label>

                  <select
                    value={
                      parentUnitId || ""
                    }
                    onChange={(e) =>
                      setParentUnitId(
                        e.target
                          .value || null
                      )
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#344736]"
                    style={{
                      fontFamily:
                        "'Almarai', sans-serif",
                    }}
                  >

                    <option value="">
                      لا توجد وحدة أب
                    </option>

                    {parentUnits.map(
                      (unit) => (
                        <option
                          key={unit.id}
                          value={unit.id}
                        >
                          {unit.name}
                        </option>
                      )
                    )}

                  </select>

                </div>

              )}

              {/* Error */}

              {errorMessage && (

                <div className="bg-red-50 text-red-700 border border-red-100 rounded-xl p-3 text-sm">
                  {errorMessage}
                </div>

              )}

            </div>

            {/* Footer */}

            <div className="p-5 border-t flex gap-3">

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[#00B867] text-white font-bold disabled:opacity-50"
              >
                {saving
                  ? "جاري الحفظ..."
                  : editingUnit
                  ? "حفظ التعديل"
                  : "إضافة الوحدة"}
              </button>
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold"
              >
                إلغاء
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          Modal تصدير إكسيل
      ====================================================== */}

      {showExportModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">

            {/* Header */}

            <div className="flex items-center justify-between p-5 border-b">

              <h2
                className="text-lg font-bold text-[#2d3648]"
                style={{
                  fontFamily: "'Almarai', sans-serif",
                }}
              >
                تصدير الوحدات إلى إكسيل
              </h2>

              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>

            </div>

            {/* Body */}

            <div className="p-5 space-y-5">

              {/* فلتر النوع */}

              <div>
                <label
                  className="block mb-2 text-sm font-bold text-gray-700"
                  style={{
                    fontFamily: "'Almarai', sans-serif",
                  }}
                >
                  النوع
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {(["الكل", "اساسي", "فرعي"] as TypeFilter[]).map(
                    (opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setExportTypeFilter(opt)}
                        className={`py-2.5 rounded-xl border font-bold text-sm ${
                          exportTypeFilter === opt
                            ? "bg-[#00B867] text-white border-[#00B867]"
                            : "bg-white text-gray-600 border-gray-200"
                        }`}
                      >
                        {opt === "اساسي" ? "أساسية" : opt === "فرعي" ? "فرعية" : "الكل"}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* فلتر الحالة */}

              <div>
                <label
                  className="block mb-2 text-sm font-bold text-gray-700"
                  style={{
                    fontFamily: "'Almarai', sans-serif",
                  }}
                >
                  الحالة
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {(["الكل", "نشطه", "مغلقه"] as StatusFilter[]).map(
                    (opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setExportStatusFilter(opt)}
                        className={`py-2.5 rounded-xl border font-bold text-sm ${
                          exportStatusFilter === opt
                            ? "bg-[#00B867] text-white border-[#00B867]"
                            : "bg-white text-gray-600 border-gray-200"
                        }`}
                      >
                        {opt === "نشطه" ? "نشطة" : opt === "مغلقه" ? "مغلقة" : "الكل"}
                      </button>
                    )
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}

            <div className="p-5 border-t flex gap-3">

              <button
                onClick={handleExportExcel}
                className="flex-1 py-3 rounded-xl bg-[#00B867] text-white font-bold flex items-center justify-center gap-2"
              >
                <Download size={18} />
                تحميل ملف الإكسيل
              </button>

              <button
                onClick={() => setShowExportModal(false)}
                className="px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold"
              >
                إلغاء
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
// ============================================================
// Components
// ============================================================

function StatBox({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">

      <div
        className="text-sm text-gray-500 mb-2"
        style={{
          fontFamily:
            "'Almarai', sans-serif",
        }}
      >
        {title}
      </div>

      <div className="text-2xl font-bold text-[#344736]">
        {value.toLocaleString(
          "en-US"
        )}
      </div>

    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
        active
          ? "bg-[#00B867] text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
      style={{
        fontFamily:
          "'Almarai', sans-serif",
      }}
    >
      {children}
    </button>
  );
}