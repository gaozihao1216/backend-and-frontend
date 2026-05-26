package microservice.level

import microservice.core.{ApiEndpoint, ApiPath, POST}
import microservice.model.Rating

final case class RateLevelRequest(
  playerId: String,
  levelId: String,
  score: Int
)

final case class RateLevelResponse(
  rating: Rating
)

sealed trait PlayerRatingApiError extends microservice.core.ApiError

final case class PlayerLevelNotFound(
  override val message: String = "Level not found"
) extends PlayerRatingApiError {
  override val code: String = "LEVEL_NOT_FOUND"
}

final case class LevelNotPublished(
  override val message: String = "Only published levels can be rated"
) extends PlayerRatingApiError {
  override val code: String = "LEVEL_NOT_PUBLISHED"
}

object RateLevelEndpoint extends ApiEndpoint[RateLevelRequest, RateLevelResponse] {
  override val method = POST
  override val path = ApiPath("/player/levels/:levelId/ratings")
  override val name = "RateLevel"
  override val description = "Create or update the current player's rating on a published level."

  val businessLogic: List[String] = List(
    "Only published levels can be rated.",
    "The same player can keep only one rating per level; a later rating updates the previous score.",
    "After each rating write, the level averageRating and ratingCount must be recomputed."
  )
}

trait PlayerRatingService {
  def rateLevel(
    request: RateLevelRequest
  ): Either[PlayerRatingApiError, RateLevelResponse]
}
