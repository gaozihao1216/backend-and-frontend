package microservice.system.utils

import microservice.infrastructure.database.InMemoryStore
import microservice.player.objects.CheckInSlotReward
import microservice.player.runtime.PlayerRuntimeDefaults
import microservice.player.tables.check_in_panel_reward.{CheckInPanelRewardTable}
import microservice.player.tables.progress.{PlayerLevelProgressTable}
import microservice.player.tables.shop.{ShopTable}
import microservice.player.tables.wallet.{PlayerWalletTable}

/** 玩家运行时（钱包、签到、商店、进度）的 in-memory 种子初始化。
  *
  * 实现：通过各 Table 的 API 写入演示数据；connection 传 null 路由到 InMemoryStore。
  * 关联：[[SystemSeedData.reset]] 在重置核心 UGC 表后调用本 object 的 reset。
  */
private[utils] object PlayerRuntimeSeed {
  def reset(): Unit = {
    // --- 1. 为演示玩家 player-1 创建默认钱包 ---
    PlayerWalletTable.getOrCreate(null, "player-1")

    // --- 2. 配置角色主页签到面板的 7 日奖励槽（金币/道具/鸟蛋） ---
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

    // --- 3. 初始化商店默认商品列表 ---
    ShopTable.initialize(null)

    // --- 4. 预热关卡进度查询缓存（无副作用，确保 player-1 进度结构存在） ---
    PlayerLevelProgressTable.listClearedSuffixes(null, "player-1")

    // --- 5. 清空易变的运行时集合，避免多次 reset 叠加脏数据 ---
    InMemoryStore.playerWeeklyCheckIn = Map.empty
    InMemoryStore.playerLegacyCheckIns = Vector.empty
    InMemoryStore.shopPurchases = Vector.empty
  }
}
