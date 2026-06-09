package microservice.player.tables

import microservice.player.runtime.{PlayerRuntimeDefaults, PlayerWallet}
import java.sql.Connection
import java.time.Instant

object PlayerWalletTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) PlayerWalletTableJdbcSchema.initialize(connection)

  def getOrCreate(connection: Connection, userId: String): PlayerWallet = {
    val now = Instant.now().toString
    if (isInMemory(connection)) {
      PlayerWalletTableInMemory.seedDefault(userId)
      PlayerWalletTableInMemory
        .findByUserId(userId)
        .map(toWallet)
        .getOrElse(PlayerRuntimeDefaults.defaultWallet)
    } else {
      PlayerWalletTableJdbcRead.findByUserId(connection, userId) match {
        case Some(row) => toWallet(row)
        case None =>
          val row = PlayerWalletTableJdbcWrite.upsert(
            connection,
            PlayerWalletRow(
              userId = userId,
              coins = PlayerRuntimeDefaults.defaultCoins,
              gems = PlayerRuntimeDefaults.defaultGems,
              fragments = PlayerRuntimeDefaults.defaultFragments,
              updatedAt = now
            )
          )
          toWallet(row)
      }
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
    val saved =
      if (isInMemory(connection)) PlayerWalletTableInMemory.upsert(row)
      else PlayerWalletTableJdbcWrite.upsert(connection, row)
    toWallet(saved)
  }

  private def toWallet(row: PlayerWalletRow): PlayerWallet =
    PlayerWallet(coins = row.coins, gems = row.gems, fragments = row.fragments)
}
