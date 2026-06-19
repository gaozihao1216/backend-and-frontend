package microservice.admin.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.admin.api.comments.{
  DeleteCommentAPIMessage,
  GetAdminCommentsAPIMessage
}
import microservice.admin.api.submissions.{
  GetPendingSubmissionsAPIMessage,
  ReviewSubmissionAPIMessage,
  ReviewSubmissionBody
}
import microservice.admin.api.director.permissions.{
  GetDirectorPermissionsAPIMessage,
  TransferDirectorPermissionAPIMessage,
  TransferDirectorPermissionBody
}
import microservice.admin.api.director.level_assignment.{
  AbolishDirectorSubmissionAPIMessage,
  AbolishDirectorSubmissionBody,
  AssignLevelSlotAPIMessage,
  AssignLevelSlotBody,
  GetDirectorLevelAssignmentBoardAPIMessage,
  UnassignLevelSlotAPIMessage,
  UpdateLevelSlotBirdPoolAPIMessage,
  UpdateLevelSlotBirdPoolBody
}
import microservice.admin.api.director.bird_skill.{
  GetDirectorBirdSkillAPIMessage,
  GetDirectorBirdSkillBoardAPIMessage,
  SaveDirectorBirdSkillAPIMessage,
  SaveDirectorBirdSkillBody
}
import microservice.bird.api.review.{
  GetPendingBirdSubmissionsAPIMessage,
  ReviewBirdSubmissionAPIMessage,
  ReviewBirdSubmissionBody
}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 管理员域 HTTP 路由聚合器。
  *
  * HTTP 职责：解析路径/方法/请求体，从 AuthMiddleware 提取 userId，构造对应 APIMessage 并调用
  * `runAuthenticated`；将 `Either[HttpError, T]` 包装为 `ApiSuccess` JSON。不包含任何业务逻辑。
  * 挂载路径：由 ApiRouter 挂载在 `/admin` 前缀下（见 infrastructure/routes）。
  * 前端代理：`/admin/comments`、`/admin/submissions`、`/admin/bird-submissions`、`/admin/director` 子路径。
  */
object AdminRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      // GET /admin/comments — 列出全部关卡评论（Standard 管理员）
      case req @ GET -> Root / "comments" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetAdminCommentsAPIMessage(userId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(comments => ApiSuccess(comments))))

      // DELETE /admin/comments/:commentId — 删除单条评论
      case req @ DELETE -> Root / "comments" / commentId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        DeleteCommentAPIMessage(userId, commentId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(comment => ApiSuccess(comment))))

      // GET /admin/submissions/pending — 待审核关卡投稿列表
      case req @ GET -> Root / "submissions" / "pending" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetPendingSubmissionsAPIMessage(userId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(submissions => ApiSuccess(submissions))))

      // GET /admin/bird-submissions/pending — 待审核鸟类设计投稿列表
      case req @ GET -> Root / "bird-submissions" / "pending" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetPendingBirdSubmissionsAPIMessage(userId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(submissions => ApiSuccess(submissions))))

      // POST /admin/bird-submissions/:submissionId/review — 审核鸟类设计投稿
      case req @ POST -> Root / "bird-submissions" / submissionId / "review" =>
        val reviewerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[ReviewBirdSubmissionBody].flatMap { body =>
          ReviewBirdSubmissionAPIMessage(reviewerId, submissionId, body)
            .runAuthenticated(reviewerId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission))))
        }

      // POST /admin/submissions/:submissionId/review — 审核关卡投稿（通过/拒绝）
      case req @ POST -> Root / "submissions" / submissionId / "review" =>
        val reviewerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[ReviewSubmissionBody].flatMap { body =>
          ReviewSubmissionAPIMessage(reviewerId, submissionId, body)
            .runAuthenticated(reviewerId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission))))
        }

      // GET /admin/director/permissions — 总监权限摘要
      case req @ GET -> Root / "director" / "permissions" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetDirectorPermissionsAPIMessage(userId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(summary => ApiSuccess(summary))))

      // POST /admin/director/transfer — 移交总监权限
      case req @ POST -> Root / "director" / "transfer" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[TransferDirectorPermissionBody].flatMap { body =>
          TransferDirectorPermissionAPIMessage(userId, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(transfer => ApiSuccess(transfer))))
        }

      // GET /admin/director/level-assignments/board — 关卡槽位分配看板
      case req @ GET -> Root / "director" / "level-assignments" / "board" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetDirectorLevelAssignmentBoardAPIMessage(userId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(board => ApiSuccess(board))))

      // POST /admin/director/level-assignments/:levelSuffix — 分配关卡到槽位
      case req @ POST -> Root / "director" / "level-assignments" / levelSuffix =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[AssignLevelSlotBody].flatMap { body =>
          AssignLevelSlotAPIMessage(userId, levelSuffix, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(assignment => ApiSuccess(assignment))))
        }

      // DELETE /admin/director/level-assignments/:levelSuffix — 解除槽位分配
      case req @ DELETE -> Root / "director" / "level-assignments" / levelSuffix =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        UnassignLevelSlotAPIMessage(userId, levelSuffix)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(assignment => ApiSuccess(assignment))))

      // PUT /admin/director/level-assignments/:levelSuffix/bird-pool — 更新槽位 bird pool
      case req @ PUT -> Root / "director" / "level-assignments" / levelSuffix / "bird-pool" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[UpdateLevelSlotBirdPoolBody].flatMap { body =>
          UpdateLevelSlotBirdPoolAPIMessage(userId, levelSuffix, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(assignment => ApiSuccess(assignment))))
        }

      // POST /admin/director/submissions/:submissionId/abolish — 总监废止已批准投稿
      case req @ POST -> Root / "director" / "submissions" / submissionId / "abolish" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[AbolishDirectorSubmissionBody].flatMap { body =>
          AbolishDirectorSubmissionAPIMessage(userId, submissionId, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission))))
        }

      // GET /admin/director/bird-skills/board — 鸟类技能配置看板
      case req @ GET -> Root / "director" / "bird-skills" / "board" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetDirectorBirdSkillBoardAPIMessage(userId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(board => ApiSuccess(board))))

      // GET /admin/director/bird-skills/:birdType — 单鸟种技能详情
      case req @ GET -> Root / "director" / "bird-skills" / birdType =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetDirectorBirdSkillAPIMessage(userId, birdType)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(entry => ApiSuccess(entry))))

      // PUT /admin/director/bird-skills/:birdType — 保存鸟种技能配置
      case req @ PUT -> Root / "director" / "bird-skills" / birdType =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[SaveDirectorBirdSkillBody].flatMap { body =>
          SaveDirectorBirdSkillAPIMessage(userId, birdType, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(config => ApiSuccess(config))))
        }
    }
}
