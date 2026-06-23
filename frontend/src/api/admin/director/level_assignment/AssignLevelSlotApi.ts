import {
  AssignLevelSlotRequestBodySchema,
  type AssignLevelSlotRequestBody,
} from "./body/AssignLevelSlotBody.js";
import {
  LevelSlotAssignmentDetailSchema,
  type LevelSlotAssignmentDetail,
} from "../../../../objects/admin/director/level_assignment/assignment/level-slot-assignment.js";
import { request } from "../../../client.js";

export class AssignLevelSlotApi {
  static pathFor(levelSuffix: string) {
    return `/admin/director/level-assignments/${encodeURIComponent(levelSuffix)}` as const;
  }

  async execute(
    userId: string,
    levelSuffix: string,
    body: AssignLevelSlotRequestBody,
  ): Promise<LevelSlotAssignmentDetail> {
    AssignLevelSlotRequestBodySchema.parse(body);
    return request(
      AssignLevelSlotApi.pathFor(levelSuffix),
      {
        method: "POST",
        headers: { "x-user-id": userId, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      LevelSlotAssignmentDetailSchema,
    );
  }
}

export const assignLevelSlotApi = new AssignLevelSlotApi();

export const assignLevelSlot = async (
  userId: string,
  levelSuffix: string,
  body: AssignLevelSlotRequestBody,
): Promise<LevelSlotAssignmentDetail> => assignLevelSlotApi.execute(userId, levelSuffix, body);
