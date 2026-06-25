import { z } from "zod";
import { API_BASE_URL } from "../app/config.js";
import { ApiErrorSchema, createSuccessResponseSchema } from "./contracts.js";

const REQUEST_TIMEOUT_MS = 10_000;

const JsonHeadersSchema = z.record(z.string(), z.string());

export const apiRequest = async <ApiResponse>(
  path: string,
  body: unknown,
  responseSchema: z.ZodType<ApiResponse, z.ZodTypeDef, unknown>,
  userId?: string,
): Promise<ApiResponse> => {
  const headers = JsonHeadersSchema.parse({
    "content-type": "application/json",
    ...(userId ? { "x-user-id": userId } : {}),
  });
  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => {
    abortController.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: globalThis.Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: abortController.signal,
    });
  } catch (error) {
    window.clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s for ${path}.`);
    }
    const message = error instanceof Error ? error.message : "Unknown network error";
    throw new Error(`Cannot reach backend. Original error: ${message}`);
  } finally {
    window.clearTimeout(timeoutId);
  }

  const rawBody = await response.text();
  const payload = rawBody.trim().length > 0 ? JSON.parse(rawBody) as unknown : undefined;
  if (!response.ok) {
    const parsed = z.object({ success: z.literal(false), error: ApiErrorSchema }).safeParse(payload);
    if (parsed.success) {
      throw new Error(parsed.data.error.message);
    }
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const parsed = createSuccessResponseSchema(responseSchema).parse(payload);
  return parsed.data as ApiResponse;
};
