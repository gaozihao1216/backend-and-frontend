package microservice.admin.api.submissions

import cats.effect.IO
import java.time.Instant
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.tables.shared.LevelRowMapper
import microservice.admin.objects.submission.ReviewedSubmission
import microservice.admin.support.submission.LevelSubmissionReviewSupport
import microservice.system.objects.AdminLevel
import microservice.admin.api.submissions.body.ReviewSubmissionBody

/** 审核关卡投稿 APIMessage：通过或拒绝，并同步更新关联 Level 状态。 */
final case class ReviewSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: ReviewSubmissionBody
) extends APIWithTokenMessage[ReviewedSubmission] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ReviewedSubmission]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        submission <- LevelSubmissionReviewSupport.requirePendingSubmission(connection, submissionId)
        _ <- LevelSubmissionReviewSupport.requireReviewDecision(submission, body)
        timestamp = Instant.now().toString
        reviewed <- LevelSubmissionReviewSupport.requireUpdatedSubmission(
          connection,
          submissionId,
          body,
          userId,
          timestamp
        )
        _ <- LevelSubmissionReviewSupport.requireSyncedLevel(connection, submission, body, timestamp)
        _ <- PlanSteps.read(
          LevelSubmissionReviewSupport.recordAudit(connection, submissionId, userId, body, timestamp)
        )
      } yield ReviewedSubmission.fromSubmission(LevelRowMapper.toSubmission(reviewed))
    }
}
