package microservice.user.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.UserRole
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /auth/bind 的请求体 JSON 模型。
  *
  * 定义：localUserId + nickname + role 三字段，Circe + http4s EntityDecoder。
  * 问题：前端 mock auth 仅有本地 id 与昵称，需映射到后端 UserRow。
  * 作用：AuthRouter 解析 body 后传入 BindBackendUserAPIMessage。
  * 关联：[[BindBackendUserAPIMessage]]；[[UserRole]] 枚举解码。
  */
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
