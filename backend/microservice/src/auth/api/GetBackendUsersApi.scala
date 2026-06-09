package microservice.auth.api

import cats.effect.IO
import java.sql.Connection
import microservice.auth.objects.BackendUser
import microservice.auth.tables.user.UserTable
import microservice.infrastructure.api.{APIMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.auth.tables.user.UserRowMapper

final case class GetBackendUsersAPIMessage() extends APIMessage[List[BackendUser]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[BackendUser]]] =
    IO.pure(Right(UserTable.listAll(connection).map(UserRowMapper.toBackendUser).toList))
}

