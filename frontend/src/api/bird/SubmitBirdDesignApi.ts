import { SubmitBirdDesignResponseDataSchema, type BirdSubmission } from "../api-contracts.js";
import { request } from "../client.js";

export class SubmitBirdDesignApi {
  static path(designId: string) {
    return `/designer/bird-designs/${encodeURIComponent(designId)}/submit` as const;
  }

  async execute(userId: string, designId: string): Promise<BirdSubmission> {
    return request(
      SubmitBirdDesignApi.path(designId),
      { method: "POST", headers: { "x-user-id": userId } },
      SubmitBirdDesignResponseDataSchema,
    );
  }
}

export const submitBirdDesignApi = new SubmitBirdDesignApi();
export const submitBirdDesign = async (userId: string, designId: string) =>
  submitBirdDesignApi.execute(userId, designId);
