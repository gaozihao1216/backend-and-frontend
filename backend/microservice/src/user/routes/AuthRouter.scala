package microservice.user.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{HttpError}
import microservice.user.api.{BindBackendUserAPIMessage, BindBackendUserRequest, GetBackendUsersAPIMessage}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 用户身份相关 HTTP 入口（URL 前缀仍为 /auth，兼容前端）。
  *
  * 实现：解析 JSON body / 无参 GET，构造 user 模块 APIMessage 并 run。
  * 关联：BindBackendUser 对应 frontend BindBackendUserApi；GetBackendUsers 供绑定面板列出演示账号。
  * 模块：与 UserRouter（/users/profile）同属 user 包，分别负责 identity 与 profile。
  */
object AuthRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case GET -> Root / "backend-users" =>
        GetBackendUsersAPIMessage()
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(users => ApiSuccess(users))))

      case req @ POST -> Root / "bind" =>
        req.as[BindBackendUserRequest].flatMap { input =>
          BindBackendUserAPIMessage(input)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(user => ApiSuccess(user)), successStatus = Status.Created))
        }
    }
}
