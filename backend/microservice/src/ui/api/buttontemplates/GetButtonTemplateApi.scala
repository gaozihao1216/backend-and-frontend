package microservice.ui.api.buttontemplates

import cats.effect.IO
import java.sql.Connection
import microservice.auth.utils.AccessControl
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{ButtonTemplate, UiCustomizationErrors}
import microservice.ui.tables.button_template.{ButtonTemplateRowMapper, ButtonTemplateTable}

final case class GetButtonTemplateAPIMessage(
  userId: String,
  templateId: String
) extends APIWithTokenMessage[ButtonTemplate] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ButtonTemplate]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).flatMap { _ =>
        ButtonTemplateTable.findById(connection, templateId)
          .map(ButtonTemplateRowMapper.toButtonTemplate)
          .toRight(UiCustomizationErrors.ButtonTemplateNotFound(templateId).toHttpError)
      }
    }
}
