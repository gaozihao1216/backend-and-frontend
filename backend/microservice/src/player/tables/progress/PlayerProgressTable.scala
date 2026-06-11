package microservice.player.tables.progress

import microservice.player.tables.progress.inmemory._
import microservice.player.tables.progress.jdbc._

import java.sql.Connection
import java.time.Instant

/** 玩家关卡进度表访问门面：记录用户已通关的关卡后缀集合。
  *
  * 新用户无记录时自动 seed level01 为已通关，保证首关解锁逻辑一致。
  */
object PlayerLevelProgressTable {
  /** 新用户默认已通关的关卡后缀（首关）。 */
  val defaultClearedSuffix: String = "level01"

  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) PlayerLevelProgressTableJdbcSchema.initialize(connection)

  /** 返回用户已通关的关卡后缀集合（必要时写入默认进度）。 */
  def listClearedSuffixes(connection: Connection, userId: String): Set[String] = {
    ensureDefaultProgress(connection, userId)
    val rows =
      if (isInMemory(connection)) PlayerLevelProgressTableInMemory.listByUserId(userId)
      else PlayerLevelProgressTableJdbcRead.listByUserId(connection, userId)
    rows.map(_.levelSuffix).toSet
  }

  /** 标记关卡为已通关并返回更新后的 cleared 集合。 */
  def markCleared(connection: Connection, userId: String, levelSuffix: String): Set[String] = {
    val row = PlayerLevelProgressRow(
      userId = userId,
      levelSuffix = levelSuffix,
      clearedAt = Instant.now().toString
    )
    if (isInMemory(connection)) PlayerLevelProgressTableInMemory.insert(row)
    else PlayerLevelProgressTableJdbcWrite.insert(connection, row)
    listClearedSuffixes(connection, userId)
  }

  private def ensureDefaultProgress(connection: Connection, userId: String): Unit = {
    val rows =
      if (isInMemory(connection)) PlayerLevelProgressTableInMemory.listByUserId(userId)
      else PlayerLevelProgressTableJdbcRead.listByUserId(connection, userId)
    if (rows.nonEmpty) {
      return
    }

    val defaultRow = PlayerLevelProgressRow(
      userId = userId,
      levelSuffix = defaultClearedSuffix,
      clearedAt = Instant.now().toString
    )
    if (isInMemory(connection)) PlayerLevelProgressTableInMemory.insert(defaultRow)
    else PlayerLevelProgressTableJdbcWrite.insert(connection, defaultRow)
  }
}

/** 遗留签到状态表访问门面：兼容旧版 player.checkIn apiKey 的简单 ready/claimed 状态机。 */
object PlayerLegacyCheckInTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) PlayerLegacyCheckInTableJdbcSchema.initialize(connection)

  /** 读取用户遗留签到状态，无记录时默认 "ready"。 */
  def getStatus(connection: Connection, userId: String): String = {
    val row =
      if (isInMemory(connection)) PlayerLegacyCheckInTableInMemory.findByUserId(userId)
      else PlayerLegacyCheckInTableJdbcRead.findByUserId(connection, userId)
    row.map(_.status).getOrElse("ready")
  }

  /** 更新遗留签到状态并返回新状态字符串。 */
  def setStatus(connection: Connection, userId: String, status: String): String = {
    val row = PlayerLegacyCheckInRow(
      userId = userId,
      status = status,
      updatedAt = Instant.now().toString
    )
    if (isInMemory(connection)) PlayerLegacyCheckInTableInMemory.upsert(row)
    else PlayerLegacyCheckInTableJdbcWrite.upsert(connection, row)
    status
  }
}
