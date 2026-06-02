import { GetBackendUsersRequestQuerySchema, GetBackendUsersResponseDataSchema, type BoundBackendUser } from "../api-contracts.js";
import { request } from "../client.js";

export const GetBackendUsersApiPath = "/auth/backend-users" as const;

export const getBackendUsers = async (): Promise<BoundBackendUser[]> => {
  GetBackendUsersRequestQuerySchema.parse({});
  return request(GetBackendUsersApiPath, { method: "GET" }, GetBackendUsersResponseDataSchema);
};
