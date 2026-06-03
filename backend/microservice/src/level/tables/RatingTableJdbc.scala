package microservice.level.tables

import java.sql.Connection

private[tables] object RatingTableJdbc {
  def initialize(connection: Connection): Unit =
    RatingTableJdbcSchema.initialize(connection)

  def countByPlayer(connection: Connection, playerId: String): Int =
    RatingTableJdbcRead.countByPlayer(connection, playerId)

  def findByLevelAndPlayer(connection: Connection, levelId: String, playerId: String): Option[RatingRow] =
    RatingTableJdbcRead.findByLevelAndPlayer(connection, levelId, playerId)

  def listByLevel(connection: Connection, levelId: String): Vector[RatingRow] =
    RatingTableJdbcRead.listByLevel(connection, levelId)

  def nextId(connection: Connection): String =
    RatingTableJdbcRead.nextId(connection)

  def insert(connection: Connection, row: RatingRow): RatingRow =
    RatingTableJdbcWrite.insert(connection, row)

  def updateScore(connection: Connection, ratingId: String, score: Int, updatedAt: String): Option[RatingRow] =
    RatingTableJdbcWrite.updateScore(connection, ratingId, score, updatedAt)
}
