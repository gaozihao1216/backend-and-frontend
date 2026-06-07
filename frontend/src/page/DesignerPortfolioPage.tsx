import { useMemo, useState } from "react";
import type { LevelStatus } from "../objects/system/level-status.js";
import {
  DESIGNER_PORTFOLIO_MOCK_ITEMS,
  DESIGNER_PORTFOLIO_STATUS_LABELS,
  DESIGNER_PORTFOLIO_TABS,
  formatDesignerPortfolioDate,
  type DesignerPortfolioItem,
} from "../lib/designer-portfolio-mock.js";

type DesignerPortfolioPageProps = {
  onBack: () => void;
  onOpenResubmit: (levelId: string) => void;
  onContinueDesign: (levelId: string) => void;
};

export const DesignerPortfolioPage = ({
  onBack,
  onOpenResubmit,
  onContinueDesign,
}: DesignerPortfolioPageProps) => {
  const [activeStatus, setActiveStatus] = useState<LevelStatus>("draft");
  const [voidedDraftIds, setVoidedDraftIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");

  const portfolioItems = useMemo(
    () => DESIGNER_PORTFOLIO_MOCK_ITEMS.filter((item) => !voidedDraftIds.includes(item.id)),
    [voidedDraftIds],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<LevelStatus, number> = {
      draft: 0,
      pending_review: 0,
      published: 0,
      rejected: 0,
    };

    for (const item of portfolioItems) {
      counts[item.status] += 1;
    }

    return counts;
  }, [portfolioItems]);

  const visibleItems = useMemo(
    () => portfolioItems.filter((item) => item.status === activeStatus),
    [activeStatus, portfolioItems],
  );

  const handleVoidDraft = (item: DesignerPortfolioItem) => {
    const confirmed = window.confirm(`确定作废草稿「${item.title}」吗？作废后将从作品集中移除。`);
    if (!confirmed) {
      return;
    }

    setVoidedDraftIds((current) => [...current, item.id]);
    setFeedback(`草稿「${item.title}」已作废。`);
  };

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

      <div className="designer-portfolio-summary">
        <span className={`designer-portfolio-status-badge status-${activeStatus}`}>
          {DESIGNER_PORTFOLIO_STATUS_LABELS[activeStatus]}
        </span>
        <span className="meta">共 {visibleItems.length} 个关卡</span>
      </div>

      {feedback ? <p className="feedback success">{feedback}</p> : null}

      <div className="list designer-portfolio-list">
        {visibleItems.length === 0 ? (
          <p className="designer-portfolio-empty">该分类下暂无关卡。</p>
        ) : null}

        {visibleItems.map((item) => (
          <article key={item.id} className="card designer-portfolio-card">
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
                  <button type="button" className="secondary" onClick={() => handleVoidDraft(item)}>
                    作废
                  </button>
                </div>
              </>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
};
