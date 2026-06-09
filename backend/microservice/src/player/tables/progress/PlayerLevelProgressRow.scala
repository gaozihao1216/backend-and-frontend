package microservice.player.tables.progress

final case class PlayerLevelProgressRow(
  userId: String,
  levelSuffix: String,
  clearedAt: String
)
