package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.user.tables.user.UserTable
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.{PageConfig, UiCustomizationErrors}
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

/** 共享关卡地图页的固定 pageId（总监预置，玩家只读）。 */
object SharedLevelMapPageId {
  val value: String = "shared.levelMap"
}

/** GET /player/ui/level-map 的 APIMessage：任意已登录玩家可读共享关卡地图页配置。 */
final case class GetSharedLevelMapPageAPIMessage(
  userId: String
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    IO.pure {
      UserTable.findById(connection, userId) match {
        case None =>
          Left(HttpError.unauthorized("Unknown user"))
        case Some(_) =>
          UiPageTable.findById(connection, SharedLevelMapPageId.value)
            .map(UiPageRowMapper.toPageConfig)
            .toRight(UiCustomizationErrors.PageNotFound(SharedLevelMapPageId.value).toHttpError)
      }
    }
}
