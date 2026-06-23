/** JDBC 读路径专用：SQL 列名 ↔ 玩家好友 Row 的编解码。
  *
  * 实现：rowFromResultSet 与 PostgreSQL snake_case 列对齐。
  */
package microservice.player.tables.social

private[tables] object PlayerFriendTableCodec {
  def rowFromResultSet(resultSet: java.sql.ResultSet): PlayerFriendRow =
    PlayerFriendRow(
      userId = resultSet.getString("user_id"),
      friendUserId = resultSet.getString("friend_user_id"),
      createdAt = resultSet.getString("created_at")
    )
}
