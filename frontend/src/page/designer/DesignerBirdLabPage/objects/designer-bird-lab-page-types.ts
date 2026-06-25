import type { Dispatch, SetStateAction } from "react";
import type { BirdDesign, BirdDesignInput } from "../../../../objects/api/api-contracts.js";

export type DesignerBirdLabPageProps = {
  userId: string;
  onBack: () => void;
};

export type BirdDesignPortfolioTab = "draft" | "pending_review" | "published" | "rejected";

export const birdDesignTabLabels: Record<BirdDesignPortfolioTab, string> = {
  draft: "草稿",
  pending_review: "待审核",
  published: "已发布",
  rejected: "已驳回",
};

export const createEmptyBirdDesignForm = (): BirdDesignInput => ({
  name: "",
  summary: "",
  skillName: "",
  attack: 80,
  impact: 70,
  speed: 60,
  tierSkills: ["一阶技能描述", "二阶技能描述", "三阶技能描述"],
  mechanismTags: [],
});

export type DesignerBirdLabViewModel = {
  activeTab: BirdDesignPortfolioTab;
  designs: BirdDesign[];
  loading: boolean;
  busyId: string | null;
  error: string;
  notice: string;
  editingId: string | null;
  form: BirdDesignInput;
  tagInput: string;
  setActiveTab: (tab: BirdDesignPortfolioTab) => void;
  setForm: Dispatch<SetStateAction<BirdDesignInput>>;
  setTagInput: (value: string) => void;
  resetForm: () => void;
  handleSave: () => Promise<void>;
  handleEdit: (design: BirdDesign) => void;
  handleSubmit: (designId: string) => Promise<void>;
  handleDelete: (designId: string) => Promise<void>;
  updateTierSkill: (index: number, value: string) => void;
  applyTags: () => void;
};
