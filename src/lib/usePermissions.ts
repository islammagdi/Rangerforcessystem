import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

// ============================================================
// Types
// ============================================================

export interface UserPermissionsResult {
  loading: boolean;
  permissions: Set<string>; // e.g. { "letters_archive:view", "letters_archive:export" }
  roleNames: string[];
  roleCodes: string[];
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
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [roleCodes, setRoleCodes] = useState<string[]>([]);
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
          setRoleNames([]);
          setRoleCodes([]);
          setLoading(false);
        }
        return;
      }

      // 1) هات كل الأدوار المرتبطة بالمستخدم (مش دور واحد بس)
      const { data: userRolesData, error: userRolesError } = await supabase
        .from("user_roles")
        .select(`
          role_id,
          roles ( id, name, code )
        `)
        .eq("user_id", user.id);

      if (userRolesError) {
        console.error("PERMISSIONS: load roles error", userRolesError);
      }

      const roles = (userRolesData ?? [])
        .map((row: any) =>
          Array.isArray(row.roles) ? row.roles[0] : row.roles
        )
        .filter(Boolean);

      if (roles.length === 0) {
        if (mounted) {
          setPermissions(new Set());
          setRoleNames([]);
          setRoleCodes([]);
          setLoading(false);
        }
        return;
      }

      const roleIds = roles.map((r: any) => r.id);

      // 2) هات كل صلاحيات كل الأدوار دي مجمّعة مع بعض (module:action)
      const { data: permsData, error: permsError } = await supabase
        .from("role_permissions")
        .select(`
          role_id,
          permissions ( module, action )
        `)
        .in("role_id", roleIds);

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
        setRoleNames(roles.map((r: any) => r.name).filter(Boolean));
        setRoleCodes(roles.map((r: any) => r.code).filter(Boolean));
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const isAdmin = roleCodes.includes("ADMIN");

  const hasPermission = useCallback(
    (code: string) => isAdmin || permissions.has(code),
    [permissions, isAdmin]
  );

  return {
    loading,
    permissions,
    roleNames,
    roleCodes,
    isAdmin,
    hasPermission,
    refresh,
  };
}