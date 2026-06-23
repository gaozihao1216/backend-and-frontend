/** JDBC 读路径专用：SQL 列名 ↔ 玩家备战 Row 的编解码。
  *
  * 实现：rowFromResultSet 与 PostgreSQL snake_case 列对齐。
  */
package microservice.player.tables.preparation

private[tables] object PlayerPreparationTableCodec {
  def birdRowFromResultSet(userId: String, resultSet: java.sql.ResultSet): PlayerBirdUpgradeRow =
    PlayerBirdUpgradeRow(
      userId = userId,
      birdType = resultSet.getString("bird_type"),
      level = resultSet.getInt("level"),
      tier = resultSet.getInt("tier"),
      updatedAt = resultSet.getString("updated_at")
    )
}
