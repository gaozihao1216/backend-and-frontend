import { BindBackendUserRequestBodySchema, BindBackendUserResponseDataSchema, type BindBackendUserRequestBody, type BoundBackendUser } from "../api-contracts.js";
import { request } from "../client.js";

export const BindBackendUserApiPath = "/auth/bind" as const;

export const bindBackendUser = async (input: BindBackendUserRequestBody): Promise<BoundBackendUser> =>
  request(BindBackendUserApiPath, { method: "POST", body: JSON.stringify(BindBackendUserRequestBodySchema.parse(input)) }, BindBackendUserResponseDataSchema);
