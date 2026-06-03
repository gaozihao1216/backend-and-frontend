package microservice.core

import cats.effect.IO
import java.sql.Connection

trait APIMessage[A] {
  def plan(connection: Connection): IO[Either[HttpError, A]]

  final def run(databaseSession: DatabaseSession): IO[Either[HttpError, A]] =
    databaseSession
      .withTransaction { connection =>
        plan(connection).flatMap {
          case Right(value) => IO.pure(Right(value))
          case Left(error) => IO.raiseError(APIMessage.RollbackHttpError(error))
        }
      }
      .handleErrorWith {
        case APIMessage.RollbackHttpError(error) => IO.pure(Left(error))
        case error => IO.raiseError(error)
      }
}

trait APIWithTokenMessage[A] extends APIMessage[A] {
  def token: String
}

object APIMessage {
  private final case class RollbackHttpError(error: HttpError) extends RuntimeException(error.message)
}
