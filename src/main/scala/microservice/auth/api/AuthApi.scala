package microservice.auth.api

import cats.effect.IO
import microservice.core.HttpError
import microservice.auth.objects.BackendUser
import microservice.system.objects.UserRole
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
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

sealed trait AuthError {
  def toHttpError: HttpError
}

object AuthService {
  final case class BindBackendUserValidation(fields: List[String]) extends AuthError {
    override def toHttpError: HttpError =
      HttpError.badRequest("BIND_BACKEND_USER_INVALID", "localUserId and nickname are required", Some(fields.mkString(",")))
  }
}

trait AuthService {
  def bindBackendUser(request: BindBackendUserRequest): Either[HttpError, BindBackendUserResponse]
}

object BindBackendUserEndpoint {
  val name: String = "BindBackendUser"
  val method: String = "POST"
  val path: String = "/auth/bind"
  val businessLogic: String =
    "按 localUserId + role 生成稳定用户名，命中旧绑定则复用，否则创建新的后端用户。"
}
