package microservice.bird.support.design

import java.sql.Connection
import microservice.bird.objects.design.BirdDesign
import microservice.bird.objects.submission.BirdSubmission
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.shared.{BirdDesignRow, BirdRowMapper, BirdSubmissionRow}
import microservice.bird.tables.submission.{BirdSubmissionTable}
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, SubmissionStatus}

/** 设计师鸟类设计的所有权、状态与写操作结果校验。 */
object BirdDesignAccess {
  def requireEditable(connection: Connection, designerId: String, designId: String): Step[BirdDesignRow] =
    PlanStep.fromEither(checkEditable(connection, designerId, designId))

  def requireDeletable(connection: Connection, designerId: String, designId: String): Step[BirdDesignRow] =
    PlanStep.fromEither(checkDeletable(connection, designerId, designId))

  def requireSubmittable(connection: Connection, designerId: String, designId: String): Step[Unit] =
    PlanStep.fromEither(checkSubmittable(connection, designerId, designId))

  def requireDeleteResult(connection: Connection, designId: String, designerId: String, existing: BirdDesignRow): Step[BirdDesign] =
    PlanStep.fromEither(checkDeleteResult(connection, designId, designerId, existing))

  def requireUpdateResult(connection: Connection, updatedRow: BirdDesignRow): Step[BirdDesign] =
    PlanStep.fromEither(checkUpdateResult(connection, updatedRow))

  def requireSubmitResult(connection: Connection, designerId: String, designId: String): Step[BirdSubmission] =
    PlanStep.fromEither(checkSubmitResult(connection, designerId, designId))

  def checkEditable(connection: Connection, designerId: String, designId: String): Either[HttpError, BirdDesignRow] =
    BirdDesignTable.findById(connection, designId) match {
      case None =>
        Left(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
      case Some(row) if row.authorId != designerId =>
        Left(HttpError.forbidden("Cannot edit another designer's bird design"))
      case Some(row) if row.status != LevelStatus.Draft && row.status != LevelStatus.Rejected =>
        Left(HttpError.conflict("INVALID_BIRD_STATUS", "Only draft or rejected designs can be edited"))
      case Some(row) =>
        Right(row)
    }

  def checkDeletable(connection: Connection, designerId: String, designId: String): Either[HttpError, BirdDesignRow] =
    BirdDesignTable.findById(connection, designId) match {
      case None =>
        Left(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
      case Some(row) if row.authorId != designerId =>
        Left(HttpError.forbidden("Cannot delete another designer's bird design"))
      case Some(row) if row.status != LevelStatus.Draft =>
        Left(HttpError.conflict("INVALID_BIRD_STATUS", "Only draft designs can be deleted"))
      case Some(row) =>
        Right(row)
    }

  def checkSubmittable(connection: Connection, designerId: String, designId: String): Either[HttpError, Unit] =
    BirdDesignTable.findById(connection, designId) match {
      case None =>
        Left(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
      case Some(design) if design.authorId != designerId =>
        Left(HttpError.forbidden("Cannot submit another designer's bird design"))
      case Some(design) if BirdSubmissionTable.hasPendingForDesign(connection, designId) =>
        Left(HttpError.conflict("SUBMISSION_EXISTS", "Bird design already has a pending submission"))
      case Some(design) if design.status != LevelStatus.Draft && design.status != LevelStatus.Rejected =>
        Left(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design cannot be submitted in current status"))
      case Some(_) =>
        Right(())
    }

  def checkDeleteResult(connection: Connection, designId: String, designerId: String, existing: BirdDesignRow): Either[HttpError, BirdDesign] =
    if (BirdDesignTable.deleteDraft(connection, designId, designerId)) {
      Right(BirdRowMapper.toBirdDesign(existing))
    } else {
      Left(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not be deleted"))
    }

  def checkUpdateResult(connection: Connection, updatedRow: BirdDesignRow): Either[HttpError, BirdDesign] =
    BirdDesignTable.updateEditable(connection, updatedRow) match {
      case None    => Left(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not be updated"))
      case Some(row) => Right(BirdRowMapper.toBirdDesign(row))
    }

  def checkSubmitResult(connection: Connection, designerId: String, designId: String): Either[HttpError, BirdSubmission] = {
    val timestamp = java.time.Instant.now().toString
    BirdDesignTable.updateSubmissionStatus(
      connection,
      designId,
      LevelStatus.PendingReview,
      None,
      timestamp
    ) match {
      case None =>
        Left(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not enter review"))
      case Some(_) =>
        val row = BirdSubmissionTable.insert(
          connection,
          BirdSubmissionRow(
            id = BirdSubmissionTable.nextId(connection),
            birdDesignId = designId,
            submitterId = designerId,
            status = SubmissionStatus.PendingReview,
            reviewerId = None,
            reviewNote = None,
            submittedAt = timestamp,
            reviewedAt = None
          )
        )
        Right(BirdRowMapper.toBirdSubmission(row))
    }
  }
}
