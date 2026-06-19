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

/** 玩家备战 HTTP 路由，前缀 /player/preparation。
  *
  * 定义：备战状态查询、鸟升级/升阶、弹弓升级四条路由。
  * 问题：战前准备涉及钱包扣费与多表状态，需 APIMessage 内事务处理。
  * 作用：解析 path 中 birdType，构造对应 APIMessage 并 runAuthenticated。
  * 关联：preparation 包下 APIMessage；vite proxy /player/preparation。
  */
object PlayerPreparationRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "preparation" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetPreparationStateAPIMessage(userId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))

      case req @ POST -> Root / "preparation" / "birds" / birdType / "upgrade" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        UpgradePreparationBirdAPIMessage(userId, birdType)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))

      case req @ POST -> Root / "preparation" / "birds" / birdType / "ascend" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        AscendPreparationBirdAPIMessage(userId, birdType)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))

      case req @ POST -> Root / "preparation" / "slingshot" / "upgrade" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        UpgradePreparationSlingshotAPIMessage(userId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))
    }
}
