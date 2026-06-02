import type { Request } from "express";
import { ZodError, type ZodType } from "zod";
import type { ApiError, SuccessResponse } from "./http-contract.js";
import type { User } from "../data/store-contracts.js";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const parseOrThrow = <T>(schema: ZodType<T>, input: unknown): T => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid request data", formatZodError(result.error));
  }
  return result.data;
};

export const success = <T>(data: T): SuccessResponse<T> => ({
  success: true,
  data,
});

export const getCurrentUser = (req: Request): User => {
  if (!req.currentUser) {
    throw new HttpError(401, "UNAUTHORIZED", "Missing authenticated user");
  }
  return req.currentUser;
};

export const errorResponse = (
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) => {
  const error: ApiError =
    details === undefined ? { code, message } : { code, message, details };

  return {
    statusCode,
    body: {
      success: false,
      error,
    },
  };
};

const formatZodError = (error: ZodError) =>
  error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
