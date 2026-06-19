import {
  UpdateBirdDesignRequestBodySchema,
  UpdateBirdDesignResponseDataSchema,
  type BirdDesign,
  type UpdateBirdDesignRequestBody,
} from "../../api-contracts.js";
import { request } from "../../client.js";

export class UpdateBirdDesignApi {
  static path(designId: string) {
    return `/designer/bird-designs/${encodeURIComponent(designId)}` as const;
  }

  async execute(userId: string, designId: string, input: UpdateBirdDesignRequestBody): Promise<BirdDesign> {
    const body = UpdateBirdDesignRequestBodySchema.parse(input);
    return request(
      UpdateBirdDesignApi.path(designId),
      {
        method: "PUT",
        headers: { "x-user-id": userId },
        body: JSON.stringify(body),
      },
      UpdateBirdDesignResponseDataSchema,
    );
  }
}

export const updateBirdDesignApi = new UpdateBirdDesignApi();
export const updateBirdDesign = async (userId: string, designId: string, input: UpdateBirdDesignRequestBody) =>
  updateBirdDesignApi.execute(userId, designId, input);
