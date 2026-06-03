package microservice.admin.api

import cats.effect.IO
import java.sql.Connection
import microservice.auth.tables.UserTable
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.level.tables.LevelRowMapper
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
                  .map(level => SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level)))
              )
              .toList
          )
        case Some(_) => Left(HttpError.forbidden("Admin role is required"))
        case None => Left(HttpError.unauthorized("Unknown user"))
      }
    }
}

