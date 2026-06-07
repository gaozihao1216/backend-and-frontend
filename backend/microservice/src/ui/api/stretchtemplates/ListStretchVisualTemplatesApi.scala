package microservice.ui.api.stretchtemplates

import cats.effect.IO
import java.sql.Connection
import microservice.auth.utils.AccessControl
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{StretchVisualTemplate, StretchVisualTemplateKind}
import microservice.ui.tables.{StretchVisualTemplateRowMapper, StretchVisualTemplateTable}

final case class ListStretchVisualTemplatesAPIMessage(
  userId: String,
  kind: StretchVisualTemplateKind
) extends APIWithTokenMessage[List[StretchVisualTemplate]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[StretchVisualTemplate]]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map { _ =>
        StretchVisualTemplateTable
          .listByKind(connection, kind)
          .map(StretchVisualTemplateRowMapper.toStretchVisualTemplate)
          .toList
      }
    }
}
