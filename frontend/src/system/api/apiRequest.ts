import { z } from "zod";
import { API_BASE_URL } from "../app/config.js";
import { ApiErrorSchema, createSuccessResponseSchema } from "./contracts.js";

const REQUEST_TIMEOUT_MS = 10_000;

const JsonHeadersSchema = z.record(z.string(), z.string());

/**
 * 前端所有后端 API 请求的统一出口。
 *
 * 后端当前采用 `/api/{apiName}` 的 RPC 风格，因此这里不关心具体业务模块，
 * 只负责补齐 JSON header、用户身份头、超时控制，以及成功/失败响应的结构校验。
 */
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

  // 先按文本读取，再手动 JSON.parse，兼容空响应体并保留后端原始 HTTP 状态。
  const rawBody = await response.text();
  const payload = rawBody.trim().length > 0 ? JSON.parse(rawBody) as unknown : undefined;
  if (!response.ok) {
    // 后端业务错误会包装成 ApiFailure；非标准错误才退回 HTTP 状态文本。
    const parsed = z.object({ success: z.literal(false), error: ApiErrorSchema }).safeParse(payload);
    if (parsed.success) {
      throw new Error(parsed.data.error.message);
    }
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const parsed = createSuccessResponseSchema(responseSchema).parse(payload);
  return parsed.data as ApiResponse;
};
