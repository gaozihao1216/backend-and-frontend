package microservice.level.api.internal.admin.assignment

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.inventory.BirdPool
import microservice.level.objects.slot.SlotAssignment
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.{LevelSlotAssignmentRow, SubmissionRow}
import microservice.level.tables.slot_assignment.LevelSlotAssignmentTable
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.enums.SubmissionStatus

/** 模块间 API：分配关卡槽位；由 admin HTTP API 调用，不挂路由。 */
final case class AssignSlotInternalAPIMessage(
  levelSuffix: String,
  submissionId: String,
  assignedById: String,
  note: Option[String],
  birdPool: BirdPool
) extends APIMessage[SlotAssignment] {
  override def plan(connection: Connection): IO[Either[HttpError, SlotAssignment]] =
    PlanSteps.finish {
      for {
        submission <- requireApprovedSubmission(connection)
        _ <- requireLinkedLevel(connection, submission.levelId)
      } yield {
        val timestamp = Instant.now().toString
        val persisted = LevelSlotAssignmentTable.upsert(
          connection,
          LevelSlotAssignmentRow(
            id = LevelSlotAssignmentTable.nextId(connection),
            levelSuffix = levelSuffix,
            submissionId = submission.id,
            sourceLevelId = submission.levelId,
            assignedById = assignedById,
            assignedAt = timestamp,
            note = note,
            birdPool = Some(birdPool)
          )
        )
        SlotAssignment.from(persisted)
      }
    }

  private def requireApprovedSubmission(connection: Connection): cats.data.EitherT[IO, HttpError, SubmissionRow] =
    EitherT.liftF(IO(SubmissionTable.findById(connection, submissionId))).flatMap {
      case None =>
        EitherT.leftT[IO, SubmissionRow](HttpError.notFound("SUBMISSION_NOT_FOUND", s"Submission not found: $submissionId"))
      case Some(submission) if submission.status != SubmissionStatus.Approved =>
        EitherT.leftT[IO, SubmissionRow](
          HttpError.badRequest("SUBMISSION_NOT_APPROVED", s"Only approved submissions can be assigned: $submissionId")
        )
      case Some(submission) =>
        EitherT.rightT[IO, HttpError](submission)
    }

  private def requireLinkedLevel(connection: Connection, levelId: String): cats.data.EitherT[IO, HttpError, Unit] =
    EitherT.liftF(IO(LevelTable.findById(connection, levelId).isDefined)).flatMap {
      case false => EitherT.leftT[IO, Unit](HttpError.notFound("LEVEL_NOT_FOUND", s"Linked level not found: $levelId"))
      case true  => EitherT.rightT[IO, HttpError](())
    }
}
