package microservice.bird.support.design

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.bird.objects.design.BirdDesign
import microservice.bird.objects.submission.BirdSubmission
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.shared.{BirdDesignRow, BirdRowMapper, BirdSubmissionRow}
import microservice.bird.tables.submission.BirdSubmissionTable
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, SubmissionStatus}

/** 设计师鸟类设计的所有权、状态与写操作结果校验。 */
object BirdDesignAccess {
  def requireEditable(connection: Connection, designerId: String, designId: String): Step[BirdDesignRow] =
    EitherT.liftF(IO(BirdDesignTable.findById(connection, designId))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
      case Some(row) if row.authorId != designerId =>
        EitherT.leftT(HttpError.forbidden("Cannot edit another designer's bird design"))
      case Some(row) if row.status != LevelStatus.Draft && row.status != LevelStatus.Rejected =>
        EitherT.leftT(HttpError.conflict("INVALID_BIRD_STATUS", "Only draft or rejected designs can be edited"))
      case Some(row) =>
        EitherT.rightT(row)
    }

  def requireDeletable(connection: Connection, designerId: String, designId: String): Step[BirdDesignRow] =
    EitherT.liftF(IO(BirdDesignTable.findById(connection, designId))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
      case Some(row) if row.authorId != designerId =>
        EitherT.leftT(HttpError.forbidden("Cannot delete another designer's bird design"))
      case Some(row) if row.status != LevelStatus.Draft =>
        EitherT.leftT(HttpError.conflict("INVALID_BIRD_STATUS", "Only draft designs can be deleted"))
      case Some(row) =>
        EitherT.rightT(row)
    }

  def requireSubmittable(connection: Connection, designerId: String, designId: String): Step[Unit] =
    EitherT.liftF(IO(BirdDesignTable.findById(connection, designId))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
      case Some(design) if design.authorId != designerId =>
        EitherT.leftT(HttpError.forbidden("Cannot submit another designer's bird design"))
      case Some(design) if BirdSubmissionTable.hasPendingForDesign(connection, designId) =>
        EitherT.leftT(HttpError.conflict("SUBMISSION_EXISTS", "Bird design already has a pending submission"))
      case Some(design) if design.status != LevelStatus.Draft && design.status != LevelStatus.Rejected =>
        EitherT.leftT(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design cannot be submitted in current status"))
      case Some(_) =>
        EitherT.rightT(())
    }

  def requireDeleteResult(connection: Connection, designId: String, designerId: String, existing: BirdDesignRow): Step[BirdDesign] =
    EitherT.liftF(IO(BirdDesignTable.deleteDraft(connection, designId, designerId))).flatMap {
      case true  => EitherT.rightT(BirdRowMapper.toBirdDesign(existing))
      case false => EitherT.leftT(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not be deleted"))
    }

  def requireUpdateResult(connection: Connection, updatedRow: BirdDesignRow): Step[BirdDesign] =
    EitherT.liftF(IO(BirdDesignTable.updateEditable(connection, updatedRow))).flatMap {
      case None    => EitherT.leftT(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not be updated"))
      case Some(row) => EitherT.rightT(BirdRowMapper.toBirdDesign(row))
    }

  def requireSubmitResult(connection: Connection, designerId: String, designId: String): Step[BirdSubmission] = {
    val timestamp = java.time.Instant.now().toString
    EitherT.liftF(
      IO(
        BirdDesignTable.updateSubmissionStatus(
          connection,
          designId,
          LevelStatus.PendingReview,
          None,
          timestamp
        )
      )
    ).flatMap {
      case None =>
        EitherT.leftT(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not enter review"))
      case Some(_) =>
        EitherT.rightT {
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
          BirdRowMapper.toBirdSubmission(row)
        }
    }
  }
}
