package microservice.auth.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.auth.objects.{BackendUser, BindBackendUserErrors}
import microservice.auth.tables.user.{UserRow, UserTable}
import microservice.infrastructure.api.{APIMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.auth.tables.user.UserRowMapper
import microservice.system.objects.AdminLevel
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

final case class BindBackendUserAPIMessage(
  request: BindBackendUserRequest
) extends APIMessage[BackendUser] {
  override def plan(connection: Connection): IO[Either[HttpError, BackendUser]] =
    IO.pure {
      if (request.localUserId.trim.isEmpty || request.nickname.trim.isEmpty) {
        Left(BindBackendUserErrors.BindBackendUserValidation(List("localUserId", "nickname")).toHttpError)
      } else {
        val normalizedNickname = request.nickname.trim
        val suffix = math.abs(request.localUserId.trim.hashCode).toString.take(7).reverse.padTo(7, '0').reverse
        val username = s"local-${request.role.value}-$suffix"
        val resolvedUser = UserTable.findByUsername(connection, username).getOrElse {
          val timestamp = Instant.now().toString
          UserTable.insert(
            connection,
            UserRow(
              id = s"${request.role.value}-${UserTable.countByRole(connection, request.role) + 1}",
              username = username,
              displayName = normalizedNickname,
              role = request.role,
              adminLevel = if (request.role == UserRole.Admin) Some(AdminLevel.Standard) else None,
              createdAt = timestamp,
              updatedAt = timestamp
            )
          )
        }
        Right(UserRowMapper.toBackendUser(resolvedUser))
      }
    }
}
