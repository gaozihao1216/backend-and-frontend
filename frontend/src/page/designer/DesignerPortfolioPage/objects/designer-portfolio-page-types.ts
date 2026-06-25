import type { LevelStatus } from "../../../../objects/system/level-status.js";
import type { DesignerPortfolioItem } from "../../shared/objects/designer-portfolio-mock.js";

export type DesignerPortfolioPageProps = {
  onBack: () => void;
  onOpenResubmit: (levelId: string) => void;
  onContinueDesign: (levelId: string) => void;
};

export type DesignerPortfolioViewModel = {
  activeStatus: LevelStatus;
  feedback: string;
  statusCounts: Record<LevelStatus, number>;
  visibleItems: DesignerPortfolioItem[];
  setActiveStatus: (status: LevelStatus) => void;
  handleVoidDraft: (item: DesignerPortfolioItem) => void;
};
