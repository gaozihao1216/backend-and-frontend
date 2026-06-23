package microservice.level.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.submission.SubmissionWithLevel
import microservice.level.support.admin.SubmissionReadSupport

/** 模块间 API：按 submissionId 联查投稿与关卡；由 admin 模块调用，不挂路由。 */
final case class GetSubmissionWithLevelInternalAPIMessage(submissionId: String) extends APIMessage[SubmissionWithLevel] {
  override def plan(connection: Connection): IO[Either[HttpError, SubmissionWithLevel]] =
    PlanSteps.finish {
      SubmissionReadSupport.requireSubmissionWithLevel(connection, submissionId)
    }
}
