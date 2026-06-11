package microservice.system.objects

import io.circe.{Decoder, Encoder}

/** 管理员子级别，仅当 UserRole.Admin 时有效。
  *
  * 实现：standard 可审核关卡与评论；director 额外拥有 UI 定制、关卡槽位、鸟类技能配置权限。
  * 关联：UserRow.adminLevel、AccessControl.requireAdminLevel。
  */
sealed trait AdminLevel {
  def value: String
}

object AdminLevel {
  case object Standard extends AdminLevel { override val value: String = "standard" } // 普通审核员
  case object Director extends AdminLevel { override val value: String = "director" } // 总监（全站配置）

  private val byValue = List(Standard, Director).map(level => level.value -> level).toMap

  def fromString(value: String): Option[AdminLevel] =
    byValue.get(value)

  implicit val encoder: Encoder[AdminLevel] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[AdminLevel] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown admin level: $value"))
}
