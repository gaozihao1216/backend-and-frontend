package microservice.user.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.AdminLevel
import microservice.system.objects.UserRole

/** 对外 API 暴露的用户对象（identity 层）。
  *
  * 与前端 `frontend/src/objects/auth/backend-user.ts` 的 BackendUserSchema 对齐。
  * 由 UserRow 经 UserRowMapper 转换而来，不直接暴露存储层字段命名差异。
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

object BackendUser {
  implicit val encoder: Encoder[BackendUser] = deriveEncoder
  implicit val decoder: Decoder[BackendUser] = deriveDecoder
}
