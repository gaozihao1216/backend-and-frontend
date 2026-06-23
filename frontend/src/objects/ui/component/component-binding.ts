import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";

export const UiDataSourceSchema = z.object({
  type: z.enum(["none", "api"]),
  apiKey: nullishToUndefined(z.string().min(1)),
  params: nullishToUndefined(z.record(z.string(), z.string())),
  refreshMode: nullishToUndefined(z.enum(["manual", "onOpen", "interval"])),
});
export type UiDataSource = z.infer<typeof UiDataSourceSchema>;

export const ComponentBindingSchema = z.object({
  text: nullishToUndefined(z.string().min(1)),
  visibleWhen: nullishToUndefined(z.string().min(1)),
  disabledWhen: nullishToUndefined(z.string().min(1)),
});
export type ComponentBinding = z.infer<typeof ComponentBindingSchema>;

export const PlayerCurrencyRewardSchema = z.object({
  coins: z.number().int().min(0).default(0),
  gems: z.number().int().min(0).default(0),
  fragments: z.number().int().min(0).default(0),
});
export type PlayerCurrencyReward = z.infer<typeof PlayerCurrencyRewardSchema>;
