package microservice.ui.objects.component

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 面板浮动定位：锚定组件、方位与偏移量。 */
final case class PanelFloating(
  anchorComponentId: String,
  placement: String,
  offsetX: Double,
  offsetY: Double
)

/** PanelFloating 编解码。 */
object PanelFloating {
  implicit val encoder: Encoder[PanelFloating] = deriveEncoder
  implicit val decoder: Decoder[PanelFloating] = deriveDecoder
}
