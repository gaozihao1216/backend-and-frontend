package microservice.user.api

import cats.effect.IO
import java.sql.Connection
import microservice.user.objects.BackendUser
import microservice.user.tables.user.UserTable
import microservice.infrastructure.api.{APIMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.user.tables.user.UserRowMapper

final case class GetBackendUsersAPIMessage() extends APIMessage[List[BackendUser]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[BackendUser]]] =
    IO.pure(Right(UserTable.listAll(connection).map(UserRowMapper.toBackendUser).toList))
}

