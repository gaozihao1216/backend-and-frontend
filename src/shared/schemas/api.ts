import { z } from "zod";

// API 响应统一约定为 success/error 二选一，便于前后端做统一处理。
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const createSuccessResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
) =>
  // success 响应是高阶 schema：不同接口只替换 data 的具体结构。
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
