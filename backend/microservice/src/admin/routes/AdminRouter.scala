package microservice.admin.routes

import cats.effect.IO
import microservice.core.{DatabaseSession, HttpError}
import microservice.admin.api.{DeleteCommentAPIMessage, GetAdminCommentsAPIMessage, GetPendingSubmissionsAPIMessage, ReviewSubmissionAPIMessage, ReviewSubmissionBody}
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
    }
}
