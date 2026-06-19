/** 关卡评论表的 JDBC 写操作（INSERT/UPDATE/DELETE）。
  *
  * 实现：PreparedStatement + Codec.bindRow；写成功后必要时 re-read 返回最新行。
  */
package microservice.level.tables.comment.jdbc

/** CommentTableJdbcWrite 表访问门面。
  *
  * 表职责：封装 commentjdbcwrite 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * inmemory/jdbc 双实现：connection == null 走 InMemoryStore，否则走 JDBC SQL。
  */
import microservice.level.tables.shared.CommentRow

import microservice.level.tables.comment._

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
