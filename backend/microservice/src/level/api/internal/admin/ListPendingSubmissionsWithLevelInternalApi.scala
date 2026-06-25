package microservice.level.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.submission.SubmissionWithLevel
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.tables.submission.SubmissionTable

/** 模块间 API：列出待审投稿及关联关卡；由 admin HTTP API 调用，不挂路由。 */
final case class ListPendingSubmissionsWithLevelInternalAPIMessage() extends APIMessage[List[SubmissionWithLevel]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[SubmissionWithLevel]]] =
    PlanSteps.finish {
      PlanSteps.read(
        SubmissionTable.listPending(connection)
          .flatMap { submission =>
            LevelTable.findById(connection, submission.levelId).map { level =>
              SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
            }
          }
          .toList
      )
    }
}
