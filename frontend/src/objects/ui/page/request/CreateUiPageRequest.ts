import { z } from "zod";
import { PageConfigSchema } from "../../../ui-customization/ui-customization-objects.js";

export const CreateUiPageRequestBodySchema = z.object({
  page: PageConfigSchema,
});

export type CreateUiPageRequestBody = z.infer<typeof CreateUiPageRequestBodySchema>;
