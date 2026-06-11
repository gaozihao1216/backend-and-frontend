package microservice.level.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.level.api._
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 玩家侧写操作：评论、收藏、评分等 mutating API。 */
private[routes] object PlayerLevelActionRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ POST -> Root / "levels" / levelId / "comments" =>
        val playerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[CreateCommentBody].flatMap { body =>
          CreateCommentAPIMessage(playerId, levelId, body)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(comment => ApiSuccess(comment)), successStatus = Status.Created))
        }

      case req @ POST -> Root / "levels" / levelId / "favorite" =>
        val playerId = AuthMiddleware.userIdFromRequest(req).get
        FavoriteLevelAPIMessage(playerId, levelId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(favorite => ApiSuccess(favorite)), successStatus = Status.Created))

      case req @ DELETE -> Root / "levels" / levelId / "favorite" =>
        val playerId = AuthMiddleware.userIdFromRequest(req).get
        UnfavoriteLevelAPIMessage(playerId, levelId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(favorite => ApiSuccess(favorite))))

      case req @ POST -> Root / "levels" / levelId / "ratings" =>
        val playerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[RateLevelBody].flatMap { body =>
          RateLevelAPIMessage(playerId, levelId, body)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(rating => ApiSuccess(rating)), successStatus = Status.Created))
        }
    }
}
