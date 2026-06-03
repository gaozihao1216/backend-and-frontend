package microservice.admin.api

import cats.effect.IO
import java.time.Instant
import java.sql.Connection
import microservice.auth.tables.UserTable
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.level.tables.LevelRowMapper
import microservice.admin.objects.{ReviewedSubmission, ReviewSubmissionErrors}
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
                        Right(ReviewedSubmission.fromSubmission(LevelRowMapper.toSubmission(reviewedSubmission)))
                    }
                }
              }
          }
        case Some(_) => Left(HttpError.forbidden("Admin role is required"))
        case None => Left(HttpError.unauthorized("Unknown user"))
      }
    }
}
