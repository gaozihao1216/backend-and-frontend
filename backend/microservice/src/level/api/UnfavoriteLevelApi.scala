package microservice.level.api

final case class UnfavoriteLevelRequest(
  playerId: String,
  levelId: String
)

object UnfavoriteLevelEndpoint {
  val name: String = "UnfavoriteLevel"
  val method: String = "DELETE"
  val path: String = "/player/levels/:levelId/favorite"
  val businessLogic: String =
    "玩家取消收藏已发布关卡。"
}
