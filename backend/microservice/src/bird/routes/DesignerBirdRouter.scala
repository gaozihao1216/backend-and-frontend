package microservice.bird.routes

import cats.effect.IO
import microservice.bird.api.{
  CreateBirdDesignAPIMessage,
  CreateBirdDesignBody,
  DeleteBirdDesignAPIMessage,
  ListBirdDesignsAPIMessage,
  SubmitBirdDesignAPIMessage,
  UpdateBirdDesignAPIMessage,
  UpdateBirdDesignBody
}
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{ApiSuccess, LevelStatus}
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 设计师鸟类设计 HTTP 入口，挂载在 /designer 前缀下。
  *
  * 路由一览：
  *   GET    /designer/bird-designs          列表（可选 ?status= 筛选）
  *   POST   /designer/bird-designs          创建草稿
  *   PUT    /designer/bird-designs/:id      编辑草稿/被拒设计
  *   DELETE /designer/bird-designs/:id      删除草稿
  *   POST   /designer/bird-designs/:id/submit  提交审核
  *
  * 实现：从 x-user-id 读取 designerId，构造 bird 模块 APIMessage；审核在 AdminRouter /admin/bird-submissions 处理。
  * 关联：frontend DesignerBirdLabPage；总监在 DirectorBirdSkillLab 配置已发布鸟的技能。
  */
object DesignerBirdRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      // GET /designer/bird-designs?status= — 按作者列出设计，可选状态筛选
      case req @ GET -> Root / "bird-designs" :? StatusQueryParamMatcher(statusValue) =>
        currentUserId(req) match {
          case Some(designerId) =>
            val status = statusValue.flatMap(LevelStatus.fromString)
            ListBirdDesignsAPIMessage(designerId, status)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(designs => ApiSuccess(designs))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // POST /designer/bird-designs — 创建新草稿（201 Created）
      case req @ POST -> Root / "bird-designs" =>
        currentUserId(req) match {
          case Some(designerId) =>
            req.as[CreateBirdDesignBody].flatMap { body =>
              CreateBirdDesignAPIMessage(designerId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(design => ApiSuccess(design)), successStatus = Status.Created))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // PUT /designer/bird-designs/:designId — 更新草稿或被拒设计
      case req @ PUT -> Root / "bird-designs" / designId =>
        currentUserId(req) match {
          case Some(designerId) =>
            req.as[UpdateBirdDesignBody].flatMap { body =>
              UpdateBirdDesignAPIMessage(designerId, designId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(design => ApiSuccess(design))))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // DELETE /designer/bird-designs/:designId — 仅可删除 Draft 状态
      case req @ DELETE -> Root / "bird-designs" / designId =>
        currentUserId(req) match {
          case Some(designerId) =>
            DeleteBirdDesignAPIMessage(designerId, designId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(design => ApiSuccess(design))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // POST /designer/bird-designs/:designId/submit — 提交审核（201 Created）
      case req @ POST -> Root / "bird-designs" / designId / "submit" =>
        currentUserId(req) match {
          case Some(designerId) =>
            SubmitBirdDesignAPIMessage(designerId, designId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission)), successStatus = Status.Created))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }

  /** 可选 query 参数 status，对应 LevelStatus 字符串值。 */
  private object StatusQueryParamMatcher extends OptionalQueryParamDecoderMatcher[String]("status")

  /** 从 x-user-id 请求头解析当前设计师 ID。 */
  private def currentUserId(req: org.http4s.Request[IO]): Option[String] =
    req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
}
