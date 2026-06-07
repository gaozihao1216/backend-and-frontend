package microservice.system.utils

import microservice.infrastructure.database.InMemoryStore
import microservice.player.runtime.{CheckInSlotReward, PlayerRuntimeDefaults}
import microservice.player.tables.{
  CheckInPanelRewardTable,
  PlayerLevelProgressTable,
  PlayerWalletTable,
  ShopTable
}

private[utils] object PlayerRuntimeSeed {
  def reset(): Unit = {
    PlayerWalletTable.getOrCreate(null, "player-1")
    CheckInPanelRewardTable.replacePanelRewards(
      null,
      PlayerRuntimeDefaults.roleHomeCheckInPanelId,
      Vector(
        CheckInSlotReward(10, 0, 0),
        CheckInSlotReward(15, 0, 0),
        CheckInSlotReward(20, 0, 1),
        CheckInSlotReward(30, 0, 0),
        CheckInSlotReward(35, 0, 2),
        CheckInSlotReward(40, 1, 0),
        CheckInSlotReward(50, 2, 5)
      )
    )
    ShopTable.initialize(null)
    PlayerLevelProgressTable.listClearedSuffixes(null, "player-1")
    InMemoryStore.playerWeeklyCheckIn = Map.empty
    InMemoryStore.playerLegacyCheckIns = Vector.empty
    InMemoryStore.shopPurchases = Vector.empty
  }
}
