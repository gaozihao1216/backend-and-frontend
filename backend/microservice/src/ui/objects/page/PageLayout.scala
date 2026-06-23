package microservice.ui.objects.page

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 页面布局配置（类型 + 列数/间距/内边距）。 */
final case class PageLayout(
  `type`: PageLayoutType,
  columns: Option[Int],
  gap: Option[Double],
  padding: Option[Double]
)

/** PageLayout 编解码。 */
private[ui] object PageLayout {
  implicit val encoder: Encoder[PageLayout] = deriveEncoder
  implicit val decoder: Decoder[PageLayout] = deriveDecoder
}
