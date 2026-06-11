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

/** 玩家侧写操作：评论、收藏、评分等 mutating API。
  *
  * 实现：POST/DELETE 解析 path 与 body → *APIMessage；与 PlayerLevelReadRouter 互补。
  * 关联：RateLevelAPIMessage 更新 Level 聚合评分；Favorite/Comment 供社区与详情页。
  */
private[routes] object PlayerLevelActionRouter {
  import PlayerLevelRouteSupport._

  /** 注册玩家侧 POST/DELETE 路由；写操作成功时多数返回 201 Created。 */
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      // ── 发表评论 ─────────────────────────────────────────────────────────────
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

      // ── 收藏关卡（幂等：已收藏则返回现有记录） ─────────────────────────────
      case req @ POST -> Root / "levels" / levelId / "favorite" =>
        currentUserId(req) match {
          case Some(playerId) =>
            FavoriteLevelAPIMessage(playerId, levelId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(favorite => ApiSuccess(favorite)), successStatus = Status.Created))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // ── 取消收藏 ─────────────────────────────────────────────────────────────
      case req @ DELETE -> Root / "levels" / levelId / "favorite" =>
        currentUserId(req) match {
          case Some(playerId) =>
            UnfavoriteLevelAPIMessage(playerId, levelId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(favorite => ApiSuccess(favorite))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // ── 评分（1–5 分，重复评分则更新） ─────────────────────────────────────
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
