package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.user.tables.user.UserTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.{PageConfig, SharedLevelMapPageId}

/** 玩家读取共享关卡地图页 APIMessage；固定 pageId。
  *
  * 定义：GET /player/ui/level-map；pageId 固定为 SharedLevelMapPageId。
  * 作用：返回总监预置的关卡地图 PageConfig。
  * 关联：SharedLevelMapPageId.value = "shared.levelMap"；玩家关卡选择页。
  */
final case class GetSharedLevelMapPageAPIMessage(
  userId: String
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  /** 读取共享关卡地图页配置。
    *
    * 实现：UserTable.findById → getPublishedPage(SharedLevelMapPageId)。
    * 关联：与 GetPlayerUiPage 相同权限模型，仅 pageId 固定。
    */
  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        // 校验用户身份有效
        _ <- PlanSteps.require(
          UserTable.findById(connection, userId) match {
            case None =>
              Left(HttpError.unauthorized("Unknown user"))
            case Some(_) =>
              Right(())
          }
        )
        // 读取固定 pageId 的已发布配置
        page <- PlanSteps.require(UiPagePublishSupport.getPublishedPage(connection, SharedLevelMapPageId.value))
      } yield page
    }
}
