package microservice.admin.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{HttpError}
import microservice.admin.api.{DeleteCommentAPIMessage, GetAdminCommentsAPIMessage, GetDirectorPermissionsAPIMessage, GetDirectorLevelAssignmentBoardAPIMessage, GetPendingSubmissionsAPIMessage, ReviewSubmissionAPIMessage, ReviewSubmissionBody, TransferDirectorPermissionAPIMessage, TransferDirectorPermissionBody, AssignLevelSlotAPIMessage, AssignLevelSlotBody, UnassignLevelSlotAPIMessage, AbolishDirectorSubmissionAPIMessage, AbolishDirectorSubmissionBody}
import microservice.bird.api.{GetPendingBirdSubmissionsAPIMessage, ReviewBirdSubmissionAPIMessage, ReviewBirdSubmissionBody}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object AdminRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
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
    }
}
