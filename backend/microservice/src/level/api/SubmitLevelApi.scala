package microservice.level.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError, RowMappers}
import microservice.level.objects.Submission
import microservice.level.tables.{LevelTable, SubmissionRow, SubmissionTable}
import microservice.system.objects.{LevelStatus, SubmissionStatus}
import microservice.system.objects.UserRole
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class SubmitLevelBody(
  levelId: String
)

object SubmitLevelBody {
  implicit val encoder: Encoder[SubmitLevelBody] = deriveEncoder
  implicit val decoder: Decoder[SubmitLevelBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, SubmitLevelBody] = jsonOf
}

final case class SubmitLevelAPIMessage(
  designerId: String,
  body: SubmitLevelBody
) extends APIWithTokenMessage[Submission] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, Submission]] =
    IO.pure {
      AccessControl.requireRole(connection, designerId, UserRole.Designer).flatMap { _ =>
        LevelTable.findById(connection, body.levelId) match {
        case None =>
          Left(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: ${body.levelId}"))
        case Some(level) =>
          if (level.authorId != designerId) {
            Left(HttpError.forbidden("Cannot submit another designer's level"))
          } else if (SubmissionTable.hasPendingForLevel(connection, body.levelId)) {
            Left(HttpError.conflict("SUBMISSION_EXISTS", "Level already has a pending submission"))
          } else if (level.status != LevelStatus.Draft && level.status != LevelStatus.Rejected) {
            Left(HttpError.conflict("INVALID_LEVEL_STATUS", "Level cannot be submitted in current status"))
          } else {
            val timestamp = Instant.now().toString
            LevelTable.updateSubmissionStatus(connection, body.levelId, LevelStatus.PendingReview, None, timestamp)
            val row = SubmissionTable.insert(
              connection,
              SubmissionRow(
                id = SubmissionTable.nextId(connection),
                levelId = body.levelId,
                submitterId = designerId,
                status = SubmissionStatus.PendingReview,
                reviewerId = None,
                reviewNote = None,
                submittedAt = timestamp,
                reviewedAt = None
              )
            )
            Right(RowMappers.toSubmission(row))
          }
        }
      }
    }
}

object SubmitLevelEndpoint {
  val name: String = "SubmitLevel"
  val method: String = "POST"
  val path: String = "/designer/submissions"
  val businessLogic: String =
    "设计师提交自己的 draft/rejected 关卡进入 pending_review 状态，并生成待审核 submission。"
}
