import {
  DESIGNER_PORTFOLIO_STATUS_LABELS,
  formatDesignerPortfolioDate,
  type DesignerPortfolioItem,
} from "../../shared/objects/designer-portfolio-mock.js";

type PortfolioLevelCardProps = {
  item: DesignerPortfolioItem;
  onOpenResubmit: (levelId: string) => void;
  onContinueDesign: (levelId: string) => void;
  onVoidDraft: (item: DesignerPortfolioItem) => void;
};

export const PortfolioLevelCard = ({
  item,
  onOpenResubmit,
  onContinueDesign,
  onVoidDraft,
}: PortfolioLevelCardProps) => (
  <article className="card designer-portfolio-card">
    <div className="card-header">
      <strong>{item.title}</strong>
      <span className={`designer-portfolio-status-badge status-${item.status}`}>
        {DESIGNER_PORTFOLIO_STATUS_LABELS[item.status]}
      </span>
    </div>

    <p>{item.description}</p>

    <div className="tag-list">
      {item.tags.map((tag) => (
        <span key={tag} className="tag-chip">
          {tag}
        </span>
      ))}
    </div>

    <p className="meta">关卡 ID：{item.id}</p>
    <p className="meta">最近更新：{formatDesignerPortfolioDate(item.updatedAt)}</p>

    {item.status === "published" && item.publishedAt ? (
      <p className="meta">
        发布时间：{formatDesignerPortfolioDate(item.publishedAt)}
        {item.ratingCount && item.ratingCount > 0
          ? ` · 评分 ${item.averageRating?.toFixed(1) ?? "0.0"}（${item.ratingCount} 条）`
          : ""}
      </p>
    ) : null}

    {item.status === "pending_review" ? (
      <p className="meta designer-portfolio-note">已提交审核，请等待管理员处理。</p>
    ) : null}

    {item.status === "rejected" ? (
      <>
        <div className="designer-portfolio-rejection">
          <strong>驳回原因</strong>
          <p>{item.rejectionReason ?? "未提供驳回原因。"}</p>
          {item.reviewNote ? <p className="meta">审核备注：{item.reviewNote}</p> : null}
        </div>
        <div className="actions">
          <button type="button" onClick={() => onOpenResubmit(item.id)}>
            重新提交
          </button>
        </div>
      </>
    ) : null}

    {item.status === "draft" ? (
      <>
        <p className="meta designer-portfolio-note">草稿尚未提交审核，可继续在设计窗口中编辑。</p>
        <div className="actions">
          <button type="button" onClick={() => onContinueDesign(item.id)}>
            继续设计
          </button>
          <button type="button" className="secondary" onClick={() => onVoidDraft(item)}>
            作废
          </button>
        </div>
      </>
    ) : null}
  </article>
);
