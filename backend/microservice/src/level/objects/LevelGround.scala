package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.syntax._
import io.circe.{Decoder, DecodingFailure, Encoder, HCursor, Json}

sealed trait LevelGround {
  def `type`: String
}

final case class GroundLine(points: List[Position]) extends LevelGround {
  override val `type`: String = "line"
}

final case class GroundBezier(controlPoints: List[Position]) extends LevelGround {
  override val `type`: String = "bezier"
}

object GroundLine {
  implicit val encoder: Encoder[GroundLine] = deriveEncoder
  implicit val decoder: Decoder[GroundLine] = deriveDecoder
}

object GroundBezier {
  implicit val encoder: Encoder[GroundBezier] = deriveEncoder
  implicit val decoder: Decoder[GroundBezier] = deriveDecoder
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
