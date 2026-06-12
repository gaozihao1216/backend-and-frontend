package microservice.level.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.level.api.{CreateLevelAPIMessage, CreateLevelBody, SubmitLevelAPIMessage, SubmitLevelBody}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 设计师关卡 HTTP 入口：创建 draft 关卡、提交审核。 */
object DesignerLevelRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ POST -> Root / "levels" =>
        val designerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[CreateLevelBody].flatMap { body =>
          CreateLevelAPIMessage(designerId, body)
            .runAuthenticated(designerId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(level => ApiSuccess(level)), successStatus = Status.Created))
        }

      case req @ POST -> Root / "submissions" =>
        val designerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[SubmitLevelBody].flatMap { body =>
          SubmitLevelAPIMessage(designerId, body)
            .runAuthenticated(designerId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission)), successStatus = Status.Created))
        }
    }
}
