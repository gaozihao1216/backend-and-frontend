import { apiNameOf } from "./apiNameOf.js";
import { apiRequest } from "./apiRequest.js";
import type { APIMessage } from "./APIMessage.js";

/**
 * 将前端 APIMessage 实例转换成后端请求体。
 *
 * `userId` 只用于 x-user-id 认证头，不应该重复放进 body；
 * undefined 字段也会被剔除，避免后端 Circe 解码时收到无意义字段。
 */
const toPayload = (message: APIMessage<unknown>): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(message)) {
    if (key === "userId" || value === undefined) {
      continue;
    }
    payload[key] = value;
  }
  return payload;
};

/**
 * 按后端统一约定调用 `/api/{apiName}`。
 *
 * apiName 由具体 APIMessage 类名推导，responseSchema 则负责在前端落地运行时校验。
 */
export const sendAPI = async <Response>(message: APIMessage<Response>): Promise<Response> =>
  apiRequest(
    `/api/${apiNameOf(message)}`,
    toPayload(message),
    message.responseSchema,
    message.needsUserId && "userId" in message ? String(message.userId) : undefined,
  );
