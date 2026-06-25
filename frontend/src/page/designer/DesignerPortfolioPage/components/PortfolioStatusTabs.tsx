import {
  DESIGNER_PORTFOLIO_STATUS_LABELS,
  DESIGNER_PORTFOLIO_TABS,
} from "../../shared/objects/designer-portfolio-mock.js";
import type { DesignerPortfolioViewModel } from "../objects/designer-portfolio-page-types.js";

type PortfolioStatusTabsProps = Pick<DesignerPortfolioViewModel, "activeStatus" | "statusCounts" | "setActiveStatus">;

export const PortfolioStatusTabs = ({ activeStatus, statusCounts, setActiveStatus }: PortfolioStatusTabsProps) => (
  <div className="designer-portfolio-tabs auth-tabs" role="tablist" aria-label="作品集分类">
    {DESIGNER_PORTFOLIO_TABS.map((status) => (
      <button
        key={status}
        type="button"
        role="tab"
        aria-selected={activeStatus === status}
        className={activeStatus === status ? "active" : "secondary"}
        onClick={() => setActiveStatus(status)}
      >
        {DESIGNER_PORTFOLIO_STATUS_LABELS[status]}
        <span className="designer-portfolio-tab-count">{statusCounts[status]}</span>
      </button>
    ))}
  </div>
);
