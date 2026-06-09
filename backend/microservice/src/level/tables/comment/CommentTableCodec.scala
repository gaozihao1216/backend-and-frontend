package microservice.level.tables.comment

import microservice.level.tables.shared.CommentRow

import java.sql.ResultSet

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
