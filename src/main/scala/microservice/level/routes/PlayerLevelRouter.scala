package microservice.level.routes

import cats.effect.IO
import microservice.core.HttpError
import microservice.level.api.{PlayerRatingService, RateLevelBody, RateLevelRequest}
import microservice.system.objects.ApiSuccess
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
