package microservice.infrastructure.http

import cats.data.{Kleisli, OptionT}
import cats.effect.IO
import org.http4s._
import org.typelevel.ci._

/** 演示鉴权中间件：要求请求携带 `x-user-id`，路由通过 [[userIdFromRequest]] 读取。 */
object AuthMiddleware {
  def userIdFromRequest(req: Request[IO]): Option[String] =
    req.headers.get(CIString("x-user-id")).map(_.head.value.trim).filter(_.nonEmpty)

  /** 包装受保护路由：缺少 x-user-id 时直接 401，不再进入业务 handler。 */
  def requireUserId(routes: HttpRoutes[IO]): HttpRoutes[IO] =
    Kleisli { req =>
      userIdFromRequest(req) match {
        case Some(_) =>
          routes.run(req)
        case None =>
          OptionT.liftF(HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header")))
      }
    }
}
