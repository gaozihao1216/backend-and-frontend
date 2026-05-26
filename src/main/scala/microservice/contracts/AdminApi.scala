package microservice.contracts

import microservice.framework.{ApiEndpoint, ApiError, ConflictError, NotFoundError}
import microservice.framework.HttpMethod
import microservice.model.Submission

sealed trait ReviewDecision {
  def value: String
}

object ReviewDecision {
  case object Approved extends ReviewDecision {
    override val value: String = "approved"
  }

  case object Rejected extends ReviewDecision {
    override val value: String = "rejected"
  }
}

final case class ReviewSubmissionRequest(
  reviewerId: String,
  submissionId: String,
  status: ReviewDecision,
  reviewNote: Option[String]
)

sealed trait AdminApiError extends ApiError

final case class SubmissionNotFound(
  override val message: String = "Submission not found"
) extends AdminApiError {
  override val code: String = NotFoundError("SUBMISSION_NOT_FOUND", message).code
}

final case class SubmissionAlreadyReviewed(
  override val message: String = "Submission has already been reviewed"
) extends AdminApiError {
  override val code: String = ConflictError("INVALID_SUBMISSION_STATUS", message).code
}

object AdminApi {
  val reviewSubmission: ApiEndpoint[ReviewSubmissionRequest, Submission, AdminApiError] =
    ApiEndpoint(
      name = "ReviewSubmission",
      method = HttpMethod.Post,
      path = "/admin/submissions/:submissionId/review",
      description = "Approve or reject a pending submission.",
      businessRules = List(
        "Only submissions in pending_review status can be reviewed.",
        "Store reviewerId, reviewNote and reviewedAt on the submission.",
        "Keep submission status and level status in sync: approved publishes the level, rejected marks the level as rejected."
      )
    )
}

trait AdminService[F[_]] {
  def reviewSubmission(
    request: ReviewSubmissionRequest
  ): F[Either[AdminApiError, Submission]]
}
