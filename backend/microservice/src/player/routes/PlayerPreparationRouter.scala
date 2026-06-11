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

/** 玩家备战 HTTP 入口，前缀 /player/preparation。
  *
  * 实现：查询鸟/弹弓升级状态，以及鸟升级、升阶、弹弓升级操作。
  * 关联：frontend 备战页；消耗钱包金币/碎片，读写 player_bird_upgrades / player_slingshot_upgrades。
  */
object PlayerPreparationRouter {
  /** 注册 /player/preparation 下的路由；业务逻辑委托 PlayerPreparationService。 */
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      // GET /player/preparation — 获取当前用户全部鸟与弹弓备战状态
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

      // POST /player/preparation/birds/:birdType/upgrade — 消耗金币提升鸟等级
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

      // POST /player/preparation/birds/:birdType/ascend — 消耗碎片提升鸟阶位（解锁更高 tier 技能）
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

      // POST /player/preparation/slingshot/upgrade — 消耗金币提升弹弓等级
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
