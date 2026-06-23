package microservice.player.support.seed

import java.sql.Connection
import microservice.infrastructure.database.InMemoryStore
import microservice.player.runtime.PlayerRuntimeDefaults
import microservice.player.tables.check_in_panel_reward.CheckInPanelRewardTable
import microservice.player.tables.preparation.PlayerPreparationTable
import microservice.player.tables.progress.level_progress.PlayerLevelProgressTable
import microservice.player.tables.shop.ShopTable
import microservice.player.tables.wallet.PlayerWalletTable

/** 玩家运行时种子（player 模块内）。 */
object PlayerRuntimeSeedSupport {
  def resetInMemory(systemBirdTypes: Vector[String]): Unit = {
    PlayerWalletTable.getOrCreate(null, "player-1")

    CheckInPanelRewardTable.replacePanelRewards(
      null,
      PlayerRuntimeDefaults.roleHomeCheckInPanelId,
      DemoCheckInRewardsFactory.roleHomePanelRewards
    )

    ShopTable.initialize(null)
    PlayerPreparationTable.seedInMemory("player-1", systemBirdTypes)
    PlayerLevelProgressTable.listClearedSuffixes(null, "player-1")

    InMemoryStore.playerWeeklyCheckIn = Map.empty
    InMemoryStore.playerLegacyCheckIns = Vector.empty
    InMemoryStore.shopPurchases = Vector.empty
  }

  def seedCheckInPanelIfEmpty(connection: Connection): Unit =
    CheckInPanelRewardTable.replacePanelRewards(
      connection,
      PlayerRuntimeDefaults.roleHomeCheckInPanelId,
      DemoCheckInRewardsFactory.roleHomePanelRewards
    )
}
