import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import {
  DynamicTextProgramSchema,
  TextContentModeSchema,
} from "../../ui-customization/dynamic-text-program.js";
import { ComponentBindingSchema } from "./component-binding.js";
import { ComponentPositionSchema } from "./component-position.js";
import { ComponentStyleSchema, TextArtDesignSchema } from "./component-style.js";

export const TextComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("text"),
  text: z.string(),
  textContentMode: nullishToUndefined(TextContentModeSchema),
  dynamicTextProgram: nullishToUndefined(DynamicTextProgramSchema),
  position: ComponentPositionSchema,
  style: nullishToUndefined(ComponentStyleSchema),
  artTextDesign: nullishToUndefined(TextArtDesignSchema),
  binding: nullishToUndefined(ComponentBindingSchema),
});
export type TextComponent = z.infer<typeof TextComponentSchema>;
