package microservice.ui.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

sealed trait PageLayoutType {
  def value: String
}

object PageLayoutType {
  case object Stack extends PageLayoutType { override val value: String = "stack" }
  case object Grid extends PageLayoutType { override val value: String = "grid" }
  case object Freeform extends PageLayoutType { override val value: String = "freeform" }

  private val byValue = List(Stack, Grid, Freeform).map(layoutType => layoutType.value -> layoutType).toMap

  def fromString(value: String): Option[PageLayoutType] =
    byValue.get(value)

  implicit val encoder: Encoder[PageLayoutType] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[PageLayoutType] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown page layout type: $value"))
}

final case class PageLayout(
  `type`: PageLayoutType,
  columns: Option[Int],
  gap: Option[Double],
  padding: Option[Double]
)

object PageLayout {
  implicit val encoder: Encoder[PageLayout] = deriveEncoder
  implicit val decoder: Decoder[PageLayout] = deriveDecoder
}
