package microservice.level.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.submission.SubmissionWithLevel
import microservice.level.support.admin.SubmissionReadSupport

/** 模块间 API：列出已通过投稿及关联关卡，可排除已分配槽位的 submissionId。 */
final case class ListApprovedSubmissionsWithLevelInternalAPIMessage(excludeSubmissionIds: Set[String])
    extends APIMessage[List[SubmissionWithLevel]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[SubmissionWithLevel]]] =
    PlanSteps.finish {
      PlanSteps.read(SubmissionReadSupport.listApprovedWithLevel(connection, excludeSubmissionIds))
    }
}
