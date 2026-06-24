package microservice.level.tables.comment

import microservice.level.tables.shared.CommentRow
import java.sql.ResultSet
import java.sql.Connection
import microservice.level.tables.comment._

/** CommentTableCodec 表访问门面。
  *
  * 表职责：封装 commentcodec 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * JDBC 表字段编解码：负责 ResultSet 映射与 SQL 参数绑定。
  */


private[tables] object CommentTableCodec {
  val baseSelect: String =
    """
      SELECT id, level_id, user_id, content, created_at
      FROM comments
    """

  def rowFromResultSet(resultSet: ResultSet): CommentRow =
    CommentRow(
      id = resultSet.getString("id"),
      levelId = resultSet.getString("level_id"),
      userId = resultSet.getString("user_id"),
      content = resultSet.getString("content"),
      createdAt = resultSet.getString("created_at")
    )
}

object CommentTable {

def listAllForAdmin(connection: Connection): Vector[CommentRow] = {
    val statement = connection.prepareStatement(s"${CommentTableCodec.baseSelect} ORDER BY created_at DESC, id ASC")
    try rows(statement.executeQuery())
    finally statement.close()
  }

  def listRecentByUser(connection: Connection, userId: String, limit: Int): Vector[CommentRow] = {
    val statement = connection.prepareStatement(
      s"""
        ${CommentTableCodec.baseSelect}
        WHERE user_id = ?
        ORDER BY created_at DESC, id ASC
        LIMIT ?
      """
    )
    try {
      statement.setString(1, userId)
      statement.setInt(2, limit)
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  def listByLevel(connection: Connection, levelId: String): Vector[CommentRow] = {
    val statement = connection.prepareStatement(
      s"""
        ${CommentTableCodec.baseSelect}
        WHERE level_id = ?
        ORDER BY created_at DESC, id ASC
      """
    )
    try {
      statement.setString(1, levelId)
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  def nextId(connection: Connection): String = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS comment_count FROM comments")
    try {
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) s"comment-${resultSet.getInt("comment_count") + 1}" else "comment-1"
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def findById(connection: Connection, commentId: String): Option[CommentRow] = {
    val statement = connection.prepareStatement(s"${CommentTableCodec.baseSelect} WHERE id = ?")
    try {
      statement.setString(1, commentId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(CommentTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  private def rows(resultSet: java.sql.ResultSet): Vector[CommentRow] =
    try {
      val builder = Vector.newBuilder[CommentRow]
      while (resultSet.next()) {
        builder += CommentTableCodec.rowFromResultSet(resultSet)
      }
      builder.result()
    } finally {
      resultSet.close()
    }

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
    CommentTable.findById(connection, commentId).flatMap { comment =>
      val statement = connection.prepareStatement("DELETE FROM comments WHERE id = ?")
      try {
        statement.setString(1, commentId)
        if (statement.executeUpdate() == 0) None else Some(comment)
      } finally {
        statement.close()
      }
    }
}
