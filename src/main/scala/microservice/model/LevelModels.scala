package microservice.model

final case class Position(
  x: Double,
  y: Double
)

final case class Size(
  width: Double,
  height: Double
)

sealed trait LevelGround {
  def kind: String
}

final case class GroundLine(
  points: List[Position]
) extends LevelGround {
  override val kind: String = "line"
}

final case class GroundBezier(
  controlPoints: List[Position]
) extends LevelGround {
  override val kind: String = "bezier"
}

final case class TerrainVoidSpan(
  id: String,
  startX: Double,
  endX: Double
)

final case class LevelTerrain(
  ceilingBoundary: Option[LevelGround],
  groundBoundary: LevelGround,
  voidSpans: List[TerrainVoidSpan]
)

final case class GameWorld(
  width: Double,
  height: Double,
  gravity: Double
)

final case class BirdInventory(
  basic: Int
)

final case class LevelObstacle(
  id: String,
  material: String,
  position: Position,
  size: Size,
  angle: Option[Double]
)

final case class LevelEnemy(
  id: String,
  enemyType: String,
  position: Position,
  size: Option[Size]
)

final case class LevelData(
  world: GameWorld,
  ground: Option[LevelGround],
  terrain: Option[LevelTerrain],
  birdInventory: BirdInventory,
  obstacles: List[LevelObstacle],
  enemies: List[LevelEnemy]
)

final case class Level(
  id: String,
  title: String,
  description: String,
  tags: List[LevelTag],
  data: LevelData,
  authorId: String,
  status: LevelStatus,
  rejectionReason: Option[String],
  averageRating: Double,
  ratingCount: Int,
  createdAt: String,
  updatedAt: String,
  publishedAt: Option[String]
)

final case class Comment(
  id: String,
  levelId: String,
  userId: String,
  content: String,
  createdAt: String
)

final case class Rating(
  id: String,
  levelId: String,
  playerId: String,
  score: Int,
  createdAt: String,
  updatedAt: String
)
