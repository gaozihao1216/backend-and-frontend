package microservice.player.tables

import microservice.player.runtime.WeeklyCheckInProgress
import java.sql.Connection
import java.time.Instant

object PlayerWeeklyCheckInTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) PlayerWeeklyCheckInTableJdbcSchema.initialize(connection)

  def getOrCreate(connection: Connection, userId: String, weekKey: String): WeeklyCheckInProgress = {
    val existing =
      if (isInMemory(connection)) PlayerWeeklyCheckInTableInMemory.findByUserAndWeek(userId, weekKey)
      else PlayerWeeklyCheckInTableJdbcRead.findByUserAndWeek(connection, userId, weekKey)

    existing match {
      case Some(row) =>
        WeeklyCheckInProgress(
          weekKey = row.weekKey,
          signedSlots = PlayerWeeklyCheckInSlotsCodec.decode(row.signedSlots),
          signedToday = row.signedToday
        )
      case None =>
        WeeklyCheckInProgress(weekKey = weekKey)
    }
  }

  def save(connection: Connection, userId: String, progress: WeeklyCheckInProgress): WeeklyCheckInProgress = {
    val row = PlayerWeeklyCheckInRow(
      userId = userId,
      weekKey = progress.weekKey,
      signedSlots = PlayerWeeklyCheckInSlotsCodec.encode(progress.signedSlots),
      signedToday = progress.signedToday,
      updatedAt = Instant.now().toString
    )
    if (isInMemory(connection)) PlayerWeeklyCheckInTableInMemory.upsert(row)
    else PlayerWeeklyCheckInTableJdbcWrite.upsert(connection, row)
    progress
  }
}
