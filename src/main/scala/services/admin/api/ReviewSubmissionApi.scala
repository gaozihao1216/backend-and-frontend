package coursebackend.services.admin.api

import cats.effect.IO
import coursebackend.HttpError
import coursebackend.services.admin.objects.ReviewedSubmission
import coursebackend.services.system.objects.SubmissionStatus
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class ReviewSubmissionRequest(
  reviewerId: String,
  submissionId: String,
  status: SubmissionStatus,
  reviewNote: Option[String]
)

object ReviewSubmissionRequest {
  implicit val encoder: Encoder[ReviewSubmissionRequest] = deriveEncoder
  implicit val decoder: Decoder[ReviewSubmissionRequest] = deriveDecoder
}

final case class ReviewSubmissionBody(
  status: SubmissionStatus,
  reviewNote: Option[String]
)

object ReviewSubmissionBody {
  implicit val encoder: Encoder[ReviewSubmissionBody] = deriveEncoder
  implicit val decoder: Decoder[ReviewSubmissionBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, ReviewSubmissionBody] = jsonOf
}

final case class ReviewSubmissionResponse(
  submission: ReviewedSubmission
)

object ReviewSubmissionResponse {
  implicit val encoder: Encoder[ReviewSubmissionResponse] = deriveEncoder
  implicit val decoder: Decoder[ReviewSubmissionResponse] = deriveDecoder
}

sealed trait AdminReviewApiError {
  def toHttpError: HttpError
}

object AdminReviewService {
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
}

trait AdminReviewService {
  def reviewSubmission(request: ReviewSubmissionRequest): Either[HttpError, ReviewSubmissionResponse]
}

object ReviewSubmissionEndpoint {
  val name: String = "ReviewSubmission"
  val method: String = "POST"
  val path: String = "/admin/submissions/:submissionId/review"
  val businessLogic: String =
    "只有 pending_review 的送审记录允许审核；审核结果会同步更新 submission 和 level 状态。"
}
