package microservice.player.tables

final case class PlayerWalletRow(
  userId: String,
  coins: Int,
  gems: Int,
  fragments: Int,
  updatedAt: String
)
