package microservice.core

import cats.effect.IO
import java.sql.Connection
import java.sql.DriverManager

trait DatabaseSession {
  def config: DatabaseConfig
  def description: String

  def withConnection[A](use: Connection => IO[A]): IO[A]

  def withTransaction[A](use: Connection => IO[A]): IO[A]
}

object DatabaseSession {
  private def closeQuietly(connection: Connection): IO[Unit] =
    IO.blocking(connection.close()).handleErrorWith(_ => IO.unit)

  def inMemory(configValue: DatabaseConfig): DatabaseSession =
    new DatabaseSession {
      override val config: DatabaseConfig = configValue
      override val description: String =
        s"${config.driver}:${config.schema}@${config.url}"

      override def withConnection[A](use: Connection => IO[A]): IO[A] =
        use(null.asInstanceOf[Connection])

      override def withTransaction[A](use: Connection => IO[A]): IO[A] =
        withConnection(use)
    }

  def jdbc(configValue: DatabaseConfig): DatabaseSession =
    new DatabaseSession {
      override val config: DatabaseConfig = configValue
      override val description: String =
        s"${config.driver}:${config.schema}@${config.url}"

      override def withConnection[A](use: Connection => IO[A]): IO[A] =
        IO.blocking {
          Class.forName(config.driver)
          (config.username, config.password) match {
            case (Some(username), Some(password)) =>
              DriverManager.getConnection(config.url, username, password)
            case _ =>
              DriverManager.getConnection(config.url)
          }
        }.bracket(use)(closeQuietly)

      override def withTransaction[A](use: Connection => IO[A]): IO[A] =
        withConnection { connection =>
          for {
            previousAutoCommit <- IO.blocking(connection.getAutoCommit)
            _ <- IO.blocking(connection.setAutoCommit(false))
            result <- use(connection).attempt.flatMap {
              case Right(value) =>
                IO.blocking(connection.commit()).as(value)
              case Left(error) =>
                IO.blocking(connection.rollback()).attempt *> IO.raiseError[A](error)
            }.guarantee(IO.blocking(connection.setAutoCommit(previousAutoCommit)).handleErrorWith(_ => IO.unit))
          } yield result
        }
    }
}
