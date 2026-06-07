package microservice.bird.api

import cats.effect.IO
import java.sql.Connection
import microservice.auth.tables.UserTable
import microservice.bird.objects.BirdSubmissionWithDesign
import microservice.bird.tables.{BirdDesignTable, BirdRowMapper, BirdSubmissionTable}
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.UserRole

final case class GetPendingBirdSubmissionsAPIMessage(userId: String)
    extends APIWithTokenMessage[List[BirdSubmissionWithDesign]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[BirdSubmissionWithDesign]]] =
    IO.pure {
      UserTable.findById(connection, userId) match {
        case Some(user) if user.role == UserRole.Admin =>
          Right(
            BirdSubmissionTable
              .listPending(connection)
              .flatMap { submission =>
                BirdDesignTable.findById(connection, submission.birdDesignId).map { design =>
                  BirdSubmissionWithDesign.from(
                    BirdRowMapper.toBirdSubmission(submission),
                    BirdRowMapper.toBirdDesign(design)
                  )
                }
              }
              .toList
          )
        case Some(_) => Left(HttpError.forbidden("Admin role is required"))
        case None => Left(HttpError.unauthorized("Unknown user"))
      }
    }
}
