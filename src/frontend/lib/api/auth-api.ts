import {
  GetBackendUsersRequestQuerySchema,
  BindBackendUserRequestBodySchema,
  BindBackendUserResponseDataSchema,
  GetBackendUsersResponseDataSchema,
  type BindBackendUserRequestBody,
  type BoundBackendUser,
} from "./api-contracts.js";
import { request } from "./client.js";

export const getBackendUsers = async (): Promise<BoundBackendUser[]> => {
  GetBackendUsersRequestQuerySchema.parse({});

  return request(
    "/auth/backend-users",
    {
      method: "GET",
    },
    GetBackendUsersResponseDataSchema,
  );
};

export const bindBackendUser = async (
  input: BindBackendUserRequestBody,
): Promise<BoundBackendUser> =>
  request(
    "/auth/bind",
    {
      method: "POST",
      body: JSON.stringify(BindBackendUserRequestBodySchema.parse(input)),
    },
    BindBackendUserResponseDataSchema,
  );
