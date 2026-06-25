import type { APIMessage } from "./APIMessage.js";

export const apiNameOf = (message: APIMessage<unknown>): string =>
  message.constructor.name.toLowerCase();
