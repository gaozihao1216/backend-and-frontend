package microservice.level.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{HttpError}
import microservice.level.api._
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

private[routes] object PlayerLevelActionRouter {
  import PlayerLevelRouteSupport._

  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ POST -> Root / "levels" / levelId / "comments" =>
        currentUserId(req) match {
          case Some(playerId) =>
            req.as[CreateCommentBody].flatMap { body =>
              CreateCommentAPIMessage(playerId, levelId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(comment => ApiSuccess(comment)), successStatus = Status.Created))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "levels" / levelId / "favorite" =>
        currentUserId(req) match {
          case Some(playerId) =>
            FavoriteLevelAPIMessage(playerId, levelId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(favorite => ApiSuccess(favorite)), successStatus = Status.Created))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ DELETE -> Root / "levels" / levelId / "favorite" =>
        currentUserId(req) match {
          case Some(playerId) =>
            UnfavoriteLevelAPIMessage(playerId, levelId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(favorite => ApiSuccess(favorite))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "levels" / levelId / "ratings" =>
        currentUserId(req) match {
          case Some(playerId) =>
            req.as[RateLevelBody].flatMap { body =>
              RateLevelAPIMessage(playerId, levelId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(rating => ApiSuccess(rating)), successStatus = Status.Created))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
