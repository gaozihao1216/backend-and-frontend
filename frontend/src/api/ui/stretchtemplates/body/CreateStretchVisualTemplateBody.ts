import { z } from "zod";
import { StretchVisualTemplateSchema } from "../../../../objects/ui/stretch_template/stretch-visual-template.js";

export const CreateStretchVisualTemplateRequestBodySchema = z.object({
  template: StretchVisualTemplateSchema,
});

export type CreateStretchVisualTemplateRequestBody = z.infer<typeof CreateStretchVisualTemplateRequestBodySchema>;
