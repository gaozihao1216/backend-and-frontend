import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import { ComponentBindingSchema } from "./component-binding.js";
import { ComponentPositionSchema } from "./component-position.js";
import { ComponentStyleSchema } from "./component-style.js";

export const WidgetIdSchema = z.enum(["adminProposalReview", "levelMapStage"]);
export type WidgetId = z.infer<typeof WidgetIdSchema>;

export const WidgetComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("widget"),
  widgetId: WidgetIdSchema,
  position: ComponentPositionSchema,
  style: nullishToUndefined(ComponentStyleSchema),
  binding: nullishToUndefined(ComponentBindingSchema),
});
export type WidgetComponent = z.infer<typeof WidgetComponentSchema>;
