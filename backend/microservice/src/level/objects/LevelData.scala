package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class LevelData(
  world: GameWorld,
  ground: Option[LevelGround],
  terrain: Option[LevelTerrain],
  birdInventory: BirdInventory,
  obstacles: List[LevelObstacle],
  enemies: List[LevelEnemy],
  backgroundTemplateId: Option[String] = None
)

object LevelData {
  implicit val encoder: Encoder[LevelData] = deriveEncoder
  implicit val decoder: Decoder[LevelData] = deriveDecoder
}
