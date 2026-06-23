package microservice.level.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.submission.SubmissionWithLevel
import microservice.level.support.admin.{SlotAssignmentSupport, SubmissionReadSupport}

/** 模块间 API：总监废止已批准投稿；由 admin HTTP API 调用，不挂路由。 */
final case class AbolishApprovedSubmissionInternalAPIMessage(
  submissionId: String,
  reviewerId: String,
  note: Option[String]
) extends APIMessage[SubmissionWithLevel] {
  override def plan(connection: Connection): IO[Either[HttpError, SubmissionWithLevel]] =
    PlanSteps.finish {
      for {
        abolishedId <- SlotAssignmentSupport.requireAbolishApprovedSubmission(connection, submissionId, reviewerId, note)
        result <- SubmissionReadSupport.requireSubmissionWithLevel(connection, abolishedId)
      } yield result
    }
}
