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

/** 更新页面内指定组件的 APIMessage；路径 componentId 覆盖 body 中的 id。 */
final case class UpdatePageComponentAPIMessage(
  userId: String,
  pageId: String,
  componentId: String,
  body: UpdatePageComponentBody
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
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
