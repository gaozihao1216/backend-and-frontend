package microservice.level.tables.comment.jdbc

import java.sql.Connection
import microservice.level.tables.comment._
import microservice.level.tables.shared.CommentRow

private[tables] object CommentTableJdbc {
def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            level_id TEXT NOT NULL REFERENCES levels(id),
            user_id TEXT NOT NULL REFERENCES users(id),
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        """
      )
    } finally {
      statement.close()
    }
  }

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
    CommentTableJdbc.findById(connection, commentId).flatMap { comment =>
      val statement = connection.prepareStatement("DELETE FROM comments WHERE id = ?")
      try {
        statement.setString(1, commentId)
        if (statement.executeUpdate() == 0) None else Some(comment)
      } finally {
        statement.close()
      }
    }
}
