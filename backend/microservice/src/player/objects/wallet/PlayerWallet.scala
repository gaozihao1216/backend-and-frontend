package microservice.player.objects.wallet

/** 玩家钱包余额。 */
final case class PlayerWallet(
  coins: Int = 0,
  gems: Int = 0,
  fragments: Int = 0
)
