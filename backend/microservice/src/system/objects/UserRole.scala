package microservice.system.objects

import io.circe.{Decoder, Encoder}

/** 用户角色枚举，与前端 UserRoleSchema 及数据库存储字符串对齐。
  *
  * 实现：value 为 JSON/DB 中的字面量；fromString 用于 JDBC 行解析与请求校验。
  * 关联：UserRow.role、BindBackendUserRequest.role、AccessControl.requireRole。
  */
sealed trait UserRole {
  def value: String // 序列化与持久化用的稳定字符串
}

object UserRole {
  case object Player extends UserRole { override val value: String = "player" }     // 玩家：游玩、评分、收藏
  case object Designer extends UserRole { override val value: String = "designer" } // 设计师：创建与提交关卡
  case object Admin extends UserRole { override val value: String = "admin" }       // 管理员：审核与后台功能

  private val byValue = List(Player, Designer, Admin).map(role => role.value -> role).toMap

  def fromString(value: String): Option[UserRole] =
    byValue.get(value)

  implicit val encoder: Encoder[UserRole] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[UserRole] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown user role: $value"))
}
