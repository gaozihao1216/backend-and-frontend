import { LEVEL_MAP_PATH, LEVEL_NODE_DEFINITIONS, getLevelScreenPageId } from "../objects/ui-customization/level-map-structure.js";

type StaticLevelMapPreviewProps = {
  onNavigate: (path: string) => void;
};

export const StaticLevelMapPreview = ({ onNavigate }: StaticLevelMapPreviewProps) => (
  <section className="panel static-level-map-preview">
    <div className="feature-header">
      <div>
        <p className="eyebrow">Static Page</p>
        <h2>关卡路径地图（静态版）</h2>
        <p className="panel-copy">
          静态实现来自主界面内嵌的链条式关卡路径，节点布局与交互由 React 组件直接编写。
        </p>
      </div>
    </div>
    <div className="static-level-map-canvas">
      <svg viewBox="0 0 100 100" className="static-level-map-svg" aria-hidden="true">
        <path
          d="M 8 72 Q 24 58 36 42 T 72 28 T 92 18"
          fill="none"
          stroke="#7aa6d8"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />
        {LEVEL_NODE_DEFINITIONS.map((node) => (
          <g key={node.suffix} transform={`translate(${node.x} ${node.y})`}>
            <circle r="4.2" fill="#fff7e8" stroke="#5f4320" strokeWidth="0.8" />
            <text x="0" y="-6" textAnchor="middle" fontSize="3.2" fill="#334155">
              {node.label.split(" ")[0]}
            </text>
          </g>
        ))}
      </svg>
      <ul className="static-level-map-list">
        {LEVEL_NODE_DEFINITIONS.map((node) => (
          <li key={node.suffix}>
            <strong>{node.label}</strong>
            <p>{node.story}</p>
            <button
              type="button"
              className="secondary"
              onClick={() => onNavigate(`/levels/${node.suffix}`)}
            >
              打开静态关卡详情
            </button>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

type StaticLevelScreenPreviewProps = {
  levelSuffix: string;
  onNavigate: (path: string) => void;
};

export const StaticLevelScreenPreview = ({ levelSuffix, onNavigate }: StaticLevelScreenPreviewProps) => {
  const node = LEVEL_NODE_DEFINITIONS.find((entry) => entry.suffix === levelSuffix);
  const pageId = getLevelScreenPageId(levelSuffix);

  return (
    <section className="panel static-level-screen-preview">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Static Page</p>
          <h2>{node?.label ?? levelSuffix}</h2>
          <p className="panel-copy">
            静态版对应主界面关卡浮层与 PlayerPage 试玩入口，由 React 页面直接组合，而非 PageConfig 嵌套。
          </p>
        </div>
        <div className="page-display-mode-bar-meta">
          <code>{pageId}</code>
        </div>
      </div>
      <div className="static-level-screen-body">
        <div className="static-level-screen-placeholder" aria-hidden="true">
          <span>{node?.label ?? levelSuffix}</span>
        </div>
        <div className="static-level-screen-copy">
          <p>{node?.story ?? "该关卡尚未配置剧情说明。"}</p>
          <button type="button" className="secondary" onClick={() => onNavigate(LEVEL_MAP_PATH)}>
            返回路径地图
          </button>
        </div>
      </div>
    </section>
  );
};
