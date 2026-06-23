import { z } from "zod";

export const ReviewAuditSchema = z.object({
  id: z.string().min(1),
  targetType: z.string().min(1),
  submissionId: z.string().min(1),
  reviewerId: z.string().min(1),
  decision: z.string().min(1),
  reviewNote: z.string().nullable().optional(),
  reviewedAt: z.string().min(1),
});

export type ReviewAudit = z.infer<typeof ReviewAuditSchema>;

export const ListAdminAuditLogsRequestQuerySchema = z.object({
  submissionId: z.string().min(1).optional(),
  reviewerId: z.string().min(1).optional(),
  targetType: z.string().min(1).optional(),
});

export type ListAdminAuditLogsRequestQuery = z.infer<typeof ListAdminAuditLogsRequestQuerySchema>;
