package microservice.player.tables.preparation

final case class PlayerBirdUpgradeRow(
  userId: String,
  birdType: String,
  level: Int,
  tier: Int,
  updatedAt: String
)

final case class PlayerSlingshotUpgradeRow(
  userId: String,
  level: Int,
  updatedAt: String
)
