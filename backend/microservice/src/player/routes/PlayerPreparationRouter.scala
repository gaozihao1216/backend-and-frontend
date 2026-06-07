package microservice.player.routes

import cats.effect.IO
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import microservice.level.routes.PlayerLevelRouteSupport
import microservice.player.preparation.PlayerPreparationService
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object PlayerPreparationRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "preparation" =>
        PlayerLevelRouteSupport.currentUserId(req) match {
          case Some(userId) =>
            databaseSession.withTransaction { connection =>
              IO.pure(PlayerPreparationService.getState(connection, userId))
                .flatMap { result =>
                  HttpError.fromEither(result.map(response => ApiSuccess(PlayerPreparationService.toJson(response))))
                }
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "preparation" / "birds" / birdType / "upgrade" =>
        PlayerLevelRouteSupport.currentUserId(req) match {
          case Some(userId) =>
            databaseSession.withTransaction { connection =>
              IO.pure(PlayerPreparationService.upgradeBird(connection, userId, birdType))
                .flatMap { result =>
                  HttpError.fromEither(result.map(response => ApiSuccess(PlayerPreparationService.toJson(response))))
                }
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "preparation" / "birds" / birdType / "ascend" =>
        PlayerLevelRouteSupport.currentUserId(req) match {
          case Some(userId) =>
            databaseSession.withTransaction { connection =>
              IO.pure(PlayerPreparationService.ascendBird(connection, userId, birdType))
                .flatMap { result =>
                  HttpError.fromEither(result.map(response => ApiSuccess(PlayerPreparationService.toJson(response))))
                }
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "preparation" / "slingshot" / "upgrade" =>
        PlayerLevelRouteSupport.currentUserId(req) match {
          case Some(userId) =>
            databaseSession.withTransaction { connection =>
              IO.pure(PlayerPreparationService.upgradeSlingshot(connection, userId))
                .flatMap { result =>
                  HttpError.fromEither(result.map(response => ApiSuccess(PlayerPreparationService.toJson(response))))
                }
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
