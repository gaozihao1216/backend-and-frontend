import { z } from "zod";
import { LevelTagSchema } from "../../system/system-objects.js";
import { LevelDataSchema } from "./level-data.js";

/** 设计师创建关卡时的输入形状，对应后端 `CreateLevelBody` / `POST /designer/levels`。 */
export const CreateLevelInputSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).default(""),
  tags: z.array(LevelTagSchema).max(5).default([]),
  data: LevelDataSchema,
});

export type CreateLevelInput = z.infer<typeof CreateLevelInputSchema>;
