package microservice.ui.api.pagecomponents

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.page.PageConfig
import microservice.ui.api.pagecomponents.body.UpdatePageComponentBody
import microservice.ui.api.pagecomponents.support.UiPageComponentAccess

/** 总监更新页面内组件 APIMessage。
  *
  * 定义：PUT /admin/director/ui/pages/:pageId/components/:componentId。
  * 作用：按 ADT 类型 copy id 后 updateComponent。
  * 关联：UpdatePageComponentBody.component；路径 componentId 覆盖 body id。
  */
final case class UpdatePageComponentAPIMessage(
  userId: String,
  pageId: String,
  componentId: String,
  body: UpdatePageComponentBody
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  /** 页面组件 CRUD 业务逻辑。
    *
    * 实现：requireAdminLevel(Director) → 校验页面与组件存在 → 强制 id → updateComponent。
    * 关联：返回更新后的完整 PageConfig。
    */
  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        _ <- UiPageComponentAccess.requirePageWithComponent(connection, pageId, componentId)
        page <- UiPageComponentAccess.requireUpdateComponent(connection, pageId, componentId, body.component)
      } yield page
    }
}
