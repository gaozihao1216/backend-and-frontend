package microservice.level.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.submission.SubmissionWithLevel
import microservice.level.support.admin.SubmissionReadSupport

/** 模块间 API：列出待审投稿及关联关卡；由 admin HTTP API 调用，不挂路由。 */
final case class ListPendingSubmissionsWithLevelInternalAPIMessage() extends APIMessage[List[SubmissionWithLevel]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[SubmissionWithLevel]]] =
    PlanSteps.finish {
      PlanSteps.read(SubmissionReadSupport.listPendingWithLevel(connection))
    }
}
