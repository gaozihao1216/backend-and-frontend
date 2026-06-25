package microservice.ui.api.pages.management

import cats.effect.IO
import java.sql.Connection
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.AdminLevel
import microservice.ui.objects.page.PageConfig
import microservice.ui.support.pages.UiPageAccess

/** 总监删除页面配置 APIMessage；返回被删 PageConfig。
  *
  * 定义：DELETE /admin/director/ui/pages/:pageId。
  * 作用：从 UiPageTable 移除页面及其全部组件。
  * 关联：不自动清理 UiPageRollbackTable 中的快照。
  */
final case class DeleteUiPageAPIMessage(
  userId: String,
  pageId: String
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  /** 删除页面并返回被删配置。
    *
    * 实现：requireAdminLevel(Director) → UiPageTable.deleteById → RowMapper。
    * 关联：404 映射 PageNotFound。
    */
  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验总监权限
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        // 步骤 2：删除页面及其全部组件，返回被删 PageConfig
        page <- UiPageAccess.requireDeletePage(connection, pageId)
      } yield page
    }
}
