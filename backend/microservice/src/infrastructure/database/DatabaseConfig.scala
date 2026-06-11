package microservice.infrastructure.database

/** JDBC 连接配置值对象。
  *
  * 实现：字段可通过环境变量 UGC_DATABASE_* 覆盖，见 [[microservice.system.utils.SystemDefaults.databaseConfig]]。
  * 关联：[[DatabaseSession]] 在 jdbc 模式下使用此配置打开 PostgreSQL 连接。
  */
final case class DatabaseConfig(
  driver: String,              // JDBC 驱动类名，默认 org.postgresql.Driver
  url: String,                 // 连接 URL，如 jdbc:postgresql://localhost:5432/ugc_level_platform
  schema: String,              // 逻辑 schema 名，用于日志描述
  username: Option[String] = None, // 可选用户名；无则 DriverManager 匿名连接
  password: Option[String] = None  // 可选密码；须与 username 同时提供才参与认证
)
