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
