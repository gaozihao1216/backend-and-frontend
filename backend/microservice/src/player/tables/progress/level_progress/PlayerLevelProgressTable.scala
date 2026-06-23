package microservice.player.tables.progress.level_progress

import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.player.tables.progress.PlayerLevelProgressRow
import microservice.player.tables.progress.jdbc.PlayerLevelProgressTableJdbc

/**
  *
   * 定义：PlayerLevelProgressTable 表访问门面，connection==null 走 in-memory，否则 JDBC。
 * 问题：player 持久化需双后端一致 API，避免 APIMessage 分支存储逻辑。
 * 作用：initialize/list/find/insert/update 等统一入口。
 * 关联：[[DatabaseSession]]；inmemory 与 jdbc 子包实现。
 */
object PlayerLevelProgressTable {
  /** 新用户默认已通关的关卡后缀（首关）。 */
  val defaultClearedSuffix: String = "level01"

  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) PlayerLevelProgressTableJdbc.initialize(connection)

  /** 返回用户已通关的关卡后缀集合（必要时写入默认进度）。 */
  def listClearedSuffixes(connection: Connection, userId: String): Set[String] = {
    ensureDefaultProgress(connection, userId)
    val rows =
      if (TableConnection.isInMemory(connection)) {
        InMemoryStore.playerLevelProgress.filter(_.userId == userId).sortBy(_.levelSuffix)
      } else {
        PlayerLevelProgressTableJdbc.listByUserId(connection, userId)
      }
    rows.map(_.levelSuffix).toSet
  }

  /** 标记关卡为已通关并返回更新后的 cleared 集合。 */
  def markCleared(connection: Connection, userId: String, levelSuffix: String): Set[String] = {
    val row = PlayerLevelProgressRow(
      userId = userId,
      levelSuffix = levelSuffix,
      clearedAt = Instant.now().toString
    )
    if (TableConnection.isInMemory(connection)) {
      if (!InMemoryStore.playerLevelProgress.exists(entry => entry.userId == row.userId && entry.levelSuffix == row.levelSuffix)) {
        InMemoryStore.playerLevelProgress = InMemoryStore.playerLevelProgress :+ row
      }
    } else {
      PlayerLevelProgressTableJdbc.insert(connection, row)
    }
    listClearedSuffixes(connection, userId)
  }

  private def ensureDefaultProgress(connection: Connection, userId: String): Unit = {
    val rows =
      if (TableConnection.isInMemory(connection)) {
        InMemoryStore.playerLevelProgress.filter(_.userId == userId)
      } else {
        PlayerLevelProgressTableJdbc.listByUserId(connection, userId)
      }
    if (rows.nonEmpty) {
      return
    }

    val defaultRow = PlayerLevelProgressRow(
      userId = userId,
      levelSuffix = defaultClearedSuffix,
      clearedAt = Instant.now().toString
    )
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.playerLevelProgress = InMemoryStore.playerLevelProgress :+ defaultRow
    } else {
      PlayerLevelProgressTableJdbc.insert(connection, defaultRow)
    }
  }
}
