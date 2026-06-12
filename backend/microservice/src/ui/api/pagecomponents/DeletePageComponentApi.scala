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

/** DELETE /admin/director/ui/pages/:pageId/components/:componentId 的 APIMessage。 */
final case class DeletePageComponentAPIMessage(
  userId: String,
  pageId: String,
  componentId: String
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
          UiPageTable
            .deleteComponent(connection, pageId, componentId, Instant.now().toString)
            .map(row => Right(UiPageRowMapper.toPageConfig(row)))
            .getOrElse(Left(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError))
        )
      } yield page
    }
}
