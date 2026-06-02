package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class LevelObstacle(
  id: String,
  material: String,
  position: Position,
  size: Size,
  angle: Option[Double]
)

object LevelObstacle {
  implicit val encoder: Encoder[LevelObstacle] = deriveEncoder
  implicit val decoder: Decoder[LevelObstacle] = deriveDecoder
}
