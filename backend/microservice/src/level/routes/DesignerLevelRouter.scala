package microservice.level.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.level.api.design.{CreateLevelAPIMessage, SubmitLevelAPIMessage}
import microservice.level.api.design.body.{CreateLevelBody, SubmitLevelBody}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** HTTP 路由聚合器。
  *
  * HTTP 职责：解析 HTTP 请求，构造 APIMessage，调用 runAuthenticated；不含业务逻辑。
  * 挂载路径：见 ApiRouter 中的前缀配置。
  * 为何不写业务逻辑：业务规则在 APIMessage.plan 中，便于事务与测试。
  */
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
