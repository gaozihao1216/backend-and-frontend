package microservice.user.api

import cats.effect.IO
import java.sql.Connection
import microservice.user.objects.BackendUser
import microservice.user.tables.user.UserTable
import microservice.infrastructure.api.{APIMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.user.tables.user.UserRowMapper

/** GET /auth/backend-users 的 APIMessage。
  *
  * 无入参、无权限校验（演示用途：列出所有可绑定账号）。
  * 关联：SystemSeedData 预置的 player-1、designer-1、admin-1 等会出现在列表中。
  */
final case class GetBackendUsersAPIMessage() extends APIMessage[List[BackendUser]] {

  override def plan(connection: Connection): IO[Either[HttpError, List[BackendUser]]] =
    IO.pure(
      Right(
        UserTable
          .listAll(connection)
          .map(UserRowMapper.toBackendUser)
          .toList
      )
    )
}
