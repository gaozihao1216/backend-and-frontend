/** JDBC 读路径专用：SQL 列名 ↔ 玩家钱包 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL snake_case 列对齐。
  */
package microservice.player.tables.wallet

import java.sql.ResultSet

object PlayerWalletTableCodec {
  val baseSelect: String =
    "SELECT user_id, coins, gems, fragments, updated_at FROM player_wallets"

  def rowFromResultSet(resultSet: ResultSet): PlayerWalletRow =
    PlayerWalletRow(
      userId = resultSet.getString("user_id"),
      coins = resultSet.getInt("coins"),
      gems = resultSet.getInt("gems"),
      fragments = resultSet.getInt("fragments"),
      updatedAt = resultSet.getString("updated_at")
    )
}
