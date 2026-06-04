package microservice.ui.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

sealed trait ComponentVariant {
  def value: String
}

object ComponentVariant {
  case object Primary extends ComponentVariant { override val value: String = "primary" }
  case object Secondary extends ComponentVariant { override val value: String = "secondary" }
  case object Ghost extends ComponentVariant { override val value: String = "ghost" }

  private val byValue = List(Primary, Secondary, Ghost).map(variant => variant.value -> variant).toMap

  def fromString(value: String): Option[ComponentVariant] =
    byValue.get(value)

  implicit val encoder: Encoder[ComponentVariant] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[ComponentVariant] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown component variant: $value"))
}

final case class ComponentStyle(
  variant: Option[ComponentVariant],
  backgroundColor: Option[String],
  textColor: Option[String],
  borderRadius: Option[Double]
)

object ComponentStyle {
  implicit val encoder: Encoder[ComponentStyle] = deriveEncoder
  implicit val decoder: Decoder[ComponentStyle] = deriveDecoder
}
