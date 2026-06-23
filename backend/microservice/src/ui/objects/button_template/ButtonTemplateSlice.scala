package microservice.ui.objects.button_template

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 九宫格切片边距（top/right/bottom/left）。 */
final case class ButtonTemplateSlice(
  top: Double,
  right: Double,
  bottom: Double,
  left: Double
)

/** ButtonTemplateSlice 编解码。 */
private[ui] object ButtonTemplateSlice {
  implicit val encoder: Encoder[ButtonTemplateSlice] = deriveEncoder
  implicit val decoder: Decoder[ButtonTemplateSlice] = deriveDecoder
}
