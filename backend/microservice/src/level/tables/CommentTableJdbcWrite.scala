package microservice.level.tables

import java.sql.Connection

private[tables] object CommentTableJdbcWrite {
  def insert(connection: Connection, row: CommentRow): CommentRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO comments (id, level_id, user_id, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      """
    )
    try {
      statement.setString(1, row.id)
      statement.setString(2, row.levelId)
      statement.setString(3, row.userId)
      statement.setString(4, row.content)
      statement.setString(5, row.createdAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  def deleteById(connection: Connection, commentId: String): Option[CommentRow] =
    CommentTableJdbcRead.findById(connection, commentId).flatMap { comment =>
      val statement = connection.prepareStatement("DELETE FROM comments WHERE id = ?")
      try {
        statement.setString(1, commentId)
        if (statement.executeUpdate() == 0) None else Some(comment)
      } finally {
        statement.close()
      }
    }
}
