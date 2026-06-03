package microservice.level.tables

import java.sql.Connection

object CommentTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) CommentTableJdbc.initialize(connection)

  def listAllForAdmin(connection: Connection): Vector[CommentRow] =
    if (isInMemory(connection)) CommentTableInMemory.listAllForAdmin()
    else CommentTableJdbc.listAllForAdmin(connection)

  def listRecentByUser(connection: Connection, userId: String, limit: Int): Vector[CommentRow] =
    if (isInMemory(connection)) CommentTableInMemory.listRecentByUser(userId, limit)
    else CommentTableJdbc.listRecentByUser(connection, userId, limit)

  def listByLevel(connection: Connection, levelId: String): Vector[CommentRow] =
    if (isInMemory(connection)) CommentTableInMemory.listByLevel(levelId)
    else CommentTableJdbc.listByLevel(connection, levelId)

  def nextId(connection: Connection): String =
    if (isInMemory(connection)) CommentTableInMemory.nextId()
    else CommentTableJdbc.nextId(connection)

  def insert(connection: Connection, row: CommentRow): CommentRow =
    if (isInMemory(connection)) CommentTableInMemory.insert(row)
    else CommentTableJdbc.insert(connection, row)

  def deleteById(connection: Connection, commentId: String): Option[CommentRow] =
    if (isInMemory(connection)) CommentTableInMemory.deleteById(commentId)
    else CommentTableJdbc.deleteById(connection, commentId)
}
