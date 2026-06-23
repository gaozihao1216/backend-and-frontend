package microservice.player.tables.weekly_check_in

import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.player.objects.WeeklyCheckInProgress
import microservice.player.tables.weekly_check_in.jdbc.PlayerWeeklyCheckInTableJdbc

/**
  *
   * 定义：PlayerWeeklyCheckInTable 表访问门面，connection==null 走 in-memory，否则 JDBC。
 * 问题：player 持久化需双后端一致 API，避免 APIMessage 分支存储逻辑。
 * 作用：initialize/list/find/insert/update 等统一入口。
 * 关联：[[DatabaseSession]]；inmemory 与 jdbc 子包实现。
 */
object PlayerWeeklyCheckInTable {
  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) PlayerWeeklyCheckInTableJdbc.initialize(connection)

  /** 读取当周签到进度；无记录时返回空进度对象。 */
  def getOrCreate(connection: Connection, userId: String, weekKey: String): WeeklyCheckInProgress = {
    val existing =
      if (TableConnection.isInMemory(connection)) {
        InMemoryStore.playerWeeklyCheckIn.get(userId).flatMap { progress =>
          if (progress.weekKey == weekKey) {
            Some(
              PlayerWeeklyCheckInRow(
                userId = userId,
                weekKey = progress.weekKey,
                signedSlots = PlayerWeeklyCheckInSlotsCodec.encode(progress.signedSlots),
                signedToday = progress.signedToday,
                updatedAt = "in-memory"
              )
            )
          } else None
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

  /** 持久化签到进度变更。 */
  def save(connection: Connection, userId: String, progress: WeeklyCheckInProgress): WeeklyCheckInProgress = {
    val row = PlayerWeeklyCheckInRow(
      userId = userId,
      weekKey = progress.weekKey,
      signedSlots = PlayerWeeklyCheckInSlotsCodec.encode(progress.signedSlots),
      signedToday = progress.signedToday,
      updatedAt = Instant.now().toString
    )
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.playerWeeklyCheckIn = InMemoryStore.playerWeeklyCheckIn.updated(
        row.userId,
        WeeklyCheckInProgress(
          weekKey = row.weekKey,
          signedSlots = PlayerWeeklyCheckInSlotsCodec.decode(row.signedSlots),
          signedToday = row.signedToday
        )
      )
    } else {
      PlayerWeeklyCheckInTableJdbc.upsert(connection, row)
    }
    progress
  }
}
