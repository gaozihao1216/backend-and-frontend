import { GetBackendUsersRequestQuerySchema, GetBackendUsersResponseDataSchema, type BoundBackendUser } from "../api-contracts.js";
import { request } from "../client.js";

export const getBackendUsers = async (): Promise<BoundBackendUser[]> => {
  GetBackendUsersRequestQuerySchema.parse({});
  return request("/auth/backend-users", { method: "GET" }, GetBackendUsersResponseDataSchema);
};
