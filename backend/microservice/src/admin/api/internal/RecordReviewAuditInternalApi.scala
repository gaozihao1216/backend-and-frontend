package microservice.admin.api.internal

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.submission.ReviewAudit
import microservice.admin.support.audit.ReviewAuditSupport
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：写入审核审计；由 bird/level/admin HTTP API 调用，不挂路由。 */
final case class RecordReviewAuditInternalAPIMessage(
  targetType: String,
  submissionId: String,
  reviewerId: String,
  decision: String,
  reviewNote: Option[String],
  reviewedAt: String
) extends APIMessage[ReviewAudit] {
  override def plan(connection: Connection): IO[Either[HttpError, ReviewAudit]] =
    PlanSteps.finish {
      PlanSteps.read(
        ReviewAuditSupport.recordReview(
          connection,
          targetType,
          submissionId,
          reviewerId,
          decision,
          reviewNote,
          reviewedAt
        )
      )
    }
}
