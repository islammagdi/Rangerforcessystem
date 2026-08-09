import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  UserX,
  UserCheck,
  X,
  Loader2,
  Users,
  ShieldCheck,
  UserRound,
  KeyRound,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

type Personnel = {
  id: string;
  military_number: string;
  full_name: string;
  rank_id: string;
  is_active: boolean | null;
  ranks?: {
    name: string | null;
  } | null;
};

type UserRole = {
  role_id: string;
  roles?: {
    id: string;
    name: string;
    code: string;
  } | null;
};

type Profile = {
  id: string;
  username: string;
  personnel_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  personnel?: Personnel | null;
  user_roles?: UserRole[];
};

type Role = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean | null;
};

const DEFAULT_PASSWORD = "123456789";

export function ManageUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [militaryNumber, setMilitaryNumber] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] =
    useState<Personnel | null>(null);

  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUser, setSelectedUser] =
    useState<Profile | null>(null);

  const [editRole, setEditRole] = useState("");
  const [editUsername, setEditUsername] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // تحميل المستخدمين
  // =====================================================

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const {
        data: profilesData,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          personnel_id,
          is_active,
          created_at,
          updated_at
        `)
        .order("created_at", { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      const profiles = (profilesData || []) as Profile[];

      // -------------------------------------------------
      // Personnel
      // -------------------------------------------------

      const personnelIds = profiles
        .map((profile) => profile.personnel_id)
        .filter(Boolean) as string[];

      let personnelMap = new Map<string, Personnel>();

      if (personnelIds.length > 0) {
        const {
          data: personnelData,
          error: personnelError,
        } = await supabase
          .from("personnel")
          .select(`
            id,
            military_number,
            full_name,
            rank_id,
            is_active,
            ranks (
              name
            )
          `)
          .in("id", personnelIds);

        if (personnelError) {
          throw personnelError;
        }

        const personnelList =
          (personnelData || []) as unknown as Personnel[];

        personnelMap = new Map(
          personnelList.map((person) => [
            person.id,
            person,
          ])
        );
      }

      // -------------------------------------------------
      // User Roles
      // -------------------------------------------------

      const profileIds = profiles.map(
        (profile) => profile.id
      );

      let userRolesData: any[] = [];

      if (profileIds.length > 0) {
        const {
          data,
          error: userRolesError,
        } = await supabase
          .from("user_roles")
          .select(`
            user_id,
            role_id
          `)
          .in("user_id", profileIds);

        if (userRolesError) {
          throw userRolesError;
        }

        userRolesData = data || [];
      }

      // -------------------------------------------------
      // Roles
      // -------------------------------------------------

      const {
        data: rolesData,
        error: rolesError,
      } = await supabase
        .from("roles")
        .select(`
          id,
          name,
          code,
          description,
          is_active
        `)
        .eq("is_active", true)
        .order("name");

      if (rolesError) {
        throw rolesError;
      }

      const loadedRoles =
        (rolesData || []) as Role[];

      // -------------------------------------------------
      // ربط الأدوار
      // -------------------------------------------------

      const rolesMap = new Map<string, Role>();

      loadedRoles.forEach((role) => {
        rolesMap.set(role.id, role);
      });

      const userRolesMap = new Map<
        string,
        UserRole[]
      >();

      userRolesData.forEach((item: any) => {
        const userId = item.user_id;
        const role = rolesMap.get(item.role_id);

        const userRole: UserRole = {
          role_id: item.role_id,
          roles: role
            ? {
                id: role.id,
                name: role.name,
                code: role.code,
              }
            : null,
        };

        const current =
          userRolesMap.get(userId) || [];

        current.push(userRole);

        userRolesMap.set(userId, current);
      });

      // -------------------------------------------------
      // تركيب المستخدمين
      // -------------------------------------------------

      const loadedUsers: Profile[] =
        profiles.map((profile) => ({
          ...profile,

          personnel: profile.personnel_id
            ? personnelMap.get(
                profile.personnel_id
              ) || null
            : null,

          user_roles:
            userRolesMap.get(profile.id) || [],
        }));

      setUsers(loadedUsers);
      setRoles(loadedRoles);

      // -------------------------------------------------
      // Statistics
      // -------------------------------------------------

      const total = loadedUsers.length;

      const active = loadedUsers.filter(
        (user) => user.is_active
      ).length;

      const inactive = loadedUsers.filter(
        (user) => !user.is_active
      ).length;

      const admins = loadedUsers.filter(
        (user) =>
          user.user_roles?.some(
            (item) =>
              item.roles?.code?.toUpperCase() ===
                "ADMIN" ||
              item.roles?.code?.toUpperCase() ===
                "ADMINISTRATOR"
          )
      ).length;

      setStats({
        total,
        active,
        inactive,
        admins,
      });
    } catch (err: any) {
      console.error(
        "LOAD USERS ERROR:",
        err
      );

      setError(
        err?.message ||
          "حدث خطأ أثناء تحميل بيانات المستخدمين"
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // البحث عن فرد
  // =====================================================

  async function searchPersonnel() {
    const number = militaryNumber.trim();

    if (!number) {
      setError("اكتب الرقم العسكري أولاً");
      return;
    }

    setSearching(true);
    setError("");
    setSuccess("");
    setSelectedPersonnel(null);

    try {
      const {
        data,
        error: searchError,
      } = await supabase
        .from("personnel")
        .select(`
          id,
          military_number,
          full_name,
          rank_id,
          is_active,
          ranks (
            name
          )
        `)
        .eq("military_number", number)
        .maybeSingle();

      if (searchError) {
        throw searchError;
      }

      if (!data) {
        setError(
          "لم يتم العثور على فرد بهذا الرقم العسكري"
        );
        return;
      }

      const personnel =
        data as unknown as Personnel;

      // التأكد من عدم وجود حساب
      const {
        data: existingProfile,
        error: existingProfileError,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          personnel_id,
          is_active
        `)
        .eq(
          "personnel_id",
          personnel.id
        )
        .maybeSingle();

      if (existingProfileError) {
        throw existingProfileError;
      }

      if (existingProfile) {
        setError(
          `هذا الفرد لديه حساب مستخدم بالفعل (${existingProfile.username})`
        );

        setSelectedPersonnel(null);
        return;
      }

      setSelectedPersonnel(personnel);
    } catch (err: any) {
      console.error(
        "SEARCH USER ERROR:",
        err
      );

      setError(
        err?.message ||
          "حدث خطأ أثناء البحث عن الفرد"
      );
    } finally {
      setSearching(false);
    }
  }

  // =====================================================
  // فتح نافذة إضافة مستخدم
  // =====================================================

  function openAddModal() {
    setMilitaryNumber("");
    setSelectedPersonnel(null);
    setSelectedRole("");
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeAddModal() {
    if (saving) return;

    setShowModal(false);
    setMilitaryNumber("");
    setSelectedPersonnel(null);
    setSelectedRole("");
    setError("");
    setSuccess("");
  }

  // =====================================================
  // إضافة مستخدم
  // =====================================================

  async function createUser() {
    if (!selectedPersonnel) {
      setError("ابحث عن الفرد أولاً");
      return;
    }

    if (!selectedRole) {
      setError("اختر صلاحية المستخدم");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // التأكد مرة أخرى من عدم وجود Profile
      const {
        data: existingProfile,
        error: checkError,
      } = await supabase
        .from("profiles")
        .select("id, username")
        .eq(
          "personnel_id",
          selectedPersonnel.id
        )
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingProfile) {
        throw new Error(
          `هذا الفرد لديه حساب مستخدم بالفعل (${existingProfile.username})`
        );
      }

      // -------------------------------------------------
      // إنشاء المستخدم عن طريق Edge Function
      // -------------------------------------------------

      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        "create-system-user",
        {
          body: {
            personnel_id:
              selectedPersonnel.id,
            role_id: selectedRole,
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            data?.message ||
            "فشل إنشاء المستخدم"
        );
      }

      setSuccess(
        "تم إنشاء المستخدم بنجاح"
      );

      await loadData();

      setTimeout(() => {
        closeAddModal();
      }, 800);
    } catch (err: any) {
      console.error(
        "CREATE USER ERROR:",
        err
      );

      setError(
        err?.message ||
          "حدث خطأ أثناء إنشاء المستخدم"
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // Enable / Disable
  // =====================================================

  async function toggleUserStatus(
    user: Profile
  ) {
    const newStatus = !user.is_active;

    const confirmed =
      window.confirm(
        newStatus
          ? "هل تريد تفعيل هذا الحساب؟"
          : "هل تريد إيقاف هذا الحساب؟"
      );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const {
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          is_active: newStatus,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.id === user.id
            ? {
                ...item,
                is_active: newStatus,
                updated_at:
                  new Date().toISOString(),
              }
            : item
        )
      );

      setStats((currentStats) => ({
        ...currentStats,

        active: newStatus
          ? currentStats.active + 1
          : currentStats.active - 1,

        inactive: newStatus
          ? currentStats.inactive - 1
          : currentStats.inactive + 1,
      }));

      setSuccess(
        newStatus
          ? "تم تفعيل الحساب بنجاح"
          : "تم إيقاف الحساب بنجاح"
      );
    } catch (err: any) {
      console.error(
        "TOGGLE USER ERROR:",
        err
      );

      setError(
        err?.message ||
          "حدث خطأ أثناء تغيير حالة الحساب"
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // تعديل المستخدم
  // =====================================================

  function openEditModal(
    user: Profile
  ) {
    setSelectedUser(user);

    setEditUsername(
      user.username
    );

    const currentRole =
      user.user_roles?.[0]?.role_id ||
      "";

    setEditRole(currentRole);

    setError("");
    setSuccess("");
    setShowEditModal(true);
  }

  function closeEditModal() {
    if (saving) return;

    setShowEditModal(false);
    setSelectedUser(null);
    setEditUsername("");
    setEditRole("");
    setError("");
    setSuccess("");
  }

  // =====================================================
  // حفظ تعديل المستخدم
  // =====================================================

  async function saveEdit() {
    if (!selectedUser) return;

    if (!editUsername.trim()) {
      setError(
        "اسم المستخدم مطلوب"
      );
      return;
    }

    if (!editRole) {
      setError(
        "اختر الصلاحية"
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // -------------------------------------------------
      // تحديث profile
      // -------------------------------------------------

      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .update({
          username:
            editUsername.trim(),

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          selectedUser.id
        );

      if (profileError) {
        throw profileError;
      }

      // -------------------------------------------------
      // حذف الدور القديم
      // -------------------------------------------------

      const {
        error: deleteRoleError,
      } = await supabase
        .from("user_roles")
        .delete()
        .eq(
          "user_id",
          selectedUser.id
        );

      if (deleteRoleError) {
        throw deleteRoleError;
      }

      // -------------------------------------------------
      // إضافة الدور الجديد
      // -------------------------------------------------

      const {
        error: roleError,
      } = await supabase
        .from("user_roles")
        .insert({
          user_id:
            selectedUser.id,

          role_id:
            editRole,
        });

      if (roleError) {
        throw roleError;
      }

      setSuccess(
        "تم حفظ التعديلات بنجاح"
      );

      await loadData();

      setTimeout(() => {
        closeEditModal();
      }, 500);
    } catch (err: any) {
      console.error(
        "SAVE EDIT ERROR:",
        err
      );

      setError(
        err?.message ||
          "حدث خطأ أثناء تعديل بيانات المستخدم"
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // إعادة تعيين كلمة المرور
  // =====================================================

  async function resetUserPassword() {
    if (!selectedUser) return;

    const confirmed = window.confirm(
      `هل تريد إعادة تعيين كلمة مرور المستخدم "${selectedUser.username}" إلى ${DEFAULT_PASSWORD}؟`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        "reset-user-password",
        {
          body: {
            user_id: selectedUser.id,
          },
        }
      );

      if (functionError) {
        console.error(
          "RESET PASSWORD FUNCTION ERROR:",
          functionError
        );

        const context =
          (functionError as any)?.context;

        if (context) {
          try {
            const errorBody =
              await context.json();

            console.error(
              "RESET PASSWORD RESPONSE:",
              errorBody
            );

            throw new Error(
              errorBody?.error ||
                errorBody?.message ||
                functionError.message
            );
          } catch (contextError: any) {
            if (
              contextError?.message &&
              contextError.message !==
                functionError.message
            ) {
              throw contextError;
            }

            throw new Error(
              functionError.message
            );
          }
        }

        throw new Error(
          functionError.message
        );
      }

      console.log(
        "RESET PASSWORD RESPONSE:",
        data
      );

      if (!data?.success) {
        throw new Error(
          data?.error ||
            data?.message ||
            "فشل إعادة تعيين كلمة المرور"
        );
      }

      setSuccess(
        "تم إعادة تعيين كلمة المرور بنجاح"
      );
    } catch (err: any) {
      console.error(
        "RESET PASSWORD ERROR:",
        err
      );

      setError(
        err?.message ||
          "حدث خطأ أثناء إعادة تعيين كلمة المرور"
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // اسم الصلاحية
  // =====================================================

  function getRoleName(
    user: Profile
  ) {
    const role =
      user.user_roles?.[0]?.roles;

    return (
      role?.name ||
      "بدون صلاحية"
    );
  }

  // =====================================================
  // آخر تحديث
  // =====================================================

  function getLastLogin(
    user: Profile
  ) {
    if (!user.updated_at) {
      return "غير متوفر";
    }

    return new Date(
      user.updated_at
    ).toLocaleDateString(
      "ar-EG",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  // =====================================================
  // JSX
  // =====================================================

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f7f9fc] p-6"
      style={{
        fontFamily:
          "'Almarai', sans-serif",
      }}
    >
      {/* Header */}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#081021]">
            إدارة المستخدمين
          </h1>

          <p className="text-sm text-[#64748b] mt-2">
            إدارة حسابات المستخدمين والصلاحيات
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#00B867] hover:bg-[#009d59] text-white px-5 py-3 rounded-xl transition-colors"
        >
          <Plus size={19} />

          <span>
            إضافة مستخدم جديد
          </span>
        </button>
      </div>

      {/* Global Error */}

      {error &&
        !showModal &&
        !showEditModal && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

      {success &&
        !showModal &&
        !showEditModal && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {success}
          </div>
        )}

      {/* Statistics */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="إجمالي المستخدمين"
          value={stats.total}
          icon={<Users size={22} />}
          color="green"
        />

        <StatCard
          title="المستخدمون النشطون"
          value={stats.active}
          icon={<UserCheck size={22} />}
          color="blue"
        />

        <StatCard
          title="الحسابات غير النشطة"
          value={stats.inactive}
          icon={<UserX size={22} />}
          color="red"
        />

        <StatCard
          title="المسؤولون"
          value={stats.admins}
          icon={<ShieldCheck size={22} />}
          color="purple"
        />
      </div>

      {/* Users Table */}

      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e2e8f0] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#081021]">
              جميع المستخدمين
            </h2>

            <p className="text-sm text-[#64748b] mt-1">
              قائمة الحسابات المسجلة في المنظومة
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="text-sm text-[#00B867] hover:text-[#009d59] disabled:opacity-50"
          >
            تحديث القائمة
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              size={32}
              className="animate-spin text-[#00B867]"
            />
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-[#64748b]">
            لا يوجد مستخدمون حتى الآن
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-sm">
                  <th className="text-right px-5 py-4">
                    اسم المستخدم
                  </th>

                  <th className="text-right px-5 py-4">
                    الاسم الكامل
                  </th>

                  <th className="text-right px-5 py-4">
                    الدرجة
                  </th>

                  <th className="text-right px-5 py-4">
                    الرقم العسكري
                  </th>

                  <th className="text-right px-5 py-4">
                    الصلاحية
                  </th>

                  <th className="text-right px-5 py-4">
                    آخر تحديث
                  </th>

                  <th className="text-right px-5 py-4">
                    الحالة
                  </th>

                  <th className="text-right px-5 py-4">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-[#e2e8f0] hover:bg-[#fafdfb]"
                  >
                    <td className="px-5 py-4 font-medium text-[#081021]">
                      {user.username}
                    </td>

                    <td className="px-5 py-4 text-[#334155]">
                      {user.personnel
                        ?.full_name ||
                        "غير مرتبط"}
                    </td>

                    <td className="px-5 py-4 text-[#334155]">
                      {user.personnel
                        ?.ranks?.name ||
                        "غير محدد"}
                    </td>

                    <td className="px-5 py-4 text-[#334155]">
                      {user.personnel
                        ?.military_number ||
                        "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-[#eefbf3] px-3 py-1 text-xs font-medium text-[#008c52]">
                        {getRoleName(user)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-[#64748b] text-sm">
                      {getLastLogin(user)}
                    </td>

                    <td className="px-5 py-4">
                      {user.is_active ? (
                        <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                          نشط
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">
                          غير نشط
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(user)
                          }
                          title="تعديل البيانات"
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleUserStatus(
                              user
                            )
                          }
                          disabled={saving}
                          title={
                            user.is_active
                              ? "إيقاف الحساب"
                              : "تفعيل الحساب"
                          }
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${
                            user.is_active
                              ? "text-red-500 hover:bg-red-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {user.is_active ? (
                            <UserX size={17} />
                          ) : (
                            <UserCheck size={17} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          Add User Modal
      ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            dir="rtl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <div>
                <h2 className="text-lg font-bold text-[#081021]">
                  إضافة مستخدم جديد
                </h2>

                <p className="text-sm text-[#64748b] mt-1">
                  ربط حساب جديد بأحد أفراد القوة
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                disabled={saving}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              <label className="block text-sm font-medium text-[#334155] mb-2">
                الرقم العسكري
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={militaryNumber}
                  onChange={(e) => {
                    setMilitaryNumber(
                      e.target.value
                    );

                    setError("");
                    setSelectedPersonnel(
                      null
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      searchPersonnel();
                    }
                  }}
                  placeholder="اكتب الرقم العسكري"
                  className="flex-1 h-12 rounded-xl border border-[#cbd5e1] px-4 outline-none focus:border-[#00B867] focus:ring-2 focus:ring-[#00B867]/10"
                />

                <button
                  type="button"
                  onClick={searchPersonnel}
                  disabled={
                    searching ||
                    !militaryNumber.trim()
                  }
                  className="h-12 px-5 rounded-xl bg-[#081021] text-white flex items-center gap-2 disabled:opacity-50"
                >
                  {searching ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Search size={18} />
                  )}

                  بحث
                </button>
              </div>

              {selectedPersonnel && (
                <div className="mt-5 rounded-xl border border-[#dcefe3] bg-[#f6fcf8] p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-[#DCF4DF] flex items-center justify-center text-[#008c52]">
                      <UserRound size={21} />
                    </div>

                    <div>
                      <p className="font-bold text-[#081021]">
                        بيانات الفرد
                      </p>

                      <p className="text-xs text-[#64748b]">
                        تم العثور على الفرد
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <InfoBox
                      label="الاسم"
                      value={
                        selectedPersonnel.full_name
                      }
                    />

                    <InfoBox
                      label="الرقم العسكري"
                      value={
                        selectedPersonnel.military_number
                      }
                    />

                    <InfoBox
                      label="الدرجة"
                      value={
                        selectedPersonnel
                          .ranks?.name ||
                        "غير محدد"
                      }
                    />
                  </div>
                </div>
              )}

              {selectedPersonnel && (
                <>
                  <div className="mt-5">
                    <label className="block text-sm font-medium text-[#334155] mb-2">
                      البريد الإلكتروني الخاص بـ Auth
                    </label>

                    <input
                      type="text"
                      readOnly
                      value={`${selectedPersonnel.military_number}@auth.local`}
                      className="w-full h-12 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-[#64748b] outline-none"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[#334155] mb-2">
                      اسم المستخدم
                    </label>

                    <input
                      type="text"
                      readOnly
                      value={
                        selectedPersonnel.military_number
                      }
                      className="w-full h-12 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-[#64748b] outline-none"
                    />

                    <p className="text-xs text-[#94a3b8] mt-2">
                      سيتم حفظ اسم المستخدم في profiles بدون @auth.local
                    </p>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[#334155] mb-2">
                      كلمة المرور الافتراضية
                    </label>

                    <input
                      type="text"
                      readOnly
                      value={DEFAULT_PASSWORD}
                      className="w-full h-12 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-[#64748b] outline-none"
                    />

                    <p className="text-xs text-[#94a3b8] mt-2">
                      يجب تغيير كلمة المرور بعد أول تسجيل دخول.
                    </p>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[#334155] mb-2">
                      صلاحيات المستخدم
                    </label>

                    <select
                      value={selectedRole}
                      onChange={(e) =>
                        setSelectedRole(
                          e.target.value
                        )
                      }
                      className="w-full h-12 rounded-xl border border-[#cbd5e1] bg-white px-4 outline-none focus:border-[#00B867]"
                    >
                      <option value="">
                        اختر الصلاحية
                      </option>

                      {roles.map((role) => (
                        <option
                          key={role.id}
                          value={role.id}
                        >
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-start gap-3">
              <button
                type="button"
                onClick={closeAddModal}
                disabled={saving}
                className="px-5 h-11 rounded-xl border border-[#cbd5e1] text-[#475569] hover:bg-gray-50 disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={createUser}
                disabled={
                  saving ||
                  !selectedPersonnel ||
                  !selectedRole
                }
                className="px-6 h-11 rounded-xl bg-[#00B867] hover:bg-[#009d59] text-white flex items-center gap-2 disabled:opacity-50"
              >
                {saving && (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                )}

                حفظ المستخدم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          Edit Modal
      ================================================= */}

      {showEditModal &&
        selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
                <h2 className="font-bold text-lg text-[#081021]">
                  تعديل بيانات المستخدم
                </h2>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="p-6">
                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

                <div className="mb-5 rounded-xl bg-[#f8fafc] p-4">
                  <p className="text-sm text-[#64748b]">
                    الفرد
                  </p>

                  <p className="font-bold text-[#081021] mt-1">
                    {selectedUser
                      .personnel
                      ?.full_name ||
                      "غير مرتبط"}
                  </p>

                  <p className="text-sm text-[#64748b] mt-1">
                    الرقم العسكري:{" "}
                    {selectedUser
                      .personnel
                      ?.military_number ||
                      "—"}
                  </p>
                </div>

                <label className="block text-sm font-medium text-[#334155] mb-2">
                  اسم المستخدم
                </label>

                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) =>
                    setEditUsername(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full h-12 rounded-xl border border-[#cbd5e1] px-4 outline-none focus:border-[#00B867] disabled:bg-gray-100"
                />

                <p className="text-xs text-[#94a3b8] mt-2">
                  يتم حفظ اسم المستخدم في profiles بدون @auth.local
                </p>

                <label className="block text-sm font-medium text-[#334155] mb-2 mt-4">
                  الصلاحية
                </label>

                <select
                  value={editRole}
                  onChange={(e) =>
                    setEditRole(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full h-12 rounded-xl border border-[#cbd5e1] bg-white px-4 outline-none focus:border-[#00B867] disabled:bg-gray-100"
                >
                  <option value="">
                    اختر الصلاحية
                  </option>

                  {roles.map((role) => (
                    <option
                      key={role.id}
                      value={role.id}
                    >
                      {role.name}
                    </option>
                  ))}
                </select>

                {/* Reset Password */}

                <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      <KeyRound size={20} />
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-orange-900">
                        إعادة تعيين كلمة المرور
                      </p>

                      <p className="text-xs text-orange-700 mt-1">
                        سيتم تعيين كلمة المرور إلى:
                      </p>

                      <p className="font-bold text-orange-900 mt-1">
                        {DEFAULT_PASSWORD}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      resetUserPassword
                    }
                    disabled={saving}
                    className="mt-4 w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <KeyRound size={18} />
                    )}

                    إعادة تعيين كلمة المرور
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#e2e8f0] flex justify-start gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="px-5 h-11 rounded-xl border border-[#cbd5e1] hover:bg-gray-50 disabled:opacity-50"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={
                    saving ||
                    !editUsername.trim() ||
                    !editRole
                  }
                  className="px-6 h-11 rounded-xl bg-[#00B867] hover:bg-[#009d59] text-white flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  )}

                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

// =====================================================
// Stat Card
// =====================================================

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color:
    | "green"
    | "blue"
    | "red"
    | "purple";
}) {
  const colors = {
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
    },

    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
    },

    red: {
      bg: "bg-red-50",
      text: "text-red-600",
    },

    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#64748b]">
            {title}
          </p>

          <p className="text-2xl font-bold text-[#081021] mt-2">
            {value}
          </p>
        </div>

        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color].bg} ${colors[color].text}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Info Box
// =====================================================

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
      <p className="text-xs text-[#94a3b8] mb-1">
        {label}
      </p>

      <p className="text-sm font-semibold text-[#334155] truncate">
        {value}
      </p>
    </div>
  );
}