import { apiNameOf } from "./apiNameOf.js";
import { apiRequest } from "./apiRequest.js";
import type { APIMessage } from "./APIMessage.js";

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

export const sendAPI = async <Response>(message: APIMessage<Response>): Promise<Response> =>
  apiRequest(
    `/api/${apiNameOf(message)}`,
    toPayload(message),
    message.responseSchema,
    message.needsUserId && "userId" in message ? String(message.userId) : undefined,
  );
