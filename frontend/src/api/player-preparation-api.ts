import { z } from "zod";
import { request } from "./client.js";

const BirdStatsSchema = z.object({
  attack: z.number(),
  impact: z.number(),
  speed: z.number(),
});

const BirdUpgradeSchema = z.object({
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
});

const SlingshotUpgradeSchema = z.object({
  level: z.number(),
  maxLevel: z.number(),
  nextCostCoins: z.number(),
});

const PreparationStateSchema = z.object({
  birds: z.array(BirdUpgradeSchema),
  slingshot: SlingshotUpgradeSchema,
  walletCoins: z.number(),
  walletFragments: z.number(),
});

export type BirdStats = z.infer<typeof BirdStatsSchema>;
export type BirdUpgradeState = z.infer<typeof BirdUpgradeSchema>;
export type SlingshotUpgradeState = z.infer<typeof SlingshotUpgradeSchema>;
export type PlayerPreparationState = z.infer<typeof PreparationStateSchema>;

export const getPlayerPreparation = async (userId: string): Promise<PlayerPreparationState> =>
  request(
    "/player/preparation",
    { method: "GET", headers: { "x-user-id": userId } },
    PreparationStateSchema,
  );

export const upgradePlayerBird = async (userId: string, birdType: string): Promise<PlayerPreparationState> =>
  request(
    `/player/preparation/birds/${encodeURIComponent(birdType)}/upgrade`,
    { method: "POST", headers: { "x-user-id": userId } },
    PreparationStateSchema,
  );

export const ascendPlayerBird = async (userId: string, birdType: string): Promise<PlayerPreparationState> =>
  request(
    `/player/preparation/birds/${encodeURIComponent(birdType)}/ascend`,
    { method: "POST", headers: { "x-user-id": userId } },
    PreparationStateSchema,
  );

export const upgradePlayerSlingshot = async (userId: string): Promise<PlayerPreparationState> =>
  request(
    "/player/preparation/slingshot/upgrade",
    { method: "POST", headers: { "x-user-id": userId } },
    PreparationStateSchema,
  );
