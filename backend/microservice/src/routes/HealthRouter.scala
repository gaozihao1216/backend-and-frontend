package microservice.routes

import cats.effect.IO
import io.circe.syntax._
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import microservice.system.api.HealthAPIMessage
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityEncoder._
import org.http4s.dsl.io._

/** 系统级健康检查路由。
  *
  * 与业务 APIMessage 不同，健康检查需要给前端 dev proxy、负载均衡和运维探针提供
  * 简单的 `GET /health` 端点，因此按 sample 的结构作为 ApiRouter 里的系统级例外保留。
  */
object HealthRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case GET -> Root / "health" =>
        HealthAPIMessage()
          .run(databaseSession)
          .flatMap {
            case Right(health) => Ok(health.asJson)
            case Left(error)   => HttpError.toResponse(error)
          }
    }
}
