import { useCallback, useEffect, useState } from "react";
import { getBackendUsers, getDirectorPermissions, transferDirectorPermission } from "../api/index.js";
import type { DirectorPermissionSummary, User } from "../api/api-contracts.js";
import { syncLocalAdminLevelsFromBackend } from "../lib/auth.js";

type DirectorWorkbenchPageProps = {
  userId: string;
};

const getTransferCandidateAdmins = (users: User[], currentUserId: string) =>
  users.filter((user) => user.role === "admin" && user.adminLevel === "standard" && user.id !== currentUserId);

export const DirectorWorkbenchPage = ({ userId }: DirectorWorkbenchPageProps) => {
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

  return (
    <section className="panel">
      <div className="feature-header">
        <div>
          <h2>总监工作台</h2>
          <p className="panel-copy">管理平台级配置、创作流程和高级管理员权限。</p>
        </div>
        <div className="feature-pill">{permissions?.adminLevel === "director" ? "总监管理员" : "权限校验"}</div>
      </div>

      {loading ? <p className="meta">正在校验总监权限...</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}
      {message ? <p className="feedback success">{message}</p> : null}

      <div className="director-option-list">
        <section className="feature-card director-option-row">
          <h3>权限设置</h3>
          <p className="panel-copy">
            当前系统只允许一个账号拥有总监管理员权限。权限转让需要在同一事务中完成，避免同时出现两个总监。
          </p>
          <div className="actions">
            <button type="button" onClick={handleTransferPermission}>
              转让权限
            </button>
          </div>
        </section>

        {transferOpen ? (
          <section className="feature-card director-transfer-panel">
            <h3>选择转让管理员</h3>
            <p className="panel-copy">只显示普通管理员账号。当前总监账号不会出现在候选列表中。</p>
            {adminUsers.length > 0 ? (
              <>
                <label>
                  <span>目标管理员</span>
                  <select value={selectedAdminId} onChange={(event) => setSelectedAdminId(event.target.value)}>
                    {adminUsers.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        昵称：{admin.displayName} / 用户名：{admin.username} / ID：{admin.id}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="actions">
                  <button type="button" onClick={() => void handleConfirmTransfer()} disabled={loading}>
                    确认选择
                  </button>
                </div>
              </>
            ) : (
              <p className="meta">当前没有可转让的其他管理员账号。</p>
            )}
          </section>
        ) : null}

        <section className="feature-card director-option-row">
          <h3>UI 美化配置</h3>
          <p className="panel-copy">集中规划首页、工作台和关卡展示的视觉配置。</p>
        </section>

        <section className="feature-card director-option-row">
          <h3>地图界面配置</h3>
          <p className="panel-copy">预留章节地图、节点样式和玩家路径体验的高级配置入口。</p>
        </section>

        <section className="feature-card director-option-row">
          <h3>设计师流程优化</h3>
          <p className="panel-copy">跟踪设计师创作、提交、审核链路中的关键改进项。</p>
        </section>
      </div>
    </section>
  );
};
