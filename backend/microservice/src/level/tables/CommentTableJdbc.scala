package microservice.level.tables

import java.sql.Connection

private[tables] object CommentTableJdbc {
  def initialize(connection: Connection): Unit =
    CommentTableJdbcSchema.initialize(connection)

  def listAllForAdmin(connection: Connection): Vector[CommentRow] =
    CommentTableJdbcRead.listAllForAdmin(connection)

  def listRecentByUser(connection: Connection, userId: String, limit: Int): Vector[CommentRow] =
    CommentTableJdbcRead.listRecentByUser(connection, userId, limit)

  def listByLevel(connection: Connection, levelId: String): Vector[CommentRow] =
    CommentTableJdbcRead.listByLevel(connection, levelId)

  def nextId(connection: Connection): String =
    CommentTableJdbcRead.nextId(connection)

  def insert(connection: Connection, row: CommentRow): CommentRow =
    CommentTableJdbcWrite.insert(connection, row)

  def deleteById(connection: Connection, commentId: String): Option[CommentRow] =
    CommentTableJdbcWrite.deleteById(connection, commentId)
}
