import { RegisterCheckInPanelRewardsBodySchema } from "../../../objects/ui/panelworkflows/request/RegisterCheckInPanelRewardsRequest.js";
import { PlayerCurrencyRewardSchema } from "../../../objects/ui-customization/ui-customization-objects.js";
import { request } from "../../../system/api/legacyRequest.js";
import { z } from "zod";

export { RegisterCheckInPanelRewardsBodySchema } from "../../../objects/ui/panelworkflows/request/RegisterCheckInPanelRewardsRequest.js";

export class RegisterCheckInPanelRewardsApi {
  static path(panelId: string) {
    return `/admin/director/ui/panel-workflows/${encodeURIComponent(panelId)}/check-in-rewards` as const;
  }

  async execute(
    userId: string,
    panelId: string,
    slots: z.infer<typeof PlayerCurrencyRewardSchema>[],
  ): Promise<{ panelId: string }> {
    return request(
      RegisterCheckInPanelRewardsApi.path(panelId),
      {
        method: "PUT",
        headers: { "x-user-id": userId },
        body: JSON.stringify(RegisterCheckInPanelRewardsBodySchema.parse({ slots })),
      },
      z.object({ panelId: z.string().min(1) }),
    );
  }
}

export const registerCheckInPanelRewardsApi = new RegisterCheckInPanelRewardsApi();

export const registerCheckInPanelRewards = async (
  userId: string,
  panelId: string,
  slots: z.infer<typeof PlayerCurrencyRewardSchema>[],
) => registerCheckInPanelRewardsApi.execute(userId, panelId, slots);
