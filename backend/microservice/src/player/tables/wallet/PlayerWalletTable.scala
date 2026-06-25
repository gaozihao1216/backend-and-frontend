package microservice.player.tables.wallet

import java.sql.ResultSet
import java.sql.Connection
import java.time.Instant
import microservice.player.objects.PlayerWallet
import microservice.player.support.wallet.PlayerWalletDefaults
import microservice.player.tables.wallet._

final case class PlayerWalletRow(
  userId: String,
  coins: Int,
  gems: Int,
  fragments: Int,
  updatedAt: String
)

private[player] object PlayerWalletTableCodec {
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

private[player] object PlayerWalletTable {

  def getOrCreate(connection: Connection, userId: String): PlayerWallet = {
    val now = Instant.now().toString
    PlayerWalletTableSql.findByUserId(connection, userId) match {
      case Some(row) => toWallet(row)
      case None =>
        toWallet(PlayerWalletTableSql.upsert(connection, defaultWalletRow(userId, now)))
    }
  }

  def save(connection: Connection, userId: String, wallet: PlayerWallet): PlayerWallet = {
    val row = PlayerWalletRow(
      userId = userId,
      coins = wallet.coins,
      gems = wallet.gems,
      fragments = wallet.fragments,
      updatedAt = Instant.now().toString
    )
    toWallet(PlayerWalletTableSql.upsert(connection, row))
  }

  private def defaultWalletRow(userId: String, updatedAt: String): PlayerWalletRow =
    PlayerWalletRow(
      userId = userId,
      coins = PlayerWalletDefaults.defaultCoins,
      gems = PlayerWalletDefaults.defaultGems,
      fragments = PlayerWalletDefaults.defaultFragments,
      updatedAt = updatedAt
    )

  private def toWallet(row: PlayerWalletRow): PlayerWallet =
    PlayerWallet(coins = row.coins, gems = row.gems, fragments = row.fragments)
}


private[tables] object PlayerWalletTableSql {

def findByUserId(connection: Connection, userId: String): Option[PlayerWalletRow] = {
    val statement = connection.prepareStatement(s"${PlayerWalletTableCodec.baseSelect} WHERE user_id = ?")
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(PlayerWalletTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

def upsert(connection: Connection, row: PlayerWalletRow): PlayerWalletRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_wallets (user_id, coins, gems, fragments, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (user_id) DO UPDATE SET
          coins = EXCLUDED.coins,
          gems = EXCLUDED.gems,
          fragments = EXCLUDED.fragments,
          updated_at = EXCLUDED.updated_at
      """
    )
    try {
      statement.setString(1, row.userId)
      statement.setInt(2, row.coins)
      statement.setInt(3, row.gems)
      statement.setInt(4, row.fragments)
      statement.setString(5, row.updatedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }
}
