package microservice.level.api.internal.admin

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.submission.SubmissionWithLevel
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.{LevelRowMapper, SubmissionRow}
import microservice.level.tables.slot_assignment.LevelSlotAssignmentTable
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.enums.{LevelStatus, SubmissionStatus}

/** 模块间 API：总监废止已批准投稿；由 admin HTTP API 调用，不挂路由。 */
final case class AbolishApprovedSubmissionInternalAPIMessage(
  submissionId: String,
  reviewerId: String,
  note: Option[String]
) extends APIMessage[SubmissionWithLevel] {
  override def plan(connection: Connection): IO[Either[HttpError, SubmissionWithLevel]] =
    PlanSteps.finish {
      for {
        submission <- requireAbolishableSubmission(connection)
        _ <- abolishSubmission(connection, submission)
        result <- requireSubmissionWithLevel(connection)
      } yield result
    }

  private def requireAbolishableSubmission(connection: Connection): microservice.infrastructure.api.PlanStep.Step[SubmissionRow] =
    EitherT.liftF(IO(SubmissionTable.findById(connection, submissionId))).flatMap {
      case None =>
        EitherT.leftT[IO, SubmissionRow](HttpError.notFound("SUBMISSION_NOT_FOUND", s"Submission not found: $submissionId"))
      case Some(submission) if submission.status != SubmissionStatus.Approved =>
        EitherT.leftT[IO, SubmissionRow](
          HttpError.badRequest("SUBMISSION_NOT_ABOLISHABLE", s"Only approved submissions can be abolished: $submissionId")
        )
      case Some(submission) =>
        EitherT.rightT[IO, HttpError](submission)
    }

  private def abolishSubmission(connection: Connection, submission: SubmissionRow): microservice.infrastructure.api.PlanStep.Step[Unit] =
    PlanSteps.read {
      val timestamp = Instant.now().toString
      val abolishNote = note.filter(_.trim.nonEmpty).map(_.trim)
      LevelSlotAssignmentTable.deleteBySubmissionId(connection, submission.id)
      SubmissionTable.updateReview(
        connection = connection,
        submissionId = submission.id,
        status = SubmissionStatus.Abolished,
        reviewerId = reviewerId,
        reviewNote = abolishNote.orElse(Some("Abolished by director.")),
        reviewedAt = timestamp
      )
      LevelTable.updateReviewStatus(
        connection = connection,
        levelId = submission.levelId,
        status = LevelStatus.Rejected,
        rejectionReason = abolishNote.orElse(Some("Abolished by director.")),
        publishedAt = None,
        updatedAt = timestamp
      )
      ()
    }

  private def requireSubmissionWithLevel(connection: Connection): microservice.infrastructure.api.PlanStep.Step[SubmissionWithLevel] =
    EitherT.liftF(IO(SubmissionTable.findById(connection, submissionId))).flatMap {
      case None =>
        EitherT.leftT[IO, SubmissionWithLevel](
          HttpError.notFound("SUBMISSION_NOT_FOUND", s"Submission not found: $submissionId")
        )
      case Some(submission) =>
        EitherT.liftF(IO(LevelTable.findById(connection, submission.levelId))).flatMap {
          case None =>
            EitherT.leftT[IO, SubmissionWithLevel](
              HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found for submission: $submissionId")
            )
          case Some(level) =>
            EitherT.rightT[IO, HttpError](
              SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
            )
        }
    }
}
