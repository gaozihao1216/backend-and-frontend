type DirectorUiCustomizationHeaderProps = {
  manualOpen: boolean;
  onOpenTemplates: () => void;
  onToggleManual: () => void;
};

export const DirectorUiCustomizationHeader = ({
  manualOpen,
  onOpenTemplates,
  onToggleManual,
}: DirectorUiCustomizationHeaderProps) => (
  <div className="feature-header">
    <div>
      <h2>UI 美化配置</h2>
      <p className="panel-copy">选择端侧后查看当前页面路径关系，后续可在这里继续挂接主题、布局和页面配置。</p>
    </div>
    <div className="director-ui-header-actions">
      <button type="button" className="secondary" onClick={onOpenTemplates}>
        查看模板
      </button>
      <button type="button" className="secondary" onClick={onToggleManual}>
        {manualOpen ? "收起说明" : "说明书"}
      </button>
      <div className="feature-pill">路径树</div>
    </div>
  </div>
);
