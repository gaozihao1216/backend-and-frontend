import {
  ListAdminAuditLogsRequestQuerySchema,
  ListAdminAuditLogsResponseDataSchema,
  type ListAdminAuditLogsRequestQuery,
  type ReviewAudit,
} from "../../../objects/api/api-contracts.js";
import { request } from "../../../system/api/legacyRequest.js";

export const ListAdminAuditLogsApiPath = "/admin/audit-logs" as const;

export class ListAdminAuditLogsApi {
  static readonly path = ListAdminAuditLogsApiPath;

  async execute(userId: string, query: ListAdminAuditLogsRequestQuery = {}): Promise<ReviewAudit[]> {
    ListAdminAuditLogsRequestQuerySchema.parse(query);
    const search = new URLSearchParams();
    if (query.submissionId) search.set("submissionId", query.submissionId);
    if (query.reviewerId) search.set("reviewerId", query.reviewerId);
    if (query.targetType) search.set("targetType", query.targetType);
    const suffix = search.toString();
    const path = suffix ? `${ListAdminAuditLogsApi.path}?${suffix}` : ListAdminAuditLogsApi.path;
    return request(path, { method: "GET", headers: { "x-user-id": userId } }, ListAdminAuditLogsResponseDataSchema);
  }
}

export const listAdminAuditLogsApi = new ListAdminAuditLogsApi();

export const listAdminAuditLogs = async (
  userId: string,
  query: ListAdminAuditLogsRequestQuery = {},
): Promise<ReviewAudit[]> => listAdminAuditLogsApi.execute(userId, query);
