package microservice.level.routes

import cats.effect.IO
import microservice.core.HttpError
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

  def routes(playerRatingService: PlayerRatingService): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "levels" =>
        currentUserId(req) match {
          case Some(playerId) =>
            val result = tagParam(req).flatMap(tag =>
              playerRatingService.getPublishedLevels(GetPublishedLevelsRequest(playerId, tag, sortParam(req)))
            )
            HttpError.fromEither(result.map(levels => ApiSuccess(levels)))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ GET -> Root / "levels" / levelId =>
        currentUserId(req) match {
          case Some(playerId) =>
            HttpError.fromEither(
              playerRatingService.getPublishedLevel(GetPublishedLevelRequest(playerId, levelId)).map(level => ApiSuccess(level))
            )
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ GET -> Root / "levels" / levelId / "comments" =>
        currentUserId(req) match {
          case Some(playerId) =>
            HttpError.fromEither(
              playerRatingService.getLevelComments(GetLevelCommentsRequest(playerId, levelId)).map(comments => ApiSuccess(comments))
            )
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "levels" / levelId / "comments" =>
        currentUserId(req) match {
          case Some(playerId) =>
            req.as[CreateCommentBody].flatMap { body =>
              HttpError.fromEither(
                playerRatingService
                  .createComment(CreateCommentRequest(playerId, levelId, body.content))
                  .map(comment => ApiSuccess(comment)),
                successStatus = Status.Created
              )
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ GET -> Root / "favorites" =>
        currentUserId(req) match {
          case Some(playerId) =>
            HttpError.fromEither(
              playerRatingService.getFavoriteLevels(GetFavoriteLevelsRequest(playerId)).map(favorites => ApiSuccess(favorites))
            )
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "levels" / levelId / "favorite" =>
        currentUserId(req) match {
          case Some(playerId) =>
            HttpError.fromEither(
              playerRatingService.favoriteLevel(FavoriteLevelRequest(playerId, levelId)).map(favorite => ApiSuccess(favorite)),
              successStatus = Status.Created
            )
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ DELETE -> Root / "levels" / levelId / "favorite" =>
        currentUserId(req) match {
          case Some(playerId) =>
            HttpError.fromEither(
              playerRatingService.unfavoriteLevel(FavoriteLevelRequest(playerId, levelId)).map(favorite => ApiSuccess(favorite))
            )
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

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
