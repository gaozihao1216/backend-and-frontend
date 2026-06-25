import { DirectorWorkbenchHeader } from "./components/DirectorWorkbenchHeader.js";
import { useDirectorWorkbenchPage } from "./hooks/useDirectorWorkbenchPage.js";
import type { DirectorWorkbenchPageProps } from "./objects/director-workbench-page-types.js";

export const DirectorWorkbenchPage = ({
  userId,
  onOpenUiCustomization,
  onOpenLevelInterfaceOptimization,
  onOpenLevelAssignment,
  onOpenBirdSkillLab,
  onOpenLevelBackgroundTemplates,
}: DirectorWorkbenchPageProps) => {
  const vm = useDirectorWorkbenchPage(userId);

  return (
    <section className="panel">
      <DirectorWorkbenchHeader permissionLabel={vm.permissions?.adminLevel === "director" ? "总监管理员" : "权限校验"} />

      {vm.loading ? <p className="meta">正在校验总监权限...</p> : null}
      {vm.error ? <p className="feedback error">{vm.error}</p> : null}
      {vm.message ? <p className="feedback success">{vm.message}</p> : null}

      <div className="director-option-list">
        <section className="feature-card director-option-row">
          <h3>权限设置</h3>
          <p className="panel-copy">
            当前系统只允许一个账号拥有总监管理员权限。权限转让需要在同一事务中完成，避免同时出现两个总监。
          </p>
          <div className="actions">
            <button type="button" onClick={vm.handleTransferPermission}>
              转让权限
            </button>
          </div>
        </section>

        {vm.transferOpen ? (
          <section className="feature-card director-transfer-panel">
            <h3>选择转让管理员</h3>
            <p className="panel-copy">只显示普通管理员账号。当前总监账号不会出现在候选列表中。</p>
            {vm.adminUsers.length > 0 ? (
              <>
                <label>
                  <span>目标管理员</span>
                  <select value={vm.selectedAdminId} onChange={(event) => vm.setSelectedAdminId(event.target.value)}>
                    {vm.adminUsers.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        昵称：{admin.displayName} / 用户名：{admin.username} / ID：{admin.id}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="actions">
                  <button type="button" onClick={() => void vm.handleConfirmTransfer()} disabled={vm.loading}>
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
          <div className="actions">
            <button type="button" onClick={onOpenUiCustomization}>
              进入配置
            </button>
          </div>
        </section>

        <section className="feature-card director-option-row">
          <h3>地图界面配置</h3>
          <p className="panel-copy">调整各端共用的关卡路径地图背景、路径样式与节点样式。</p>
          <div className="actions">
            <button type="button" onClick={onOpenLevelInterfaceOptimization}>
              进入关卡界面的优化
            </button>
          </div>
        </section>

        <section className="feature-card director-option-row">
          <h3>关卡背景模板</h3>
          <p className="panel-copy">配置关卡内天气背景，支持晴天云朵、雨天雨滴与雷雨天闪电等动态效果模板。</p>
          <div className="actions">
            <button type="button" onClick={onOpenLevelBackgroundTemplates}>
              进入背景模板
            </button>
          </div>
        </section>

        <section className="feature-card director-option-row">
          <h3>关卡细节分配</h3>
          <p className="panel-copy">将管理员审核通过的设计师提案，分配到关卡路径地图中的具体关卡槽位。</p>
          <div className="actions">
            <button type="button" onClick={onOpenLevelAssignment}>
              进入分配
            </button>
          </div>
        </section>

        <section className="feature-card director-option-row">
          <h3>鸟类技能实验室</h3>
          <p className="panel-copy">用积木式编辑器将设计师文案落实为点击技能，并上传小鸟建模图。</p>
          <div className="actions">
            <button type="button" onClick={onOpenBirdSkillLab}>
              进入技能实验室
            </button>
          </div>
        </section>

        <section className="feature-card director-option-row">
          <h3>设计师流程优化</h3>
          <p className="panel-copy">跟踪设计师创作、提交、审核链路中的关键改进项。</p>
        </section>
      </div>
    </section>
  );
};
