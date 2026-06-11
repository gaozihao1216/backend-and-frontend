package microservice.player.routes

import cats.effect.IO
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.player.api.preparation.{
  AscendPreparationBirdAPIMessage,
  GetPreparationStateAPIMessage,
  UpgradePreparationBirdAPIMessage,
  UpgradePreparationSlingshotAPIMessage
}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 玩家备战 HTTP 入口，前缀 /player/preparation。 */
object PlayerPreparationRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "preparation" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetPreparationStateAPIMessage(userId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))

      case req @ POST -> Root / "preparation" / "birds" / birdType / "upgrade" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        UpgradePreparationBirdAPIMessage(userId, birdType)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))

      case req @ POST -> Root / "preparation" / "birds" / birdType / "ascend" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        AscendPreparationBirdAPIMessage(userId, birdType)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))

      case req @ POST -> Root / "preparation" / "slingshot" / "upgrade" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        UpgradePreparationSlingshotAPIMessage(userId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))
    }
}
