package microservice.bird.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.auth.tables.UserTable
import microservice.bird.objects.ReviewedBirdSubmission
import microservice.bird.tables.{BirdDesignTable, BirdRowMapper, BirdSubmissionTable}
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, SubmissionStatus, UserRole}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class ReviewBirdSubmissionBody(
  status: SubmissionStatus,
  reviewNote: Option[String]
)

object ReviewBirdSubmissionBody {
  implicit val encoder: Encoder[ReviewBirdSubmissionBody] = deriveEncoder
  implicit val decoder: Decoder[ReviewBirdSubmissionBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, ReviewBirdSubmissionBody] = jsonOf
}

final case class ReviewBirdSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: ReviewBirdSubmissionBody
) extends APIWithTokenMessage[ReviewedBirdSubmission] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ReviewedBirdSubmission]] =
    IO.pure {
      UserTable.findById(connection, userId) match {
        case Some(user) if user.role == UserRole.Admin =>
          BirdSubmissionTable.findById(connection, submissionId) match {
            case None =>
              Left(HttpError.notFound("BIRD_SUBMISSION_NOT_FOUND", s"Bird submission not found: $submissionId"))
            case Some(submission) if submission.status != SubmissionStatus.PendingReview =>
              Left(HttpError.conflict("SUBMISSION_ALREADY_REVIEWED", s"Submission already reviewed: $submissionId"))
            case Some(submission)
                if body.status != SubmissionStatus.Approved && body.status != SubmissionStatus.Rejected =>
              Left(HttpError.badRequest("INVALID_REVIEW_STATUS", "Review status must be approved or rejected"))
            case Some(submission) =>
              val timestamp = Instant.now().toString
              BirdSubmissionTable.updateReview(
                connection = connection,
                submissionId = submissionId,
                status = body.status,
                reviewerId = userId,
                reviewNote = body.reviewNote,
                reviewedAt = timestamp
              ) match {
                case None =>
                  Left(HttpError.notFound("BIRD_SUBMISSION_NOT_FOUND", s"Bird submission not found: $submissionId"))
                case Some(reviewedSubmission) =>
                  val targetStatus =
                    if (body.status == SubmissionStatus.Approved) LevelStatus.Published else LevelStatus.Rejected
                  val publishedAt = if (body.status == SubmissionStatus.Approved) Some(timestamp) else None
                  val rejectionReason = if (body.status == SubmissionStatus.Approved) None else body.reviewNote

                  BirdDesignTable.updateReviewStatus(
                    connection = connection,
                    designId = submission.birdDesignId,
                    status = targetStatus,
                    rejectionReason = rejectionReason,
                    publishedAt = publishedAt,
                    updatedAt = timestamp
                  ) match {
                    case None =>
                      Left(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: ${submission.birdDesignId}"))
                    case Some(_) =>
                      Right(ReviewedBirdSubmission.fromSubmission(BirdRowMapper.toBirdSubmission(reviewedSubmission)))
                  }
              }
          }
        case Some(_) => Left(HttpError.forbidden("Admin role is required"))
        case None => Left(HttpError.unauthorized("Unknown user"))
      }
    }
}
