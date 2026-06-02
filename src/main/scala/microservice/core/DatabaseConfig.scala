package microservice.core

final case class DatabaseConfig(
  driver: String,
  url: String,
  schema: String
)
