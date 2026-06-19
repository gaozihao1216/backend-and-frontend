/**
  *
   * 定义：PlayerWalletTableCodec：JDBC ResultSet ↔ Row 列映射与 baseSelect SQL 片段。
 * 问题：snake_case SQL 列名与 Scala camelCase 字段需集中转换。
 * 作用：baseSelect 复用；rowFromResultSet 解析枚举与 Option 列。
 * 关联：[[PlayerWalletTableTableJdbcRead]] / [[PlayerWalletTableTableJdbcWrite]] 共用。
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
