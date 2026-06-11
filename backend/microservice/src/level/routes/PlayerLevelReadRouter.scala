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

  /** 注册玩家侧 GET 路由；所有端点均要求 x-user-id 且角色为 Player。 */
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      // ── 已发布关卡列表（支持 tag 筛选与 sort 排序） ────────────────────────
      case req @ GET -> Root / "levels" =>
        currentUserId(req) match {
          case Some(playerId) =>
            tagParam(req) match {
              case Right(tag) =>
                GetPublishedLevelsAPIMessage(playerId, tag, sortParam(req))
                  .run(databaseSession)
                  .flatMap(result => HttpError.fromEither(result.map(levels => ApiSuccess(levels))))
              case Left(error) =>
                // tag 参数非法时返回 400 INVALID_LEVEL_TAG
                HttpError.toResponse(error)
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // ── 单个已发布关卡详情 ───────────────────────────────────────────────────
      case req @ GET -> Root / "levels" / levelId =>
        currentUserId(req) match {
          case Some(playerId) =>
            GetPublishedLevelAPIMessage(playerId, levelId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(level => ApiSuccess(level))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // ── 关卡评论列表（仅对已发布关卡） ─────────────────────────────────────
      case req @ GET -> Root / "levels" / levelId / "comments" =>
        currentUserId(req) match {
          case Some(playerId) =>
            GetLevelCommentsAPIMessage(playerId, levelId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(comments => ApiSuccess(comments))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // ── 当前玩家的收藏列表（含关卡详情） ───────────────────────────────────
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
