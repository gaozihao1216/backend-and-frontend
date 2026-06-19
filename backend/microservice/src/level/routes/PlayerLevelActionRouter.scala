package microservice.level.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.level.api.player.action._
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 玩家侧写操作 HTTP 路由。
  *
  * HTTP 职责：解析 POST/DELETE 与请求体，构造 action APIMessage；不含业务逻辑。
  * 挂载路径：`/player/levels/:id/comments|favorite|ratings`（由 PlayerLevelRouter 合并）。
  * 为何不写业务逻辑：评论/收藏/评分规则在 APIMessage.plan 中统一校验与持久化。
  */
private[routes] object PlayerLevelActionRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ POST -> Root / "levels" / levelId / "comments" =>
        val playerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[CreateCommentBody].flatMap { body =>
          CreateCommentAPIMessage(playerId, levelId, body)
            .runAuthenticated(playerId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(comment => ApiSuccess(comment)), successStatus = Status.Created))
        }

      case req @ POST -> Root / "levels" / levelId / "favorite" =>
        val playerId = AuthMiddleware.userIdFromRequest(req).get
        FavoriteLevelAPIMessage(playerId, levelId)
          .runAuthenticated(playerId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(favorite => ApiSuccess(favorite)), successStatus = Status.Created))

      case req @ DELETE -> Root / "levels" / levelId / "favorite" =>
        val playerId = AuthMiddleware.userIdFromRequest(req).get
        UnfavoriteLevelAPIMessage(playerId, levelId)
          .runAuthenticated(playerId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(favorite => ApiSuccess(favorite))))

      case req @ POST -> Root / "levels" / levelId / "ratings" =>
        val playerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[RateLevelBody].flatMap { body =>
          RateLevelAPIMessage(playerId, levelId, body)
            .runAuthenticated(playerId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(rating => ApiSuccess(rating)), successStatus = Status.Created))
        }
    }
}
