import { useEffect, useState } from "react";
import { Landmark, Plus, Loader2, X, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/logActivity";
import { DeleteConfirmDialog } from "../components/dashboard/DeleteConfirmDialog";
import { usePermissions } from "../../lib/usePermissions";

const F: React.CSSProperties = {
  fontFamily: "'Almarai', sans-serif",
};

type ExternalAdministration = {
  id: string;
  name: string;
  is_active: boolean;
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

export function ManageExternalAdministrationsPage() {
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission("external_administrations:create");
  const canEdit = hasPermission("external_administrations:edit");
  const canDelete = hasPermission("external_administrations:delete");

  const [administrations, setAdministrations] = useState<
    ExternalAdministration[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // إضافة
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // تعديل
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] =
    useState<ExternalAdministration | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
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
        .from("external_administrations")
        .select("id, name, is_active, created_at")
        .order("created_at", { ascending: false });

      if (loadError) throw loadError;

      setAdministrations(data ?? []);
    } catch (err: any) {
      console.error("Load external administrations error:", err);
      setError(
        err?.message || "حدث خطأ أثناء تحميل بيانات الإدارات الخارجية"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     إضافة إدارة جديدة
  ======================================================= */

  function openAddModal() {
    setNewName("");
    setNewIsActive(true);
    setError("");
    setShowAddModal(true);
  }

  function closeAddModal() {
    if (saving) return;
    setShowAddModal(false);
  }

  async function handleAddAdministration() {
    if (!newName.trim()) {
      setError("اسم الإدارة مطلوب");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data: inserted, error: insertError } = await supabase
        .from("external_administrations")
        .insert({
          name: newName.trim(),
          is_active: newIsActive,
        })
        .select("id, name")
        .single();

      if (insertError) throw insertError;

      try {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "CREATE",
          action: "إضافة إدارة خارجية جديدة",
          entity: "external_administrations",
          details: `اسم الإدارة: ${inserted?.name ?? newName.trim()}`,
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      setSuccessMsg("تم إضافة الإدارة بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);

      setShowAddModal(false);
      await loadData();
    } catch (err: any) {
      console.error("Add external administration error:", err);
      setError(err?.message || "حدث خطأ أثناء إضافة الإدارة");
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     تعديل إدارة موجودة
  ======================================================= */

  function openEditModal(item: ExternalAdministration) {
    setEditingItem(item);
    setEditName(item.name);
    setEditIsActive(item.is_active);
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
      setError("اسم الإدارة مطلوب");
      return;
    }

    setEditSaving(true);
    setError("");

    try {
      const oldName = editingItem.name;
      const oldIsActive = editingItem.is_active;

      const { error: updateError } = await supabase
        .from("external_administrations")
        .update({
          name: editName.trim(),
          is_active: editIsActive,
        })
        .eq("id", editingItem.id);

      if (updateError) throw updateError;

      try {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "UPDATE",
          action: "تعديل بيانات إدارة خارجية",
          entity: "external_administrations",
          details: `القيمة القديمة: ${oldName} (${
            oldIsActive ? "مفعّلة" : "غير مفعّلة"
          }) - القيمة الجديدة: ${editName.trim()} (${
            editIsActive ? "مفعّلة" : "غير مفعّلة"
          })`,
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      setSuccessMsg("تم تعديل بيانات الإدارة بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);

      setShowEditModal(false);
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      console.error("Edit external administration error:", err);
      setError(err?.message || "حدث خطأ أثناء تعديل بيانات الإدارة");
    } finally {
      setEditSaving(false);
    }
  }

  /* =======================================================
     حذف إدارة
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
      const deletedItem = administrations.find(
        (item) => item.id === deleteTargetId
      );

      const { error: deleteError } = await supabase
        .from("external_administrations")
        .delete()
        .eq("id", deleteTargetId);

      if (deleteError) throw deleteError;

      try {
        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "DELETE",
          action: "حذف إدارة خارجية",
          entity: "external_administrations",
          details: `اسم الإدارة: ${deletedItem?.name ?? "غير معروف"}`,
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      setSuccessMsg("تم حذف الإدارة بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);

      setAdministrations((previous) =>
        previous.filter((item) => item.id !== deleteTargetId)
      );
    } catch (err: any) {
      console.error("Delete external administration error:", err);
      setError(err?.message || "حدث خطأ أثناء حذف الإدارة");
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
          الإدارات الخارجية
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
              إضافة إدارة جديدة
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
          <Landmark size={18} className="text-[#4a5468]" />
          <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
            سجل الإدارات الخارجية
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
        ) : administrations.length === 0 ? (
          <div className="py-16 text-center">
            <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
              لا توجد إدارات خارجية مسجلة بعد
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
                    اسم الإدارة
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
                {administrations.map((item) => (
                  <tr key={item.id} className="border-t border-[#e2e7f0]">
                    <td
                      className="px-5 py-3 whitespace-nowrap"
                      style={{ ...F, fontSize: 14, color: "#2d3648" }}
                    >
                      {item.name}
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
                          مفعّلة
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
                          غير مفعّلة
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
                إضافة إدارة خارجية جديدة
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
                  اسم الإدارة
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  dir="rtl"
                  className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
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
                  الإدارة مفعّلة
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
                onClick={handleAddAdministration}
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
                تعديل بيانات الإدارة
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
                  اسم الإدارة
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
                  الإدارة مفعّلة
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