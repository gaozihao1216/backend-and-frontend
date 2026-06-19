/**
  *
   * 定义：PlayerWeeklyCheckInTableInMemory：InMemoryStore 上的 PlayerWeeklyCheckInTable CRUD。
 * 问题：UGC_DATABASE_MODE 非 jdbc 时 connection=null，需内存向量/Map 模拟表。
 * 作用：与 JDBC 实现同签名，供 Table 门面透明切换。
 * 关联：[[InMemoryStore]]；[[PlayerWeeklyCheckInTable]] isInMemory 分支。
 */
package microservice.player.tables.weekly_check_in.inmemory

import microservice.player.tables.weekly_check_in._

import microservice.infrastructure.database.InMemoryStore
import microservice.player.objects.WeeklyCheckInProgress

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
