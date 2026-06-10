package microservice.routes

import cats.effect.IO
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import microservice.system.api.HealthAPIMessage
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.dsl.io._

/** 健康检查路由，供前端与运维探测后端是否存活。
  *
  * 实现：GET /health → HealthAPIMessage.run → ApiSuccess 包装。
  * 关联：演示标准「Route 解析 HTTP → APIMessage 执行业务 → HttpError.fromEither 出响应」流程。
  */
object HealthRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case GET -> Root / "health" =>
        HealthAPIMessage()
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(health => ApiSuccess(health))))
    }
}
