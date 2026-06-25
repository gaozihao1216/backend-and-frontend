import { useEffect, useState } from "react";
import type { ListAdminAuditLogsRequestQuery, ReviewAudit } from "../../../../objects/api/api-contracts.js";
import { listAdminAuditLogs } from "../../../../system/api/exports/index.js";

export const useAdminAuditLogsPage = (userId: string) => {
  const [audits, setAudits] = useState<ReviewAudit[]>([]);
  const [filters, setFilters] = useState<ListAdminAuditLogsRequestQuery>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAudits = async (query: ListAdminAuditLogsRequestQuery = filters) => {
    setLoading(true);
    setError("");

    try {
      const nextAudits = await listAdminAuditLogs(userId, query);
      setAudits(nextAudits);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载审核审计失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAudits();
  }, [userId]);

  const handleApplyFilters = () => {
    void loadAudits(filters);
  };

  const handleResetFilters = () => {
    setFilters({});
    void loadAudits({});
  };

  return {
    audits,
    filters,
    loading,
    error,
    setFilters,
    loadAudits,
    handleApplyFilters,
    handleResetFilters,
  };
};
