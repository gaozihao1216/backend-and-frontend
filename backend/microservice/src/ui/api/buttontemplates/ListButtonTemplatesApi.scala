package microservice.ui.api.buttontemplates

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.ButtonTemplate
import microservice.ui.tables.button_template.{ButtonTemplateRowMapper, ButtonTemplateTable}

final case class ListButtonTemplatesAPIMessage(
  userId: String
) extends APIWithTokenMessage[List[ButtonTemplate]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[ButtonTemplate]]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map { _ =>
        ButtonTemplateTable.listAll(connection).map(ButtonTemplateRowMapper.toButtonTemplate).toList
      }
    }
}
