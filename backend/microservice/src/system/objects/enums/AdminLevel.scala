package microservice.system.objects.enums

import io.circe.{Decoder, Encoder}

/** 管理员子级别枚举，仅 UserRole.Admin 时有效。
  *
  * 定义：Standard / Director 两档，存于 UserRow.adminLevel Option。
  * 问题：审核员与总监权限差异大，不能仅用 Admin 角色一刀切。
  * 作用：standard 负责审核；director 额外拥有 UI/槽位/鸟技能配置。
  * 关联：[[UserRow]]、[[AccessControl.requireAdminLevel]]、admin/director 路由。
  */
sealed trait AdminLevel {
  def value: String
}

/** AdminLevel 伴生对象：管理员子级别枚举、字符串解析与 Circe 编解码。 */
object AdminLevel {
  case object Standard extends AdminLevel { override val value: String = "standard" } // 普通审核员
  case object Director extends AdminLevel { override val value: String = "director" } // 总监（全站配置）

  private val byValue = List(Standard, Director).map(level => level.value -> level).toMap

  /** 按持久化/JSON 字符串反查管理员级别；未知值返回 None。 */
  def fromString(value: String): Option[AdminLevel] =
    byValue.get(value)

  implicit val encoder: Encoder[AdminLevel] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[AdminLevel] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown admin level: $value"))
}
