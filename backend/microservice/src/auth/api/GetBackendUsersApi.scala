package microservice.auth.api

import cats.effect.IO
import java.sql.Connection
import microservice.auth.objects.BackendUser
import microservice.auth.tables.UserTable
import microservice.core.{APIMessage, HttpError, RowMappers}

final case class GetBackendUsersAPIMessage() extends APIMessage[List[BackendUser]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[BackendUser]]] =
    IO.pure(Right(UserTable.all.map(RowMappers.toBackendUser).toList))
}

object GetBackendUsersEndpoint {
  val name: String = "GetBackendUsers"
  val method: String = "GET"
  val path: String = "/auth/backend-users"
  val businessLogic: String =
    "返回当前系统内可绑定的后端用户列表。"
}
