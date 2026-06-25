import { BindBackendUserRequestBodySchema, BindBackendUserResponseDataSchema, type BindBackendUserRequestBody, type BoundBackendUser } from "../../objects/api/api-contracts.js";
import { APIMessage } from "../../system/api/APIMessage.js";
import { sendAPI } from "../../system/api/sendAPI.js";

export class BindBackendUserAPI extends APIMessage<BoundBackendUser> {
  readonly request: BindBackendUserRequestBody;

  constructor(input: BindBackendUserRequestBody) {
    super();
    this.request = BindBackendUserRequestBodySchema.parse(input);
  }

  override get responseSchema() {
    return BindBackendUserResponseDataSchema;
  }
}

export const bindBackendUser = async (input: BindBackendUserRequestBody): Promise<BoundBackendUser> =>
  sendAPI(new BindBackendUserAPI(input));
