package microservice.player.runtime

object PlayerRuntimeDefaults {
  val defaultCoins: Int = 1280
  val defaultGems: Int = 96
  val defaultFragments: Int = 0

  val defaultWallet: PlayerWallet =
    PlayerWallet(coins = defaultCoins, gems = defaultGems, fragments = defaultFragments)

  val roleHomeCheckInPanelId: String = "player.home.checkIn"
}
