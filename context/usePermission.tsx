import { useMemo, useCallback } from "react";
import { useGetPermissions } from "@/services/iam.service";
import useAuthStore from "./User";

export const useAppPermissions = () => {
  const { data: response, isLoading, error } = useGetPermissions();
  const { user } = useAuthStore();

  const permissions = useMemo(() => {
    const allowList = response?.data?.allow || [];
    const denyList = response?.data?.deny || [];

    const allowSet = new Set<string>(allowList);
    const denySet = new Set<string>(denyList);

    return { allowSet, denySet };
  }, [response]);

  const can = useCallback(
    (permission: string): boolean => {
      const userRole = user?.user_type || response?.data?.user_type;

      if (userRole === "superuser") {
        return true;
      }

      if (permissions.denySet.has(permission)) return false;
      return permissions.allowSet.has(permission);
    },
    [user?.user_type, response?.data?.user_type, permissions],
  );

  const canAny = useCallback(
    (perms: string[]): boolean => {
      return perms.some((p) => can(p));
    },
    [can],
  );

  return {
    can,
    canAny,
    isLoading,
    error,
    isSuperAdmin:
      (user?.user_role || response?.data?.user_role) === "superadmin",
    allPermissions: response?.data,
  };
};
