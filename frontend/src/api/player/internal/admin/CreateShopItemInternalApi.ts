import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API player/api/internal/admin/CreateShopItemInternalApi.scala; not registered as a public frontend route. */
export class CreateShopItemInternalAPI extends APIMessage<unknown> {
  readonly name: unknown;
  readonly description: unknown;
  readonly price: unknown;
  readonly currency: unknown;
  readonly catalogIndex: unknown;
  readonly active: unknown;
  readonly sortOrder: unknown;
  constructor(name: unknown, description: unknown, price: unknown, currency: unknown, catalogIndex: unknown, active: unknown, sortOrder: unknown) {
    super();
    this.name = name;
    this.description = description;
    this.price = price;
    this.currency = currency;
    this.catalogIndex = catalogIndex;
    this.active = active;
    this.sortOrder = sortOrder;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
