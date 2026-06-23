package microservice.player.tables.weekly_check_in

import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.player.objects.WeeklyCheckInProgress
import microservice.player.tables.weekly_check_in.jdbc.PlayerWeeklyCheckInTableJdbc

object PlayerWeeklyCheckInTable {
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) PlayerWeeklyCheckInTableJdbc.initialize(connection)

  def getOrCreate(connection: Connection, userId: String, weekKey: String): WeeklyCheckInProgress = {
    val existing =
      if (TableConnection.isInMemory(connection)) {
        InMemoryStore.playerWeeklyCheckIn.get(userId).flatMap { row =>
          if (row.weekKey == weekKey) Some(row) else None
        }
      } else {
        PlayerWeeklyCheckInTableJdbc.findByUserAndWeek(connection, userId, weekKey)
      }

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
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.playerWeeklyCheckIn = InMemoryStore.playerWeeklyCheckIn.updated(row.userId, row)
    } else {
      PlayerWeeklyCheckInTableJdbc.upsert(connection, row)
    }
    progress
  }
}
