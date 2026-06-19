package microservice.infrastructure.database

/** JDBC 连接配置值对象（不可变 case class）。
  *
  * == 字段说明 ==
  * - `driver`：JDBC 驱动全限定类名，默认 `org.postgresql.Driver`；
  * - `url`：JDBC URL，如 `jdbc:postgresql://localhost:5432/ugc_level_platform`；
  * - `schema`：逻辑 schema 名，用于日志与 Health 响应，不参与 DriverManager 连接串；
  * - `username` / `password`：可选凭证；**须同时提供**时 [[DatabaseSession.jdbc]] 才传入 DriverManager。
  *
  * == 配置来源 ==
  * 默认值与 `UGC_DATABASE_*` 环境变量覆盖逻辑在
  * `microservice.system.utils.SystemDefaults.databaseConfig` 中集中定义。
  *
  * == 使用场景 ==
  * - JDBC 模式：[[DatabaseSession.jdbc]] 用此配置打开 PostgreSQL 连接；
  * - in-memory 模式：仍构造一份 `DatabaseConfig` 供 `description` 与 Health 端点展示，
  *   但不会真正建立 JDBC 连接。
  *
  * == 关联 ==
  * - [[DatabaseSession]]：消费本配置的唯一基础设施入口
  */
final case class DatabaseConfig(
  driver: String,              // JDBC 驱动类名，默认 org.postgresql.Driver
  url: String,                 // 连接 URL，如 jdbc:postgresql://localhost:5432/ugc_level_platform
  schema: String,              // 逻辑 schema 名，用于日志描述与健康检查响应
  username: Option[String] = None, // 可选用户名；无则 DriverManager 使用 URL 内嵌或匿名连接
  password: Option[String] = None  // 可选密码；须与 username 同时提供才参与显式认证
)
