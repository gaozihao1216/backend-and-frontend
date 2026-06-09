package microservice.player.tables.progress

final case class PlayerLegacyCheckInRow(
  userId: String,
  status: String,
  updatedAt: String
)
