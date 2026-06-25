import {
  DESIGNER_PORTFOLIO_STATUS_LABELS,
  formatDesignerPortfolioDate,
  type DesignerPortfolioItem,
} from "../../shared/objects/designer-portfolio-mock.js";

type ResubmitSummaryProps = {
  portfolioItem: DesignerPortfolioItem;
};

export const ResubmitSummary = ({ portfolioItem }: ResubmitSummaryProps) => (
  <article className="card designer-resubmit-summary">
    <div className="card-header">
      <strong>{portfolioItem.title}</strong>
      <span className="designer-portfolio-status-badge status-rejected">
        {DESIGNER_PORTFOLIO_STATUS_LABELS.rejected}
      </span>
    </div>
    <p className="meta">关卡 ID：{portfolioItem.id}</p>
    <p className="meta">最近更新：{formatDesignerPortfolioDate(portfolioItem.updatedAt)}</p>
    <div className="designer-portfolio-rejection">
      <strong>驳回原因</strong>
      <p>{portfolioItem.rejectionReason ?? "未提供驳回原因。"}</p>
      {portfolioItem.reviewNote ? (
        <p className="meta">审核备注：{portfolioItem.reviewNote}</p>
      ) : null}
    </div>
  </article>
);
