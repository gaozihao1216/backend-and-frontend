package microservice.auth.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.auth.objects.BackendUser
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

object BindBackendUserEndpoint {
  val name: String = "BindBackendUser"
  val method: String = "POST"
  val path: String = "/auth/bind"
  val businessLogic: String =
    "按 localUserId + role 生成稳定用户名，命中旧绑定则复用，否则创建新的后端用户。"
}
