import type { PageDisplayMode } from "../../lib/page-render-mode.js";
import { pageDisplayModeLabels } from "../../lib/page-render-mode.js";

type PageDisplayModeBarProps = {
  mode: PageDisplayMode;
  pageId: string;
  pageName?: string | undefined;
  staticAvailable: boolean;
  dynamicAvailable: boolean;
  componentCount?: number | undefined;
  surfaceHint?: string | undefined;
  onModeChange: (mode: PageDisplayMode) => void;
};

export const PageDisplayModeBar = ({
  mode,
  pageId,
  pageName,
  staticAvailable,
  dynamicAvailable,
  componentCount,
  surfaceHint,
  onModeChange,
}: PageDisplayModeBarProps) => (
  <section className="page-display-mode-bar panel">
    <div className="page-display-mode-bar-copy">
      <p className="eyebrow">页面展现</p>
      <h2>{pageName ?? pageId}</h2>
      <p className="panel-copy">
        可在手写 React 静态页与 PageConfig 动态嵌套之间切换，或使用对比模式并排查看差异。
      </p>
      <div className="page-display-mode-bar-meta">
        <code>{pageId}</code>
        {surfaceHint ? <span>{surfaceHint}</span> : null}
        {componentCount !== undefined ? (
          <span>{componentCount} 个动态组件</span>
        ) : null}
        {!staticAvailable ? <span className="page-display-mode-flag">静态页待接入</span> : null}
        {!dynamicAvailable ? <span className="page-display-mode-flag">动态配置为空</span> : null}
      </div>
    </div>
    <div className="page-display-mode-toggle" role="tablist" aria-label="页面展现模式">
      {(Object.keys(pageDisplayModeLabels) as PageDisplayMode[]).map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={mode === option}
          className={mode === option ? "active" : "secondary"}
          disabled={
            (option === "static" && !staticAvailable)
            || (option === "dynamic" && !dynamicAvailable)
            || (option === "compare" && (!staticAvailable || !dynamicAvailable))
          }
          onClick={() => onModeChange(option)}
        >
          {pageDisplayModeLabels[option]}
        </button>
      ))}
    </div>
  </section>
);
