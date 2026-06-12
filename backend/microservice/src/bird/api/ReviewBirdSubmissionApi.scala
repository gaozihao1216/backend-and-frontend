package microservice.bird.api

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.bird.objects.ReviewedBirdSubmission
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.shared.BirdRowMapper
import microservice.bird.tables.submission.BirdSubmissionTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{AdminLevel, LevelStatus, SubmissionStatus}

final case class ReviewBirdSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: ReviewBirdSubmissionBody
) extends APIWithTokenMessage[ReviewedBirdSubmission] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ReviewedBirdSubmission]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ()))
        submission <- PlanSteps.require(
          BirdSubmissionTable.findById(connection, submissionId) match {
            case None    => Left(HttpError.notFound("BIRD_SUBMISSION_NOT_FOUND", s"Bird submission not found: $submissionId"))
            case Some(s) => Right(s)
          }
        )
        _ <- PlanSteps.require(
          if (submission.status != SubmissionStatus.PendingReview) {
            Left(HttpError.conflict("SUBMISSION_ALREADY_REVIEWED", s"Submission already reviewed: $submissionId"))
          } else if (body.status != SubmissionStatus.Approved && body.status != SubmissionStatus.Rejected) {
            Left(HttpError.badRequest("INVALID_REVIEW_STATUS", "Review status must be approved or rejected"))
          } else {
            Right(())
          }
        )
        timestamp = Instant.now().toString
        reviewed <- PlanSteps.require(
          BirdSubmissionTable
            .updateReview(
              connection = connection,
              submissionId = submissionId,
              status = body.status,
              reviewerId = userId,
              reviewNote = body.reviewNote,
              reviewedAt = timestamp
            )
            .toRight(HttpError.notFound("BIRD_SUBMISSION_NOT_FOUND", s"Bird submission not found: $submissionId"))
        )
        targetStatus =
          if (body.status == SubmissionStatus.Approved) LevelStatus.Published else LevelStatus.Rejected
        publishedAt = if (body.status == SubmissionStatus.Approved) Some(timestamp) else None
        rejectionReason = if (body.status == SubmissionStatus.Approved) None else body.reviewNote
        _ <- PlanSteps.require(
          BirdDesignTable
            .updateReviewStatus(
              connection = connection,
              designId = submission.birdDesignId,
              status = targetStatus,
              rejectionReason = rejectionReason,
              publishedAt = publishedAt,
              updatedAt = timestamp
            )
            .toRight(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: ${submission.birdDesignId}"))
            .map(_ => ())
        )
      } yield ReviewedBirdSubmission.fromSubmission(BirdRowMapper.toBirdSubmission(reviewed))
    }
}
