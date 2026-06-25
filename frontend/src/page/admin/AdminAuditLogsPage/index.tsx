import { useEffect, useState } from "react";
import type { ListAdminAuditLogsRequestQuery, ReviewAudit } from "../../../objects/api/api-contracts.js";
import { listAdminAuditLogs } from "../../../system/api/exports/index.js";
import { AdminAuditLogsHeader } from "./components/AdminAuditLogsHeader.js";
import type { AdminAuditLogsPageProps } from "./objects/admin-audit-logs-page-types.js";

const TARGET_TYPE_OPTIONS = [
  { value: "", label: "全部类型" },
  { value: "level_submission", label: "关卡提案" },
  { value: "bird_submission", label: "鸟类提案" },
  { value: "director_abolish", label: "总监废止" },
] as const;

const formatTargetType = (targetType: string) =>
  TARGET_TYPE_OPTIONS.find((option) => option.value === targetType)?.label ?? targetType;

export const AdminAuditLogsPage = ({ userId }: AdminAuditLogsPageProps) => {
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

  return (
    <section className="panel">
      <AdminAuditLogsHeader auditCount={audits.length} />

      <div className="feature-stack admin-filter-bar">
        <label>
          提案 ID
          <input
            type="text"
            value={filters.submissionId ?? ""}
            onChange={(event) => setFilters((current) => ({
              ...current,
              submissionId: event.target.value || undefined,
            }))}
            placeholder="submissionId"
          />
        </label>
        <label>
          审核人 ID
          <input
            type="text"
            value={filters.reviewerId ?? ""}
            onChange={(event) => setFilters((current) => ({
              ...current,
              reviewerId: event.target.value || undefined,
            }))}
            placeholder="reviewerId"
          />
        </label>
        <label>
          目标类型
          <select
            value={filters.targetType ?? ""}
            onChange={(event) => setFilters((current) => ({
              ...current,
              targetType: event.target.value || undefined,
            }))}
          >
            {TARGET_TYPE_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="actions">
          <button type="button" onClick={handleApplyFilters} disabled={loading}>
            应用筛选
          </button>
          <button type="button" className="secondary" onClick={handleResetFilters} disabled={loading}>
            重置
          </button>
          <button type="button" className="secondary" onClick={() => void loadAudits()} disabled={loading}>
            {loading ? "刷新中..." : "刷新列表"}
          </button>
        </div>
      </div>

      {error ? <p className="feedback error">{error}</p> : null}

      <div className="feature-grid admin-community-grid">
        <section className="feature-card">
          <h3>审计概况</h3>
          <div className="feature-metrics">
            <article className="metric-card">
              <strong>{audits.length}</strong>
              <span>当前记录</span>
            </article>
            <article className="metric-card">
              <strong>{new Set(audits.map((audit) => audit.reviewerId)).size}</strong>
              <span>审核人</span>
            </article>
            <article className="metric-card">
              <strong>{new Set(audits.map((audit) => audit.submissionId)).size}</strong>
              <span>涉及提案</span>
            </article>
          </div>
        </section>

        <section className="feature-card">
          <h3>审计列表</h3>
          <div className="feature-stack">
            {audits.length === 0 && !loading ? <p>当前没有匹配的审核审计记录。</p> : null}
            {audits.map((audit) => (
              <article key={audit.id} className="mini-card">
                <div className="mini-card-header">
                  <strong>{formatTargetType(audit.targetType)}</strong>
                  <span>{new Date(audit.reviewedAt).toLocaleString("zh-CN")}</span>
                </div>
                <p>
                  决策：<strong>{audit.decision}</strong>
                  {audit.reviewNote ? ` · ${audit.reviewNote}` : ""}
                </p>
                <p className="meta">
                  Audit ID: {audit.id} · Submission: {audit.submissionId} · Reviewer: {audit.reviewerId}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};
