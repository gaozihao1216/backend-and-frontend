package microservice.player.tables

final case class PlayerLegacyCheckInRow(
  userId: String,
  status: String,
  updatedAt: String
)
