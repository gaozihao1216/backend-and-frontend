package microservice.core

import cats.effect.IO
import java.time.Instant
import microservice.auth.tables.UserTable
import microservice.level.tables.{CommentTable, FavoriteTable, LevelTable, RatingTable, SubmissionTable}
import microservice.routes.ApiRouter
import org.http4s.HttpRoutes

object SystemDefaults {
  val databaseConfig: DatabaseConfig =
    DatabaseConfig(
      driver = sys.env.getOrElse("UGC_DATABASE_DRIVER", "org.postgresql.Driver"),
      url = sys.env.getOrElse("UGC_DATABASE_URL", "jdbc:postgresql://localhost:5432/ugc_level_platform"),
      schema = sys.env.getOrElse("UGC_DATABASE_SCHEMA", "public"),
      username = sys.env.get("UGC_DATABASE_USERNAME"),
      password = sys.env.get("UGC_DATABASE_PASSWORD")
    )

  val databaseSession: DatabaseSession =
    sys.env.get("UGC_DATABASE_MODE") match {
      case Some("jdbc") => DatabaseSession.jdbc(databaseConfig)
      case _ => DatabaseSession.inMemory(databaseConfig)
    }

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
        FavoriteTable.initialize(connection)
      }
    }
}
