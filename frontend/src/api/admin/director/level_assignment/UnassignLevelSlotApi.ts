import {
  LevelSlotAssignmentSchema,
  type LevelSlotAssignment,
} from "../../../../objects/admin/director/level_assignment/assignment/level-slot-assignment.js";
import { request } from "../../../client.js";

export class UnassignLevelSlotApi {
  static pathFor(levelSuffix: string) {
    return `/admin/director/level-assignments/${encodeURIComponent(levelSuffix)}` as const;
  }

  async execute(userId: string, levelSuffix: string): Promise<LevelSlotAssignment> {
    return request(
      UnassignLevelSlotApi.pathFor(levelSuffix),
      { method: "DELETE", headers: { "x-user-id": userId } },
      LevelSlotAssignmentSchema,
    );
  }
}

export const unassignLevelSlotApi = new UnassignLevelSlotApi();

export const unassignLevelSlot = async (userId: string, levelSuffix: string): Promise<LevelSlotAssignment> =>
  unassignLevelSlotApi.execute(userId, levelSuffix);
