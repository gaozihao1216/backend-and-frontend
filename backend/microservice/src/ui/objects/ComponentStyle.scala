package microservice.ui.objects

/** 组件可选视觉样式：变体、颜色、圆角、字号与宽高比锁定等。 */
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 组件视觉变体：primary/secondary/ghost。 */
sealed trait ComponentVariant {
  def value: String
}

/** ComponentVariant 枚举与编解码。 */
object ComponentVariant {
  case object Primary extends ComponentVariant { override val value: String = "primary" }
  case object Secondary extends ComponentVariant { override val value: String = "secondary" }
  case object Ghost extends ComponentVariant { override val value: String = "ghost" }

  private val byValue = List(Primary, Secondary, Ghost).map(variant => variant.value -> variant).toMap

  /** 从字符串解析变体。 */
  def fromString(value: String): Option[ComponentVariant] =
    byValue.get(value)

  implicit val encoder: Encoder[ComponentVariant] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[ComponentVariant] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown component variant: $value"))
}

/** 组件可选视觉样式。 */
final case class ComponentStyle(
  variant: Option[ComponentVariant],
  backgroundColor: Option[String],
  textColor: Option[String],
  borderRadius: Option[Double],
  fontSize: Option[Double],
  textScalePercent: Option[Double],
  lockAspectRatio: Option[Double]
)

/** ComponentStyle 编解码。 */
object ComponentStyle {
  implicit val encoder: Encoder[ComponentStyle] = deriveEncoder
  implicit val decoder: Decoder[ComponentStyle] = deriveDecoder
}
