package microservice.admin.support.audit

import java.sql.Connection
import microservice.admin.objects.submission.ReviewAudit
import microservice.admin.tables.AdminAuditTable

/** 审核审计写入（admin 模块内）；供 HTTP API 与 internal API 复用。 */
object ReviewAuditSupport {
  def recordReview(
    connection: Connection,
    targetType: String,
    submissionId: String,
    reviewerId: String,
    decision: String,
    reviewNote: Option[String],
    reviewedAt: String
  ): ReviewAudit =
    ReviewAudit.from(
      AdminAuditTable.recordReview(
        connection = connection,
        targetType = targetType,
        submissionId = submissionId,
        reviewerId = reviewerId,
        decision = decision,
        reviewNote = reviewNote,
        reviewedAt = reviewedAt
      )
    )
}
