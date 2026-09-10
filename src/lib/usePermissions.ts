import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

// ============================================================
// Types
// ============================================================

export interface UserPermissionsResult {
  loading: boolean;
  permissions: Set<string>; // e.g. { "letters_archive:view", "letters_archive:export" }
  roleName: string | null;
  roleCode: string | null;
  isAdmin: boolean;
  hasPermission: (code: string) => boolean;
  refresh: () => void;
}

// ============================================================
// Hook
// ============================================================

export function usePermissions(): UserPermissionsResult {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [roleName, setRoleName] = useState<string | null>(null);
  const [roleCode, setRoleCode] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) {
          setPermissions(new Set());
          setRoleName(null);
          setRoleCode(null);
          setLoading(false);
        }
        return;
      }

      // 1) هات دور المستخدم
      const { data: userRoleData, error: userRoleError } = await supabase
        .from("user_roles")
        .select(`
          role_id,
          roles ( id, name, code )
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (userRoleError) {
        console.error("PERMISSIONS: load role error", userRoleError);
      }

      const role = Array.isArray(userRoleData?.roles)
        ? userRoleData?.roles[0]
        : userRoleData?.roles;

      if (!role) {
        if (mounted) {
          setPermissions(new Set());
          setRoleName(null);
          setRoleCode(null);
          setLoading(false);
        }
        return;
      }

      // 2) هات كل صلاحيات الدور ده (module:action)
      const { data: permsData, error: permsError } = await supabase
        .from("role_permissions")
        .select(`
          permissions ( module, action )
        `)
        .eq("role_id", role.id);

      if (permsError) {
        console.error("PERMISSIONS: load permissions error", permsError);
      }

      const permsSet = new Set<string>();

      (permsData ?? []).forEach((row: any) => {
        const perm = Array.isArray(row.permissions)
          ? row.permissions[0]
          : row.permissions;

        if (perm) {
          permsSet.add(`${perm.module}:${perm.action}`);
        }
      });

      if (mounted) {
        setPermissions(permsSet);
        setRoleName(role.name ?? null);
        setRoleCode(role.code ?? null);
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const hasPermission = useCallback(
    (code: string) => permissions.has(code),
    [permissions]
  );

  const isAdmin = roleCode === "ADMIN";

  return {
    loading,
    permissions,
    roleName,
    roleCode,
    isAdmin,
    hasPermission,
    refresh,
  };
}