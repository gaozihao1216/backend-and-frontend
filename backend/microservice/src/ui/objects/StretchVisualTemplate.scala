package microservice.ui.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

sealed abstract class StretchVisualTemplateKind(val value: String)

object StretchVisualTemplateKind {
  case object Panel extends StretchVisualTemplateKind("panel")
  case object Pattern extends StretchVisualTemplateKind("pattern")

  val values: List[StretchVisualTemplateKind] = List(Panel, Pattern)

  def fromString(value: String): Option[StretchVisualTemplateKind] =
    values.find(_.value == value)

  implicit val encoder: Encoder[StretchVisualTemplateKind] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[StretchVisualTemplateKind] =
    Decoder.decodeString.emap(value => fromString(value).toRight(s"Unknown stretch visual template kind: $value"))
}

final case class StretchVisualTemplate(
  id: String,
  name: String,
  sourceDataUrl: String,
  kind: StretchVisualTemplateKind,
  createdAt: Option[String],
  updatedAt: Option[String]
)

object StretchVisualTemplate {
  implicit val encoder: Encoder[StretchVisualTemplate] = deriveEncoder
  implicit val decoder: Decoder[StretchVisualTemplate] = deriveDecoder
}
