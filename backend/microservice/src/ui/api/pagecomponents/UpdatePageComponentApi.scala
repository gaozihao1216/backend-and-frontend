package microservice.ui.api.pagecomponents

import cats.effect.IO
import java.sql.Connection
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.AdminLevel
import microservice.ui.objects.page.PageConfig
import microservice.ui.objects.component.request.UpdatePageComponentRequest
import microservice.ui.support.pagecomponents.UiPageComponentAccess

/** 总监更新页面内组件 APIMessage。
  *
  * 定义：PUT /admin/director/ui/pages/:pageId/components/:componentId。
  * 作用：按 ADT 类型 copy id 后 updateComponent。
  * 关联：UpdatePageComponentRequest.component；路径 componentId 覆盖 body id。
  */
final case class UpdatePageComponentAPIMessage(
  userId: String,
  pageId: String,
  componentId: String,
  body: UpdatePageComponentRequest
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
        // 步骤 1：校验总监权限
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        // 步骤 2：确认页面与目标组件均存在
        _ <- UiPageComponentAccess.requirePageWithComponent(connection, pageId, componentId)
        // 步骤 3：更新组件并返回更新后的 PageConfig
        page <- UiPageComponentAccess.requireUpdateComponent(connection, pageId, componentId, body.component)
      } yield page
    }
}
