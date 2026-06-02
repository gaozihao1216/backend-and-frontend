package microservice.level.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
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

final case class SubmitLevelRequest(
  designerId: String,
  levelId: String
)

object SubmitLevelRequest {
  implicit val encoder: Encoder[SubmitLevelRequest] = deriveEncoder
  implicit val decoder: Decoder[SubmitLevelRequest] = deriveDecoder
}

final case class SubmitLevelResponse(
  submission: Submission
)

object SubmitLevelResponse {
  implicit val encoder: Encoder[SubmitLevelResponse] = deriveEncoder
  implicit val decoder: Decoder[SubmitLevelResponse] = deriveDecoder
}

final case class SubmitLevelAPIMessage(
  token: String,
  body: SubmitLevelBody
) extends APIWithTokenMessage[Submission] {
  override def plan(connection: Connection): IO[Either[HttpError, Submission]] =
    IO.pure {
      AccessControl.requireRole(token, UserRole.Designer).flatMap { _ =>
        LevelTable.indexWhere(_.id == body.levelId) match {
        case -1 =>
          Left(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: ${body.levelId}"))
        case levelIndex =>
          val level = LevelTable.all(levelIndex)
          if (level.authorId != token) {
            Left(HttpError.forbidden("Cannot submit another designer's level"))
          } else if (SubmissionTable.exists(submission => submission.levelId == body.levelId && submission.status == SubmissionStatus.PendingReview)) {
            Left(HttpError.conflict("SUBMISSION_EXISTS", "Level already has a pending submission"))
          } else if (level.status != LevelStatus.Draft && level.status != LevelStatus.Rejected) {
            Left(HttpError.conflict("INVALID_LEVEL_STATUS", "Level cannot be submitted in current status"))
          } else {
            val timestamp = "2026-05-26T12:30:00Z"
            LevelTable.update(levelIndex, level.copy(status = LevelStatus.PendingReview, rejectionReason = None, updatedAt = timestamp))
            val row = SubmissionTable.insert(
              SubmissionRow(
                id = s"submission-${SubmissionTable.count + 1}",
                levelId = body.levelId,
                submitterId = token,
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
