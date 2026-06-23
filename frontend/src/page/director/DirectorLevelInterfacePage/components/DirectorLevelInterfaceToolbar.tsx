type DirectorLevelInterfaceToolbarProps = {
  onOpenButtonFormatEditor: () => void;
  onOpenPathEditor: () => void;
  onOpenBackgroundEditor: () => void;
  onOpenBackgroundTemplates: () => void;
  onBack: () => void;
};

export const DirectorLevelInterfaceToolbar = ({
  onOpenButtonFormatEditor,
  onOpenPathEditor,
  onOpenBackgroundEditor,
  onOpenBackgroundTemplates,
  onBack,
}: DirectorLevelInterfaceToolbarProps) => (
  <div className="page-builder-toolbar">
    <div>
      <p className="eyebrow">Level Interface</p>
      <h2>关卡界面优化</h2>
      <p className="panel-copy">
        各端共用同一张关卡路径地图。可分别优化背景、按钮格式、节点布局与关卡路径；按钮会根据玩家进度自动切换「未解锁 / 未通关 / 已通关」文案。
      </p>
    </div>
    <div className="actions">
      <button type="button" onClick={onOpenButtonFormatEditor}>
        按钮格式设置
      </button>
      <button type="button" onClick={onOpenPathEditor}>
        路径设置
      </button>
      <button type="button" onClick={onOpenBackgroundEditor}>
        优化背景
      </button>
      <button type="button" className="secondary" onClick={onOpenBackgroundTemplates}>
        关卡背景模板
      </button>
      <button type="button" className="secondary" onClick={onBack}>
        返回总监工作台
      </button>
    </div>
  </div>
);
