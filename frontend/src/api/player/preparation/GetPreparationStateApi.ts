import { request } from "../../client.js";
import { PreparationStateSchema, type PlayerPreparationState } from "./PlayerPreparationSchemas.js";

export const GetPreparationStateApiPath = "/player/preparation" as const;

export class GetPreparationStateApi {
  static readonly path = GetPreparationStateApiPath;

  async execute(userId: string): Promise<PlayerPreparationState> {
    return request(
      GetPreparationStateApi.path,
      { method: "GET", headers: { "x-user-id": userId } },
      PreparationStateSchema,
    );
  }
}

export const getPreparationStateApi = new GetPreparationStateApi();
export const getPlayerPreparation = (userId: string) => getPreparationStateApi.execute(userId);
