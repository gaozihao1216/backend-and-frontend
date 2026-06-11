package microservice.admin.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{HttpError}
import microservice.admin.api.{DeleteCommentAPIMessage, GetAdminCommentsAPIMessage, GetDirectorPermissionsAPIMessage, GetDirectorLevelAssignmentBoardAPIMessage, GetDirectorBirdSkillBoardAPIMessage, GetDirectorBirdSkillAPIMessage, SaveDirectorBirdSkillAPIMessage, SaveDirectorBirdSkillBody, GetPendingSubmissionsAPIMessage, ReviewSubmissionAPIMessage, ReviewSubmissionBody, TransferDirectorPermissionAPIMessage, TransferDirectorPermissionBody, AssignLevelSlotAPIMessage, AssignLevelSlotBody, UnassignLevelSlotAPIMessage, UpdateLevelSlotBirdPoolAPIMessage, UpdateLevelSlotBirdPoolBody, AbolishDirectorSubmissionAPIMessage, AbolishDirectorSubmissionBody}
import microservice.bird.api.{GetPendingBirdSubmissionsAPIMessage, ReviewBirdSubmissionAPIMessage, ReviewBirdSubmissionBody}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 管理员 HTTP 入口，挂载在 /admin 前缀下。
  *
  * 职责划分：
  *   - Standard 管理员（AdminLevel.Standard）：评论管理、关卡投稿审核
  *   - Director 总监（AdminLevel.Director）：权限移交、关卡槽位分配、鸟类技能配置、投稿废止
  *   - 鸟类投稿审核：由 Admin 角色处理，路由在此但 APIMessage 在 bird 模块
  *
  * 实现：每个 case 从 x-user-id 请求头读取当前用户，构造对应 APIMessage 并调用 .run(databaseSession)；
  *       角色与 adminLevel 校验在 APIMessage.plan 内完成，Router 层仅做 header 缺失检查。
  * 关联：frontend AdminPage、DirectorLevelLab、DirectorBirdSkillLab；vite 代理 /admin/... 到 backend:3000。
  */
object AdminRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      // ── Standard 管理员：评论管理 ──────────────────────────────────────────
      case req @ GET -> Root / "comments" =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            GetAdminCommentsAPIMessage(currentUserId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(comments => ApiSuccess(comments))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ DELETE -> Root / "comments" / commentId =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            DeleteCommentAPIMessage(currentUserId, commentId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(comment => ApiSuccess(comment))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // ── Standard 管理员：关卡投稿审核 ──────────────────────────────────────
      case req @ GET -> Root / "submissions" / "pending" =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            GetPendingSubmissionsAPIMessage(currentUserId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(submissions => ApiSuccess(submissions))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // ── Admin 角色：鸟类设计投稿审核（APIMessage 在 bird 模块） ───────────────
      case req @ GET -> Root / "bird-submissions" / "pending" =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            GetPendingBirdSubmissionsAPIMessage(currentUserId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(submissions => ApiSuccess(submissions))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "bird-submissions" / submissionId / "review" =>
        val reviewerId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        reviewerId match {
          case Some(currentReviewerId) =>
            req.as[ReviewBirdSubmissionBody].flatMap { body =>
              ReviewBirdSubmissionAPIMessage(currentReviewerId, submissionId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission))))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "submissions" / submissionId / "review" =>
        val reviewerId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        reviewerId match {
          case Some(currentReviewerId) =>
            req.as[ReviewSubmissionBody].flatMap { body =>
              ReviewSubmissionAPIMessage(currentReviewerId, submissionId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission))))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // ── Director 总监：权限与 UI 定制能力查询 ────────────────────────────────
      case req @ GET -> Root / "director" / "permissions" =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            GetDirectorPermissionsAPIMessage(currentUserId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(summary => ApiSuccess(summary))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "director" / "transfer" =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            req.as[TransferDirectorPermissionBody].flatMap { body =>
              TransferDirectorPermissionAPIMessage(currentUserId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(transfer => ApiSuccess(transfer))))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // ── Director 总监：关卡槽位（level01–level10）分配与废止 ────────────────
      case req @ GET -> Root / "director" / "level-assignments" / "board" =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            GetDirectorLevelAssignmentBoardAPIMessage(currentUserId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(board => ApiSuccess(board))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "director" / "level-assignments" / levelSuffix =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            req.as[AssignLevelSlotBody].flatMap { body =>
              AssignLevelSlotAPIMessage(currentUserId, levelSuffix, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(assignment => ApiSuccess(assignment))))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ DELETE -> Root / "director" / "level-assignments" / levelSuffix =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            UnassignLevelSlotAPIMessage(currentUserId, levelSuffix)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(assignment => ApiSuccess(assignment))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ PUT -> Root / "director" / "level-assignments" / levelSuffix / "bird-pool" =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            req.as[UpdateLevelSlotBirdPoolBody].flatMap { body =>
              UpdateLevelSlotBirdPoolAPIMessage(currentUserId, levelSuffix, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(assignment => ApiSuccess(assignment))))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "director" / "submissions" / submissionId / "abolish" =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            req.as[AbolishDirectorSubmissionBody].flatMap { body =>
              AbolishDirectorSubmissionAPIMessage(currentUserId, submissionId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission))))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // ── Director 总监：鸟类技能 JSON 配置（备战/关卡 bird pool 运行时读取） ──
      case req @ GET -> Root / "director" / "bird-skills" / "board" =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            GetDirectorBirdSkillBoardAPIMessage(currentUserId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(board => ApiSuccess(board))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ GET -> Root / "director" / "bird-skills" / birdType =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            GetDirectorBirdSkillAPIMessage(currentUserId, birdType)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(entry => ApiSuccess(entry))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ PUT -> Root / "director" / "bird-skills" / birdType =>
        val userId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        userId match {
          case Some(currentUserId) =>
            req.as[SaveDirectorBirdSkillBody].flatMap { body =>
              SaveDirectorBirdSkillAPIMessage(currentUserId, birdType, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(config => ApiSuccess(config))))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
