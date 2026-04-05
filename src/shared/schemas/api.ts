import { z } from "zod";

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const createSuccessResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema,
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type SuccessResponse<T> = {
  success: true;
  data: T;
};
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
