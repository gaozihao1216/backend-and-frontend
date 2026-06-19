import {
  DirectorBirdSkillBoardSchema,
  SaveDirectorBirdSkillRequestSchema,
  type DirectorBirdSkillBoard,
  type SaveDirectorBirdSkillRequest,
} from "../../../../objects/bird/bird-skill-config.js";
import { BirdSkillSetSchema, type BirdSkillSet } from "../../../../lib/game-engine/skills/skill-spec.js";
import { request } from "../../../client.js";
import { z } from "zod";

const BirdSkillConfigResponseSchema = z.object({
  birdType: z.string(),
  skills: z.unknown(),
  modelImageUrl: z.string().nullable().optional(),
  updatedById: z.string().nullable().optional(),
  updatedAt: z.string(),
});

export const getDirectorBirdSkillBoard = async (userId: string): Promise<DirectorBirdSkillBoard> =>
  request(
    "/admin/director/bird-skills/board",
    { method: "GET", headers: { "x-user-id": userId } },
    DirectorBirdSkillBoardSchema,
  );

export const getDirectorBirdSkill = async (userId: string, birdType: string) =>
  request(
    `/admin/director/bird-skills/${encodeURIComponent(birdType)}`,
    { method: "GET", headers: { "x-user-id": userId } },
    DirectorBirdSkillBoardSchema.shape.birds.element,
  );

export const saveDirectorBirdSkill = async (
  userId: string,
  birdType: string,
  body: SaveDirectorBirdSkillRequest,
) => {
  SaveDirectorBirdSkillRequestSchema.parse(body);
  return request(
    `/admin/director/bird-skills/${encodeURIComponent(birdType)}`,
    {
      method: "PUT",
      headers: { "x-user-id": userId, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    BirdSkillConfigResponseSchema,
  );
};

export const validateBirdSkillSet = (skills: BirdSkillSet) => BirdSkillSetSchema.parse(skills);
