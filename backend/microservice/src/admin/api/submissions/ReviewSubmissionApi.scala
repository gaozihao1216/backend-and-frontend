package microservice.admin.api.submissions

import cats.effect.IO
import java.time.Instant
import java.sql.Connection
import microservice.admin.api.internal.RecordReviewAuditInternalAPIMessage
import microservice.admin.objects.submission.ReviewedSubmission
import microservice.admin.support.mapping.LevelHandoffMapping
import microservice.system.objects.enums.{AdminLevel, AuditTargetType}
import microservice.admin.objects.submission.request.ReviewSubmissionRequest
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.api.internal.admin.submissions.ReviewLevelSubmissionInternalAPIMessage
import microservice.user.support.AccessControl

/** 审核关卡投稿 APIMessage：通过或拒绝，并同步更新关联 Level 状态。 */
final case class ReviewSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: ReviewSubmissionRequest
) extends APIWithTokenMessage[ReviewedSubmission] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ReviewedSubmission]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.fromEither(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard))
        timestamp = Instant.now().toString
        reviewed <- PlanSteps.runApi(
          ReviewLevelSubmissionInternalAPIMessage(
            submissionId = submissionId,
            reviewerId = userId,
            status = body.status,
            reviewNote = body.reviewNote,
            reviewedAt = timestamp
          ),
          connection
        )
        _ <- PlanSteps.runApi(
          RecordReviewAuditInternalAPIMessage(
            targetType = AuditTargetType.LevelSubmission,
            submissionId = submissionId,
            reviewerId = userId,
            decision = body.status.value,
            reviewNote = body.reviewNote,
            reviewedAt = timestamp
          ),
          connection
        )
      } yield LevelHandoffMapping.toReviewedSubmission(reviewed)
    }
}
