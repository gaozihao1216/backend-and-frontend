import { GetUserProfileRequestParamsSchema, GetUserProfileRequestQuerySchema, GetUserProfileResponseDataSchema, type ApiUserProfile } from "../api-contracts.js";
import { request } from "../client.js";

export const getUserProfileApiPath = (userId: string) => `/users/${userId}/profile` as const;

export class GetUserProfileApi {
  path(userId: string): string {
    return getUserProfileApiPath(userId);
  }

  async execute(viewerUserId: string, profileUserId: string): Promise<ApiUserProfile> {
    GetUserProfileRequestQuerySchema.parse({});
    const params = GetUserProfileRequestParamsSchema.parse({ userId: profileUserId });
    return request(this.path(params.userId), { method: "GET", headers: { "x-user-id": viewerUserId } }, GetUserProfileResponseDataSchema);
  }
}

export const getUserProfileApi = new GetUserProfileApi();

export const getUserProfile = async (viewerUserId: string, profileUserId: string): Promise<ApiUserProfile> =>
  getUserProfileApi.execute(viewerUserId, profileUserId);
