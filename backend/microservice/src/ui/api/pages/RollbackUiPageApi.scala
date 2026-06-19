package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.PageConfig

/** POST /admin/director/ui/pages/:pageId/rollback — 恢复上一版已发布配置。 */
final case class RollbackUiPageAPIMessage(
  userId: String,
  pageId: String
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        page <- PlanSteps.require(UiPagePublishSupport.rollback(connection, pageId))
      } yield page
    }
}
