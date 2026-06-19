package microservice.bird.routes

import cats.effect.IO
import microservice.bird.api.design.{
  CreateBirdDesignAPIMessage,
  CreateBirdDesignBody,
  DeleteBirdDesignAPIMessage,
  ListBirdDesignsAPIMessage,
  SubmitBirdDesignAPIMessage,
  UpdateBirdDesignAPIMessage,
  UpdateBirdDesignBody
}
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.system.objects.{ApiSuccess, LevelStatus}
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 设计师鸟类设计 HTTP 路由聚合器。
  *
  * HTTP 职责：解析路径/方法/查询参数/请求体，提取 designerId，构造 APIMessage 并调用
  * `runAuthenticated`；不含业务逻辑。
  * 挂载路径：由 ApiRouter 挂载在 `/designer` 前缀下的 `bird-designs` 子路径。
  * 前端代理：`/designer/bird-designs`。
  */
object DesignerBirdRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      // GET /designer/bird-designs?status= — 列出当前设计师的鸟设计，可按状态筛选
      case req @ GET -> Root / "bird-designs" :? StatusQueryParamMatcher(statusValue) =>
        val designerId = AuthMiddleware.userIdFromRequest(req).get
        val status = statusValue.flatMap(LevelStatus.fromString)
        ListBirdDesignsAPIMessage(designerId, status)
          .runAuthenticated(designerId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(designs => ApiSuccess(designs))))

      // POST /designer/bird-designs — 创建新鸟设计
      case req @ POST -> Root / "bird-designs" =>
        val designerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[CreateBirdDesignBody].flatMap { body =>
          CreateBirdDesignAPIMessage(designerId, body)
            .runAuthenticated(designerId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(design => ApiSuccess(design)), successStatus = Status.Created))
        }

      // PUT /designer/bird-designs/:designId — 更新鸟设计
      case req @ PUT -> Root / "bird-designs" / designId =>
        val designerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[UpdateBirdDesignBody].flatMap { body =>
          UpdateBirdDesignAPIMessage(designerId, designId, body)
            .runAuthenticated(designerId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(design => ApiSuccess(design))))
        }

      // DELETE /designer/bird-designs/:designId — 删除草稿鸟设计
      case req @ DELETE -> Root / "bird-designs" / designId =>
        val designerId = AuthMiddleware.userIdFromRequest(req).get
        DeleteBirdDesignAPIMessage(designerId, designId)
          .runAuthenticated(designerId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(design => ApiSuccess(design))))

      // POST /designer/bird-designs/:designId/submit — 提交鸟设计审核
      case req @ POST -> Root / "bird-designs" / designId / "submit" =>
        val designerId = AuthMiddleware.userIdFromRequest(req).get
        SubmitBirdDesignAPIMessage(designerId, designId)
          .runAuthenticated(designerId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission)), successStatus = Status.Created))
    }

  /** 可选 status 查询参数解码器，用于 ListBirdDesigns 筛选。 */
  private object StatusQueryParamMatcher extends OptionalQueryParamDecoderMatcher[String]("status")
}
