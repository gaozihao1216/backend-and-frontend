package microservice.ui.api.pagecomponents

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{PageConfig, UiCustomizationErrors}
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

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
        // 校验总监权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 校验页面与组件存在
        _ <- PlanSteps.require(
          UiPageTable.findById(connection, pageId) match {
            case None =>
              Left(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
            case Some(page) if !page.components.exists(_.id == componentId) =>
              Left(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError)
            case Some(_) =>
              Right(())
          }
        )
        // 强制 componentId 并更新组件
        page <- PlanSteps.require(
          {
            val component = body.component match {
              case button: microservice.ui.objects.ButtonComponent => button.copy(id = componentId)
              case panel: microservice.ui.objects.PanelComponent => panel.copy(id = componentId)
              case text: microservice.ui.objects.TextComponent => text.copy(id = componentId)
              case list: microservice.ui.objects.ListComponent => list.copy(id = componentId)
            }
            UiPageTable
              .updateComponent(connection, pageId, componentId, component, Instant.now().toString)
              .map(row => Right(UiPageRowMapper.toPageConfig(row)))
              .getOrElse(Left(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError))
          }
        )
      } yield page
    }
}
