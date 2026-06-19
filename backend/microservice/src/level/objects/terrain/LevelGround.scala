package microservice.level.objects.terrain

import io.circe.syntax._
import io.circe.{Decoder, DecodingFailure, Encoder, HCursor, Json}

/** 地面形状抽象：支持折线（line）与贝塞尔曲线（bezier）两种类型。
  *
  * 实现：自定义 Circe 编解码，按 type 字段多态反序列化为 GroundLine 或 GroundBezier。
  */
trait LevelGround {
  def `type`: String
}

object LevelGround {
  implicit val encoder: Encoder[LevelGround] = Encoder.instance {
    case line: GroundLine =>
      Json.obj("type" -> Json.fromString(line.`type`), "points" -> line.points.asJson)
    case bezier: GroundBezier =>
      Json.obj("type" -> Json.fromString(bezier.`type`), "controlPoints" -> bezier.controlPoints.asJson)
  }

  implicit val decoder: Decoder[LevelGround] = Decoder.instance { cursor: HCursor =>
    cursor.get[String]("type").flatMap {
      case "line" => cursor.get[List[Position]]("points").map(GroundLine.apply)
      case "bezier" => cursor.get[List[Position]]("controlPoints").map(GroundBezier.apply)
      case other => Left(DecodingFailure(s"Unsupported ground type: $other", cursor.history))
    }
  }
}
