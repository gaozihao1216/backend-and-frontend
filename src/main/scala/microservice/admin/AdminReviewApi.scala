package microservice.admin

import microservice.core.{ApiEndpoint, ApiPath, POST}
import microservice.model.Submission

sealed trait ReviewDecision {
  def value: String
}

case object Approved extends ReviewDecision {
  override val value: String = "approved"
}

case object Rejected extends ReviewDecision {
  override val value: String = "rejected"
}

final case class ReviewSubmissionRequest(
  reviewerId: String,
  submissionId: String,
  decision: ReviewDecision,
  reviewNote: Option[String]
)

final case class ReviewSubmissionResponse(
  submission: Submission
)

sealed trait AdminReviewApiError extends microservice.core.ApiError

final case class SubmissionNotFound(
  override val message: String = "Submission not found"
) extends AdminReviewApiError {
  override val code: String = "SUBMISSION_NOT_FOUND"
}

final case class InvalidSubmissionStatus(
  override val message: String = "Submission has already been reviewed"
) extends AdminReviewApiError {
  override val code: String = "INVALID_SUBMISSION_STATUS"
}

object ReviewSubmissionEndpoint extends ApiEndpoint[ReviewSubmissionRequest, ReviewSubmissionResponse] {
  override val method = POST
  override val path = ApiPath("/admin/submissions/:submissionId/review")
  override val name = "ReviewSubmission"
  override val description = "Approve or reject one pending submission."

  val businessLogic: List[String] = List(
    "Only submissions in pending_review status can be reviewed.",
    "The review stores reviewerId, reviewNote and reviewedAt on the submission record.",
    "Approving a submission publishes the level; rejecting it sets the level status to rejected."
  )
}

trait AdminReviewService {
  def reviewSubmission(
    request: ReviewSubmissionRequest
  ): Either[AdminReviewApiError, ReviewSubmissionResponse]
}
