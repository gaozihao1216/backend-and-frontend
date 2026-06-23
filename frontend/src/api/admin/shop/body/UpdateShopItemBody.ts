import { CreateShopItemRequestBodySchema } from "./CreateShopItemBody.js";
import { z } from "zod";

export const UpdateShopItemRequestBodySchema = CreateShopItemRequestBodySchema.extend({
  catalogIndex: z.number().int().min(0),
  active: z.boolean(),
  sortOrder: z.number().int(),
});

export type UpdateShopItemRequestBody = z.infer<typeof UpdateShopItemRequestBodySchema>;
