package microservice.ui.objects

import io.circe.syntax._
import io.circe.{Decoder, Encoder, HCursor, Json}

sealed trait ComponentPositionUnit {
  def value: String
}

object ComponentPositionUnit {
  case object Percent extends ComponentPositionUnit { override val value: String = "percent" }
  case object Px extends ComponentPositionUnit { override val value: String = "px" }

  private val byValue = List(Percent, Px).map(unit => unit.value -> unit).toMap

  def fromString(value: String): Option[ComponentPositionUnit] =
    byValue.get(value)

  implicit val encoder: Encoder[ComponentPositionUnit] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[ComponentPositionUnit] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown component position unit: $value"))
}

final case class ComponentPosition(
  unit: ComponentPositionUnit,
  x: Double,
  y: Double,
  width: Double,
  height: Double
)

object ComponentPosition {
  implicit val encoder: Encoder[ComponentPosition] = Encoder.instance { position =>
    Json.obj(
      "unit" -> position.unit.asJson,
      "x" -> position.x.asJson,
      "y" -> position.y.asJson,
      "width" -> position.width.asJson,
      "height" -> position.height.asJson
    )
  }

  implicit val decoder: Decoder[ComponentPosition] = Decoder.instance { cursor: HCursor =>
    for {
      unit <- cursor.get[Option[ComponentPositionUnit]]("unit").map(_.getOrElse(ComponentPositionUnit.Percent))
      x <- cursor.get[Double]("x")
      y <- cursor.get[Double]("y")
      width <- cursor.get[Double]("width")
      height <- cursor.get[Double]("height")
    } yield ComponentPosition(unit, x, y, width, height)
  }
}
