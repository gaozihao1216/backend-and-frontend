package coursebackend.services.level.routes

import cats.effect.IO
import coursebackend.HttpError
import coursebackend.services.level.api.{PlayerRatingService, RateLevelBody, RateLevelRequest}
import coursebackend.services.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object PlayerLevelRouter {
  def routes(playerRatingService: PlayerRatingService): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ POST -> Root / "levels" / levelId / "ratings" =>
        val playerId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        playerId match {
          case Some(currentPlayerId) =>
            req.as[RateLevelBody].flatMap { body =>
              HttpError.fromEither(
                playerRatingService
                  .rateLevel(RateLevelRequest(currentPlayerId, levelId, body.score))
                  .map(response => ApiSuccess(response.rating)),
                successStatus = Status.Created
              )
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
