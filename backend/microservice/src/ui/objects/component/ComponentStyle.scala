package microservice.ui.objects.component

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

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
