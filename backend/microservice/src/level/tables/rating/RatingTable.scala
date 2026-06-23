package microservice.level.tables.rating

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.level.tables.rating.jdbc.RatingTableJdbc
import microservice.level.tables.shared.RatingRow

/** 关卡评分表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 实现间分流。
  *
  * 实现：TableConnection.isInMemory(connection) 为 true 时直接读写 InMemoryStore；否则走 RatingTableJdbc。
  * 关联：RateLevelAPIMessage 读写；LevelTable.updateRatingStats 维护聚合分。
  */
object RatingTable {
  /** JDBC 启动时建表；in-memory 模式下无需 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) RatingTableJdbc.initialize(connection)

  /** 统计指定玩家的评分总数（可用于成就或限制）。 */
  def countByPlayer(connection: Connection, playerId: String): Int =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.ratings.count(_.playerId == playerId)
    } else {
      RatingTableJdbc.countByPlayer(connection, playerId)
    }

  /** 查找指定玩家对指定关卡的评分记录（用于 upsert 判断）。 */
  def findByLevelAndPlayer(connection: Connection, levelId: String, playerId: String): Option[RatingRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.ratings.find(rating => rating.levelId == levelId && rating.playerId == playerId)
    } else {
      RatingTableJdbc.findByLevelAndPlayer(connection, levelId, playerId)
    }

  /** 列出指定关卡的全部评分（用于重算平均分）。 */
  def listByLevel(connection: Connection, levelId: String): Vector[RatingRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.ratings.filter(_.levelId == levelId)
    } else {
      RatingTableJdbc.listByLevel(connection, levelId)
    }

  /** 生成下一个评分 ID。 */
  def nextId(connection: Connection): String =
    if (TableConnection.isInMemory(connection)) {
      s"rating-${InMemoryStore.ratings.size + 1}"
    } else {
      RatingTableJdbc.nextId(connection)
    }

  /** 插入新评分记录。 */
  def insert(connection: Connection, row: RatingRow): RatingRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.ratings = InMemoryStore.ratings :+ row
      row
    } else {
      RatingTableJdbc.insert(connection, row)
    }

  /** 更新已有评分的分数与时间戳。 */
  def updateScore(connection: Connection, ratingId: String, score: Int, updatedAt: String): Option[RatingRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.ratings.indexWhere(_.id == ratingId) match {
        case -1 => None
        case index =>
          val updated = InMemoryStore.ratings(index).copy(score = score, updatedAt = updatedAt)
          InMemoryStore.ratings = InMemoryStore.ratings.updated(index, updated)
          Some(updated)
      }
    } else {
      RatingTableJdbc.updateScore(connection, ratingId, score, updatedAt)
    }
}
