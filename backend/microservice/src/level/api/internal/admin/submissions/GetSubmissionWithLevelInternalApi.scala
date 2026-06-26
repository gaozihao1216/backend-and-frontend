package microservice.level.api.internal.admin.submissions

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.submission.SubmissionWithLevel
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.tables.submission.SubmissionTable

/** 模块间 API：按 submissionId 联查投稿与关卡；由 admin 模块调用，不挂路由。 */
final case class GetSubmissionWithLevelInternalAPIMessage(submissionId: String) extends APIMessage[SubmissionWithLevel] {
  override def plan(connection: Connection): IO[Either[HttpError, SubmissionWithLevel]] =
    PlanSteps.finish {
      requireSubmissionWithLevel(connection)
    }

  private def requireSubmissionWithLevel(connection: Connection): cats.data.EitherT[IO, HttpError, SubmissionWithLevel] =
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
