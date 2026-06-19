package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.user.tables.user.UserTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.PageConfig

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
        // 校验用户身份有效
        _ <- PlanSteps.require(
          UserTable.findById(connection, userId) match {
            case None =>
              Left(HttpError.unauthorized("Unknown user"))
            case Some(_) =>
              Right(())
          }
        )
        // 读取已发布 PageConfig
        page <- PlanSteps.require(UiPagePublishSupport.getPublishedPage(connection, pageId))
      } yield page
    }
}
