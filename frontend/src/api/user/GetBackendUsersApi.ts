import { GetBackendUsersRequestQuerySchema, GetBackendUsersResponseDataSchema, type BoundBackendUser } from "../../objects/api/api-contracts.js";
import { APIMessage } from "../../system/api/APIMessage.js";
import { sendAPI } from "../../system/api/sendAPI.js";

export class GetBackendUsersAPI extends APIMessage<BoundBackendUser[]> {
  constructor() {
    super();
    GetBackendUsersRequestQuerySchema.parse({});
  }

  override get responseSchema() {
    return GetBackendUsersResponseDataSchema;
  }
}

export const getBackendUsers = async (): Promise<BoundBackendUser[]> =>
  sendAPI(new GetBackendUsersAPI());
