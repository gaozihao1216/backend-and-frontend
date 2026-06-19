package microservice.player.runtime

import microservice.player.objects.PlayerWallet

/** 玩家 UI 运行时常量默认值。
  *
  * 定义：签到 panelId、默认 apiKey 字符串等配置。
  * 问题：多处 Service/Router 引用同一 magic string 易漂移。
  * 作用：集中定义 roleHomeCheckInPanelId 等供 seed 与 UI 绑定。
  * 关联：[[PlayerRuntimeSeed]]；[[CheckInPanelRewardTable.replacePanelRewards]]。
  */
object PlayerRuntimeDefaults {
  /** 新用户默认金币。 */
  val defaultCoins: Int = 1280
  /** 新用户默认宝石。 */
  val defaultGems: Int = 96
  /** 新用户默认碎片。 */
  val defaultFragments: Int = 0

  /** 组合后的默认钱包对象，供 PlayerWalletTable.getOrCreate 使用。 */
  val defaultWallet: PlayerWallet =
    PlayerWallet(coins = defaultCoins, gems = defaultGems, fragments = defaultFragments)

  /** 玩家主页签到面板的默认 panelId（未传 panelId 时 executeClaim 回退到此值）。 */
  val roleHomeCheckInPanelId: String = "player.home.checkIn"
}
