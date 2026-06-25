type DirectorButtonConfigHeaderProps = {
  canSave: boolean;
  onBack: () => void;
  onSave: () => void;
};

export const DirectorButtonConfigHeader = ({ canSave, onBack, onSave }: DirectorButtonConfigHeaderProps) => (
  <div className="page-builder-toolbar">
    <div>
      <p className="eyebrow">Button Action</p>
      <h2>按钮配置</h2>
      <p className="panel-copy">配置按钮点击后的功能：跳转界面，或导出一个独立小面板。</p>
    </div>
    <div className="actions">
      <button type="button" className="secondary" onClick={onBack}>
        返回页面优化
      </button>
      <button type="button" disabled={!canSave} onClick={onSave}>
        保存按钮配置
      </button>
    </div>
  </div>
);
