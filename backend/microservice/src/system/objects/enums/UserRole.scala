package microservice.system.objects.enums

import io.circe.{Decoder, Encoder}

/** 用户角色枚举。
  *
  * 定义：Player / Designer / Admin 三角色，value 为 JSON 与 DB 字面量。
  * 问题：UGC 平台需按身份隔离 API（设计/游玩/审核）。
  * 作用：UserRow.role 持久化；BindBackendUser 创建时指定；AccessControl 校验。
  * 关联：[[UserRow]]、[[BindBackendUserRequest]]、前端 UserRoleSchema。
  */
sealed trait UserRole {
  def value: String // 序列化与持久化用的稳定字符串
}

/** UserRole 伴生对象：角色枚举常量、字符串解析与 Circe 编解码。 */
object UserRole {
  case object Player extends UserRole { override val value: String = "player" }     // 玩家：游玩、评分、收藏
  case object Designer extends UserRole { override val value: String = "designer" } // 设计师：创建与提交关卡
  case object Admin extends UserRole { override val value: String = "admin" }       // 管理员：审核与后台功能

  private val byValue = List(Player, Designer, Admin).map(role => role.value -> role).toMap

  /** 按持久化/JSON 字符串反查角色；未知值返回 None。 */
  def fromString(value: String): Option[UserRole] =
    byValue.get(value)

  implicit val encoder: Encoder[UserRole] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[UserRole] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown user role: $value"))
}
