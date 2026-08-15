  import { useEffect, useState } from "react";
  import { UserCog, Plus, CheckCircle2, Loader2, X, Pencil } from "lucide-react";
  import { supabase } from "../../lib/supabase";
  import { logActivity } from "../../lib/logActivity";

  const F: React.CSSProperties = {
    fontFamily: "'Almarai', sans-serif",
  };

  type Rank = {
    id: string;
    name: string;
  };

  type BranchHead = {
    id: string;
    full_name: string;
    rank_id: string;
    is_active: boolean;
    created_at: string;
    rank?: { name: string } | { name: string }[] | null;
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

  function getRankName(head: BranchHead): string {
    const rank = Array.isArray(head.rank) ? head.rank[0] : head.rank;
    return rank?.name ?? "-";
  }

  export function ManageBranchHeadsPage() {
    const [heads, setHeads] = useState<BranchHead[]>([]);
    const [ranks, setRanks] = useState<Rank[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [showAddModal, setShowAddModal] = useState(false);
    const [newFullName, setNewFullName] = useState("");
    const [newRankId, setNewRankId] = useState("");
    const [saving, setSaving] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingHead, setEditingHead] = useState<BranchHead | null>(null);
    const [editFullName, setEditFullName] = useState("");
    const [editRankId, setEditRankId] = useState("");
    const [editSaving, setEditSaving] = useState(false);

    const [settingCurrentId, setSettingCurrentId] = useState<string | null>(
      null
    );

    useEffect(() => {
      loadData();
    }, []);

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [headsResult, ranksResult] = await Promise.all([
          supabase
            .from("branch_heads")
            .select(
              `
              id,
              full_name,
              rank_id,
              is_active,
              created_at,
              rank:letter_officer_ranks!branch_heads_rank_id_fkey(name)
            `
            )
            .order("created_at", { ascending: false }),

          supabase
            .from("letter_officer_ranks")
            .select("id, name")
            .order("name", { ascending: true }),
        ]);

        if (headsResult.error) throw headsResult.error;
        if (ranksResult.error) throw ranksResult.error;

        setHeads(headsResult.data ?? []);
        setRanks(ranksResult.data ?? []);
      } catch (err: any) {
        console.error("Load branch heads error:", err);
        setError(err?.message || "حدث خطأ أثناء تحميل بيانات رؤساء الفرع");
      } finally {
        setLoading(false);
      }
    }

    function openAddModal() {
      setNewFullName("");
      setNewRankId("");
      setError("");
      setShowAddModal(true);
    }

    function closeAddModal() {
      if (saving) return;
      setShowAddModal(false);
    }

    async function handleAddHead() {
      if (!newFullName.trim()) {
        setError("اسم رئيس الفرع مطلوب");
        return;
      }

      if (!newRankId) {
        setError("الرتبة مطلوبة");
        return;
      }

      setSaving(true);
      setError("");

      try {
        const { data: inserted, error: insertError } = await supabase
          .from("branch_heads")
          .insert({
            full_name: newFullName.trim(),
            rank_id: newRankId,
            is_active: false,
          })
          .select("id, full_name")
          .single();

        if (insertError) throw insertError;

        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "CREATE",
          action: "إضافة رئيس فرع جديد",
          entity: "branch_heads",
          details: JSON.stringify({
            fullName: inserted?.full_name ?? newFullName.trim(),
          }),
        });

        setSuccessMsg("تم إضافة رئيس الفرع بنجاح");
        setTimeout(() => setSuccessMsg(""), 3000);

        setShowAddModal(false);
        await loadData();
      } catch (err: any) {
        console.error("Add branch head error:", err);
        setError(err?.message || "حدث خطأ أثناء إضافة رئيس الفرع");
      } finally {
        setSaving(false);
      }
    }

    // ─────────────────────────────────────────────────────────
    // تعديل بيانات رئيس فرع (اسم / رتبة)
    // ✅ الدوال دي منفصلة تمامًا عن handleSetCurrent، مش متداخلة جواها
    // ─────────────────────────────────────────────────────────

    function openEditModal(head: BranchHead) {
      setEditingHead(head);
      setEditFullName(head.full_name);
      setEditRankId(head.rank_id);
      setError("");
      setShowEditModal(true);
    }

    function closeEditModal() {
      if (editSaving) return;
      setShowEditModal(false);
      setEditingHead(null);
    }

    async function handleSaveEdit() {
      if (!editingHead) return;

      if (!editFullName.trim()) {
        setError("اسم رئيس الفرع مطلوب");
        return;
      }

      if (!editRankId) {
        setError("الرتبة مطلوبة");
        return;
      }

      setEditSaving(true);
      setError("");

      try {
        const { error: updateError } = await supabase
          .from("branch_heads")
          .update({
            full_name: editFullName.trim(),
            rank_id: editRankId,
          })
          .eq("id", editingHead.id);

        if (updateError) throw updateError;

        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "UPDATE",
          action: "تعديل بيانات رئيس فرع",
          entity: "branch_heads",
          details: JSON.stringify({
            fullName: editFullName.trim(),
            previousFullName: editingHead.full_name,
          }),
        });

        setSuccessMsg("تم تعديل بيانات رئيس الفرع بنجاح");
        setTimeout(() => setSuccessMsg(""), 3000);

        setShowEditModal(false);
        setEditingHead(null);
        await loadData();
      } catch (err: any) {
        console.error("Edit branch head error:", err);
        setError(err?.message || "حدث خطأ أثناء تعديل بيانات رئيس الفرع");
      } finally {
        setEditSaving(false);
      }
    }

    async function handleSetCurrent(head: BranchHead) {
      if (head.is_active) return;

      const confirmed = window.confirm(
        `هل تريد تعيين "${head.full_name}" كرئيس فرع حالي؟`
      );

      if (!confirmed) return;

      setSettingCurrentId(head.id);
      setError("");

      try {
        // إلغاء تفعيل كل الرؤساء الحاليين أولاً
        const { error: deactivateError } = await supabase
          .from("branch_heads")
          .update({ is_active: false })
          .eq("is_active", true);

        if (deactivateError) throw deactivateError;

        // تفعيل الرئيس الجديد
        const { error: activateError } = await supabase
          .from("branch_heads")
          .update({ is_active: true })
          .eq("id", head.id);

        if (activateError) throw activateError;

        const { userId, userName } = await getCurrentUserInfo();

        await logActivity({
          userId,
          userName,
          actionType: "UPDATE",
          action: "تعيين رئيس فرع حالي",
          entity: "branch_heads",
          details: JSON.stringify({
            fullName: head.full_name,
          }),
        });

        setSuccessMsg(`تم تعيين "${head.full_name}" كرئيس فرع حالي`);
        setTimeout(() => setSuccessMsg(""), 3000);

        await loadData();
      } catch (err: any) {
        console.error("Set current branch head error:", err);
        setError(err?.message || "حدث خطأ أثناء تعيين رئيس الفرع الحالي");
      } finally {
        setSettingCurrentId(null);
      }
    }

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
            رؤساء فرع التنظيم والإدارة
          </h1>

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
              إضافة رئيس فرع جديد
            </span>
          </button>
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
            <UserCog size={18} className="text-[#4a5468]" />
            <span style={{ ...F, fontSize: 16, color: "#4a5468" }}>
              سجل رؤساء الفرع
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
          ) : heads.length === 0 ? (
            <div className="py-16 text-center">
              <p style={{ ...F, fontSize: 14, color: "#a1aebe" }}>
                لا يوجد رؤساء فرع مسجلين بعد
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
                      الرتبة
                    </th>
                    <th
                      className="px-5 py-3 text-right"
                      style={{ ...F, fontSize: 13, color: "#717d96" }}
                    >
                      الاسم
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
                      الحالة
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
                  {heads.map((head) => (
                    <tr
                      key={head.id}
                      className="border-t border-[#e2e7f0]"
                      style={{
                        background: head.is_active ? "#f0fdf4" : "transparent",
                      }}
                    >
                    
                      <td
                        className="px-5 py-3 whitespace-nowrap"
                        style={{ ...F, fontSize: 14, color: "#2d3648" }}
                      >
                        {getRankName(head)}
                      </td>
  <td
                        className="px-5 py-3 whitespace-nowrap"
                        style={{ ...F, fontSize: 14, color: "#2d3648" }}
                      >
                        {head.full_name}
                      </td>

                      <td
                        className="px-5 py-3 whitespace-nowrap"
                        style={{ ...F, fontSize: 13, color: "#717d96" }}
                      >
                        {formatDate(head.created_at)}
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap">
                        {head.is_active ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
                            style={{
                              background: "#dcfce7",
                              ...F,
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#166534",
                            }}
                          >
                            <CheckCircle2 size={12} />
                            الرئيس الحالي
                          </span>
                        ) : (
                          <span
                            style={{ ...F, fontSize: 12, color: "#a1aebe" }}
                          >
                            سابق
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(head)}
                            className="flex items-center gap-1 text-[#1f3d97]"
                            style={{ ...F, fontSize: 13 }}
                          >
                            <Pencil size={13} />
                            تعديل
                          </button>

                          {!head.is_active && (
                            <button
                              type="button"
                              onClick={() => handleSetCurrent(head)}
                              disabled={settingCurrentId === head.id}
                              className="text-[#00522E] disabled:opacity-50"
                              style={{ ...F, fontSize: 13 }}
                            >
                              {settingCurrentId === head.id
                                ? "جاري التعيين..."
                                : "تعيين كرئيس حالي"}
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

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e7f0]">
                <span
                  style={{ ...F, fontWeight: 700, fontSize: 18, color: "#2d3648" }}
                >
                  إضافة رئيس فرع جديد
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
                    اسم رئيس الفرع
                  </label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    dir="rtl"
                    className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
                    style={{ ...F, fontSize: 15, color: "#2d3648" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                    الرتبة
                  </label>
                  <select
                    value={newRankId}
                    onChange={(e) => setNewRankId(e.target.value)}
                    dir="rtl"
                    className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
                    style={{ ...F, fontSize: 15, color: "#2d3648" }}
                  >
                    <option value="">اختر الرتبة</option>
                    {ranks.map((rank) => (
                      <option key={rank.id} value={rank.id}>
                        {rank.name}
                      </option>
                    ))}
                  </select>
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
                  onClick={handleAddHead}
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

        {showEditModal && editingHead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e7f0]">
                <span
                  style={{ ...F, fontWeight: 700, fontSize: 18, color: "#2d3648" }}
                >
                  تعديل بيانات رئيس الفرع
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
                    اسم رئيس الفرع
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    dir="rtl"
                    className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867]"
                    style={{ ...F, fontSize: 15, color: "#2d3648" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label style={{ ...F, fontSize: 14, color: "#2d3648" }}>
                    الرتبة
                  </label>
                  <select
                    value={editRankId}
                    onChange={(e) => setEditRankId(e.target.value)}
                    dir="rtl"
                    className="w-full h-[46px] rounded-[8px] border border-[#e2e7f0] px-3 text-right outline-none focus:border-[#00b867] bg-white"
                    style={{ ...F, fontSize: 15, color: "#2d3648" }}
                  >
                    <option value="">اختر الرتبة</option>
                    {ranks.map((rank) => (
                      <option key={rank.id} value={rank.id}>
                        {rank.name}
                      </option>
                    ))}
                  </select>
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