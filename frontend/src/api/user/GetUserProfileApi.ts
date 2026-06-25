import { GetUserProfileRequestParamsSchema, GetUserProfileRequestQuerySchema, GetUserProfileResponseDataSchema, type ApiUserProfile } from "../../objects/api/api-contracts.js";
import { APIWithTokenMessage } from "../../system/api/APIWithTokenMessage.js";
import { sendAPI } from "../../system/api/sendAPI.js";

export class GetUserProfileAPI extends APIWithTokenMessage<ApiUserProfile> {
  readonly profileUserId: string;

  constructor(viewerUserId: string, profileUserId: string) {
    super(viewerUserId);
    GetUserProfileRequestQuerySchema.parse({});
    const params = GetUserProfileRequestParamsSchema.parse({ userId: profileUserId });
    this.profileUserId = params.userId;
  }

  override get responseSchema() {
    return GetUserProfileResponseDataSchema;
  }
}

export const getUserProfile = async (viewerUserId: string, profileUserId: string): Promise<ApiUserProfile> =>
  sendAPI(new GetUserProfileAPI(viewerUserId, profileUserId));
