import { SubmitLevelRequestBodySchema, SubmitLevelResponseDataSchema, type DesignerSubmission } from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";

export const SubmitLevelApiPath = "/designer/submissions" as const;

export class SubmitLevelApi {
  static readonly path = SubmitLevelApiPath;

  async execute(userId: string, levelId: string): Promise<DesignerSubmission> {
    return request(
      SubmitLevelApi.path,
      { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify(SubmitLevelRequestBodySchema.parse({ levelId })) },
      SubmitLevelResponseDataSchema,
    );
  }
}

export const submitLevelApi = new SubmitLevelApi();

export const submitLevel = async (userId: string, levelId: string): Promise<DesignerSubmission> =>
  submitLevelApi.execute(userId, levelId);
