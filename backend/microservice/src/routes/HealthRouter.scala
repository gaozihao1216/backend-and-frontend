package microservice.routes

import cats.effect.IO
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import microservice.system.api.HealthAPIMessage
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.dsl.io._

/** 健康检查路由：供前端、负载均衡与运维探测后端是否存活。
  *
  * == 挂载路径 ==
  * 在 [[ApiRouter]] 中注册为 `"/" -> HealthRouter.routes(...)`，
  * 本对象内匹配 `GET /health`，故完整路径为 **`GET /health`**。
  *
  * == 标准请求处理流水线（本路由为全库范例） ==
  * ```
  * HTTP Request
  *     → Route 模式匹配（method + path）
  *     → 构造 APIMessage（无参 case class）
  *     → message.run(databaseSession)   // 事务边界
  *     → HttpError.fromEither(...)      // Either → Response
  *     → JSON { "success": true, "data": { ... } }
  * ```
  *
  * == 业务逻辑 ==
  * 委托 [[HealthAPIMessage]]：返回数据库模式描述、schema 名等元信息，
  * 用于确认 API 进程与 [[DatabaseSession]] 均已就绪。
  *
  * == 鉴权 ==
  * 属于公开路由，不经过 [[microservice.infrastructure.http.AuthMiddleware]]。
  *
  * == 关联 ==
  * - [[microservice.infrastructure.api.APIMessage]]
  * - [[microservice.infrastructure.http.HttpError.fromEither]]
  * - 前端 dev proxy：`/health` → `localhost:3000`
  */
object HealthRouter {
  /** 返回仅含 `GET /health` 的 `HttpRoutes`。 */
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case GET -> Root / "health" =>
        HealthAPIMessage()
          .run(databaseSession)
          .flatMap(result =>
            // Right：包装 ApiSuccess(HealthResponse) 后编码为 200 JSON
            // Left：走统一错误 JSON（Health API 当前不会产生 Left，保留对称写法）
            HttpError.fromEither(result.map(health => ApiSuccess(health)))
          )
    }
}
