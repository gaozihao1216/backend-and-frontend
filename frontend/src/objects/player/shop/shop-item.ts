import { z } from "zod";

export const ShopItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().int().min(1),
  currency: z.enum(["coins", "gems"]),
  catalogIndex: z.number().int().min(0),
  active: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ShopItem = z.infer<typeof ShopItemSchema>;
