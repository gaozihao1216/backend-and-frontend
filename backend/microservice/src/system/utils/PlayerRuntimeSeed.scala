package microservice.system.utils

import microservice.infrastructure.database.InMemoryStore
import microservice.player.objects.CheckInSlotReward
import microservice.player.runtime.PlayerRuntimeDefaults
import microservice.player.tables.check_in_panel_reward.{CheckInPanelRewardTable}
import microservice.player.tables.progress.level_progress.PlayerLevelProgressTable
import microservice.player.tables.shop.{ShopTable}
import microservice.player.tables.wallet.{PlayerWalletTable}

/** 玩家运行时（钱包、签到、商店、进度）的 in-memory 种子。
  *
  * 定义：private[utils] object，reset 通过各 Player Table API 写入演示数据（connection=null）。
  * 问题：UGC 核心 seed 不含玩家侧钱包/商店/签到，需单独初始化。
  * 作用：为 player-1 建钱包、7 日签到奖励、商店商品，并清空易变集合防叠加。
  * 关联：[[SystemSeedData.reset]] 第二步；[[PlayerRuntimeDefaults]] 签到 panelId。
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
