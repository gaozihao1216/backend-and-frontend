package microservice.level.api

import cats.effect.IO
import microservice.core.HttpError
import microservice.level.objects.{Favorite, FavoriteWithLevel, Level, LevelComment, Rating}
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class RateLevelRequest(
  playerId: String,
  levelId: String,
  score: Int
)

object RateLevelRequest {
  implicit val encoder: Encoder[RateLevelRequest] = deriveEncoder
  implicit val decoder: Decoder[RateLevelRequest] = deriveDecoder
}

final case class RateLevelBody(
  score: Int
)

object RateLevelBody {
  implicit val encoder: Encoder[RateLevelBody] = deriveEncoder
  implicit val decoder: Decoder[RateLevelBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, RateLevelBody] = jsonOf
}

final case class RateLevelResponse(
  rating: Rating
)

object RateLevelResponse {
  implicit val encoder: Encoder[RateLevelResponse] = deriveEncoder
  implicit val decoder: Decoder[RateLevelResponse] = deriveDecoder
}

sealed trait PlayerRatingApiError {
  def toHttpError: HttpError
}

object PlayerRatingService {
  final case class LevelMissing(levelId: String) extends PlayerRatingApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: $levelId")
  }

  final case class LevelNotPublished(levelId: String) extends PlayerRatingApiError {
    override def toHttpError: HttpError =
      HttpError.conflict("LEVEL_NOT_PUBLISHED", s"Only published levels can be rated: $levelId")
  }

  final case class InvalidScore(score: Int) extends PlayerRatingApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("INVALID_RATING_SCORE", s"score must be between 1 and 5, got $score")
  }
}

trait PlayerRatingService {
  def getPublishedLevels(request: GetPublishedLevelsRequest): Either[HttpError, List[Level]]
  def getPublishedLevel(request: GetPublishedLevelRequest): Either[HttpError, Level]
  def getLevelComments(request: GetLevelCommentsRequest): Either[HttpError, List[LevelComment]]
  def createComment(request: CreateCommentRequest): Either[HttpError, LevelComment]
  def getFavoriteLevels(request: GetFavoriteLevelsRequest): Either[HttpError, List[FavoriteWithLevel]]
  def favoriteLevel(request: FavoriteLevelRequest): Either[HttpError, Favorite]
  def unfavoriteLevel(request: FavoriteLevelRequest): Either[HttpError, Favorite]
  def rateLevel(request: RateLevelRequest): Either[HttpError, RateLevelResponse]
}

object RateLevelEndpoint {
  val name: String = "RateLevel"
  val method: String = "POST"
  val path: String = "/player/levels/:levelId/ratings"
  val businessLogic: String =
    "玩家只能给已发布关卡评分，同一玩家重复评分会覆盖旧记录，并立即回写平均分和评分人数。"
}
