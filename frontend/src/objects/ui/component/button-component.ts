import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import { ComponentActionSchema } from "./component-action.js";
import { ComponentBindingSchema, PlayerCurrencyRewardSchema, UiDataSourceSchema } from "./component-binding.js";
import { ComponentPositionSchema } from "./component-position.js";
import { ComponentStyleSchema, ComponentVisualEffectSchema } from "./component-style.js";
import {
  ButtonBaseDesignSchema,
  ButtonImageDesignSchema,
  ButtonStateDesignSchema,
} from "./button-design.js";

export const ButtonComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("button"),
  label: z.string().min(1),
  icon: nullishToUndefined(z.string().min(1)),
  position: ComponentPositionSchema,
  style: nullishToUndefined(ComponentStyleSchema),
  baseDesign: nullishToUndefined(ButtonBaseDesignSchema),
  imageDesign: nullishToUndefined(ButtonImageDesignSchema),
  stateDesign: nullishToUndefined(ButtonStateDesignSchema),
  effect: nullishToUndefined(ComponentVisualEffectSchema),
  rewardGrant: nullishToUndefined(PlayerCurrencyRewardSchema),
  dataSource: nullishToUndefined(UiDataSourceSchema),
  binding: nullishToUndefined(ComponentBindingSchema),
  action: ComponentActionSchema,
});
export type ButtonComponent = z.infer<typeof ButtonComponentSchema>;
