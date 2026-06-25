import {
  UpdateLevelSlotBirdPoolRequestBodySchema,
  type UpdateLevelSlotBirdPoolRequestBody,
} from "./body/UpdateLevelSlotBirdPoolBody.js";
import {
  LevelSlotAssignmentDetailSchema,
  type LevelSlotAssignmentDetail,
} from "../../../../objects/admin/director/level_assignment/assignment/level-slot-assignment.js";
import { request } from "../../../../system/api/legacyRequest.js";

export class UpdateLevelSlotBirdPoolApi {
  static pathFor(levelSuffix: string) {
    return `/admin/director/level-assignments/${encodeURIComponent(levelSuffix)}/bird-pool` as const;
  }

  async execute(
    userId: string,
    levelSuffix: string,
    body: UpdateLevelSlotBirdPoolRequestBody,
  ): Promise<LevelSlotAssignmentDetail> {
    UpdateLevelSlotBirdPoolRequestBodySchema.parse(body);
    return request(
      UpdateLevelSlotBirdPoolApi.pathFor(levelSuffix),
      {
        method: "PUT",
        headers: { "x-user-id": userId, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      LevelSlotAssignmentDetailSchema,
    );
  }
}

export const updateLevelSlotBirdPoolApi = new UpdateLevelSlotBirdPoolApi();

export const updateLevelSlotBirdPool = async (
  userId: string,
  levelSuffix: string,
  body: UpdateLevelSlotBirdPoolRequestBody,
): Promise<LevelSlotAssignmentDetail> => updateLevelSlotBirdPoolApi.execute(userId, levelSuffix, body);
