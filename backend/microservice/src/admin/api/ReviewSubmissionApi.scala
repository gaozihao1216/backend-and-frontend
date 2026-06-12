package microservice.admin.api

import cats.effect.IO
import java.time.Instant
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.tables.shared.LevelRowMapper
import microservice.admin.objects.{ReviewedSubmission, ReviewSubmissionErrors}
import microservice.level.tables.level.LevelTable
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.{AdminLevel, LevelStatus, SubmissionStatus}

final case class ReviewSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: ReviewSubmissionBody
) extends APIWithTokenMessage[ReviewedSubmission] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ReviewedSubmission]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ()))
        submission <- PlanSteps.require(
          SubmissionTable.findById(connection, submissionId) match {
            case None    => Left(ReviewSubmissionErrors.SubmissionMissing(submissionId).toHttpError)
            case Some(s) => Right(s)
          }
        )
        _ <- PlanSteps.require(
          if (submission.status != SubmissionStatus.PendingReview) {
            Left(ReviewSubmissionErrors.SubmissionAlreadyReviewed(submissionId).toHttpError)
          } else if (body.status != SubmissionStatus.Approved && body.status != SubmissionStatus.Rejected) {
            Left(ReviewSubmissionErrors.InvalidReviewStatus(body.status).toHttpError)
          } else {
            Right(())
          }
        )
        timestamp = Instant.now().toString
        reviewed <- PlanSteps.require(
          SubmissionTable
            .updateReview(
              connection = connection,
              submissionId = submissionId,
              status = body.status,
              reviewerId = userId,
              reviewNote = body.reviewNote,
              reviewedAt = timestamp
            )
            .toRight(ReviewSubmissionErrors.SubmissionMissing(submissionId).toHttpError)
        )
        targetStatus =
          if (body.status == SubmissionStatus.Approved) LevelStatus.Published else LevelStatus.Rejected
        publishedAt = if (body.status == SubmissionStatus.Approved) Some(timestamp) else None
        rejectionReason = if (body.status == SubmissionStatus.Approved) None else body.reviewNote
        _ <- PlanSteps.require(
          LevelTable
            .updateReviewStatus(
              connection = connection,
              levelId = submission.levelId,
              status = targetStatus,
              rejectionReason = rejectionReason,
              publishedAt = publishedAt,
              updatedAt = timestamp
            )
            .toRight(ReviewSubmissionErrors.LinkedLevelMissing(submission.levelId).toHttpError)
            .map(_ => ())
        )
      } yield ReviewedSubmission.fromSubmission(LevelRowMapper.toSubmission(reviewed))
    }
}
