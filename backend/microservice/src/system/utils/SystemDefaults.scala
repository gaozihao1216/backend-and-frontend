package microservice.system.utils

import cats.effect.IO
import java.time.Instant
import microservice.admin.support.bootstrap.AdminStorageBootstrap
import microservice.bird.support.bootstrap.BirdStorageBootstrap
import microservice.bird.support.catalog.SystemBirdCatalogSupport
import microservice.infrastructure.database.{DatabaseConfig, DatabaseSession}
import microservice.level.support.bootstrap.LevelStorageBootstrap
import microservice.player.support.bootstrap.PlayerStorageBootstrap
import microservice.routes.ApiRouter
import microservice.ui.support.bootstrap.UiStorageBootstrap
import microservice.user.support.bootstrap.UserStorageBootstrap
import org.http4s.HttpRoutes

/** 应用级默认装配：数据库会话、种子数据、HTTP 路由树。 */
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
      case Some("jdbc") =>
        DatabaseSession.jdbc(databaseConfig)
      case _ =>
        DatabaseSession.inMemory(databaseConfig)
    }

  private val createdAt = Instant.now().toString
  private val reviewedAt = createdAt

  SystemSeedData.reset(createdAt, reviewedAt)

  def apiRoutes: HttpRoutes[cats.effect.IO] =
    ApiRouter.routes(databaseSession = databaseSession)

  def initializeDatabaseOn(session: DatabaseSession): IO[Unit] =
    session.withTransaction { connection =>
      IO.blocking {
        UserStorageBootstrap.initialize(connection)
        LevelStorageBootstrap.initialize(connection)
        AdminStorageBootstrap.initialize(connection)
        UiStorageBootstrap.initialize(connection)
        PlayerStorageBootstrap.initialize(connection, SystemBirdCatalogSupport.birdTypes)
        BirdStorageBootstrap.initialize(connection)
        if (connection != null) {
          SystemJdbcSeedData.seed(connection)
        }
      }
    }

  def initializeDatabase: IO[Unit] =
    initializeDatabaseOn(databaseSession)
}
