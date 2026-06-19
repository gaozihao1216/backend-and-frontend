package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.user.tables.user.UserTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.PageConfig

/** GET /player/ui/pages/:pageId — 任意已登录用户读取已发布页面配置。 */
final case class GetPlayerUiPageAPIMessage(
  userId: String,
  pageId: String
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(
          UserTable.findById(connection, userId) match {
            case None =>
              Left(HttpError.unauthorized("Unknown user"))
            case Some(_) =>
              Right(())
          }
        )
        page <- PlanSteps.require(UiPagePublishSupport.getPublishedPage(connection, pageId))
      } yield page
    }
}
