package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.PageConfig

/** POST /admin/director/ui/pages/:pageId/publish — 将配置写入服务端并保留上一版用于回滚。 */
final case class PublishUiPageAPIMessage(
  userId: String,
  pageId: String,
  body: UpdateUiPageBody
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        page <- PlanSteps.require(UiPagePublishSupport.publish(connection, pageId, body.page))
      } yield page
    }
}
