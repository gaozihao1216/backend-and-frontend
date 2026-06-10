package microservice.infrastructure.database

/** JDBC 连接配置；字段可通过环境变量 UGC_DATABASE_* 覆盖，见 [[microservice.system.utils.SystemDefaults]]。 */
final case class DatabaseConfig(
  driver: String,
  url: String,
  schema: String,
  username: Option[String] = None,
  password: Option[String] = None
)
