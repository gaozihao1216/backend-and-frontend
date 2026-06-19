package microservice.player.routes

import cats.effect.IO
import io.circe.Decoder
import io.circe.generic.semiauto._
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.player.api.ui.{GetPlayerUiDataAPIMessage, InvokePlayerUiActionAPIMessage}
import microservice.system.objects.ApiSuccess
import microservice.ui.api.pages.{GetPlayerUiPageAPIMessage, GetSharedLevelMapPageAPIMessage}
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** POST /player/ui/actions/:apiKey 的请求体：透传给运行时服务的参数字典。 */
final case class UiActionRequest(params: Map[String, String] = Map.empty)

object UiActionRequest {
  implicit val decoder: Decoder[UiActionRequest] = deriveDecoder
}

/** 玩家 UI 运行时数据：动态页面所需的关卡地图、商店/签到等 apiKey 数据。 */
object PlayerUiRuntimeRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "ui" / "level-map" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetSharedLevelMapPageAPIMessage(userId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))

      case req @ GET -> Root / "ui" / "pages" / pageId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetPlayerUiPageAPIMessage(userId, pageId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))

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
