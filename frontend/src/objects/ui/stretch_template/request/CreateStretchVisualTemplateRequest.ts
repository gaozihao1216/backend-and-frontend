import { z } from "zod";
import { StretchVisualTemplateSchema } from "../stretch-visual-template.js";

export const CreateStretchVisualTemplateRequestBodySchema = z.object({
  template: StretchVisualTemplateSchema,
});

export type CreateStretchVisualTemplateRequestBody = z.infer<typeof CreateStretchVisualTemplateRequestBodySchema>;
