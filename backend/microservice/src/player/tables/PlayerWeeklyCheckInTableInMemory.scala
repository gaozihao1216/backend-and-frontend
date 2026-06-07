package microservice.player.tables

import microservice.infrastructure.database.InMemoryStore
import microservice.player.runtime.WeeklyCheckInProgress

private[tables] object PlayerWeeklyCheckInTableInMemory {
  def findByUserAndWeek(userId: String, weekKey: String): Option[PlayerWeeklyCheckInRow] =
    InMemoryStore.playerWeeklyCheckIn.get(userId).flatMap { progress =>
      if (progress.weekKey == weekKey) Some(toRow(userId, progress)) else None
    }

  def upsert(row: PlayerWeeklyCheckInRow): PlayerWeeklyCheckInRow = {
    InMemoryStore.playerWeeklyCheckIn = InMemoryStore.playerWeeklyCheckIn.updated(
      row.userId,
      WeeklyCheckInProgress(
        weekKey = row.weekKey,
        signedSlots = PlayerWeeklyCheckInSlotsCodec.decode(row.signedSlots),
        signedToday = row.signedToday
      )
    )
    row
  }

  private def toRow(userId: String, progress: WeeklyCheckInProgress): PlayerWeeklyCheckInRow =
    PlayerWeeklyCheckInRow(
      userId = userId,
      weekKey = progress.weekKey,
      signedSlots = PlayerWeeklyCheckInSlotsCodec.encode(progress.signedSlots),
      signedToday = progress.signedToday,
      updatedAt = "in-memory"
    )
}
