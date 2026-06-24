package microservice.level.support.admin

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.level.objects.inventory.BirdPool
import microservice.level.objects.slot.SlotAssignment
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.{LevelSlotAssignmentRow, SubmissionRow}
import microservice.level.tables.slot_assignment.LevelSlotAssignmentTable
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.{LevelStatus, SubmissionStatus}

/** 总监槽位分配写操作（level 模块内）；供 internal API 与 HTTP API 复用。 */
private[level] object SlotAssignmentSupport {
  def requireAssign(
    connection: Connection,
    levelSuffix: String,
    submissionId: String,
    assignedById: String,
    note: Option[String],
    birdPool: BirdPool
  ): Step[SlotAssignment] =
    for {
      submission <- requireApprovedSubmission(connection, submissionId)
      _ <- requireLinkedLevel(connection, submission.levelId)
    } yield {
      val timestamp = java.time.Instant.now().toString
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

  def requireUnassignBySuffix(connection: Connection, levelSuffix: String): Step[SlotAssignment] =
    for {
      existing <- requireAssignmentForSuffix(connection, levelSuffix)
      deleted <-
        if (LevelSlotAssignmentTable.deleteBySuffix(connection, levelSuffix)) {
          PlanStep.succeed(())
        } else {
          PlanStep.fail(HttpError.notFound("LEVEL_ASSIGNMENT_NOT_FOUND", s"No assignment found for slot: $levelSuffix"))
        }
    } yield SlotAssignment.from(existing)

  def requireUpdateBirdPool(connection: Connection, levelSuffix: String, birdPool: BirdPool): Step[SlotAssignment] =
    for {
      existing <- requireAssignmentForSuffix(connection, levelSuffix)
    } yield SlotAssignment.from(LevelSlotAssignmentTable.upsert(connection, existing.copy(birdPool = Some(birdPool))))

  def requireAbolishApprovedSubmission(
    connection: Connection,
    submissionId: String,
    reviewerId: String,
    note: Option[String]
  ): Step[String] =
    for {
      submission <- requireAbolishableSubmission(connection, submissionId)
    } yield {
      val timestamp = java.time.Instant.now().toString
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
      submission.id
    }

  def listAll(connection: Connection): List[SlotAssignment] =
    LevelSlotAssignmentTable.listAll(connection).map(SlotAssignment.from).toList

  private def requireApprovedSubmission(connection: Connection, submissionId: String): Step[SubmissionRow] =
    EitherT.liftF(IO(SubmissionTable.findById(connection, submissionId))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("SUBMISSION_NOT_FOUND", s"Submission not found: $submissionId"))
      case Some(submission) if submission.status != SubmissionStatus.Approved =>
        EitherT.leftT(
          HttpError.badRequest(
            "SUBMISSION_NOT_APPROVED",
            s"Only approved submissions can be assigned: $submissionId"
          )
        )
      case Some(submission) =>
        EitherT.rightT(submission)
    }

  private def requireAbolishableSubmission(connection: Connection, submissionId: String): Step[SubmissionRow] =
    EitherT.liftF(IO(SubmissionTable.findById(connection, submissionId))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("SUBMISSION_NOT_FOUND", s"Submission not found: $submissionId"))
      case Some(submission) if submission.status != SubmissionStatus.Approved =>
        EitherT.leftT(
          HttpError.badRequest(
            "SUBMISSION_NOT_ABOLISHABLE",
            s"Only approved submissions can be abolished: $submissionId"
          )
        )
      case Some(submission) =>
        EitherT.rightT(submission)
    }

  private def requireLinkedLevel(connection: Connection, levelId: String): Step[Unit] =
    EitherT.liftF(IO(LevelTable.findById(connection, levelId).isDefined)).flatMap {
      case false => EitherT.leftT(HttpError.notFound("LEVEL_NOT_FOUND", s"Linked level not found: $levelId"))
      case true  => EitherT.rightT(())
    }

  private def requireAssignmentForSuffix(connection: Connection, levelSuffix: String): Step[LevelSlotAssignmentRow] =
    EitherT.liftF(IO(LevelSlotAssignmentTable.findBySuffix(connection, levelSuffix))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("LEVEL_ASSIGNMENT_NOT_FOUND", s"No assignment found for slot: $levelSuffix"))
      case Some(row) =>
        EitherT.rightT(row)
    }
}
