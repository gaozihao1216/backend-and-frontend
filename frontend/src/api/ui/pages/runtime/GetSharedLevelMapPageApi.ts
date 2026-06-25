import { GetUiPageResponseDataSchema, type UiPageConfig } from "../../../../objects/api/api-contracts.js";
import { request } from "../../../../system/api/legacyRequest.js";

export const GetSharedLevelMapPageApiPath = "/player/ui/level-map" as const;

export class GetSharedLevelMapPageApi {
  static readonly path = GetSharedLevelMapPageApiPath;

  async execute(userId: string): Promise<UiPageConfig> {
    return request(
      GetSharedLevelMapPageApi.path,
      { method: "GET", headers: { "x-user-id": userId } },
      GetUiPageResponseDataSchema,
    );
  }
}

export const getSharedLevelMapPageApi = new GetSharedLevelMapPageApi();

export const getSharedLevelMapPage = async (userId: string): Promise<UiPageConfig> =>
  getSharedLevelMapPageApi.execute(userId);
