import {
  CreateLevelRequestBodySchema,
  CreateLevelResponseDataSchema,
  SubmitLevelRequestBodySchema,
  SubmitLevelResponseDataSchema,
  type CreateLevelRequestBody,
  type DesignerLevel,
  type DesignerSubmission,
} from "../../../shared/types.js";
import { request } from "./client.js";

export const createLevel = async (
  userId: string,
  input: CreateLevelRequestBody,
): Promise<DesignerLevel> =>
  request(
    "/designer/levels",
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(CreateLevelRequestBodySchema.parse(input)),
    },
    CreateLevelResponseDataSchema,
  );

export const submitLevel = async (
  userId: string,
  levelId: string,
): Promise<DesignerSubmission> =>
  request(
    "/designer/submissions",
    {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(SubmitLevelRequestBodySchema.parse({ levelId })),
    },
    SubmitLevelResponseDataSchema,
  );
