import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API player/api/internal/admin/DeactivateShopItemInternalApi.scala; not registered as a public frontend route. */
export class DeactivateShopItemInternalAPI extends APIMessage<unknown> {
  readonly itemId: unknown;
  constructor(itemId: unknown) {
    super();
    this.itemId = itemId;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
