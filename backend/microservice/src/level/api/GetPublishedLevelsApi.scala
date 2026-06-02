package microservice.level.api

import microservice.system.objects.LevelTag

final case class GetPublishedLevelsRequest(
  playerId: String,
  tag: Option[LevelTag],
  sort: String
)

object GetPublishedLevelsEndpoint {
  val name: String = "GetPublishedLevels"
  val method: String = "GET"
  val path: String = "/player/levels"
  val businessLogic: String =
    "返回 published 关卡列表，支持按 tag 过滤，并按 newest/highestRated/mostRated 排序。"
}
