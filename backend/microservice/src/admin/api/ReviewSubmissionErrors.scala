package microservice.admin.api

import microservice.infrastructure.http.HttpError
import microservice.system.objects.SubmissionStatus

sealed trait AdminReviewApiError {
  def toHttpError: HttpError
}

object ReviewSubmissionErrors {
  final case class SubmissionMissing(submissionId: String) extends AdminReviewApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("SUBMISSION_NOT_FOUND", s"Submission not found: $submissionId")
  }

  final case class SubmissionAlreadyReviewed(submissionId: String) extends AdminReviewApiError {
    override def toHttpError: HttpError =
      HttpError.conflict("INVALID_SUBMISSION_STATUS", s"Submission already reviewed: $submissionId")
  }

  final case class LinkedLevelMissing(levelId: String) extends AdminReviewApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("LEVEL_NOT_FOUND", s"Linked level not found: $levelId")
  }

  final case class InvalidReviewStatus(status: SubmissionStatus) extends AdminReviewApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("INVALID_REVIEW_STATUS", s"Review status must be approved or rejected, got ${status.value}")
  }
}
