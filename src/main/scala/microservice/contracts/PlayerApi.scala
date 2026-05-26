package microservice.contracts

import microservice.framework.{ApiEndpoint, ApiError, ConflictError, NotFoundError}
import microservice.framework.HttpMethod
import microservice.model.{PublishedLevelsSort, Rating}

final case class RateLevelRequest(
  playerId: String,
  levelId: String,
  score: Int
)

sealed trait PlayerApiError extends ApiError

final case class PlayerLevelNotFound(
  override val message: String = "Level not found"
) extends PlayerApiError {
  override val code: String = NotFoundError("LEVEL_NOT_FOUND", message).code
}

final case class LevelNotPublished(
  override val message: String = "Only published levels can be rated"
) extends PlayerApiError {
  override val code: String = ConflictError("LEVEL_NOT_PUBLISHED", message).code
}

object PlayerApi {
  val rateLevel: ApiEndpoint[RateLevelRequest, Rating, PlayerApiError] =
    ApiEndpoint(
      name = "RateLevel",
      method = HttpMethod.Post,
      path = "/player/levels/:levelId/ratings",
      description = "Create or update the authenticated player's rating for a published level.",
      businessRules = List(
        "Reject rating attempts when the target level is not published.",
        "Use one rating row per player and level; a second rating updates the existing score.",
        "Refresh averageRating and ratingCount on the level after each rating write."
      )
    )
}

trait PlayerService[F[_]] {
  def rateLevel(
    request: RateLevelRequest
  ): F[Either[PlayerApiError, Rating]]
}
