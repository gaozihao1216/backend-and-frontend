package microservice.user.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.AdminLevel
import microservice.system.objects.UserRole

/** 对外 API 暴露的用户身份对象（identity 层）。
  *
  * 定义：id/username/displayName/role/adminLevel/时间戳 的 JSON 可序列化 case class。
  * 问题：UserRow 含存储细节，不宜直接作为 bind/profile 响应返回前端。
  * 作用：前端保存 id 为 apiUserId，后续 x-user-id 请求头携带。
  * 关联：[[UserRowMapper.toBackendUser]]；`frontend/src/objects/auth/backend-user.ts`。
  */
final case class BackendUser(
  id: String,                      // 后端主键，如 player-1；前端保存为 apiUserId
  username: String,                // 登录名 / 绑定用唯一名，如 local-player-0000001
  displayName: String,             // 展示昵称
  role: UserRole,                  // player | designer | admin
  adminLevel: Option[AdminLevel], // 仅 role=admin 时有值：standard | director
  createdAt: String,               // ISO 时间字符串
  updatedAt: String
)

/** BackendUser 伴生对象：Circe JSON 编解码，供绑定/身份 API 响应。 */
private[user] object BackendUser {
  implicit val encoder: Encoder[BackendUser] = deriveEncoder
  implicit val decoder: Decoder[BackendUser] = deriveDecoder
}
