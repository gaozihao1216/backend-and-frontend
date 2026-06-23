package microservice.ui.objects.stretch_template

import io.circe.{Decoder, Encoder}

/** 拉伸视觉模板类型：panel 面板背景或 pattern 装饰图案。 */
sealed abstract class StretchVisualTemplateKind(val value: String)

/** StretchVisualTemplateKind 枚举与编解码。 */
private[ui] object StretchVisualTemplateKind {
  case object Panel extends StretchVisualTemplateKind("panel")
  case object Pattern extends StretchVisualTemplateKind("pattern")

  val values: List[StretchVisualTemplateKind] = List(Panel, Pattern)

  /** 从字符串解析 kind。 */
  def fromString(value: String): Option[StretchVisualTemplateKind] =
    values.find(_.value == value)

  implicit val encoder: Encoder[StretchVisualTemplateKind] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[StretchVisualTemplateKind] =
    Decoder.decodeString.emap(value => fromString(value).toRight(s"Unknown stretch visual template kind: $value"))
}
