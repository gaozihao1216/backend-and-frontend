package microservice.player.tables.weekly_check_in

import microservice.player.tables.weekly_check_in.inmemory._
import microservice.player.tables.weekly_check_in.jdbc._

import microservice.player.runtime.WeeklyCheckInProgress
import java.sql.Connection
import java.time.Instant

/** 玩家周签到进度表访问门面：按 userId + weekKey 存储已签格子与今日签到标记。 */
object PlayerWeeklyCheckInTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) PlayerWeeklyCheckInTableJdbcSchema.initialize(connection)

  /** 读取当周签到进度；无记录时返回空进度对象。 */
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

  /** 持久化签到进度变更。 */
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
