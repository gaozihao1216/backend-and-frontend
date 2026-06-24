package microservice.ui.api.pagecomponents

import cats.effect.IO
import java.sql.Connection
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.page.PageConfig
import microservice.ui.body.pagecomponents.CreatePageComponentBody
import microservice.ui.support.pagecomponents.UiPageComponentAccess

/** 总监向页面追加组件 APIMessage。
  *
  * 定义：POST /admin/director/ui/pages/:pageId/components。
  * 作用：校验 component.id 唯一后 append 到 PageConfig.components。
  * 关联：CreatePageComponentBody.component 为 PageComponent ADT。
  */
final case class CreatePageComponentAPIMessage(
  userId: String,
  pageId: String,
  body: CreatePageComponentBody
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  /** 页面组件 CRUD 业务逻辑。
    *
    * 实现：requireAdminLevel(Director) → 校验页面存在与 component.id 唯一 → addComponent。
    * 关联：返回更新后的完整 PageConfig。
    */
  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验总监权限
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        // 步骤 2：确认页面存在且 component.id 不重复
        _ <- UiPageComponentAccess.requirePageForNewComponent(connection, pageId, body.component.id)
        // 步骤 3：追加组件并返回更新后的 PageConfig
        page <- UiPageComponentAccess.requireAddComponent(connection, pageId, body.component)
      } yield page
    }
}
