package microservice.level.api

final case class GetLevelCommentsRequest(
  playerId: String,
  levelId: String
)

object GetLevelCommentsEndpoint {
  val name: String = "GetLevelComments"
  val method: String = "GET"
  val path: String = "/player/levels/:levelId/comments"
  val businessLogic: String =
    "返回已发布关卡的评论，按创建时间倒序排列。"
}
