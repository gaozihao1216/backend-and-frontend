package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class GameWorld(width: Double, height: Double, gravity: Double)

object GameWorld {
  implicit val encoder: Encoder[GameWorld] = deriveEncoder
  implicit val decoder: Decoder[GameWorld] = deriveDecoder
}

final case class BirdInventory(basic: Int)

object BirdInventory {
  implicit val encoder: Encoder[BirdInventory] = deriveEncoder
  implicit val decoder: Decoder[BirdInventory] = deriveDecoder
}

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

final case class LevelEnemy(
  id: String,
  `type`: String,
  position: Position,
  size: Option[Size]
)

object LevelEnemy {
  implicit val encoder: Encoder[LevelEnemy] = deriveEncoder
  implicit val decoder: Decoder[LevelEnemy] = deriveDecoder
}

final case class LevelData(
  world: GameWorld,
  ground: Option[LevelGround],
  terrain: Option[LevelTerrain],
  birdInventory: BirdInventory,
  obstacles: List[LevelObstacle],
  enemies: List[LevelEnemy]
)

object LevelData {
  implicit val encoder: Encoder[LevelData] = deriveEncoder
  implicit val decoder: Decoder[LevelData] = deriveDecoder
}
