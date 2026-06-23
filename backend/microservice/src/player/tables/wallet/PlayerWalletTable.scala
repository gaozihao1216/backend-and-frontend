package microservice.player.tables.wallet

import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.player.objects.PlayerWallet
import microservice.player.runtime.PlayerRuntimeDefaults
import microservice.player.tables.wallet.jdbc.PlayerWalletTableJdbc

object PlayerWalletTable {
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) PlayerWalletTableJdbc.initialize(connection)

  def getOrCreate(connection: Connection, userId: String): PlayerWallet = {
    val now = Instant.now().toString
    if (TableConnection.isInMemory(connection)) {
      if (!InMemoryStore.playerWallets.contains(userId)) {
        val defaultRow = PlayerWalletRow(
          userId = userId,
          coins = PlayerRuntimeDefaults.defaultCoins,
          gems = PlayerRuntimeDefaults.defaultGems,
          fragments = PlayerRuntimeDefaults.defaultFragments,
          updatedAt = now
        )
        InMemoryStore.playerWallets = InMemoryStore.playerWallets.updated(userId, defaultRow)
      }
      toWallet(InMemoryStore.playerWallets.getOrElse(userId, defaultWalletRow(userId, now)))
    } else {
      PlayerWalletTableJdbc.findByUserId(connection, userId) match {
        case Some(row) => toWallet(row)
        case None =>
          val row = PlayerWalletTableJdbc.upsert(
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
      if (TableConnection.isInMemory(connection)) {
        InMemoryStore.playerWallets = InMemoryStore.playerWallets.updated(row.userId, row)
        row
      } else {
        PlayerWalletTableJdbc.upsert(connection, row)
      }
    toWallet(saved)
  }

  private def defaultWalletRow(userId: String, updatedAt: String): PlayerWalletRow =
    PlayerWalletRow(
      userId = userId,
      coins = PlayerRuntimeDefaults.defaultCoins,
      gems = PlayerRuntimeDefaults.defaultGems,
      fragments = PlayerRuntimeDefaults.defaultFragments,
      updatedAt = updatedAt
    )

  private def toWallet(row: PlayerWalletRow): PlayerWallet =
    PlayerWallet(coins = row.coins, gems = row.gems, fragments = row.fragments)
}
