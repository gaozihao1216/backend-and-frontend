import { useEffect, useState } from "react";
import { getDirectorPermissions } from "../api/index.js";
import type { DirectorPermissionSummary } from "../api/api-contracts.js";

type DirectorWorkbenchPageProps = {
  userId: string;
};

export const DirectorWorkbenchPage = ({ userId }: DirectorWorkbenchPageProps) => {
  const [permissions, setPermissions] = useState<DirectorPermissionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadPermissions = async () => {
      setLoading(true);
      setError("");

      try {
        const summary = await getDirectorPermissions(userId);
        if (!cancelled) {
          setPermissions(summary);
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
    setMessage("转让权限入口已预留。当前系统约束同一时刻只能存在一个总监管理员，正式转让流程接入后会先降级当前总监再授予新总监。");
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

      <div className="feature-grid">
        <section className="feature-card">
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

        <section className="feature-card">
          <h3>UI 美化配置</h3>
          <p className="panel-copy">集中规划首页、工作台和关卡展示的视觉配置。</p>
        </section>

        <section className="feature-card">
          <h3>地图界面配置</h3>
          <p className="panel-copy">预留章节地图、节点样式和玩家路径体验的高级配置入口。</p>
        </section>

        <section className="feature-card">
          <h3>设计师流程优化</h3>
          <p className="panel-copy">跟踪设计师创作、提交、审核链路中的关键改进项。</p>
        </section>
      </div>
    </section>
  );
};
