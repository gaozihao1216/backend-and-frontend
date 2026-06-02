package microservice.level.routes

import cats.effect.IO
import microservice.core.{DatabaseSession, HttpError}
import microservice.level.api._
import microservice.system.objects.LevelTag
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object PlayerLevelRouter {
  private def currentUserId(req: org.http4s.Request[IO]): Option[String] =
    req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)

  private def sortParam(req: org.http4s.Request[IO]): String =
    req.params.getOrElse("sort", "newest")

  private def tagParam(req: org.http4s.Request[IO]): Either[HttpError, Option[LevelTag]] =
    req.params.get("tag") match {
      case None => Right(None)
      case Some(value) =>
        LevelTag.fromString(value).map(tag => Right(Some(tag))).getOrElse(
          Left(HttpError.badRequest("INVALID_LEVEL_TAG", s"Unknown level tag: $value"))
        )
    }

  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "levels" =>
        currentUserId(req) match {
          case Some(playerId) =>
            tagParam(req) match {
              case Right(tag) =>
                GetPublishedLevelsAPIMessage(playerId, tag, sortParam(req))
                  .run(databaseSession)
                  .flatMap(result => HttpError.fromEither(result.map(levels => ApiSuccess(levels))))
              case Left(error) =>
                HttpError.toResponse(error)
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ GET -> Root / "levels" / levelId =>
        currentUserId(req) match {
          case Some(playerId) =>
            GetPublishedLevelAPIMessage(playerId, levelId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(level => ApiSuccess(level))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ GET -> Root / "levels" / levelId / "comments" =>
        currentUserId(req) match {
          case Some(playerId) =>
            GetLevelCommentsAPIMessage(playerId, levelId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(comments => ApiSuccess(comments))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

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

      case req @ GET -> Root / "favorites" =>
        currentUserId(req) match {
          case Some(playerId) =>
            GetFavoriteLevelsAPIMessage(playerId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(favorites => ApiSuccess(favorites))))
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
        val playerId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        playerId match {
          case Some(currentPlayerId) =>
            req.as[RateLevelBody].flatMap { body =>
              RateLevelAPIMessage(currentPlayerId, levelId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(rating => ApiSuccess(rating)), successStatus = Status.Created))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
