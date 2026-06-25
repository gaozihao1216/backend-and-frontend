package microservice.level.api.internal.admin.submissions

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanStep, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.submission.Submission
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.{LevelRowMapper, SubmissionRow}
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.enums.{LevelStatus, SubmissionStatus}

/** 模块间 API：审核关卡投稿；由 admin HTTP API 调用，不挂路由。 */
final case class ReviewLevelSubmissionInternalAPIMessage(
  submissionId: String,
  reviewerId: String,
  status: SubmissionStatus,
  reviewNote: Option[String],
  reviewedAt: String
) extends APIMessage[Submission] {
  override def plan(connection: Connection): IO[Either[HttpError, Submission]] =
    PlanSteps.finish {
      for {
        submission <- findPending(connection, submissionId)
        _ <- validateDecision(submission, status)
        updated <- updateSubmission(connection)
        _ <- syncLevel(connection, submission)
      } yield LevelRowMapper.toSubmission(updated)
    }

  private def findPending(connection: Connection, submissionId: String): PlanStep.Step[SubmissionRow] =
    EitherT.liftF(IO(SubmissionTable.findById(connection, submissionId))).flatMap {
      case None      => EitherT.leftT(HttpError.notFound("SUBMISSION_NOT_FOUND", s"Submission not found: $submissionId"))
      case Some(row) => EitherT.rightT(row)
    }

  private def validateDecision(submission: SubmissionRow, status: SubmissionStatus): PlanStep.Step[Unit] =
    if (submission.status != SubmissionStatus.PendingReview) {
      PlanStep.fail(HttpError.conflict("SUBMISSION_ALREADY_REVIEWED", s"Submission already reviewed: ${submission.id}"))
    } else if (status != SubmissionStatus.Approved && status != SubmissionStatus.Rejected) {
      PlanStep.fail(HttpError.badRequest("INVALID_REVIEW_STATUS", s"Invalid review status: $status"))
    } else {
      PlanStep.succeed(())
    }

  private def updateSubmission(connection: Connection): PlanStep.Step[SubmissionRow] =
    EitherT.liftF(
      IO(
        SubmissionTable.updateReview(
          connection = connection,
          submissionId = submissionId,
          status = status,
          reviewerId = reviewerId,
          reviewNote = reviewNote,
          reviewedAt = reviewedAt
        )
      )
    ).flatMap {
      case None      => EitherT.leftT(HttpError.notFound("SUBMISSION_NOT_FOUND", s"Submission not found: $submissionId"))
      case Some(row) => EitherT.rightT(row)
    }

  private def syncLevel(connection: Connection, submission: SubmissionRow): PlanStep.Step[Unit] = {
    val targetStatus =
      if (status == SubmissionStatus.Approved) LevelStatus.Published else LevelStatus.Rejected
    val publishedAt = if (status == SubmissionStatus.Approved) Some(reviewedAt) else None
    val rejectionReason = if (status == SubmissionStatus.Approved) None else reviewNote

    EitherT.liftF(
      IO(
        LevelTable.updateReviewStatus(
          connection = connection,
          levelId = submission.levelId,
          status = targetStatus,
          rejectionReason = rejectionReason,
          publishedAt = publishedAt,
          updatedAt = reviewedAt
        )
      )
    ).flatMap {
      case None    => EitherT.leftT(HttpError.notFound("LEVEL_NOT_FOUND", s"Linked level not found: ${submission.levelId}"))
      case Some(_) => EitherT.rightT(())
    }
  }
}
