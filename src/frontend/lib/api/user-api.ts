import {
  GetUserProfileRequestParamsSchema,
  GetUserProfileRequestQuerySchema,
  GetUserProfileResponseDataSchema,
  type ApiUserProfile,
} from "./api-contracts.js";
import { request } from "./client.js";

export const getUserProfile = async (
  viewerUserId: string,
  profileUserId: string,
): Promise<ApiUserProfile> => {
  GetUserProfileRequestQuerySchema.parse({});
  const params = GetUserProfileRequestParamsSchema.parse({ userId: profileUserId });

  return request(
    `/users/${params.userId}/profile`,
    {
      method: "GET",
      headers: { "x-user-id": viewerUserId },
    },
    GetUserProfileResponseDataSchema,
  );
};
