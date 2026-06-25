import {
  DESIGNER_PORTFOLIO_STATUS_LABELS,
} from "../shared/objects/designer-portfolio-mock.js";
import { PortfolioLevelCard } from "./components/PortfolioLevelCard.js";
import { PortfolioStatusTabs } from "./components/PortfolioStatusTabs.js";
import { useDesignerPortfolio } from "./hooks/useDesignerPortfolio.js";
import type { DesignerPortfolioPageProps } from "./objects/designer-portfolio-page-types.js";

export const DesignerPortfolioPage = ({
  onBack,
  onOpenResubmit,
  onContinueDesign,
}: DesignerPortfolioPageProps) => {
  const vm = useDesignerPortfolio();

  return (
    <section className="panel designer-portfolio-panel">
      <div className="designer-portfolio-header">
        <div>
          <h2>作品集</h2>
          <p className="panel-copy">
            按草稿、待审核、已发布、已驳回分类浏览你的关卡。当前为静态演示页，后续可接入设计师关卡列表 API。
          </p>
        </div>
        <button type="button" className="secondary" onClick={onBack}>
          返回主页
        </button>
      </div>

      <PortfolioStatusTabs
        activeStatus={vm.activeStatus}
        statusCounts={vm.statusCounts}
        setActiveStatus={vm.setActiveStatus}
      />

      <div className="designer-portfolio-summary">
        <span className={`designer-portfolio-status-badge status-${vm.activeStatus}`}>
          {DESIGNER_PORTFOLIO_STATUS_LABELS[vm.activeStatus]}
        </span>
        <span className="meta">共 {vm.visibleItems.length} 个关卡</span>
      </div>

      {vm.feedback ? <p className="feedback success">{vm.feedback}</p> : null}

      <div className="list designer-portfolio-list">
        {vm.visibleItems.length === 0 ? (
          <p className="designer-portfolio-empty">该分类下暂无关卡。</p>
        ) : null}

        {vm.visibleItems.map((item) => (
          <PortfolioLevelCard
            key={item.id}
            item={item}
            onOpenResubmit={onOpenResubmit}
            onContinueDesign={onContinueDesign}
            onVoidDraft={vm.handleVoidDraft}
          />
        ))}
      </div>
    </section>
  );
};
