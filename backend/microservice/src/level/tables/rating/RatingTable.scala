package microservice.level.tables.rating

import microservice.level.tables.shared.RatingRow

import microservice.level.tables.rating.inmemory._
import microservice.level.tables.rating.jdbc._

import java.sql.Connection

/** 关卡评分表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 实现间分流。
  *
  * 实现：isInMemory(connection) 为 true 时走 RatingTableInMemory；否则走 JDBC 读写层。
  * 关联：RateLevelAPIMessage 读写；LevelTable.updateRatingStats 维护聚合分。
  */
object RatingTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** JDBC 启动时建表；in-memory 模式下无需 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) RatingTableJdbcSchema.initialize(connection)

  /** 统计指定玩家的评分总数（可用于成就或限制）。 */
  def countByPlayer(connection: Connection, playerId: String): Int =
    if (isInMemory(connection)) RatingTableInMemory.countByPlayer(playerId)
    else RatingTableJdbcRead.countByPlayer(connection, playerId)

  /** 查找指定玩家对指定关卡的评分记录（用于 upsert 判断）。 */
  def findByLevelAndPlayer(connection: Connection, levelId: String, playerId: String): Option[RatingRow] =
    if (isInMemory(connection)) RatingTableInMemory.findByLevelAndPlayer(levelId, playerId)
    else RatingTableJdbcRead.findByLevelAndPlayer(connection, levelId, playerId)

  /** 列出指定关卡的全部评分（用于重算平均分）。 */
  def listByLevel(connection: Connection, levelId: String): Vector[RatingRow] =
    if (isInMemory(connection)) RatingTableInMemory.listByLevel(levelId)
    else RatingTableJdbcRead.listByLevel(connection, levelId)

  /** 生成下一个评分 ID。 */
  def nextId(connection: Connection): String =
    if (isInMemory(connection)) RatingTableInMemory.nextId()
    else RatingTableJdbcRead.nextId(connection)

  /** 插入新评分记录。 */
  def insert(connection: Connection, row: RatingRow): RatingRow =
    if (isInMemory(connection)) RatingTableInMemory.insert(row)
    else RatingTableJdbcWrite.insert(connection, row)

  /** 更新已有评分的分数与时间戳。 */
  def updateScore(connection: Connection, ratingId: String, score: Int, updatedAt: String): Option[RatingRow] =
    if (isInMemory(connection)) RatingTableInMemory.updateScore(ratingId, score, updatedAt)
    else RatingTableJdbcWrite.updateScore(connection, ratingId, score, updatedAt)
}
