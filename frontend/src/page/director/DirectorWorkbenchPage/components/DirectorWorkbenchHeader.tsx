type DirectorWorkbenchHeaderProps = {
  permissionLabel: string;
};

export const DirectorWorkbenchHeader = ({ permissionLabel }: DirectorWorkbenchHeaderProps) => (
  <div className="feature-header">
    <div>
      <h2>总监工作台</h2>
      <p className="panel-copy">管理平台级配置、创作流程和高级管理员权限。</p>
    </div>
    <div className="feature-pill">{permissionLabel}</div>
  </div>
);
