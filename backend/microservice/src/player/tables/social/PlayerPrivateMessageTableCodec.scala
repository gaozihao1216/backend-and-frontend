/** JDBC 读路径专用：SQL 列名 ↔ 玩家私信 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet 与 PostgreSQL snake_case 列对齐。
  */
package microservice.player.tables.social

private[tables] object PlayerPrivateMessageTableCodec {
  val baseSelect: String =
    "SELECT id, sender_id, receiver_id, content, created_at FROM player_private_messages"

  def rowFromResultSet(resultSet: java.sql.ResultSet): PlayerPrivateMessageRow =
    PlayerPrivateMessageRow(
      id = resultSet.getString("id"),
      senderId = resultSet.getString("sender_id"),
      receiverId = resultSet.getString("receiver_id"),
      content = resultSet.getString("content"),
      createdAt = resultSet.getString("created_at")
    )

  def bindRow(statement: java.sql.PreparedStatement, row: PlayerPrivateMessageRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.senderId)
    statement.setString(3, row.receiverId)
    statement.setString(4, row.content)
    statement.setString(5, row.createdAt)
  }
}
