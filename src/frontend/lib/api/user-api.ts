import {
  GetUserProfileResponseDataSchema,
  type ApiUserProfile,
} from "../../../shared/types.js";
import { request } from "./client.js";

export const getUserProfile = async (
  viewerUserId: string,
  profileUserId: string,
): Promise<ApiUserProfile> =>
  request(
    `/users/${profileUserId}/profile`,
    {
      method: "GET",
      headers: { "x-user-id": viewerUserId },
    },
    GetUserProfileResponseDataSchema,
  );
