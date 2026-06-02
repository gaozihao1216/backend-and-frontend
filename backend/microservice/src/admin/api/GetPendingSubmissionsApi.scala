package microservice.admin.api

import cats.effect.IO
import java.sql.Connection
import microservice.auth.tables.UserTable
import microservice.core.{APIWithTokenMessage, HttpError, RowMappers}
import microservice.level.objects.SubmissionWithLevel
import microservice.level.tables.{LevelTable, SubmissionTable}
import microservice.system.objects.UserRole

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
                  .map(level => SubmissionWithLevel.from(RowMappers.toSubmission(submission), RowMappers.toLevel(level)))
              )
              .toList
          )
        case Some(_) => Left(HttpError.forbidden("Admin role is required"))
        case None => Left(HttpError.unauthorized("Unknown user"))
      }
    }
}

object GetPendingSubmissionsEndpoint {
  val name: String = "GetPendingSubmissions"
  val method: String = "GET"
  val path: String = "/admin/submissions/pending"
  val businessLogic: String =
    "管理员读取 pending_review submissions，并附带关联 level 对象。"
}
