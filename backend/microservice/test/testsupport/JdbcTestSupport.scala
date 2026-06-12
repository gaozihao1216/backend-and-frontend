package microservice.testsupport

import microservice.infrastructure.database.{DatabaseConfig, DatabaseSession}

/** JDBC 集成测试 fixture；仅在 UGC_DATABASE_MODE=jdbc 时启用。 */
object JdbcTestSupport {
  val enabled: Boolean =
    sys.env.get("UGC_DATABASE_MODE").contains("jdbc")

  lazy val session: DatabaseSession =
    DatabaseSession.jdbc(
      DatabaseConfig(
        driver = sys.env.getOrElse("UGC_DATABASE_DRIVER", "org.postgresql.Driver"),
        url = sys.env.getOrElse(
          "UGC_DATABASE_URL",
          "jdbc:postgresql://localhost:5432/ugc_level_platform"
        ),
        schema = sys.env.getOrElse("UGC_DATABASE_SCHEMA", "public"),
        username = sys.env.get("UGC_DATABASE_USERNAME"),
        password = sys.env.get("UGC_DATABASE_PASSWORD")
      )
    )
}
