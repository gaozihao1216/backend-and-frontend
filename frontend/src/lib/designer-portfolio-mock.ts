import type { LevelStatus } from "../objects/system/level-status.js";

export type DesignerPortfolioItem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: LevelStatus;
  updatedAt: string;
  publishedAt?: string;
  averageRating?: number;
  ratingCount?: number;
  rejectionReason?: string;
  reviewNote?: string;
};

export const DESIGNER_PORTFOLIO_STATUS_LABELS: Record<LevelStatus, string> = {
  draft: "草稿",
  pending_review: "待审核",
  published: "已发布",
  rejected: "已驳回",
};

export const DESIGNER_PORTFOLIO_TABS: LevelStatus[] = [
  "draft",
  "pending_review",
  "published",
  "rejected",
];

/** 静态演示数据，后续可替换为设计师关卡列表 API。 */
export const DESIGNER_PORTFOLIO_MOCK_ITEMS: DesignerPortfolioItem[] = [
  {
    id: "portfolio-draft-1",
    title: "弹射练习场 v2",
    description: "调整弹弓角度与障碍物密度，适合新手熟悉物理手感。",
    tags: ["练习", "物理"],
    status: "draft",
    updatedAt: "2026-06-04T10:20:00Z",
  },
  {
    id: "portfolio-draft-2",
    title: "冬季冰面试玩",
    description: "低摩擦地面与冰砖结构，仍在打磨敌人布局。",
    tags: ["季节", "冰面"],
    status: "draft",
    updatedAt: "2026-06-05T08:15:00Z",
  },
  {
    id: "level-2",
    title: "Pending Glass Tower",
    description: "Pending review sample for admin demo.",
    tags: ["hard"],
    status: "pending_review",
    updatedAt: "2026-06-03T00:00:00Z",
  },
  {
    id: "portfolio-pending-1",
    title: "玻璃高塔挑战",
    description: "多层易碎结构，已提交等待管理员审核。",
    tags: ["玻璃", "高难度"],
    status: "pending_review",
    updatedAt: "2026-06-05T14:40:00Z",
  },
  {
    id: "level-1",
    title: "Starter Siege",
    description: "Published sample level for profile and rating demos.",
    tags: ["beginner", "puzzle"],
    status: "published",
    updatedAt: "2026-06-03T00:00:00Z",
    publishedAt: "2026-06-03T00:00:00Z",
    averageRating: 4,
    ratingCount: 1,
  },
  {
    id: "portfolio-published-1",
    title: "森林回旋关卡",
    description: "利用地形反弹完成三星通关的经典布局。",
    tags: ["森林", "三星"],
    status: "published",
    updatedAt: "2026-05-28T16:00:00Z",
    publishedAt: "2026-05-29T09:30:00Z",
    averageRating: 4.6,
    ratingCount: 12,
  },
  {
    id: "portfolio-rejected-1",
    title: "岩石高塔改版",
    description: "高密度岩石堆叠，敌人位置需要重新平衡。",
    tags: ["岩石", "塔防"],
    status: "rejected",
    updatedAt: "2026-06-02T11:05:00Z",
    rejectionReason: "敌人数量超出推荐上限，且起始弹弓角度与障碍物重叠。",
    reviewNote: "请减少右侧岩石层数，并确保弹弓发射区无碰撞体。",
  },
  {
    id: "portfolio-rejected-2",
    title: "极速连击试炼",
    description: "限时连击玩法原型，关卡边界与得分规则待完善。",
    tags: ["限时", "连击"],
    status: "rejected",
    updatedAt: "2026-06-01T19:22:00Z",
    rejectionReason: "缺少明确胜利条件说明，部分障碍物超出画布边界。",
    reviewNote: "补充关卡目标描述，并修正越界障碍物坐标。",
  },
];

export const getDesignerPortfolioItemById = (levelId: string) =>
  DESIGNER_PORTFOLIO_MOCK_ITEMS.find((item) => item.id === levelId);

export const listDesignerPortfolioItemsByStatus = (status: LevelStatus) =>
  DESIGNER_PORTFOLIO_MOCK_ITEMS.filter((item) => item.status === status);

export const formatDesignerPortfolioDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
