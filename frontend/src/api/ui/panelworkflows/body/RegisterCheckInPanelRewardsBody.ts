import { z } from "zod";
import { PlayerCurrencyRewardSchema } from "../../../../objects/ui-customization/ui-customization-objects.js";

export const RegisterCheckInPanelRewardsBodySchema = z.object({
  slots: z.array(PlayerCurrencyRewardSchema).length(7),
});

export type RegisterCheckInPanelRewardsBody = z.infer<typeof RegisterCheckInPanelRewardsBodySchema>;
