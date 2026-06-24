import { GetBackendUsersRequestQuerySchema, GetBackendUsersResponseDataSchema, type BoundBackendUser } from "../api-contracts.js";
import { request } from "../client.js";

export const GetBackendUsersApiPath = "/api/getbackendusersapi" as const;

export class GetBackendUsersApi {
  static readonly path = GetBackendUsersApiPath;

  async execute(): Promise<BoundBackendUser[]> {
    GetBackendUsersRequestQuerySchema.parse({});
    return request(GetBackendUsersApi.path, { method: "GET" }, GetBackendUsersResponseDataSchema);
  }
}

export const getBackendUsersApi = new GetBackendUsersApi();

export const getBackendUsers = async (): Promise<BoundBackendUser[]> =>
  getBackendUsersApi.execute();
