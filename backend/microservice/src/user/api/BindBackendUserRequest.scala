package microservice.user.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.UserRole
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /auth/bind 的请求体：前端 mock 登录后的本地身份信息。 */
final case class BindBackendUserRequest(
  localUserId: String, // 浏览器 localStorage 中的稳定本地 ID
  nickname: String,    // 展示名，写入 UserRow.displayName
  role: UserRole         // player / designer / admin
)

object BindBackendUserRequest {
  implicit val decoder: Decoder[BindBackendUserRequest] = deriveDecoder
  implicit val encoder: Encoder[BindBackendUserRequest] = deriveEncoder
  // http4s 从 HTTP body 自动解码时使用
  implicit val entityDecoder: EntityDecoder[IO, BindBackendUserRequest] = jsonOf
}
