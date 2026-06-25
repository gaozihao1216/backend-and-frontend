import { z } from "zod";
import { ButtonTemplateSchema } from "../../../ui-customization/ui-customization-objects.js";

export const CreateButtonTemplateRequestBodySchema = z.object({
  template: ButtonTemplateSchema,
});

export type CreateButtonTemplateRequestBody = z.infer<typeof CreateButtonTemplateRequestBodySchema>;
