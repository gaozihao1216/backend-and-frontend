package microservice.admin.api.submissions

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.level.AdminSubmissionWithLevel
import microservice.admin.support.mapping.LevelHandoffMapping
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.api.internal.admin.submissions.ListPendingSubmissionsWithLevelInternalAPIMessage
import microservice.system.objects.enums.AdminLevel

/** 列出所有待审核关卡投稿 APIMessage，附带关联关卡快照。 */
final case class GetPendingSubmissionsAPIMessage(userId: String)
    extends APIWithTokenMessage[List[AdminSubmissionWithLevel]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[AdminSubmissionWithLevel]]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.fromEither(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard))
        submissions <- PlanSteps.runApi(ListPendingSubmissionsWithLevelInternalAPIMessage(), connection)
      } yield submissions.map(LevelHandoffMapping.toSubmissionWithLevel)
    }
}
