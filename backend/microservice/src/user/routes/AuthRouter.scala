package microservice.user.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{HttpError}
import microservice.user.api.{BindBackendUserAPIMessage, GetBackendUsersAPIMessage}
import microservice.user.body.BindBackendUserRequest
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 用户身份（identity）层的 HTTP 路由。
  *
  * 定义：/auth 前缀下 HttpRoutes，解析 HTTP 并调用 user.api APIMessage。
  * 问题：bind 与 backend-users 为公开路由，需在 ApiRouter 中排除 AuthMiddleware。
  * 作用：JSON 编解码 + ApiSuccess/HttpError 统一响应包装。
  * 关联：[[ApiRouter]] 挂载 /auth；vite proxy /auth；[[BindBackendUserAPIMessage]] 等。
  */
object AuthRouter {

  /** 注册 /auth 下的所有路由；databaseSession 传给每个 APIMessage.run 以开启事务。 */
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {

      // GET /auth/backend-users — 列出所有后端用户，供前端「绑定演示账号」面板使用
      case GET -> Root / "backend-users" =>
        GetBackendUsersAPIMessage()
          .run(databaseSession)
          .flatMap(result =>
            // 成功时包装为 ApiSuccess(List[BackendUser])，失败时 HttpError.fromEither 返回 4xx JSON
            HttpError.fromEither(result.map(users => ApiSuccess(users)))
          )

      // POST /auth/bind — 将前端 localStorage 中的本地身份绑定到后端 UserRow
      case req @ POST -> Root / "bind" =>
        // 解析 JSON body 为 BindBackendUserRequest（localUserId, nickname, role）
        req.as[BindBackendUserRequest].flatMap { input =>
          BindBackendUserAPIMessage(input)
            .run(databaseSession)
            .flatMap(result =>
              // 201 Created：新建或首次解析到用户时语义上更接近「创建资源」
              HttpError.fromEither(result.map(user => ApiSuccess(user)), successStatus = Status.Created)
            )
        }
    }
}
