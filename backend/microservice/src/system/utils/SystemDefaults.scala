package microservice.system.utils

import cats.effect.IO
import java.time.Instant
import microservice.auth.tables.UserTable
import microservice.infrastructure.database.{DatabaseConfig, DatabaseSession}
import microservice.level.tables.{CommentTable, FavoriteTable, LevelSlotAssignmentTable, LevelTable, RatingTable, SubmissionTable}
import microservice.routes.ApiRouter
import microservice.ui.tables.{ButtonTemplateTable, StretchVisualTemplateTable, UiPageTable}
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
      case Some("in_memory") => DatabaseSession.inMemory(databaseConfig)
      case _ => DatabaseSession.jdbc(databaseConfig)
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
        LevelSlotAssignmentTable.initialize(connection)
        RatingTable.initialize(connection)
        CommentTable.initialize(connection)
        FavoriteTable.initialize(connection)
        UiPageTable.initialize(connection)
        ButtonTemplateTable.initialize(connection)
        StretchVisualTemplateTable.initialize(connection)
      }
    }
}
