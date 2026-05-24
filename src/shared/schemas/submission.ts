import { z } from "zod";
import {
  IdSchema,
  IsoDateTimeSchema,
  SubmissionStatusSchema,
} from "./common.js";
import { LevelSchema } from "./level.js";

// Submission 表示一次“把草稿送审”的记录，本身与 Level 状态联动但不是同一概念。
export const SubmissionSchema = z.object({
  id: IdSchema,
  levelId: IdSchema,
  submitterId: IdSchema,
  status: SubmissionStatusSchema,
  reviewerId: IdSchema.optional(),
  reviewNote: z.string().max(1000).optional(),
  submittedAt: IsoDateTimeSchema,
  reviewedAt: IsoDateTimeSchema.optional(),
});

export const SubmissionWithLevelSchema = SubmissionSchema.extend({
  level: LevelSchema,
});

export const SubmissionIdParamsSchema = z.object({
  submissionId: IdSchema,
});

export const ReviewSubmissionInputSchema = z.object({
  // 当前 MVP 只有通过/拒绝两种审核结果，没有“打回修改中”等中间态。
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().max(1000).optional(),
});

export type Submission = z.infer<typeof SubmissionSchema>;
export type SubmissionWithLevel = z.infer<typeof SubmissionWithLevelSchema>;
export type SubmissionIdParams = z.infer<typeof SubmissionIdParamsSchema>;
export type ReviewSubmissionInput = z.infer<typeof ReviewSubmissionInputSchema>;
