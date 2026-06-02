package microservice.admin.routes

import cats.effect.IO
import microservice.core.HttpError
import microservice.admin.api.{AdminReviewService, ReviewSubmissionBody, ReviewSubmissionRequest}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object AdminRouter {
  def routes(adminReviewService: AdminReviewService): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "comments" =>
        val reviewerId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        reviewerId match {
          case Some(currentReviewerId) =>
            HttpError.fromEither(adminReviewService.getAdminComments(currentReviewerId).map(comments => ApiSuccess(comments)))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ DELETE -> Root / "comments" / commentId =>
        val reviewerId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        reviewerId match {
          case Some(currentReviewerId) =>
            HttpError.fromEither(adminReviewService.deleteComment(currentReviewerId, commentId).map(comment => ApiSuccess(comment)))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ GET -> Root / "submissions" / "pending" =>
        val reviewerId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        reviewerId match {
          case Some(currentReviewerId) =>
            HttpError.fromEither(adminReviewService.getPendingSubmissions(currentReviewerId).map(submissions => ApiSuccess(submissions)))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "submissions" / submissionId / "review" =>
        val reviewerId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        reviewerId match {
          case Some(currentReviewerId) =>
            req.as[ReviewSubmissionBody].flatMap { body =>
              HttpError.fromEither(
                adminReviewService
                  .reviewSubmission(
                    ReviewSubmissionRequest(
                      reviewerId = currentReviewerId,
                      submissionId = submissionId,
                      status = body.status,
                      reviewNote = body.reviewNote
                    )
                  )
                  .map(response => ApiSuccess(response.submission))
              )
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
