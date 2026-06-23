package microservice.ui.api.pagecomponents

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.page.PageConfig
import microservice.ui.api.pagecomponents.support.UiPageComponentAccess

/** 总监删除页面内组件 APIMessage。
  *
  * 定义：DELETE /admin/director/ui/pages/:pageId/components/:componentId。
  * 作用：从 PageConfig.components 移除指定组件。
  * 关联：返回更新后的完整 PageConfig。
  */
final case class DeletePageComponentAPIMessage(
  userId: String,
  pageId: String,
  componentId: String
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  /** 页面组件 CRUD 业务逻辑。
    *
    * 实现：requireAdminLevel(Director) → 校验页面与组件存在 → deleteComponent。
    * 关联：返回更新后的完整 PageConfig。
    */
  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        _ <- UiPageComponentAccess.requirePageWithComponent(connection, pageId, componentId)
        page <- UiPageComponentAccess.requireDeleteComponent(connection, pageId, componentId)
      } yield page
    }
}
