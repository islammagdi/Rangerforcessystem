import { useEffect, useMemo, useState } from "react";
import { Loader2, X, Eye, EyeOff, Users, Globe, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";

type Section = {
  key: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_enabled: boolean;
  visible_to_all: boolean;
};

type Role = {
  id: string;
  name: string;
  code: string | null;
  is_system: boolean;
};

export function DashboardSettingsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [links, setLinks] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    const [sectionsRes, rolesRes, linksRes] = await Promise.all([
      supabase
        .from("dashboard_sections")
        .select("key, label, description, sort_order, is_enabled, visible_to_all")
        .order("sort_order", { ascending: true }),
      supabase
        .from("roles")
        .select("id, name, code, is_system")
        .order("is_system", { ascending: false })
        .order("name", { ascending: true }),
      supabase.from("dashboard_section_roles").select("section_key, role_id"),
    ]);

    const firstError = sectionsRes.error ?? rolesRes.error ?? linksRes.error;

    if (firstError) {
      setError("تعذر تحميل الإعدادات: " + firstError.message);
      setLoading(false);
      return;
    }

    const map: Record<string, string[]> = {};
    (linksRes.data ?? []).forEach((row: any) => {
      if (!map[row.section_key]) map[row.section_key] = [];
      map[row.section_key].push(row.role_id);
    });

    setSections((sectionsRes.data ?? []) as Section[]);
    setRoles((rolesRes.data ?? []) as Role[]);
    setLinks(map);
    setLoading(false);
  }

  function flash(message: string) {
    setSuccess(message);
    window.setTimeout(() => setSuccess(""), 2500);
  }

  async function updateSection(key: string, patch: Partial<Section>) {
    setSavingKey(key);
    setError("");

    const { error: updateError } = await supabase
      .from("dashboard_sections")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("key", key);

    setSavingKey(null);

    if (updateError) {
      setError("تعذر حفظ التعديل: " + updateError.message);
      return;
    }

    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
    flash("تم الحفظ.");
  }

  async function toggleRole(sectionKey: string, roleId: string) {
    const current = links[sectionKey] ?? [];
    const linked = current.includes(roleId);

    setSavingKey(sectionKey);
    setError("");

    const { error: linkError } = linked
      ? await supabase
          .from("dashboard_section_roles")
          .delete()
          .eq("section_key", sectionKey)
          .eq("role_id", roleId)
      : await supabase
          .from("dashboard_section_roles")
          .insert({ section_key: sectionKey, role_id: roleId });

    setSavingKey(null);

    if (linkError) {
      setError("تعذر حفظ التعديل: " + linkError.message);
      return;
    }

    setLinks((prev) => ({
      ...prev,
      [sectionKey]: linked ? current.filter((id) => id !== roleId) : [...current, roleId],
    }));
    flash("تم الحفظ.");
  }

  const roleName = useMemo(() => {
    const map: Record<string, string> = {};
    roles.forEach((r) => (map[r.id] = r.name));
    return map;
  }, [roles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[#00B867]" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 w-full"
      dir="rtl"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      <div className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-1">
        <p style={{ fontSize: 18, fontWeight: 700, color: "#2d3648" }}>أقسام الموقف العام</p>
        <p style={{ fontSize: 13, color: "#717d96" }}>
          حدد كل قسم يظهر لمين. التعديلات بتتحفظ فورًا، وبتظهر للمستخدم أول ما يفتح الموقف العام أو يحدّث الصفحة.
        </p>
      </div>

      {error && (
        <div className="rounded-xl px-5 py-3 bg-[#fef2f2] border border-[#fecaca] flex items-center justify-between">
          <span style={{ color: "#991b1b", fontSize: 14, fontWeight: 700 }}>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-[#991b1b]">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="rounded-xl px-5 py-3 bg-[#f0fdf4] border border-[#bbf7d0]">
          <span style={{ color: "#166534", fontSize: 14, fontWeight: 700 }}>{success}</span>
        </div>
      )}

      {sections.map((section) => {
        const selectedRoles = links[section.key] ?? [];
        const saving = savingKey === section.key;

        const audience = !section.is_enabled
          ? { text: "مخفي عن الكل", bg: "#f1f5f9", color: "#64748b" }
          : section.visible_to_all
          ? { text: "يظهر للكل", bg: "#DCF4DF", color: "#00522E" }
          : selectedRoles.length === 0
          ? { text: "مش هيظهر لحد", bg: "#fef2f2", color: "#991b1b" }
          : {
              text: `يظهر لـ ${selectedRoles.length} ${selectedRoles.length === 1 ? "دور" : "أدوار"}`,
              bg: "#e8f0fe",
              color: "#172e78",
            };

        return (
          <div
            key={section.key}
            className="bg-white rounded-2xl border border-[#eff0f6] p-5 flex flex-col gap-4"
            style={{ opacity: section.is_enabled ? 1 : 0.75 }}
          >
            {/* الرأس */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#2d3648" }}>{section.label}</p>
                  <span
                    className="px-2.5 py-0.5 rounded-full"
                    style={{ fontSize: 12, fontWeight: 700, background: audience.bg, color: audience.color }}
                  >
                    {audience.text}
                  </span>
                  {saving && <Loader2 size={14} className="animate-spin text-[#00B867]" />}
                </div>
                {section.description && (
                  <p style={{ fontSize: 13, color: "#717d96" }}>{section.description}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => void updateSection(section.key, { is_enabled: !section.is_enabled })}
                disabled={saving}
                className={[
                  "flex items-center gap-1.5 px-4 h-9 rounded-full border transition-colors disabled:opacity-50",
                  section.is_enabled
                    ? "bg-[#DCF4DF] border-[#00B867] text-[#00522E]"
                    : "bg-[#f7f9fc] border-[#e2e7f0] text-[#64748b]",
                ].join(" ")}
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                {section.is_enabled ? <Eye size={15} /> : <EyeOff size={15} />}
                {section.is_enabled ? "مفعّل" : "متوقف"}
              </button>
            </div>

            {section.is_enabled && (
              <>
                {/* لمين */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: true, label: "كل المستخدمين", icon: <Globe size={15} /> },
                    { value: false, label: "أدوار محددة فقط", icon: <Users size={15} /> },
                  ].map((option) => {
                    const active = section.visible_to_all === option.value;
                    return (
                      <button
                        key={String(option.value)}
                        type="button"
                        onClick={() =>
                          !active && void updateSection(section.key, { visible_to_all: option.value })
                        }
                        disabled={saving}
                        className={[
                          "flex items-center gap-1.5 px-4 h-9 rounded-lg border transition-colors disabled:opacity-50",
                          active
                            ? "bg-[#e8f0fe] border-[#172e78] text-[#172e78]"
                            : "bg-white border-[#e2e7f0] text-[#475569] hover:bg-[#f5f6fb]",
                        ].join(" ")}
                        style={{ fontSize: 13, fontWeight: 700 }}
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                {/* الأدوار */}
                {!section.visible_to_all && (
                  <div className="rounded-xl border border-[#eff0f6] p-4 flex flex-col gap-3">
                    <p style={{ fontSize: 13, color: "#717d96" }}>
                      اختار الأدوار اللي تشوف القسم ده:
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {roles.map((role) => {
                        const checked = selectedRoles.includes(role.id);
                        return (
                          <label
                            key={role.id}
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
                              disabled={saving}
                              onChange={() => void toggleRole(section.key, role.id)}
                              className="w-4 h-4 accent-[#00B867] cursor-pointer"
                            />
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: checked ? 700 : 400,
                                color: checked ? "#344736" : "#2d3648",
                              }}
                            >
                              {role.name}
                            </span>
                            {role.is_system && <ShieldCheck size={13} className="text-[#00B867]" />}
                          </label>
                        );
                      })}
                    </div>

                    {selectedRoles.length > 0 && (
                      <p style={{ fontSize: 12, color: "#94a3b8" }}>
                        الأدوار المختارة: {selectedRoles.map((id) => roleName[id]).filter(Boolean).join("، ")}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}