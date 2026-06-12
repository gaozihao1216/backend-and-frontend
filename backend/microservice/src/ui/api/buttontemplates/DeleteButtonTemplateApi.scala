package microservice.ui.api.buttontemplates

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{ButtonTemplate, UiCustomizationErrors}
import microservice.ui.tables.button_template.{ButtonTemplateRowMapper, ButtonTemplateTable}

/** DELETE /admin/director/ui/button-templates/:templateId 的 APIMessage。 */
final case class DeleteButtonTemplateAPIMessage(
  userId: String,
  templateId: String
) extends APIWithTokenMessage[ButtonTemplate] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ButtonTemplate]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        template <- PlanSteps.require(
          ButtonTemplateTable.deleteById(connection, templateId)
            .map(ButtonTemplateRowMapper.toButtonTemplate)
            .toRight(UiCustomizationErrors.ButtonTemplateNotFound(templateId).toHttpError)
        )
      } yield template
    }
}
