package microservice.system.utils

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import microservice.admin.api.internal.system.InitializeAdminStorageInternalAPIMessage
import microservice.bird.api.internal.system.{GetSystemBirdTypesInternalAPIMessage, InitializeBirdStorageInternalAPIMessage}
import microservice.infrastructure.database.{DatabaseConfig, DatabaseSession}
import microservice.infrastructure.http.HttpError
import microservice.level.api.internal.system.InitializeLevelStorageInternalAPIMessage
import microservice.player.api.internal.system.InitializePlayerStorageInternalAPIMessage
import microservice.routes.ApiRouter
import microservice.ui.api.internal.system.InitializeUiStorageInternalAPIMessage
import microservice.user.api.internal.system.InitializeUserStorageInternalAPIMessage
import org.http4s.HttpRoutes

/** 应用级默认装配：数据库会话、种子数据、HTTP 路由树。 */
private[microservice] object SystemDefaults {
  val databaseConfig: DatabaseConfig =
    DatabaseConfig(
      driver = sys.env.getOrElse("UGC_DATABASE_DRIVER", "org.postgresql.Driver"),
      url = sys.env.getOrElse("UGC_DATABASE_URL", "jdbc:postgresql://localhost:5432/ugc_level_platform"),
      schema = sys.env.getOrElse("UGC_DATABASE_SCHEMA", "public"),
      username = sys.env.get("UGC_DATABASE_USERNAME"),
      password = sys.env.get("UGC_DATABASE_PASSWORD")
    )

  val databaseSession: DatabaseSession =
    DatabaseSession.jdbc(databaseConfig)

  def apiRoutes: HttpRoutes[cats.effect.IO] =
    ApiRouter.routes(databaseSession = databaseSession)

  def initializeDatabaseOn(session: DatabaseSession): IO[Unit] =
    session.withTransaction { connection =>
      IO.blocking {
        runInternal(InitializeUserStorageInternalAPIMessage().plan(connection), "initialize user storage")
        runInternal(InitializeLevelStorageInternalAPIMessage().plan(connection), "initialize level storage")
        runInternal(InitializeAdminStorageInternalAPIMessage().plan(connection), "initialize admin storage")
        runInternal(InitializeUiStorageInternalAPIMessage().plan(connection), "initialize UI storage")
        val systemBirdTypes =
          runInternal(GetSystemBirdTypesInternalAPIMessage().plan(connection), "load system bird types")
        runInternal(InitializePlayerStorageInternalAPIMessage(systemBirdTypes).plan(connection), "initialize player storage")
        runInternal(InitializeBirdStorageInternalAPIMessage().plan(connection), "initialize bird storage")
        SystemJdbcSeedData.seed(connection)
      }
    }

  def initializeDatabase: IO[Unit] =
    initializeDatabaseOn(databaseSession)

  private def runInternal[A](action: IO[Either[HttpError, A]], label: String): A =
    action.unsafeRunSync() match {
      case Right(value) => value
      case Left(error)  => throw new IllegalStateException(s"Failed to $label: ${error.message}")
    }
}
