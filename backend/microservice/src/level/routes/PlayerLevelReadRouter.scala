package microservice.level.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.level.api._
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 玩家侧只读 API：已发布关卡列表/详情、评论列表、收藏列表。 */
private[routes] object PlayerLevelReadRouter {
  import PlayerLevelRouteSupport.{sortParam, tagParam}

  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "levels" =>
        val playerId = AuthMiddleware.userIdFromRequest(req).get
        tagParam(req) match {
          case Right(tag) =>
            GetPublishedLevelsAPIMessage(playerId, tag, sortParam(req))
              .runAuthenticated(playerId, databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(levels => ApiSuccess(levels))))
          case Left(error) =>
            HttpError.toResponse(error)
        }

      case req @ GET -> Root / "levels" / levelId =>
        val playerId = AuthMiddleware.userIdFromRequest(req).get
        GetPublishedLevelAPIMessage(playerId, levelId)
          .runAuthenticated(playerId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(level => ApiSuccess(level))))

      case req @ GET -> Root / "levels" / levelId / "comments" =>
        val playerId = AuthMiddleware.userIdFromRequest(req).get
        GetLevelCommentsAPIMessage(playerId, levelId)
          .runAuthenticated(playerId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(comments => ApiSuccess(comments))))

      case req @ GET -> Root / "favorites" =>
        val playerId = AuthMiddleware.userIdFromRequest(req).get
        GetFavoriteLevelsAPIMessage(playerId)
          .runAuthenticated(playerId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(favorites => ApiSuccess(favorites))))
    }
}
