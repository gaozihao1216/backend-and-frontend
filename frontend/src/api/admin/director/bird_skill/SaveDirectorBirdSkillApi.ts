import {
  SaveDirectorBirdSkillRequestSchema,
  type SaveDirectorBirdSkillRequest,
} from "../../../../objects/admin/director/bird_skill/request/SaveDirectorBirdSkillRequest.js";
import { BirdSkillSetSchema, type BirdSkillSet } from "../../../../game/engine/skills/skill-spec.js";
import { request } from "../../../../system/api/legacyRequest.js";
import { z } from "zod";

const BirdSkillConfigResponseSchema = z.object({
  birdType: z.string(),
  skills: z.unknown(),
  modelImageUrl: z.string().nullable().optional(),
  updatedById: z.string().nullable().optional(),
  updatedAt: z.string(),
});

export class SaveDirectorBirdSkillApi {
  static pathFor(birdType: string) {
    return `/admin/director/bird-skills/${encodeURIComponent(birdType)}` as const;
  }

  async execute(userId: string, birdType: string, body: SaveDirectorBirdSkillRequest) {
    SaveDirectorBirdSkillRequestSchema.parse(body);
    return request(
      SaveDirectorBirdSkillApi.pathFor(birdType),
      {
        method: "PUT",
        headers: { "x-user-id": userId, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      BirdSkillConfigResponseSchema,
    );
  }
}

export const saveDirectorBirdSkillApi = new SaveDirectorBirdSkillApi();

export const saveDirectorBirdSkill = async (
  userId: string,
  birdType: string,
  body: SaveDirectorBirdSkillRequest,
) => saveDirectorBirdSkillApi.execute(userId, birdType, body);

export const validateBirdSkillSet = (skills: BirdSkillSet) => BirdSkillSetSchema.parse(skills);
