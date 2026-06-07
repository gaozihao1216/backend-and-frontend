import { z } from "zod";

export const StretchVisualTemplateKindSchema = z.enum(["panel", "pattern"]);
export type StretchVisualTemplateKind = z.infer<typeof StretchVisualTemplateKindSchema>;

/** 面板/图案模板：统一采用整体拉伸（可压缩），不使用九宫格切片。 */
export const StretchVisualTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sourceDataUrl: z.string().min(1),
  kind: StretchVisualTemplateKindSchema,
});
export type StretchVisualTemplate = z.infer<typeof StretchVisualTemplateSchema>;
