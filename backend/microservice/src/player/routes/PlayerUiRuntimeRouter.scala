package microservice.player.routes

import cats.effect.IO
import io.circe.Decoder
import io.circe.generic.semiauto._
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.player.api.ui.{GetPlayerUiDataAPIMessage, InvokePlayerUiActionAPIMessage}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 玩家 UI 运行时 HTTP 路由：GET /player/ui/data、POST /player/ui/actions。
  *
  * 页面配置（level-map、pages）由 [[microservice.ui.routes.UiPlayerPageRouter]] 提供，
  * 在 ApiRouter 的 `/player` 前缀下与本服路由合并挂载。
  */
final case class UiActionRequest(params: Map[String, String] = Map.empty)

object UiActionRequest {
  implicit val decoder: Decoder[UiActionRequest] = deriveDecoder
}

object PlayerUiRuntimeRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "ui" / "data" / apiKey =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetPlayerUiDataAPIMessage(userId, apiKey, req.uri.query.params)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))

      case req @ POST -> Root / "ui" / "actions" / apiKey =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[UiActionRequest].flatMap { body =>
          InvokePlayerUiActionAPIMessage(userId, apiKey, body.params)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))
        }
    }
}
