package microservice.bird.support.review

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.submission.BirdSubmissionRow
import microservice.bird.tables.submission.BirdSubmissionTable
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, SubmissionStatus}
import microservice.bird.body.review.ReviewBirdSubmissionBody

/** 鸟类投稿审核流程中的查表、决策与双写校验。
  *
  * 审核通过/拒绝需同步更新 BirdSubmissionTable 与 BirdDesignTable。
  */
private[bird] object BirdSubmissionReviewSupport {
  def requirePendingSubmission(connection: Connection, submissionId: String): Step[BirdSubmissionRow] =
    EitherT.liftF(IO(BirdSubmissionTable.findById(connection, submissionId))).flatMap {
      case None    => EitherT.leftT(HttpError.notFound("BIRD_SUBMISSION_NOT_FOUND", s"Bird submission not found: $submissionId"))
      case Some(row) => EitherT.rightT(row)
    }

  def requireReviewDecision(submission: BirdSubmissionRow, body: ReviewBirdSubmissionBody): Step[Unit] =
    if (submission.status != SubmissionStatus.PendingReview) {
      PlanStep.fail(HttpError.conflict("SUBMISSION_ALREADY_REVIEWED", s"Submission already reviewed: ${submission.id}"))
    } else if (body.status != SubmissionStatus.Approved && body.status != SubmissionStatus.Rejected) {
      PlanStep.fail(HttpError.badRequest("INVALID_REVIEW_STATUS", "Review status must be approved or rejected"))
    } else {
      PlanStep.succeed(())
    }

  def requireUpdatedSubmission(
    connection: Connection,
    submissionId: String,
    body: ReviewBirdSubmissionBody,
    reviewerId: String,
    reviewedAt: String
  ): Step[BirdSubmissionRow] =
    EitherT.liftF(
      IO(
        BirdSubmissionTable.updateReview(
          connection = connection,
          submissionId = submissionId,
          status = body.status,
          reviewerId = reviewerId,
          reviewNote = body.reviewNote,
          reviewedAt = reviewedAt
        )
      )
    ).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("BIRD_SUBMISSION_NOT_FOUND", s"Bird submission not found: $submissionId"))
      case Some(row) =>
        EitherT.rightT(row)
    }

  def requireSyncedDesign(
    connection: Connection,
    submission: BirdSubmissionRow,
    body: ReviewBirdSubmissionBody,
    updatedAt: String
  ): Step[Unit] = {
    val targetStatus =
      if (body.status == SubmissionStatus.Approved) LevelStatus.Published else LevelStatus.Rejected
    val publishedAt = if (body.status == SubmissionStatus.Approved) Some(updatedAt) else None
    val rejectionReason = if (body.status == SubmissionStatus.Approved) None else body.reviewNote

    EitherT.liftF(
      IO(
        BirdDesignTable.updateReviewStatus(
          connection = connection,
          designId = submission.birdDesignId,
          status = targetStatus,
          rejectionReason = rejectionReason,
          publishedAt = publishedAt,
          updatedAt = updatedAt
        )
      )
    ).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: ${submission.birdDesignId}"))
      case Some(_) =>
        EitherT.rightT(())
    }
  }
}
