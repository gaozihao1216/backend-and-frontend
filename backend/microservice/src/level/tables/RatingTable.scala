package microservice.level.tables

import java.sql.Connection

object RatingTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) RatingTableJdbcSchema.initialize(connection)

  def countByPlayer(connection: Connection, playerId: String): Int =
    if (isInMemory(connection)) RatingTableInMemory.countByPlayer(playerId)
    else RatingTableJdbcRead.countByPlayer(connection, playerId)

  def findByLevelAndPlayer(connection: Connection, levelId: String, playerId: String): Option[RatingRow] =
    if (isInMemory(connection)) RatingTableInMemory.findByLevelAndPlayer(levelId, playerId)
    else RatingTableJdbcRead.findByLevelAndPlayer(connection, levelId, playerId)

  def listByLevel(connection: Connection, levelId: String): Vector[RatingRow] =
    if (isInMemory(connection)) RatingTableInMemory.listByLevel(levelId)
    else RatingTableJdbcRead.listByLevel(connection, levelId)

  def nextId(connection: Connection): String =
    if (isInMemory(connection)) RatingTableInMemory.nextId()
    else RatingTableJdbcRead.nextId(connection)

  def insert(connection: Connection, row: RatingRow): RatingRow =
    if (isInMemory(connection)) RatingTableInMemory.insert(row)
    else RatingTableJdbcWrite.insert(connection, row)

  def updateScore(connection: Connection, ratingId: String, score: Int, updatedAt: String): Option[RatingRow] =
    if (isInMemory(connection)) RatingTableInMemory.updateScore(ratingId, score, updatedAt)
    else RatingTableJdbcWrite.updateScore(connection, ratingId, score, updatedAt)
}
