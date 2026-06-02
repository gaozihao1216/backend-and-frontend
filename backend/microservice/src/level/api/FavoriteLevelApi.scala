package microservice.level.api

final case class FavoriteLevelRequest(
  playerId: String,
  levelId: String
)

final case class GetFavoriteLevelsRequest(
  playerId: String
)

object GetFavoriteLevelsEndpoint {
  val name: String = "GetFavoriteLevels"
  val method: String = "GET"
  val path: String = "/player/favorites"
  val businessLogic: String =
    "返回玩家收藏且仍处于 published 的关卡列表。"
}

object FavoriteLevelEndpoint {
  val name: String = "FavoriteLevel"
  val method: String = "POST"
  val path: String = "/player/levels/:levelId/favorite"
  val businessLogic: String =
    "玩家收藏已发布关卡，重复收藏返回已有记录。"
}

object UnfavoriteLevelEndpoint {
  val name: String = "UnfavoriteLevel"
  val method: String = "DELETE"
  val path: String = "/player/levels/:levelId/favorite"
  val businessLogic: String =
    "玩家取消收藏已发布关卡。"
}
