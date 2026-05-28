package microservice.core

trait DatabaseSession {
  def config: DatabaseConfig
  def description: String
}

object DatabaseSession {
  def inMemory(configValue: DatabaseConfig): DatabaseSession =
    new DatabaseSession {
      override val config: DatabaseConfig = configValue
      override val description: String =
        s"${config.driver}:${config.schema}@${config.url}"
    }
}
