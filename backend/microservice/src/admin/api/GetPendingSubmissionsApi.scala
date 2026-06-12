package microservice.admin.api

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.SubmissionWithLevel
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.submission.{SubmissionTable}
import microservice.system.objects.AdminLevel

/** 列出所有待审核的关卡投稿，附带关联关卡快照。
  *
  * 实现：requireAdminLevel(Standard) → SubmissionTable.listPending → join LevelTable。
  * 关联：GET /admin/submissions/pending；ReviewSubmissionAPIMessage 处理单条审核。
  */
final case class GetPendingSubmissionsAPIMessage(userId: String) extends APIWithTokenMessage[List[SubmissionWithLevel]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[SubmissionWithLevel]]] =
    IO.pure(
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map { _ =>
        SubmissionTable.listPending(connection)
          .flatMap(submission =>
            LevelTable.findById(connection, submission.levelId)
              .map(level => SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level)))
          )
          .toList
      }
    )
}
