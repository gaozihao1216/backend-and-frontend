package microservice.level.api.design

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.support.design.LevelDesignAccess
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.submission.Submission
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.SubmissionRow
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.{LevelStatus, SubmissionStatus, UserRole}
import microservice.level.api.design.body.SubmitLevelBody

/** 设计师提交关卡审核 APIMessage。 */
final case class SubmitLevelAPIMessage(
  designerId: String,
  body: SubmitLevelBody
) extends APIWithTokenMessage[Submission] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, Submission]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ())
        level <- LevelDesignAccess.requireLevel(connection, body.levelId)
        _ <- LevelDesignAccess.requireSubmittable(connection, designerId, level)
        submission <- PlanSteps.read {
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
          LevelRowMapper.toSubmission(row)
        }
      } yield submission
    }
}
