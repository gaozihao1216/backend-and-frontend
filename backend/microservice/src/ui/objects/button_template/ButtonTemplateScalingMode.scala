package microservice.ui.objects.button_template

import io.circe.{Decoder, Encoder}

/** 按钮模板缩放模式：固定比例或九宫格。 */
sealed abstract class ButtonTemplateScalingMode(val value: String)

/** ButtonTemplateScalingMode 枚举与编解码。 */
private[ui] object ButtonTemplateScalingMode {
  case object FixedAspect extends ButtonTemplateScalingMode("fixedAspect")
  case object NineSlice extends ButtonTemplateScalingMode("nineSlice")

  val values: List[ButtonTemplateScalingMode] = List(FixedAspect, NineSlice)

  /** 从字符串解析缩放模式。 */
  def fromString(value: String): Option[ButtonTemplateScalingMode] =
    values.find(_.value == value)

  implicit val encoder: Encoder[ButtonTemplateScalingMode] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[ButtonTemplateScalingMode] =
    Decoder.decodeString.emap(value => fromString(value).toRight(s"Unknown button template scaling mode: $value"))
}
