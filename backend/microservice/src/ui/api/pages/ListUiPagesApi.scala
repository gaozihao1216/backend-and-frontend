package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{PageConfig, UiEndpoint}
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

/** GET /admin/director/ui/pages 的 APIMessage。
  *
  * 可选 query endpoint 按角色端点过滤；需 Director 权限。
  */
final case class ListUiPagesAPIMessage(
  userId: String,
  endpoint: Option[UiEndpoint]
) extends APIWithTokenMessage[List[PageConfig]] {
  override def token: String = userId

  /** 列出全部或指定 endpoint 的页面配置。 */
  override def plan(connection: Connection): IO[Either[HttpError, List[PageConfig]]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
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
