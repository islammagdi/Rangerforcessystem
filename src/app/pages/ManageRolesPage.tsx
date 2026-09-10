import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Trash2, ShieldCheck, X, Save, Loader2 } from "lucide-react";

// ============================================================
// Types
// ============================================================

interface RoleRow {
  id: string;
  name: string;
  code: string | null;
  is_system: boolean;
  description: string | null;
}

interface PermissionRow {
  id: string;
  module: string;
  module_label: string;
  action: string;
  action_label: string;
  code: string; // "module:action"
}

interface ModuleGroup {
  module: string;
  module_label: string;
  permissions: PermissionRow[];
}

// ============================================================
// الصفحة الرئيسية
// ============================================================

export function ManageRolesPage() {
  // ------------------------------------------------------------
  // بيانات أساسية
  // ------------------------------------------------------------
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // الدور المختار حاليًا + صلاحياته
  // ------------------------------------------------------------
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [originalPermissionIds, setOriginalPermissionIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(
    new Set()
  );
  const [loadingRolePerms, setLoadingRolePerms] = useState(false);
  const [saving, setSaving] = useState(false);

  // ------------------------------------------------------------
  // إنشاء دور جديد
  // ------------------------------------------------------------
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ------------------------------------------------------------
  // رسائل عامة
  // ------------------------------------------------------------
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ============================================================
  // تحميل البيانات الأساسية
  // ============================================================

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [rolesRes, permissionsRes, userRolesRes] = await Promise.all([
        supabase
          .from("roles")
          .select("id, name, code, is_system, description")
          .order("is_system", { ascending: false })
          .order("name", { ascending: true }),
        supabase
          .from("permissions")
          .select("id, module, module_label, action, action_label, code")
          .order("module", { ascending: true })
          .order("action", { ascending: true }),
        supabase.from("user_roles").select("role_id"),
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (permissionsRes.error) throw permissionsRes.error;
      if (userRolesRes.error) throw userRolesRes.error;

      setRoles(rolesRes.data ?? []);
      setPermissions(permissionsRes.data ?? []);

      const counts: Record<string, number> = {};
      (userRolesRes.data ?? []).forEach((row: any) => {
        counts[row.role_id] = (counts[row.role_id] ?? 0) + 1;
      });
      setUserCounts(counts);

      // اختار أول دور تلقائيًا
      if ((rolesRes.data ?? []).length > 0) {
        setSelectedRoleId(rolesRes.data![0].id);
      }
    } catch (error: any) {
      console.error("خطأ في تحميل بيانات الأدوار:", error);
      setErrorMessage("حدث خطأ أثناء تحميل البيانات. حاول تحديث الصفحة.");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // تحميل صلاحيات الدور المختار
  // ============================================================

  useEffect(() => {
    if (!selectedRoleId) return;
    loadRolePermissions(selectedRoleId);
  }, [selectedRoleId]);

  async function loadRolePermissions(roleId: string) {
    setLoadingRolePerms(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("permission_id")
        .eq("role_id", roleId);

      if (error) throw error;

      const ids = new Set((data ?? []).map((row: any) => row.permission_id as string));

      setOriginalPermissionIds(ids);
      setSelectedPermissionIds(new Set(ids));
    } catch (error: any) {
      console.error("خطأ في تحميل صلاحيات الدور:", error);
      setErrorMessage("حدث خطأ أثناء تحميل صلاحيات الدور.");
    } finally {
      setLoadingRolePerms(false);
    }
  }

  // ============================================================
  // تجميع الصلاحيات حسب الـ Module
  // ============================================================

  const moduleGroups: ModuleGroup[] = useMemo(() => {
    const map = new Map<string, ModuleGroup>();

    permissions.forEach((perm) => {
      if (!map.has(perm.module)) {
        map.set(perm.module, {
          module: perm.module,
          module_label: perm.module_label,
          permissions: [],
        });
      }
      map.get(perm.module)!.permissions.push(perm);
    });

    return Array.from(map.values());
  }, [permissions]);

  // ============================================================
  // هل فيه تغييرات لسه ما اتحفظتش؟
  // ============================================================

  const isDirty = useMemo(() => {
    if (originalPermissionIds.size !== selectedPermissionIds.size) return true;
    for (const id of selectedPermissionIds) {
      if (!originalPermissionIds.has(id)) return true;
    }
    return false;
  }, [originalPermissionIds, selectedPermissionIds]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  // ============================================================
  // Toggle صلاحية واحدة
  // ============================================================

  function togglePermission(permissionId: string) {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  }

  // ============================================================
  // تحديد/إلغاء كل صلاحيات Module واحد دفعة واحدة
  // ============================================================

  function toggleModuleAll(group: ModuleGroup) {
    const groupIds = group.permissions.map((p) => p.id);
    const allSelected = groupIds.every((id) => selectedPermissionIds.has(id));

    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      groupIds.forEach((id) => {
        if (allSelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      });
      return next;
    });
  }

  // ============================================================
  // حفظ التغييرات
  // ============================================================

  async function handleSaveChanges() {
    if (!selectedRoleId) return;

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const toAdd = [...selectedPermissionIds].filter(
        (id) => !originalPermissionIds.has(id)
      );
      const toRemove = [...originalPermissionIds].filter(
        (id) => !selectedPermissionIds.has(id)
      );

      if (toAdd.length > 0) {
        const { error: insertError } = await supabase.from("role_permissions").insert(
          toAdd.map((permissionId) => ({
            role_id: selectedRoleId,
            permission_id: permissionId,
          }))
        );

        if (insertError) throw insertError;
      }

      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role_id", selectedRoleId)
          .in("permission_id", toRemove);

        if (deleteError) throw deleteError;
      }

      setOriginalPermissionIds(new Set(selectedPermissionIds));
      setSuccessMessage("تم حفظ الصلاحيات بنجاح.");
    } catch (error: any) {
      console.error("خطأ في حفظ الصلاحيات:", error);
      setErrorMessage("حدث خطأ أثناء الحفظ. تأكد إن عندك صلاحية مدير النظام.");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscardChanges() {
    setSelectedPermissionIds(new Set(originalPermissionIds));
  }

  // ============================================================
  // إنشاء دور جديد
  // ============================================================

  async function handleCreateRole() {
    const trimmedName = newRoleName.trim();

    if (!trimmedName) {
      setCreateError("من فضلك اكتب اسم الدور.");
      return;
    }

    if (roles.some((r) => r.name === trimmedName)) {
      setCreateError("يوجد دور بنفس الاسم بالفعل.");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const generatedCode = `custom_${Date.now()}`;

      const { data, error } = await supabase
        .from("roles")
        .insert({
          name: trimmedName,
          code: generatedCode,
          description: newRoleDescription.trim() || null,
          is_system: false,
          is_active: true,
        })
        .select("id, name, code, is_system, description")
        .single();

      if (error) throw error;

      setRoles((prev) => [...prev, data as RoleRow]);
      setSelectedRoleId(data!.id);
      setShowCreateModal(false);
      setNewRoleName("");
      setNewRoleDescription("");
    } catch (error: any) {
      console.error("خطأ في إنشاء الدور:", error);
      setCreateError("حدث خطأ أثناء إنشاء الدور. حاول مرة أخرى.");
    } finally {
      setCreating(false);
    }
  }

  // ============================================================
  // حذف دور
  // ============================================================

  async function handleDeleteRole(role: RoleRow) {
    if (role.is_system) return;

    const usersCount = userCounts[role.id] ?? 0;

    if (usersCount > 0) {
      setErrorMessage(
        `لا يمكن حذف هذا الدور لأنه مُعيّن حاليًا لـ ${usersCount} مستخدم. غيّر دورهم أولًا.`
      );
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الدور "${role.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
    );

    if (!confirmed) return;

    try {
      const { error: permsError } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", role.id);

      if (permsError) throw permsError;

      const { error: roleError } = await supabase
        .from("roles")
        .delete()
        .eq("id", role.id);

      if (roleError) throw roleError;

      setRoles((prev) => prev.filter((r) => r.id !== role.id));

      if (selectedRoleId === role.id) {
        setSelectedRoleId(null);
        setOriginalPermissionIds(new Set());
        setSelectedPermissionIds(new Set());
      }

      setSuccessMessage("تم حذف الدور بنجاح.");
    } catch (error: any) {
      console.error("خطأ في حذف الدور:", error);
      setErrorMessage("حدث خطأ أثناء حذف الدور.");
    }
  }

  // ============================================================
  // Render
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span
          style={{ fontFamily: "'Almarai', sans-serif", fontSize: 16, color: "#717d96" }}
        >
          جاري تحميل الأدوار...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl" style={{ fontFamily: "'Almarai', sans-serif" }}>
      {/* ============================================
          رسائل عامة
      ============================================ */}

      {errorMessage && (
        <div className="w-full rounded-[12px] px-5 py-3 bg-[#fef2f2] border border-[#fecaca] flex items-center justify-between">
          <span style={{ color: "#991b1b", fontSize: 14, fontWeight: 700 }}>
            {errorMessage}
          </span>
          <button onClick={() => setErrorMessage(null)} className="text-[#991b1b]">
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="w-full rounded-[12px] px-5 py-3 bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-between">
          <span style={{ color: "#166534", fontSize: 14, fontWeight: 700 }}>
            {successMessage}
          </span>
          <button onClick={() => setSuccessMessage(null)} className="text-[#166534]">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex gap-6 items-start flex-wrap lg:flex-nowrap">
        {/* ============================================
            العمود الأيمن: قائمة الأدوار
        ============================================ */}

        <div className="w-full lg:w-[300px] shrink-0 bg-white rounded-2xl border border-[#eff0f6] shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p style={{ fontSize: 16, fontWeight: 700, color: "#2d3648" }}>الأدوار</p>

            <button
              type="button"
              onClick={() => {
                setShowCreateModal(true);
                setCreateError(null);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#DCF4DF] text-[#00522E] hover:opacity-80 transition-opacity"
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              <Plus size={14} />
              دور جديد
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {roles.map((role) => {
              const isSelected = selectedRoleId === role.id;
              const count = userCounts[role.id] ?? 0;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={[
                    "w-full text-right rounded-xl px-4 py-3 border transition-colors",
                    isSelected
                      ? "bg-[#DCF4DF] border-[#00B867]"
                      : "bg-white border-[#eff0f6] hover:bg-[#f5f6fb]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: isSelected ? "#344736" : "#2d3648",
                      }}
                    >
                      {role.name}
                    </span>

                    {role.is_system && (
                      <ShieldCheck size={14} className="text-[#00B867] shrink-0" />
                    )}
                  </div>

                  <span style={{ fontSize: 12, color: "#717d96" }}>
                    {count} {count === 1 ? "مستخدم" : "مستخدمين"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================
            العمود الأيسر: تفاصيل الدور + مصفوفة الصلاحيات
        ============================================ */}

        <div className="flex-1 min-w-0 w-full bg-white rounded-2xl border border-[#eff0f6] shadow-sm p-5 flex flex-col gap-5">
          {!selectedRole ? (
            <p style={{ color: "#717d96", fontSize: 14 }}>اختر دورًا من القائمة.</p>
          ) : (
            <>
              {/* رأس الدور */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p style={{ fontSize: 18, fontWeight: 700, color: "#2d3648" }}>
                      {selectedRole.name}
                    </p>

                    {selectedRole.is_system && (
                      <span
                        className="px-2 py-0.5 rounded-full bg-[#DCF4DF] text-[#00522E]"
                        style={{ fontSize: 11, fontWeight: 700 }}
                      >
                        دور نظامي
                      </span>
                    )}
                  </div>

                  {selectedRole.description && (
                    <p style={{ fontSize: 13, color: "#717d96", marginTop: 4 }}>
                      {selectedRole.description}
                    </p>
                  )}
                </div>

                {!selectedRole.is_system && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRole(selectedRole)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#fef2f2] text-[#991b1b] hover:opacity-80 transition-opacity"
                    style={{ fontSize: 13, fontWeight: 700 }}
                  >
                    <Trash2 size={14} />
                    حذف الدور
                  </button>
                )}
              </div>

              <div className="w-full h-px bg-[#eff0f6]" />

              {/* مصفوفة الصلاحيات */}
              {loadingRolePerms ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-[#717d96]" />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {moduleGroups.map((group) => {
                    const groupIds = group.permissions.map((p) => p.id);
                    const allSelected = groupIds.every((id) =>
                      selectedPermissionIds.has(id)
                    );
                    const someSelected = groupIds.some((id) =>
                      selectedPermissionIds.has(id)
                    );

                    return (
                      <div
                        key={group.module}
                        className="rounded-xl border border-[#eff0f6] p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#2d3648" }}>
                            {group.module_label}
                          </p>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <span style={{ fontSize: 12, color: "#717d96" }}>
                              تحديد الكل
                            </span>
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = someSelected && !allSelected;
                              }}
                              onChange={() => toggleModuleAll(group)}
                              className="w-4 h-4 accent-[#00B867] cursor-pointer"
                            />
                          </label>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {group.permissions.map((perm) => {
                            const checked = selectedPermissionIds.has(perm.id);

                            return (
                              <label
                                key={perm.id}
                                className={[
                                  "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                                  checked
                                    ? "bg-[#DCF4DF] border-[#00B867]"
                                    : "bg-[#f7f9fc] border-[#eff0f6] hover:bg-[#f5f6fb]",
                                ].join(" ")}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermission(perm.id)}
                                  className="w-4 h-4 accent-[#00B867] cursor-pointer"
                                />
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: checked ? 700 : 400,
                                    color: checked ? "#344736" : "#2d3648",
                                  }}
                                >
                                  {perm.action_label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ============================================
          شريط الحفظ العائم
      ============================================ */}

      {selectedRole && isDirty && (
        <div className="sticky bottom-4 w-full flex justify-center z-10">
          <div className="bg-white shadow-lg border border-[#eff0f6] rounded-full px-5 py-3 flex items-center gap-4">
            <span style={{ fontSize: 13, color: "#717d96" }}>
              يوجد تغييرات لم يتم حفظها
            </span>

            <button
              type="button"
              onClick={handleDiscardChanges}
              disabled={saving}
              className="px-4 py-1.5 rounded-full border border-[#eff0f6] hover:bg-[#f5f6fb] transition-colors disabled:opacity-50"
              style={{ fontSize: 13, fontWeight: 700, color: "#717d96" }}
            >
              تراجع
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#00B867] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              حفظ التغييرات
            </button>
          </div>
        </div>
      )}

      {/* ============================================
          مودال إنشاء دور جديد
      ============================================ */}

      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]"
          onClick={() => !creating && setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-[420px] max-w-[95vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#2d3648" }}>
              إنشاء دور جديد
            </h2>

            <div className="flex flex-col gap-3">
              <div>
                <label
                  style={{ fontSize: 13, color: "#717d96", display: "block", marginBottom: 4 }}
                >
                  اسم الدور *
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="مثال: مسؤول متابعة الرديف"
                  className="w-full px-3 py-2 rounded-lg border border-[#eff0f6] focus:outline-none focus:border-[#00B867]"
                  style={{ fontSize: 14 }}
                  autoFocus
                />
              </div>

              <div>
                <label
                  style={{ fontSize: 13, color: "#717d96", display: "block", marginBottom: 4 }}
                >
                  وصف مختصر (اختياري)
                </label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="وصف قصير لمهام هذا الدور"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[#eff0f6] focus:outline-none focus:border-[#00B867] resize-none"
                  style={{ fontSize: 14 }}
                />
              </div>

              {createError && (
                <p style={{ fontSize: 13, color: "#991b1b" }}>{createError}</p>
              )}
            </div>

            <div className="flex items-center gap-2 mt-5">
              <button
                type="button"
                onClick={handleCreateRole}
                disabled={creating}
                className="flex-1 py-2 rounded-lg bg-[#00B867] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ fontSize: 14, fontWeight: 700 }}
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                إنشاء
              </button>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="flex-1 py-2 rounded-lg border border-[#eff0f6] hover:bg-[#f5f6fb] transition-colors disabled:opacity-50"
                style={{ fontSize: 14, fontWeight: 700, color: "#717d96" }}
              >
                إلغاء
              </button>
            </div>

            <p style={{ fontSize: 12, color: "#a0aec0", marginTop: 10 }}>
              بعد الإنشاء، حدد صلاحيات الدور من القائمة على اليمين ثم احفظ.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}