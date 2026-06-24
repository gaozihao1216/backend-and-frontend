package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.page.PageConfig
import microservice.ui.objects.UiEndpoint
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

/** 总监列出 UI 页面配置 APIMessage；可选 endpoint 过滤。
  *
  * 定义：列出 UI 页面配置，可选 endpoint=player|designer|...
  * 作用：返回全部或指定角色端点下的 PageConfig 列表。
  * 关联：[[microservice.ui.routes.UiApiMessages]] 注册；前端 DirectorWorkbench 页面列表。
  */
final case class ListUiPagesAPIMessage(
  userId: String,
  endpoint: Option[UiEndpoint]
) extends APIWithTokenMessage[List[PageConfig]] {
  override def token: String = userId

  /** 列出全部或指定 endpoint 的页面配置。
    *
    * 实现：requireAdminLevel(Director) → listAll 或 listByEndpoint → RowMapper 批量转换。
    * 关联：endpoint 为 None 时返回全部页面。
    */
  override def plan(connection: Connection): IO[Either[HttpError, List[PageConfig]]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        // 按 endpoint 过滤或返回全部页面行
        pages <- PlanSteps.read {
          val rows = endpoint match {
            case Some(value) => UiPageTable.listByEndpoint(connection, value)
            case None => UiPageTable.listAll(connection)
          }
          rows.map(UiPageRowMapper.toPageConfig).toList
        }
      } yield pages
    }
}
