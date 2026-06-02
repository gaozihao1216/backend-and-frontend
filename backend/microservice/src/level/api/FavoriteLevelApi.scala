package microservice.level.api

final case class FavoriteLevelRequest(
  playerId: String,
  levelId: String
)

object FavoriteLevelEndpoint {
  val name: String = "FavoriteLevel"
  val method: String = "POST"
  val path: String = "/player/levels/:levelId/favorite"
  val businessLogic: String =
    "玩家收藏已发布关卡，重复收藏返回已有记录。"
}
