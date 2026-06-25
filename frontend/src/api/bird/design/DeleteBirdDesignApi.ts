import {
  DeleteBirdDesignResponseDataSchema,
  type BirdDesign,
} from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";

export class DeleteBirdDesignApi {
  static path(designId: string) {
    return `/designer/bird-designs/${encodeURIComponent(designId)}` as const;
  }

  async execute(userId: string, designId: string): Promise<BirdDesign> {
    return request(
      DeleteBirdDesignApi.path(designId),
      { method: "DELETE", headers: { "x-user-id": userId } },
      DeleteBirdDesignResponseDataSchema,
    );
  }
}

export const deleteBirdDesignApi = new DeleteBirdDesignApi();
export const deleteBirdDesign = async (userId: string, designId: string) =>
  deleteBirdDesignApi.execute(userId, designId);
