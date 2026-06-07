package microservice.admin.api

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.{
  AssignLevelSlotErrors,
  DirectorLevelAssignmentBoard,
  LevelSlotAssignment,
  LevelSlotAssignmentDetail,
  LevelSlotCatalog
}
import microservice.auth.utils.AccessControl
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.level.tables.LevelRowMapper
import microservice.level.objects.SubmissionWithLevel
import microservice.level.tables.{LevelSlotAssignmentRow, LevelSlotAssignmentTable, LevelTable, SubmissionTable}
import microservice.system.objects.{AdminLevel, LevelStatus, SubmissionStatus}

object DirectorLevelAssignmentSupport {
  def submissionWithLevel(connection: Connection, submissionId: String): Option[SubmissionWithLevel] =
    SubmissionTable.findById(connection, submissionId).flatMap { submission =>
      LevelTable.findById(connection, submission.levelId).map { level =>
        SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
      }
    }

  def buildBoard(connection: Connection): DirectorLevelAssignmentBoard = {
    val assignedSubmissionIds =
      LevelSlotAssignmentTable.listAll(connection).map(_.submissionId).toSet

    val assignments =
      LevelSlotAssignmentTable.listAll(connection).flatMap { row =>
        submissionWithLevel(connection, row.submissionId).map { submission =>
          LevelSlotAssignmentDetail(LevelSlotAssignment.from(row), submission)
        }
      }.toList

    val pendingApproved =
      SubmissionTable.listApproved(connection)
        .filterNot(submission => assignedSubmissionIds.contains(submission.id))
        .flatMap(submission =>
          LevelTable.findById(connection, submission.levelId).map { level =>
            SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
          }
        )
        .toList

    DirectorLevelAssignmentBoard(
      assignments = assignments,
      pendingApproved = pendingApproved
    )
  }
}

final case class GetDirectorLevelAssignmentBoardAPIMessage(
  userId: String
) extends APIWithTokenMessage[DirectorLevelAssignmentBoard] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, DirectorLevelAssignmentBoard]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map { _ =>
        DirectorLevelAssignmentSupport.buildBoard(connection)
      }
    }
}

final case class AssignLevelSlotBody(
  submissionId: String,
  note: Option[String]
)

object AssignLevelSlotBody {
  import io.circe.generic.semiauto._
  import io.circe.{Decoder, Encoder}
  import org.http4s.EntityDecoder
  import org.http4s.circe.jsonOf

  implicit val encoder: Encoder[AssignLevelSlotBody] = deriveEncoder
  implicit val decoder: Decoder[AssignLevelSlotBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, AssignLevelSlotBody] = jsonOf
}

final case class AssignLevelSlotAPIMessage(
  userId: String,
  levelSuffix: String,
  body: AssignLevelSlotBody
) extends APIWithTokenMessage[LevelSlotAssignmentDetail] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, LevelSlotAssignmentDetail]] =
    IO.pure {
      for {
        user <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director)
        _ <-
          if (LevelSlotCatalog.isSupported(levelSuffix)) Right(())
          else Left(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)
        submission <- SubmissionTable.findById(connection, body.submissionId).toRight(
          AssignLevelSlotErrors.SubmissionMissing(body.submissionId).toHttpError
        )
        _ <-
          if (submission.status == SubmissionStatus.Approved) Right(())
          else Left(AssignLevelSlotErrors.SubmissionNotApproved(body.submissionId).toHttpError)
        _ <- LevelTable.findById(connection, submission.levelId).toRight(
          AssignLevelSlotErrors.LinkedLevelMissing(submission.levelId).toHttpError
        )
      } yield {
        val timestamp = java.time.Instant.now().toString
        val row = LevelSlotAssignmentRow(
          id = LevelSlotAssignmentTable.nextId(connection),
          levelSuffix = levelSuffix,
          submissionId = submission.id,
          sourceLevelId = submission.levelId,
          assignedById = user.id,
          assignedAt = timestamp,
          note = body.note
        )
        LevelSlotAssignmentTable.upsert(connection, row)
        val submissionWithLevel =
          DirectorLevelAssignmentSupport
            .submissionWithLevel(connection, submission.id)
            .getOrElse(
              throw new IllegalStateException(s"Submission level missing after assign: ${submission.id}")
            )
        LevelSlotAssignmentDetail(LevelSlotAssignment.from(row), submissionWithLevel)
      }
    }
}

final case class UnassignLevelSlotAPIMessage(
  userId: String,
  levelSuffix: String
) extends APIWithTokenMessage[LevelSlotAssignment] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, LevelSlotAssignment]] =
    IO.pure {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director)
        _ <-
          if (LevelSlotCatalog.isSupported(levelSuffix)) Right(())
          else Left(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)
        existing <- LevelSlotAssignmentTable.findBySuffix(connection, levelSuffix).toRight(
          AssignLevelSlotErrors.AssignmentMissing(levelSuffix).toHttpError
        )
        _ <-
          if (LevelSlotAssignmentTable.deleteBySuffix(connection, levelSuffix)) Right(())
          else Left(AssignLevelSlotErrors.AssignmentMissing(levelSuffix).toHttpError)
      } yield LevelSlotAssignment.from(existing)
    }
}

final case class AbolishDirectorSubmissionBody(
  note: Option[String]
)

object AbolishDirectorSubmissionBody {
  import io.circe.generic.semiauto._
  import io.circe.{Decoder, Encoder}
  import org.http4s.EntityDecoder
  import org.http4s.circe.jsonOf

  implicit val encoder: Encoder[AbolishDirectorSubmissionBody] = deriveEncoder
  implicit val decoder: Decoder[AbolishDirectorSubmissionBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, AbolishDirectorSubmissionBody] = jsonOf
}

final case class AbolishDirectorSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: AbolishDirectorSubmissionBody
) extends APIWithTokenMessage[SubmissionWithLevel] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, SubmissionWithLevel]] =
    IO.pure {
      for {
        user <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director)
        submission <- SubmissionTable.findById(connection, submissionId).toRight(
          AssignLevelSlotErrors.SubmissionMissing(submissionId).toHttpError
        )
        _ <-
          if (submission.status == SubmissionStatus.Approved) Right(())
          else Left(AssignLevelSlotErrors.SubmissionNotAbolishable(submissionId).toHttpError)
      } yield {
        val timestamp = java.time.Instant.now().toString
        val abolishNote = body.note.filter(_.trim.nonEmpty).map(_.trim)

        LevelSlotAssignmentTable.deleteBySubmissionId(connection, submission.id)

        SubmissionTable.updateReview(
          connection = connection,
          submissionId = submission.id,
          status = SubmissionStatus.Abolished,
          reviewerId = user.id,
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

        DirectorLevelAssignmentSupport
          .submissionWithLevel(connection, submission.id)
          .getOrElse(throw new IllegalStateException(s"Submission missing after abolish: ${submission.id}"))
      }
    }
}
