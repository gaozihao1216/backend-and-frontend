import { z } from "zod";
import { request } from "./client.js";

const BirdUpgradeSchema = z.object({
  birdType: z.string(),
  name: z.string(),
  level: z.number(),
  maxLevel: z.number(),
  nextCostCoins: z.number(),
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
});

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

export const upgradePlayerSlingshot = async (userId: string): Promise<PlayerPreparationState> =>
  request(
    "/player/preparation/slingshot/upgrade",
    { method: "POST", headers: { "x-user-id": userId } },
    PreparationStateSchema,
  );
