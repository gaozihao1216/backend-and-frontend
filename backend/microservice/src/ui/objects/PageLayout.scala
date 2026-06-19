package microservice.ui.objects

/** 页面布局配置：stack / grid / freeform 及列数、间距、内边距等参数。 */
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 页面布局类型：stack/grid/freeform。 */
sealed trait PageLayoutType {
  def value: String
}

/** PageLayoutType 枚举与编解码。 */
object PageLayoutType {
  case object Stack extends PageLayoutType { override val value: String = "stack" }
  case object Grid extends PageLayoutType { override val value: String = "grid" }
  case object Freeform extends PageLayoutType { override val value: String = "freeform" }

  private val byValue = List(Stack, Grid, Freeform).map(layoutType => layoutType.value -> layoutType).toMap

  /** 从字符串解析布局类型。 */
  def fromString(value: String): Option[PageLayoutType] =
    byValue.get(value)

  implicit val encoder: Encoder[PageLayoutType] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[PageLayoutType] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown page layout type: $value"))
}

/** 页面布局配置（类型 + 列数/间距/内边距）。 */
final case class PageLayout(
  `type`: PageLayoutType,
  columns: Option[Int],
  gap: Option[Double],
  padding: Option[Double]
)

/** PageLayout 编解码。 */
object PageLayout {
  implicit val encoder: Encoder[PageLayout] = deriveEncoder
  implicit val decoder: Decoder[PageLayout] = deriveDecoder
}
