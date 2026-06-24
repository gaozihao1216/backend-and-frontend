package microservice.player.tables.progress.level_progress

import java.sql.Connection
import java.time.Instant
import microservice.player.tables.progress.PlayerLevelProgressRow

/** 玩家关卡进度表访问入口：只使用 JDBC 连接，事务由 APIMessage/DatabaseSession 统一管理。 */
private[player] object PlayerLevelProgressTable {
  val defaultClearedSuffix: String = "level01"

  def listClearedSuffixes(connection: Connection, userId: String): Set[String] = {
    ensureDefaultProgress(connection, userId)
    PlayerLevelProgressTableSql.listByUserId(connection, userId).map(_.levelSuffix).toSet
  }

  def markCleared(connection: Connection, userId: String, levelSuffix: String): Set[String] = {
    PlayerLevelProgressTableSql.insert(
      connection,
      PlayerLevelProgressRow(
        userId = userId,
        levelSuffix = levelSuffix,
        clearedAt = Instant.now().toString
      )
    )
    listClearedSuffixes(connection, userId)
  }

  private def ensureDefaultProgress(connection: Connection, userId: String): Unit = {
    val rows = PlayerLevelProgressTableSql.listByUserId(connection, userId)
    if (rows.nonEmpty) {
      return
    }

    PlayerLevelProgressTableSql.insert(
      connection,
      PlayerLevelProgressRow(
        userId = userId,
        levelSuffix = defaultClearedSuffix,
        clearedAt = Instant.now().toString
      )
    )
  }
}

import java.sql.Connection
import microservice.player.tables.progress._

private[tables] object PlayerLevelProgressTableSql {

  def listByUserId(connection: Connection, userId: String): Vector[PlayerLevelProgressRow] = {
    val statement = connection.prepareStatement(
      s"${PlayerLevelProgressTableCodec.baseSelect} WHERE user_id = ? ORDER BY level_suffix ASC"
    )
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        val builder = Vector.newBuilder[PlayerLevelProgressRow]
        while (resultSet.next()) {
          builder += PlayerLevelProgressTableCodec.rowFromResultSet(resultSet)
        }
        builder.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def insert(connection: Connection, row: PlayerLevelProgressRow): PlayerLevelProgressRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_level_progress (user_id, level_suffix, cleared_at)
        VALUES (?, ?, ?)
        ON CONFLICT (user_id, level_suffix) DO NOTHING
      """
    )
    try {
      statement.setString(1, row.userId)
      statement.setString(2, row.levelSuffix)
      statement.setString(3, row.clearedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }
}
