package microservice.core

import cats.effect.IO
import java.sql.Connection

trait DatabaseSession {
  def config: DatabaseConfig
  def description: String

  def withConnection[A](use: Connection => IO[A]): IO[A]
}

object DatabaseSession {
  def inMemory(configValue: DatabaseConfig): DatabaseSession =
    new DatabaseSession {
      override val config: DatabaseConfig = configValue
      override val description: String =
        s"${config.driver}:${config.schema}@${config.url}"

      override def withConnection[A](use: Connection => IO[A]): IO[A] =
        use(null.asInstanceOf[Connection])
    }
}
