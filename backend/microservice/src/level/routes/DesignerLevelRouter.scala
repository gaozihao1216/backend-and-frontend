package microservice.level.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{HttpError}
import microservice.level.api.{CreateLevelAPIMessage, CreateLevelBody, SubmitLevelAPIMessage, SubmitLevelBody}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 设计师关卡 HTTP 入口：创建 draft 关卡、提交审核。
  *
  * 实现：从 x-user-id 读取 designerId（不信任 body 中的作者字段），解析 JSON 后调用 APIMessage。
  * 关联：POST /designer/levels → CreateLevelAPIMessage；POST /designer/submissions → SubmitLevelAPIMessage。
  */
object DesignerLevelRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ POST -> Root / "levels" =>
        val designerId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        designerId match {
          case Some(currentDesignerId) =>
            req.as[CreateLevelBody].flatMap { body =>
              CreateLevelAPIMessage(currentDesignerId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(level => ApiSuccess(level)), successStatus = Status.Created))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "submissions" =>
        val designerId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        designerId match {
          case Some(currentDesignerId) =>
            req.as[SubmitLevelBody].flatMap { body =>
              SubmitLevelAPIMessage(currentDesignerId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission)), successStatus = Status.Created))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
