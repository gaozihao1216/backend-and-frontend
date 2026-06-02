import { z } from "zod";
import { ApiErrorSchema, createSuccessResponseSchema } from "./contracts.js";
import { API_BASE_URL } from "../config.js";

const JsonHeadersSchema = z.record(z.string(), z.string());
const REQUEST_TIMEOUT_MS = 10_000;

const parseApiResponse = async <T>(
  response: Response,
  dataSchema: z.ZodType<T>,
): Promise<T> => {
  const rawBody = await response.text();
  const contentType = response.headers.get("content-type") ?? "unknown";

  if (rawBody.trim().length === 0) {
    throw new Error(
      `Backend returned an empty response (${response.status} ${response.statusText}) for ${response.url || "the request"}.`,
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    throw new Error(
      `Backend returned a non-JSON response (${response.status} ${response.statusText}, content-type: ${contentType}).`,
    );
  }

  if (!response.ok) {
    const error = z.object({
      success: z.literal(false),
      error: ApiErrorSchema,
    }).safeParse(payload);
    if (error.success) {
      throw new Error(error.data.error.message);
    }
    throw new Error("Request failed");
  }

  const successSchema = createSuccessResponseSchema(dataSchema);
  const parsed = successSchema.parse(payload);
  return parsed.data as T;
};

export const request = async <T>(
  path: string,
  init: RequestInit,
  responseSchema: z.ZodType<T>,
): Promise<T> => {
  const headers = JsonHeadersSchema.parse({
    "content-type": "application/json",
    ...init.headers,
  });

  const requestUrl = `${API_BASE_URL}${path}`;
  let response: Response;
  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => {
    abortController.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    response = await fetch(requestUrl, {
      ...init,
      headers,
      signal: abortController.signal,
    });
  } catch (error) {
    window.clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s for ${path}. Check that the frontend can reach the backend and that the backend is responding.`,
      );
    }
    const target = API_BASE_URL || "the current frontend origin";
    const message = error instanceof Error ? error.message : "Unknown network error";
    throw new Error(
      `Cannot reach backend via ${target}. Start the backend on http://localhost:3000 and use the Vite dev server proxy, or set VITE_API_BASE_URL. Original error: ${message}`,
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  return parseApiResponse(response, responseSchema);
};
