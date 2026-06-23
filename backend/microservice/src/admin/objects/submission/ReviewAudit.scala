package microservice.admin.objects.submission

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.admin.tables.ReviewAuditRow

/** 管理员审核审计领域对象（API 响应可复用）。 */
final case class ReviewAudit(
  id: String,
  targetType: String,
  submissionId: String,
  reviewerId: String,
  decision: String,
  reviewNote: Option[String],
  reviewedAt: String
)

/** ReviewAudit 伴生对象：审计 Row 映射与 Circe JSON 编解码。 */
private[admin] object ReviewAudit {
  /** 将 ReviewAuditRow 转为 API 领域对象。 */
  def from(row: ReviewAuditRow): ReviewAudit =
    ReviewAudit(
      id = row.id,
      targetType = row.targetType,
      submissionId = row.submissionId,
      reviewerId = row.reviewerId,
      decision = row.decision,
      reviewNote = row.reviewNote,
      reviewedAt = row.reviewedAt
    )

  implicit val encoder: Encoder[ReviewAudit] = deriveEncoder
  implicit val decoder: Decoder[ReviewAudit] = deriveDecoder
}
