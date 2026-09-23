import { useEffect, useState } from "react";
import { GraduationCap, Plus, Loader2, X, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/logActivity";
import { DeleteConfirmDialog } from "../components/dashboard/DeleteConfirmDialog";
import { usePermissions } from "../../lib/usePermissions";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

type EducationLevel = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  requires_literacy_certificate: boolean;
  created_at: string;
};

async function getCurrentUserInfo(): Promise<{
  userId: string | null;
  userName: string;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, userName: "غير معروف" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    userName: profile?.username ?? "غير معروف",
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ManageEducationLevelsPage() {
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission("education_levels:create");
  const canEdit = hasPermission("education_levels:edit");
  const canDelete = hasPermission("education_levels:delete");

  const [levels, setLevels] = useState<EducationLevel[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // إضافة
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [newRequiresLiteracy, setNewRequiresLiteracy] = useState(false);
  const [saving, setSaving] = useState(false);

  // تعديل
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EducationLevel | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editRequiresLiteracy, setEditRequiresLiteracy] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // حذف
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const { data, error: loadError } = await supabase
        .from("education_levels")
        .select(
          "id, name, code, is_active, requires_literacy_certificate, created_at"
        )
        .order("created_at", { ascending: false });

      if (loadError) throw loadError;

      setLevels(data ?? []);
    } catch (err: any) {
    
      setError(
        err?.message || "حدث خطأ أثناء تحميل بيانات المستويات التعليمية"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     إضافة مستوى جديد
  ======================================================= */

  function openAddModal() {
    setNewName("");
    setNewCode("");
    setNewIsActive(true);
    setNewRequiresLiteracy(false);
    setError("");
    setShowAddModal(true);
  }

  function closeAddModal() {
    if (saving) return;
    setShowAddModal(false);
  }

  async function handleAddLevel() {
    if (!newName.trim()) {
      setError("اسم المستوى التعليمي مطلوب");
      return;
    }

    if (!newCode.trim()) {
      setError("كود المستوى التعليمي مطلوب");
      return;
    }

    setSaving(true);
    setError("");

    try {
         const { data: inserted, error: insertError } = await supabase
        .from("education_levels")
        .insert({
          name: newName.trim(),
          code: newCode.trim(),
          is_active: newIsActive,
          requires_literacy_certificate: newRequiresLiteracy,
        })
        .select("id, name, code")
        .single();

      if (insertError) throw insertError;

      try {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "CREATE",
          action: "إضافة مستوى تعليمي جديد",
          entity: "education_levels",
          details: `اسم المستوى: ${inserted?.name ?? newName.trim()} - الكود: ${
            inserted?.code ?? newCode.trim()
          }${
            newRequiresLiteracy
              ? " - يتطلب شهادة محو أمية"
              : ""
          }`,
        });
      } catch (auditError) {
      
      }

      setSuccessMsg("تم إضافة المستوى التعليمي بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);

      setShowAddModal(false);
      await loadData();
    } catch (err: any) {
     
      setError(err?.message || "حدث خطأ أثناء إضافة المستوى التعليمي");
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     تعديل مستوى موجود
  ======================================================= */

  function openEditModal(item: EducationLevel) {
    setEditingItem(item);
    setEditName(item.name);
    setEditCode(item.code);
    setEditIsActive(item.is_active);
    setEditRequiresLiteracy(item.requires_literacy_certificate);
    setError("");
    setShowEditModal(true);
  }

  function closeEditModal() {
    if (editSaving) return;
    setShowEditModal(false);
    setEditingItem(null);
  }

  async function handleSaveEdit() {
    if (!editingItem) return;

    if (!editName.trim()) {
      setError("اسم المستوى التعليمي مطلوب");
      return;
    }

    if (!editCode.trim()) {
      setError("كود المستوى التعليمي مطلوب");
      return;
    }

    setEditSaving(true);
    setError("");

      try {
      const oldName = editingItem.name;
      const oldCode = editingItem.code;
      const oldIsActive = editingItem.is_active;
      const oldRequiresLiteracy = editingItem.requires_literacy_certificate;

      const { error: updateError } = await supabase
        .from("education_levels")
        .update({
          name: editName.trim(),
          code: editCode.trim(),
          is_active: editIsActive,
          requires_literacy_certificate: editRequiresLiteracy,
        })
        .eq("id", editingItem.id);

      if (updateError) throw updateError;

      try {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "UPDATE",
          action: "تعديل بيانات مستوى تعليمي",
          entity: "education_levels",
          details: `القيمة القديمة: ${oldName} (${oldCode}) (${
            oldIsActive ? "مفعّل" : "غير مفعّل"
          }) (${
            oldRequiresLiteracy ? "يتطلب محو أمية" : "لا يتطلب محو أمية"
          }) - القيمة الجديدة: ${editName.trim()} (${editCode.trim()}) (${
            editIsActive ? "مفعّل" : "غير مفعّل"
          }) (${
            editRequiresLiteracy ? "يتطلب محو أمية" : "لا يتطلب محو أمية"
          })`,
        });
      } catch (auditError) {
       
      }

      setSuccessMsg("تم تعديل بيانات المستوى التعليمي بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);

      setShowEditModal(false);
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      
      setError(err?.message || "حدث خطأ أثناء تعديل بيانات المستوى التعليمي");
    } finally {
      setEditSaving(false);
    }
  }

  /* =======================================================
     حذف مستوى
  ======================================================= */

  function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  function cancelDelete() {
    if (deleting) return;
    setDeleteTargetId(null);
  }

  async function confirmDelete() {
    if (!deleteTargetId) return;

    setDeleting(true);
    setError("");

    try {
      const deletedItem = levels.find((item) => item.id === deleteTargetId);

      const { error: deleteError } = await supabase
        .from("education_levels")
        .delete()
        .eq("id", deleteTargetId);

      if (deleteError) throw deleteError;

      try {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "DELETE",
          action: "حذف مستوى تعليمي",
          entity: "education_levels",
          details: `اسم المستوى: ${deletedItem?.name ?? "غير معروف"}`,
        });
      } catch (auditError) {

      }

      setSuccessMsg("تم حذف المستوى التعليمي بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);

      setLevels((previous) =>
        previous.filter((item) => item.id !== deleteTargetId)
      );
    } catch (err: any) {

      setError(err?.message || "حدث خطأ أثناء حذف المستوى التعليمي");
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="flex flex-col gap-6 w-full pb-10" dir="rtl">
      <DeleteConfirmDialog
        open={deleteTargetId !== null}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

      <div className="flex items-center justify-between w-full flex-wrap gap-3">
        <h1
          style={{
            ...F,
            fontWeight: 700,
            fontSize: "clamp(22px,4vw,32px)",
            color: "#2d3648",
          }}
        >
          المستويات التعليمية
        </h1>

        {canCreate && (
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 h-[46px] px-5 rounded-[8px]"
            style={{
              background: "linear-gradient(to bottom,#00b867,#00522e)",
            }}
          >
            <Plus size={18} color="#fff" />
            <span style={{ ...F, fontSize: 15, color: "#fff" }}>
              إضافة مستوى جديد
            </span>
          </button>
        )}
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

      {successMsg && (
        <div
          className="w-full rounded-[10px] px-5 py-4"
          style={{
            background: "#dcfce7",
            color: "#166534",
            ...F,
            fontSize: 14,
          }}
        >
          {successMsg}
        </div>
      )}

      <section className="bg-white rounded-[20px] border border-[#eff0f6] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e7f0] flex items-center gap-2">
          <GraduationCap size={18} className="text-[#4a5468]" />
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            سجل المستويات التعليمية
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2
              size={28}
              className="mx-auto mb-2 text-[#00b867] animate-spin"
            />
            <p style={{ ...F, fontSize: 14, color: "#717d96" }}>
              جاري التحميل...
            </p>
          </div>
        ) : levels.length === 0 ? (
          <div className="py-16 text-center">
            <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
              لا توجد مستويات تعليمية مسجلة بعد
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f7f9fc]">
                <tr>
                  <th
                    className="px-5 py-3 text-right"
                    style={{ ...F, fontSize: 13, color: "#717d96" }}
                  >
                    اسم المستوى
                  </th>
                  <th
                    className="px-5 py-3 text-right"
                    style={{ ...F, fontSize: 13, color: "#717d96" }}
                  >
                    الكود
                  </th>
                  <th
                    className="px-5 py-3 text-right"
                    style={{ ...F, fontSize: 13, color: "#717d96" }}
                  >
                    الحالة
                  </th>
                  <th
                    className="px-5 py-3 text-right"
                    style={{ ...F, fontSize: 13, color: "#717d96" }}
                  >
                    يتطلب محو أمية
                  </th>
                  <th
                    className="px-5 py-3 text-right"
                    style={{ ...F, fontSize: 13, color: "#717d96" }}
                  >
                    تاريخ الإضافة
                  </th>
                  <th
                    className="px-5 py-3 text-right"
                    style={{ ...F, fontSize: 13, color: "#717d96" }}
                  >
                    الإجراء
                  </th>
                </tr>
              </thead>

              <tbody>
                {levels.map((item) => (
                  <tr key={item.id} className="border-t border-[#e2e7f0]">
                    <td
                      className="px-5 py-3 whitespace-nowrap"
                      style={{ ...F, fontSize: 14, color: "#2d3648" }}
                    >
                      {item.name}
                    </td>

                    <td
                      className="px-5 py-3 whitespace-nowrap"
                      style={{ ...F, fontSize: 14, color: "#2d3648" }}
                    >
                      {item.code}
                    </td>

                    <td className="px-5 py-3 whitespace-nowrap">
                      {item.is_active ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                          style={{
                            background: "#dcfce7",
                            ...F,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#166534",
                          }}
                        >
                          مفعّل
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                          style={{
                            background: "#f1f5f9",
                            ...F,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#64748b",
                          }}
                        >
                          غير مفعّل
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3 whitespace-nowrap">
                      {item.requires_literacy_certificate ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                          style={{
                            background: "#fff7ed",
                            ...F,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#9a3412",
                          }}
                        >
                          نعم
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                          style={{
                            background: "#f1f5f9",
                            ...F,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#64748b",
                          }}
                        >
                          لا
                        </span>
                      )}
                    </td>

                    <td
                      className="px-5 py-3 whitespace-nowrap"
                      style={{ ...F, fontSize: 13, color: "#717d96" }}
                    >
                      {formatDate(item.created_at)}
                    </td>

                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="flex items-center gap-1 text-[#1f3d97]"
                            style={{ ...F, fontSize: 13 }}
                          >
                            <Pencil size={13} />
                            تعديل
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="flex items-center gap-1 text-[#e3282c]"
                            style={{ ...F, fontSize: 13 }}
                          >
                            <Trash2 size={13} />
                            حذف
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal الإضافة */}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            dir="rtl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e7f0]">
              <span
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#2d3648",
                }}
              >
                إضافة مستوى تعليمي جديد
              </span>

              <button
                type="button"
                onClick={closeAddModal}
                disabled={saving}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {error && (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                  style={{ ...F, fontSize: 13, color: "#b91c1c" }}
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                  اسم المستوى التعليمي
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: عالي، متوسط، فوق متوسط، أمي"
                  dir="rtl"
                  className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
                  style={{ ...F, fontSize: 15, color: "#2d3648" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                  الكود (رقم واحد يطابق الرقم السادس في الرقم العسكري)
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  dir="ltr"
                  maxLength={1}
                  placeholder="مثال: 1"
                  className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-center outline-none focus:border-[#00b867]"
                  style={{ ...F, fontSize: 15, color: "#2d3648" }}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="newIsActive"
                  type="checkbox"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#00b867]"
                />
                <label
                  htmlFor="newIsActive"
                  style={{ ...F, fontSize: 14, color: "#2d3648" }}
                >
                  المستوى مفعّل
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="newRequiresLiteracy"
                  type="checkbox"
                  checked={newRequiresLiteracy}
                  onChange={(e) => setNewRequiresLiteracy(e.target.checked)}
                  className="w-4 h-4 accent-[#00b867]"
                />
                <label
                  htmlFor="newRequiresLiteracy"
                  style={{ ...F, fontSize: 14, color: "#2d3648" }}
                >
                  يتطلب هذا المستوى شهادة محو أمية
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#e2e7f0] flex items-center gap-3">
              <button
                type="button"
                onClick={closeAddModal}
                disabled={saving}
                className="px-5 h-11 rounded-xl border border-[#cbd5e1] text-[#475569] hover:bg-gray-50 disabled:opacity-50"
                style={{ ...F, fontSize: 14 }}
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleAddLevel}
                disabled={saving}
                className="px-6 h-11 rounded-xl text-white flex items-center gap-2 disabled:opacity-50"
                style={{
                  background: "linear-gradient(to bottom,#00b867,#00522e)",
                  ...F,
                  fontSize: 14,
                }}
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal التعديل */}

      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            dir="rtl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e7f0]">
              <span
                style={{
                  ...F,
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#2d3648",
                }}
              >
                تعديل بيانات المستوى التعليمي
              </span>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={editSaving}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {error && (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                  style={{ ...F, fontSize: 13, color: "#b91c1c" }}
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                  اسم المستوى التعليمي
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  dir="rtl"
                  className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
                  style={{ ...F, fontSize: 15, color: "#2d3648" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                  الكود
                </label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  dir="ltr"
                  maxLength={1}
                  className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-center outline-none focus:border-[#00b867]"
                  style={{ ...F, fontSize: 15, color: "#2d3648" }}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="editIsActive"
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#00b867]"
                />
                <label
                  htmlFor="editIsActive"
                  style={{ ...F, fontSize: 14, color: "#2d3648" }}
                >
                  المستوى مفعّل
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="editRequiresLiteracy"
                  type="checkbox"
                  checked={editRequiresLiteracy}
                  onChange={(e) => setEditRequiresLiteracy(e.target.checked)}
                  className="w-4 h-4 accent-[#00b867]"
                />
                <label
                  htmlFor="editRequiresLiteracy"
                  style={{ ...F, fontSize: 14, color: "#2d3648" }}
                >
                  يتطلب هذا المستوى شهادة محو أمية
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#e2e7f0] flex items-center gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={editSaving}
                className="px-5 h-11 rounded-xl border border-[#cbd5e1] text-[#475569] hover:bg-gray-50 disabled:opacity-50"
                style={{ ...F, fontSize: 14 }}
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="px-6 h-11 rounded-xl text-white flex items-center gap-2 disabled:opacity-50"
                style={{
                  background: "linear-gradient(to bottom,#00b867,#00522e)",
                  ...F,
                  fontSize: 14,
                }}
              >
                {editSaving && <Loader2 size={16} className="animate-spin" />}
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}