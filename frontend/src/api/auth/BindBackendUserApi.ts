import { BindBackendUserRequestBodySchema, BindBackendUserResponseDataSchema, type BindBackendUserRequestBody, type BoundBackendUser } from "../api-contracts.js";
import { request } from "../client.js";

export const BindBackendUserApiPath = "/auth/bind" as const;

export class BindBackendUserApi {
  static readonly path = BindBackendUserApiPath;

  async execute(input: BindBackendUserRequestBody): Promise<BoundBackendUser> {
    return request(
      BindBackendUserApi.path,
      { method: "POST", body: JSON.stringify(BindBackendUserRequestBodySchema.parse(input)) },
      BindBackendUserResponseDataSchema,
    );
  }
}

export const bindBackendUserApi = new BindBackendUserApi();

export const bindBackendUser = async (input: BindBackendUserRequestBody): Promise<BoundBackendUser> =>
  bindBackendUserApi.execute(input);
