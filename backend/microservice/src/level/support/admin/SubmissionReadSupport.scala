package microservice.level.support.admin

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.level.objects.submission.SubmissionWithLevel
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.tables.submission.SubmissionTable

/** 投稿与关卡联查（level 模块内）；供 internal API 与 HTTP API 复用。 */
object SubmissionReadSupport {
  def listPendingWithLevel(connection: Connection): List[SubmissionWithLevel] =
    SubmissionTable.listPending(connection)
      .flatMap { submission =>
        LevelTable.findById(connection, submission.levelId).map { level =>
          SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
        }
      }
      .toList

  def requireSubmissionWithLevel(connection: Connection, submissionId: String): Step[SubmissionWithLevel] =
    EitherT.liftF(IO(SubmissionTable.findById(connection, submissionId))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("SUBMISSION_NOT_FOUND", s"Submission not found: $submissionId"))
      case Some(submission) =>
        EitherT.liftF(IO(LevelTable.findById(connection, submission.levelId))).flatMap {
          case None =>
            EitherT.leftT(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found for submission: $submissionId"))
          case Some(level) =>
            EitherT.rightT(
              SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
            )
        }
    }

  def listApprovedWithLevel(connection: Connection, excludeSubmissionIds: Set[String]): List[SubmissionWithLevel] =
    SubmissionTable.listApproved(connection)
      .filterNot(submission => excludeSubmissionIds.contains(submission.id))
      .flatMap { submission =>
        LevelTable.findById(connection, submission.levelId).map { level =>
          SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
        }
      }
      .toList
}
