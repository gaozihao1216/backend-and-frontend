package microservice.bird.api.review

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.admin.tables.{AdminAuditTable, AdminAuditTargetType}
import microservice.bird.objects.submission.ReviewedBirdSubmission
import microservice.bird.support.review.BirdSubmissionReviewSupport
import microservice.bird.tables.shared.BirdRowMapper
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.bird.api.review.body.ReviewBirdSubmissionBody

/** 审核鸟类设计投稿 APIMessage：通过或拒绝，并同步更新关联 BirdDesign 状态。 */
final case class ReviewBirdSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: ReviewBirdSubmissionBody
) extends APIWithTokenMessage[ReviewedBirdSubmission] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ReviewedBirdSubmission]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        submission <- BirdSubmissionReviewSupport.requirePendingSubmission(connection, submissionId)
        _ <- BirdSubmissionReviewSupport.requireReviewDecision(submission, body)
        timestamp = Instant.now().toString
        reviewed <- BirdSubmissionReviewSupport.requireUpdatedSubmission(
          connection,
          submissionId,
          body,
          userId,
          timestamp
        )
        _ <- BirdSubmissionReviewSupport.requireSyncedDesign(connection, submission, body, timestamp)
        _ <- PlanSteps.read(
          AdminAuditTable.recordReview(
            connection = connection,
            targetType = AdminAuditTargetType.BirdSubmission,
            submissionId = submissionId,
            reviewerId = userId,
            decision = body.status.value,
            reviewNote = body.reviewNote,
            reviewedAt = timestamp
          )
        )
      } yield ReviewedBirdSubmission.fromSubmission(BirdRowMapper.toBirdSubmission(reviewed))
    }
}
