import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API player/api/internal/ui/RegisterCheckInPanelRewardsInternalApi.scala; not registered as a public frontend route. */
export class RegisterCheckInPanelRewardsInternalAPI extends APIMessage<unknown> {
  readonly panelId: unknown;
  readonly slots: unknown;
  constructor(panelId: unknown, slots: unknown) {
    super();
    this.panelId = panelId;
    this.slots = slots;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
