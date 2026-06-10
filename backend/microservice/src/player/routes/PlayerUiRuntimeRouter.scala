package microservice.player.routes

import cats.effect.IO
import io.circe.Decoder
import io.circe.generic.semiauto._
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import microservice.level.routes.PlayerLevelRouteSupport
import microservice.player.runtime.PlayerUiRuntimeService
import microservice.system.objects.ApiSuccess
import microservice.ui.api.pages.GetSharedLevelMapPageAPIMessage
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

final case class UiActionRequest(params: Map[String, String] = Map.empty)

object UiActionRequest {
  implicit val decoder: Decoder[UiActionRequest] = deriveDecoder
}

/** 玩家 UI 运行时数据：动态页面所需的关卡地图、商店/签到等 apiKey 数据。
  *
  * 实现：部分走 ui 模块 APIMessage（level-map）；部分直接调用 PlayerUiRuntimeService（/ui/data/:apiKey）。
  * 关联：frontend lib/ui-runtime 与 DynamicPageRenderer；配置来源为总监 UiCustomization + player 运行时表。
  */
object PlayerUiRuntimeRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "ui" / "level-map" =>
        PlayerLevelRouteSupport.currentUserId(req) match {
          case Some(userId) =>
            GetSharedLevelMapPageAPIMessage(userId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ GET -> Root / "ui" / "data" / apiKey =>
        PlayerLevelRouteSupport.currentUserId(req) match {
          case Some(userId) =>
            databaseSession.withTransaction { connection =>
              IO.pure(
                PlayerUiRuntimeService.getData(connection, userId, apiKey, req.uri.query.params)
              ).flatMap { result =>
                HttpError.fromEither(result.map(json => ApiSuccess(json)))
              }
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "ui" / "actions" / apiKey =>
        PlayerLevelRouteSupport.currentUserId(req) match {
          case Some(userId) =>
            req.as[UiActionRequest].flatMap { body =>
              databaseSession.withTransaction { connection =>
                IO.pure(
                  PlayerUiRuntimeService.executeAction(connection, userId, apiKey, body.params)
                ).flatMap { result =>
                  HttpError.fromEither(result.map(json => ApiSuccess(json)))
                }
              }
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
