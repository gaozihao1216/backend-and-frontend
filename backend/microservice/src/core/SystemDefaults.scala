package microservice.core

import cats.effect.IO
import java.time.Instant
import microservice.auth.tables.UserTable
import microservice.level.tables.{CommentTable, LevelTable, RatingTable, SubmissionTable}
import microservice.routes.ApiRouter
import org.http4s.HttpRoutes

object SystemDefaults {
  val databaseConfig: DatabaseConfig =
    DatabaseConfig(
      driver = "org.postgresql.Driver",
      url = "jdbc:postgresql://localhost:5432/ugc_level_platform",
      schema = "public"
    )

  val databaseSession: DatabaseSession =
    DatabaseSession.inMemory(databaseConfig)

  private val createdAt = Instant.now().toString
  private val reviewedAt = createdAt

  SystemSeedData.reset(createdAt, reviewedAt)

  def apiRoutes: HttpRoutes[cats.effect.IO] =
    ApiRouter.routes(databaseSession = databaseSession)

  def initializeDatabase: IO[Unit] =
    databaseSession.withTransaction { connection =>
      IO.blocking {
        UserTable.initialize(connection)
        LevelTable.initialize(connection)
        SubmissionTable.initialize(connection)
        RatingTable.initialize(connection)
        CommentTable.initialize(connection)
      }
    }
}
