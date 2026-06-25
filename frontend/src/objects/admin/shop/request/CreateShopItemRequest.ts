import { z } from "zod";

export const CreateShopItemRequestBodySchema = z.object({
  name: z.string().min(2),
  description: z.string().min(4),
  price: z.number().int().min(1),
  currency: z.enum(["coins", "gems"]),
  catalogIndex: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type CreateShopItemRequestBody = z.infer<typeof CreateShopItemRequestBodySchema>;
