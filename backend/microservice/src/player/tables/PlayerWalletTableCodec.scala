package microservice.player.tables

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
