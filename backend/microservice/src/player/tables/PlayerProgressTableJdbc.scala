package microservice.player.tables

import java.sql.Connection

private[tables] object PlayerLevelProgressTableJdbc {
  def initialize(connection: Connection): Unit =
    PlayerLevelProgressTableJdbcSchema.initialize(connection)

  def listByUserId(connection: Connection, userId: String): Vector[PlayerLevelProgressRow] =
    PlayerLevelProgressTableJdbcRead.listByUserId(connection, userId)

  def insert(connection: Connection, row: PlayerLevelProgressRow): PlayerLevelProgressRow =
    PlayerLevelProgressTableJdbcWrite.insert(connection, row)
}

private[tables] object PlayerLegacyCheckInTableJdbc {
  def initialize(connection: Connection): Unit =
    PlayerLegacyCheckInTableJdbcSchema.initialize(connection)

  def findByUserId(connection: Connection, userId: String): Option[PlayerLegacyCheckInRow] =
    PlayerLegacyCheckInTableJdbcRead.findByUserId(connection, userId)

  def upsert(connection: Connection, row: PlayerLegacyCheckInRow): PlayerLegacyCheckInRow =
    PlayerLegacyCheckInTableJdbcWrite.upsert(connection, row)
}
