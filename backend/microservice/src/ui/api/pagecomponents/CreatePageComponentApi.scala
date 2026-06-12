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

/** 向页面追加组件的 APIMessage；component.id 不可与已有组件重复。 */
final case class CreatePageComponentAPIMessage(
  userId: String,
  pageId: String,
  body: CreatePageComponentBody
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
            case Some(page) if page.components.exists(_.id == body.component.id) =>
              Left(UiCustomizationErrors.ComponentAlreadyExists(body.component.id).toHttpError)
            case Some(_) =>
              Right(())
          }
        )
        page <- PlanSteps.require(
          UiPageTable
            .addComponent(connection, pageId, body.component, Instant.now().toString)
            .map(row => Right(UiPageRowMapper.toPageConfig(row)))
            .getOrElse(Left(UiCustomizationErrors.ComponentAlreadyExists(body.component.id).toHttpError))
        )
      } yield page
    }
}
