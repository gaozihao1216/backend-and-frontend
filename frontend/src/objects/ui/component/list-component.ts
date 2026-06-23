import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import { ComponentBindingSchema } from "./component-binding.js";
import { ComponentPositionSchema } from "./component-position.js";
import { ComponentStyleSchema } from "./component-style.js";

export const ListComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("list"),
  dataPath: z.string().min(1),
  itemTemplate: z.array(z.unknown()).default([]),
  emptyStateText: nullishToUndefined(z.string().min(1)),
  position: ComponentPositionSchema,
  style: nullishToUndefined(ComponentStyleSchema),
  binding: nullishToUndefined(ComponentBindingSchema),
});
export type ListComponent = z.infer<typeof ListComponentSchema>;
