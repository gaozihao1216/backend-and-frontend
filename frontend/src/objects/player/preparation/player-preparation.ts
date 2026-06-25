import { z } from "zod";

export const BirdStatsSchema = z.object({
  attack: z.number(),
  impact: z.number(),
  speed: z.number(),
});

export const BirdUpgradeSchema = z.object({
  birdType: z.string(),
  name: z.string(),
  summary: z.string(),
  previewImageUrl: z.string(),
  level: z.number(),
  maxLevel: z.number(),
  tier: z.number(),
  maxTier: z.number(),
  stats: BirdStatsSchema,
  skillName: z.string(),
  skillDescription: z.string(),
  nextTierSkillPreview: z.string().nullable(),
  nextCostCoins: z.number(),
  nextCostFragments: z.number(),
  source: z.enum(["system", "designer"]),
  authorId: z.string().nullable(),
  skills: z.unknown().nullable().optional(),
  modelImageUrl: z.string().nullable().optional(),
});

export const SlingshotUpgradeSchema = z.object({
  level: z.number(),
  maxLevel: z.number(),
  nextCostCoins: z.number(),
});

export const PreparationStateSchema = z.object({
  birds: z.array(BirdUpgradeSchema),
  slingshot: SlingshotUpgradeSchema,
  walletCoins: z.number(),
  walletFragments: z.number(),
});

export type BirdStats = z.infer<typeof BirdStatsSchema>;
export type BirdUpgradeState = z.infer<typeof BirdUpgradeSchema>;
export type SlingshotUpgradeState = z.infer<typeof SlingshotUpgradeSchema>;
export type PlayerPreparationState = z.infer<typeof PreparationStateSchema>;
