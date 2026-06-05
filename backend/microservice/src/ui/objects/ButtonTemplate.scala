package microservice.ui.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class ButtonTemplateSlice(
  top: Double,
  right: Double,
  bottom: Double,
  left: Double
)

object ButtonTemplateSlice {
  implicit val encoder: Encoder[ButtonTemplateSlice] = deriveEncoder
  implicit val decoder: Decoder[ButtonTemplateSlice] = deriveDecoder
}

final case class ButtonTemplate(
  id: String,
  name: String,
  sourceDataUrl: String,
  slice: ButtonTemplateSlice,
  createdAt: Option[String],
  updatedAt: Option[String]
)

object ButtonTemplate {
  implicit val encoder: Encoder[ButtonTemplate] = deriveEncoder
  implicit val decoder: Decoder[ButtonTemplate] = deriveDecoder
}
