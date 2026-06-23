package microservice.ui.objects.component

import io.circe.syntax._
import io.circe.{Decoder, Encoder, HCursor, Json}

/** 组件矩形区域（单位 + x/y/width/height）。 */
final case class ComponentPosition(
  unit: ComponentPositionUnit,
  x: Double,
  y: Double,
  width: Double,
  height: Double
)

/** ComponentPosition 编解码（unit 默认 percent）。 */
private[ui] object ComponentPosition {
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
