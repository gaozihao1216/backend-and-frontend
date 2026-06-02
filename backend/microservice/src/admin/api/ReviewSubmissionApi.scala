package microservice.admin.api

import cats.effect.IO
import java.time.Instant
import java.sql.Connection
import microservice.auth.tables.UserTable
import microservice.core.{APIWithTokenMessage, HttpError, RowMappers}
import microservice.admin.objects.ReviewedSubmission
import microservice.level.tables.{LevelTable, SubmissionTable}
import microservice.system.objects.LevelStatus
import microservice.system.objects.SubmissionStatus
import microservice.system.objects.UserRole
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

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

final case class ReviewSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: ReviewSubmissionBody
) extends APIWithTokenMessage[ReviewedSubmission] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ReviewedSubmission]] =
    IO.pure {
      UserTable.findById(connection, userId) match {
        case Some(user) if user.role == UserRole.Admin =>
          SubmissionTable.findById(connection, submissionId) match {
            case None =>
              Left(ReviewSubmissionErrors.SubmissionMissing(submissionId).toHttpError)
            case Some(submission) =>
              if (submission.status != SubmissionStatus.PendingReview) {
                Left(ReviewSubmissionErrors.SubmissionAlreadyReviewed(submissionId).toHttpError)
              } else if (body.status != SubmissionStatus.Approved && body.status != SubmissionStatus.Rejected) {
                Left(ReviewSubmissionErrors.InvalidReviewStatus(body.status).toHttpError)
              } else {
                val timestamp = Instant.now().toString
                val reviewed = SubmissionTable.updateReview(
                  connection = connection,
                  submissionId = submissionId,
                  status = body.status,
                  reviewerId = userId,
                  reviewNote = body.reviewNote,
                  reviewedAt = timestamp
                )

                reviewed match {
                  case None =>
                    Left(ReviewSubmissionErrors.SubmissionMissing(submissionId).toHttpError)
                  case Some(reviewedSubmission) =>
                    val targetStatus =
                      if (body.status == SubmissionStatus.Approved) {
                        LevelStatus.Published
                      } else {
                        LevelStatus.Rejected
                      }
                    val publishedAt = if (body.status == SubmissionStatus.Approved) Some(timestamp) else None
                    val rejectionReason = if (body.status == SubmissionStatus.Approved) None else body.reviewNote

                    LevelTable.updateReviewStatus(
                      connection = connection,
                      levelId = submission.levelId,
                      status = targetStatus,
                      rejectionReason = rejectionReason,
                      publishedAt = publishedAt,
                      updatedAt = timestamp
                    ) match {
                      case None =>
                        Left(ReviewSubmissionErrors.LinkedLevelMissing(submission.levelId).toHttpError)
                      case Some(_) =>
                        Right(ReviewedSubmission.fromSubmission(RowMappers.toSubmission(reviewedSubmission)))
                    }
                }
              }
          }
        case Some(_) => Left(HttpError.forbidden("Admin role is required"))
        case None => Left(HttpError.unauthorized("Unknown user"))
      }
    }
}

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

object ReviewSubmissionEndpoint {
  val name: String = "ReviewSubmission"
  val method: String = "POST"
  val path: String = "/admin/submissions/:submissionId/review"
  val businessLogic: String =
    "只有 pending_review 的送审记录允许审核；审核结果会同步更新 submission 和 level 状态。"
}
