package microservice.level.api

final case class GetPublishedLevelRequest(
  playerId: String,
  levelId: String
)

object GetPublishedLevelEndpoint {
  val name: String = "GetPublishedLevel"
  val method: String = "GET"
  val path: String = "/player/levels/:levelId"
  val businessLogic: String =
    "玩家只能读取已发布关卡；未发布关卡按 not found 处理。"
}
