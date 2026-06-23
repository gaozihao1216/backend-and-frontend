package microservice.level.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.submission.Submission
import microservice.level.support.admin.SubmissionReviewSupport
import microservice.system.objects.SubmissionStatus

/** 模块间 API：审核关卡投稿；由 admin HTTP API 调用，不挂路由。 */
final case class ReviewLevelSubmissionInternalAPIMessage(
  submissionId: String,
  reviewerId: String,
  status: SubmissionStatus,
  reviewNote: Option[String],
  reviewedAt: String
) extends APIMessage[Submission] {
  override def plan(connection: Connection): IO[Either[HttpError, Submission]] =
    PlanSteps.finish {
      SubmissionReviewSupport.requireReview(connection, submissionId, reviewerId, status, reviewNote, reviewedAt)
    }
}
