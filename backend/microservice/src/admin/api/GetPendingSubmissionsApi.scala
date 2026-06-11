package microservice.admin.api

import cats.effect.IO
import java.sql.Connection
import microservice.user.tables.user.UserTable
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.SubmissionWithLevel
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.submission.{SubmissionTable}
import microservice.system.objects.UserRole

/** 列出所有待审核的关卡投稿，附带关联关卡快照。
  *
  * 实现：校验 UserRole.Admin → SubmissionTable.listPending → 逐条 join LevelTable → SubmissionWithLevel。
  * 关联：GET /admin/submissions/pending；ReviewSubmissionAPIMessage 处理单条审核。
  */
final case class GetPendingSubmissionsAPIMessage(userId: String) extends APIWithTokenMessage[List[SubmissionWithLevel]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[SubmissionWithLevel]]] =
    IO.pure {
      UserTable.findById(connection, userId) match {
        case Some(user) if user.role == UserRole.Admin =>
          Right(
            SubmissionTable.listPending(connection)
              .flatMap(submission =>
                LevelTable.findById(connection, submission.levelId)
                  .map(level => SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level)))
              )
              .toList
          )
        case Some(_) => Left(HttpError.forbidden("Admin role is required"))
        case None => Left(HttpError.unauthorized("Unknown user"))
      }
    }
}

