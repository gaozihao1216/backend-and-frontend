package microservice.auth.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import microservice.auth.objects.BackendUser
import microservice.auth.tables.{UserRow, UserTable}
import microservice.auth.utils.AuthService
import microservice.core.{APIMessage, HttpError, RowMappers}
import microservice.system.objects.UserRole
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class BindBackendUserRequest(
  localUserId: String,
  nickname: String,
  role: UserRole
)

object BindBackendUserRequest {
  implicit val decoder: Decoder[BindBackendUserRequest] = deriveDecoder
  implicit val encoder: Encoder[BindBackendUserRequest] = deriveEncoder
  implicit val entityDecoder: EntityDecoder[IO, BindBackendUserRequest] = jsonOf
}

final case class BindBackendUserResponse(
  user: BackendUser
)

object BindBackendUserResponse {
  implicit val encoder: Encoder[BindBackendUserResponse] = deriveEncoder
  implicit val decoder: Decoder[BindBackendUserResponse] = deriveDecoder
}

final case class BindBackendUserAPIMessage(
  request: BindBackendUserRequest
) extends APIMessage[BackendUser] {
  override def plan(connection: Connection): IO[Either[HttpError, BackendUser]] =
    IO.pure {
      if (request.localUserId.trim.isEmpty || request.nickname.trim.isEmpty) {
        Left(AuthService.BindBackendUserValidation(List("localUserId", "nickname")).toHttpError)
      } else {
        val normalizedNickname = request.nickname.trim
        val suffix = math.abs(request.localUserId.trim.hashCode).toString.take(7).reverse.padTo(7, '0').reverse
        val username = s"local-${request.role.value}-$suffix"
        val resolvedUser = UserTable.findByUsername(username).getOrElse {
          val timestamp = "2026-05-26T11:00:00Z"
          UserTable.insert(
            UserRow(
              id = s"${request.role.value}-${UserTable.countByRole(request.role) + 1}",
              username = username,
              displayName = normalizedNickname,
              role = request.role,
              createdAt = timestamp,
              updatedAt = timestamp
            )
          )
        }
        Right(RowMappers.toBackendUser(resolvedUser))
      }
    }
}

object BindBackendUserEndpoint {
  val name: String = "BindBackendUser"
  val method: String = "POST"
  val path: String = "/auth/bind"
  val businessLogic: String =
    "按 localUserId + role 生成稳定用户名，命中旧绑定则复用，否则创建新的后端用户。"
}
