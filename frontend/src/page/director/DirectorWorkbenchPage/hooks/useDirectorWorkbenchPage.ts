import { useCallback, useEffect, useState } from "react";
import { getBackendUsers, getDirectorPermissions, transferDirectorPermission } from "../../../../system/api/exports/index.js";
import type { DirectorPermissionSummary, User } from "../../../../objects/api/api-contracts.js";
import { syncLocalAdminLevelsFromBackend } from "../../../../system/app/auth.js";

const getTransferCandidateAdmins = (users: User[], currentUserId: string) =>
  users.filter((user) => user.role === "admin" && user.adminLevel === "standard" && user.id !== currentUserId);

export const useDirectorWorkbenchPage = (userId: string) => {
  const [permissions, setPermissions] = useState<DirectorPermissionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState("");

  const loadAdminUsers = useCallback(async () => {
    const users = await getBackendUsers();
    const admins = getTransferCandidateAdmins(users, userId);
    setAdminUsers(admins);
    setSelectedAdminId((current) =>
      current && admins.some((admin) => admin.id === current) ? current : admins[0]?.id ?? "",
    );
    return admins;
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    const loadPermissions = async () => {
      setLoading(true);
      setError("");

      try {
        const [summary, users] = await Promise.all([
          getDirectorPermissions(userId),
          getBackendUsers(),
        ]);
        if (!cancelled) {
          setPermissions(summary);
          const admins = getTransferCandidateAdmins(users, userId);
          setAdminUsers(admins);
          setSelectedAdminId(admins[0]?.id ?? "");
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "加载总监权限失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPermissions();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleTransferPermission = () => {
    setTransferOpen((current) => {
      const nextOpen = !current;
      if (nextOpen) {
        setLoading(true);
        setError("");
        void loadAdminUsers()
          .catch((caught) => {
            setError(caught instanceof Error ? caught.message : "加载管理员候选失败");
          })
          .finally(() => {
            setLoading(false);
          });
      }
      return nextOpen;
    });
    setMessage("");
  };

  const handleConfirmTransfer = async () => {
    const target = adminUsers.find((user) => user.id === selectedAdminId);
    if (!target) {
      setMessage("请选择一个管理员账号。");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await transferDirectorPermission(userId, target.id);
      await syncLocalAdminLevelsFromBackend();
      setMessage(`总监权限已转让给 昵称：${target.displayName} / 用户名：${target.username} / ID：${result.newDirectorId}。当前账号已不再是总监，请返回主界面或重新登录。`);
      setPermissions(null);
      await loadAdminUsers();
      setTransferOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "转让总监权限失败");
    } finally {
      setLoading(false);
    }
  };

  return {
    permissions,
    loading,
    adminUsers,
    error,
    message,
    transferOpen,
    selectedAdminId,
    setSelectedAdminId,
    handleTransferPermission,
    handleConfirmTransfer,
  };
};
