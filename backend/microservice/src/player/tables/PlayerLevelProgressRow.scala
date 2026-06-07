package microservice.player.tables

final case class PlayerLevelProgressRow(
  userId: String,
  levelSuffix: String,
  clearedAt: String
)
