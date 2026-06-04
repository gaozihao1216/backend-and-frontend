package microservice.ui.api

import cats.effect.IO
import java.sql.Connection
import microservice.auth.utils.AccessControl
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{PageConfig, UiEndpoint}
import microservice.ui.tables.{UiPageRowMapper, UiPageTable}

final case class ListUiPagesAPIMessage(
  userId: String,
  endpoint: Option[UiEndpoint]
) extends APIWithTokenMessage[List[PageConfig]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[PageConfig]]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map { _ =>
        val rows = endpoint match {
          case Some(value) => UiPageTable.listByEndpoint(connection, value)
          case None => UiPageTable.listAll(connection)
        }
        rows.map(UiPageRowMapper.toPageConfig).toList
      }
    }
}
