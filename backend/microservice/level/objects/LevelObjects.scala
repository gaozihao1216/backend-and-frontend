package microservice.level.objects

import microservice.system.objects.{LevelStatus, LevelTag, SubmissionStatus}
import io.circe.generic.semiauto._
import io.circe.syntax._
import io.circe.{Decoder, DecodingFailure, Encoder, HCursor, Json}

final case class Position(
  x: Double,
  y: Double
)

object Position {
  implicit val encoder: Encoder[Position] = deriveEncoder
  implicit val decoder: Decoder[Position] = deriveDecoder
}

final case class Size(
  width: Double,
  height: Double
)

object Size {
  implicit val encoder: Encoder[Size] = deriveEncoder
  implicit val decoder: Decoder[Size] = deriveDecoder
}

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
      case "line" =>
        cursor.get[List[Position]]("points").map(GroundLine.apply)
      case "bezier" =>
        cursor.get[List[Position]]("controlPoints").map(GroundBezier.apply)
      case other =>
        Left(DecodingFailure(s"Unsupported ground type: $other", cursor.history))
    }
  }
}

final case class TerrainVoidSpan(
  id: String,
  startX: Double,
  endX: Double
)

object TerrainVoidSpan {
  implicit val encoder: Encoder[TerrainVoidSpan] = deriveEncoder
  implicit val decoder: Decoder[TerrainVoidSpan] = deriveDecoder
}

final case class LevelTerrain(
  ceilingBoundary: Option[LevelGround],
  groundBoundary: LevelGround,
  voidSpans: List[TerrainVoidSpan]
)

object LevelTerrain {
  implicit val encoder: Encoder[LevelTerrain] = deriveEncoder
  implicit val decoder: Decoder[LevelTerrain] = deriveDecoder
}

final case class GameWorld(
  width: Double,
  height: Double,
  gravity: Double
)

object GameWorld {
  implicit val encoder: Encoder[GameWorld] = deriveEncoder
  implicit val decoder: Decoder[GameWorld] = deriveDecoder
}

final case class BirdInventory(
  basic: Int
)

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

object Level {
  implicit val encoder: Encoder[Level] = deriveEncoder
  implicit val decoder: Decoder[Level] = deriveDecoder
}

final case class LevelComment(
  id: String,
  levelId: String,
  userId: String,
  content: String,
  createdAt: String
)

object LevelComment {
  implicit val encoder: Encoder[LevelComment] = deriveEncoder
  implicit val decoder: Decoder[LevelComment] = deriveDecoder
}

final case class Rating(
  id: String,
  levelId: String,
  playerId: String,
  score: Int,
  createdAt: String,
  updatedAt: String
)

object Rating {
  implicit val encoder: Encoder[Rating] = deriveEncoder
  implicit val decoder: Decoder[Rating] = deriveDecoder
}

final case class Favorite(
  id: String,
  levelId: String,
  userId: String,
  createdAt: String
)

object Favorite {
  implicit val encoder: Encoder[Favorite] = deriveEncoder
  implicit val decoder: Decoder[Favorite] = deriveDecoder
}

final case class Submission(
  id: String,
  levelId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String]
)

object Submission {
  implicit val encoder: Encoder[Submission] = deriveEncoder
  implicit val decoder: Decoder[Submission] = deriveDecoder
}

final case class SubmissionWithLevel(
  id: String,
  levelId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String],
  level: Level
)

object SubmissionWithLevel {
  def from(submission: Submission, level: Level): SubmissionWithLevel =
    SubmissionWithLevel(
      submission.id,
      submission.levelId,
      submission.submitterId,
      submission.status,
      submission.reviewerId,
      submission.reviewNote,
      submission.submittedAt,
      submission.reviewedAt,
      level
    )

  implicit val encoder: Encoder[SubmissionWithLevel] = deriveEncoder
  implicit val decoder: Decoder[SubmissionWithLevel] = deriveDecoder
}

final case class FavoriteWithLevel(
  id: String,
  levelId: String,
  userId: String,
  createdAt: String,
  level: Level
)

object FavoriteWithLevel {
  def from(favorite: Favorite, level: Level): FavoriteWithLevel =
    FavoriteWithLevel(favorite.id, favorite.levelId, favorite.userId, favorite.createdAt, level)

  implicit val encoder: Encoder[FavoriteWithLevel] = deriveEncoder
  implicit val decoder: Decoder[FavoriteWithLevel] = deriveDecoder
}
