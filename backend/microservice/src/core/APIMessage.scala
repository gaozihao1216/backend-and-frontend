package microservice.core

import cats.effect.IO
import java.sql.Connection

trait APIMessage[A] {
  def plan(connection: Connection): IO[Either[HttpError, A]]

  final def run(databaseSession: DatabaseSession): IO[Either[HttpError, A]] =
    databaseSession.withConnection(plan)
}

trait APIWithTokenMessage[A] extends APIMessage[A] {
  def token: String
}
