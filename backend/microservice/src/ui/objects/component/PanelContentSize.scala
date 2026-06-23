package microservice.ui.objects.component

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder, Json}

/** 面板内容区域相对尺寸（宽/高百分比）。 */
final case class PanelContentSize(
  widthPercent: Double,
  heightPercent: Double
)

/** PanelContentSize 编解码。 */
private[ui] object PanelContentSize {
  implicit val encoder: Encoder[PanelContentSize] =
    Encoder.forProduct2("widthPercent", "heightPercent")(size => (size.widthPercent, size.heightPercent))

  implicit val decoder: Decoder[PanelContentSize] =
    Decoder.forProduct2("widthPercent", "heightPercent")(PanelContentSize.apply)
}
