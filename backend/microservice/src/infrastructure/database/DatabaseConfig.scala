package microservice.infrastructure.database

final case class DatabaseConfig(
  driver: String,
  url: String,
  schema: String,
  username: Option[String] = None,
  password: Option[String] = None
)
