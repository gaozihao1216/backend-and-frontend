package microservice.admin.support.submission

import java.sql.Connection
import microservice.admin.objects.submission.ReviewSubmissionErrors
import microservice.admin.tables.{AdminAuditTable, AdminAuditTargetType}
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.SubmissionRow
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.{LevelStatus, SubmissionStatus}
import microservice.admin.api.submissions.body.ReviewSubmissionBody

/** 关卡投稿审核流程中的查表、决策与双写校验。 */
object LevelSubmissionReviewSupport {
  def requirePendingSubmission(connection: Connection, submissionId: String): Step[SubmissionRow] =
    PlanStep.fromEither(checkPendingSubmission(connection, submissionId))

  def requireReviewDecision(submission: SubmissionRow, body: ReviewSubmissionBody): Step[Unit] =
    PlanStep.fromEither(checkReviewDecision(submission, body))

  def requireUpdatedSubmission(
    connection: Connection,
    submissionId: String,
    body: ReviewSubmissionBody,
    reviewerId: String,
    reviewedAt: String
  ): Step[SubmissionRow] =
    PlanStep.fromEither(checkUpdatedSubmission(connection, submissionId, body, reviewerId, reviewedAt))

  def requireSyncedLevel(
    connection: Connection,
    submission: SubmissionRow,
    body: ReviewSubmissionBody,
    updatedAt: String
  ): Step[Unit] =
    PlanStep.fromEither(checkSyncedLevel(connection, submission, body, updatedAt))

  def recordAudit(
    connection: Connection,
    submissionId: String,
    reviewerId: String,
    body: ReviewSubmissionBody,
    reviewedAt: String
  ): Unit =
    AdminAuditTable.recordReview(
      connection = connection,
      targetType = AdminAuditTargetType.LevelSubmission,
      submissionId = submissionId,
      reviewerId = reviewerId,
      decision = body.status.value,
      reviewNote = body.reviewNote,
      reviewedAt = reviewedAt
    )

  def checkPendingSubmission(connection: Connection, submissionId: String): Either[HttpError, SubmissionRow] =
    SubmissionTable.findById(connection, submissionId) match {
      case None    => Left(ReviewSubmissionErrors.SubmissionMissing(submissionId).toHttpError)
      case Some(row) => Right(row)
    }

  def checkReviewDecision(submission: SubmissionRow, body: ReviewSubmissionBody): Either[HttpError, Unit] =
    if (submission.status != SubmissionStatus.PendingReview) {
      Left(ReviewSubmissionErrors.SubmissionAlreadyReviewed(submission.id).toHttpError)
    } else if (body.status != SubmissionStatus.Approved && body.status != SubmissionStatus.Rejected) {
      Left(ReviewSubmissionErrors.InvalidReviewStatus(body.status).toHttpError)
    } else {
      Right(())
    }

  def checkUpdatedSubmission(
    connection: Connection,
    submissionId: String,
    body: ReviewSubmissionBody,
    reviewerId: String,
    reviewedAt: String
  ): Either[HttpError, SubmissionRow] =
    SubmissionTable
      .updateReview(
        connection = connection,
        submissionId = submissionId,
        status = body.status,
        reviewerId = reviewerId,
        reviewNote = body.reviewNote,
        reviewedAt = reviewedAt
      )
      .toRight(ReviewSubmissionErrors.SubmissionMissing(submissionId).toHttpError)

  def checkSyncedLevel(
    connection: Connection,
    submission: SubmissionRow,
    body: ReviewSubmissionBody,
    updatedAt: String
  ): Either[HttpError, Unit] = {
    val targetStatus =
      if (body.status == SubmissionStatus.Approved) LevelStatus.Published else LevelStatus.Rejected
    val publishedAt = if (body.status == SubmissionStatus.Approved) Some(updatedAt) else None
    val rejectionReason = if (body.status == SubmissionStatus.Approved) None else body.reviewNote

    LevelTable
      .updateReviewStatus(
        connection = connection,
        levelId = submission.levelId,
        status = targetStatus,
        rejectionReason = rejectionReason,
        publishedAt = publishedAt,
        updatedAt = updatedAt
      )
      .toRight(ReviewSubmissionErrors.LinkedLevelMissing(submission.levelId).toHttpError)
      .map(_ => ())
  }
}
