package microservice.auth.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{HttpError}
import microservice.auth.api.{BindBackendUserAPIMessage, BindBackendUserRequest, GetBackendUsersAPIMessage}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 认证相关 HTTP 入口：前端 mock 登录后绑定后端用户。
  *
  * 实现：解析 JSON body / 无参 GET，构造 APIMessage 并 run。
  * 关联：BindBackendUser 对应 frontend BindBackendUserApi；返回 BackendUser 供前端保存 apiUserId。
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
