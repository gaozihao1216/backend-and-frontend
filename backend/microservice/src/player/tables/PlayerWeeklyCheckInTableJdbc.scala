package microservice.player.tables

import java.sql.Connection

private[tables] object PlayerWeeklyCheckInTableJdbc {
  def initialize(connection: Connection): Unit =
    PlayerWeeklyCheckInTableJdbcSchema.initialize(connection)

  def findByUserAndWeek(connection: Connection, userId: String, weekKey: String): Option[PlayerWeeklyCheckInRow] =
    PlayerWeeklyCheckInTableJdbcRead.findByUserAndWeek(connection, userId, weekKey)

  def upsert(connection: Connection, row: PlayerWeeklyCheckInRow): PlayerWeeklyCheckInRow =
    PlayerWeeklyCheckInTableJdbcWrite.upsert(connection, row)
}
