package microservice.level.api

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
