import { z } from "zod";
import { PageComponentSchema } from "../../../ui-customization/ui-customization-objects.js";

export const CreatePageComponentRequestBodySchema = z.object({
  component: PageComponentSchema,
});

export type CreatePageComponentRequestBody = z.infer<typeof CreatePageComponentRequestBodySchema>;
