package microservice.admin.api.submissions

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.submission.SubmissionWithLevel
import microservice.level.tables.level.LevelTable
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.AdminLevel

/** 列出所有待审核的关卡投稿，附带关联关卡快照。 */
final case class GetPendingSubmissionsAPIMessage(userId: String) extends APIWithTokenMessage[List[SubmissionWithLevel]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[SubmissionWithLevel]]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ()))
        submissions <- PlanSteps.read(
          SubmissionTable.listPending(connection)
            .flatMap { submission =>
              LevelTable.findById(connection, submission.levelId).map { level =>
                SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
              }
            }
            .toList
        )
      } yield submissions
    }
}
