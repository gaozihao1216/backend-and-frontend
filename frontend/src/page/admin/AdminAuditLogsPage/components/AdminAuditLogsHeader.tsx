type AdminAuditLogsHeaderProps = {
  auditCount: number;
};

export const AdminAuditLogsHeader = ({ auditCount }: AdminAuditLogsHeaderProps) => (
  <div className="feature-header">
    <div>
      <h2>审核审计</h2>
      <p className="panel-copy">查看关卡与鸟类提案审核记录，以及总监废止操作审计。</p>
    </div>
    <div className="feature-pill">记录 {auditCount}</div>
  </div>
);
