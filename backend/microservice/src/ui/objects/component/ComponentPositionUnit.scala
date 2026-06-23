package microservice.ui.objects.component

import io.circe.{Decoder, Encoder}

/** 位置单位：percent 或 px。 */
sealed trait ComponentPositionUnit {
  def value: String
}

/** ComponentPositionUnit 枚举与编解码。 */
private[ui] object ComponentPositionUnit {
  case object Percent extends ComponentPositionUnit { override val value: String = "percent" }
  case object Px extends ComponentPositionUnit { override val value: String = "px" }

  private val byValue = List(Percent, Px).map(unit => unit.value -> unit).toMap

  /** 从字符串解析位置单位。 */
  def fromString(value: String): Option[ComponentPositionUnit] =
    byValue.get(value)

  implicit val encoder: Encoder[ComponentPositionUnit] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[ComponentPositionUnit] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown component position unit: $value"))
}
