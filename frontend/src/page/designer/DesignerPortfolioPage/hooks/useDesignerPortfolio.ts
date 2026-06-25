import { useMemo, useState } from "react";
import type { LevelStatus } from "../../../../objects/system/level-status.js";
import {
  DESIGNER_PORTFOLIO_MOCK_ITEMS,
  type DesignerPortfolioItem,
} from "../../shared/objects/designer-portfolio-mock.js";
import type { DesignerPortfolioViewModel } from "../objects/designer-portfolio-page-types.js";

export const useDesignerPortfolio = (): DesignerPortfolioViewModel => {
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

  return {
    activeStatus,
    feedback,
    statusCounts,
    visibleItems,
    setActiveStatus,
    handleVoidDraft,
  };
};
