package microservice.ui.objects

/** 组件在页面上的矩形区域：支持 percent 或 px 单位。 */
import io.circe.syntax._
import io.circe.{Decoder, Encoder, HCursor, Json}

/** 位置单位：percent 或 px。 */
sealed trait ComponentPositionUnit {
  def value: String
}

/** ComponentPositionUnit 枚举与编解码。 */
object ComponentPositionUnit {
  case object Percent extends ComponentPositionUnit { override val value: String = "percent" }
  case object Px extends ComponentPositionUnit { override val value: String = "px" }

  private val byValue = List(Percent, Px).map(unit => unit.value -> unit).toMap

  /** 从字符串解析位置单位。 */
  def fromString(value: String): Option[ComponentPositionUnit] =
    byValue.get(value)

  implicit val encoder: Encoder[ComponentPositionUnit] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[ComponentPositionUnit] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown component position unit: $value"))
}

/** 组件矩形区域（单位 + x/y/width/height）。 */
final case class ComponentPosition(
  unit: ComponentPositionUnit,
  x: Double,
  y: Double,
  width: Double,
  height: Double
)

/** ComponentPosition 编解码（unit 默认 percent）。 */
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
