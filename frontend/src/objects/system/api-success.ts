import { z } from "zod";

export const createApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export type ApiSuccess<T> = {
  success: true;
  data: T;
};
