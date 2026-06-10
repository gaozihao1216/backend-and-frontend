package microservice.level.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{HttpError}
import microservice.level.api._
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 玩家侧只读 API：已发布关卡列表/详情、评论列表、收藏列表。
  *
  * 实现：解析 query 与 path 参数 → 对应 Get*APIMessage。
  * 关联：GET /player/levels 供玩家地图与列表页；评论/收藏供社区与详情页。
  */
private[routes] object PlayerLevelReadRouter {
  import PlayerLevelRouteSupport._

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

      case req @ GET -> Root / "favorites" =>
        currentUserId(req) match {
          case Some(playerId) =>
            GetFavoriteLevelsAPIMessage(playerId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(favorites => ApiSuccess(favorites))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
