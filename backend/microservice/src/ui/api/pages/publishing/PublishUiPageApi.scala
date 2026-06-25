package microservice.ui.api.pages.publishing

import cats.effect.IO
import java.sql.Connection
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.AdminLevel
import microservice.ui.objects.page.PageConfig
import microservice.ui.objects.page.request.UpdateUiPageRequest
import microservice.ui.support.pages.UiPagePublishSupport

/** 总监发布页面配置 APIMessage；覆盖前保留回滚快照。
  *
  * 定义：POST /admin/director/ui/pages/:pageId/publish。
  * 作用：写入 UiPageTable 并在 UiPageRollbackTable 保留上一版。
  * 关联：UiPagePublishSupport.publish；玩家侧 GetPlayerUiPage 读取已发布配置。
  */
final case class PublishUiPageAPIMessage(
  userId: String,
  pageId: String,
  body: UpdateUiPageRequest
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  /** 发布页面配置并保留上一版快照。
    *
    * 实现：requireAdminLevel(Director) → UiPagePublishSupport.publish。
    * 关联：body.page 为待发布的完整 PageConfig。
    */
  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        // 委托 UiPagePublishSupport 完成发布与快照写入
        page <- UiPagePublishSupport.requirePublish(connection, pageId, body.page)
      } yield page
    }
}
