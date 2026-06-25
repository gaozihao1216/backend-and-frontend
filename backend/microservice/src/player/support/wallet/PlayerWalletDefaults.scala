package microservice.player.support.wallet

import microservice.player.objects.PlayerWallet

/** 玩家钱包默认值。
  *
  * 定义：新用户默认 coins/gems/fragments。
  * 作用：供 PlayerWalletTable.getOrCreate 初始化钱包。
  * 关联：[[microservice.player.tables.wallet.PlayerWalletTable]]。
  */
private[player] object PlayerWalletDefaults {
  /** 新用户默认金币。 */
  val defaultCoins: Int = 1280
  /** 新用户默认宝石。 */
  val defaultGems: Int = 96
  /** 新用户默认碎片。 */
  val defaultFragments: Int = 0

  /** 组合后的默认钱包对象，供 PlayerWalletTable.getOrCreate 使用。 */
  val defaultWallet: PlayerWallet =
    PlayerWallet(coins = defaultCoins, gems = defaultGems, fragments = defaultFragments)
}
