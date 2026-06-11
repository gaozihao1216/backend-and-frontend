package microservice.admin.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.admin.api.{
  AbolishDirectorSubmissionAPIMessage,
  AbolishDirectorSubmissionBody,
  AssignLevelSlotAPIMessage,
  AssignLevelSlotBody,
  DeleteCommentAPIMessage,
  GetAdminCommentsAPIMessage,
  GetDirectorBirdSkillAPIMessage,
  GetDirectorBirdSkillBoardAPIMessage,
  GetDirectorLevelAssignmentBoardAPIMessage,
  GetDirectorPermissionsAPIMessage,
  GetPendingSubmissionsAPIMessage,
  ReviewSubmissionAPIMessage,
  ReviewSubmissionBody,
  SaveDirectorBirdSkillAPIMessage,
  SaveDirectorBirdSkillBody,
  TransferDirectorPermissionAPIMessage,
  TransferDirectorPermissionBody,
  UnassignLevelSlotAPIMessage,
  UpdateLevelSlotBirdPoolAPIMessage,
  UpdateLevelSlotBirdPoolBody
}
import microservice.bird.api.{
  GetPendingBirdSubmissionsAPIMessage,
  ReviewBirdSubmissionAPIMessage,
  ReviewBirdSubmissionBody
}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 管理员 HTTP 入口，挂载在 /admin 前缀下。 */
object AdminRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "comments" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetAdminCommentsAPIMessage(userId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(comments => ApiSuccess(comments))))

      case req @ DELETE -> Root / "comments" / commentId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        DeleteCommentAPIMessage(userId, commentId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(comment => ApiSuccess(comment))))

      case req @ GET -> Root / "submissions" / "pending" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetPendingSubmissionsAPIMessage(userId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(submissions => ApiSuccess(submissions))))

      case req @ GET -> Root / "bird-submissions" / "pending" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetPendingBirdSubmissionsAPIMessage(userId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(submissions => ApiSuccess(submissions))))

      case req @ POST -> Root / "bird-submissions" / submissionId / "review" =>
        val reviewerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[ReviewBirdSubmissionBody].flatMap { body =>
          ReviewBirdSubmissionAPIMessage(reviewerId, submissionId, body)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission))))
        }

      case req @ POST -> Root / "submissions" / submissionId / "review" =>
        val reviewerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[ReviewSubmissionBody].flatMap { body =>
          ReviewSubmissionAPIMessage(reviewerId, submissionId, body)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission))))
        }

      case req @ GET -> Root / "director" / "permissions" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetDirectorPermissionsAPIMessage(userId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(summary => ApiSuccess(summary))))

      case req @ POST -> Root / "director" / "transfer" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[TransferDirectorPermissionBody].flatMap { body =>
          TransferDirectorPermissionAPIMessage(userId, body)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(transfer => ApiSuccess(transfer))))
        }

      case req @ GET -> Root / "director" / "level-assignments" / "board" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetDirectorLevelAssignmentBoardAPIMessage(userId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(board => ApiSuccess(board))))

      case req @ POST -> Root / "director" / "level-assignments" / levelSuffix =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[AssignLevelSlotBody].flatMap { body =>
          AssignLevelSlotAPIMessage(userId, levelSuffix, body)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(assignment => ApiSuccess(assignment))))
        }

      case req @ DELETE -> Root / "director" / "level-assignments" / levelSuffix =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        UnassignLevelSlotAPIMessage(userId, levelSuffix)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(assignment => ApiSuccess(assignment))))

      case req @ PUT -> Root / "director" / "level-assignments" / levelSuffix / "bird-pool" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[UpdateLevelSlotBirdPoolBody].flatMap { body =>
          UpdateLevelSlotBirdPoolAPIMessage(userId, levelSuffix, body)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(assignment => ApiSuccess(assignment))))
        }

      case req @ POST -> Root / "director" / "submissions" / submissionId / "abolish" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[AbolishDirectorSubmissionBody].flatMap { body =>
          AbolishDirectorSubmissionAPIMessage(userId, submissionId, body)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission))))
        }

      case req @ GET -> Root / "director" / "bird-skills" / "board" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetDirectorBirdSkillBoardAPIMessage(userId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(board => ApiSuccess(board))))

      case req @ GET -> Root / "director" / "bird-skills" / birdType =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetDirectorBirdSkillAPIMessage(userId, birdType)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(entry => ApiSuccess(entry))))

      case req @ PUT -> Root / "director" / "bird-skills" / birdType =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[SaveDirectorBirdSkillBody].flatMap { body =>
          SaveDirectorBirdSkillAPIMessage(userId, birdType, body)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(config => ApiSuccess(config))))
        }
    }
}
