import { BindBackendUserRequestBodySchema, BindBackendUserResponseDataSchema, type BindBackendUserRequestBody, type BoundBackendUser } from "../api-contracts.js";
import { request } from "../client.js";

export const bindBackendUser = async (input: BindBackendUserRequestBody): Promise<BoundBackendUser> =>
  request("/auth/bind", { method: "POST", body: JSON.stringify(BindBackendUserRequestBodySchema.parse(input)) }, BindBackendUserResponseDataSchema);
