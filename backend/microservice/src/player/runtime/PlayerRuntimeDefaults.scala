package microservice.player.runtime

/** 玩家运行时默认值：新用户钱包初始余额与默认签到面板 id。 */
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
