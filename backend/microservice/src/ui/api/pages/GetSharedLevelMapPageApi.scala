package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.user.tables.user.UserTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.{PageConfig, SharedLevelMapPageId}

/** GET /player/ui/level-map 的 APIMessage：任意已登录玩家可读共享关卡地图页配置。 */
final case class GetSharedLevelMapPageAPIMessage(
  userId: String
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
        page <- PlanSteps.require(UiPagePublishSupport.getPublishedPage(connection, SharedLevelMapPageId.value))
      } yield page
    }
}
