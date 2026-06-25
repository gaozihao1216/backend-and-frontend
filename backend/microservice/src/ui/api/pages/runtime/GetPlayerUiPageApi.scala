package microservice.ui.api.pages.runtime

import cats.effect.IO
import java.sql.Connection
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.page.PageConfig
import microservice.ui.support.pages.UiPagePublishSupport

/** 玩家读取已发布页面配置 APIMessage；任意已登录用户可访问。
  *
  * 定义：GET /player/ui/pages/:pageId（player 路由，非 director 前缀）。
  * 作用：返回 UiPageTable 中的 PageConfig 供 DynamicPageRenderer 渲染。
  * 关联：frontend page/player DynamicPageHost 消费此 API。
  */
final case class GetPlayerUiPageAPIMessage(
  userId: String,
  pageId: String
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  /** 已登录用户读取已发布页面。
    *
    * 实现：UserTable.findById 校验身份 → UiPagePublishSupport.getPublishedPage。
    * 关联：不要求 Director 权限，仅需有效 userId。
    */
  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        // 步骤 1：确认 userId 为已知用户
        _ <- AccessControl.requireKnownUser(connection, userId).map(_ => ())
        // 步骤 2：读取已发布的 PageConfig 供玩家端渲染
        page <- UiPagePublishSupport.requirePublishedPage(connection, pageId)
      } yield page
    }
}
