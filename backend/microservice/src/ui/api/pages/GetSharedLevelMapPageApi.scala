package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.page.PageConfig
import microservice.ui.objects.page.SharedLevelMapPageId
import microservice.ui.support.pages.UiPagePublishSupport

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
        // 步骤 1：确认 userId 为已知用户
        _ <- AccessControl.requireKnownUser(connection, userId).map(_ => ())
        // 步骤 2：读取共享关卡地图页（固定 SharedLevelMapPageId）配置
        page <- UiPagePublishSupport.requirePublishedPage(connection, SharedLevelMapPageId.value)
      } yield page
    }
}
