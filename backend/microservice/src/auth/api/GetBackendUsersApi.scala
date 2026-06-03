package microservice.auth.api

import cats.effect.IO
import java.sql.Connection
import microservice.auth.objects.BackendUser
import microservice.auth.tables.UserTable
import microservice.core.{APIMessage, HttpError, RowMappers}

final case class GetBackendUsersAPIMessage() extends APIMessage[List[BackendUser]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[BackendUser]]] =
    IO.pure(Right(UserTable.listAll(connection).map(RowMappers.toBackendUser).toList))
}

