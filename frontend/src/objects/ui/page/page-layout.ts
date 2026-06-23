import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";

export const PageLayoutTypeSchema = z.enum(["stack", "grid", "freeform"]);
export type PageLayoutType = z.infer<typeof PageLayoutTypeSchema>;

export const PageLayoutSchema = z.object({
  type: PageLayoutTypeSchema,
  columns: nullishToUndefined(z.number().int().positive()),
  gap: nullishToUndefined(z.number().min(0)),
  padding: nullishToUndefined(z.number().min(0)),
});
export type PageLayout = z.infer<typeof PageLayoutSchema>;
